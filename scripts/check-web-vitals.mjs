// Core Web Vitals gate, following addyosmani/web-quality-skills/skills/core-web-vitals.
// Structural LCP and CLS causes are asserted against the build; CLS is also measured in a lab
// run. Lab numbers are not field data, so only CLS is gated and LCP is reported for context.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { chromium } from 'playwright'

const CRITICAL_CSS_BUDGET = 14 * 1024
const RENDER_BLOCKING_CSS_BUDGET = 40 * 1024
const BLOCKING_INLINE_SCRIPT_BUDGET = 2 * 1024
const CLS_BUDGET = 0.1

const root = resolve('dist')
function outputPath(pathname) {
  const path = resolve(root, `.${decodeURIComponent(pathname)}`)
  assert.ok(path === root || path.startsWith(root + sep), `Path escapes the public build: ${pathname}`)
  return path
}

const mimeTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
}))

const server = createServer(async (request, response) => {
  try {
    let path = outputPath(new URL(request.url, 'http://localhost').pathname)
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    response.writeHead(200, { 'content-type': mimeTypes.get(extname(path)) ?? 'application/octet-stream' })
    response.end(await readFile(path))
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('Not found')
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ headless: true })
try {
  const parser = await browser.newContext({ javaScriptEnabled: false })
  await parser.route('**/*', (route) => route.abort())
  const parserPage = await parser.newPage()

  const stylesheetCache = new Map()
  async function readStylesheet(href) {
    if (!stylesheetCache.has(href)) stylesheetCache.set(href, await readFile(outputPath(href), 'utf8'))
    return stylesheetCache.get(href)
  }

  const audited = []
  for (const file of (await readdir(root, { recursive: true })).filter((file) => file.endsWith('.html'))) {
    const page = await parserPage.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, 'text/html')
      const head = document.head
      const attributes = (element) => Object.fromEntries([...element.attributes].map((a) => [a.name, a.value]))
      return {
        redirect: Boolean(head.querySelector('meta[http-equiv="refresh"]')),
        noindex: Boolean(head.querySelector('meta[name="robots"][content*="noindex"]')),
        headScripts: [...head.querySelectorAll('script')].map((element) => ({
          ...attributes(element),
          bytes: element.textContent.length,
        })),
        inlineCssBytes: [...head.querySelectorAll('style')].reduce((total, element) => total + element.textContent.length, 0),
        inlineCss: [...head.querySelectorAll('style')].map((element) => element.textContent),
        stylesheets: [...head.querySelectorAll('link[rel="stylesheet"]')].map((element) => attributes(element)),
        preloads: [...head.querySelectorAll('link[rel="preload"]')].map((element) => attributes(element)),
        media: [...document.querySelectorAll('img, video, iframe')].map((element) => ({
          tag: element.tagName.toLowerCase(),
          inMain: Boolean(element.closest('main')),
          ...attributes(element),
        })),
        mainText: document.querySelector('main')?.textContent.trim() ?? '',
        mainHasMedia: Boolean(document.querySelector('main img, main video')),
        markup: html,
      }
    }, await readFile(resolve(root, file), 'utf8'))
    if (page.redirect || page.noindex) continue
    const route = `/${file.replace(/index\.html$/, '')}`

    for (const script of page.headScripts) {
      const deferred = script.async !== undefined || script.defer !== undefined || script.type === 'module'
      assert.ok(
        script.src === undefined || deferred,
        `Render-blocking script ${script.src} in the head of ${file}: add defer, async, or type="module"`,
      )
    }
    const blockingInlineBytes = page.headScripts
      .filter((script) => script.src === undefined && script.type !== 'module')
      .reduce((total, script) => total + script.bytes, 0)
    assert.ok(
      blockingInlineBytes <= BLOCKING_INLINE_SCRIPT_BUDGET,
      `Parser-blocking inline script in ${file} is ${blockingInlineBytes} bytes, over the ${BLOCKING_INLINE_SCRIPT_BUDGET} byte budget`,
    )

    assert.ok(
      page.inlineCssBytes <= CRITICAL_CSS_BUDGET,
      `Inlined critical CSS in ${file} is ${page.inlineCssBytes} bytes, over the ${CRITICAL_CSS_BUDGET} byte budget`,
    )

    let renderBlockingCss = 0
    const sheetSources = [...page.inlineCss]
    for (const sheet of page.stylesheets) {
      const href = new URL(sheet.href, `https://localhost${route}`)
      assert.equal(href.origin, 'https://localhost', `Stylesheet ${sheet.href} in ${file} must be self-hosted`)
      const css = await readStylesheet(href.pathname)
      sheetSources.push(css)
      const blocking = sheet.media === undefined || sheet.media === 'all' || sheet.media === 'screen'
      if (blocking) renderBlockingCss += Buffer.byteLength(css)
    }
    assert.ok(
      renderBlockingCss <= RENDER_BLOCKING_CSS_BUDGET,
      `Render-blocking CSS for ${file} is ${renderBlockingCss} bytes, over the ${RENDER_BLOCKING_CSS_BUDGET} byte budget`,
    )

    for (const css of sheetSources) {
      for (const [, block] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
        assert.match(
          block,
          /font-display\s*:\s*(swap|optional)/,
          `Every @font-face reachable from ${file} must set font-display: swap so text is never blocked`,
        )
      }
    }

    for (const preload of page.preloads) {
      const href = new URL(preload.href, `https://localhost${route}`)
      if (href.origin !== 'https://localhost') continue
      assert.ok((await stat(outputPath(href.pathname))).isFile(), `Preloaded asset ${preload.href} is missing from ${file}`)
      assert.ok(
        page.markup.split(preload.href).length > 2,
        `Preload of ${preload.href} in ${file} is never used, so it only competes for bandwidth`,
      )
    }

    for (const element of page.media) {
      const reserved = Number(element.width) > 0 && Number(element.height) > 0
      const ratio = /aspect-ratio\s*:/.test(element.style ?? '')
      assert.ok(
        reserved || ratio,
        `<${element.tag}> "${element.src ?? ''}" in ${file} must reserve space with width and height or aspect-ratio`,
      )
    }
    const hero = page.media.find((element) => element.inMain && element.tag === 'img')
    if (hero) {
      assert.notEqual(hero.loading, 'lazy', `The first in-content image of ${file} is the likely LCP element and must not be lazy`)
      assert.equal(hero.fetchpriority, 'high', `The first in-content image of ${file} must set fetchpriority="high"`)
    }

    assert.ok(
      page.mainText.length > 0 || page.mainHasMedia,
      `The LCP candidate for ${file} must be server-rendered, not produced by client-side JavaScript`,
    )
    audited.push({ file, route })
  }
  assert.ok(audited.length > 0, 'The build must contain indexable pages to audit')

  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 })
  await context.addInitScript(() => {
    window.__shifts = []
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__shifts.push({ value: entry.value, time: entry.startTime })
      }
    }).observe({ type: 'layout-shift', buffered: true })
    window.__lcp = 0
    new PerformanceObserver((list) => {
      window.__lcp = list.getEntries().at(-1).startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  const measured = await context.newPage()
  const report = []
  for (const { file, route } of audited) {
    await measured.goto(new URL(route, origin).href, { waitUntil: 'load' })
    await measured.evaluate(() => document.fonts.ready)
    await measured.evaluate(() => new Promise((done) => {
      window.scrollTo(0, document.body.scrollHeight)
      requestAnimationFrame(() => requestAnimationFrame(done))
    }))
    await measured.waitForTimeout(1000)
    // CLS is the largest session window: entries within 5s of the window start and 1s of the previous entry.
    const { cls, lcp } = await measured.evaluate(() => {
      let cls = 0
      let current = 0
      let start = 0
      let previous = 0
      for (const shift of window.__shifts) {
        if (current > 0 && (shift.time - start > 5000 || shift.time - previous > 1000)) current = 0
        if (current === 0) start = shift.time
        current += shift.value
        previous = shift.time
        cls = Math.max(cls, current)
      }
      return { cls, lcp: window.__lcp }
    })
    assert.ok(cls <= CLS_BUDGET, `Measured CLS for ${file} is ${cls.toFixed(4)}, over the ${CLS_BUDGET} budget`)
    report.push(`${route} CLS ${cls.toFixed(4)} (lab LCP ${Math.round(lcp)}ms)`)
  }
  console.log(`Core Web Vitals checks passed for ${audited.length} pages:\n  ${report.join('\n  ')}`)
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
