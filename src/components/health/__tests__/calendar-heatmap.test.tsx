import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CalendarHeatmap } from '@/components/health/calendar-heatmap'
import { buildHeatmap } from '@/lib/health/aggregate'

describe('CalendarHeatmap', () => {
  it('renders an empty-state placeholder for no data', () => {
    const { container } = render(<CalendarHeatmap cells={[]} weeks={[]} />)
    expect(container.textContent).toContain('No step data recorded yet.')
  })

  it('renders one rect per cell when data is provided', () => {
    const days = [
      { date: '2024-04-29', steps: 1000 },
      { date: '2024-04-30', steps: 2000 },
      { date: '2024-05-05', steps: 7000 },
    ]
    const { cells, weeks } = buildHeatmap(days)
    const { container } = render(
      <CalendarHeatmap cells={cells} weeks={weeks} />
    )
    // 7 day cells + 5 legend swatches = 12 rects
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(cells.length + 5)
  })

  it('includes a tooltip <title> for each cell', () => {
    const days = [{ date: '2024-04-29', steps: 1234 }]
    const { cells, weeks } = buildHeatmap(days)
    const { container } = render(
      <CalendarHeatmap cells={cells} weeks={weeks} />
    )
    const titles = Array.from(container.querySelectorAll('title')).map(
      (t) => t.textContent
    )
    expect(titles.some((t) => t?.includes('1,234 steps'))).toBe(true)
    expect(titles.some((t) => t?.includes('no data'))).toBe(true)
  })
})
