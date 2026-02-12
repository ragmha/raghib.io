import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/hero'

describe('Hero', () => {
  it('renders the heading text', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(screen.getAllByText('RAGHIB HASAN').length).toBe(2) // visible + shadow
  })

  it('renders the SVG ring animation', () => {
    const { container } = render(<Hero />)
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 420 420')
  })

  it('has responsive heading classes', () => {
    const { container } = render(<Hero />)
    const h1 = container.querySelector('h1')
    expect(h1?.className).toContain('text-3xl')
    expect(h1?.className).toContain('sm:text-4xl')
    expect(h1?.className).toContain('md:text-5xl')
  })

  it('has responsive SVG sizing', () => {
    const { container } = render(<Hero />)
    const svg = container.querySelector('svg')
    const classes = svg?.getAttribute('class') ?? ''
    expect(classes).toContain('max-w-[120px]')
    expect(classes).toContain('sm:max-w-[170px]')
  })

  it('hides decorative SVG from screen readers', () => {
    const { container } = render(<Hero />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
