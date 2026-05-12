#!/usr/bin/env tsx
/**
 * Layer 2 — schema validation for an incoming repository_dispatch payload.
 *
 * Reads JSON from --input <file>, --json '<inline>' or stdin and writes a
 * normalised, allow-list-only array of step entries to stdout. Exits non-zero
 * on any malformed input. The orchestrator workflow pipes the result into
 * `merge-steps.ts`.
 */
import { readFileSync } from 'node:fs'
import { parseStepDay, type StepDay } from '../src/lib/health/schema'

function readInput(): string {
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      return readFileSync(args[i + 1], 'utf-8')
    }
    if (args[i] === '--json' && args[i + 1]) {
      return args[i + 1]
    }
  }
  // Fallback to stdin
  return readFileSync(0, 'utf-8')
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return [value]
}

function main(): void {
  const raw = readInput().trim()
  if (!raw) {
    console.error('validate-payload: empty input')
    process.exit(2)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error(`validate-payload: invalid JSON — ${(err as Error).message}`)
    process.exit(2)
  }

  // Accept either a single { date, steps } object or an array of them.
  // Also accept the dispatch envelope shape { client_payload: {...} } for
  // direct GitHub event piping convenience.
  let candidates: unknown[]
  if (parsed && typeof parsed === 'object' && 'client_payload' in (parsed as object)) {
    candidates = asArray((parsed as { client_payload: unknown }).client_payload)
  } else {
    candidates = asArray(parsed)
  }

  const out: StepDay[] = []
  for (const item of candidates) {
    out.push(parseStepDay(item)) // throws SchemaError → uncaught → exit 1
  }
  process.stdout.write(JSON.stringify(out))
}

try {
  main()
} catch (err) {
  console.error(`validate-payload: ${(err as Error).message}`)
  process.exit(1)
}
