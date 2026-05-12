import type { SummaryStats } from '@/lib/health/aggregate'
import { formatCount, formatLongDate } from '@/lib/health/format'

interface Props {
  stats: SummaryStats
}

interface CardProps {
  label: string
  value: string
  hint?: string
}

function Card({ label, value, hint }: CardProps) {
  return (
    <div className="rounded-lg border border-surface0 bg-mantle p-4">
      <div className="text-xs uppercase tracking-wider text-overlay1">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold text-text tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-subtext0">{hint}</div>}
    </div>
  )
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card label="Today" value={formatCount(stats.today)} />
      <Card label="7-day avg" value={formatCount(stats.avg7)} />
      <Card label="30-day avg" value={formatCount(stats.avg30)} />
      <Card
        label="Best day"
        value={stats.best ? formatCount(stats.best.steps) : '—'}
        hint={stats.best ? formatLongDate(stats.best.date) : 'No data yet'}
      />
    </div>
  )
}
