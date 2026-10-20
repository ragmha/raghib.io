// Inline /diagrams/*.svg images so their colours follow the site theme toggle.
// An SVG loaded through <img> can only see the OS colour scheme in some browsers.
import { readFileSync } from 'node:fs'
import { fromHtml } from 'hast-util-from-html'
import { SKIP, visit } from 'unist-util-visit'

const diagramsDirectory = new URL('../../public/diagrams/', import.meta.url)
// writing.css swaps .diagram-portrait in at the same breakpoint.
const portraitMedia = '(max-width: 60rem)'

function nameOf(node) {
  if (node.type === 'element') return node.tagName
  if (node.type?.startsWith('mdxJsx')) return node.name
}

function attributesOf(node) {
  if (node.type === 'element') return node.properties
  return Object.fromEntries(
    (node.attributes ?? [])
      .filter((attribute) => typeof attribute.value === 'string')
      .map((attribute) => [attribute.name, attribute.value]),
  )
}

function inlineSvg({ src, alt, width, height }, className) {
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
    dataSource: src,
    ...(className && { className: [className] }),
  })
  return svg
}

export default function rehypeInlineDiagrams() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return
      const name = nameOf(node)

      if (name === 'img' && nameOf(parent) !== 'picture') {
        const svg = inlineSvg(attributesOf(node))
        if (svg) parent.children[index] = svg
        return
      }
      if (name !== 'picture') return

      const img = node.children.find((child) => nameOf(child) === 'img')
      const source = node.children.find((child) => nameOf(child) === 'source')
      if (!img || !source) return
      const imgAttributes = attributesOf(img)
      const sourceAttributes = attributesOf(source)
      const landscape = inlineSvg(imgAttributes, 'diagram-landscape')
      if (!landscape) return
      if (sourceAttributes.media !== portraitMedia) {
        throw new Error(`Diagram <source> media must be "${portraitMedia}", got "${sourceAttributes.media}"`)
      }
      const portrait = inlineSvg(
        {
          ...sourceAttributes,
          src: sourceAttributes.srcSet ?? sourceAttributes.srcset,
          alt: imgAttributes.alt,
        },
        'diagram-portrait',
      )
      if (!portrait) throw new Error(`Diagram <source> must point at /diagrams/*.svg next to ${imgAttributes.src}`)

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['diagram-variants'] },
        children: [portrait, landscape],
      }
      return SKIP
    })
  }
}
