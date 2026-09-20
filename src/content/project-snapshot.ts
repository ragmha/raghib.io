import type { WritingCategory } from '../lib/posts'

export interface Project {
  name: string
  description: string
  url: string
  homepage?: string
  language?: string
  category?: WritingCategory
}

export const projectSnapshot: Project[] = [
  {
    name: 'apple-books-mcp',
    category: 'AI',
    description:
      'MCP server for Apple Books with read access and a safety-checked write seam.',
    url: 'https://github.com/ragmha/apple-books-mcp',
    language: 'TypeScript',
  },
]
