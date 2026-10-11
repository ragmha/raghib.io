import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse } from 'yaml'

const workflow = parse(readFileSync(new URL('../.github/workflows/seo.yml', import.meta.url), 'utf8'))

test('the required SEO check runs for all PR changes and merge-queue builds', () => {
  assert.deepEqual(workflow.on.pull_request.branches, ['main'])
  assert.ok(Object.hasOwn(workflow.on, 'merge_group'))
  assert.equal(workflow.on.pull_request.paths, undefined)
  assert.equal(workflow.on.pull_request['paths-ignore'], undefined)
  assert.equal(workflow.jobs.seo.name, 'SEO readiness')
})

test('the SEO gate audits a fresh build and cannot ignore audit failures', () => {
  const job = workflow.jobs.seo
  const commands = job.steps.map((step) => step.run)
  const build = commands.indexOf('bun run build')
  const audit = commands.indexOf('bun run check:seo')
  assert.ok(build >= 0 && audit > build)
  assert.ok(commands.includes('bun test --bail'))
  assert.ok(job['continue-on-error'] === undefined || job['continue-on-error'] === false)
  for (const step of job.steps) {
    assert.ok(step['continue-on-error'] === undefined || step['continue-on-error'] === false)
  }
})

test('both workflows install Chromium before browser-dependent builds', () => {
  for (const [file, jobName] of [['seo.yml', 'seo'], ['deploy.yml', 'build']]) {
    const configuration = parse(readFileSync(
      new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8',
    ))
    const commands = configuration.jobs[jobName].steps.map((step) => step.run)
    const dependencies = commands.indexOf('bun install --frozen-lockfile')
    const chromium = commands.indexOf('bunx playwright install --with-deps chromium')
    const build = commands.indexOf('bun run build')
    const audit = commands.indexOf('bun run check:seo')

    assert.ok(dependencies >= 0 && chromium > dependencies, `${file}: install dependencies before Chromium`)
    assert.ok(build > chromium, `${file}: Chromium must be available when the build renders Mermaid`)
    assert.ok(audit > build, `${file}: audit the completed production build`)
  }
})
