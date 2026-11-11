export function extractCoverSlide(markdown: string): string {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(markdown)
  if (!frontmatter) throw new Error('Talk deck is missing frontmatter')
  return markdown.slice(frontmatter[0].length).split(/^---\s*$/m, 1)[0].trim()
}
