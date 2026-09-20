// Wrap section headings in an unnumbered divider while preserving their anchors.
import { visit } from 'unist-util-visit'

export default function rehypeParts() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'h2' || !parent || index === null) return

      const part = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['part'] },
        children: [
          {
            type: 'element',
            tagName: 'h2',
            properties: { ...node.properties },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['part-heading'] },
                children: node.children,
              },
            ],
          },
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
