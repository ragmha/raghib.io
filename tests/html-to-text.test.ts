import assert from 'node:assert/strict'
import { test } from 'node:test'
import { htmlToText } from '../src/lib/html-to-text'

test('htmlToText keeps prose and code, drops diagrams and markup', () => {
  assert.equal(
    htmlToText('<h2>Title</h2><p>A &amp; B<br>next</p><svg><text>label</text></svg><pre><code>Promise&lt;void&gt;</code></pre>'),
    'Title\n\nA & B\n\nnext\n\nPromise<void>',
  )
})

test('htmlToText leaves no tags behind for nested or broken markup', () => {
  for (const html of ['<scr<script>ipt>x</script>', '<<svg></svg>script>', '<s<style>a</style>cript>', '<a title="1>2">t</a>']) {
    assert.doesNotMatch(htmlToText(html), /<[a-z/]/i, html)
  }
})
