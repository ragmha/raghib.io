import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'astro/zod'
import { createWritingSchema } from '../src/lib/writing-schema'
import { TOPICS } from '../src/lib/topics'

const schema = createWritingSchema(() => z.string())
const frontmatter = {
  title: 'A plain essay',
  description: 'An essay with no illustration.',
  date: '2026-11-08',
  topics: [TOPICS[0]],
}

test('writing frontmatter accepts an entry without a hero', () => {
  assert.equal(schema.safeParse(frontmatter).success, true)
})

test('writing frontmatter rejects an unknown declared hero', () => {
  assert.equal(schema.safeParse({ ...frontmatter, hero: 'unknown' }).success, false)
})
