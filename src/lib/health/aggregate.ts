import type { StepDay } from './schema'

export interface DailyPoint {
  date: string
  steps: number
}

export interface WeeklyPoint {
  weekStart: string
  steps: number
  avg: number
  days: number
}

export interface MonthlyPoint {
  monthStart: string
  steps: number
  avg: number
  days: number
}

export interface YearlyPoint {
  year: number
  steps: number
  avg: number
  days: number
}

export interface SummaryStats {
  today: number
  yesterday: number
  avg7: number
  avg30: number
  best: { date: string; steps: number } | null
  lifetime: number
  daysRecorded: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function dateFromIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * ISO-week start (Monday) for a UTC date, returned as YYYY-MM-DD.
 * ISO weeks treat Monday as day 1, Sunday as day 7.
 */
export function isoWeekStart(iso: string): string {
  const d = dateFromIso(iso)
  const day = d.getUTCDay() // 0 = Sunday
  const offset = day === 0 ? 6 : day - 1 // distance back to Monday
  const monday = new Date(d.getTime() - offset * DAY_MS)
  return isoFromDate(monday)
}

export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4))
}

function sortByDate<T extends { date: string }>(arr: T[]): T[] {
  return arr.slice().sort((a, b) => a.date.localeCompare(b.date))
}

export function dailySeries(days: StepDay[], lastN?: number): DailyPoint[] {
  const sorted = sortByDate(days)
  const sliced = lastN ? sorted.slice(-lastN) : sorted
  return sliced.map((d) => ({ date: d.date, steps: d.steps }))
}

export function dailyToWeekly(days: StepDay[], lastN?: number): WeeklyPoint[] {
  const buckets = new Map<string, { steps: number; days: number }>()
  for (const d of days) {
    const key = isoWeekStart(d.date)
    const acc = buckets.get(key) ?? { steps: 0, days: 0 }
    acc.steps += d.steps
    acc.days += 1
    buckets.set(key, acc)
  }
  const all = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, { steps, days }]) => ({
      weekStart,
      steps,
      days,
      avg: days > 0 ? Math.round(steps / days) : 0,
    }))
  return lastN ? all.slice(-lastN) : all
}

export function dailyToMonthly(days: StepDay[], lastN?: number): MonthlyPoint[] {
  const buckets = new Map<string, { steps: number; days: number }>()
  for (const d of days) {
    const key = monthStart(d.date)
    const acc = buckets.get(key) ?? { steps: 0, days: 0 }
    acc.steps += d.steps
    acc.days += 1
    buckets.set(key, acc)
  }
  const all = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthStart, { steps, days }]) => ({
      monthStart,
      steps,
      days,
      avg: days > 0 ? Math.round(steps / days) : 0,
    }))
  return lastN ? all.slice(-lastN) : all
}

export function dailyToYearly(days: StepDay[]): YearlyPoint[] {
  const buckets = new Map<number, { steps: number; days: number }>()
  for (const d of days) {
    const key = yearOf(d.date)
    const acc = buckets.get(key) ?? { steps: 0, days: 0 }
    acc.steps += d.steps
    acc.days += 1
    buckets.set(key, acc)
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { steps, days }]) => ({
      year,
      steps,
      days,
      avg: days > 0 ? Math.round(steps / days) : 0,
    }))
}

export function summaryStats(days: StepDay[], today?: string): SummaryStats {
  if (days.length === 0) {
    return {
      today: 0,
      yesterday: 0,
      avg7: 0,
      avg30: 0,
      best: null,
      lifetime: 0,
      daysRecorded: 0,
    }
  }
  const sorted = sortByDate(days)
  const byDate = new Map(sorted.map((d) => [d.date, d.steps]))
  const reference = today ?? sorted[sorted.length - 1].date

  const refDate = dateFromIso(reference)
  const yesterdayKey = isoFromDate(new Date(refDate.getTime() - DAY_MS))

  const window = (n: number): number => {
    let sum = 0
    let count = 0
    for (let i = 0; i < n; i++) {
      const d = isoFromDate(new Date(refDate.getTime() - i * DAY_MS))
      const v = byDate.get(d)
      if (typeof v === 'number') {
        sum += v
        count += 1
      }
    }
    return count > 0 ? Math.round(sum / count) : 0
  }

  let best: { date: string; steps: number } | null = null
  let lifetime = 0
  for (const d of sorted) {
    lifetime += d.steps
    if (!best || d.steps > best.steps) best = { date: d.date, steps: d.steps }
  }

  return {
    today: byDate.get(reference) ?? 0,
    yesterday: byDate.get(yesterdayKey) ?? 0,
    avg7: window(7),
    avg30: window(30),
    best,
    lifetime,
    daysRecorded: sorted.length,
  }
}

/**
 * Build a dense 7×N grid for the calendar heatmap. Columns are ISO weeks
 * (Monday-anchored), rows 0..6 are Mon..Sun. Cells with no data have
 * `steps: null`. Used by `<CalendarHeatmap />`.
 */
export interface HeatmapCell {
  date: string
  steps: number | null
  weekIdx: number
  dayIdx: number
}

export function buildHeatmap(
  days: StepDay[],
  options: { from?: string; to?: string } = {}
): { cells: HeatmapCell[]; weeks: string[] } {
  if (days.length === 0) return { cells: [], weeks: [] }
  const sorted = sortByDate(days)
  const byDate = new Map(sorted.map((d) => [d.date, d.steps]))
  const from = options.from ?? sorted[0].date
  const to = options.to ?? sorted[sorted.length - 1].date

  const startMonday = isoWeekStart(from)
  const endMonday = isoWeekStart(to)

  const cells: HeatmapCell[] = []
  const weeks: string[] = []
  let weekIdx = 0
  let cursor = dateFromIso(startMonday)
  const endCursor = dateFromIso(endMonday)

  while (cursor.getTime() <= endCursor.getTime()) {
    weeks.push(isoFromDate(cursor))
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const cellDate = isoFromDate(new Date(cursor.getTime() + dayIdx * DAY_MS))
      const steps = byDate.has(cellDate) ? byDate.get(cellDate)! : null
      cells.push({ date: cellDate, steps, weekIdx, dayIdx })
    }
    cursor = new Date(cursor.getTime() + 7 * DAY_MS)
    weekIdx += 1
  }
  return { cells, weeks }
}
