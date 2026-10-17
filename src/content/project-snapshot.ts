import githubProjects from './github-projects.json'

export interface Project {
  name: string
  description: string
  url: string
  homepage?: string
  language?: string
  extraLinks?: { label: string; url: string }[]
}

const overrides: Record<string, Partial<Pick<Project, 'description' | 'homepage' | 'extraLinks'>>> = {
  'ragmha/apple-books-mcp': {
    description: 'Connect AI assistants to your Apple Books library.',
  },
}

export const projectSnapshot: Project[] = githubProjects.map((project) => ({
  ...project,
  ...overrides[project.repository],
}))
