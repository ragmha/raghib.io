interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null

  return (
    <nav
      className="my-6 border-y border-surface0 py-3 font-mono text-xs"
      aria-label="Table of contents"
    >
      <div className="text-overlay1 mb-1.5 uppercase tracking-wider">
        contents
      </div>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${heading.id}`}
              className="text-subtext1 hover:text-text underline-offset-4 hover:underline transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^#{2,3}\s+(.+)$/gm
  const headings: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].trim()
    const level = match[0].indexOf(' ')
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    headings.push({ id, text, level })
  }

  return headings
}
