import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getProjectLinks } from '../src/lib/project-links'
import { projectSnapshot } from '../src/content/project-snapshot'

const project = {
  name: 'sample',
  description: 'A project.',
  url: 'https://github.com/example/sample',
}

test('selected projects retain the published tutorial and lab without duplicate entries', () => {
  assert.equal(new Set(projectSnapshot.map((project) => project.name)).size, projectSnapshot.length)
  const harness = projectSnapshot.find((project) => project.name === 'build-your-harness')
  const lab = projectSnapshot.find((project) => project.name === 'lab')
  assert.ok(harness)
  assert.ok(lab)
  assert.ok(getProjectLinks(harness).some((link) => link.url === 'https://raghib.io/writing/build-your-agent-harness/'))
  assert.equal(lab.homepage, 'https://lab.raghib.io/')
})

test('Source is always shown without placeholders for missing optional links', () => {
  assert.deepEqual(getProjectLinks(project), [{ label: 'Source', url: project.url }])
})

test('Live demo and individually labeled extras follow Source', () => {
  const extraLinks = [
    { label: 'YouTube', url: 'https://www.youtube.com/watch?v=example' },
    { label: 'Chrome Web Store', url: 'https://chromewebstore.google.com/detail/example' },
  ]
  assert.deepEqual(getProjectLinks({
    ...project, homepage: 'https://example.com/demo', extraLinks,
  }), [
    { label: 'Source', url: project.url },
    { label: 'Live demo', url: 'https://example.com/demo' },
    ...extraLinks,
  ])
})

test('extras are available even when there is no live demo', () => {
  const extraLinks = [{ label: 'Documentation', url: 'https://example.com/docs' }]
  assert.equal(getProjectLinks({ ...project, extraLinks }).length, 2)
})

test('invalid destinations and empty labels fail visibly', () => {
  for (const link of [
    { label: 'Bad URL', url: 'not-a-url' },
    { label: 'Unsafe URL', url: 'javascript:alert(1)' },
    { label: ' ', url: 'https://example.com' },
  ]) {
    assert.throws(() => getProjectLinks({ ...project, extraLinks: [link] }), /Project "sample"/)
  }
})
