import type { APIRoute } from 'astro'
import { getCanonicalUrl } from '../lib/seo'

// AI crawlers are named explicitly so the writing can be indexed, retrieved, and cited by assistants.
const AI_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'cohere-ai',
  'Meta-ExternalAgent',
]

export const GET: APIRoute = ({ url, site }) => {
  const home = getCanonicalUrl(new URL('/', url), site)
  const groups = ['*', ...AI_AGENTS].map((agent) => `User-agent: ${agent}\nAllow: /\n`)
  return new Response(
    `${groups.join('\n')}\n${['/sitemap.xml', '/sitemap-index.xml'].map((path) => `Sitemap: ${new URL(path, home).href}\n`).join('')}`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
