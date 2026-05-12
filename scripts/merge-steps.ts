#!/usr/bin/env tsx
/**
 * Idempotent merge of new step entries into src/data/steps.json.
 *
 * Modes:
 *   --mode=daily     Latest entry for a given date wins (default; daily ingest)
 *   --mode=backfill  Existing entries are preserved; only fills gaps
 *
 * Usage:
 *   echo '[{"date":"2024-05-01","steps":1234}]' | tsx scripts/merge-steps.ts
 *   tsx scripts/merge-steps.ts --input new.json --mode=backfill
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseStepDay,
  parseStepsFile,
  type StepDay,
  type StepsFile,
} from '../src/lib/health/schema'

const STEPS_PATH = join(process.cwd(), 'src/data/steps.json')

interface Args {
  mode: 'daily' | 'backfill'
  inputJson: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  let mode: Args['mode'] = 'daily'
  let inputJson = ''

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a.startsWith('--mode=')) {
      const v = a.slice('--mode='.length)
      if (v !== 'daily' && v !== 'backfill') {
        throw new Error(`invalid --mode: ${v}`)
      }
      mode = v
    } else if (a === '--input' && args[i + 1]) {
      inputJson = readFileSync(args[++i], 'utf-8')
    } else if (a === '--json' && args[i + 1]) {
      inputJson = args[++i]
    }
  }
  if (!inputJson) inputJson = readFileSync(0, 'utf-8')
  return { mode, inputJson }
}

function loadExisting(): StepsFile {
  if (!existsSync(STEPS_PATH)) {
    return { updatedAt: new Date(0).toISOString(), days: [] }
  }
  const raw = JSON.parse(readFileSync(STEPS_PATH, 'utf-8'))
  return parseStepsFile(raw)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value]
}

function merge(existing: StepDay[], incoming: StepDay[], mode: Args['mode']): StepDay[] {
  const map = new Map<string, number>()
  for (const d of existing) map.set(d.date, d.steps)
  for (const d of incoming) {
    if (mode === 'backfill' && map.has(d.date)) continue
    map.set(d.date, d.steps)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, steps]) => ({ date, steps }))
}

function main(): void {
  const args = parseArgs()
  const incomingRaw = JSON.parse(args.inputJson.trim())
  const incoming: StepDay[] = asArray(incomingRaw).map(parseStepDay)
  const existing = loadExisting()
  const merged = merge(existing.days, incoming, args.mode)

  // Short-circuit if nothing actually changed (avoids empty PRs).
  const sameLength = merged.length === existing.days.length
  const sameContents =
    sameLength &&
    merged.every(
      (d, i) =>
        existing.days[i].date === d.date && existing.days[i].steps === d.steps
    )
  if (sameContents) {
    console.error(`merge-steps: no changes (${existing.days.length} days)`)
    return
  }

  const next: StepsFile = {
    updatedAt: new Date().toISOString(),
    days: merged,
  }
  writeFileSync(STEPS_PATH, JSON.stringify(next, null, 2) + '\n')
  console.error(
    `merge-steps: wrote ${merged.length} days (was ${existing.days.length}) in ${args.mode} mode`
  )
}

try {
  main()
} catch (err) {
  console.error(`merge-steps: ${(err as Error).message}`)
  process.exit(1)
}
