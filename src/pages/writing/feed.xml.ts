import rss from '@astrojs/rss'
import { getPostSlug, getPublishedPosts } from '../../lib/posts'

export async function GET(context: { site: URL }) {
  const posts = await getPublishedPosts()

  return rss({
    title: 'Writing · Raghib Hasan',
    description:
      'Independent writing on software, AI, systems, and responsible technology.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${getPostSlug(post)}`,
    })),
  })
}
