import { defineConfig } from 'astro/config'

// Served at raghib.io/experiments/: the root build copies dist/ into the site's dist/experiments/.
export default defineConfig({
  site: 'https://raghib.io',
  base: '/experiments',
  output: 'static',
  trailingSlash: 'always',
})
