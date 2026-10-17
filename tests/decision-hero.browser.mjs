import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, webkit } from 'playwright'

const url = process.env.DECISION_HERO_TEST_URL

test('decision hero follows the site theme and fits desktop and mobile', {
  skip: !url,
}, async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch()
    try {
      for (const theme of ['dark', 'light']) {
        for (const width of [1440, 1024, 390]) {
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
            await page.goto(url, { waitUntil: 'domcontentloaded' })

            const hero = page.locator('.decision-hero')
            await hero.locator('svg[role="img"]').waitFor()
            assert.equal(await hero.count(), 1)
            assert.equal(await hero.locator('.decision-hero-fallback').count(), 0, 'Loaded illustration replaces the static routing key')
            assert.ok((await hero.locator('svg[role="img"]').textContent()).includes('p < 0.60  STOP'), 'Loaded illustration labels the stop route')
            assert.equal(await page.locator('.decision-cover + .post-head + .post-body').count(), 1, 'Cover illustration leads the article, above the title')
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page has no horizontal overflow')
            assert.equal(await hero.locator('[data-anatomy]').count(), 0)
            const result = await hero.evaluate(element => {
              const svg = element.querySelector('svg')
              const bounds = svg.getBBox()
              const viewBox = svg.viewBox.baseVal
              return {
                paper: getComputedStyle(svg.querySelector('.iso-fill')).fill,
                background: getComputedStyle(element).backgroundColor,
                pageBackground: getComputedStyle(document.documentElement).backgroundColor,
                fits: bounds.x >= 0 && bounds.y >= 0 &&
                  bounds.x + bounds.width <= viewBox.width &&
                  bounds.y + bounds.height <= viewBox.height,
                labelsOverlap: [...svg.querySelectorAll('.decision-hero-label')]
                  .filter(label => getComputedStyle(label).display !== 'none')
                  .map(label => label.getBoundingClientRect())
                  .some((left, index, labels) => labels.slice(index + 1).some(right =>
                    left.x < right.x + right.width &&
                    left.x + left.width > right.x &&
                    left.y < right.y + right.height &&
                    left.y + left.height > right.y,
                  )),
                overflows: element.scrollWidth > element.clientWidth,
                movingSignals: [...svg.querySelectorAll('.decision-signal')]
                  .some(signal => getComputedStyle(signal).animationName !== 'none'),
              }
            })

            const contextLabel = `${engine.name()} ${theme} ${width}px`
            assert.equal(result.paper, theme === 'dark' ? 'rgb(24, 24, 24)' : 'rgb(243, 243, 243)', contextLabel)
            assert.equal(result.background, result.pageBackground, `Cover blends into the ${contextLabel} page`)
            assert.ok(result.fits, `Hero is clipped at ${contextLabel}`)
            assert.equal(result.labelsOverlap, false, `Hero labels overlap at ${contextLabel}`)
            assert.equal(result.overflows, false, `Hero overflows at ${contextLabel}`)
            assert.equal(result.movingSignals, false, `Reduced motion stops signals at ${contextLabel}`)
            assert.deepEqual(errors, [])
          } finally {
            await context.close()
          }
        }
      }
    } finally {
      await browser.close()
    }
  }
})

test('decision hero keeps its static fallback and reserves space without an illustration', {
  skip: !url,
}, async () => {
  const browser = await chromium.launch()
  try {
    const noScript = await browser.newContext({
      viewport: { width: 1024, height: 900 },
      javaScriptEnabled: false,
    })
    try {
      const page = await noScript.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const art = page.locator('.decision-hero-art')
      assert.equal(await art.locator('.decision-cover-routes').isVisible(), true, 'Static routing key replaces empty artwork')
      assert.equal(await art.isVisible(), true)
      assert.ok((await art.boundingBox()).height > 0, 'The illustration space is reserved without JavaScript')
    } finally {
      await noScript.close()
    }

    const failedRequest = await browser.newContext({ viewport: { width: 1024, height: 900 } })
    try {
      const page = await failedRequest.newPage()
      await page.route('**/decision-hero.svg', route => route.abort())
      const requestFailure = page.waitForEvent('requestfailed', {
        predicate: request => request.url().endsWith('/decision-hero.svg'),
      })
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await requestFailure
      const art = page.locator('.decision-hero-art')
      assert.equal(await art.locator('.decision-cover-routes').isVisible(), true, 'Static routing key remains after a failed request')
      assert.equal(await art.isVisible(), true)
      assert.ok((await art.boundingBox()).height > 0, 'The illustration space remains reserved after a failed request')
    } finally {
      await failedRequest.close()
    }
  } finally {
    await browser.close()
  }
})
