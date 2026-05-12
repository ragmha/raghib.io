'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Period } from './period-tabs'
import {
  dailySeries,
  dailyToWeekly,
  dailyToMonthly,
  dailyToYearly,
} from '@/lib/health/aggregate'
import type { StepDay } from '@/lib/health/schema'
import { formatCount, formatShortDate, formatMonth } from '@/lib/health/format'

interface Props {
  days: StepDay[]
  period: Period
}

interface ChartPoint {
  label: string
  value: number
  hint: string
}

function buildSeries(days: StepDay[], period: Period): ChartPoint[] {
  switch (period) {
    case 'D':
      return dailySeries(days, 30).map((d) => ({
        label: formatShortDate(d.date),
        value: d.steps,
        hint: d.date,
      }))
    case 'W':
      return dailyToWeekly(days, 12).map((w) => ({
        label: formatShortDate(w.weekStart),
        value: w.steps,
        hint: `Week of ${w.weekStart}`,
      }))
    case 'M':
      return dailyToMonthly(days, 12).map((m) => ({
        label: formatMonth(m.monthStart),
        value: m.steps,
        hint: formatMonth(m.monthStart),
      }))
    case 'Y':
      return dailyToYearly(days).map((y) => ({
        label: String(y.year),
        value: y.steps,
        hint: String(y.year),
      }))
  }
}

export function StepLineChart({ days, period }: Props) {
  const data = useMemo(() => buildSeries(days, period), [days, period])

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface0 bg-mantle/40 p-8 text-center text-sm text-subtext0">
        Not enough data to render the chart yet.
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-blue)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-surface0)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            stroke="var(--color-overlay0)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            stroke="var(--color-overlay0)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCount(Number(v), { compact: true })}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-surface1)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--color-mantle)',
              border: '1px solid var(--color-surface0)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--color-text)',
            }}
            labelStyle={{ color: 'var(--color-subtext0)' }}
            formatter={(value) => [formatCount(Number(value)), 'Steps']}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as ChartPoint | undefined
              return point?.hint ?? ''
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-blue)"
            strokeWidth={2}
            fill="url(#stepFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
