import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import rehypeMermaid from 'rehype-mermaid'
import rehypeParts from './src/lib/rehype-parts.mjs'

export default defineConfig({
  site: 'https://raghib.io',
  integrations: [mdx()],
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
    // diagramming runtime. Colours mirror the tokens in src/styles/global.css.
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          mermaidConfig: {
            theme: 'base',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            themeVariables: {
              background: '#11120f',
              mainBkg: '#181a16',
              primaryColor: '#181a16',
              primaryTextColor: '#e7e9e2',
              primaryBorderColor: '#2a2d27',
              secondaryColor: '#181a16',
              tertiaryColor: '#11120f',
              lineColor: '#8d9287',
              textColor: '#c9ccc3',
              nodeTextColor: '#e7e9e2',
              fontSize: '14px',
            },
          },
        },
      ],
      rehypeParts,
    ],
  },
})
