import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { extractCoverSlide } from '../src/lib/talk-preview'
import { renderPresentation } from '../src/lib/talk-presentation'

for (const separator of ['---', '***', '___', '- - -']) {
  test(`a locked talk preview stops at a ${separator} slide break`, () => {
    const markdown = `---
title: Example talk
---
## Public cover
Presenter

${separator}
## Hidden slide
Private slide content
`

    const cover = extractCoverSlide(markdown)
    assert.match(cover, /Public cover/)
    assert.doesNotMatch(cover, /Hidden slide|Private slide content/)
  })
}

test('a public presentation supports navigation, saved themes, and accessible motion', async () => {
  const canonical = new URL('https://raghib.example/talks/self-healing-operations/')
  const html = await renderPresentation(
    fileURLToPath(new URL('../src/content/talks/self-healing-operations.md', import.meta.url)),
    canonical,
  )
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage()
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.route('**/*', (route) => route.request().resourceType() === 'document'
      ? route.fulfill({ contentType: 'text/html', body: html })
      : route.abort())
    await page.goto(new URL('present.html', canonical).href)
    const active = page.locator('svg[data-marpit-svg].bespoke-marp-active')
    await active.waitFor()

    assert.equal(await active.count(), 1)
    assert.equal(await page.locator('svg.ops-diagram').count(), 6)
    assert.equal(await active.locator('h2').innerText(), 'Self-Healing Operations')
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex')
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical.href)

    await page.keyboard.press('ArrowRight')
    await page.getByRole('heading', { name: 'Two loops, one handoff', exact: true }).waitFor()
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    assert.equal(await active.locator('h2').innerText(), 'Two loops, one handoff')
    await page.getByRole('button', { name: 'Next slide', exact: true }).click()
    await page.getByRole('heading', { name: 'Agents propose. Runtimes enforce.', exact: true }).waitFor()
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    assert.equal(await active.locator('h2').innerText(), 'Agents propose. Runtimes enforce.')
    await page.keyboard.press('ArrowLeft')
    await page.getByRole('heading', { name: 'Two loops, one handoff', exact: true }).waitFor()
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    assert.equal(await active.locator('h2').innerText(), 'Two loops, one handoff')

    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click()
    assert.equal(await active.locator('section').evaluate((section) =>
      getComputedStyle(section).backgroundColor), 'rgb(255, 255, 255)')
    await page.reload()
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'light')

    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion })
      const samples = await page.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        return document.getAnimations().flatMap((animation) => {
          if (!(animation instanceof CSSAnimation) || !(animation.effect instanceof KeyframeEffect)) return []
          const frames = animation.effect.getKeyframes()
          return [{
            duration: Number(animation.effect.getComputedTiming().duration),
            fades: frames.some((frame) => Number(frame.opacity) === 0)
              && frames.some((frame) => Number(frame.opacity) === 1),
          }]
        })
      })
      if (reducedMotion === 'reduce') assert.deepEqual(samples, [])
      else assert.ok(samples.some(({ duration, fades }) => duration === 200 && fades))
      await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    }

    await page.evaluate(() => { location.hash = '5' })
    await page.getByRole('heading', { name: 'Upgrade code. Plan the migration.', exact: true }).waitFor()
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))
    await page.getByRole('button', { name: 'Toggle fullscreen', exact: true }).click()
    await page.waitForFunction(() => document.fullscreenElement !== null)
    assert.deepEqual(pageErrors, [])
  } finally {
    await browser.close()
  }
})
