import { defineConfig } from 'astro/config'

// Served at raghib.io/experiments/: builds into the site's dist next to the blog.
export default defineConfig({
  site: 'https://raghib.io',
  base: '/experiments',
  outDir: '../../dist/experiments',
  output: 'static',
  trailingSlash: 'always',
})
