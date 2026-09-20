import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import rehypeParts from './src/lib/rehype-parts.mjs'

export default defineConfig({
  site: 'https://raghib.io',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
    rehypePlugins: [rehypeParts],
  },
})
