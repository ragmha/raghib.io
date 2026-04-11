'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PostMeta } from '@/lib/blog'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function PostEntry({ post }: { post: PostMeta }) {
  const date = formatDate(post.frontmatter.date)

  return (
    <Link
      href={`/writing/${post.slug}`}
      className="block group py-3 hover:bg-surface0/30 -mx-2 px-2 rounded transition-colors"
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-surface2 select-none shrink-0 hidden sm:inline">
          -rw-r--r--
        </span>
        <span className="text-overlay1 shrink-0 w-[100px]">{date}</span>
        <span className="text-overlay1 shrink-0 w-[50px] text-right">
          {post.readingTime.replace(' read', '')}
        </span>
        <span className="text-blue group-hover:text-lavender transition-colors font-bold truncate">
          {post.slug}.mdx
        </span>
      </div>
      {post.frontmatter.description && (
        <div className="text-subtext0 text-xs mt-1 ml-0 sm:ml-[calc(10ch+0.5rem)]">
          <span className="text-green select-none">→ </span>
          {post.frontmatter.description}
        </div>
      )}
      {post.frontmatter.tags?.length > 0 && (
        <div className="flex gap-2 mt-1 ml-0 sm:ml-[calc(10ch+0.5rem)]">
          {post.frontmatter.tags.map((tag) => (
            <span key={tag} className="text-xs text-mauve">
              --{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export function PostList({ posts }: { posts: PostMeta[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.frontmatter.tags ?? []))
  ).sort()

  const filtered = activeTag
    ? posts.filter((p) => p.frontmatter.tags?.includes(activeTag))
    : posts

  return (
    <div>
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-green font-bold">$</span>
          <span className="text-text">grep</span>
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              activeTag === null
                ? 'bg-green text-crust font-bold'
                : 'text-overlay1 hover:text-text'
            }`}
          >
            --all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                tag === activeTag
                  ? 'bg-blue text-crust font-bold'
                  : 'text-mauve hover:text-lavender'
              }`}
            >
              --{tag}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-surface0/50">
        {filtered.map((post) => (
          <PostEntry key={post.slug} post={post} />
        ))}
      </div>

      {filtered.length === 0 && activeTag && (
        <div className="text-overlay1 py-4">
          <span className="text-yellow">⚠</span> No posts matching --{activeTag}
        </div>
      )}
    </div>
  )
}
