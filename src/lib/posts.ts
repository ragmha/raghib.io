import { getCollection, type CollectionEntry } from 'astro:content'

export type WritingEntry = CollectionEntry<'writing'>

export async function getPublishedPosts(): Promise<WritingEntry[]> {
  const posts = await getCollection('writing', ({ data }) => data.published)

  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  )
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

const CATEGORIES = [
  'AI',
  'Web',
  'Infrastructure',
  'Design',
  'Systems',
  'Developer Workflow',
] as const

export type WritingCategory = (typeof CATEGORIES)[number]

const CATEGORY_RULES: Array<{
  category: WritingCategory
  keywords: string[]
}> = [
  {
    category: 'AI',
    keywords: ['ai', 'agent', 'agents', 'copilot', 'llm', 'automation'],
  },
  {
    category: 'Web',
    keywords: ['web', 'react', 'nextjs', 'rsc', 'astro', 'frontend'],
  },
  {
    category: 'Infrastructure',
    keywords: ['dns', 'infrastructure', 'migration', 'operations', 'hosting'],
  },
  {
    category: 'Design',
    keywords: ['design', 'writing', 'layout', 'typography', 'interface'],
  },
  {
    category: 'Systems',
    keywords: ['systems', 'architecture', 'platform', 'governance', 'trust'],
  },
  {
    category: 'Developer Workflow',
    keywords: ['dx', 'developer', 'workflow', 'tooling', 'build'],
  },
]

export function getPostCategory(post: WritingEntry): WritingCategory {
  const searchableText = [
    post.data.title,
    post.data.description,
    ...post.data.tags,
    post.body ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const scores = CATEGORY_RULES.map(({ category, keywords }) => ({
    category,
    score: keywords.reduce((total, keyword) => {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'g')
      return total + (searchableText.match(pattern)?.length ?? 0)
    }, 0),
  }))

  scores.sort((a, b) => b.score - a.score)
  return scores[0]?.score ? scores[0].category : 'Systems'
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

// Together with the category badge this keeps each post at three labels.
const MAX_TAGS = 2

function normalizeTagText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getPostTags(post: WritingEntry): string[] {
  const category = getPostCategory(post).toLowerCase()
  const relevanceText = normalizeTagText(
    `${post.data.title} ${post.data.description}`
  )

  return post.data.tags
    .map((tag, index) => {
      const label = TAG_LABELS[tag.toLowerCase()] ?? tag
      const tagText = normalizeTagText(tag)
      const labelText = normalizeTagText(label)

      return {
        label,
        index,
        // Prefer tags the title or description actually talks about.
        score:
          relevanceText.includes(tagText) || relevanceText.includes(labelText)
            ? 1
            : 0,
      }
    })
    .filter(({ label }) => label.toLowerCase() !== category)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_TAGS)
    .map(({ label }) => label)
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

const CATEGORY_COLORS: Record<WritingCategory, TagColor> = {
  AI: 'pink',
  Web: 'blue',
  Infrastructure: 'orange',
  Design: 'yellow',
  Systems: 'green',
  'Developer Workflow': 'red',
}

export function getCategoryColor(category: WritingCategory): TagColor {
  return CATEGORY_COLORS[category]
}
