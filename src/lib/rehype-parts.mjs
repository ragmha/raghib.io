// Rehype plugin that turns each `## Heading` (h2) into the numbered
// "part" divider used across the site: a folio number on each side of a
// centered, highlighted title, followed by a dashed rule. Mirrors the
// editorial layout ported from the closed static-generator prototype
// (PR #17) while keeping Astro's own markdown/MDX rendering pipeline.
import { visit } from 'unist-util-visit'

export default function rehypeParts() {
  return (tree) => {
    let count = 0

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'h2' || !parent || index === null) return

      count += 1
      const folio = { type: 'element', tagName: 'span', properties: { className: ['folio'], 'aria-hidden': 'true' }, children: [{ type: 'text', value: String(count) }] }

      const part = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['part'], id: node.properties?.id, 'data-part': String(count) },
        children: [
          folio,
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'mark',
                properties: {},
                children: node.children,
              },
            ],
          },
          { ...folio },
        ],
      }

      const rule = {
        type: 'element',
        tagName: 'hr',
        properties: { className: ['rule-dotted'] },
        children: [],
      }

      parent.children.splice(index, 1, part, rule)
      return index + 2
    })
  }
}
