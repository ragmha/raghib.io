import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeSection, railPosition } from '../src/lib/reading-progress.mjs'

const points = [
  { documentY: 100, railY: 0 },
  { documentY: 500, railY: 80 },
  { documentY: 700, railY: 120 },
  { documentY: 1500, railY: 180 },
]

test('active section tracks title, headings, and subsections in either scroll direction', () => {
  const positions = points.map(({ documentY }) => documentY)
  for (const [top, expected] of [[0, 0], [499, 0], [500, 1], [700, 2], [1600, 3], [600, 1], [100, 0]]) {
    assert.equal(activeSection(positions, top), expected)
  }
})

test('rail position interpolates within each section, including different lengths', () => {
  assert.equal(railPosition(points, 300), 40)
  assert.equal(railPosition(points, 600), 100)
  assert.equal(railPosition(points, 1100), 150)
})

test('viewport segment spans the visible portion of the article', () => {
  const start = railPosition(points, 300)
  const end = railPosition(points, 1100)
  assert.equal(start, 40)
  assert.equal(end - start, 110)
})

test('positions clamp before the title and beyond the article end', () => {
  assert.equal(railPosition(points, -100), 0)
  assert.equal(railPosition(points, 2000), 180)
})

test('empty, single, and coincident anchors remain finite', () => {
  assert.equal(railPosition([], 0), 0)
  assert.equal(railPosition([points[0]], 2000), 0)
  assert.equal(railPosition([{ documentY: 100, railY: 0 }, { documentY: 100, railY: 20 }, { documentY: 200, railY: 40 }], 150), 30)
})
