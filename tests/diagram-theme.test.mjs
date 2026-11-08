import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { themeDiagram } from '../scripts/theme-diagrams.mjs'
import rehypeInlineDiagrams from '../src/lib/rehype-inline-diagrams.mjs'

test('SVG palettes follow the embedding page color scheme without changing masks', () => {
  const svg = '<svg><rect fill="#262a33"/><path stroke="#ff70b1"/><mask><rect fill="#fff"/><rect fill="#000"/><rect fill="#000000"/><rect fill="#ffffff"/></mask></svg>'
  const result = themeDiagram(svg)
  assert.match(result, /fill="var\(--diagram-paper, #ffffff\)"/)
  assert.match(result, /stroke="var\(--diagram-pink, #aa2865\)"/)
  assert.match(result, /@media\(prefers-color-scheme:dark\)/)
  assert.match(result, /--diagram-paper:#000000/)
  assert.match(result, /<mask><rect fill="#fff"\/><rect fill="#000"\/><rect fill="#000000"\/><rect fill="#ffffff"\/><\/mask>/)
  assert.equal(themeDiagram(result), result)
})

test('Excalidraw ink and highlights adapt together for readable dark diagrams', () => {
  const svg = '<svg><rect fill="#e9f56c"/><path stroke="#111111"/><text fill="#000000">Approved models</text></svg>'
  const result = themeDiagram(svg)
  assert.match(result, /fill="var\(--diagram-ochre-surface, #f4e9c7\)"/)
  assert.match(result, /stroke="var\(--diagram-ink, #0d0d0d\)"/)
  assert.match(result, /<text fill="var\(--diagram-ink, #0d0d0d\)">/)
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

test('inline diagrams retain alt text', () => {
  const tree = { type: 'root', children: [{
    type: 'element', tagName: 'img',
    properties: { src: '/diagrams/dns-lookup-basics.svg', alt: 'DNS lookup', width: 1420, height: 560 },
    children: [],
  }] }
  rehypeInlineDiagrams()(tree)
  assert.equal(tree.children[0].tagName, 'svg')
  assert.equal(tree.children[0].properties.ariaLabel, 'DNS lookup')
  assert.equal(tree.children[0].properties.role, 'img')
})

// Safari draws an <img> SVG in the OS palette, so a pair must be inlined to follow the site toggle.
test('responsive picture pairs become inline portrait and landscape SVGs', () => {
  const mdx = (name, attributes) => ({
    type: 'mdxJsxFlowElement', name, children: [],
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
  })
  const picture = {
    type: 'mdxJsxFlowElement', name: 'picture', attributes: [],
    children: [
      mdx('source', { media: '(max-width: 60rem)', srcSet: '/diagrams/friday-release-alert-portrait.svg', width: '456', height: '806' }),
      mdx('img', { src: '/diagrams/friday-release-alert.svg', alt: 'Release alert', width: '956', height: '540' }),
    ],
  }
  const tree = { type: 'root', children: [picture] }
  rehypeInlineDiagrams()(tree)
  const [wrapper] = tree.children
  assert.deepEqual(wrapper.properties.className, ['diagram-variants'])
  const [portrait, landscape] = wrapper.children
  assert.deepEqual(portrait.properties.className, ['diagram-portrait'])
  assert.equal(portrait.properties.dataSource, '/diagrams/friday-release-alert-portrait.svg')
  assert.deepEqual(landscape.properties.className, ['diagram-landscape'])
  for (const svg of [portrait, landscape]) {
    assert.equal(svg.tagName, 'svg')
    assert.equal(svg.properties.ariaLabel, 'Release alert')
  }

  const wrongMedia = structuredClone(picture)
  wrongMedia.children[0].attributes[0].value = '(max-width: 40rem)'
  assert.throws(() => rehypeInlineDiagrams()({ type: 'root', children: [wrongMedia] }), /media/)
})
