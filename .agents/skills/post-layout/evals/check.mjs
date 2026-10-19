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
const { flowHeroes, flowHeroSvg } = await import(pathToFileURL(join(repo, 'src/lib/flow-hero.mjs')).href)

// Same frame check as tests/flow-hero.test.mjs.
const labelsOutsideFrame = svg => {
  const [, , width, height] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
  return [...svg.matchAll(/class="decision-hero-label"[^>]*translate\((-?[\d.]+) (-?[\d.]+)\)"><text text-anchor="(\w+)">([^<]*)</g)]
    .filter(([, x, y, anchor, text]) => {
      const length = text.replaceAll(/&\w+;/g, '_').length * 9.1
      const left = +x - length * { start: 0, middle: 0.5, end: 1 }[anchor]
      return !(left >= 0 && +y >= 11 && left + length <= width && +y + 4 <= height)
    })
    .map(([, , , , text]) => text)
}

// Same counting rule as tests/post-layout.test.mjs, kept per block so the grader can see files.
const codeBlocks = source => {
  const blocks = []
  let open = null
  for (const line of source.split('\n')) {
    const fence = line.match(/^\s*```(\w*)(.*)$/)
    if (fence && !open) open = { lang: fence[1], title: fence[2].match(/title="([^"]+)"/)?.[1], lines: [] }
    else if (fence) blocks.push(open), (open = null)
    else open?.lines.push(line)
  }
  if (open) blocks.push(open)
  return blocks.filter(block => block.lang !== 'mermaid').map(({ lang, title, lines }) => ({
    lang,
    lines: lines.length,
    file: title ?? lines[0]?.match(/^\s*(?:\/\/|#|--)\s*((?:[\w.-]+\/)*[\w.-]+\.\w+)\s*$/)?.[1] ?? null,
  }))
}

// portraits: names a <source media="(max-width: 60rem)"> serves.
const excalidraw = (name, portraits) => {
  const svgPath = join(repo, 'public/diagrams', `${name}.svg`)
  if (!existsSync(svgPath)) return { name, exists: false }
  const svg = readFileSync(svgPath, 'utf8')
  const sourcePath = join(repo, 'src/assets/diagrams', `${name}.excalidraw`)
  const elements = existsSync(sourcePath)
    ? JSON.parse(readFileSync(sourcePath, 'utf8')).elements.filter(element => !element.isDeleted)
    : null
  return {
    name,
    exists: true,
    themed: svg.includes('id="diagram-theme"'),
    titled: /<title[\s>]/.test(svg) && /<desc[\s>]/.test(svg),
    rawColors: [...new Set(svg.replace(/<mask[\s\S]*?<\/mask>/g, '').match(/(?:fill|stroke)="#[\da-f]{3,8}"/gi) ?? [])],
    width: Number(svg.match(/\bviewBox="([^"]+)"/)?.[1].split(/\s+/)[2]),
    minFontSize: Math.min(...[...svg.matchAll(/font-size="([\d.]+)px"/g)].map(match => Number(match[1]))),
    source: Boolean(elements),
    shapes: elements?.filter(element => ['rectangle', 'diamond', 'ellipse'].includes(element.type)).length,
    arrows: elements?.filter(element => element.type === 'arrow').length,
    ...(name.endsWith('-portrait') ? {} : { portrait: portraits.has(`${name}-portrait`) }),
  }
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
  const code = codeBlocks(source)
  const portraits = new Set([...source.matchAll(/<source\b[^>]*>/g)]
    .filter(([tag]) => tag.includes('media="(max-width: 60rem)"'))
    .flatMap(([tag]) => [...tag.matchAll(/\/diagrams\/([\w-]+)\.svg/g)].map(([, name]) => name)))

  posts.push({
    file,
    published: /^published:\s*true\s*$/m.test(source),
    hero: {
      name: hero,
      registered: Boolean(hero && flowHeroes[hero]),
      usedByOtherPosts: files.filter(other => other !== file && heroOf(read(other)) === hero),
      labelsOutsideFrame: hero && flowHeroes[hero] ? labelsOutsideFrame(flowHeroSvg(flowHeroes[hero])) : null,
    },
    mermaid: mermaid.map((block, i) => {
      const result = rendered[i]
      const svg = result.status === 'fulfilled' ? result.value.svg : ''
      return {
        type: block.replace(/^\s*---[\s\S]*?---\s*/, '').replace(/^\s*%%.*$/gm, '').trim().split(/\s/)[0],
        accTitle: /^\s*accTitle:/m.test(block),
        accDescr: /^\s*accDescr:/m.test(block),
        renders: result.status === 'fulfilled',
        error: result.status === 'fulfilled' ? undefined : String(result.reason).split('\n')[0],
        // Flowchart and state nodes, sequence participants; links, transitions, messages.
        nodes: count(svg, /<g[^>]*class="[^"]*\bnode\b/g) + count(svg, /class="[^"]*\bactor-top\b/g),
        edges: count(svg, /class="[^"]*\b(?:flowchart-link|transition)\b/g) + count(svg, /class="messageLine[01]"/g),
      }
    }),
    excalidraw: [...new Set([...source.matchAll(/\/diagrams\/([\w-]+)\.svg/g)].map(([, name]) => name))].map(name => excalidraw(name, portraits)),
    codeLines: code.reduce((total, block) => total + block.lines, 0),
    codeBlocks: code,
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
