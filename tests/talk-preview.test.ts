import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractCoverSlide } from '../src/lib/talk-preview'

for (const separator of ['---', '***', '___', '- - -']) {
  test(`a locked talk preview stops at a ${separator} slide break`, () => {
    const markdown = `---
title: Example talk
---
## Public cover
Presenter

${separator}
## Hidden slide
Private slide content
`

    const cover = extractCoverSlide(markdown)
    assert.match(cover, /Public cover/)
    assert.doesNotMatch(cover, /Hidden slide|Private slide content/)
  })
}
