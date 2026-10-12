import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decisionHeroSvg } from '../src/lib/decision-hero.mjs'

test('decision hero explains the illustrative decision and three routes', () => {
  assert.ok(/class="[^"]*decision-hero-svg"/.test(decisionHeroSvg), 'SVG has its hero class')
  assert.ok(decisionHeroSvg.includes('role="img" aria-label="An isometric AI workbench'), 'SVG has an accessible description')
  for (const label of [
    'REQUEST + EVIDENCE',
    'SMALL DECISION MODEL',
    'IF / THEN',
    'LARGE MODEL',
    'p >= 0.90  GENERATE',
    '0.60-0.90  REVIEW',
    'p < 0.60  STOP',
  ]) {
    assert.ok(decisionHeroSvg.includes(label), `SVG includes ${label}`)
  }
  assert.ok(!/NaN|undefined|<script|https?:\/\/(?!www\.w3\.org)/.test(decisionHeroSvg), 'SVG has no invalid output')
})
