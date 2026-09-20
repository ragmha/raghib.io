import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { activeSection, railPosition } from '../src/lib/reading-progress.mjs'

const source = readFileSync(new URL('../src/scripts/contents.js', import.meta.url), 'utf8')
  .replace(/^import .* from .*\n/, '')

async function page({ hidden = false, missing = false, interacting = false } = {}) {
  const events = new Map()
  const tasks = []
  const errors = []
  const calls = { frames: 0, timers: 0 }
  const positions = [200, 600, 1000, 1600]
  const rail = [0, 100, 160, 240]
  const marker = { style: {} }
  let resized
  let context
  const sidebar = {
    scrollTop: 0,
    clientHeight: 250,
    getBoundingClientRect: () => ({ top: 96, bottom: 346 }),
  }
  const navTop = () => Math.max(96, 100 - context.scrollY) - sidebar.scrollTop
  const links = positions.map((_, index) => ({
    dataset: { partLink: index === 0 ? 'post-title' : `section-${index}` },
    attributes: {},
    get hash() { return `#${this.dataset.partLink}` },
    setAttribute(key, value) { this.attributes[key] = value },
    removeAttribute(key) { delete this.attributes[key] },
    getBoundingClientRect: () => ({
      top: navTop() + rail[index], bottom: navTop() + rail[index] + 40,
    }),
  }))
  const targets = positions.map((_, index) => ({
    getBoundingClientRect: () => ({ top: positions[index] - context.scrollY }),
  }))
  const nav = {
    dataset: {},
    offsetHeight: 320,
    querySelector: () => marker,
    querySelectorAll: () => links,
    closest: () => sidebar,
    matches: () => interacting,
    getBoundingClientRect: () => ({ top: navTop() }),
  }
  const article = { getBoundingClientRect: () => ({ bottom: 2200 - context.scrollY }) }
  const header = { getBoundingClientRect: () => ({ bottom: 77 }) }
  const listen = (event, handler) => events.set(event, handler)
  context = {
    activeSection, railPosition,
    scrollY: 0,
    innerHeight: 500,
    document: {
      hidden,
      documentElement: {},
      fonts: { ready: Promise.resolve() },
      querySelector: (selector) => ({
        '[data-contents-nav]': nav, 'main article': article, '.site-header': header,
      })[selector],
      getElementById: (id) => {
        const index = links.findIndex((link) => link.dataset.partLink === id)
        return missing && index === 2 ? null : targets[index]
      },
      addEventListener: listen,
    },
    matchMedia: () => ({ matches: true }),
    getComputedStyle: () => ({ scrollPaddingTop: '96px' }),
    addEventListener: listen,
    requestAnimationFrame: (callback) => { calls.frames++; tasks.push(callback) },
    setTimeout: (callback) => { calls.timers++; tasks.push(callback) },
    ResizeObserver: class {
      constructor(callback) { resized = callback }
      observe() {}
    },
    console: { error: (...args) => errors.push(args) },
  }
  runInNewContext(source, context)
  await Promise.resolve()
  const flush = () => {
    let count = 0
    while (tasks.length) {
      assert(++count < 20, 'Unexpected contents update loop')
      tasks.shift()()
    }
  }
  flush()
  return {
    nav, links, marker, sidebar, errors, calls, positions, flush,
    active: () => links.findIndex((link) => link.attributes['aria-current'] === 'location'),
    scroll: (y) => { context.scrollY = y; events.get('scroll')() },
    event: (name) => events.get(name)(),
    resize: () => resized(),
    pending: () => tasks.length,
  }
}

test('contents enhances visible fallback and selects the article title initially', async () => {
  const p = await page()
  assert.equal(p.active(), 0)
  assert.equal(p.nav.dataset.enhanced, '')
  assert.match(p.marker.style.transform, /^translateY\(.+px\) scaleY\(.+\)$/)
})

test('scrolling tracks real heading targets and moves the reading window', async () => {
  const p = await page()
  const initial = p.marker.style.transform
  p.scroll(600 - 96)
  p.flush()
  assert.equal(p.active(), 1)
  assert.notEqual(p.marker.style.transform, initial)
  p.scroll(1000 - 96)
  p.flush()
  assert.equal(p.active(), 2)
  assert.equal(p.links.filter((link) => link.attributes['aria-current']).length, 1)
  p.scroll(0)
  p.flush()
  assert.equal(p.active(), 0)
})

test('anchor offsets and restored hashes select the section at the scroll-padding boundary', async () => {
  const p = await page()
  p.scroll(1600 - 96)
  p.event('hashchange')
  p.flush()
  assert.equal(p.active(), 3)
})

test('background tabs update without waiting for suspended animation frames', async () => {
  const p = await page({ hidden: true })
  p.scroll(504)
  p.flush()
  assert.equal(p.active(), 1)
  assert.equal(p.calls.frames, 0)
  assert(p.calls.timers > 0)
  p.event('visibilitychange')
  p.flush()
  assert.equal(p.active(), 1)
})

test('scroll updates are coalesced and content resize remeasures heading positions', async () => {
  const p = await page()
  p.scroll(504)
  p.scroll(904)
  assert.equal(p.pending(), 1)
  p.flush()
  assert.equal(p.active(), 2)
  p.positions[2] += 400
  p.resize()
  p.flush()
  assert.equal(p.active(), 1)
})

test('sidebar follows the active link unless the reader is interacting with it', async () => {
  const p = await page()
  p.scroll(1504)
  p.flush()
  assert(p.sidebar.scrollTop > 0)
  const focused = await page({ interacting: true })
  focused.scroll(1504)
  focused.flush()
  assert.equal(focused.sidebar.scrollTop, 0)
})

test('missing targets report an error and leave the readable fallback uncollapsed', async () => {
  const p = await page({ missing: true })
  assert.equal(p.errors.length, 1)
  assert.equal(p.nav.dataset.enhanced, undefined)
})
