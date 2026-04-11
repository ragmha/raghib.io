import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { TerminalShell } from '@/components/blog/terminal-shell'
import { PostList } from '@/components/blog/post-list'

export const metadata: Metadata = {
  title: 'Writing — Raghib Hasan',
  description:
    'Thoughts on AI, engineering, developer tools, and project deep-dives.',
}

export default function WritingPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle px-4 sm:px-6 md:px-8 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-overlay1 hover:text-green transition-colors font-mono mb-6"
          >
            <span className="text-green">$</span> cd ~
          </Link>
        </div>

        <TerminalShell title="~/writing">
          <div className="p-4 sm:p-6">
            <div className="text-green mb-1">
              <span className="text-green font-bold">$</span>{' '}
              <span className="text-text">ls -la ~/writing/</span>
            </div>
            <div className="text-overlay1 text-xs mb-4">
              total {posts.length} post{posts.length !== 1 ? 's' : ''}
            </div>

            <PostList posts={posts} />

            {posts.length === 0 && (
              <div className="text-overlay1 py-8">
                <span className="text-yellow">⚠</span> No posts found. Check
                back soon.
              </div>
            )}
          </div>
        </TerminalShell>
      </div>
    </main>
  )
}
