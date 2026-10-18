import type { APIRoute } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { getContainerRenderer } from '@astrojs/mdx'
import { loadRenderers } from 'astro:container'
import { render } from 'astro:content'
import { htmlToText } from '../lib/html-to-text'
import { getPostSlug, getPublishedPosts } from '../lib/posts'
import { getCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'

export const GET: APIRoute = async ({ url, site }) => {
  const home = getCanonicalUrl(new URL('/', url), site)
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) })
  const posts = await Promise.all((await getPublishedPosts()).map(async (post) => ({
    post,
    text: htmlToText(await container.renderToString((await render(post)).Content)),
  })))

  const body = `# ${SITE_NAME}: full content

> ${SITE_DESCRIPTION}

This file contains the full text of every post, concatenated for LLMs and AI assistants.
Source: ${home.href}
Index: ${new URL('/llms.txt', home).href}
${posts
  .map(({ post, text }) => `
================================================================================

# ${post.data.title}

URL: ${new URL(`/writing/${getPostSlug(post)}/`, home).href}
Date: ${post.data.date.toISOString().slice(0, 10)}
${post.data.tags.length ? `Tags: ${post.data.tags.join(', ')}\n` : ''}
${text}
`)
  .join('')}`

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
