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
            assert.equal(await hero.count(), 1)
            assert.equal(await page.locator('.post-head + .decision-hero + .post-body').count(), 1, 'Hero sits between the post header and body')
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page has no horizontal overflow')
            assert.equal(await hero.locator('[data-anatomy]').count(), 0)
            const result = await hero.evaluate(element => {
              const svg = element.querySelector('svg')
              const bounds = svg.getBBox()
              const viewBox = svg.viewBox.baseVal
              return {
                paper: getComputedStyle(svg.querySelector('.iso-fill')).fill,
                fits: bounds.x >= 0 && bounds.y >= 0 &&
                  bounds.x + bounds.width <= viewBox.width &&
                  bounds.y + bounds.height <= viewBox.height,
                labelTextFits: [...svg.querySelectorAll('.decision-hero-label')]
                  .every(label => {
                    const rect = label.querySelector('rect').getBBox()
                    const text = label.querySelector('text').getBBox()
                    return text.x >= rect.x && text.y >= rect.y &&
                      text.x + text.width <= rect.x + rect.width &&
                      text.y + text.height <= rect.y + rect.height
                  }),
                labelsOverlap: [...svg.querySelectorAll('.decision-hero-label')]
                  .map(label => {
                    const box = label.getBBox()
                    const matrix = label.getCTM()
                    return {
                      x: matrix.e + box.x * matrix.a,
                      y: matrix.f + box.y * matrix.d,
                      width: box.width * matrix.a,
                      height: box.height * matrix.d,
                    }
                  })
                  .some((left, index, labels) => labels.slice(index + 1).some(right =>
                    left.x < right.x + right.width &&
                    left.x + left.width > right.x &&
                    left.y < right.y + right.height &&
                    left.y + left.height > right.y,
                  )),
                overflows: element.scrollWidth > element.clientWidth,
              }
            })
            const contextLabel = `${engine.name()} ${theme} ${width}px`
            assert.equal(result.paper, theme === 'dark' ? 'rgb(24, 24, 24)' : 'rgb(243, 243, 243)', contextLabel)
            assert.ok(result.fits, `Hero is clipped at ${contextLabel}`)
            assert.equal(result.labelTextFits, true, `Hero label text exceeds its box at ${contextLabel}`)
            assert.equal(result.labelsOverlap, false, `Hero labels overlap at ${contextLabel}`)
            assert.equal(result.overflows, false, `Hero overflows at ${contextLabel}`)
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
