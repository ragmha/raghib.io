import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

const DISCLAIMER =
  '**Disclaimer:** I work at Microsoft. This is my personal view, based only on public information. It isn’t an official position or a product recommendation.'
// ponytail: keyword tripwire only; GitHub is excluded because it appears incidentally in most posts.
// The judgment calls (competitors, incidental mentions) live in .github/skills/employer-disclaimer.
const TRIGGER = /\b(microsoft|copilot|azure|openai|linkedin|vs ?code)\b/i

const dir = new URL('../src/content/writing/', import.meta.url)

for (const file of readdirSync(dir).filter((name) => name.endsWith('.mdx'))) {
  test(`${file} has the employer disclaimer when required, verbatim and first`, () => {
    const body = readFileSync(new URL(file, dir), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    const hasDisclaimer = /^\*\*(Disclaimer|Disclosure):\*\*/m.test(body)

    if (TRIGGER.test(body)) assert.ok(hasDisclaimer, 'mentions a Microsoft-family product; add the disclaimer')
    if (hasDisclaimer) assert.ok(body.startsWith(DISCLAIMER + '\n'), 'disclaimer must be the first paragraph, verbatim')
  })
}
