import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getProjectLinks } from '../src/lib/project-links'
import {
  buildProjectSnapshot,
  projectSnapshot,
} from '../src/content/project-snapshot'

const project = {
  name: 'sample',
  description: 'A project.',
  url: 'https://github.com/example/sample',
}

test('selected projects retain existing tutorials, writeups, and labs without duplicates', () => {
  const emptySync = buildProjectSnapshot([])
  assert.deepEqual(
    emptySync.map((project) => project.name),
    ['build-your-harness', 'experiments', 'apple-books-mcp'],
  )
  assert.equal(
    new Set(projectSnapshot.map((project) => project.name)).size,
    projectSnapshot.length,
  )
  const harness = projectSnapshot.find(
    (project) => project.name === 'build-your-harness',
  )
  const experiments = projectSnapshot.find(
    (project) => project.name === 'experiments',
  )
  const appleBooks = emptySync.find(
    (project) => project.name === 'apple-books-mcp',
  )
  assert.ok(harness)
  assert.ok(experiments)
  assert.ok(appleBooks)
  assert.ok(
    projectSnapshot.some((project) => project.name === 'apple-books-mcp'),
  )
  assert.ok(
    getProjectLinks(harness).some(
      (link) =>
        link.url === 'https://raghib.io/writing/build-your-agent-harness/',
    ),
  )
  assert.equal(experiments.homepage, 'https://raghib.io/experiments/')
})

test('syncing selected repositories with different capitalization preserves curated projects once', () => {
  const projects = buildProjectSnapshot([
    {
      ...project,
      name: 'Build-Your-Harness',
      url: 'https://github.com/RAGMHA/Build-Your-Harness.git/',
    },
    {
      ...project,
      name: 'Experiments',
      url: 'https://github.com/RAGMHA/Raghib.io/tree/main/apps/experiments/',
    },
    project,
  ])
  assert.deepEqual(
    projects.map((entry) => entry.name),
    ['build-your-harness', 'experiments', 'apple-books-mcp', 'sample'],
  )
  assert.ok(
    getProjectLinks(projects[0]).some((link) => link.label === 'Tutorial'),
  )
  assert.equal(projects[1].homepage, 'https://raghib.io/experiments/')
  assert.deepEqual(projects[3], project)
})

test('distinct repositories with conflicting display names fail instead of disappearing', () => {
  for (const name of [
    'experiments',
    'Experiments',
    'build-your-harness',
    'Build-Your-Harness',
  ]) {
    assert.throws(
      () =>
        buildProjectSnapshot([
          { ...project, name, url: `https://github.com/example/${name}` },
        ]),
      /Distinct repositories share project name/,
    )
  }
  assert.throws(
    () =>
      buildProjectSnapshot([
        project,
        {
          ...project,
          name: 'Sample',
          url: 'https://github.com/another/Sample',
        },
      ]),
    /Distinct repositories share project name/,
  )
})

test('synced repository identities are deduplicated and editorial overrides ignore capitalization', () => {
  const projects = buildProjectSnapshot([
    project,
    { ...project, name: 'Sample', url: 'https://github.com/EXAMPLE/Sample' },
    {
      ...project,
      name: 'apple-books-mcp',
      url: 'https://github.com/RAGMHA/Apple-Books-MCP.git/',
    },
  ])
  assert.deepEqual(
    projects.map((entry) => entry.name),
    ['build-your-harness', 'experiments', 'apple-books-mcp', 'sample'],
  )
  assert.equal(
    projects[2].description,
    'Connect AI assistants to your Apple Books library.',
  )
})

test('Source is always shown without placeholders for missing optional links', () => {
  assert.deepEqual(getProjectLinks(project), [
    { label: 'Source', url: project.url },
  ])
})

test('Live demo and individually labeled extras follow Source', () => {
  const extraLinks = [
    { label: 'YouTube', url: 'https://www.youtube.com/watch?v=example' },
    {
      label: 'Chrome Web Store',
      url: 'https://chromewebstore.google.com/detail/example',
    },
  ]
  assert.deepEqual(
    getProjectLinks({
      ...project,
      homepage: 'https://example.com/demo',
      extraLinks,
    }),
    [
      { label: 'Source', url: project.url },
      { label: 'Live demo', url: 'https://example.com/demo' },
      ...extraLinks,
    ],
  )
})

test('extras are available even when there is no live demo', () => {
  const extraLinks = [
    { label: 'Documentation', url: 'https://example.com/docs' },
  ]
  assert.equal(getProjectLinks({ ...project, extraLinks }).length, 2)
})

test('invalid destinations and empty labels fail visibly', () => {
  for (const link of [
    { label: 'Bad URL', url: 'not-a-url' },
    { label: 'Unsafe URL', url: 'javascript:alert(1)' },
    { label: ' ', url: 'https://example.com' },
  ]) {
    assert.throws(
      () => getProjectLinks({ ...project, extraLinks: [link] }),
      /Project "sample"/,
    )
  }
})
