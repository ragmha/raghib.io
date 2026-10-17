import type { APIRoute } from 'astro'
import { flowHeroes, flowHeroSvg } from '../../lib/flow-hero.mjs'
import { getVisiblePosts } from '../../lib/posts'

type Name = keyof typeof flowHeroes

// Only heroes of visible posts are emitted, so drafts don't leak through their illustration.
export async function getStaticPaths() {
  const posts = await getVisiblePosts({ includeDrafts: import.meta.env.DEV })
  const names = new Set(posts.map((post) => post.data.hero).filter((hero) => hero !== 'decision'))
  return [...names].map((name) => ({ params: { name } }))
}

export const GET: APIRoute = ({ params }) =>
  new Response(flowHeroSvg(flowHeroes[params.name as Name]), { headers: { 'Content-Type': 'image/svg+xml' } })
