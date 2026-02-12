import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Terminal } from '@/components/terminal'

beforeEach(() => {
  vi.useFakeTimers()
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Terminal', () => {
  it('renders the terminal header with dots', () => {
    const { container } = render(<Terminal />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBe(3)
  })

  it('renders the terminal title', () => {
    render(<Terminal />)
    expect(screen.getByText('raghib.io')).toBeDefined()
  })

  it('streams the greeting text', () => {
    render(<Terminal />)
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByText(/Hi,/)).toBeDefined()
  })

  it('shows input after greeting completes', () => {
    render(<Terminal />)
    const greetingLength = 'Hi, welcome to my personal site. Nice to meet you.'.length
    act(() => { vi.advanceTimersByTime(greetingLength * 50 + 100) })
    expect(screen.getByLabelText('Terminal input')).toBeDefined()
  })

  it('executes /linkedin command', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<Terminal />)
    const greetingLength = 'Hi, welcome to my personal site. Nice to meet you.'.length
    act(() => { vi.advanceTimersByTime(greetingLength * 50 + 100) })

    const input = screen.getByLabelText('Terminal input')
    fireEvent.change(input, { target: { value: '/linkedin' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(openSpy).toHaveBeenCalledWith('https://www.linkedin.com/in/ragmha/', '_blank')
    openSpy.mockRestore()
  })

  it('shows error for unknown slash command', () => {
    render(<Terminal />)
    const greetingLength = 'Hi, welcome to my personal site. Nice to meet you.'.length
    act(() => { vi.advanceTimersByTime(greetingLength * 50 + 100) })

    const input = screen.getByLabelText('Terminal input')
    fireEvent.change(input, { target: { value: '/unknown' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('Unknown command: /unknown')).toBeDefined()
  })

  it('shows available commands for non-slash input', () => {
    render(<Terminal />)
    const greetingLength = 'Hi, welcome to my personal site. Nice to meet you.'.length
    act(() => { vi.advanceTimersByTime(greetingLength * 50 + 100) })

    const input = screen.getByLabelText('Terminal input')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('Available: /linkedin')).toBeDefined()
  })

  it('has responsive body sizing', () => {
    const { container } = render(<Terminal />)
    const body = container.querySelector('[class*="bg-base"][class*="font-mono"]')
    expect(body?.className).toContain('min-h-[250px]')
    expect(body?.className).toContain('sm:min-h-[360px]')
  })
})
