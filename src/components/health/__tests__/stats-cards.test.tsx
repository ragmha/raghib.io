import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsCards } from '@/components/health/stats-cards'

describe('StatsCards', () => {
  it('renders all four metric cards', () => {
    render(
      <StatsCards
        stats={{
          today: 1234,
          yesterday: 5678,
          avg7: 4321,
          avg30: 9999,
          best: { date: '2024-05-01', steps: 12345 },
          lifetime: 88888,
          daysRecorded: 30,
        }}
      />
    )
    expect(screen.getByText('1,234')).toBeDefined()
    expect(screen.getByText('4,321')).toBeDefined()
    expect(screen.getByText('9,999')).toBeDefined()
    expect(screen.getByText('12,345')).toBeDefined()
    expect(screen.getByText(/May 1, 2024/)).toBeDefined()
  })

  it('shows em-dash and helper text when no best day', () => {
    render(
      <StatsCards
        stats={{
          today: 0,
          yesterday: 0,
          avg7: 0,
          avg30: 0,
          best: null,
          lifetime: 0,
          daysRecorded: 0,
        }}
      />
    )
    expect(screen.getByText('—')).toBeDefined()
    expect(screen.getByText('No data yet')).toBeDefined()
  })
})
