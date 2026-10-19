import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { flowHeroes, flowHeroSvg } from '../src/lib/flow-hero.mjs'

const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

test('every post opens with a known Anatomy hero', () => {
  const names = new Set(['decision', ...Object.keys(flowHeroes)])
  const dir = new URL('../src/content/writing/', import.meta.url)
  for (const file of readdirSync(dir).filter(name => /\.mdx?$/.test(name))) {
    const hero = readFileSync(new URL(file, dir), 'utf8').match(/^hero:\s*"?([\w-]+)"?\s*$/m)?.[1]
    assert.ok(names.has(hero), `${file} declares a hero (got ${hero})`)
  }
})

test('every flow hero draws its own machine', () => {
  const arts = Object.values(flowHeroes).map(hero => hero.art)
  assert.equal(new Set(arts).size, arts.length, 'No two posts share a scene')
})

for (const [name, hero] of Object.entries(flowHeroes)) {
  test(`${name} flow hero is a labeled, valid illustration`, () => {
    const svg = flowHeroSvg(hero)
    assert.ok(svg.includes(`role="img" aria-label="${escapeXml(hero.label)}"`), 'SVG has its accessible description')
    assert.ok((svg.match(/class="decision-hero-annotation"/g) ?? []).length >= 2, 'Machine parts are annotated')
    assert.ok(hero.outputs.length > 0, 'Mobile routes summarize the outcomes')
    assert.equal(hero.thesis.length, 2, 'Caption has a two-line thesis')
    assert.ok(hero.note, 'Caption has a note')
    assert.ok(!/NaN|undefined|Infinity|<script/.test(svg), 'SVG has no invalid output')
    const [, , width, height] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
    for (const [, x, y, anchor, text] of svg.matchAll(/class="decision-hero-label"[^>]*translate\((-?[\d.]+) (-?[\d.]+)\)"><text text-anchor="(\w+)">([^<]*)</g)) {
      // 14px JetBrains Mono with .05em tracking is about 9.1px a character.
      const length = text.replaceAll(/&\w+;/g, '_').length * 9.1
      const left = +x - length * { start: 0, middle: 0.5, end: 1 }[anchor]
      assert.ok(left >= 0 && +y >= 11 && left + length <= width && +y + 4 <= height, `"${text}" stays inside the frame`)
    }
  })
}
