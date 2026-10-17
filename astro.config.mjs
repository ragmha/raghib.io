import { copyFile, readFile, readdir } from 'node:fs/promises'
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import rehypeMermaid from 'rehype-mermaid'
import sitemap from '@astrojs/sitemap'
import rehypeParts from './src/lib/rehype-parts.mjs'
import rehypeInlineDiagrams from './src/lib/rehype-inline-diagrams.mjs'
import { readPublication } from './scripts/lib/seo-publications.mjs'

const writingDir = 'src/content/writing'
const postDates = new Map()
for (const file of (await readdir(writingDir)).filter((file) => /\.mdx?$/.test(file))) {
  const post = readPublication(await readFile(`${writingDir}/${file}`, 'utf8'), 'writing', file)
  if (post) postDates.set(`/writing/${file.replace(/\.mdx?$/, '')}/`, post.datePublished)
}

export default defineConfig({
  site: 'https://raghib.io',
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => new URL(page).pathname.replace(/\/$/, '') !== '/about',
      serialize: (item) => ({ ...item, lastmod: postDates.get(new URL(item.url).pathname) ?? item.lastmod }),
    }),
    {
      name: 'sitemap-xml',
      hooks: {
        // Crawlers probe /sitemap.xml by default. Runs after sitemap(), which writes one urlset below 45,000 URLs.
        'astro:build:done': ({ dir }) => copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir)),
      },
    },
  ],
  markdown: {
    // Shiki must skip mermaid blocks, otherwise it highlights them into markup
    // that rehype-mermaid can no longer recognise as a diagram.
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      theme: 'github-dark-default',
    },
    // Diagrams render to plain SVG during the build, so published pages ship no
    // diagramming runtime. Colours follow the tokens in src/styles/theme.css.
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          mermaidConfig: {
            theme: 'base',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            themeCSS: `
              .node rect, .node circle, .node ellipse, .node polygon, .node path {
                fill: var(--theme-surface) !important;
                stroke: var(--theme-rule-strong) !important;
              }
              .label, .label text, span, .cluster-label, .flowchartTitleText {
                fill: var(--theme-text) !important;
                color: var(--theme-text) !important;
              }
              .flowchart-link, .edgePaths .path { stroke: var(--theme-muted) !important; }
              .marker { fill: var(--theme-muted) !important; stroke: var(--theme-muted) !important; }
              .edgeLabel, .edgeLabel p, .labelBkg { background-color: var(--theme-bg) !important; }
              .cluster rect { fill: var(--theme-bg) !important; stroke: var(--theme-rule-strong) !important; }
            `,
            themeVariables: {
              background: '#000000',
              mainBkg: '#181818',
              primaryColor: '#181818',
              primaryTextColor: '#ffffff',
              primaryBorderColor: '#424242',
              secondaryColor: '#181818',
              tertiaryColor: '#000000',
              lineColor: '#b9b9b9',
              textColor: '#ffffff',
              nodeTextColor: '#ffffff',
              fontSize: '14px',
            },
          },
        },
      ],
      rehypeParts,
      rehypeInlineDiagrams,
    ],
  },
})
