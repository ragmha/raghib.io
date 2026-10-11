import type { WritingCategory } from '../lib/posts'
import githubProjects from './github-projects.json'

export interface Project {
  name: string
  description: string
  url: string
  homepage?: string
  language?: string
  category?: WritingCategory
  extraLinks?: { label: string; url: string }[]
}

const overrides: Record<string, Partial<Pick<Project, 'category' | 'description' | 'homepage' | 'extraLinks'>>> = {
  'ragmha/apple-books-mcp': {
    category: 'AI',
    description: 'Connect AI assistants to your Apple Books library.',
  },
}

export const projectSnapshot: Project[] = githubProjects.map((project) => ({
  ...project,
  ...overrides[project.repository],
}))
