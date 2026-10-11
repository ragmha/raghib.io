import assert from 'node:assert/strict'
import { test } from 'node:test'
import rehypeParts from '../src/lib/rehype-parts.mjs'

test('section dividers preserve headings and anchors without numbers or permanent marks', () => {
  const content = [{ type: 'text', value: 'A section' }]
  const list = {
    type: 'element', tagName: 'ol', properties: {},
    children: [{ type: 'element', tagName: 'li', properties: {}, children: [{ type: 'text', value: 'A real numbered step' }] }],
  }
  const tree = {
    type: 'root',
    children: [
      { type: 'element', tagName: 'h2', properties: { id: 'a-section' }, children: content },
      list,
      { type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'Another section' }] },
    ],
  }
  rehypeParts()(tree)
  assert.equal(tree.children.length, 5)
  assert.deepEqual(tree.children[0].properties, { className: ['part'] })
  assert.equal(tree.children[0].children.length, 1)
  const heading = tree.children[0].children[0]
  assert.equal(heading.tagName, 'h2')
  assert.equal(heading.properties.id, 'a-section')
  assert.equal(heading.children[0].tagName, 'span')
  assert.deepEqual(heading.children[0].properties.className, ['part-heading'])
  assert.deepEqual(heading.children[0].children, content)
  assert.equal(tree.children[1].tagName, 'hr')
  assert.equal(tree.children[2], list)
  assert.equal(tree.children[3].children[0].tagName, 'h2')
  assert.equal(tree.children[4].tagName, 'hr')
  assert(!JSON.stringify(tree).includes('folio'))
  assert(!JSON.stringify(tree).includes('"mark"'))
})
