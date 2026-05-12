import { describe, it, expect } from 'vitest'
import type { StepDay } from '@/lib/health/schema'
import {
  isoWeekStart,
  monthStart,
  yearOf,
  dailySeries,
  dailyToWeekly,
  dailyToMonthly,
  dailyToYearly,
  summaryStats,
  buildHeatmap,
} from '@/lib/health/aggregate'

const sample: StepDay[] = [
  { date: '2024-04-29', steps: 1000 }, // Monday
  { date: '2024-04-30', steps: 2000 },
  { date: '2024-05-01', steps: 3000 },
  { date: '2024-05-02', steps: 4000 },
  { date: '2024-05-03', steps: 5000 },
  { date: '2024-05-04', steps: 6000 },
  { date: '2024-05-05', steps: 7000 }, // Sunday
  { date: '2024-05-06', steps: 8000 }, // next Monday
]

describe('date helpers', () => {
  it('isoWeekStart returns the Monday for any day', () => {
    expect(isoWeekStart('2024-05-01')).toBe('2024-04-29') // Wed → Mon
    expect(isoWeekStart('2024-05-05')).toBe('2024-04-29') // Sun → previous Mon
    expect(isoWeekStart('2024-05-06')).toBe('2024-05-06') // Mon → self
  })

  it('monthStart returns the 1st of that month', () => {
    expect(monthStart('2024-05-23')).toBe('2024-05-01')
  })

  it('yearOf returns the numeric year', () => {
    expect(yearOf('2024-05-23')).toBe(2024)
  })
})

describe('dailySeries', () => {
  it('sorts and slices to last N', () => {
    const out = dailySeries(sample, 3)
    expect(out.map((d) => d.date)).toEqual(['2024-05-04', '2024-05-05', '2024-05-06'])
  })

  it('returns the full series when N is omitted', () => {
    expect(dailySeries(sample)).toHaveLength(sample.length)
  })
})

describe('dailyToWeekly', () => {
  it('groups by ISO Monday', () => {
    const weeks = dailyToWeekly(sample)
    expect(weeks).toHaveLength(2)
    expect(weeks[0]).toEqual({
      weekStart: '2024-04-29',
      steps: 28000,
      days: 7,
      avg: 4000,
    })
    expect(weeks[1]).toEqual({
      weekStart: '2024-05-06',
      steps: 8000,
      days: 1,
      avg: 8000,
    })
  })
})

describe('dailyToMonthly', () => {
  it('groups by month start', () => {
    const months = dailyToMonthly(sample)
    expect(months).toHaveLength(2)
    expect(months[0].monthStart).toBe('2024-04-01')
    expect(months[0].steps).toBe(3000)
    expect(months[1].monthStart).toBe('2024-05-01')
    expect(months[1].days).toBe(6)
  })
})

describe('dailyToYearly', () => {
  it('groups by year', () => {
    const years = dailyToYearly([
      { date: '2023-12-31', steps: 1 },
      ...sample,
    ])
    expect(years).toHaveLength(2)
    expect(years[0]).toEqual({ year: 2023, steps: 1, days: 1, avg: 1 })
    expect(years[1].year).toBe(2024)
    expect(years[1].steps).toBe(36000)
  })
})

describe('summaryStats', () => {
  it('returns zeros for empty data', () => {
    expect(summaryStats([])).toEqual({
      today: 0,
      yesterday: 0,
      avg7: 0,
      avg30: 0,
      best: null,
      lifetime: 0,
      daysRecorded: 0,
    })
  })

  it('uses the latest date as the reference', () => {
    const s = summaryStats(sample)
    expect(s.today).toBe(8000)
    expect(s.yesterday).toBe(7000)
    expect(s.avg7).toBe(5000) // 8000+7000+6000+5000+4000+3000+2000 = 35000 / 7
    expect(s.lifetime).toBe(36000)
    expect(s.daysRecorded).toBe(8)
    expect(s.best).toEqual({ date: '2024-05-06', steps: 8000 })
  })

  it('respects an explicit reference date', () => {
    const s = summaryStats(sample, '2024-05-05')
    expect(s.today).toBe(7000)
    expect(s.yesterday).toBe(6000)
  })

  it('skips missing days when averaging', () => {
    const sparse: StepDay[] = [
      { date: '2024-05-01', steps: 1000 },
      { date: '2024-05-04', steps: 4000 },
    ]
    const s = summaryStats(sparse, '2024-05-04')
    expect(s.avg7).toBe(2500) // (1000 + 4000) / 2
  })
})

describe('buildHeatmap', () => {
  it('produces a dense 7-row grid covering the data range', () => {
    const { cells, weeks } = buildHeatmap(sample)
    expect(weeks).toEqual(['2024-04-29', '2024-05-06'])
    expect(cells).toHaveLength(2 * 7)
    const firstWeek = cells.filter((c) => c.weekIdx === 0)
    expect(firstWeek.map((c) => c.date)).toEqual([
      '2024-04-29',
      '2024-04-30',
      '2024-05-01',
      '2024-05-02',
      '2024-05-03',
      '2024-05-04',
      '2024-05-05',
    ])
    expect(firstWeek[0].steps).toBe(1000)
    // Days within the last partial week (no data yet) render as null cells.
    const empty = cells.find((c) => c.date === '2024-05-07')
    expect(empty?.steps).toBeNull()
    const lastInWeek = cells.find((c) => c.date === '2024-05-12')
    expect(lastInWeek?.steps).toBeNull()
    // No cells extend beyond the last week containing data.
    const beyond = cells.find((c) => c.date === '2024-05-13')
    expect(beyond).toBeUndefined()
  })

  it('returns empty when no data', () => {
    expect(buildHeatmap([])).toEqual({ cells: [], weeks: [] })
  })
})
