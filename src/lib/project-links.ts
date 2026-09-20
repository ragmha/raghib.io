import type { Project } from '../content/project-snapshot'

export function getProjectLinks(project: Project): { label: string; url: string }[] {
  const links = [
    { label: 'Source', url: project.url },
    ...(project.homepage ? [{ label: 'Live demo', url: project.homepage }] : []),
    ...(project.extraLinks ?? []),
  ]

  for (const link of links) {
    if (!link.label.trim()) {
      throw new Error(`Project "${project.name}" has a link without a label.`)
    }
    let url: URL
    try {
      url = new URL(link.url)
    } catch {
      throw new Error(`Project "${project.name}" has an invalid URL for "${link.label}".`)
    }
    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new Error(`Project "${project.name}" requires an HTTP(S) URL for "${link.label}".`)
    }
  }

  return links
}
