import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchProjectList, type Query, type Repository } from '../scripts/lib/github-projects'

const end = { hasNextPage: false, endCursor: null }
const list = { data: { user: { lists: {
  nodes: [{ id: 'selected-list', slug: 'blog-projects' }], pageInfo: end,
} } } }
function repo(name: string): Repository {
  return {
    __typename: 'Repository', name, nameWithOwner: `ragmha/${name}`,
    description: `${name} description`, url: `https://github.com/ragmha/${name}`,
    homepageUrl: null, isPrivate: false, primaryLanguage: { name: 'TypeScript' },
  }
}
function mock(responses: Awaited<ReturnType<Query>>[]) {
  const calls: Record<string, string | null>[] = []
  const query: Query = async (_, variables) => {
    calls.push(variables)
    const result = responses.shift()
    assert(result, 'Unexpected GraphQL call')
    return result
  }
  return { query, calls }
}
function items(nodes: (Repository | null)[]) {
  return { data: { node: { items: { nodes, pageInfo: end } } } }
}

test('finds only the named list and paginates lists and repository items', async () => {
  const { query, calls } = mock([
    { data: { user: { lists: {
      nodes: [{ id: 'other', slug: 'not-blog-projects' }],
      pageInfo: { hasNextPage: true, endCursor: 'list-page-2' },
    } } } },
    list,
    { data: { node: { items: {
      nodes: [repo('first')],
      pageInfo: { hasNextPage: true, endCursor: 'item-page-2' },
    } } } },
    items([repo('second')]),
  ])
  const result = await fetchProjectList(query)
  assert.deepEqual(result.map((project) => project.name), ['first', 'second'])
  assert.equal(calls[1].cursor, 'list-page-2')
  assert.equal(calls[2].id, 'selected-list')
  assert.equal(calls[3].cursor, 'item-page-2')
  assert.equal(result[0].repository, 'ragmha/first')
  assert.equal(result[0].language, 'TypeScript')
})

test('empty lists and missing optional metadata are represented faithfully', async () => {
  assert.deepEqual(await fetchProjectList(mock([list, items([])]).query), [])
  const [project] = await fetchProjectList(mock([list, items([{
    ...repo('sample'), description: null, primaryLanguage: null, homepageUrl: '',
  }])]).query)
  assert.equal(project.description, '')
  assert.equal(project.homepage, undefined)
  assert.equal(project.language, undefined)
})

test('fetch refuses private, unavailable, duplicate, and unsafe repository data', async () => {
  for (const nodes of [
    [{ ...repo('private'), isPrivate: true }],
    [null],
    [repo('duplicate'), repo('duplicate')],
    [{ ...repo('sample'), homepageUrl: 'javascript:alert(1)' }],
  ]) {
    await assert.rejects(fetchProjectList(mock([list, items(nodes)]).query))
  }
})

test('API errors and inaccessible lists fail instead of returning an empty success', async () => {
  await assert.rejects(fetchProjectList(mock([{ errors: [{ message: 'Denied' }] }]).query))
  await assert.rejects(fetchProjectList(mock([
    { data: { user: { lists: { nodes: [], pageInfo: end } } } },
  ]).query), /not found/)
  await assert.rejects(fetchProjectList(mock([
    list, { errors: [{ message: 'Rate limited' }], ...items([repo('partial')]) },
  ]).query), /every repository/)
})

test('repeating pagination cursors are rejected', async () => {
  const repeat = { data: { node: { items: {
    nodes: [], pageInfo: { hasNextPage: true, endCursor: 'same' },
  } } } }
  await assert.rejects(fetchProjectList(mock([list, repeat, repeat]).query), /pagination/)
})
