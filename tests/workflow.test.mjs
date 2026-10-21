import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { parse } from 'yaml'

const workflow = parse(readFileSync(new URL('../.github/workflows/seo.yml', import.meta.url), 'utf8'))

test('the required SEO check runs on PRs, merge queues, and main pushes', () => {
  assert.deepEqual(workflow.on.pull_request.branches, ['main'])
  assert.ok(Object.hasOwn(workflow.on, 'merge_group'))
  assert.deepEqual(workflow.on.push.branches, ['main'])
  assert.equal(workflow.jobs.seo.name, 'SEO readiness')
})

test('site audits pass before the main-branch artifact can deploy', () => {
  const job = workflow.jobs.seo
  const steps = job.steps
  const upload = steps.findIndex(step => step.uses?.startsWith('actions/upload-pages-artifact'))
  for (const command of ['bun test --bail --timeout 20000', 'bun run build', 'bun run check:seo', 'bun run check:vitals']) {
    const index = steps.findIndex(step => step.run === command)
    assert.ok(index >= 0 && index < upload, `${command} must pass before artifact upload`)
  }
  assert.equal(steps[upload].if, "github.ref == 'refs/heads/main'")
  assert.equal(workflow.jobs.deploy.needs, 'seo')
  assert.equal(workflow.jobs.deploy.if, "github.ref == 'refs/heads/main'")
})

test('release checks skip only PRs that stay outside the release lane', () => {
  assert.equal(workflow.jobs.seo.needs, 'lanes')
  assert.equal(workflow.jobs.seo.if, "${{ !cancelled() && needs.lanes.outputs.release != 'false' }}")
  const script = workflow.jobs.lanes.steps[0].run
  const output = join(process.cwd(), `.test-lanes-${process.pid}`)
  const lane = (pr, files) => {
    writeFileSync(output, '')
    const result = spawnSync('bash', ['--noprofile', '--norc', '-e', '-c', `gh() { printf '%s\\n' "$MOCK_FILES"; }\n${script}`], {
      encoding: 'utf8',
      env: { ...process.env, PR: pr, MOCK_FILES: files.join('\n'), GITHUB_OUTPUT: output, GITHUB_REPOSITORY: 'o/r' },
    })
    assert.equal(result.status, 0, result.stderr)
    return readFileSync(output, 'utf8').trim()
  }
  try {
    assert.equal(lane('', []), 'release=true')
    assert.equal(lane('7', ['.agents/skills/x/SKILL.md', 'AGENTS.md', 'README.md']), 'release=false')
    assert.equal(lane('7', ['AGENTS.md', 'src/pages/index.astro']), 'release=true')
    assert.equal(lane('7', ['.github/workflows/seo.yml']), 'release=true')
    assert.equal(lane('7', ['docs/README.md']), 'release=true')
  } finally {
    rmSync(output, { force: true })
  }
})

test('link check creates an issue once and edits it only when findings change', () => {
  const linkWorkflow = parse(readFileSync(new URL('../.github/workflows/link-check.yml', import.meta.url), 'utf8'))
  const script = linkWorkflow.jobs.links.steps.find(step => step.run).run
  const directory = join(process.cwd(), `.test-link-check-${process.pid}`)
  rmSync(directory, { recursive: true, force: true })
  try {
    mkdirSync(join(directory, 'src/content/writing'), { recursive: true })
    mkdirSync(join(directory, 'src/content/project-writeups'), { recursive: true })
    writeFileSync(join(directory, 'README.md'), 'https://example.com/broken')
    const log = join(directory, 'calls.txt')
    writeFileSync(log, '')
    const mocks = `
      curl() { printf '%s' "$MOCK_STATUS"; }
      gh() {
        case "$2" in
          list)
            [[ "$*" == *"--author github-actions[bot]"* ]] || return 2
            [[ "$*" == *'select(.title == "Broken links")'* ]] || return 2
            printf '%s' "$MOCK_ISSUE"
            ;;
          view) printf '%s' "$MOCK_BODY" ;;
          edit|create) printf '%s\\n' "$*" >> "$MOCK_LOG" ;;
          *) return 2 ;;
        esac
      }
    `
    const run = (status, issue = '', body = '') => spawnSync(
      'bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', `${mocks}\n${script}`],
      {
        cwd: directory,
        encoding: 'utf8',
        env: { ...process.env, MOCK_STATUS: status, MOCK_ISSUE: issue, MOCK_BODY: body, MOCK_LOG: log },
      },
    )
    const finding = '- `404` https://example.com/broken'

    assert.equal(run('200').status, 0)
    assert.equal(readFileSync(log, 'utf8'), '')

    assert.equal(run('404', '42', finding).status, 0)
    assert.equal(readFileSync(log, 'utf8'), '')

    assert.equal(run('404', '42', 'old finding').status, 0)
    assert.match(readFileSync(log, 'utf8'), /issue edit 42 --body-file broken\.txt/)

    writeFileSync(log, '')
    assert.equal(run('404').status, 0)
    assert.match(readFileSync(log, 'utf8'), /issue create --title Broken links --body-file broken\.txt/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
