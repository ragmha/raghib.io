import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium, webkit } from 'playwright'

const url = process.env.DECISION_HERO_TEST_URL

test('decision hero reserves its layout before the illustration loads', {
  skip: !url,
}, async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch()
    try {
      for (const width of [360, 1024, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 640 } })
        try {
          const page = await context.newPage()
          let release
          const pending = new Promise(resolve => { release = resolve })
          await page.route('**/decision-hero.svg', async route => {
            await pending
            await route.continue()
          })
          await page.goto(url, { waitUntil: 'load' })
          await page.evaluate(() => document.fonts.ready)
          const art = page.locator('.decision-hero-art')
          const heading = page.locator('.post-head')
          const beforeArt = await art.boundingBox()
          const beforeHeading = await heading.boundingBox()

          release()
          await art.locator('svg[role="img"]').waitFor()
          const afterArt = await art.boundingBox()
          const afterHeading = await heading.boundingBox()
          const label = `${engine.name()} ${width}px`
          assert.ok(beforeArt?.height > 0, `Illustration space is reserved at ${label}`)
          assert.ok(Math.abs(afterArt.height - beforeArt.height) < 1, `Illustration height stays stable at ${label}`)
          assert.ok(Math.abs(afterHeading.y - beforeHeading.y) < 1, `Article heading stays stable at ${label}`)
        } finally {
          await context.close()
        }
      }
    } finally {
      await browser.close()
    }
  }
})

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
            const routes = hero.locator('.decision-cover-routes')
            assert.equal(await routes.isVisible(), width <= 768, 'Routing thresholds remain visible on mobile')
            if (width <= 768) {
              for (const route of await routes.locator('span').all()) {
                assert.equal(await route.isVisible(), true, 'Every routing threshold is visible on mobile')
              }
              const routingLayer = await routes.evaluate(element => {
                const artwork = document.querySelector('.decision-hero-art')
                const samples = [...element.querySelectorAll('span')].map(route => {
                  const bounds = route.getBoundingClientRect()
                  const hit = document.elementFromPoint(
                    bounds.left + bounds.width / 2,
                    bounds.top + bounds.height / 2,
                  )
                  return hit !== null && route.contains(hit)
                })
                return {
                  artworkLoaded: artwork !== null && !artwork.hidden,
                  zIndex: getComputedStyle(element).zIndex,
                  labelsAreTopmost: samples.every(Boolean),
                }
              })
              assert.equal(routingLayer.artworkLoaded, true, 'Mobile routing labels are checked against loaded artwork')
              assert.equal(routingLayer.zIndex, '1', 'Mobile routing labels paint above the artwork')
              assert.equal(routingLayer.labelsAreTopmost, true, 'Loaded artwork does not cover mobile routing labels')
            }
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

test('decision hero keeps its static key and collapses unavailable artwork', {
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
      const frame = page.locator('.decision-hero-frame')
      assert.equal(await page.locator('.decision-cover-routes').isVisible(), true, 'Static routing key remains without JavaScript')
      assert.equal(await art.isVisible(), false)
      assert.equal(await art.boundingBox(), null, 'Illustration collapses without JavaScript')
      assert.ok((await frame.boundingBox()).height > 0, 'Static key replaces the unavailable illustration')
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
      const frame = page.locator('.decision-hero-frame')
      assert.equal(await page.locator('.decision-cover-routes').isVisible(), true, 'Static routing key remains after a failed request')
      assert.equal(await art.isVisible(), false)
      assert.equal(await art.boundingBox(), null, 'Illustration collapses after a failed request')
      assert.ok((await frame.boundingBox()).height > 0, 'Static key replaces the failed illustration')
    } finally {
      await failedRequest.close()
    }
  } finally {
    await browser.close()
  }
})
