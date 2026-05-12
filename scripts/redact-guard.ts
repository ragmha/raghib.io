#!/usr/bin/env tsx
/**
 * Layer 2 defence-in-depth scan.
 *
 * Walks the post-merge contents of src/data/steps.json and src/data/insights.json
 * and fails CI with a non-zero exit code if any forbidden key (PII, location,
 * sub-day timestamps, source identifiers) appears anywhere in the JSON tree.
 *
 * Run as the *last* step before commit — even if the schema parsers somehow
 * let something through, this guard prevents it from ever reaching disk in a
 * committed file.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { findForbiddenKeys } from '../src/lib/health/schema'

const TARGETS = [
  'src/data/steps.json',
  'src/data/insights.json',
]

function main(): void {
  let failures = 0
  for (const rel of TARGETS) {
    const path = join(process.cwd(), rel)
    if (!existsSync(path)) {
      console.error(`redact-guard: skipping missing file ${rel}`)
      continue
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(path, 'utf-8'))
    } catch (err) {
      console.error(`redact-guard: ${rel} is not valid JSON — ${(err as Error).message}`)
      failures += 1
      continue
    }
    const hits = findForbiddenKeys(parsed, `${rel}`)
    if (hits.length > 0) {
      failures += hits.length
      for (const hit of hits) {
        console.error(`redact-guard: forbidden key '${hit.key}' at ${hit.path}`)
      }
    } else {
      console.error(`redact-guard: ${rel} clean`)
    }
  }
  if (failures > 0) {
    console.error(`redact-guard: FAIL — ${failures} forbidden key(s) found`)
    process.exit(1)
  }
  console.error('redact-guard: all targets clean')
}

main()
