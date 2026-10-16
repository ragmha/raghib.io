import type { APIRoute } from 'astro'
import { decisionHeroSvg } from '../lib/decision-hero.mjs'

export const GET: APIRoute = () =>
  new Response(decisionHeroSvg, { headers: { 'Content-Type': 'image/svg+xml' } })
