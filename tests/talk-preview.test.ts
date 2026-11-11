import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractCoverSlide } from '../src/lib/talk-preview'

test('a locked talk preview contains only the cover slide', () => {
  const markdown = `---
title: Example talk
---
## Public cover
Presenter

---
## Hidden slide
Private slide content
`

  const cover = extractCoverSlide(markdown)
  assert.match(cover, /Public cover/)
  assert.doesNotMatch(cover, /Hidden slide|Private slide content/)
})
