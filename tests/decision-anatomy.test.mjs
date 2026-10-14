import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, webkit } from 'playwright'
import { buildDecisionFigure, decisionFigures } from '../src/lib/decision-anatomy.mjs'

test('all five figures have a mechanism and consistent inspectable states', () => {
  assert.equal(Object.keys(decisionFigures).length, 5)
  for (const [variant, config] of Object.entries(decisionFigures)) {
    const { svg, parts } = buildDecisionFigure(variant)
    assert.ok(parts >= 40, `${variant} must be a detailed instrument`)
    assert.equal(config.labels.length, config.details.length)
    assert.equal(config.labels.length, config.key.length)
    assert.equal((svg.match(/data-station=/g) ?? []).length, config.labels.length)
    assert.equal((svg.match(/data-selected=/g) ?? []).length, 1)
    assert.equal((svg.match(/data-indicator=/g) ?? []).length, config.labels.length)
    assert.equal((svg.match(/visibility="visible"/g) ?? []).length, 1)
    assert.match(svg, /role="img" aria-label="[^"]+"/)
    assert.doesNotMatch(svg, /NaN|undefined|<script|<title|https?:\/\/(?!www.w3.org)/)
    assert.ok(config.caption.length > 0)
    assert.deepEqual(buildDecisionFigure(variant), { svg, parts })
  }
})

test('unknown figure names fail explicitly', () => {
  assert.throws(() => buildDecisionFigure('missing'), /Unknown decision figure/)
})

test('live figures follow the site theme, work by keyboard and fit mobile', {
  skip: !process.env.ANATOMY_TEST_URL,
}, async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch()
    try {
      for (const theme of ['dark', 'light']) {
        for (const width of [1280, 390]) {
          const context = await browser.newContext({
            viewport: { width, height: 900 },
            colorScheme: theme === 'dark' ? 'light' : 'dark',
            reducedMotion: 'reduce',
          })
          try {
            const page = await context.newPage()
            const errors = []
            page.on('pageerror', error => errors.push(error.message))
            await page.addInitScript(value => localStorage.setItem('theme', value), theme)
            await page.goto(process.env.ANATOMY_TEST_URL, { waitUntil: 'domcontentloaded' })
            const figures = page.locator('[data-anatomy]')
            assert.equal(await figures.count(), 5)
            assert.equal(await page.locator('img[src*="/diagrams/decision-"]').count(), 0)
            for (let i = 0; i < 5; i++) {
              const figure = figures.nth(i)
              const controls = figure.locator('button[data-step]')
              await controls.first().waitFor({ state: 'visible' })
              for (let j = 0; j < await controls.count(); j++) {
                const button = controls.nth(j)
                await button.focus()
                await button.press(j % 2 ? 'Space' : 'Enter')
                assert.equal(await button.getAttribute('aria-pressed'), 'true')
                assert.equal(await figure.locator('[aria-pressed="true"]').count(), 1)
                assert.equal(await figure.locator('[data-station][data-selected]').getAttribute('data-station'), String(j))
                assert.equal(await figure.locator('[data-key-step][data-selected]').getAttribute('data-key-step'), String(j))
                assert.equal(await figure.locator('[data-indicator][visibility="visible"]').getAttribute('data-indicator'), String(j))
                assert.equal((await figure.locator('.anatomy-readout').textContent()).trim(), await button.getAttribute('data-detail'))
              }
              const result = await figure.evaluate(element => {
                const svg = element.querySelector('svg')
                const box = svg.getBBox()
                return {
                  paper: getComputedStyle(svg.querySelector('.iso-fill')).fill,
                  fits: box.x >= 0 && box.y >= 0 &&
                    box.x + box.width <= svg.viewBox.baseVal.width &&
                    box.y + box.height <= svg.viewBox.baseVal.height,
                  overflows: element.scrollWidth > element.clientWidth,
                }
              })
              assert.equal(result.paper, theme === 'dark' ? 'rgb(24, 24, 24)' : 'rgb(243, 243, 243)')
              assert.ok(result.fits, `Figure ${i} is clipped`)
              assert.equal(result.overflows, false, `Figure ${i} overflows at ${width}px`)
            }
            assert.deepEqual(errors, [])
          } finally {
            await context.close()
          }
        }
      }
      const context = await browser.newContext({ javaScriptEnabled: false })
      try {
        const page = await context.newPage()
        await page.goto(process.env.ANATOMY_TEST_URL, { waitUntil: 'domcontentloaded' })
        assert.equal(await page.locator('[data-anatomy] noscript li').count(), 18)
        assert.equal(await page.locator('.anatomy-controls:visible').count(), 0)
      } finally {
        await context.close()
      }
    } finally {
      await browser.close()
    }
  }
})
