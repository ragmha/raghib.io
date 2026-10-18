import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const origin = process.env.WRITING_TEST_URL ?? 'http://127.0.0.1:4321'
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
      viewportWidth: document.documentElement.clientWidth,
      articleWidth: document.querySelector('main').getBoundingClientRect().width,
      articleX: document.querySelector('main').getBoundingClientRect().x,
      sidebarPosition: getComputedStyle(document.querySelector('.sidebar')).position,
    }))
    assert.ok(dimensions.pageWidth <= dimensions.viewportWidth, `Page overflow at ${width}px`)
    assert.equal(dimensions.sidebarPosition, width < 1024 ? 'static' : 'sticky')
    if (width < 1024) {
      assert.ok(dimensions.articleWidth >= width - 48, `Unused article column at ${width}px`)
    }
    assert.equal(await page.getByRole('button', { name: 'Toggle contents' }).count(), 0)
    const nav = page.getByRole('navigation', { name: 'Contents' })
    assert.equal(await nav.isVisible(), true)
    const link = nav.locator('a[data-part-link]').nth(1)
    const href = await link.getAttribute('href')
    await link.click()
    assert.equal(await nav.isVisible(), true)
    assert.ok(page.url().endsWith(href), 'Contents link must navigate to the requested heading')
    await page.evaluate(() => scrollTo(0, 0))

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
  assert.equal(await fallbackPage.getByRole('button', { name: 'Toggle contents' }).count(), 0)
  assert.ok(await fallbackPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await fallback.close()

  const published = await browser.newPage({ viewport: { width: 640, height: 900 } })
  await published.goto(`${origin}/writing/leaving-vercel-dns-lessons/`, { waitUntil: 'networkidle' })
  assert.ok(await published.locator('main h1').isVisible())
  assert.ok(await published.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  assert.ok(await published.locator('.diagram-scroll').count() > 0, 'Existing wide diagrams retain scrolling')
  await published.close()

  const preview = await browser.newPage()
  await preview.goto(`${origin}/writing/advent-of-copilot-cli/`, { waitUntil: 'networkidle' })
  assert.ok(await preview.locator('.draft-notice').isVisible())
  assert.match(await preview.locator('meta[name="robots"]').getAttribute('content'), /noindex/)
  assert.equal(await preview.locator('.post-head a[href^="/writing/tag/"], .post-head a[href^="/writing/topic/"]').count(), 0,
    'Draft metadata must not link to archives that may not exist')

  await preview.goto(`${origin}/writing/not-every-action-item-is-mine/`, { waitUntil: 'networkidle' })
  for (const theme of ['dark', 'light']) {
    const colors = await preview.evaluate(theme => {
      document.documentElement.dataset.theme = theme
      const svg = document.querySelector('svg.flowchart')
      const node = svg.querySelector('.node rect')
      const label = svg.querySelector('.nodeLabel')
      return { fill: getComputedStyle(node).fill, text: getComputedStyle(label).color }
    }, theme)
    assert.deepEqual(colors, theme === 'dark'
      ? { fill: 'rgb(24, 24, 24)', text: 'rgb(255, 255, 255)' }
      : { fill: 'rgb(243, 243, 243)', text: 'rgb(13, 13, 13)' })
  }
  await preview.close()

  const diagramSources = [...new Set(measurements.flatMap(({ diagrams }) =>
    diagrams.map(({ source }) => source)))]
  const diagramPage = await browser.newPage()
  for (const theme of ['dark', 'light']) {
    await diagramPage.emulateMedia({ colorScheme: theme })
    for (const source of diagramSources) {
      await diagramPage.goto(origin + source, { waitUntil: 'load' })
      const colors = await diagramPage.evaluate(() => ({
        text: [...document.querySelectorAll('text')].map(text => getComputedStyle(text).fill),
        highlights: [...document.querySelectorAll('[fill*="--diagram-ochre-surface"]')]
          .map(shape => getComputedStyle(shape).fill),
      }))
      const requiresHighlights = /\/copilot-(?:budget-and-model-access|additive-model-access)(?:-portrait)?\.svg$/.test(source)
      const hasNoHighlights = /\/copilot-credit-journey(?:-portrait)?\.svg$/.test(source)
      assert.ok(colors.text.length > 0, `Diagram has readable labels: ${source}`)
      assert.ok(colors.text.every(color => color === (theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(13, 13, 13)')),
        `Diagram ink must adapt to ${theme}: ${source}`)
      if (requiresHighlights) {
        assert.ok(colors.highlights.length > 0, `Budget/access diagram must retain highlight fills: ${source}`)
      }
      if (hasNoHighlights) {
        assert.equal(colors.highlights.length, 0, `Credit-journey diagram intentionally has no highlights: ${source}`)
      }
      assert.ok(colors.highlights.every(color => color === (theme === 'dark' ? 'rgb(48, 39, 25)' : 'rgb(244, 233, 199)')),
        `Diagram highlights must adapt with their ink in ${theme}: ${source}`)
    }
  }
  await diagramPage.close()

  if (screenshotDirectory) {
    await writeFile(join(screenshotDirectory, 'measurements.json'), JSON.stringify(measurements, null, 2))
  }
  console.log(JSON.stringify({
    status: 'passed',
    viewports: measurements.map(({ width, height }) => `${width}x${height}`),
    diagramMinimumTextPx: Math.min(...measurements.flatMap(({ diagrams }) => diagrams.map(({ minimumText }) => minimumText))),
    checks: ['column width', 'portrait sources', 'no diagram clipping', 'readable labels', 'contents interaction', 'no-JS fallback', 'published article', 'draft metadata', 'diagram themes', 'SVG ink and highlights in both themes'],
  }, null, 2))
} finally {
  await browser.close()
}
