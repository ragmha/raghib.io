import { describe, it, expect, vi } from 'vitest'
import { fetchGitHubRepos } from '@/lib/github'

describe('fetchGitHubRepos', () => {
  it('fetches and filters repos correctly', async () => {
    const mockRepos = [
      {
        name: 'my-project',
        description: 'A cool project',
        html_url: 'https://github.com/ragmha/my-project',
        homepage: 'https://my-project.dev',
        language: 'TypeScript',
        topics: ['react', 'next'],
        stargazers_count: 10,
        fork: false,
        archived: false,
        pushed_at: '2024-01-01T00:00:00Z',
      },
      {
        name: 'forked-repo',
        description: 'A fork',
        html_url: 'https://github.com/ragmha/forked-repo',
        homepage: null,
        language: 'JavaScript',
        topics: [],
        stargazers_count: 5,
        fork: true,
        archived: false,
        pushed_at: '2024-01-01T00:00:00Z',
      },
      {
        name: 'archived-repo',
        description: 'Old project',
        html_url: 'https://github.com/ragmha/archived-repo',
        homepage: null,
        language: 'Python',
        topics: [],
        stargazers_count: 20,
        fork: false,
        archived: true,
        pushed_at: '2024-01-01T00:00:00Z',
      },
    ]

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRepos,
    } as Response)

    const repos = await fetchGitHubRepos('ragmha')

    expect(repos).toHaveLength(1)
    expect(repos[0].name).toBe('my-project')
    expect(repos[0].fork).toBe(false)
    expect(repos[0].archived).toBe(false)

    vi.restoreAllMocks()
  })

  it('sorts repos by star count descending', async () => {
    const mockRepos = [
      {
        name: 'low-stars',
        description: null,
        html_url: '',
        homepage: null,
        language: null,
        topics: [],
        stargazers_count: 1,
        fork: false,
        archived: false,
        pushed_at: '2024-01-01T00:00:00Z',
      },
      {
        name: 'high-stars',
        description: null,
        html_url: '',
        homepage: null,
        language: null,
        topics: [],
        stargazers_count: 50,
        fork: false,
        archived: false,
        pushed_at: '2024-01-01T00:00:00Z',
      },
    ]

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRepos,
    } as Response)

    const repos = await fetchGitHubRepos('ragmha')

    expect(repos[0].name).toBe('high-stars')
    expect(repos[1].name).toBe('low-stars')

    vi.restoreAllMocks()
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response)

    await expect(fetchGitHubRepos('ragmha')).rejects.toThrow(
      'GitHub API error: 403'
    )

    vi.restoreAllMocks()
  })
})
