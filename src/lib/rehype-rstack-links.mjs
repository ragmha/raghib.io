import { visit } from 'unist-util-visit'
import { rstackUrl } from './rstack.mjs'

export default function rehypeRstackLinks() {
  return (tree, file) => {
    visit(tree, 'element', (node) => {
      const href = node.properties?.href
      if (node.tagName !== 'a' || typeof href !== 'string' || !href.startsWith('rstack:')) return

      const path = href.slice('rstack:'.length)
      const rstack = file.data.astro?.frontmatter?.rstack
      if (!rstack?.version) file.fail('rstack: links require rstack.version in frontmatter', node)
      if (!Array.isArray(rstack.uses) || !rstack.uses.includes(path)) {
        file.fail(`rstack reference "${path}" must be listed in rstack.uses`, node)
      }
      node.properties.href = rstackUrl(rstack.version, path)
    })
  }
}
