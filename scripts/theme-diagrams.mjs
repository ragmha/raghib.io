import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const palettes = [
  ['paper', ['#f7f5f0', '#262a33'], '#ffffff', '#000000'],
  ['ink', ['#1c1b18', '#dedfe3'], '#0d0d0d', '#ffffff'],
  ['surface', ['#f2f0e7', '#ffffff'], '#f3f3f3', '#181818'],
  ['muted', ['#6f6d63', '#b8bac0'], '#5d5d5d', '#b9b9b9'],
  ['rule', ['#c9c5b6', '#3b414a'], '#d8d8d8', '#424242'],
  ['green-ink', ['#47603e'], '#47603e', '#a6c994'],
  ['green-surface', ['#e2ecd9'], '#e2ecd9', '#1d2c19'],
  ['ochre-ink', ['#816121'], '#816121', '#e1bf73'],
  ['ochre-surface', ['#f4e9c7'], '#f4e9c7', '#302719'],
  ['red-ink', ['#9b493e'], '#9b493e', '#eea397'],
  ['red-surface', ['#f6ded7'], '#f6ded7', '#321e1a'],
  ['blue', ['#91adc9'], '#426685', '#91adc9'],
  ['pink', ['#ff70b1'], '#aa2865', '#ff70b1'],
  ['orange', ['#f08022'], '#9b4b08', '#f08022'],
]

export function themeDiagram(svg) {
  if (!/^<svg\b/.test(svg)) throw new Error('Expected an SVG document')
  const colors = new Map(palettes.flatMap(([name, values, light]) =>
    values.map(value => [value, `var(--diagram-${name}, ${light})`])))
  const declarations = (index) => palettes
    .map(palette => `--diagram-${palette[0]}:${palette[index]};`).join('')
  // Standalone files follow the OS; inlined diagrams follow the site's data-theme.
  const style = `<style id="diagram-theme">svg{${declarations(2)}}@media(prefers-color-scheme:dark){svg{${declarations(3)}}}[data-theme=light] svg{${declarations(2)}}[data-theme=dark] svg{${declarations(3)}}</style>`
  return svg
    .replace(/<style id="diagram-theme">[\s\S]*?<\/style>/g, '')
    .replace(/<mask\b[\s\S]*?<\/mask>|\b(fill|stroke)="(#[0-9a-f]{6})"/gi, (attribute, property, color) =>
      property && colors.has(color.toLowerCase())
        ? `${property}="${colors.get(color.toLowerCase())}"`
        : attribute)
    .replace(/(<svg\b[^>]*>)/, `$1${style}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const directory = new URL('../public/diagrams/', import.meta.url)
  for (const name of readdirSync(directory).filter(name => name.endsWith('.svg'))) {
    const path = new URL(name, directory)
    writeFileSync(path, themeDiagram(readFileSync(path, 'utf8')))
    console.log(`Themed ${name}`)
  }
}
