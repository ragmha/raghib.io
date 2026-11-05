import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

// Rules from .agents/skills/post-layout.
const MAX_CODE_LINES = 150
const DIAGRAM = /^\s*```mermaid|\/diagrams\/[\w-]+\.svg/m
const MERMAID = /^\s*```mermaid\r?\n([\s\S]*?)^\s*```/gm
const PORTRAIT_MAX_WIDTH = 456
const PORTRAIT_MIN_FONT = 24

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
const diagrams = new URL('../public/diagrams/', import.meta.url)
const excalidrawSources = new URL('../src/assets/diagrams/', import.meta.url)

for (const file of readdirSync(dir).filter(name => name.endsWith('.mdx'))) {
  test(`${file} has a diagram and keeps long code in a companion repo`, () => {
    const source = readFileSync(new URL(file, dir), 'utf8')
    const lines = codeLines(source)

    assert.match(source, DIAGRAM, 'add a Mermaid or Excalidraw diagram')
    assert.ok(lines <= MAX_CODE_LINES, `${lines} code lines; move the runnable project to a companion repository`)
  })

  test(`${file} diagrams have text alternatives and stay readable on phones`, () => {
    const source = readFileSync(new URL(file, dir), 'utf8')

    // The site theme styles only flowcharts; accTitle and accDescr name the SVG for screen readers.
    for (const [, block] of source.matchAll(MERMAID)) {
      assert.match(block, /^\s*flowchart\b/, 'use a Mermaid flowchart')
      assert.match(block, /^\s*accTitle:/m, 'add accTitle to the Mermaid diagram')
      assert.match(block, /^\s*accDescr\s*[:{]/m, 'add accDescr to the Mermaid diagram')
    }

    // Below 60rem an Excalidraw diagram switches to a narrow portrait export with large text.
    const portraits = new Set([...source.matchAll(/<source\b[^>]*>/g)]
      .filter(([tag]) => tag.includes('media="(max-width: 60rem)"'))
      .flatMap(([tag]) => [...tag.matchAll(/\/diagrams\/([\w-]+)\.svg/g)].map(([, name]) => name)))
    for (const name of new Set([...source.matchAll(/\/diagrams\/([\w-]+)\.svg/g)].map(([, name]) => name))) {
      if (name.endsWith('-portrait') || !existsSync(new URL(`${name}.excalidraw`, excalidrawSources))) continue
      assert.ok(portraits.has(`${name}-portrait`), `serve ${name}-portrait.svg from <source media="(max-width: 60rem)">`)
      const svg = readFileSync(new URL(`${name}-portrait.svg`, diagrams), 'utf8')
      const width = Number(svg.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/)[1])
      const font = Math.min(...[...svg.matchAll(/font-size="([\d.]+)px"/g)].map(([, size]) => Number(size)))
      assert.ok(width <= PORTRAIT_MAX_WIDTH, `${name}-portrait is ${width}px wide; keep it to ${PORTRAIT_MAX_WIDTH}`)
      assert.ok(font >= PORTRAIT_MIN_FONT, `${name}-portrait has ${font}px text; use at least ${PORTRAIT_MIN_FONT}`)
    }
  })
}
