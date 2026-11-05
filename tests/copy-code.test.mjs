import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../src/scripts/copy-code.js', import.meta.url), 'utf8')

function page(clipboard) {
  const elements = []
  const errors = []
  const pre = { append: (controls) => { pre.controls = controls } }
  const code = { textContent: 'const x = "<value>";\n  x\n', parentElement: pre }
  runInNewContext(source, {
    document: {
      querySelectorAll: (selector) => {
        assert.equal(selector, '.prose pre > code')
        return [code]
      },
      createElement: (tag) => {
        const element = {
          tag, attributes: {}, children: [],
          setAttribute(key, value) { this.attributes[key] = value },
          append(...children) { this.children.push(...children) },
          addEventListener(event, callback) {
            assert.equal(event, 'click')
            this.click = callback
          },
        }
        elements.push(element)
        return element
      },
    },
    navigator: { clipboard },
    console: { error: (...args) => errors.push(args) },
  })
  return { button: elements[1], status: elements[2], code, pre, errors }
}

test('copy preserves exact code text, announces success, and remains retryable', async () => {
  let copied
  const p = page({ writeText: async (text) => { copied = text } })
  assert.equal(p.button.type, 'button')
  assert.equal(p.button.attributes['aria-label'], 'Copy code example 1')
  assert.equal(p.status.attributes.role, 'status')
  assert.equal(p.pre.controls.children[1], p.button)
  await p.button.click()
  assert.equal(copied, p.code.textContent)
  assert.equal(p.status.textContent, 'Copied!')
  assert.equal(p.button.disabled, false)
  assert.equal(p.errors.length, 0)
})

test('denied and unavailable clipboard show manual-copy guidance without losing code', async () => {
  for (const clipboard of [undefined, { writeText: async () => { throw new Error('Denied') } }]) {
    const p = page(clipboard)
    await p.button.click()
    assert.match(p.status.textContent, /Copy failed.*copy manually/)
    assert.equal(p.button.disabled, false)
    assert.equal(p.errors.length, 1)
    assert.equal(p.code.textContent, 'const x = "<value>";\n  x\n')
  }
})
