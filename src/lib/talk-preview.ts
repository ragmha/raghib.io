import { Marp } from '@marp-team/marp-core'

// Marpit ends a slide at any thematic break (---, ***, ___, - - -) or a
// headingDivider heading, so its parser decides where the cover stops.
export function extractCoverSlide(markdown: string): string {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(markdown)
  if (!frontmatter) throw new Error('Talk deck is missing frontmatter')
  const slides: { type: string; map: [number, number] | null }[] = new Marp({ html: true }).markdown
    .parse(markdown, {})
    .filter((token: { type: string }) => token.type === 'marpit_slide_open')
  const start = frontmatter[0].split(/\r?\n/).length - 1
  return markdown.split(/\r?\n/).slice(start, slides[1]?.map?.[0]).join('\n').trim()
}
