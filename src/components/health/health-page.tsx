'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PeriodTabs, type Period } from './period-tabs'
import { CalendarHeatmap } from './calendar-heatmap'
import { StatsCards } from './stats-cards'
import { StepRing } from './step-ring'
import {
  buildHeatmap,
  summaryStats,
} from '@/lib/health/aggregate'
import type { StepsFile, InsightsFile } from '@/lib/health/schema'
import { formatRelativeUpdatedAt } from '@/lib/health/format'

// Recharts is ~100KB — only load when /health is rendered.
const StepLineChart = dynamic(
  () => import('./step-line-chart').then((m) => m.StepLineChart),
  { ssr: false, loading: () => <div className="h-72 w-full animate-pulse rounded-lg bg-surface0/40" /> }
)

interface Props {
  steps: StepsFile
  insights: InsightsFile
}

const PERIOD_LABEL: Record<Period, string> = {
  D: 'Last 30 days',
  W: 'Last 12 weeks',
  M: 'Last 12 months',
  Y: 'All years',
}

const INSIGHT_BY_PERIOD: Record<Period, keyof InsightsFile> = {
  D: 'weekly',
  W: 'weekly',
  M: 'monthly',
  Y: 'yearly',
}

export function HealthPage({ steps, insights }: Props) {
  const [period, setPeriod] = useState<Period>('D')

  const stats = useMemo(() => summaryStats(steps.days), [steps.days])
  const heatmap = useMemo(() => buildHeatmap(steps.days), [steps.days])
  const hasData = steps.days.length > 0
  const insightText = insights[INSIGHT_BY_PERIOD[period]]

  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle px-4 sm:px-6 md:px-8 py-12 md:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-overlay1 hover:text-text transition-colors mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text tracking-tight">
                Steps
              </h1>
              <p className="mt-2 text-subtext0 text-base sm:text-lg">
                Daily step counts from Apple Health, refreshed automatically.
              </p>
            </div>
            <div className="text-xs text-overlay1 font-mono">
              {hasData
                ? `Updated ${formatRelativeUpdatedAt(steps.updatedAt)}`
                : 'Awaiting first sync'}
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 mb-8">
          <div className="flex justify-center md:justify-start">
            <StepRing steps={stats.today} />
          </div>
          <StatsCards stats={stats} />
        </section>

        <section className="rounded-xl border border-surface0 bg-mantle/60 p-4 sm:p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-text">Trend</h2>
            <PeriodTabs value={period} onChange={setPeriod} />
          </div>
          <div className="text-xs text-overlay1 mb-3 font-mono">
            {PERIOD_LABEL[period]}
          </div>
          <StepLineChart days={steps.days} period={period} />
        </section>

        <section className="rounded-xl border border-surface0 bg-mantle/60 p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-text">Activity calendar</h2>
            <span className="text-xs text-overlay1 font-mono">
              {stats.daysRecorded} day{stats.daysRecorded === 1 ? '' : 's'} recorded
            </span>
          </div>
          <CalendarHeatmap cells={heatmap.cells} weeks={heatmap.weeks} />
        </section>

        {insightText && (
          <section className="rounded-xl border border-surface0 bg-mantle/60 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-text">Insight</h2>
              <span className="text-xs text-overlay1 font-mono">
                {formatRelativeUpdatedAt(insights.generatedAt)}
              </span>
            </div>
            <p className="text-sm text-subtext0 leading-relaxed whitespace-pre-line">
              {insightText}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
