/**
 * Health data schema + runtime guards.
 *
 * This module is the anchor for **Layer 3** of the security model:
 * the only shapes that may live in the repository are defined here, and the
 * type guards reject anything else. Build-time consumers and CI scripts both
 * import from this file so a single source of truth governs what fields ever
 * touch disk.
 */

export const STEP_GOAL = 10_000
export const MAX_DAILY_STEPS = 200_000

export const INSIGHT_LIMITS = {
  weekly: 400,
  monthly: 600,
  yearly: 800,
} as const

/**
 * Keys that must never appear anywhere inside the committed JSON payloads.
 * Used by both the schema parsers (which strip them) and the redact-guard
 * script (which fails CI if it finds any). Compared case-insensitively.
 */
export const FORBIDDEN_KEYS: readonly string[] = [
  'source',
  'sourcename',
  'sourceversion',
  'device',
  'deviceid',
  'uuid',
  'latitude',
  'longitude',
  'lat',
  'lon',
  'lng',
  'gps',
  'location',
  'start',
  'startdate',
  'end',
  'enddate',
  'time',
  'timestamp',
  'metadata',
  'userid',
  'user',
  'email',
  'name',
  'firstname',
  'lastname',
  'address',
  'phone',
]

export interface StepDay {
  /** Local-time calendar date in YYYY-MM-DD form. */
  date: string
  /** Whole-number step count for that calendar day. */
  steps: number
}

export interface StepsFile {
  /** ISO timestamp of the last write. */
  updatedAt: string
  /** One entry per calendar day, sorted ascending by date. */
  days: StepDay[]
}

export interface InsightsFile {
  generatedAt: string
  weekly: string
  monthly: string
  yearly: string
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

export function isValidStepCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_DAILY_STEPS
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isStepDay(value: unknown): value is StepDay {
  if (!isPlainObject(value)) return false
  return isValidDateString(value.date) && isValidStepCount(value.steps)
}

/**
 * Strict parser for incoming step entries. Unknown keys are dropped. Any
 * malformed entry causes the whole batch to be rejected by throwing.
 */
export function parseStepDay(value: unknown): StepDay {
  if (!isPlainObject(value)) {
    throw new SchemaError('step entry must be an object')
  }
  if (!isValidDateString(value.date)) {
    throw new SchemaError(`invalid date: ${JSON.stringify(value.date)}`)
  }
  if (!isValidStepCount(value.steps)) {
    throw new SchemaError(`invalid steps value: ${JSON.stringify(value.steps)}`)
  }
  return { date: value.date, steps: value.steps }
}

export function parseStepsFile(value: unknown): StepsFile {
  if (!isPlainObject(value)) throw new SchemaError('steps file must be an object')
  if (typeof value.updatedAt !== 'string') {
    throw new SchemaError('steps.updatedAt must be a string')
  }
  if (!Array.isArray(value.days)) {
    throw new SchemaError('steps.days must be an array')
  }
  const days = value.days.map(parseStepDay)
  return { updatedAt: value.updatedAt, days }
}

export function parseInsightsFile(value: unknown): InsightsFile {
  if (!isPlainObject(value)) {
    throw new SchemaError('insights file must be an object')
  }
  const fields = ['generatedAt', 'weekly', 'monthly', 'yearly'] as const
  for (const f of fields) {
    if (typeof value[f] !== 'string') {
      throw new SchemaError(`insights.${f} must be a string`)
    }
  }
  return clampInsights({
    generatedAt: value.generatedAt as string,
    weekly: value.weekly as string,
    monthly: value.monthly as string,
    yearly: value.yearly as string,
  })
}

/** Truncate insight fields to their allowed length (Layer 3 coarsening). */
export function clampInsights(input: InsightsFile): InsightsFile {
  return {
    generatedAt: input.generatedAt,
    weekly: input.weekly.slice(0, INSIGHT_LIMITS.weekly),
    monthly: input.monthly.slice(0, INSIGHT_LIMITS.monthly),
    yearly: input.yearly.slice(0, INSIGHT_LIMITS.yearly),
  }
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaError'
  }
}

/**
 * Recursive scan that returns every forbidden key found in `value`, with the
 * dot-path at which it appeared. Powers the redact-guard CI script.
 */
export function findForbiddenKeys(
  value: unknown,
  path: string = '$'
): { path: string; key: string }[] {
  const hits: { path: string; key: string }[] = []
  const forbidden = new Set(FORBIDDEN_KEYS)
  const walk = (node: unknown, p: string) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${p}[${i}]`))
      return
    }
    if (isPlainObject(node)) {
      for (const [k, v] of Object.entries(node)) {
        if (forbidden.has(k.toLowerCase())) {
          hits.push({ path: `${p}.${k}`, key: k })
        }
        walk(v, `${p}.${k}`)
      }
    }
  }
  walk(value, path)
  return hits
}
