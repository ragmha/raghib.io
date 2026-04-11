import { describe, it, expect } from 'vitest'
import { extractHeadings } from '@/components/blog/table-of-contents'

describe('extractHeadings', () => {
  it('extracts h2 and h3 headings from markdown', () => {
    const content = `
## First Section

Some content.

### Subsection A

More content.

## Second Section

### Subsection B

Even more content.
`
    const headings = extractHeadings(content)

    expect(headings).toHaveLength(4)
    expect(headings[0]).toEqual({ id: 'first-section', text: 'First Section', level: 2 })
    expect(headings[1]).toEqual({ id: 'subsection-a', text: 'Subsection A', level: 3 })
    expect(headings[2]).toEqual({ id: 'second-section', text: 'Second Section', level: 2 })
    expect(headings[3]).toEqual({ id: 'subsection-b', text: 'Subsection B', level: 3 })
  })

  it('returns empty array for content with no headings', () => {
    const content = 'Just a paragraph of text.'
    expect(extractHeadings(content)).toEqual([])
  })

  it('ignores h1 and h4+ headings', () => {
    const content = `
# Title (h1 - ignored)

## Section (h2 - included)

#### Deep heading (h4 - ignored)
`
    const headings = extractHeadings(content)
    expect(headings).toHaveLength(1)
    expect(headings[0].text).toBe('Section (h2 - included)')
  })

  it('generates kebab-case IDs from heading text', () => {
    const content = '## Hello World Example'
    const headings = extractHeadings(content)
    expect(headings[0].id).toBe('hello-world-example')
  })

  it('strips special characters from IDs', () => {
    const content = "## What's the Deal?"
    const headings = extractHeadings(content)
    expect(headings[0].id).toBe('whats-the-deal')
  })
})
