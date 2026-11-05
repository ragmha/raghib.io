import { getPublishedPosts, getPostSlug } from '../lib/posts'

export async function GET() {
  const posts = await getPublishedPosts()
  return Response.json({
    writings: posts.map((post) => ({
      slug: getPostSlug(post),
      ...(post.data.lab ? { lab: post.data.lab } : {}),
    })),
  })
}
