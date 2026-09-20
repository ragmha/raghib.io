import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import rehypeParts from './src/lib/rehype-parts.mjs'

export default defineConfig({
  site: 'https://raghib.io',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => new URL(page).pathname.replace(/\/$/, '') !== '/about',
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
    rehypePlugins: [rehypeParts],
  },
})
