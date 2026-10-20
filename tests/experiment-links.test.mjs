import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import config from '../astro.config.mjs'

const slugs = ['chess', 'context-autopsy', 'session-flame', 'token-diet']

test('experiments live in the lab: nav links there and old routes use native redirects', () => {
  const nav = readFileSync(new URL('../src/components/SiteNav.astro', import.meta.url), 'utf8')
  assert.ok(nav.includes('href="https://lab.raghib.io/"'), 'nav must link to the lab')
  assert.equal(config.redirects['/experiments/'], 'https://lab.raghib.io/')
  for (const slug of slugs) {
    assert.equal(config.redirects[`/experiments/${slug}/`], `https://lab.raghib.io/${slug}/`)
  }
  assert.equal(existsSync(new URL('../src/pages/experiments/', import.meta.url)), false, 'experiment pages belong in the lab')
  assert.equal(existsSync(new URL('../public/experiments/', import.meta.url)), false, 'experiment assets belong in the lab')
})
