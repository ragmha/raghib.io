import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

const DISCLAIMER =
  '**Disclaimer:** I work at Microsoft. This is my personal view, based only on public information. It isn’t an official position or a product recommendation.'
// ponytail: keyword tripwire only; GitHub is excluded because it appears incidentally in most posts.
// The judgment calls (competitors, incidental mentions) live in .github/skills/employer-disclaimer.
const TRIGGER = /\b(microsoft|copilot|azure|openai|linkedin|vs ?code)\b/i

// Finnish translations keep the English disclaimer verbatim, so the same check applies.
for (const name of ['writing', 'writing-fi']) {
  const dir = new URL(`../src/content/${name}/`, import.meta.url)
  if (!existsSync(dir)) continue
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.mdx'))) {
    test(`${name}/${file} has the employer disclaimer when required, verbatim and first`, () => {
      const body = readFileSync(new URL(file, dir), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').trim()
      const hasDisclaimer = /^\*\*(Disclaimer|Disclosure):\*\*/m.test(body)

      if (TRIGGER.test(body)) assert.ok(hasDisclaimer, 'mentions a Microsoft-family product; add the disclaimer')
      if (hasDisclaimer) assert.ok(body.startsWith(DISCLAIMER + '\n'), 'disclaimer must be the first paragraph, verbatim')
    })
  }
}
