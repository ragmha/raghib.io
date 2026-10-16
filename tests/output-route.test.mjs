import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { outputFileRoute } from '../scripts/lib/output-route.mjs'

test('build output routes are the same on Windows and POSIX', () => {
  for (const [file, expected] of [
    ['index.html', '/'],
    ['writing/index.html', '/writing/'],
    ['writing\\index.html', '/writing/'],
    ['writing/keep-shipping/index.html', '/writing/keep-shipping/'],
    ['writing\\keep-shipping\\index.html', '/writing/keep-shipping/'],
    ['project\\sample\\writings\\index.html', '/project/sample/writings/'],
    ['404.html', '/404.html'],
    ['writing/myindex.html', '/writing/myindex.html'],
  ]) {
    assert.equal(outputFileRoute(file), expected, file)
  }
})

test('both publication checks normalize filesystem paths before interpreting them as URLs', () => {
  for (const script of ['check-seo.mjs', 'check-web-vitals.mjs']) {
    const source = readFileSync(new URL(`../scripts/${script}`, import.meta.url), 'utf8')
    assert.match(source, /from '\.\/lib\/output-route\.mjs'/)
    assert.match(source, /outputFileRoute\(file\)/)
  }
})
