/** Number, date and bucket helpers used by the health UI. */

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "12,345" full or "12.4k" compact. */
export function formatCount(value: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(value)) return '—'
  if (opts.compact && value >= 1000) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
  }
  return value.toLocaleString('en-US')
}

export function formatShortDate(iso: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(`${iso}T00:00:00Z`))
}

export function formatLongDate(iso: string): string {
  return LONG_DATE_FORMATTER.format(new Date(`${iso}T00:00:00Z`))
}

export function formatMonth(iso: string): string {
  return MONTH_FORMATTER.format(new Date(`${iso}T00:00:00Z`))
}

export function formatRelativeUpdatedAt(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return formatLongDate(iso.slice(0, 10))
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatLongDate(iso.slice(0, 10))
}

/**
 * Compute n quantile thresholds for the calendar heatmap colour ramp.
 * Returns thresholds in ascending order; empty array if no positive values.
 */
export function quantileThresholds(values: number[], buckets: number = 4): number[] {
  const positives = values.filter((v) => v > 0).slice().sort((a, b) => a - b)
  if (positives.length === 0) return []
  const thresholds: number[] = []
  for (let i = 1; i <= buckets; i++) {
    const idx = Math.min(
      positives.length - 1,
      Math.floor((i / buckets) * positives.length) - (i === buckets ? 1 : 0)
    )
    thresholds.push(positives[Math.max(0, idx)])
  }
  return thresholds
}

/**
 * Returns 0 for zero/missing values, otherwise 1..buckets.length based on
 * which quantile threshold the value crosses.
 */
export function bucketIndex(value: number, thresholds: number[]): number {
  if (!Number.isFinite(value) || value <= 0 || thresholds.length === 0) return 0
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i + 1
  }
  return thresholds.length
}
