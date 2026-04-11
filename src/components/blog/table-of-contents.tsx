interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null

  return (
    <nav
      className="mb-8 border border-surface0 rounded-lg bg-mantle p-4 font-mono text-sm"
      aria-label="Table of contents"
    >
      <div className="text-overlay1 mb-2 text-xs uppercase tracking-wider">
        ./ contents
      </div>
      <ul className="space-y-1">
        {headings.map((heading, index) => {
          const isLast = index === headings.length - 1
          const nextIsChild =
            !isLast && headings[index + 1].level > heading.level
          const prefix =
            heading.level === 2
              ? isLast
                ? '└── '
                : '├── '
              : '│   ' + (isLast ? '└── ' : '├── ')

          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="text-subtext1 hover:text-blue transition-colors"
              >
                <span className="text-surface2 select-none">{prefix}</span>
                {heading.text}
              </a>
            </li>
          )
        })}
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
