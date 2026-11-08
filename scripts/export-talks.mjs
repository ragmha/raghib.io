// Exports each unlocked talk to PDF and PowerPoint beside its page in dist.
// Runs after `astro build` so the theme's fonts and site-absolute images
// resolve from dist. The PowerPoint holds one image per slide.
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { marpCli } from '@marp-team/marp-cli'
import { chromium } from 'playwright'
import { parse } from 'yaml'

const source = 'src/content/talks'

for (const file of (await readdir(source)).filter((name) => name.endsWith('.md'))) {
  const markdown = await readFile(`${source}/${file}`, 'utf8')
  if (parse(/^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? '')?.locked) continue

  const slug = file.replace(/\.md$/, '')
  const deck = `dist/talks/${slug}/${slug}.md`
  // From dist/talks/<slug>/, ../../ is the site root.
  await writeFile(deck, markdown.replaceAll('](/', '](../../').replaceAll('src="/', 'src="../../'))
  for (const format of ['--pdf', '--pptx']) {
    const status = await marpCli([
      deck,
      format,
      '--html',
      '--allow-local-files',
      '--theme',
      'src/styles/talk-theme.css',
      '--browser-path',
      chromium.executablePath(),
    ])
    if (status !== 0) throw new Error(`Marp ${format} export failed for ${slug}`)
  }
  await rm(deck)
}
