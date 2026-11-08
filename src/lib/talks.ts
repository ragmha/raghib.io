import { readFile } from 'node:fs/promises'
import { getCollection, type CollectionEntry } from 'astro:content'
import { Marp } from '@marp-team/marp-core'
import theme from '../styles/talk-theme.css?raw'

export type Talk = CollectionEntry<'talks'>

export async function getTalks(): Promise<Talk[]> {
  return (await getCollection('talks')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

// The page loads Marp's browser polyfill itself, so locked decks get it too.
export async function renderDeck(talk: Talk): Promise<string> {
  const marp = new Marp({ html: true, script: false })
  marp.themeSet.default = marp.themeSet.add(theme)
  const { html, css } = marp.render(await readFile(talk.filePath!, 'utf8'))
  return `<style>${css}</style>${html}`
}

// Requests are public issues, so they count demand; codes go out privately.
export function viewRequestUrl(talk: Talk): string {
  const query = new URLSearchParams({
    template: 'view-request.yml',
    title: `Can I view: ${talk.data.title}?`,
    talk: talk.id,
  })
  return `https://github.com/ragmha/raghib.io/issues/new?${query}`
}
