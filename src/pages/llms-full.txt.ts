import type { APIRoute } from 'astro'
import { getPostSlug, getPublishedPosts } from '../lib/posts'
import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'

export const GET: APIRoute = async ({ url, site }) => {
  const home = getCanonicalUrl(new URL('/', url), site)
  const posts = await getPublishedPosts()

  // ponytail: raw MDX source; any JSX components appear as tags, render via the container API if that ever confuses readers
  const body = `# ${SITE_NAME}: full content

> ${SITE_DESCRIPTION}

This file contains the full text of every post, concatenated for LLMs and AI assistants.
Source: ${home.href}
Index: ${new URL('/llms.txt', home).href}
${posts
  .map((post) => `
================================================================================

# ${post.data.title}

URL: ${new URL(`/writing/${getPostSlug(post)}/`, home).href}
Date: ${post.data.date.toISOString().slice(0, 10)}
${post.data.tags.length ? `Tags: ${post.data.tags.join(', ')}\n` : ''}
${post.body?.trim() ?? ''}
`)
  .join('')}`

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
