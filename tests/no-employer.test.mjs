import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

// Posts and project writeups are independent writing: no employer, employer product, or disclaimer.
// Code blocks and URLs are skipped so companion-repo links still work. File names are checked
// because a post's file name is its public URL.
const BANNED = /\b(microsoft|copilot|ghcp|azure|github|linkedin|vs ?code|work ?iq|decision-1|hydrafusion|openai|bing)\b/i

const prose = (text) => text
  .replace(/^```[\s\S]*?^```/gm, '')
  .replace(/\]\([^)]*\)/g, ']')
  .replace(/https?:\/\/\S+/g, '')

const content = (folder) => {
  const dir = new URL(`../src/content/${folder}/`, import.meta.url)
  return readdirSync(dir).filter((name) => /\.mdx?$/.test(name)).map((name) => [name, new URL(name, dir)])
}
const sources = [
  ...content('writing'),
  ...content('project-writeups'),
  ['flow-hero.mjs', new URL('../src/lib/flow-hero.mjs', import.meta.url)],
]

for (const [name, url] of sources) {
  test(`${name} names no employer or employer product`, () => {
    const text = `${name}\n${prose(readFileSync(url, 'utf8'))}`
    const hit = text.match(BANNED)
    assert.equal(hit?.[0], undefined, `remove "${hit?.[0]}"`)
    assert.doesNotMatch(text, /^\*\*(Disclaimer|Disclosure):\*\*/m, 'posts carry no employer disclaimer')
  })
}
