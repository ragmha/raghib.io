import githubProjects from './github-projects.json'

export interface Project {
  name: string
  description: string
  url: string
  homepage?: string
  language?: string
  extraLinks?: { label: string; url: string }[]
}

const overrides: Record<
  string,
  Partial<Pick<Project, 'description' | 'homepage' | 'extraLinks'>>
> = {
  'ragmha/apple-books-mcp': {
    description: 'Connect AI assistants to your Apple Books library.',
  },
}

const selectedProjects: Project[] = [
  {
    name: 'build-your-harness',
    description:
      'Build a TypeScript and Bun AI agent harness from first principles.',
    url: 'https://github.com/ragmha/build-your-harness',
    extraLinks: [
      {
        label: 'Tutorial',
        url: 'https://raghib.io/writing/build-your-agent-harness/',
      },
    ],
  },
  {
    name: 'experiments',
    description:
      'Interactive experiments in agent sessions, context, token use, and browser games.',
    url: 'https://github.com/ragmha/raghib.io/tree/main/apps/experiments',
    homepage: 'https://raghib.io/experiments/',
  },
  {
    name: 'apple-books-mcp',
    description: 'Connect AI assistants to your Apple Books library.',
    url: 'https://github.com/ragmha/apple-books-mcp',
  },
]

export function buildProjectSnapshot(
  syncedProjects: readonly Project[],
): Project[] {
  const repositories = new Set<string>()
  const names = new Set<string>()
  const projects: Project[] = []
  for (const project of [...selectedProjects, ...syncedProjects]) {
    const repository = new URL(project.url).pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.git$/i, '')
      .toLowerCase()
    if (repositories.has(repository)) continue
    const name = project.name.toLowerCase()
    if (names.has(name)) {
      throw new Error(
        `Distinct repositories share project name "${project.name}". Project names must be unique.`,
      )
    }
    repositories.add(repository)
    names.add(name)
    projects.push({ ...project, ...overrides[repository] })
  }
  return projects
}

export const projectSnapshot = buildProjectSnapshot(githubProjects)
