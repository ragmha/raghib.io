import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'

const names = [
  'copilot-budget-and-model-access',
  'copilot-credit-journey',
  'copilot-additive-model-access',
]
const variants = names.flatMap(name => [name, `${name}-portrait`])
const draft = readFileSync(
  new URL('../src/content/writing/keep-shipping-copilot-budget-limits-part-1.mdx', import.meta.url),
  'utf8',
)

test('concept diagrams have editable, visible source elements and static accessible SVG exports', () => {
  for (const name of variants) {
    const source = JSON.parse(readFileSync(
      new URL(`../src/assets/diagrams/${name}.excalidraw`, import.meta.url), 'utf8',
    ))
    const svg = readFileSync(new URL(`../public/diagrams/${name}.svg`, import.meta.url), 'utf8')
    assert.equal(source.type, 'excalidraw')
    assert.equal(source.version, 2)
    assert.equal(new Set(source.elements.map(({ id }) => id)).size, source.elements.length)
    assert.ok(source.elements.length > 0)
    for (const element of source.elements) {
      assert.ok(Number.isFinite(element.x) && Number.isFinite(element.y))
      if (element.type === 'text') {
        assert.ok(element.width > 0 && element.height > 0)
        assert.equal(element.strokeColor.toLowerCase(), '#000000')
        if (element.containerId) {
          const container = source.elements.find(({ id }) => id === element.containerId)
          assert.ok(container?.boundElements.some(({ id }) => id === element.id))
        }
      }
    }
    assert.match(svg, /role="img"/)
    assert.match(svg, /aria-labelledby=/)
    assert.match(svg, /<title\b/)
    assert.match(svg, /<desc\b/)
    assert.doesNotMatch(svg, /<script\b/i)
    assert.doesNotMatch(svg, /https?:\/\/[^"'\s]+\.woff2/)
    assert.equal(existsSync(new URL(`../public/diagrams/${name}.excalidraw`, import.meta.url)), false)
  }
})

test('the article embeds each concept with matching dimensions and an accessible full-size link', () => {
  assert.equal((draft.match(/<figure class="excalidraw-figure responsive-diagram">/g) ?? []).length, names.length)
  for (const name of names) {
    const svg = readFileSync(new URL(`../public/diagrams/${name}.svg`, import.meta.url), 'utf8')
    const root = svg.match(/<svg\b[^>]+>/)?.[0] ?? ''
    const width = root.match(/\bwidth="([^"]+)"/)?.[1]
    const height = root.match(/\bheight="([^"]+)"/)?.[1]
    assert.ok(Number(width) > 0 && Number(height) > 0)
    const image = draft.match(new RegExp(`<img\\s+src="/diagrams/${name}\\.svg"[\\s\\S]*?/>`))?.[0] ?? ''
    assert.ok(image.includes(`width="${width}"`))
    assert.ok(image.includes(`height="${height}"`))
    assert.match(image, /alt="[^"]{40,}"/)
    if (name === names[0]) {
      assert.match(image, /loading="eager"/)
      assert.match(image, /fetchpriority="high"/)
    } else {
      assert.match(image, /loading="lazy"/)
    }
    assert.ok(draft.includes(`href="/diagrams/${name}.svg"`))
  }
})

test('portrait diagrams are art-directed without changing their model or budget facts', () => {
  const readSource = name => JSON.parse(readFileSync(
    new URL(`../src/assets/diagrams/${name}.excalidraw`, import.meta.url), 'utf8',
  ))
  const labels = scene => new Map(
    scene.elements
      .filter(element => element.type === 'text' && (element.containerId || element.customData?.copyId))
      .map(element => [element.containerId ?? element.customData.copyId, element.text.replace(/\s+/g, ' ').trim()]),
  )
  for (const name of names) {
    const wideLabels = labels(readSource(name))
    const portrait = readSource(`${name}-portrait`)
    for (const [containerId, label] of labels(portrait)) {
      if (containerId === 'both-required') continue
      assert.equal(label, wideLabels.get(containerId), `${name}: ${containerId}`)
    }
    const svg = readFileSync(
      new URL(`../public/diagrams/${name}-portrait.svg`, import.meta.url), 'utf8',
    )
    const root = svg.match(/<svg\b[^>]+>/)?.[0] ?? ''
    const width = Number(root.match(/\bwidth="([^"]+)"/)?.[1])
    const height = Number(root.match(/\bheight="([^"]+)"/)?.[1])
    assert.ok(height > width)
    for (const text of portrait.elements.filter(element => element.type === 'text')) {
      assert.ok(text.fontSize * 280 / width >= 16, `${name}: phone text too small`)
    }
    const source = draft.match(new RegExp(
      `<source\\s+media="\\(max-width: 60rem\\)"\\s+srcSet="/diagrams/${name}-portrait\\.svg"[\\s\\S]*?/>`,
    ))?.[0] ?? ''
    assert.ok(source.includes(`width="${width}"`))
    assert.ok(source.includes(`height="${height}"`))
  }
})

test('the credit illustration uses an original open office scene with no card panels', () => {
  for (const name of ['copilot-credit-journey', 'copilot-credit-journey-portrait']) {
    const scene = JSON.parse(readFileSync(
      new URL(`../src/assets/diagrams/${name}.excalidraw`, import.meta.url), 'utf8',
    ))
    const figures = scene.elements.filter(element => element.customData?.actorRole)
    assert.ok(figures.length >= 12)
    assert.deepEqual(new Set(figures.map(element => element.customData.actorRole)),
      new Set(['ghcp-user', 'gh-admin']))
    assert.deepEqual(new Set(figures.map(element => element.customData.actorId)),
      new Set(['ghcp-user', 'gh-admin']))
    for (const [actorId, identity, cues] of [
      ['ghcp-user', 'casual-user', ['casual-clothing', 'headphones']],
      ['gh-admin', 'policy-admin', ['glasses', 'id-badge', 'policy-clipboard']],
    ]) {
      const actor = figures.filter(element => element.customData.actorId === actorId)
      assert.ok(actor.every(element => element.customData.visualIdentity === identity))
      assert.deepEqual(
        [...new Set(actor.map(element => element.customData.personaCue).filter(Boolean))].sort(),
        cues,
      )
    }
    for (const figure of figures) {
      assert.equal(figure.customData.illustrationOrigin, 'original')
      assert.equal(figure.customData.libraryElementId, undefined)
      assert.equal(figure.strokeColor, '#000000')
      assert.equal(figure.backgroundColor, 'transparent')
    }
    assert.equal(scene.appState.viewBackgroundColor, '#ffffff')
    assert.ok(scene.elements.some(element => element.customData?.prop === 'desk'))
    assert.ok(scene.elements.some(element => element.customData?.prop === 'whiteboard'))
    assert.ok(scene.elements.every(element => element.backgroundColor === 'transparent'))
    assert.ok(scene.elements.every(element => element.strokeColor === '#000000'))
    const automation = scene.elements.find(element => element.customData?.automationOwner)
    assert.equal(automation?.customData.automationOwner, 'gh-admin')
    assert.equal(automation?.customData.actorId, undefined, 'Automation is a tool, not a third persona')
    assert.ok(scene.elements
      .filter(element => element.type === 'rectangle')
      .every(element => element.customData?.prop === 'whiteboard'), 'Rectangles are props, never panel frames')
    const copy = scene.elements
      .filter(element => element.type === 'text')
      .map(element => element.text)
      .join(' ')
      .replace(/\s+/g, ' ')
    for (const fact of [
      'I hit 1,900 credits.', "I'll verify Luna-only access, then approve 100 credits ($1).",
      'GHCP user', 'GH admin: budgets + policy', 'Normal: 1,900', 'Luna: 2,000',
      'After $20: 4,000', 'Grace is once per month.', 'If used up, credit use pauses again.',
      'An approved $20 top-up restores all approved models.',
      'Automation I own: checks usage and changes model teams.',
      'Next month: 1,900 credits.', 'Temporary increases expire.',
    ]) {
      assert.ok(copy.includes(fact), `Missing illustration fact: ${fact}`)
    }
  }
  assert.equal(existsSync(new URL('../public/diagrams/stick-figures.excalidrawlib', import.meta.url)), false)
})

test('the narrative separates the two personas, admin-owned automation, and approval authority', () => {
  assert.match(draft, /## GHCP users and the GH admin/)
  assert.match(draft, /not simply a repository\s+administrator/)
  assert.match(draft, /The admin still verifies Luna-only access and approves the\s+additional usage/)
  assert.match(draft, /does not\s+approve its own spending/)
})
