'use client'

import { STEP_GOAL } from '@/lib/health/schema'
import { formatCount } from '@/lib/health/format'

interface Props {
  steps: number
  goal?: number
  size?: number
  strokeWidth?: number
}

export function StepRing({
  steps,
  goal = STEP_GOAL,
  size = 200,
  strokeWidth = 14,
}: Props) {
  const safeGoal = Math.max(goal, 1)
  const ratio = Math.min(1, Math.max(0, steps / safeGoal))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)
  const percent = Math.round(ratio * 100)
  const reached = steps >= safeGoal

  return (
    <div
      role="img"
      aria-label={`${formatCount(steps)} of ${formatCount(safeGoal)} step goal (${percent}%)`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface0)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={reached ? 'var(--color-green)' : 'var(--color-blue)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold text-text tabular-nums">
          {formatCount(steps)}
        </span>
        <span className="mt-1 text-xs uppercase tracking-wider text-overlay1">
          of {formatCount(safeGoal, { compact: true })}
        </span>
        <span
          className={`mt-1 text-xs font-medium ${reached ? 'text-green' : 'text-subtext0'}`}
        >
          {percent}%
        </span>
      </div>
    </div>
  )
}
