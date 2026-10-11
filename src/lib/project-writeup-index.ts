import type { Project } from '../content/project-snapshot'

interface WriteupEntry {
  id: string
  data: {
    project: string
    published: boolean
  }
}

export function indexProjectWriteups<T extends WriteupEntry>(
  entries: readonly T[],
  projects: readonly Project[],
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
  const seen = new Set<string>()
  const visible: Array<{ project: Project; writeup: T; href: string }> = []

  for (const writeup of entries) {
    const project = projects.find((entry) => entry.name === writeup.data.project)
    if (!project) {
      throw new Error(`Writeup "${writeup.id}" references unknown project "${writeup.data.project}".`)
    }
    if (seen.has(project.name)) {
      throw new Error(`Multiple writeups reference "${project.name}". Keep one writeup per project.`)
    }
    seen.add(project.name)
    if (writeup.data.published || includeDrafts) {
      visible.push({
        project,
        writeup,
        href: `/project/${encodeURIComponent(project.name)}/writings/`,
      })
    }
  }

  return visible
}
