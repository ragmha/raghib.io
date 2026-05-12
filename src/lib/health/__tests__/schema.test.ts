import { describe, it, expect } from 'vitest'
import {
  STEP_GOAL,
  MAX_DAILY_STEPS,
  isValidDateString,
  isValidStepCount,
  isStepDay,
  parseStepDay,
  parseStepsFile,
  parseInsightsFile,
  clampInsights,
  findForbiddenKeys,
  SchemaError,
} from '@/lib/health/schema'

describe('schema constants', () => {
  it('exposes a sensible default step goal', () => {
    expect(STEP_GOAL).toBe(10_000)
    expect(MAX_DAILY_STEPS).toBe(200_000)
  })
})

describe('isValidDateString', () => {
  it.each(['2024-01-01', '2025-12-31', '2000-02-29'])('accepts %s', (s) => {
    expect(isValidDateString(s)).toBe(true)
  })

  it.each([
    '2024-1-1',
    '24-01-01',
    '2024/01/01',
    '2024-13-01',
    '2024-02-30',
    '2023-02-29',
    'not-a-date',
    null,
    undefined,
    1234,
    {},
  ])('rejects %p', (s) => {
    expect(isValidDateString(s)).toBe(false)
  })
})

describe('isValidStepCount', () => {
  it.each([0, 1, 8000, MAX_DAILY_STEPS])('accepts %d', (n) => {
    expect(isValidStepCount(n)).toBe(true)
  })

  it.each([-1, 1.5, MAX_DAILY_STEPS + 1, NaN, Infinity, '5', null, undefined])(
    'rejects %p',
    (n) => {
      expect(isValidStepCount(n)).toBe(false)
    }
  )
})

describe('isStepDay / parseStepDay', () => {
  it('accepts a valid entry', () => {
    const day = { date: '2024-05-01', steps: 8421 }
    expect(isStepDay(day)).toBe(true)
    expect(parseStepDay(day)).toEqual(day)
  })

  it('drops unknown keys silently when parsing', () => {
    const parsed = parseStepDay({
      date: '2024-05-01',
      steps: 100,
      source: 'iPhone',
      latitude: 12.3,
    })
    expect(parsed).toEqual({ date: '2024-05-01', steps: 100 })
  })

  it.each([
    { date: '2024-05-01' }, // missing steps
    { date: 'oops', steps: 1 },
    { date: '2024-05-01', steps: -1 },
    { date: '2024-05-01', steps: MAX_DAILY_STEPS + 1 },
    null,
    'string',
    [],
  ])('parseStepDay throws on %p', (input) => {
    expect(() => parseStepDay(input)).toThrow(SchemaError)
  })
})

describe('parseStepsFile', () => {
  it('accepts an empty file', () => {
    const file = { updatedAt: '2024-01-01T00:00:00Z', days: [] }
    expect(parseStepsFile(file)).toEqual(file)
  })

  it('accepts a populated file', () => {
    const file = {
      updatedAt: '2024-05-02T00:00:00Z',
      days: [
        { date: '2024-05-01', steps: 100 },
        { date: '2024-05-02', steps: 200 },
      ],
    }
    expect(parseStepsFile(file)).toEqual(file)
  })

  it.each([
    null,
    {},
    { updatedAt: 1, days: [] },
    { updatedAt: 'iso', days: 'not-array' },
    { updatedAt: 'iso', days: [{ date: 'oops', steps: 1 }] },
  ])('rejects %p', (input) => {
    expect(() => parseStepsFile(input)).toThrow(SchemaError)
  })
})

describe('parseInsightsFile', () => {
  it('truncates over-long fields rather than failing', () => {
    const big = 'x'.repeat(2000)
    const parsed = parseInsightsFile({
      generatedAt: '2024-01-01T00:00:00Z',
      weekly: big,
      monthly: big,
      yearly: big,
    })
    expect(parsed.weekly.length).toBe(400)
    expect(parsed.monthly.length).toBe(600)
    expect(parsed.yearly.length).toBe(800)
  })

  it.each([
    {},
    { generatedAt: 1, weekly: '', monthly: '', yearly: '' },
    { generatedAt: 'iso', weekly: '', monthly: '' }, // missing yearly
  ])('rejects %p', (input) => {
    expect(() => parseInsightsFile(input)).toThrow(SchemaError)
  })

  it('clampInsights leaves short strings untouched', () => {
    const tiny = {
      generatedAt: '2024-01-01T00:00:00Z',
      weekly: 'a',
      monthly: 'b',
      yearly: 'c',
    }
    expect(clampInsights(tiny)).toEqual(tiny)
  })
})

describe('findForbiddenKeys', () => {
  it('returns empty for a clean payload', () => {
    expect(
      findForbiddenKeys({ updatedAt: 'iso', days: [{ date: 'd', steps: 1 }] })
    ).toEqual([])
  })

  it('catches a top-level forbidden key', () => {
    const hits = findForbiddenKeys({ source: 'iPhone' })
    expect(hits).toHaveLength(1)
    expect(hits[0].key).toBe('source')
  })

  it('catches forbidden keys nested in arrays', () => {
    const hits = findForbiddenKeys({
      days: [{ date: '2024-01-01', steps: 1, latitude: 51.5 }],
    })
    expect(hits.map((h) => h.key)).toContain('latitude')
  })

  it('matches case-insensitively', () => {
    expect(findForbiddenKeys({ Source: 'x' }).map((h) => h.key)).toContain(
      'Source'
    )
    expect(findForbiddenKeys({ DEVICEID: 'x' }).map((h) => h.key)).toContain(
      'DEVICEID'
    )
  })
})
