import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse } from 'yaml'

const read = (name) => parse(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8'))
const gate = read('seo.yml')
const deploy = read('deploy.yml')

test('the Core Web Vitals gate audits a fresh build inside the required check', () => {
  const job = gate.jobs.seo
  assert.equal(job.name, 'SEO readiness')
  const commands = job.steps.map((step) => step.run)
  const build = commands.indexOf('bun run build')
  const vitals = commands.indexOf('bun run check:vitals')
  assert.ok(build >= 0 && vitals > build, 'Core Web Vitals must be measured against the built site')
  assert.ok(commands.indexOf('bunx playwright install --with-deps chromium') < vitals)
})

test('a page experience regression cannot reach production', () => {
  const build = deploy.jobs.build
  const commands = build.steps.map((step) => step.run)
  const vitals = commands.indexOf('bun run check:vitals')
  assert.ok(vitals > commands.indexOf('bun run build'))
  const upload = build.steps.findIndex((step) => step.uses?.startsWith('actions/upload-pages-artifact'))
  assert.ok(upload > vitals, 'The vitals gate must run before the build artifact is published')
  assert.equal(deploy.jobs.deploy.needs, 'build')
})

test('the vitals gate cannot ignore its own failures', () => {
  for (const job of [gate.jobs.seo, deploy.jobs.build]) {
    assert.ok(job['continue-on-error'] === undefined || job['continue-on-error'] === false)
    for (const step of job.steps) {
      assert.ok(step['continue-on-error'] === undefined || step['continue-on-error'] === false)
    }
  }
})
