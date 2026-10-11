import { spawnSync } from 'node:child_process'
import { writeFile, rename, rm } from 'node:fs/promises'
import { fetchProjectList, type Query } from './lib/github-projects'

const query: Query = async (query, variables) => {
  const result = spawnSync('gh', ['api', 'graphql', '--input', '-'], {
    input: JSON.stringify({ query, variables }),
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 30_000,
  })
  if (result.error || result.status !== 0) {
    throw new Error('GitHub query failed. Ensure gh is installed and authenticated with access to blog-projects.')
  }
  return JSON.parse(result.stdout)
}

const output = new URL('../src/content/github-projects.json', import.meta.url)
const temporary = new URL(`${output.href}.tmp`)

try {
  const projects = await fetchProjectList(query)
  await writeFile(temporary, `${JSON.stringify(projects, null, 2)}\n`)
  await rename(temporary, output)
  console.log(`Synced ${projects.length} public repositories from ragmha/blog-projects.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await rm(temporary, { force: true })
}
