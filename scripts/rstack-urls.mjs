import { readdir, readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { rstackUrl } from '../src/lib/rstack.mjs'

for (const directory of ['src/content/writing', 'src/content/project-writeups']) {
  for (const file of await readdir(directory, { recursive: true })) {
    if (!/\.mdx?$/.test(file)) continue
    const source = await readFile(`${directory}/${file}`, 'utf8')
    const frontmatter = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    if (!frontmatter) throw new Error(`${directory}/${file}: missing YAML frontmatter`)
    const { rstack } = parse(frontmatter[1])
    if (!rstack) continue
    for (const path of rstack.uses) console.log(rstackUrl(rstack.version, path))
  }
}
