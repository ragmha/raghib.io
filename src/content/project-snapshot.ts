import type { WritingCategory } from '../lib/posts'
import githubProjects from './github-projects.json'

export interface Project {
  name: string
  description: string
  url: string
  homepage?: string
  language?: string
  category?: WritingCategory
}

const categories: Record<string, WritingCategory> = {
  'ragmha/apple-books-mcp': 'AI',
}

export const projectSnapshot: Project[] = githubProjects.map((project) => ({
  ...project,
  category: categories[project.repository],
}))
