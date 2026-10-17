export default function rehypeEmployerDisclaimer() {
  return (tree) => {
    // ponytail: style the opening label; the publication check enforces its wording and placement.
    const paragraph = tree.children.find((node) => node.type === 'element')
    if (paragraph?.tagName !== 'p') return

    const label = paragraph.children[0]
    if (
      label?.tagName !== 'strong' ||
      label.children.length !== 1 ||
      label.children[0].type !== 'text' ||
      label.children[0].value !== 'Disclaimer:'
    ) return

    paragraph.properties = {
      ...paragraph.properties,
      className: [...(paragraph.properties.className ?? []), 'employer-disclaimer'],
      role: 'note',
    }
  }
}
