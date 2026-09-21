import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getPostSlug, getPublishedPosts } from '../../lib/posts'
import { getCanonicalUrl } from '../../lib/seo'

export const GET: APIRoute = async ({ url, site }) => {
  const posts = await getPublishedPosts()

  return rss({
    title: 'Writing · Raghib Hasan',
    description:
      'Independent writing on software, AI, systems, and responsible technology.',
    site: getCanonicalUrl(new URL('/', url), site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${getPostSlug(post)}/`,
    })),
  })
}
