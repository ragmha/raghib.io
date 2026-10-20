import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import config from '../astro.config.mjs'

const slugs = ['chess', 'context-autopsy', 'session-flame', 'token-diet']

test('the experiment directory links to the lab and old app routes use native redirects', () => {
  const directory = readFileSync(new URL('../src/pages/experiments/index.astro', import.meta.url), 'utf8')
  for (const slug of slugs) {
    const destination = `https://lab.raghib.io/${slug}/`
    assert.ok(directory.includes(`href="${destination}"`), `${slug} must link directly to the lab`)
    assert.equal(config.redirects[`/experiments/${slug}/`], destination)
    assert.equal(existsSync(new URL(`../src/pages/experiments/${slug}.astro`, import.meta.url)), false)
  }
  assert.equal((directory.match(/href="https:\/\/lab\.raghib\.io\//g) ?? []).length, 4)
  assert.equal(existsSync(new URL('../public/experiments/', import.meta.url)), false, 'experiment assets belong in the lab')
})
