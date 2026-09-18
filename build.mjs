#!/usr/bin/env node
// Minimal static site generator: markdown -> HTML. No framework, no client bundler.
// Usage:  node build.mjs           build once into dist/
//         node build.mjs --serve   build, serve dist/ on :3000, rebuild on change

import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(ROOT, 'site')
const CONTENT = path.join(SITE, 'content')
const ASSETS = path.join(SITE, 'assets')
const OUT = path.join(ROOT, 'dist')

const config = {
  title: 'Raghib Hasan',
  tagline: 'Solution Engineer at Microsoft',
  url: 'https://raghib.io',
  description: 'Writing about software, systems and the tools I build.',
  author: 'Raghib Hasan',
  links: [
    { label: 'GITHUB', href: 'https://github.com/ragmha' },
    { label: 'RSS', href: '/feed.xml' },
  ],
}

/* ---------------------------------------------------------------- helpers */

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const stripTags = (s) => String(s).replace(/<[^>]*>/g, '')

function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!m) return { data: {}, content: raw }
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    const key = kv[1]
    const val = kv[2].trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else if (val === 'true' || val === 'false') {
      data[key] = val === 'true'
    } else {
      data[key] = val.replace(/^["']|["']$/g, '')
    }
  }
  return { data, content: raw.slice(m[0].length) }
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase()
}

const readingTime = (text) =>
  `${Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))} MIN`

/* -------------------------------------------------------------- markdown */

// Collected while rendering a document, then read back out by the caller.
let sections = []
let hasDiagram = false

// ==highlighted text== -> <mark>
const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src) {
    return src.indexOf('==')
  },
  tokenizer(src) {
    const m = /^==(?=\S)([\s\S]*?\S)==/.exec(src)
    if (!m) return
    return {
      type: 'highlight',
      raw: m[0],
      tokens: this.lexer.inlineTokens(m[1]),
    }
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`
  },
}

// An Excalidraw export lives at /assets/diagrams/foo.svg. If a foo.dark.svg
// sibling exists it is swapped in automatically under the dark theme.
function darkVariant(href) {
  if (!href.startsWith('/assets/') || !/\.(svg|png)$/i.test(href)) return null
  const ext = path.extname(href)
  const dark = `${href.slice(0, -ext.length)}.dark${ext}`
  return fs.existsSync(path.join(SITE, dark)) ? dark : null
}

const renderer = {
  heading(token) {
    const text = this.parser.parseInline(token.tokens)
    const plain = stripTags(text)
    const id = slugify(plain) || `s-${sections.length + 1}`
    if (token.depth !== 2) {
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>`
    }
    sections.push({ id, title: plain })
    const n = sections.length
    return `<div class="part" id="${id}" data-part="${n}">
      <span class="folio" aria-hidden="true">${n}</span>
      <h2><mark>${text}</mark></h2>
      <span class="folio" aria-hidden="true">${n}</span>
    </div>
    <hr class="rule-dotted" />`
  },

  code(token) {
    const lang = (token.lang || '').trim().split(/\s+/)[0]
    if (lang === 'mermaid') {
      hasDiagram = true
      return `<figure class="diagram"><pre class="mermaid">${esc(token.text)}</pre></figure>`
    }
    const label = lang ? `<span class="code-lang">${esc(lang)}</span>` : ''
    return `<div class="code-block">${label}<pre><code${
      lang ? ` class="language-${esc(lang)}"` : ''
    }>${esc(token.text)}</code></pre></div>`
  },

  image(token) {
    const alt = esc(token.text || '')
    const caption = token.title ? `<figcaption>${esc(token.title)}</figcaption>` : ''
    const dark = darkVariant(token.href)
    if (dark) {
      return `<figure class="diagram">
        <img class="only-light" src="${esc(token.href)}" alt="${alt}" loading="lazy" />
        <img class="only-dark" src="${esc(dark)}" alt="${alt}" loading="lazy" />
        ${caption}</figure>`
    }
    return `<figure class="diagram"><img src="${esc(
      token.href
    )}" alt="${alt}" loading="lazy" />${caption}</figure>`
  },

  link(token) {
    const href = token.href || ''
    const external = /^https?:\/\//.test(href)
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${esc(href)}"${attrs}>${this.parser.parseInline(token.tokens)}</a>`
  },
}

marked.use({ gfm: true, extensions: [highlightExtension], renderer })

function renderMarkdown(md) {
  sections = []
  hasDiagram = false
  let html = marked.parse(md)
  // A lone image becomes <p><figure>…</figure></p>, which is invalid HTML —
  // <figure> is not phrasing content. Unwrap the paragraph.
  html = html.replace(/<p>(\s*<figure[\s\S]*?<\/figure>\s*)<\/p>/g, '$1')
  return { html, sections: [...sections], hasDiagram }
}

/* ------------------------------------------------------------- templates */

function layout({ title, description, body, sidebar, diagrams, canonical }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || config.description)}" />
${canonical ? `<link rel="canonical" href="${esc(config.url + canonical)}" />` : ''}
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description || config.description)}" />
<meta property="og:type" content="website" />
<link rel="alternate" type="application/rss+xml" title="${esc(
    config.title
  )}" href="/feed.xml" />
<link rel="stylesheet" href="/assets/style.css" />
<script>
  // Set the theme before first paint so there is no flash.
  (function () {
    try {
      var saved = localStorage.getItem('theme')
      var dark = saved ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    } catch (e) {}
  })()
</script>
</head>
<body${diagrams ? ' data-diagrams="true"' : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="/">${esc(config.title)}</a>
  <nav class="topnav">
    <a href="/writing/">WRITING</a>
    <a href="/about/">ABOUT</a>
    <button id="theme-toggle" type="button" aria-live="polite">
      <span data-theme-label>DARK</span>
    </button>
  </nav>
</header>
<div class="shell${sidebar ? '' : ' shell-solo'}">
  <aside class="sidebar">${sidebar || ''}</aside>
  <main id="main">${body}</main>
</div>
<footer class="footer">
  <span>© ${new Date().getFullYear()} ${esc(config.author)}</span>
  <span class="footer-links">${config.links
    .map(
      (l) =>
        `<a href="${esc(l.href)}"${
          /^https?:/.test(l.href) ? ' target="_blank" rel="noopener noreferrer"' : ''
        }>${esc(l.label)}</a>`
    )
    .join('')}</span>
</footer>
<script type="module" src="/assets/app.js"></script>
</body>
</html>
`
}

function partsSidebar(sections) {
  if (!sections.length) return ''
  return `<nav class="parts" aria-label="Sections">
  <ol>
  ${sections
    .map(
      (s, i) => `<li>
      <a href="#${s.id}" data-part-link="${s.id}">
        <span class="part-index">PART ${i + 1}</span>
        <span class="part-title">${esc(s.title)}</span>
      </a>
    </li>`
    )
    .join('')}
  </ol>
</nav>`
}

function listSidebar(items, current) {
  return `<nav class="parts" aria-label="Pages">
  <ol>
  ${items
    .map(
      (it, i) => `<li>
      <a href="${esc(it.href)}"${it.href === current ? ' aria-current="page"' : ''}>
        <span class="part-index">${esc(it.index || `PART ${i + 1}`)}</span>
        <span class="part-title">${esc(it.title)}</span>
      </a>
    </li>`
    )
    .join('')}
  </ol>
</nav>`
}

function postList(posts) {
  return `<ul class="post-list">
  ${posts
    .map(
      (p) => `<li>
      <a href="/writing/${p.slug}/">
        <span class="post-date">${formatDate(p.data.date)}</span>
        <span class="post-title">${esc(p.data.title)}</span>
        <span class="post-desc">${esc(p.data.description || '')}</span>
      </a>
    </li>`
    )
    .join('')}
</ul>`
}

/* ----------------------------------------------------------------- build */

function readCollection(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const { data, content } = parseFrontmatter(raw)
      return { slug: file.replace(/\.md$/, ''), data, content }
    })
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(src, dest)
    else fs.copyFileSync(src, dest)
  }
}

function write(relPath, contents) {
  const target = path.join(OUT, relPath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, contents)
}

function rssFeed(posts) {
  const items = posts
    .map(
      (p) => `  <item>
    <title>${esc(p.data.title)}</title>
    <link>${config.url}/writing/${p.slug}/</link>
    <guid isPermaLink="true">${config.url}/writing/${p.slug}/</guid>
    <description>${esc(p.data.description || '')}</description>
    <pubDate>${new Date(p.data.date).toUTCString()}</pubDate>
  </item>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${esc(config.title)}</title>
  <link>${config.url}</link>
  <description>${esc(config.description)}</description>
  <language>en</language>
${items}
</channel>
</rss>
`
}

function build() {
  const started = Date.now()
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })
  copyDir(ASSETS, path.join(OUT, 'assets'))

  const posts = readCollection(path.join(CONTENT, 'posts'))
    .filter((p) => p.data.published !== false)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))

  const pages = readCollection(path.join(CONTENT, 'pages'))

  // Posts
  for (const post of posts) {
    const { html, sections, hasDiagram } = renderMarkdown(post.content)
    const body = `<article class="prose">
  <header class="doc-head">
    <h1>${esc(post.data.title)}</h1>
    <p class="doc-meta">${formatDate(post.data.date)} · ${readingTime(post.content)} READ${
      post.data.tags?.length
        ? ` · ${post.data.tags.map((t) => esc(t.toUpperCase())).join(' / ')}`
        : ''
    }</p>
  </header>
  ${html}
  <hr class="rule-dotted" />
  <p class="doc-end"><a href="/writing/">← ALL WRITING</a></p>
</article>`
    write(
      `writing/${post.slug}/index.html`,
      layout({
        title: `${post.data.title} — ${config.title}`,
        description: post.data.description,
        canonical: `/writing/${post.slug}/`,
        body,
        sidebar: partsSidebar(sections),
        diagrams: hasDiagram,
      })
    )
  }

  // Writing index
  write(
    'writing/index.html',
    layout({
      title: `Writing — ${config.title}`,
      description: config.description,
      canonical: '/writing/',
      body: `<article class="prose">
  <header class="doc-head"><h1>Writing</h1>
  <p class="doc-meta">${posts.length} ${posts.length === 1 ? 'PIECE' : 'PIECES'}</p></header>
  ${postList(posts)}
</article>`,
      sidebar: listSidebar(
        posts.map((p, i) => ({
          href: `/writing/${p.slug}/`,
          title: p.data.title,
          index: `PART ${i + 1}`,
        }))
      ),
    })
  )

  // Static pages
  for (const page of pages) {
    const { html, sections, hasDiagram } = renderMarkdown(page.content)
    write(
      `${page.slug}/index.html`,
      layout({
        title: `${page.data.title} — ${config.title}`,
        description: page.data.description,
        canonical: `/${page.slug}/`,
        body: `<article class="prose">
  <header class="doc-head"><h1>${esc(page.data.title)}</h1>
  ${page.data.description ? `<p class="doc-meta">${esc(page.data.description.toUpperCase())}</p>` : ''}
  </header>
  ${html}
</article>`,
        sidebar: partsSidebar(sections),
        diagrams: hasDiagram,
      })
    )
  }

  // Home
  const home = fs.existsSync(path.join(CONTENT, 'home.md'))
    ? parseFrontmatter(fs.readFileSync(path.join(CONTENT, 'home.md'), 'utf8'))
    : { data: {}, content: '' }
  const homeRender = renderMarkdown(home.content)
  write(
    'index.html',
    layout({
      title: `${config.title} — ${config.tagline}`,
      description: config.description,
      canonical: '/',
      body: `<article class="prose">
  <header class="doc-head">
    <h1>${esc(config.title)}</h1>
    <p class="doc-meta">${esc(config.tagline.toUpperCase())}</p>
  </header>
  ${homeRender.html}
  <div class="part" data-part="recent">
    <span class="folio" aria-hidden="true">§</span>
    <h2><mark>RECENT WRITING</mark></h2>
    <span class="folio" aria-hidden="true">§</span>
  </div>
  <hr class="rule-dotted" />
  ${postList(posts.slice(0, 5))}
</article>`,
      sidebar: listSidebar(
        [
          { href: '/', title: 'Home', index: 'PART 1' },
          { href: '/writing/', title: 'Writing', index: 'PART 2' },
          { href: '/about/', title: 'About', index: 'PART 3' },
        ],
        '/'
      ),
      diagrams: homeRender.hasDiagram,
    })
  )

  write('feed.xml', rssFeed(posts))
  write(
    '404.html',
    layout({
      title: `Not found — ${config.title}`,
      body: `<article class="prose">
  <header class="doc-head"><h1>404</h1><p class="doc-meta">PAGE NOT FOUND</p></header>
  <p>That page does not exist. Try <a href="/writing/">the writing index</a>.</p>
</article>`,
      sidebar: '',
    })
  )

  const pageCount = posts.length + pages.length + 3
  console.log(`built ${pageCount} pages in ${Date.now() - started}ms → dist/`)
  return posts.length
}

/* ------------------------------------------------------------ dev server */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function serve(port) {
  let dirty = false
  fs.watch(SITE, { recursive: true }, () => {
    dirty = true
  })

  const server = http.createServer((req, res) => {
    if (dirty) {
      dirty = false
      try {
        build()
      } catch (err) {
        console.error(err)
      }
    }
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.join(OUT, url)
    if (!file.startsWith(OUT)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html')
    }
    if (!fs.existsSync(file)) {
      const notFound = path.join(OUT, '404.html')
      res.writeHead(404, { 'content-type': MIME['.html'] })
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found')
      return
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(fs.readFileSync(file))
  })

  server.listen(port, () => {
    console.log(`serving dist/ → http://localhost:${port}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < 65535) {
      console.log(`port ${port} in use, trying ${port + 1}…`)
      server.close()
      serve(port + 1)
      return
    }
    throw err
  })
}

build()
if (process.argv.includes('--serve')) {
  serve(Number(process.env.PORT) || 3000)
}
