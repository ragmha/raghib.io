// The fixed set of reader-facing topics. Each post picks one or more in frontmatter.
export const TOPICS = [
  'AI Tools',
  'Business',
  'Productivity',
  'Learning & Growth',
  'Tutorial',
  'Writing',
] as const

export type Topic = (typeof TOPICS)[number]
