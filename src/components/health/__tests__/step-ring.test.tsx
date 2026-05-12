import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepRing } from '@/components/health/step-ring'

describe('StepRing', () => {
  it('renders the count and percent', () => {
    render(<StepRing steps={2500} goal={10000} />)
    expect(screen.getByText('2,500')).toBeDefined()
    expect(screen.getByText('25%')).toBeDefined()
    expect(screen.getByText(/of 10k/)).toBeDefined()
  })

  it('caps progress at 100% when goal is exceeded', () => {
    render(<StepRing steps={20000} goal={10000} />)
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('exposes a descriptive aria-label', () => {
    render(<StepRing steps={5000} goal={10000} />)
    expect(
      screen.getByRole('img', { name: /5,000 of 10,000 step goal/i })
    ).toBeDefined()
  })
})
