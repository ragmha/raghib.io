// Mechanical facts for evals.json, from a repo copy an eval run worked in.
// Usage: bun .agents/skills/post-layout/evals/check.mjs <repo-copy>
// The copy must be a git repository whose root commit is the state before the run.
// Judgment calls (is it a machine? does the diagram add claims?) stay with the grader.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createMermaidRenderer } from 'mermaid-isomorphic'

const repo = resolve(process.argv[2] ?? '.')
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
const rootCommit = git('rev-list', '--max-parents=0', 'HEAD')
const before = new Set(git('ls-tree', '--name-only', rootCommit, 'src/content/writing/').split('\n'))

const dir = join(repo, 'src/content/writing')
const files = readdirSync(dir).filter(name => /\.mdx?$/.test(name))
const read = name => readFileSync(join(dir, name), 'utf8')
const heroOf = source => source.match(/^hero:\s*"?([\w-]+)"?\s*$/m)?.[1]
const { flowHeroes } = await import(pathToFileURL(join(repo, 'src/lib/flow-hero.mjs')).href)

// Same counting rule as tests/post-layout.test.mjs.
const codeLines = source => {
  let fence = null
  let count = 0
  for (const line of source.split('\n')) {
    const open = line.match(/^\s*```(\w*)/)
    if (open) fence = fence === null ? open[1] : null
    else if (fence !== null && fence !== 'mermaid') count++
  }
  return count
}

const render = createMermaidRenderer()
const count = (svg, pattern) => (svg.match(pattern) ?? []).length

const posts = []
for (const file of files.filter(name => !before.has(`src/content/writing/${name}`))) {
  const source = read(file)
  const hero = heroOf(source)
  const mermaid = [...source.matchAll(/^\s*```mermaid\n([\s\S]*?)^\s*```/gm)].map(match => match[1])
  const rendered = await render(mermaid, {})
  const secondHeading = [...source.matchAll(/^## /gm)][1]?.index ?? source.length

  posts.push({
    file,
    published: /^published:\s*true\s*$/m.test(source),
    hero: {
      name: hero,
      registered: Boolean(hero && flowHeroes[hero]),
      usedByOtherPosts: files.filter(other => other !== file && heroOf(read(other)) === hero),
    },
    mermaid: mermaid.map((block, i) => {
      const result = rendered[i]
      const svg = result.status === 'fulfilled' ? result.value.svg : ''
      return {
        type: block.trim().split(/\s/)[0],
        accTitle: /^\s*accTitle:/m.test(block),
        accDescr: /^\s*accDescr:/m.test(block),
        renders: result.status === 'fulfilled',
        error: result.status === 'fulfilled' ? undefined : String(result.reason).split('\n')[0],
        // Flowchart and state nodes, sequence participants; links, transitions, messages.
        nodes: count(svg, /<g[^>]*class="[^"]*\bnode\b/g) + count(svg, /class="[^"]*\bactor-top\b/g),
        edges: count(svg, /class="[^"]*\b(?:flowchart-link|transition)\b/g) + count(svg, /class="messageLine[01]"/g),
      }
    }),
    excalidraw: [...source.matchAll(/\/diagrams\/([\w-]+\.svg)/g)].map(([, svg]) => {
      const path = join(repo, 'public/diagrams', svg)
      return { svg, exists: existsSync(path), themed: existsSync(path) && readFileSync(path, 'utf8').includes('id="diagram-theme"') }
    }),
    codeLines: codeLines(source),
    companionRepos: [...new Set([...source.matchAll(/github\.com\/ragmha\/([\w.-]+)/g)].map(([, name]) => name))]
      .filter(name => name !== 'raghib.io')
      .map(name => ({ name, nearTop: source.indexOf(`github.com/ragmha/${name}`) < secondHeading })),
  })
}

const tests = spawnSync('bun', ['test', 'tests/flow-hero.test.mjs', 'tests/post-layout.test.mjs'], { cwd: repo, encoding: 'utf8' })
const output = `${tests.stdout}${tests.stderr}`

console.log(JSON.stringify({
  posts,
  tests: {
    passed: tests.status === 0,
    summary: output.split('\n').filter(line => /^\s*\d+ (pass|fail)\b|^\(fail\)/.test(line)),
  },
  changedFiles: [
    ...git('diff', '--name-status', rootCommit).split('\n').filter(Boolean),
    ...git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean).map(name => `?\t${name}`),
  ],
}, null, 2))
process.exit(0)
