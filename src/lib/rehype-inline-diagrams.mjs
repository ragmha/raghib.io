// Inline /diagrams/*.svg images so their colours follow the site theme toggle.
// An SVG loaded through <img> can only see the OS colour scheme in some browsers.
import { readFileSync } from 'node:fs'
import { fromHtml } from 'hast-util-from-html'
import { visit } from 'unist-util-visit'

const diagramsDirectory = new URL('../../public/diagrams/', import.meta.url)

function attributesOf(node) {
  if (node.type === 'element') return node.properties
  return Object.fromEntries(
    (node.attributes ?? [])
      .filter((attribute) => typeof attribute.value === 'string')
      .map((attribute) => [attribute.name, attribute.value]),
  )
}

export default function rehypeInlineDiagrams() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      const isImage =
        (node.type === 'element' && node.tagName === 'img') ||
        (node.type?.startsWith('mdxJsx') && node.name === 'img')
      if (!isImage || !parent || index === undefined) return

      const { src, alt, width, height } = attributesOf(node)
      const match = /^\/diagrams\/([\w-]+\.svg)$/.exec(src ?? '')
      if (!match) return

      const svgText = readFileSync(new URL(match[1], diagramsDirectory), 'utf8')
      const svg = fromHtml(svgText, { fragment: true }).children.find(
        (child) => child.type === 'element' && child.tagName === 'svg',
      )
      if (!svg) throw new Error(`No <svg> root in ${match[1]}`)

      delete svg.properties.ariaLabelledBy
      // The alt text becomes aria-label; nested <title>s would read as page titles.
      svg.children = svg.children.filter(
        (child) => !(child.type === 'element' && ['title', 'desc'].includes(child.tagName)),
      )
      Object.assign(svg.properties, {
        role: 'img',
        ariaLabel: alt,
        width: width ?? svg.properties.width,
        height: height ?? svg.properties.height,
      })
      parent.children[index] = svg
    })
  }
}
