import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { themeDiagram } from '../scripts/theme-diagrams.mjs'

test('SVG palettes follow the embedding page color scheme without changing masks', () => {
  const svg = '<svg><rect fill="#262a33"/><path stroke="#ff70b1"/><mask><rect fill="#fff"/><rect fill="#000"/><rect fill="#ffffff"/></mask></svg>'
  const result = themeDiagram(svg)
  assert.match(result, /fill="var\(--diagram-paper, #ffffff\)"/)
  assert.match(result, /stroke="var\(--diagram-pink, #aa2865\)"/)
  assert.match(result, /@media\(prefers-color-scheme:dark\)/)
  assert.match(result, /--diagram-paper:#000000/)
  assert.match(result, /<mask><rect fill="#fff"\/><rect fill="#000"\/><rect fill="#ffffff"\/><\/mask>/)
  assert.equal(themeDiagram(result), result)
})

test('all published SVG diagrams include both palettes and retain accessible metadata', () => {
  const directory = new URL('../public/diagrams/', import.meta.url)
  for (const name of readdirSync(directory).filter(name => name.endsWith('.svg'))) {
    const svg = readFileSync(new URL(name, directory), 'utf8')
    assert.match(svg, /id="diagram-theme"/, name)
    assert.match(svg, /--diagram-paper:#ffffff/, name)
    assert.match(svg, /--diagram-paper:#000000/, name)
    assert.match(svg, /<title\b/, name)
    assert.match(svg, /<desc\b/, name)
  }
})

test('decision patterns use the same semantic accents as the other decision diagrams', () => {
  const svg = readFileSync(new URL('../public/diagrams/decision-patterns.svg', import.meta.url), 'utf8')
  for (const color of ['green-ink', 'ochre-ink', 'red-ink']) {
    assert.match(svg, new RegExp(`(?:fill|stroke)="var\\(--diagram-${color},`))
  }
  assert.doesNotMatch(svg, /(?:fill|stroke)="var\(--diagram-(?:blue|pink|orange),/)

  const source = JSON.parse(readFileSync(
    new URL('../src/assets/diagrams/decision-patterns.excalidraw', import.meta.url), 'utf8',
  ))
  const strokes = source.elements.filter(element => !element.isDeleted).map(element => element.strokeColor)
  for (const color of ['#47603e', '#816121', '#9b493e']) assert.ok(strokes.includes(color))
  for (const color of ['#91adc9', '#ff70b1', '#f08022']) assert.ok(!strokes.includes(color))
})
