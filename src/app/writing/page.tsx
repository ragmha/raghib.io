import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, type PostMeta } from '@/lib/blog'
import { WritingHeader } from '@/components/blog/writing-header'
import { Divider } from '@/components/blog/divider'

export const metadata: Metadata = {
  title: 'Writing — Raghib Hasan',
  description:
    'Notes on AI, engineering, developer tools, and the things I build.',
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function groupByYear(posts: PostMeta[]): [string, PostMeta[]][] {
  const map = new Map<string, PostMeta[]>()
  for (const p of posts) {
    const year = new Date(p.frontmatter.date).getFullYear().toString()
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(p)
  }
  return Array.from(map.entries()).sort(
    ([a], [b]) => Number(b) - Number(a)
  )
}

export default function WritingPage() {
  const posts = getAllPosts()
  const grouped = groupByYear(posts)

  return (
    <main className="min-h-screen px-6 sm:px-8 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <WritingHeader path={[{ label: '~', href: '/' }, { label: 'writing' }]} />

        <section className="font-mono">
          <h1 className="text-xl font-bold text-text mb-2">writing</h1>
          <p className="text-sm text-subtext0 leading-relaxed">
            Notes on AI, engineering, developer tools, and the occasional
            project teardown. Short, opinionated, written to be read.
          </p>
        </section>

        <Divider />

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-overlay1">
            No posts yet — check back soon.
          </p>
        ) : (
          <div className="font-mono space-y-10">
            {grouped.map(([year, yearPosts]) => (
              <section key={year} aria-labelledby={`year-${year}`}>
                <h2
                  id={`year-${year}`}
                  className="text-xs uppercase tracking-wider text-overlay1 mb-4"
                >
                  {year}
                </h2>
                <ul className="space-y-5">
                  {yearPosts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/writing/${post.slug}`}
                        className="group block"
                      >
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <h3 className="text-base text-text font-medium group-hover:text-blue transition-colors">
                            {post.frontmatter.title}
                          </h3>
                          <span className="text-xs text-overlay1 shrink-0">
                            {shortDate(post.frontmatter.date)}
                          </span>
                        </div>
                        {post.frontmatter.description && (
                          <p className="text-sm text-subtext0 mt-1 leading-relaxed">
                            {post.frontmatter.description}
                          </p>
                        )}
                        {post.frontmatter.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {post.frontmatter.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-mauve/80"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <Divider />

        <footer className="font-mono text-xs text-overlay0 text-center pb-6">
          {posts.length} post{posts.length !== 1 ? 's' : ''}
          <span className="mx-2 text-surface2">·</span>
          <Link
            href="/writing/feed.xml"
            className="hover:text-text transition-colors"
          >
            rss
          </Link>
        </footer>
      </div>
    </main>
  )
}
