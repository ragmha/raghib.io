import assert from 'node:assert/strict'
import { test } from 'node:test'
import { indexProjectWriteups } from '../src/lib/project-writeup-index'

const projects = [{ name: 'sample-project', description: 'Sample', url: 'https://example.com/repo' }]
const entry = (published: boolean, project = 'sample-project', id = 'sample') => ({
  id, data: { project, published }, body: 'The reasoning behind this project.',
})

test('published writeups use the exact project-specific route and preserve entry content', () => {
  const writeup = entry(true)
  const [result] = indexProjectWriteups([writeup], projects)
  assert.equal(result.href, '/project/sample-project/writings/')
  assert.equal(result.writeup, writeup)
  assert.equal(result.project, projects[0])
})

test('drafts and projects with no writeup generate no routes or links', () => {
  assert.deepEqual(indexProjectWriteups([entry(false)], projects), [])
  assert.deepEqual(indexProjectWriteups([], projects), [])
})

test('explicit draft preview includes drafts without marking them published', () => {
  const draft = entry(false)
  const [result] = indexProjectWriteups([draft], projects, { includeDrafts: true })
  assert.equal(result.href, '/project/sample-project/writings/')
  assert.equal(result.writeup.data.published, false)
  assert.deepEqual(indexProjectWriteups([draft], projects, { includeDrafts: false }), [])
})

test('unknown project names fail explicitly, including in drafts', () => {
  assert.throws(() => indexProjectWriteups([entry(false, 'unknown')], projects), /unknown project/)
})

test('multiple entries for a project fail even if one is a draft', () => {
  assert.throws(
    () => indexProjectWriteups([entry(true), entry(false, 'sample-project', 'other')], projects),
    /Multiple writeups/,
  )
})
