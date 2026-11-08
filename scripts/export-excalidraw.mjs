// Export src/assets/diagrams/<name>.excalidraw to a themed, accessible
// public/diagrams/<name>.svg with Excalidraw's own renderer in headless Chromium.
// A source may hold Excalidraw element skeletons (elements without `version`);
// they are expanded with real font metrics and saved back as an editable scene.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'
import { themeDiagram } from './theme-diagrams.mjs'

const { positionals: [name], values } = parseArgs({
  allowPositionals: true,
  options: { title: { type: 'string' }, description: { type: 'string' } },
})
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? '')) {
  throw new Error('Usage: bun run export:excalidraw <name> [--title "…"] [--description "…"]')
}

const root = new URL('../', import.meta.url)
const sourceFile = new URL(`src/assets/diagrams/${name}.excalidraw`, root)
const svgFile = new URL(`public/diagrams/${name}.svg`, root)
const scene = JSON.parse(readFileSync(sourceFile, 'utf8'))
const skeleton = scene.elements.some(element => element.version === undefined)
const escapeXml = value => value.replace(/[&<>"]/g, character => `&#${character.charCodeAt(0)};`)
const previous = existsSync(svgFile) ? readFileSync(svgFile, 'utf8') : ''
const title = values.title ? escapeXml(values.title) : previous.match(/<title\b[^>]*>([^<]+)/)?.[1]
const description = values.description
  ? escapeXml(values.description)
  : previous.match(/<desc\b[^>]*>([^<]+)/)?.[1]
if (!title || !description) throw new Error('A new diagram needs --title and --description')

const dist = fileURLToPath(new URL('node_modules/@excalidraw/excalidraw/dist/prod/', root))
const bundle = mkdtempSync(join(tmpdir(), 'excalidraw-'))
const build = await Bun.build({
  entrypoints: [join(dist, 'index.js')],
  outdir: bundle,
  target: 'browser',
  splitting: true,
  define: { 'process.env.NODE_ENV': '"production"' },
})
if (!build.success) throw new AggregateError(build.logs, 'Could not bundle Excalidraw')

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname
    if (path === '/') return new Response('<!doctype html><meta charset="utf-8">', { headers: { 'content-type': 'text/html' } })
    const file = Bun.file(join(path.startsWith('/fonts/') ? dist : bundle, path))
    return (await file.exists()) ? new Response(file) : new Response('Not found', { status: 404 })
  },
})
const browser = await chromium.launch()

try {
  const page = await browser.newPage()
  await page.route('**/*', route =>
    route.request().url().startsWith(server.url.href) ? route.continue() : route.abort())
  await page.goto(server.url.href)
  const { svg, elements } = await page.evaluate(async scene => {
    window.EXCALIDRAW_ASSET_PATH = `${location.origin}/`
    const excalidraw = await import('/index.js')
    // Load every font the scene uses before Excalidraw measures any text.
    const labels = scene.elements.flatMap(element => [element, element.label ?? {}])
      .filter(({ text }) => typeof text === 'string')
      .map(({ text, fontFamily }) => ({ type: 'text', x: 0, y: 0, text, fontFamily }))
    await excalidraw.exportToCanvas({ elements: excalidraw.convertToExcalidrawElements(labels), appState: {}, files: {} })
    let elements = structuredClone(scene.elements)
    if (elements.some(element => element.version === undefined)) {
      elements = excalidraw.convertToExcalidrawElements(elements, { regenerateIds: false })
    }
    elements = excalidraw.restoreElements(elements, null, { refreshDimensions: true, repairBindings: true })
    const svg = await excalidraw.exportToSvg({
      elements,
      files: scene.files ?? {},
      exportPadding: 28,
      appState: {
        viewBackgroundColor: 'transparent',
        exportBackground: false,
        ...scene.appState,
        exportWithDarkMode: false,
        exportEmbedScene: false,
      },
    })
    return { svg: new XMLSerializer().serializeToString(svg), elements }
  }, scene)

  const byId = new Map(elements.map(element => [element.id, element]))
  for (const text of elements.filter(element => element.type === 'text' && element.containerId)) {
    const box = byId.get(text.containerId)
    if (!['rectangle', 'diamond', 'ellipse'].includes(box?.type)) continue
    if (text.x < box.x - 1 || text.y < box.y - 1 || text.x + text.width > box.x + box.width + 1
      || text.y + text.height > box.y + box.height + 1) {
      throw new Error(`"${text.text}" overflows ${box.id}: widen the shape or shorten the label`)
    }
  }

  const themed = themeDiagram(svg.replace(/^<svg\b([^>]*)>/, `<svg$1 role="img" aria-labelledby="${name}-title ${name}-description"><title id="${name}-title">${title}</title><desc id="${name}-description">${description}</desc>`))
  const unthemed = new Set(themed.replace(/<mask\b[\s\S]*?<\/mask>/g, '').match(/\b(?:fill|stroke)="#[0-9a-f]{3,8}"/gi))
  if (unthemed.size) {
    throw new Error(`Use the colors in scripts/theme-diagrams.mjs; these won't follow dark mode: ${[...unthemed].join(' ')}`)
  }
  if (/<script\b|url\(["']?https?:/i.test(themed)) throw new Error('The SVG must not load scripts or remote fonts')

  writeFileSync(svgFile, `${themed}\n`)
  if (skeleton) {
    const source = { type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements, appState: { viewBackgroundColor: 'transparent', ...scene.appState }, files: scene.files ?? {} }
    writeFileSync(sourceFile, `${JSON.stringify(source, null, 2)}\n`)
  }
  const preview = join(tmpdir(), `${name}.png`)
  await page.setContent(`<body style="margin:0;background:#fff">${themed}</body>`)
  await page.locator('svg').first().screenshot({ path: preview })
  const [, width, height] = themed.match(/^<svg\b[^>]*\bwidth="([\d.]+)" height="([\d.]+)"/) ?? []
  console.log(`Wrote public/diagrams/${name}.svg (width="${width}" height="${height}"). Preview: ${preview}`)
} finally {
  await browser.close()
  server.stop(true)
  rmSync(bundle, { recursive: true, force: true })
}
