import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { indexWritingPosts } from '../src/lib/writing-index'

const entry = (id: string, published: boolean, date: string) => ({
  id,
  data: { published, date: new Date(date) },
  body: `Content for ${id}`,
})

test('writing selection excludes drafts by default and sorts published posts newest first', () => {
  const older = entry('older', true, '2026-09-01')
  const newer = entry('newer', true, '2026-09-10')
  const draft = entry('draft', false, '2026-10-08')
  const entries = [older, draft, newer]

  assert.deepEqual(indexWritingPosts(entries), [newer, older])
  assert.deepEqual(entries, [older, draft, newer])
  assert.deepEqual(indexWritingPosts([draft]), [])
})

test('explicit local preview includes a draft without publishing or modifying it', () => {
  const draft = entry('draft', false, '2026-10-08')
  const post = entry('published', true, '2026-09-01')

  assert.deepEqual(indexWritingPosts([post, draft], { includeDrafts: true }), [draft, post])
  assert.equal(draft.data.published, false)
  assert.deepEqual(indexWritingPosts([post, draft], { includeDrafts: false }), [post])
})

test('only the article route opts into development drafts and marks them noindex', () => {
  const article = readFileSync(new URL('../src/pages/writing/[slug].astro', import.meta.url), 'utf8')
  assert.match(article, /getVisiblePosts\(\{ includeDrafts: import\.meta\.env\.DEV \}\)/)
  assert.match(article, /noindex=\{!post\.data\.published\}/)
  assert.match(article, /!post\.data\.published &&/)
  assert.match(article, /Draft preview — not published/)

  for (const file of ['index.astro', 'writing/index.astro', 'writing/feed.xml.ts']) {
    const source = readFileSync(new URL(`../src/pages/${file}`, import.meta.url), 'utf8')
    assert.match(source, /getPublishedPosts\(\)/)
    assert.doesNotMatch(source, /getVisiblePosts|includeDrafts/)
  }
})
