// Exports each unlocked talk to PDF and PowerPoint beside its page in dist.
// Runs after `astro build` so the theme's fonts and site-absolute images
// resolve from dist. The PowerPoint holds one image per slide.
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { marpCli } from '@marp-team/marp-cli'
import { chromium } from 'playwright'
import { parse } from 'yaml'
import { extractCoverSlide } from '../src/lib/talk-preview.ts'

// Ubuntu 24.04 runners block the unprivileged user namespaces Chromium's
// sandbox needs. Playwright already launches without it for rehype-mermaid,
// and these decks are our own content.
process.env.CHROME_NO_SANDBOX ??= '1'

const source = 'src/content/talks'
const exportOptions = [
  '--html',
  '--allow-local-files',
  '--theme',
  'src/styles/talk-theme.css',
  '--browser-path',
  chromium.executablePath(),
]

for (const file of (await readdir(source)).filter((name) => name.endsWith('.md'))) {
  const markdown = await readFile(`${source}/${file}`, 'utf8')
  const slug = file.replace(/\.md$/, '')
  const deck = `dist/talks/${slug}/${slug}.md`
  // From dist/talks/<slug>/, ../../ is the site root.
  const withLocalPaths = (value) => value.replaceAll('](/', '](../../').replaceAll('src="/', 'src="../../')
  const locked = parse(/^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? '')?.locked

  if (locked) {
    const preview = `dist/talks/${slug}/${slug}-preview.md`
    await writeFile(preview, withLocalPaths(extractCoverSlide(markdown)))
    const status = await marpCli([preview, '--pdf', ...exportOptions])
    if (status !== 0) throw new Error(`Marp preview export failed for ${slug}`)
    await rm(preview)
    continue
  }

  await writeFile(deck, withLocalPaths(markdown))
  for (const format of ['--pdf', '--pptx']) {
    const status = await marpCli([deck, format, ...exportOptions])
    if (status !== 0) throw new Error(`Marp ${format} export failed for ${slug}`)
  }
  await rm(deck)
}
