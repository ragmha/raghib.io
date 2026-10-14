import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { themeDiagram } from '../scripts/theme-diagrams.mjs'
import rehypeInlineDiagrams from '../src/lib/rehype-inline-diagrams.mjs'

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

test('inline diagrams retain alt text and do not replace responsive picture fallbacks', () => {
  const image = () => ({
    type: 'element', tagName: 'img',
    properties: { src: '/diagrams/dns-lookup-basics.svg', alt: 'DNS lookup', width: 1420, height: 560 },
    children: [],
  })
  const standalone = image()
  const nativeFallback = image()
  const mdxFallback = {
    type: 'mdxJsxFlowElement', name: 'img',
    attributes: Object.entries(image().properties).map(([name, value]) => ({ name, value: String(value) })),
    children: [],
  }
  const picture = { type: 'element', tagName: 'picture', properties: {}, children: [nativeFallback] }
  const mdxPicture = { type: 'mdxJsxFlowElement', name: 'picture', attributes: [], children: [mdxFallback] }
  const tree = { type: 'root', children: [standalone, picture, mdxPicture] }
  rehypeInlineDiagrams()(tree)
  assert.equal(tree.children[0].tagName, 'svg')
  assert.equal(tree.children[0].properties.ariaLabel, 'DNS lookup')
  assert.equal(tree.children[0].properties.role, 'img')
  assert.equal(picture.children[0], nativeFallback)
  assert.equal(mdxPicture.children[0], mdxFallback)
})
