import { getCollection, type CollectionEntry } from 'astro:content'
import { indexWritingPosts } from './writing-index'

export type WritingEntry = CollectionEntry<'writing'>

export async function getPublishedPosts(): Promise<WritingEntry[]> {
  return getVisiblePosts()
}

export async function getVisiblePosts(
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<WritingEntry[]> {
  return indexWritingPosts(await getCollection('writing'), { includeDrafts })
}

export function getPostSlug(post: WritingEntry): string {
  return post.id.replace(/\.(md|mdx)$/, '')
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase()
}

export function estimateReadingTime(body: string | undefined): string {
  const words = body?.trim().split(/\s+/).filter(Boolean).length ?? 0
  return `${Math.max(1, Math.ceil(words / 220))} MIN READ`
}

export function getTaxonomySlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Search-friendly display names for shorthand or ambiguous tags.
const TAG_LABELS: Record<string, string> = {
  ai: 'AI',
  astro: 'Astro',
  copilot: 'GitHub Copilot',
  design: 'Design',
  dns: 'DNS',
  dx: 'Developer Experience',
  infrastructure: 'Infrastructure',
  migration: 'Migration',
  nextjs: 'Next.js',
  operations: 'Operations',
  react: 'React',
  rsc: 'React Server Components',
  writing: 'Writing',
}

export function getTagLabel(tag: string): string {
  return TAG_LABELS[tag.toLowerCase()] ?? tag
}

// Most posts first; ties fall back to alphabetical.
export function groupPosts(
  posts: WritingEntry[],
  keys: (post: WritingEntry) => readonly string[],
): Array<{ name: string; slug: string; posts: WritingEntry[] }> {
  const groups = new Map<string, WritingEntry[]>()
  for (const post of posts) {
    for (const key of keys(post)) groups.set(key, [...(groups.get(key) ?? []), post])
  }
  return [...groups]
    .map(([name, posts]) => ({ name, slug: getTaxonomySlug(name), posts }))
    .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name))
}

// Topics plus tags stay at three labels per post.
const MAX_LABELS = 3

function normalizeTagText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getPostTags(post: WritingEntry): string[] {
  const topics = post.data.topics.map((topic) => topic.toLowerCase())
  const relevanceText = normalizeTagText(
    `${post.data.title} ${post.data.description}`
  )

  return post.data.tags
    .map((tag, index) => {
      const label = getTagLabel(tag)
      const tagText = normalizeTagText(tag)
      const labelText = normalizeTagText(label)

      return {
        tag,
        label,
        index,
        // Prefer tags the title or description actually talks about.
        score:
          relevanceText.includes(tagText) || relevanceText.includes(labelText)
            ? 1
            : 0,
      }
    })
    .filter(({ label }) => !topics.includes(label.toLowerCase()))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, MAX_LABELS - topics.length))
    .map(({ tag }) => tag)
}

// Fixed palette so each tag always gets the same color across the site.
const TAG_COLORS = [
  'orange',
  'red',
  'blue',
  'yellow',
  'green',
  'pink',
] as const

export type TagColor = (typeof TAG_COLORS)[number]

export function getTagColor(tag: string): TagColor {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return TAG_COLORS[hash % TAG_COLORS.length]
}
