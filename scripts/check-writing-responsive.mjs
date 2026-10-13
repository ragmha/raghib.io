import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const origin = 'http://127.0.0.1:4321'
const route = '/writing/keep-shipping-copilot-budget-limits-part-1/'
const screenshotDirectory = process.env.RESPONSIVE_SCREENSHOTS
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true })
const browser = await chromium.launch({ headless: true, timeout: 30000 })
const measurements = []

try {
  for (const [width, height] of [
    [320, 900], [390, 844], [600, 900], [640, 900], [768, 1024],
    [844, 390], [960, 900], [961, 900], [1024, 900], [1440, 1000],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
      hasTouch: width <= 960,
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    await page.evaluate(() => document.fonts.ready)
    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      articleWidth: document.querySelector('main').getBoundingClientRect().width,
      articleX: document.querySelector('main').getBoundingClientRect().x,
      sidebarPosition: getComputedStyle(document.querySelector('.sidebar')).position,
    }))
    assert.ok(dimensions.pageWidth <= width, `Page overflow at ${width}px`)
    if (width <= 960) {
      assert.equal(dimensions.sidebarPosition, 'static')
      assert.ok(dimensions.articleWidth >= width - 48, `Unused article column at ${width}px`)
      const toggle = page.getByRole('button', { name: 'Toggle contents' })
      const toggleSize = await toggle.boundingBox()
      assert.ok(toggleSize.width >= 44 && toggleSize.height >= 44, 'Contents target must be tap-sized')
      const nav = page.getByRole('navigation', { name: 'Contents' })
      assert.equal(await nav.isVisible(), false)
      await toggle.click()
      assert.equal(await nav.isVisible(), true)
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
      await toggle.press('Escape')
      assert.equal(await nav.isVisible(), false)
      await toggle.press('Enter')
      const link = nav.locator('a[data-part-link]').nth(1)
      const href = await link.getAttribute('href')
      await link.click()
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
      assert.equal(await nav.isVisible(), false)
      assert.ok(page.url().endsWith(href), 'Contents link must navigate to the requested heading')
      await page.evaluate(() => scrollTo(0, 0))
    }

    if (screenshotDirectory && [390, 640, 1440].includes(width)) {
      await page.screenshot({ path: join(screenshotDirectory, `${width}-opening.png`) })
    }

    const figures = page.locator('figure.responsive-diagram')
    assert.equal(await figures.count(), 3)
    const diagrams = []
    for (let index = 0; index < 3; index++) {
      const figure = figures.nth(index)
      await figure.scrollIntoViewIfNeeded()
      const image = figure.locator('img')
      await image.evaluate(element => element.decode())
      const geometry = await figure.evaluate(element => {
        const image = element.querySelector('img')
        const picture = element.querySelector('picture')
        return {
          source: new URL(image.currentSrc).pathname,
          imageWidth: image.getBoundingClientRect().width,
          imageHeight: image.getBoundingClientRect().height,
          figureWidth: element.clientWidth,
          pictureWidth: picture.clientWidth,
          pictureScrollWidth: picture.scrollWidth,
        }
      })
      assert.equal(geometry.source.endsWith('-portrait.svg'), width <= 960)
      assert.ok(geometry.imageWidth <= geometry.figureWidth + 1, 'Diagram must fit its reading column')
      assert.ok(geometry.pictureScrollWidth <= geometry.pictureWidth + 1, 'No sideways diagram scrolling')
      const svg = await readFile(new URL(`../public${geometry.source}`, import.meta.url), 'utf8')
      const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number)
      const sourceWidth = viewBox[2]
      const sourceHeight = viewBox[3]
      const textSizes = [...svg.matchAll(/font-size="([\d.]+)px"/g)].map(match => Number(match[1]))
      assert.ok(textSizes.length > 0, 'The export must contain measurable labels')
      const minimumText = Math.min(...textSizes) * geometry.imageWidth / sourceWidth
      assert.ok(minimumText >= 16, `Unreadable diagram labels: ${minimumText}px at viewport ${width}`)
      assert.ok(Math.abs(geometry.imageHeight / geometry.imageWidth - sourceHeight / sourceWidth) < 0.01)
      diagrams.push({ ...geometry, minimumText })
      if (screenshotDirectory && [390, 640, 1440].includes(width)) {
        await figure.screenshot({ path: join(screenshotDirectory, `${width}-diagram-${index + 1}.png`) })
      }
    }
    assert.deepEqual(errors, [])
    measurements.push({ width, height, ...dimensions, diagrams })
    await context.close()
  }

  const fallback = await browser.newContext({
    viewport: { width: 390, height: 844 }, javaScriptEnabled: false,
  })
  const fallbackPage = await fallback.newPage()
  await fallbackPage.goto(origin + route, { waitUntil: 'load' })
  assert.ok(await fallbackPage.getByRole('navigation', { name: 'Contents' }).isVisible())
  assert.equal(await fallbackPage.getByRole('button', { name: 'Toggle contents' }).isVisible(), false)
  assert.ok(await fallbackPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await fallback.close()

  const published = await browser.newPage({ viewport: { width: 640, height: 900 } })
  await published.goto(`${origin}/writing/leaving-vercel-dns-lessons/`, { waitUntil: 'networkidle' })
  assert.ok(await published.locator('main h1').isVisible())
  assert.ok(await published.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.ok(await published.locator('.diagram-scroll').count() > 0, 'Existing wide diagrams retain scrolling')
  await published.close()

  if (screenshotDirectory) {
    await writeFile(join(screenshotDirectory, 'measurements.json'), JSON.stringify(measurements, null, 2))
  }
  console.log(JSON.stringify({
    status: 'passed',
    viewports: measurements.map(({ width, height }) => `${width}x${height}`),
    diagramMinimumTextPx: Math.min(...measurements.flatMap(({ diagrams }) => diagrams.map(({ minimumText }) => minimumText))),
    checks: ['column width', 'portrait sources', 'no diagram clipping', 'readable labels', 'contents interaction', 'no-JS fallback', 'published article'],
  }, null, 2))
} finally {
  await browser.close()
}
