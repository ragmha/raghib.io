import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { getPostBySlug, getAllSlugs, formatPostDate } from '@/lib/blog'
import {
  TableOfContents,
  extractHeadings,
} from '@/components/blog/table-of-contents'
import { WritingHeader } from '@/components/blog/writing-header'
import { Divider } from '@/components/blog/divider'
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
    <main className="min-h-screen px-6 sm:px-8 py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <WritingHeader
          path={[
            { label: '~', href: '/' },
            { label: 'writing', href: '/writing' },
            { label: `${slug}.mdx` },
          ]}
        />

        <article className="font-mono">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight tracking-tight">
              {post.frontmatter.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-overlay1">
              <time dateTime={post.frontmatter.date}>
                {formatPostDate(post.frontmatter.date)}
              </time>
              <span aria-hidden="true" className="text-surface2">
                ·
              </span>
              <span>{post.readingTime}</span>
              {post.frontmatter.tags?.length > 0 && (
                <>
                  <span aria-hidden="true" className="text-surface2">
                    ·
                  </span>
                  <span className="flex flex-wrap gap-x-2">
                    {post.frontmatter.tags.map((tag) => (
                      <span key={tag} className="text-mauve/80">
                        #{tag}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>

            {post.frontmatter.description && (
              <p className="mt-4 text-sm text-subtext0 leading-relaxed">
                {post.frontmatter.description}
              </p>
            )}
          </header>

          <Divider />

          <TableOfContents headings={headings} />

          <div>
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
                  ],
                },
              }}
            />
          </div>

          <Divider />

          <footer className="font-mono text-xs text-overlay1 flex items-center justify-between pb-6">
            <Link
              href="/writing"
              className="hover:text-text transition-colors"
            >
              ← back to writing
            </Link>
            <a
              href="#top"
              className="hover:text-text transition-colors"
              aria-label="Back to top"
            >
              top ↑
            </a>
          </footer>
        </article>
      </div>
    </main>
  )
}
