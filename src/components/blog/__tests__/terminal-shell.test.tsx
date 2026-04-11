import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TerminalShell } from '@/components/blog/terminal-shell'

describe('TerminalShell', () => {
  it('renders the terminal header with dots', () => {
    render(
      <TerminalShell title="~/writing">
        <p>content</p>
      </TerminalShell>
    )
    const dots = document.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
  })

  it('renders the title in the header bar', () => {
    render(
      <TerminalShell title="~/writing">
        <p>content</p>
      </TerminalShell>
    )
    expect(screen.getByText('~/writing')).toBeDefined()
  })

  it('renders children content', () => {
    render(
      <TerminalShell title="test">
        <p>Hello terminal</p>
      </TerminalShell>
    )
    expect(screen.getByText('Hello terminal')).toBeDefined()
  })

  it('has terminal window styling', () => {
    const { container } = render(
      <TerminalShell title="test">
        <p>content</p>
      </TerminalShell>
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('rounded-lg')
    expect(wrapper?.className).toContain('border')
  })
})
