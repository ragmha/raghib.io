import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CtaSection } from '@/components/cta-section'

describe('CtaSection', () => {
  it('renders the blog link', () => {
    render(<CtaSection />)
    expect(screen.getByText('Explore My Blog')).toBeDefined()
  })

  it('links to /blog', () => {
    const { container } = render(<CtaSection />)
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/blog')
  })

  it('renders all three stat cards', () => {
    render(<CtaSection />)
    expect(screen.getByText('AI Tools')).toBeDefined()
    expect(screen.getByText('Possibilities')).toBeDefined()
    expect(screen.getByText('Terminal')).toBeDefined()
  })

  it('renders stat values', () => {
    render(<CtaSection />)
    expect(screen.getByText('4')).toBeDefined()
    expect(screen.getByText('∞')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
  })

  it('has responsive grid classes', () => {
    const { container } = render(<CtaSection />)
    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('grid-cols-1')
    expect(grid?.className).toContain('sm:grid-cols-3')
  })
})
