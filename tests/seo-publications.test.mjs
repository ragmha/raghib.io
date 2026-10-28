import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { assertPublicationsMatch, readPublication } from '../scripts/lib/seo-publications.mjs'

test('publication checks read actual YAML, preserving the headline and optional search title', () => {
  const publication = readPublication(`---
title: "Systems: a practical account"
seoTitle: "Practical systems"
description: >-
  A practical account of software
  decisions and their consequences.
date: 2026-09-18
published: true
---
The article explains a concrete engineering decision.
`, 'writing', 'example.mdx')
  assert.deepEqual(publication, {
    collection: 'writing',
    headline: 'Systems: a practical account',
    searchTitle: 'Practical systems',
    description: 'A practical account of software decisions and their consequences.',
    datePublished: '2026-09-18T00:00:00.000Z',
  })
})

const source = (fields = '', body = 'A practical engineering account.') => `---
title: Example
description: An example publication.
date: "2026-09-18"
${fields}
---
${body}
`

test('publication defaults match the writing and project-writeup collections', () => {
  assert.ok(readPublication(source(), 'writing', 'example.mdx'))
  assert.equal(readPublication(source('published: false'), 'writing', 'draft.mdx'), null)
  assert.equal(readPublication(source(), 'projectWriteups', 'project.mdx'), null)
  assert.ok(readPublication(source('published: true'), 'projectWriteups', 'project.mdx'))
})

test('published content rejects empty bodies and invalid frontmatter instead of being skipped', () => {
  assert.throws(() => readPublication(source('', ''), 'writing', 'empty.mdx'), /article body/)
  assert.throws(() => readPublication(source('seoTitle: "  "'), 'writing', 'empty.mdx'), /seoTitle/)
  assert.throws(() => readPublication(source('published: "true"'), 'writing', 'invalid.mdx'), /boolean/)
  assert.throws(() => readPublication(source().replace('An example publication.', ' '), 'writing', 'invalid.mdx'), /description/)
  assert.throws(() => readPublication(source().replace('2026-09-18', 'not-a-date'), 'writing', 'invalid.mdx'), /date/)
  assert.throws(() => readPublication('No frontmatter', 'writing', 'invalid.mdx'), /frontmatter/)
  assert.throws(() => readPublication(source('title: Duplicate'), 'writing', 'invalid.mdx'), /unique/)
})

test('published content rejects bodies containing only whitespace and HTML comments', () => {
  for (const body of [
    ' \t\r\n ',
    '<!-- -->',
    '<!-- An unpublished note. -->',
    '\n<!-- A multiline\nnote. -->\n<!-- Another note. -->\t',
    '<!-- First note. --><!-- Second note. -->',
  ]) {
    assert.throws(() => readPublication(source('', body), 'writing', 'comments.mdx'), /article body/)
  }
})

test('published content keeps its search title to 44 characters', () => {
  assert.ok(readPublication(source(`seoTitle: "${'x'.repeat(44)}"`), 'writing', 'fits.mdx'))
  assert.throws(() => readPublication(source(`seoTitle: "${'x'.repeat(45)}"`), 'writing', 'long.mdx'), /44/)
  assert.throws(() => readPublication(source().replace('title: Example', `title: ${'x'.repeat(45)}`), 'writing', 'long.mdx'), /44/)
  const longHeadline = source('seoTitle: Short\npublished: true').replace('title: Example', `title: ${'x'.repeat(60)}`)
  assert.ok(readPublication(longHeadline, 'projectWriteups', 'long-headline.mdx'))
})

test('every published post and project writeup passes the publication checks', () => {
  for (const [collection, folder] of [['writing', 'writing'], ['projectWriteups', 'project-writeups']]) {
    const dir = new URL(`../src/content/${folder}/`, import.meta.url)
    for (const file of readdirSync(dir).filter((name) => /\.mdx?$/.test(name))) {
      readPublication(readFileSync(new URL(file, dir), 'utf8'), collection, file)
    }
  }
})

test('published content accepts text before, between and after HTML comments', () => {
  for (const body of [
    'Visible text.<!-- A note. -->',
    '<!-- A note. -->Visible text.',
    '<!-- First note. -->\nVisible text.\n<!-- Last note. -->',
    '<!-- A note. --><p>Visible text.</p>',
  ]) {
    assert.ok(readPublication(source('', body), 'writing', 'article.mdx'))
  }
})

test('body validation treats comment-delimiter fragments as their original text', () => {
  const body = '<!<!-- A note. -->--This is not a comment in the source.-->'
  assert.ok(readPublication(source('', body), 'writing', 'fragments.mdx'))
})

test('the gate rejects missing publications, leaked drafts and changed metadata', () => {
  const publication = readPublication(source(), 'writing', 'example.mdx')
  assertPublicationsMatch([publication], [{ ...publication }])
  assert.throws(() => assertPublicationsMatch([publication], []), /published source entries/)
  assert.throws(() => assertPublicationsMatch([], [publication]), /exclude drafts/)
  assert.throws(() => assertPublicationsMatch([publication], [{ ...publication, description: 'Wrong description' }]), /published source entries/)
  assertPublicationsMatch([], [])
})
