import type { APIRoute, GetStaticPaths } from 'astro'
import { getTalks, type Talk } from '../../../lib/talks'
import { renderPresentation } from '../../../lib/talk-presentation'

export const getStaticPaths = (async () =>
  (await getTalks())
    .filter((talk) => !talk.data.locked || import.meta.env.DEV)
    .map((talk) => ({ params: { slug: talk.id }, props: { talk } }))
) satisfies GetStaticPaths

export const GET: APIRoute<{ talk: Talk }> = async ({ props: { talk }, site }) =>
  new Response(
    await renderPresentation(talk.filePath!, new URL(`/talks/${talk.id}/`, site)),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
