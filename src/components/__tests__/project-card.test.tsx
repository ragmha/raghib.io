import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '@/components/project-card'
import type { GitHubRepo } from '@/lib/github'

const baseRepo: GitHubRepo = {
  name: 'test-project',
  description: 'A test project description',
  html_url: 'https://github.com/ragmha/test-project',
  homepage: 'https://test-project.dev',
  language: 'TypeScript',
  topics: ['react', 'nextjs', 'tailwind'],
  stargazers_count: 10,
  fork: false,
  archived: false,
  pushed_at: '2024-01-01T00:00:00Z',
}

describe('ProjectCard', () => {
  it('renders the repo name formatted as title case', () => {
    render(<ProjectCard repo={baseRepo} />)
    expect(screen.getByText('Test Project')).toBeDefined()
  })

  it('renders the description', () => {
    render(<ProjectCard repo={baseRepo} />)
    expect(screen.getByText('A test project description')).toBeDefined()
  })

  it('renders language badge', () => {
    render(<ProjectCard repo={baseRepo} />)
    expect(screen.getByText('TypeScript')).toBeDefined()
  })

  it('renders topic badges (max 3)', () => {
    render(<ProjectCard repo={baseRepo} />)
    expect(screen.getByText('react')).toBeDefined()
    expect(screen.getByText('nextjs')).toBeDefined()
    expect(screen.getByText('tailwind')).toBeDefined()
  })

  it('renders GitHub link', () => {
    render(<ProjectCard repo={baseRepo} />)
    const ghLink = screen.getByLabelText('GitHub repo for test-project')
    expect(ghLink.getAttribute('href')).toBe(
      'https://github.com/ragmha/test-project'
    )
  })

  it('renders live demo link when homepage exists', () => {
    render(<ProjectCard repo={baseRepo} />)
    const demoLink = screen.getByLabelText('Live demo for test-project')
    expect(demoLink.getAttribute('href')).toBe('https://test-project.dev')
  })

  it('does not render live demo link when no homepage', () => {
    const repo = { ...baseRepo, homepage: null }
    render(<ProjectCard repo={repo} />)
    expect(
      screen.queryByLabelText('Live demo for test-project')
    ).toBeNull()
  })

  it('handles repo with no description', () => {
    const repo = { ...baseRepo, description: null }
    const { container } = render(<ProjectCard repo={repo} />)
    expect(container.querySelector('.line-clamp-2')).toBeNull()
  })

  it('handles repo with no language', () => {
    const repo = { ...baseRepo, language: null }
    render(<ProjectCard repo={repo} />)
    expect(screen.queryByText('TypeScript')).toBeNull()
  })
})
