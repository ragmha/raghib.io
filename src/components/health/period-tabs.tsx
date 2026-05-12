'use client'

import { useId } from 'react'

export type Period = 'D' | 'W' | 'M' | 'Y'

const OPTIONS: { id: Period; label: string; full: string }[] = [
  { id: 'D', label: 'Day', full: 'Daily (last 30 days)' },
  { id: 'W', label: 'Week', full: 'Weekly (last 12 weeks)' },
  { id: 'M', label: 'Month', full: 'Monthly (last 12 months)' },
  { id: 'Y', label: 'Year', full: 'Yearly' },
]

interface Props {
  value: Period
  onChange: (next: Period) => void
}

export function PeriodTabs({ value, onChange }: Props) {
  const groupId = useId()

  return (
    <div
      role="tablist"
      aria-label="Aggregation period"
      id={groupId}
      className="inline-flex items-center rounded-lg border border-surface0 bg-mantle p-1"
    >
      {OPTIONS.map((opt) => {
        const selected = opt.id === value
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            aria-label={opt.full}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault()
                const dir = e.key === 'ArrowRight' ? 1 : -1
                const idx = OPTIONS.findIndex((o) => o.id === value)
                const next = OPTIONS[(idx + dir + OPTIONS.length) % OPTIONS.length]
                onChange(next.id)
              }
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selected
                ? 'bg-surface0 text-text'
                : 'text-subtext0 hover:text-text hover:bg-surface0/60'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
