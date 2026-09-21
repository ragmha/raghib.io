import type { APIRoute } from 'astro'
import { getCanonicalUrl } from '../lib/seo'

export const GET: APIRoute = ({ url, site }) => {
  const home = getCanonicalUrl(new URL('/', url), site)
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', home).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
