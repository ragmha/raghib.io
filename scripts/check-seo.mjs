import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { getSeoMetadata } from '../src/lib/seo.ts'
import { assertPublicationsMatch, readPublication } from './lib/seo-publications.mjs'

const root = resolve('dist')
const site = new URL(`https://${(await readFile('public/CNAME', 'utf8')).trim()}`)
function outputPath(url) {
  const path = resolve(root, `.${decodeURIComponent(url.pathname)}`)
  assert.ok(path === root || path.startsWith(root + sep), `URL escapes the public build: ${url.href}`)
  return path
}
const expectedArticles = []
for (const [collection, directory] of [
  ['writing', 'src/content/writing'],
  ['projectWriteups', 'src/content/project-writeups'],
]) {
  for (const file of (await readdir(directory, { recursive: true })).filter((file) => /\.(md|mdx)$/.test(file))) {
    const publication = readPublication(await readFile(resolve(directory, file), 'utf8'), collection, file)
    if (publication) {
      expectedArticles.push({
        ...publication,
        searchTitle: getSeoMetadata({ url: site, site, title: publication.searchTitle }).pageTitle,
      })
    }
  }
}
const robots = await readFile(resolve(root, 'robots.txt'), 'utf8')
assert.match(robots, /^User-agent: \*$/m)
assert.match(robots, /^Allow: \/$/m)
assert.ok(!/^Disallow:\s*\/\s*$/m.test(robots), 'Public pages must be crawlable')
assert.ok(robots.split(/\r?\n/).includes(`Sitemap: ${new URL('/sitemap-index.xml', site).href}`))

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ javaScriptEnabled: false })
  await context.route('**/*', (route) => route.abort())
  const page = await context.newPage()

  async function xmlValues(file, selector) {
    const xml = await readFile(resolve(root, file), 'utf8')
    return page.evaluate(({ content, selector }) => {
      const document = new DOMParser().parseFromString(content, 'application/xml')
      if (document.querySelector('parsererror')) throw new Error('Invalid discovery XML')
      return [...document.querySelectorAll(selector)].map((node) => node.textContent)
    }, { content: xml, selector })
  }

  const publicUrls = []
  const writingUrls = []
  const renderedArticles = []
  const titles = new Set()
  const descriptions = new Set()
  const documents = new Map()
  let home
  const outputFiles = await readdir(root, { recursive: true })
  assert.ok(!outputFiles.some((file) => file.endsWith('.excalidraw')), 'Editable diagram sources must stay out of the deployment')
  const htmlFiles = outputFiles.filter((file) => file.endsWith('.html'))
  for (const file of htmlFiles) {
    const metadata = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, 'text/html')
      const meta = (selector) => document.querySelector(selector)?.getAttribute('content')
      return {
        title: document.title,
        titleCount: document.querySelectorAll('title').length,
        description: meta('meta[name="description"]'),
        descriptionCount: document.querySelectorAll('meta[name="description"]').length,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
        language: document.documentElement.lang,
        viewport: meta('meta[name="viewport"]'),
        noindex: meta('meta[name="robots"]')?.includes('noindex'),
        redirect: Boolean(document.querySelector('meta[http-equiv="refresh"]')),
        h1: [...document.querySelectorAll('h1')].map((element) => element.textContent),
        ogTitle: meta('meta[property="og:title"]'),
        ogDescription: meta('meta[property="og:description"]'),
        ogUrl: meta('meta[property="og:url"]'),
        ogType: meta('meta[property="og:type"]'),
        ogImage: meta('meta[property="og:image"]'),
        ogImageAlt: meta('meta[property="og:image:alt"]'),
        twitterCard: meta('meta[name="twitter:card"]'),
        twitterImage: meta('meta[name="twitter:image"]'),
        datePublished: meta('meta[property="article:published_time"]'),
        links: [...document.querySelectorAll('a[href]')].map((element) => element.getAttribute('href')),
        ids: [...document.querySelectorAll('[id]')].map((element) => element.id),
        mainLinks: [...document.querySelectorAll('main a[href]')].map((element) => element.getAttribute('href')),
        images: [...document.images].map((element) => ({
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
          width: element.getAttribute('width'),
          height: element.getAttribute('height'),
        })),
        schema: [...document.querySelectorAll('script[type="application/ld+json"]')]
          .flatMap((element) => JSON.parse(element.textContent)['@graph']),
      }
    }, await readFile(resolve(root, file), 'utf8'))
    if (metadata.redirect || metadata.noindex) continue
    const path = `/${file.replace(/index\.html$/, '')}`
    const expected = new URL(path, site).href
    assert.equal(metadata.canonical, expected, `Canonical URL for ${file}`)
    assert.equal(metadata.canonicalCount, 1, `One canonical URL for ${file}`)
    assert.ok(metadata.title && metadata.description, `Search metadata for ${file}`)
    assert.equal(metadata.titleCount, 1, `One search title for ${file}`)
    assert.equal(metadata.descriptionCount, 1, `One description for ${file}`)
    assert.ok(metadata.language, `Document language for ${file}`)
    assert.match(metadata.viewport ?? '', /width=device-width/, `Mobile viewport for ${file}`)
    assert.ok(!titles.has(metadata.title), `Unique search title for ${file}`)
    assert.ok(!descriptions.has(metadata.description), `Unique description for ${file}`)
    titles.add(metadata.title)
    descriptions.add(metadata.description)
    assert.equal(metadata.h1.length, 1, `One H1 for ${file}`)
    assert.equal(metadata.ogUrl, expected, `Social URL for ${file}`)
    assert.equal(metadata.ogTitle, metadata.title, `Social title for ${file}`)
    assert.equal(metadata.ogDescription, metadata.description, `Social description for ${file}`)
    assert.equal(metadata.twitterCard, 'summary_large_image', `Twitter card for ${file}`)
    assert.equal(metadata.twitterImage, metadata.ogImage, `Shared preview image for ${file}`)
    assert.ok(metadata.ogImageAlt, `Social image alternative text for ${file}`)

    const image = new URL(metadata.ogImage)
    assert.equal(image.origin, site.origin, 'Social preview images must be self-hosted')
    const png = await readFile(outputPath(image))
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'Social image must be a PNG')
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], 'Social image dimensions')

    assert.ok(metadata.schema.some((entry) => entry['@type'] === 'Person'), `Author identity for ${file}`)
    assert.ok(metadata.schema.some((entry) => entry['@type'] === 'WebSite'), `Site identity for ${file}`)
    const article = metadata.schema.find((entry) => entry['@type'] === 'BlogPosting')
    const isArticle = (path.startsWith('/writing/') && path !== '/writing/') || path.startsWith('/project/')
    assert.equal(Boolean(article), isArticle, `Article schema only on article routes: ${file}`)
    if (article) {
      assert.equal(metadata.ogType, 'article', `Article social type for ${file}`)
      assert.equal(article.url, expected, `Article schema URL for ${file}`)
      assert.equal(article.headline, metadata.h1[0], `Article schema preserves the visible headline for ${file}`)
      assert.equal(article.datePublished, metadata.datePublished, `Consistent publication date for ${file}`)
      assert.ok(Number.isFinite(Date.parse(article.datePublished)), `Valid publication date for ${file}`)
      assert.equal(article.author.name, 'Raghib Hasan', `Article author for ${file}`)
      renderedArticles.push({
        collection: path.startsWith('/writing/') ? 'writing' : 'projectWriteups',
        headline: article.headline,
        searchTitle: metadata.title,
        description: metadata.description,
        datePublished: article.datePublished,
      })
      if (path.startsWith('/writing/')) writingUrls.push(expected)
    }
    for (const href of metadata.links) {
      const url = new URL(href, expected)
      if (url.origin !== site.origin) continue
      let destination = outputPath(url)
      if ((await stat(destination)).isDirectory()) destination = resolve(destination, 'index.html')
      assert.ok((await stat(destination)).isFile(), `Internal link ${href} from ${file}`)
    }
    for (const image of metadata.images) {
      assert.ok(image.alt?.trim(), `Image alternative text for ${image.src} in ${file}`)
      assert.ok(Number(image.width) > 0 && Number(image.height) > 0, `Reserved image dimensions for ${image.src}`)
      const url = new URL(image.src, expected)
      if (url.origin === site.origin) {
        assert.ok((await stat(outputPath(url))).isFile(), `Image asset ${image.src}`)
      }
    }
    if (path === '/') home = metadata
    documents.set(expected, metadata)
    publicUrls.push(expected)
  }

  const sitemapUrls = []
  for (const location of await xmlValues('sitemap-index.xml', 'loc')) {
    const url = new URL(location)
    assert.equal(url.origin, site.origin, 'Sitemap files must be on the configured site')
    sitemapUrls.push(...await xmlValues(url.pathname.slice(1), 'loc'))
  }
  assert.deepEqual(sitemapUrls.sort(), publicUrls.sort(), 'Sitemap must contain exactly the canonical, indexable pages')
  for (const [pageUrl, metadata] of documents) {
    for (const href of metadata.links) {
      const target = new URL(href, pageUrl)
      if (target.origin !== site.origin || !target.hash) continue
      const fragment = decodeURIComponent(target.hash.slice(1))
      target.hash = ''
      target.search = ''
      const destination = documents.get(target.href)
      if (destination) assert.ok(destination.ids.includes(fragment), `Missing anchor ${href} from ${pageUrl}`)
    }
  }
  assertPublicationsMatch(expectedArticles, renderedArticles)
  assert.deepEqual(
    (await xmlValues('writing/feed.xml', 'item > link')).sort(),
    writingUrls.sort(),
    'RSS must include exactly the published writing URLs, not project writeups or drafts',
  )
  assert.ok(home, 'The public homepage must exist')
  assert.match(home.title, /software.*AI.*systems/i, 'The homepage search title must describe the publication')
  if (writingUrls.length > 0) {
    assert.ok(
      home.mainLinks.some((href) => writingUrls.includes(new URL(href, site).href)),
      'The homepage must link directly to published writing',
    )
  }
  console.log(`SEO metadata and discovery checks passed for ${publicUrls.length} public pages.`)
} finally {
  await browser.close()
}
