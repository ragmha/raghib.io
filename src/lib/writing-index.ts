interface WritingIndexEntry {
  data: {
    published: boolean
    date: Date
  }
}

export function indexWritingPosts<T extends WritingIndexEntry>(
  entries: readonly T[],
  { includeDrafts = false, now = new Date() }: { includeDrafts?: boolean; now?: Date } = {},
): T[] {
  // A published post dated in the future stays hidden until the build runs on or after its date.
  return entries
    .filter(({ data }) => (data.published && data.date <= now) || includeDrafts)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}
