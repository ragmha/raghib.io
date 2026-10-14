import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { analyzeUsage, demoEvents, estimateCost, findings, manualUsage, parseTokenInput, parseUsage } from '../src/lib/agent-usage'
import type { Usage } from '../src/lib/agent-usage'
import { findModelPrice } from '../src/lib/model-pricing'

describe('agent usage analysis', () => {
  test('parses recorded usage and avoids adding shutdown snapshots to call detail', () => {
    const imported = parseUsage(JSON.stringify([
      { type: 'session.start', data: { sessionId: 'session-1' } },
      {
        id: 'call-1',
        type: 'assistant.usage',
        timestamp: '2026-10-09T12:00:00Z',
        data: {
          model: 'claude-sonnet-5.5',
          inputTokens: 1000,
          cacheReadTokens: 200,
          cacheWriteTokens: 100,
          outputTokens: 300,
          reasoningTokens: 50,
          copilotUsage: { totalNanoAiu: 42 },
        },
      },
      {
        id: 'shutdown-1',
        type: 'session.shutdown',
        timestamp: '2026-10-09T12:05:00Z',
        data: {
          modelMetrics: {
            'claude-sonnet-5.5': {
              usage: {
                inputTokens: 1000,
                cacheReadTokens: 200,
                cacheWriteTokens: 100,
                outputTokens: 300,
                reasoningTokens: 50,
              },
              totalNanoAiu: 42,
              requests: { count: 1, cost: 1 },
            },
          },
        },
      },
    ]))
    const analysis = analyzeUsage([imported])
    assert.equal(analysis.sessions, 1)
    assert.equal(analysis.workload.length, 1)
    assert.equal(analysis.workload[0].kind, 'snapshot')
    assert.equal(analysis.totals.input.value, 1000)
    assert.equal(analysis.totals.nanoAiu.value, 42)
    assert.match(analysis.coverage, /Shutdown totals/)
    assert.ok(analysis.warnings.some((warning) => warning.includes('not additional usage')))
  })

  test('prices cached and uncached tokens, supports shorthand, and rejects incomplete records', () => {
    assert.equal(parseTokenInput('1.5M'), 1_500_000)
    assert.equal(parseTokenInput('250k'), 250_000)
    assert.throws(() => parseTokenInput('-1'), /nonnegative token count/)

    const price = findModelPrice('claude-sonnet-5.5')
    assert.ok(price)
    const record = manualUsage('claude-sonnet-5.5', 10_000, 20_000, 5_000, 2_000)
    assert.equal(estimateCost([record], price).low, 0.0545)
    const incomplete: Usage = { ...record, write: null }
    assert.match(estimateCost([incomplete], price).reason ?? '', /must all be reported/)
  })

  test('parses Codex per-call usage once and keeps cached input inside input', () => {
    const totalA = { total_tokens: 1100 }
    const imported = parseUsage([
      { type: 'session_meta', payload: { id: 'codex-1' } },
      { type: 'turn_context', payload: { model: 'gpt-5.5' } },
      { type: 'response_item', payload: { type: 'function_call', call_id: 'call-1', name: 'exec_command' } },
      { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: totalA, last_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100, reasoning_output_tokens: 40 } } } },
      { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: totalA, last_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100 } } } },
    ].map((line) => JSON.stringify(line)).join('\n'))
    const analysis = analyzeUsage([imported])
    assert.deepEqual(analysis.sources, ['Codex CLI'])
    assert.equal(analysis.workload.length, 1)
    assert.equal(analysis.workload[0].model, 'gpt-5.5')
    assert.equal(analysis.totals.input.value, 1000)
    assert.equal(analysis.totals.read.value, 600)
    assert.equal(analysis.totals.write.value, 0)
    assert.deepEqual(analysis.tools, [{ name: 'exec_command', count: 1, failed: 0 }])
  })

  test('normalizes Claude Code usage and keeps the final line for a streamed message', () => {
    const line = (output_tokens: number) => ({
      type: 'assistant', sessionId: 'claude-1', timestamp: '2026-10-09T12:00:00Z',
      message: {
        id: 'msg-1', model: 'claude-opus-5',
        usage: { input_tokens: 10, cache_read_input_tokens: 200, cache_creation_input_tokens: 30, output_tokens },
        content: [{ type: 'tool_use', id: 'tool-1', name: 'Bash' }],
      },
    })
    const imported = parseUsage([
      line(1), line(80),
      { type: 'user', sessionId: 'claude-1', message: { content: [{ type: 'tool_result', tool_use_id: 'tool-1', is_error: true }] } },
    ].map((item) => JSON.stringify(item)).join('\n'))
    const analysis = analyzeUsage([imported])
    assert.deepEqual(analysis.sources, ['Claude Code'])
    assert.equal(analysis.workload.length, 1)
    assert.equal(analysis.totals.input.value, 240)
    assert.equal(analysis.totals.output.value, 80)
    assert.deepEqual(analysis.tools, [{ name: 'Bash', count: 1, failed: 1 }])
    assert.ok(Math.abs(estimateCost(analysis.workload, findModelPrice('claude-opus-5')).low! - 0.0023375) < 1e-12)
  })

  test('prices Claude Code 5-minute and 1-hour cache writes separately', () => {
    const imported = parseUsage(JSON.stringify({
      type: 'assistant',
      sessionId: 'claude-cache-tiers',
      timestamp: '2026-10-09T12:00:00Z',
      message: {
        id: 'msg-cache-tiers',
        model: 'claude-sonnet-5.5',
        usage: {
          input_tokens: 10,
          cache_read_input_tokens: 5,
          cache_creation_input_tokens: 30,
          cache_creation: {
            ephemeral_5m_input_tokens: 20,
            ephemeral_1h_input_tokens: 10,
          },
          output_tokens: 1,
        },
      },
    }))
    const analysis = analyzeUsage([imported])
    const record = analysis.workload[0]
    assert.equal(record.cacheWrite5m, 20)
    assert.equal(record.cacheWrite1h, 10)
    assert.equal(estimateCost([record], findModelPrice('claude-sonnet-5.5')).low, 0.0001205)
  })

  test('shows a range when cache-write TTL is unknown', () => {
    const record = manualUsage('claude-sonnet-5.5', 0, 0, 100, 0)
    const estimate = estimateCost([record], findModelPrice('claude-sonnet-5.5'))
    assert.equal(estimate.low, 0.00025)
    assert.equal(estimate.high, 0.0004)
    assert.match(estimate.reason ?? '', /cache-write TTL/)
  })

  test('prices unknown-TTL, 5-minute, and 1-hour cache writes together', () => {
    const record = manualUsage('claude-sonnet-5.5', 40, 10, 30, 1, 20, 10)
    const estimate = estimateCost([record], findModelPrice('claude-sonnet-5.5'))
    assert.ok(Math.abs(estimate.low! - 0.000256) < 1e-12)
    assert.ok(Math.abs(estimate.high! - 0.000301) < 1e-12)
  })

  test('prices aggregate snapshots as a short- to long-context range', () => {
    const record: Usage = { ...manualUsage('gpt-6-astra', 1_000_000, 0, 0, 100_000), kind: 'snapshot' }
    const estimate = estimateCost([record], findModelPrice('gpt-6-astra'))
    assert.equal(estimate.low, 15)
    assert.equal(estimate.high, 27.5)
    assert.match(estimate.reason ?? '', /long-context/)
  })

  test('includes official peak and off-peak pricing tiers in the estimate range', () => {
    const record = manualUsage('deepseek-v4-pro', 0, 100_000, 0, 0)
    const estimate = estimateCost([record], findModelPrice('deepseek-v4-pro'))
    assert.equal(estimate.low, 0.0022)
    assert.equal(estimate.high, 0.0044)
    assert.match(estimate.reason ?? '', /time-based pricing/)
  })

  test('uses provider-published rates and metadata for cross-provider comparisons', () => {
    assert.equal(findModelPrice('gpt-6-luna')?.provider, 'OpenAI')
    assert.equal(findModelPrice('deepseek-v4-pro')?.provider, 'DeepSeek')
    assert.equal(findModelPrice('kimi-k3')?.provider, 'Moonshot AI')
    assert.equal(findModelPrice('glm-5.3-flash')?.provider, 'Z.AI')
    assert.ok(findModelPrice('claude-opus-5.5')?.source.includes('claude'))
  })

  test('demo covers all supported agent logs', () => {
    const analysis = analyzeUsage([parseUsage(demoEvents)])
    assert.deepEqual(analysis.sources, ['GitHub Copilot CLI', 'Codex CLI', 'Claude Code'])
    assert.equal(analysis.sessions, 3)
    assert.equal(analysis.calls.length, 10)
  })

  test('summarizes how the model was used in plain language', () => {
    const notes = findings(analyzeUsage([parseUsage(demoEvents)]))
    assert.ok(notes.some((note) => /from cache|served from cache/.test(note)))
    assert.ok(notes.some((note) => /input tokens for every token it wrote/.test(note)))
    assert.ok(notes.some((note) => /Context peaked at .* on call \d+ of 10/.test(note)))
    assert.ok(notes.some((note) => /models were used/.test(note)))
  })
})
