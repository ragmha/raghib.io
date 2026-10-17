const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

// Plain text for LLM consumption, like Liquid's strip_html: diagrams, styles, and scripts carry no prose.
export function htmlToText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>|<\/(p|h[1-6]|li|pre|blockquote|figure|figcaption|tr|table|ul|ol|div|section|aside)>/gi, '$&\n\n')
    .replace(/<\/t[dh]>/gi, '$&\t')
  // Strip to a fixed point so no tag can survive, whatever the input (CodeQL js/incomplete-multi-character-sanitization).
  for (let previous = ''; previous !== text; ) {
    previous = text
    text = text.replace(/<(svg|style|script|template)\b[\s\S]*?<\/\1>|<[^>]+>/gi, '')
  }
  return text
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) =>
      code[0] !== '#' ? ENTITIES[code.toLowerCase()] ?? entity
        : String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
