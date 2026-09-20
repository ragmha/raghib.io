import assert from 'node:assert/strict'
import { parseDocument } from 'yaml'

export function readPublication(source, collection, file) {
  if (!['writing', 'projectWriteups'].includes(collection)) {
    throw new Error(`${file}: unknown content collection "${collection}"`)
  }
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error(`${file}: missing YAML frontmatter`)
  const document = parseDocument(match[1])
  if (document.errors.length) throw new Error(`${file}: ${document.errors[0].message}`)
  const data = document.toJS()
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${file}: frontmatter must be an object`)
  }
  const published = data.published === undefined ? collection === 'writing' : data.published
  if (typeof published !== 'boolean') throw new Error(`${file}: published must be a boolean`)
  if (!published) return null

  for (const field of ['title', 'description']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`${file}: published content needs a nonempty ${field}`)
    }
  }
  if (data.seoTitle !== undefined && (typeof data.seoTitle !== 'string' || !data.seoTitle.trim())) {
    throw new Error(`${file}: seoTitle must be a nonempty string`)
  }
  if (!['string', 'number'].includes(typeof data.date) && !(data.date instanceof Date)) {
    throw new Error(`${file}: published content needs a publication date`)
  }
  const date = new Date(data.date)
  if (!Number.isFinite(date.getTime())) throw new Error(`${file}: invalid publication date`)
  const body = source.slice(match[0].length)
  const hasBodyContent = body.split(/<!--[\s\S]*?-->/).some((part) => part.trim().length > 0)
  if (!hasBodyContent) {
    throw new Error(`${file}: published content needs an article body`)
  }
  return {
    collection,
    headline: data.title,
    searchTitle: data.seoTitle?.trim() ?? data.title,
    description: data.description,
    datePublished: date.toISOString(),
  }
}

export function assertPublicationsMatch(expected, rendered) {
  const signature = ({ collection, headline, searchTitle, description, datePublished }) =>
    JSON.stringify([collection, headline, searchTitle, description, datePublished])
  assert.deepEqual(
    rendered.map(signature).sort(),
    expected.map(signature).sort(),
    'Rendered articles must match all published source entries and exclude drafts',
  )
}
