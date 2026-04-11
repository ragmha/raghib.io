import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { getPostBySlug, getAllSlugs, formatPostDate } from '@/lib/blog'
import { TerminalShell } from '@/components/blog/terminal-shell'
import {
  TableOfContents,
  extractHeadings,
} from '@/components/blog/table-of-contents'
import { getMDXComponents } from '@/components/blog/mdx-components'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: `${post.frontmatter.title} — Raghib Hasan`,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: post.frontmatter.date,
      authors: ['Raghib Hasan'],
      tags: post.frontmatter.tags,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const headings = extractHeadings(post.content)
  const components = getMDXComponents()

  return (
    <main className="min-h-screen bg-gradient-to-br from-base to-mantle px-4 sm:px-6 md:px-8 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 text-sm text-overlay1 hover:text-green transition-colors font-mono"
          >
            <span className="text-green">$</span> cd ~/writing
          </Link>
        </div>

        <TerminalShell title={`~/writing/${slug}.mdx`}>
          <div className="p-4 sm:p-6">
            {/* Prompt */}
            <div className="text-green mb-4">
              <span className="text-green font-bold">$</span>{' '}
              <span className="text-text">
                cat ~/writing/{slug}.mdx
              </span>
            </div>

            {/* Post header */}
            <div className="border border-surface0 rounded-lg bg-mantle p-4 mb-8 font-mono text-sm">
              <div className="text-surface2 select-none mb-2">
                ┌──────────────────────────────────
              </div>
              <div className="space-y-1 pl-1">
                <div>
                  <span className="text-overlay1">title:</span>{' '}
                  <span className="text-text font-bold text-lg">
                    {post.frontmatter.title}
                  </span>
                </div>
                <div>
                  <span className="text-overlay1">author:</span>{' '}
                  <span className="text-subtext1">Raghib Hasan</span>
                </div>
                <div>
                  <span className="text-overlay1">date:</span>{' '}
                  <span className="text-subtext1">
                    {formatPostDate(post.frontmatter.date)}
                  </span>
                  <span className="text-surface2 mx-2">|</span>
                  <span className="text-subtext1">{post.readingTime}</span>
                </div>
                {post.frontmatter.tags?.length > 0 && (
                  <div>
                    <span className="text-overlay1">tags:</span>{' '}
                    {post.frontmatter.tags.map((tag) => (
                      <span key={tag} className="text-mauve mr-2">
                        --{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-surface2 select-none mt-2">
                └──────────────────────────────────
              </div>
            </div>

            {/* Table of contents */}
            <TableOfContents headings={headings} />

            {/* MDX content */}
            <article>
              <MDXRemote
                source={post.content}
                components={components}
                options={{
                  mdxOptions: {
                    rehypePlugins: [
                      rehypeSlug,
                      [
                        rehypePrettyCode,
                        {
                          theme: 'catppuccin-mocha',
                        },
                      ],
                      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                    ],
                  },
                }}
              />
            </article>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-surface0 font-mono text-sm">
              <Link
                href="/writing"
                className="text-overlay1 hover:text-green transition-colors"
              >
                <span className="text-green">$</span> cd ~/writing
              </Link>
            </div>
          </div>
        </TerminalShell>
      </div>
    </main>
  )
}
