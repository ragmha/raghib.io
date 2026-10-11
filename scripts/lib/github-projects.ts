export interface Repository {
  __typename: string
  name: string
  nameWithOwner: string
  description: string | null
  url: string
  homepageUrl: string | null
  isPrivate: boolean
  primaryLanguage: { name: string } | null
}

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface Response {
  errors?: { message: string }[]
  data?: {
    user?: { lists: {
      nodes: { id: string; slug: string }[]
      pageInfo: PageInfo
    } } | null
    node?: { items: {
      nodes: (Repository | null)[]
      pageInfo: PageInfo
    } } | null
  }
}

export type Query = (
  query: string,
  variables: Record<string, string | null>,
) => Promise<Response>

export interface SyncedProject {
  name: string
  repository: string
  description: string
  url: string
  homepage?: string
  language?: string
}

function nextCursor(page: PageInfo, seen: Set<string>): string | null {
  if (!page.hasNextPage) return null
  if (!page.endCursor || seen.has(page.endCursor)) {
    throw new Error('GitHub returned invalid pagination; snapshot was not updated.')
  }
  seen.add(page.endCursor)
  return page.endCursor
}

export async function fetchProjectList(query: Query): Promise<SyncedProject[]> {
  let cursor: string | null = null
  let listId: string | undefined
  const listCursors = new Set<string>()
  do {
    const response = await query(`
      query($owner: String!, $cursor: String) {
        user(login: $owner) {
          lists(first: 100, after: $cursor) {
            nodes { id slug }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`, { owner: 'ragmha', cursor })
    const lists = response.data?.user?.lists
    if (response.errors?.length || !lists) {
      throw new Error('Could not read GitHub star lists. Check gh authentication and list access.')
    }
    listId = lists.nodes.find((list) => list.slug === 'blog-projects')?.id
    if (listId) break
    cursor = nextCursor(lists.pageInfo, listCursors)
  } while (cursor)
  if (!listId) throw new Error('The ragmha/blog-projects star list was not found or is not accessible.')

  cursor = null
  const itemCursors = new Set<string>()
  const projects: SyncedProject[] = []
  const names = new Set<string>()
  do {
    const response = await query(`
      query($id: ID!, $cursor: String) {
        node(id: $id) {
          ... on UserList {
            items(first: 100, after: $cursor) {
              nodes {
                __typename
                ... on Repository {
                  name nameWithOwner description url homepageUrl isPrivate
                  primaryLanguage { name }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }`, { id: listId, cursor })
    const items = response.data?.node?.items
    if (response.errors?.length || !items) {
      throw new Error('Could not read every repository in blog-projects; snapshot was not updated.')
    }
    for (const repo of items.nodes) {
      if (!repo || repo.__typename !== 'Repository') {
        throw new Error('The list contains an unavailable or unsupported item; snapshot was not updated.')
      }
      if (repo.isPrivate !== false) {
        throw new Error('The list contains a private repository. Remove it before publishing the list.')
      }
      if (!/^[A-Za-z0-9_.-]+$/.test(repo.name) || names.has(repo.name.toLowerCase())) {
        throw new Error('Project names must be unique URL-safe repository names; snapshot was not updated.')
      }
      if (repo.url !== `https://github.com/${repo.nameWithOwner}`) {
        throw new Error('GitHub returned an unexpected repository URL; snapshot was not updated.')
      }
      let homepage: string | undefined
      if (repo.homepageUrl) {
        const parsed = new URL(repo.homepageUrl)
        if (!['https:', 'http:'].includes(parsed.protocol)) {
          throw new Error('A project homepage must be an HTTP(S) URL; snapshot was not updated.')
        }
        homepage = repo.homepageUrl
      }
      names.add(repo.name.toLowerCase())
      projects.push({
        name: repo.name,
        repository: repo.nameWithOwner,
        description: repo.description ?? '',
        url: repo.url,
        ...(homepage ? { homepage } : {}),
        ...(repo.primaryLanguage ? { language: repo.primaryLanguage.name } : {}),
      })
    }
    cursor = nextCursor(items.pageInfo, itemCursors)
  } while (cursor)
  return projects
}
