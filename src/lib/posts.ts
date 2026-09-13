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
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function estimateReadingTime(body: string | undefined): string {
  const words = body?.trim().split(/\s+/).filter(Boolean).length ?? 0
  return `${Math.max(1, Math.ceil(words / 220))} min read`
}
