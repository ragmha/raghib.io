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

const selectedProjects: Project[] = [
  {
    name: 'build-your-harness',
    description: 'Build a TypeScript and Bun AI agent harness from first principles.',
    url: 'https://github.com/ragmha/build-your-harness',
    extraLinks: [{ label: 'Tutorial', url: 'https://raghib.io/writing/build-your-agent-harness/' }],
  },
  {
    name: 'lab',
    description: 'Interactive experiments in agent sessions, context, token use, and browser games.',
    url: 'https://github.com/ragmha/lab',
    homepage: 'https://lab.raghib.io/',
  },
]

export const projectSnapshot: Project[] = [
  ...selectedProjects,
  ...githubProjects.filter((project) => !selectedProjects.some((selected) => selected.name === project.name)),
].map((project) => ({
  ...project,
  ...overrides['repository' in project ? project.repository : ''],
}))
