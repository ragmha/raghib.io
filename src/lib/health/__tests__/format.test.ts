import { describe, it, expect } from 'vitest'
import {
  formatCount,
  formatShortDate,
  formatLongDate,
  formatMonth,
  formatRelativeUpdatedAt,
  quantileThresholds,
  bucketIndex,
} from '@/lib/health/format'

describe('formatCount', () => {
  it('formats with thousands separators by default', () => {
    expect(formatCount(12345)).toBe('12,345')
    expect(formatCount(0)).toBe('0')
  })

  it('handles compact mode', () => {
    expect(formatCount(123, { compact: true })).toBe('123')
    expect(formatCount(1234, { compact: true })).toBe('1.2k')
    expect(formatCount(12345, { compact: true })).toBe('12k')
    expect(formatCount(1_234_567, { compact: true })).toBe('1.2M')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatCount(NaN)).toBe('—')
    expect(formatCount(Infinity)).toBe('—')
  })
})

describe('date formatters', () => {
  it('formatShortDate', () => {
    expect(formatShortDate('2024-05-03')).toBe('May 3')
  })
  it('formatLongDate', () => {
    expect(formatLongDate('2024-05-03')).toBe('May 3, 2024')
  })
  it('formatMonth', () => {
    expect(formatMonth('2024-05-01')).toBe('May 2024')
  })
})

describe('formatRelativeUpdatedAt', () => {
  it('returns "just now" for very recent', () => {
    expect(formatRelativeUpdatedAt(new Date().toISOString())).toBe('just now')
  })
  it('falls back to long date for old timestamps', () => {
    expect(formatRelativeUpdatedAt('1990-01-01T00:00:00Z')).toContain('1990')
  })
})

describe('quantileThresholds + bucketIndex', () => {
  it('returns no thresholds for empty/zero-only data', () => {
    expect(quantileThresholds([])).toEqual([])
    expect(quantileThresholds([0, 0, 0])).toEqual([])
  })

  it('computes thresholds for positive values', () => {
    const thresholds = quantileThresholds([1, 2, 3, 4, 5, 6, 7, 8], 4)
    expect(thresholds).toHaveLength(4)
    expect(thresholds[0]).toBeLessThanOrEqual(thresholds[3])
  })

  it('bucketIndex returns 0 for non-positive values', () => {
    expect(bucketIndex(0, [1, 2, 3, 4])).toBe(0)
    expect(bucketIndex(-5, [1, 2, 3, 4])).toBe(0)
  })

  it('bucketIndex partitions values across thresholds', () => {
    const thresholds = [10, 20, 30, 40]
    expect(bucketIndex(5, thresholds)).toBe(1)
    expect(bucketIndex(15, thresholds)).toBe(2)
    expect(bucketIndex(35, thresholds)).toBe(4)
    expect(bucketIndex(100, thresholds)).toBe(4)
  })
})
