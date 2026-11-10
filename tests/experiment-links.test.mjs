import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import config from '../astro.config.mjs'
import experiments from '../apps/experiments/astro.config.mjs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('experiments are pages at /experiments/ in the site build, not redirects', () => {
  assert.equal(config.redirects, undefined)
  assert.ok(read('../src/components/SiteNav.astro').includes('href="/experiments/"'), 'nav must link to the experiments')
  assert.ok(read('../src/pages/writing/[slug].astro').includes('href={`/experiments/${post.data.lab}/`}'))
  assert.equal(experiments.site, config.site)
  assert.equal(experiments.base, '/experiments')
  assert.match(JSON.parse(read('../package.json')).scripts.build, /^bun run --filter experiments build && /)
  assert.ok(config.integrations.some((integration) => integration.name === 'experiments'), 'the build ships apps/experiments/dist')
})
