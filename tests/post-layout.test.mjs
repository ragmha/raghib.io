import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

// Rules from .agents/skills/post-layout.
const MAX_CODE_LINES = 150
// ponytail: a post written before this rule. Remove it once its code moves to a companion repository.
const LONG_CODE_YET = new Set(['build-your-agent-harness.mdx'])

const codeLines = source => {
  let fence = null
  let count = 0
  for (const line of source.split('\n')) {
    const open = line.match(/^\s*```(\w*)/)
    if (open) fence = fence === null ? open[1] : null
    else if (fence !== null && fence !== 'mermaid') count++
  }
  return count
}

const dir = new URL('../src/content/writing/', import.meta.url)
const assertCodeLimit = (source, file) => {
  const lines = codeLines(source)
  if (LONG_CODE_YET.has(file)) assert.ok(lines > MAX_CODE_LINES, 'within the limit now; remove it from LONG_CODE_YET')
  else assert.ok(lines <= MAX_CODE_LINES, `${lines} code lines; move the runnable project to a companion repository`)
}

test('a plain post without a hero or diagram is allowed', () => {
  const source = `---
title: "A plain essay"
---

A short essay with no visuals.
`
  assert.doesNotThrow(() => assertCodeLimit(source, 'plain.mdx'))
})

for (const file of readdirSync(dir).filter(name => name.endsWith('.mdx'))) {
  test(`${file} keeps tutorial code within the companion-repository limit`, () => {
    const source = readFileSync(new URL(file, dir), 'utf8')
    assertCodeLimit(source, file)
  })
}
