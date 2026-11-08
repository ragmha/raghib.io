import assert from 'node:assert/strict'
import { test } from 'node:test'
import { open, seal } from '../src/lib/talk-lock'

test('a locked deck opens with its code and rejects any other', async () => {
  const deck = '<section>slide ✓</section>'.repeat(5000)
  const sealed = await seal(deck, 'view-code')
  assert.ok(!sealed.includes('slide'))
  assert.equal(await open(sealed, ' view-code '), deck)
  await assert.rejects(open(sealed, 'wrong-code'))
})
