'use client'

import { useMemo } from 'react'
import type { HeatmapCell } from '@/lib/health/aggregate'
import { quantileThresholds, bucketIndex, formatLongDate, formatCount } from '@/lib/health/format'

interface Props {
  cells: HeatmapCell[]
  weeks: string[]
  cellSize?: number
  cellGap?: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Catppuccin-aligned ramp: surface0 → mauve → blue → green for activity
const COLOR_RAMP = [
  'var(--color-surface0)',
  'var(--color-mauve)',
  'var(--color-blue)',
  'var(--color-teal)',
  'var(--color-green)',
]

export function CalendarHeatmap({
  cells,
  weeks,
  cellSize = 12,
  cellGap = 3,
}: Props) {
  const stride = cellSize + cellGap

  const thresholds = useMemo(() => {
    const values = cells
      .map((c) => c.steps)
      .filter((s): s is number => typeof s === 'number')
    return quantileThresholds(values, 4)
  }, [cells])

  const monthLabels = useMemo(() => {
    const labels: { weekIdx: number; text: string }[] = []
    let lastMonth = -1
    weeks.forEach((iso, idx) => {
      const month = Number(iso.slice(5, 7))
      if (month !== lastMonth) {
        labels.push({ weekIdx: idx, text: monthShort(iso) })
        lastMonth = month
      }
    })
    return labels
  }, [weeks])

  if (cells.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface0 bg-mantle/40 p-8 text-center text-sm text-subtext0">
        No step data recorded yet.
      </div>
    )
  }

  const width = weeks.length * stride
  const labelHeight = 14
  const dayLabelWidth = 28
  const gridHeight = 7 * stride

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`Daily steps from ${weeks[0]} to the latest entry`}
        width={dayLabelWidth + width}
        height={labelHeight + gridHeight + 24}
        className="block"
      >
        {monthLabels.map((m) => (
          <text
            key={`${m.weekIdx}-${m.text}`}
            x={dayLabelWidth + m.weekIdx * stride}
            y={labelHeight - 2}
            className="fill-overlay1"
            style={{ fontSize: 10 }}
          >
            {m.text}
          </text>
        ))}

        {DAY_LABELS.map((label, i) => {
          // Render every other label to avoid clutter
          if (i % 2 === 1) return null
          return (
            <text
              key={label}
              x={0}
              y={labelHeight + i * stride + cellSize - 2}
              className="fill-overlay1"
              style={{ fontSize: 9 }}
            >
              {label}
            </text>
          )
        })}

        {cells.map((cell) => {
          const x = dayLabelWidth + cell.weekIdx * stride
          const y = labelHeight + cell.dayIdx * stride
          const idx =
            cell.steps === null ? 0 : bucketIndex(cell.steps, thresholds)
          const fill = COLOR_RAMP[idx]
          const title =
            cell.steps === null
              ? `${formatLongDate(cell.date)} — no data`
              : `${formatLongDate(cell.date)} — ${formatCount(cell.steps)} steps`
          return (
            <rect
              key={cell.date}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={2}
              ry={2}
              fill={fill}
              stroke={cell.steps === null ? 'var(--color-surface0)' : 'transparent'}
              strokeWidth={cell.steps === null ? 1 : 0}
            >
              <title>{title}</title>
            </rect>
          )
        })}

        <g transform={`translate(${dayLabelWidth}, ${labelHeight + gridHeight + 12})`}>
          <text x={0} y={9} className="fill-overlay1" style={{ fontSize: 9 }}>
            Less
          </text>
          {COLOR_RAMP.map((color, i) => (
            <rect
              key={i}
              x={28 + i * (cellSize + 2)}
              y={0}
              width={cellSize}
              height={cellSize}
              rx={2}
              ry={2}
              fill={color}
              stroke={i === 0 ? 'var(--color-surface0)' : 'transparent'}
              strokeWidth={i === 0 ? 1 : 0}
            />
          ))}
          <text
            x={28 + COLOR_RAMP.length * (cellSize + 2) + 4}
            y={9}
            className="fill-overlay1"
            style={{ fontSize: 9 }}
          >
            More
          </text>
        </g>
      </svg>
    </div>
  )
}

function monthShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
}
