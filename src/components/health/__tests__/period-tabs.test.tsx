import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PeriodTabs, type Period } from '@/components/health/period-tabs'

describe('PeriodTabs', () => {
  it('renders all four period options', () => {
    render(<PeriodTabs value="D" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /Daily/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Weekly/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Monthly/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Yearly/i })).toBeDefined()
  })

  it('marks the selected tab with aria-selected', () => {
    render(<PeriodTabs value="W" onChange={() => {}} />)
    const weekly = screen.getByRole('tab', { name: /Weekly/i })
    expect(weekly.getAttribute('aria-selected')).toBe('true')
    const daily = screen.getByRole('tab', { name: /Daily/i })
    expect(daily.getAttribute('aria-selected')).toBe('false')
  })

  it('fires onChange when a tab is clicked', () => {
    const onChange = vi.fn()
    render(<PeriodTabs value="D" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /Monthly/i }))
    expect(onChange).toHaveBeenCalledWith('M' satisfies Period)
  })

  it('navigates with ArrowRight / ArrowLeft', () => {
    const onChange = vi.fn()
    render(<PeriodTabs value="D" onChange={onChange} />)
    const daily = screen.getByRole('tab', { name: /Daily/i })
    fireEvent.keyDown(daily, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('W')
    fireEvent.keyDown(daily, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('Y')
  })
})
