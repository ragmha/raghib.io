import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { VFile } from 'vfile'
import rehypeRstackLinks from '../src/lib/rehype-rstack-links.mjs'
import { rstackUrl } from '../src/lib/rstack.mjs'

function rewrite(href, rstack) {
  const link = { type: 'element', tagName: 'a', properties: { href }, children: [] }
  const file = new VFile({ data: { astro: { frontmatter: { rstack } } } })
  rehypeRstackLinks()({ type: 'root', children: [link] }, file)
  return link.properties.href
}

test('rstack shorthand expands to the declared release and leaves ordinary links alone', () => {
  for (const [path, view] of [
    ['skills/diagnose', 'tree'],
    ['agents/reviewer.md', 'blob'],
    ['agents/reviewer.agent.md', 'blob'],
    ['workflows/issue-triage.md', 'blob'],
    ['workflows/ci.yml', 'blob'],
    ['workflows/ci.yaml', 'blob'],
  ]) {
    assert.equal(rewrite(`rstack:${path}`, { version: 'v0.2.0', uses: [path] }),
      `https://github.com/ragmha/rstack/${view}/v0.2.0/${path}`)
  }
  assert.equal(rewrite('https://example.com'), 'https://example.com')
})

test('unlisted rstack references fail compilation', () => {
  assert.throws(() => rewrite('rstack:skills/tdd', {
    version: 'v0.2.0', uses: ['skills/diagnose'],
  }), /must be listed in rstack.uses/)
})

test('rstack shorthand without a version fails compilation', () => {
  for (const rstack of [undefined, { uses: ['skills/diagnose'] }]) {
    assert.throws(() => rewrite('rstack:skills/diagnose', rstack), /require rstack.version/)
  }
})

test('rstack URLs reject unpinned releases and invalid paths', () => {
  for (const version of ['main', 'v0.2', undefined]) {
    assert.throws(() => rstackUrl(version, 'skills/diagnose'), /release tag/)
  }
  for (const path of [
    'skills/../tdd', 'skills/TDD', 'skills/tdd#section', 'tools/tdd',
    'agents/reviewer', 'workflows/issue-triage', 'workflows/ci.yaml/extra', undefined,
  ]) {
    assert.throws(() => rstackUrl('v0.2.0', path), /Invalid rstack path/)
  }
})

test('weekly URL extraction covers both collections and ignores shorthand inside examples', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rstack-urls-'))
  try {
    for (const [collection, path] of [
      ['writing', 'skills/diagnose'],
      ['project-writeups', 'agents/reviewer.agent.md'],
    ]) {
      const content = join(directory, 'src/content', collection, 'nested')
      mkdirSync(content, { recursive: true })
      writeFileSync(join(content, 'example.mdx'),
        `---\nrstack:\n  version: v0.2.0\n  uses: [${path}]\n---\n` +
        '`[example](rstack:workflows/not-a-real-workflow.md)`\n')
    }
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('../scripts/rstack-urls.mjs', import.meta.url)),
    ], { cwd: directory, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.stdout.trim().split('\n').sort(), [
      'https://github.com/ragmha/rstack/blob/v0.2.0/agents/reviewer.agent.md',
      'https://github.com/ragmha/rstack/tree/v0.2.0/skills/diagnose',
    ])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
