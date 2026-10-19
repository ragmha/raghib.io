import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chance, diff, levelOf, load, tally, xpOf } from '../src/lib/hundred-shots'
import type { Target } from '../src/lib/hundred-shots'

const now = new Date('2026-10-17T10:00')
const ago = (n: number) => new Date(2026, 9, 17 - n, 12).toISOString()
const T = (t: Partial<Target>): Target => ({ id: crypto.randomUUID(), name: 'x', status: 'idea', created: '', ...t })
const list = [
  T({ name: 'A', status: 'won', shotAt: ago(1), work: true, life: true, ideas: true, audit: 'a', offer: 'o', r_referral: true }),
  T({ name: 'B', status: 'declined', shotAt: ago(2), lesson: 'lead with proof' }),
  T({ name: 'C', status: 'pitched', shotAt: ago(4) }),
  T({ name: 'D' }),
]

test('tally scores shots, streaks, xp, level and achievements', () => {
  const r = tally(list, now)
  assert.deepEqual(r.shots.map((t) => t.name), ['C', 'B', 'A'])
  assert.deepEqual([r.streak, r.best, r.replies, r.wins, r.lessons, r.picked], [2, 2, 2, 1, 1, 1])
  assert.equal(r.xp, 195 + 70 + 25)
  assert.deepEqual([r.level.n, r.level.title, r.level.next], [3, 'Auditor', 300])
  assert.deepEqual([...r.unlocked], ['pick', 'shot', 'reply', 'yes'])
})

test('a shot today extends the streak, levels up and unlocks', () => {
  const d = diff(tally(list, now), tally([...list, T({ status: 'pitched', shotAt: now.toISOString() })], now))
  assert.deepEqual([d.gain, d.levelUp, d.unlocked.map((a) => a.id)], [25, true, ['streak3']])
})

test('whitespace-only notes earn no XP and the top level has no next', () => {
  assert.equal(xpOf(T({ audit: '  ', offer: '\n', lesson: ' ' })), 0)
  assert.deepEqual([levelOf(6000).title, levelOf(6000).next], ['Free', undefined])
})

test('odds and import', () => {
  assert.deepEqual([chance(20, 0.05), chance(100, 0.05), chance(5, 0)], [64, 99, 0])
  assert.throws(() => load([{ nope: 1 }]))
  assert.throws(() => load({ name: 'not a list' }))
  const [t] = load([{ name: 'Z', status: 'bogus' }])
  assert.equal(t.status, 'idea')
  assert.ok(t.id && t.created)
})
