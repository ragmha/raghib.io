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
  {
    name: 'five-by-five',
    category: 'Systems',
    description:
      'Native iOS and watchOS strength tracker with HealthKit sync and an on-device workout assistant.',
    url: 'https://github.com/ragmha/five-by-five',
    language: 'Swift',
  },
  {
    name: 'chomp',
    category: 'Developer Workflow',
    description:
      'A working demonstration of an AI-native SDLC using Copilot CLI, SDK, Actions, and Advanced Security.',
    url: 'https://github.com/ragmha/chomp',
    language: 'TypeScript',
  },
  {
    name: 'modernize-app-with-copilot',
    category: 'Developer Workflow',
    description:
      'Hands-on ASP.NET and Java modernization using GitHub Copilot, Codespaces, and Actions.',
    url: 'https://github.com/ragmha/modernize-app-with-copilot',
    language: 'JavaScript',
  },
  {
    name: 'copilot-chrome',
    category: 'AI',
    description:
      'GitHub Copilot in a Chrome side panel with SDK-driven browser automation, MCP, and WebMCP.',
    url: 'https://github.com/ragmha/copilot-chrome',
    language: 'JavaScript',
  },
  {
    name: 'copilot-factory',
    category: 'Developer Workflow',
    description:
      'A software factory demonstrating issue-to-PR delivery with a human-owned review gate.',
    url: 'https://github.com/ragmha/copilot-factory',
    language: 'TypeScript',
  },
  {
    name: 'helsinki-pulse',
    category: 'Systems',
    description:
      'Live Helsinki transit digital twin on Microsoft Fabric Real-Time Intelligence.',
    url: 'https://github.com/ragmha/helsinki-pulse',
    language: 'TypeScript',
  },
  {
    name: 'clinic-scheduler',
    category: 'Web',
    description:
      'Healthcare staff scheduler built with React, TypeScript, and a Microsoft Fabric-oriented data model.',
    url: 'https://github.com/ragmha/clinic-scheduler',
    homepage: 'https://ragmha.github.io/clinic-scheduler/',
    language: 'TypeScript',
  },
]
