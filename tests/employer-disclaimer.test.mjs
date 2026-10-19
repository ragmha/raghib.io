import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import rehypeEmployerDisclaimer from '../src/lib/rehype-employer-disclaimer.mjs'

const DISCLAIMER =
  '**Disclaimer:** I work at Microsoft. This is my personal view, based only on public information. It isn’t an official position or a product recommendation.'
// ponytail: keyword tripwire only; GitHub is excluded because it appears incidentally in most posts.
// The judgment calls (competitors, incidental mentions) live in .agents/skills/employer-disclaimer.
const TRIGGER = /\b(microsoft|copilot|azure|openai|linkedin|vs ?code)\b/i

const dir = new URL('../src/content/writing/', import.meta.url)

test('only the opening disclaimer becomes a note, preserving its text and existing attributes', () => {
  const disclaimer = {
    type: 'element', tagName: 'p', properties: { id: 'disclaimer', className: ['existing'] },
    children: [
      {
        type: 'element', tagName: 'strong', properties: {},
        children: [{ type: 'text', value: 'Disclaimer:' }],
      },
      { type: 'text', value: DISCLAIMER.slice('**Disclaimer:**'.length) },
    ],
  }
  const tree = {
    type: 'root',
    children: [{ type: 'text', value: '\n' }, structuredClone(disclaimer)],
  }
  rehypeEmployerDisclaimer()(tree)
  assert.equal(tree.children.length, 2)
  assert.equal(tree.children[1].tagName, 'p')
  assert.deepEqual(tree.children[1].children, disclaimer.children)
  assert.deepEqual(tree.children[1].properties, {
    id: 'disclaimer', className: ['existing', 'employer-disclaimer'], role: 'note',
  })

  const ordinary = structuredClone(disclaimer)
  ordinary.children[0].children[0].value = 'Important:'
  for (const children of [
    [],
    [ordinary, disclaimer],
    [{ type: 'element', tagName: 'h2', properties: {}, children: [] }, disclaimer],
    [{ type: 'element', tagName: 'blockquote', properties: {}, children: [disclaimer] }],
    [{ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'An ordinary opening.' }] }],
  ]) {
    const untouched = { type: 'root', children: structuredClone(children) }
    const before = structuredClone(untouched)
    rehypeEmployerDisclaimer()(untouched)
    assert.deepEqual(untouched, before)
  }
})

for (const file of readdirSync(dir).filter((name) => name.endsWith('.mdx'))) {
  test(`${file} has the employer disclaimer when required, verbatim and first`, () => {
    const body = readFileSync(new URL(file, dir), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    const hasDisclaimer = /^\*\*(Disclaimer|Disclosure):\*\*/m.test(body)

    if (TRIGGER.test(body)) assert.ok(hasDisclaimer, 'mentions a Microsoft-family product; add the disclaimer')
    if (hasDisclaimer) assert.ok(body.startsWith(DISCLAIMER + '\n'), 'disclaimer must be the first paragraph, verbatim')
  })
}
