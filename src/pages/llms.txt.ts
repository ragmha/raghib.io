import type { APIRoute } from 'astro'
import { getPostSlug, getPublishedPosts } from '../lib/posts'
import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'

export const GET: APIRoute = async ({ url, site }) => {
  const home = getCanonicalUrl(new URL('/', url), site)
  const link = (path: string) => new URL(path, home).href
  const posts = await getPublishedPosts()

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

This file is a machine-readable index for LLMs and AI assistants. The full text of every post is at ${link('/llms-full.txt')}.

## Pages

- [Home](${link('/')}): Introduction, latest writing, and projects.
- [Writing](${link('/writing/')}): Every published article.
- [Projects](${link('/projects/')}): Open-source projects and write-ups.
- [Experiments](${link('/experiments/')}): Interactive experiments that accompany the writing.
- [RSS feed](${link('/writing/feed.xml')}): Subscribe to new posts.

## Posts

${posts
  .map((post) => `- [${post.data.title}](${link(`/writing/${getPostSlug(post)}/`)}) (${post.data.date.toISOString().slice(0, 10)}): ${post.data.description}`)
  .join('\n')}
`

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
