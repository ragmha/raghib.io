interface WritingIndexEntry {
  data: {
    published: boolean
    date: Date
  }
}

export function indexWritingPosts<T extends WritingIndexEntry>(
  entries: readonly T[],
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): T[] {
  return entries
    .filter(({ data }) => data.published || includeDrafts)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}
