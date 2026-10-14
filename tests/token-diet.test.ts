import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { correlation, cost, kinds, median, medianRun, reveal, total } from '../src/lib/token-diet'
import type { Run, Tokens } from '../src/lib/token-diet'

const raw = readFileSync(new URL('../src/data/token-diet.json', import.meta.url), 'utf8')
const data = JSON.parse(raw) as { rates: Tokens; runs: Run[] }
const tokens = (cacheRead: number, cacheWrite: number, fresh: number, output: number): Tokens =>
  ({ cacheRead, cacheWrite, fresh, output })

describe('token diet math', () => {
  test('median handles odd, even and empty lists', () => {
    assert.equal(median([5, 1, 3]), 3)
    assert.equal(median([4, 1, 3, 2]), 2.5)
    assert.ok(Number.isNaN(median([])))
  })

  test('medianRun picks a real run, the lower middle for even counts', () => {
    const run = (id: string, cacheRead: number) => ({ id, totals: tokens(cacheRead, 0, 0, 0) })
    assert.equal(medianRun([run('a', 30), run('b', 10), run('c', 20)]).id, 'c')
    assert.equal(medianRun([run('a', 40), run('b', 10), run('c', 30), run('d', 20)]).id, 'd')
  })

  test('reveal walks calls in order and segments in kind order', () => {
    const calls = [tokens(100, 20, 5, 10), tokens(200, 0, 3, 7)]
    assert.deepEqual(reveal(calls, 0), { tokens: tokens(0, 0, 0, 0), calls: 0 })
    assert.deepEqual(reveal(calls, 110), { tokens: tokens(100, 10, 0, 0), calls: 1 })
    assert.deepEqual(reveal(calls, 135), { tokens: tokens(100, 20, 5, 10), calls: 1 })
    assert.deepEqual(reveal(calls, 136), { tokens: tokens(101, 20, 5, 10), calls: 2 })
    assert.deepEqual(reveal(calls, 1e9), { tokens: tokens(300, 20, 8, 17), calls: 2 })
  })

  test('correlation is 1 for a rising line and -1 for a falling one', () => {
    assert.equal(correlation([1, 2, 3], [10, 20, 30]), 1)
    assert.equal(correlation([1, 2, 3], [30, 20, 10]), -1)
  })
})

describe('token diet data', () => {
  test('has five runs of each setup', () => {
    assert.equal(data.runs.length, 25)
    for (const variant of 'abcde') assert.equal(data.runs.filter((run) => run.variant === variant).length, 5)
  })

  test('calls add up to the session totals and the recorded charge', () => {
    for (const run of data.runs) {
      for (const kind of kinds) {
        assert.equal(run.calls.reduce((sum, call) => sum + call[kind], 0), run.totals[kind], `${run.id} ${kind}`)
      }
      assert.equal(cost(run.totals, data.rates), run.nanoAiu, `${run.id} charge`)
    }
  })

  test('publishes no local paths or credentials', () => {
    for (const leak of ['/Users/', '/tmp/ws', '/private/', 'token-diet', 'gho_', 'ghp_', 'github_pat_']) {
      assert.ok(!raw.includes(leak), leak)
    }
  })

  test('still supports what the page says about it', () => {
    const setups = 'abcde'.split('').map((variant) => {
      const set = data.runs.filter((run) => run.variant === variant)
      const sizes = set.map((run) => total(run.totals))
      return {
        median: median(sizes),
        spread: Math.max(...sizes) - Math.min(...sizes),
        aiu: median(set.map((run) => run.nanoAiu)),
        aiuLow: Math.min(...set.map((run) => run.nanoAiu)),
        calls: median(set.map((run) => run.calls.length)),
        prose: median(set.map((run) => run.proseChars)),
        biggest: Math.max(...set.flatMap((run) => run.calls.flatMap((call) => call.tools.map((tool) => tool.outTokens)))),
        saved: median(set.map((run) => run.rtk?.saved ?? 0)),
      }
    })
    const [baseline, principles, caveman, rtk, all] = setups
    const runs = data.runs
    assert.ok(setups.slice(1).every((setup) => setup.median >= baseline.median), 'no setup beats the baseline median')
    const widestGap = Math.max(...setups.map((setup) => setup.median)) - Math.min(...setups.map((setup) => setup.median))
    assert.ok(setups.every((setup) => setup.spread > widestGap), 'spread inside each setup exceeds the gaps between them')
    assert.ok(correlation(runs.map((run) => run.calls.length), runs.map((run) => total(run.totals))) > 0.9, 'calls drive tokens')
    assert.ok(rtk.median > baseline.median && rtk.aiu === Math.min(...setups.map((setup) => setup.aiu)), 'rtk: more tokens, lowest AIU')
    assert.ok(rtk.aiu >= baseline.aiuLow, 'rtk AIU inside the baseline range')
    assert.equal(all.aiu, Math.max(...setups.map((setup) => setup.aiu)), 'all three: highest AIU')
    assert.ok(principles.calls > baseline.calls, 'principles did not cut calls')
    assert.ok(caveman.prose >= baseline.prose, 'caveman did not cut prose')
    assert.ok(rtk.biggest < baseline.biggest, 'largest tool result smaller with rtk')
    assert.ok(rtk.saved < median(runs.map((run) => total(run.calls[run.calls.length - 1]))), 'rtk saving below one late call')
    assert.equal(runs.reduce((sum, run) => sum + run.testRunsUnpiped, 0), 0, 'every test run was piped')
    assert.ok(runs.every((run) => !run.testsChanged), 'no run edited the tests')
    assert.ok(runs.every((run) => run.calls[0].cacheRead === runs[0].calls[0].cacheRead), 'same cached prefix for every run')
  })
})
