import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import {
  getAllPosts,
  getPostBySlug,
  getAllTags,
  getAllSlugs,
  formatPostDate,
} from '@/lib/blog'

vi.mock('fs')

const MOCK_POST_1 = `---
title: "First Post"
description: "A first post"
date: "2026-04-10"
tags: ["react", "nextjs"]
published: true
---

## Hello World

This is the first post content.
`

const MOCK_POST_2 = `---
title: "Second Post"
description: "A second post"
date: "2026-04-05"
tags: ["ai", "copilot"]
published: true
---

## AI Things

More content here about AI.
`

const MOCK_UNPUBLISHED = `---
title: "Draft"
description: "Not published"
date: "2026-04-01"
tags: ["draft"]
published: false
---

Draft content.
`

describe('blog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllPosts', () => {
    it('returns published posts sorted by date descending', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        'second-post.mdx' as unknown as fs.Dirent,
        'first-post.mdx' as unknown as fs.Dirent,
        'draft.mdx' as unknown as fs.Dirent,
      ])
      vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
        const path = filePath.toString()
        if (path.includes('first-post')) return MOCK_POST_1
        if (path.includes('second-post')) return MOCK_POST_2
        if (path.includes('draft')) return MOCK_UNPUBLISHED
        return ''
      })

      const posts = getAllPosts()

      expect(posts).toHaveLength(2)
      expect(posts[0].slug).toBe('first-post')
      expect(posts[1].slug).toBe('second-post')
      expect(posts[0].frontmatter.title).toBe('First Post')
    })

    it('returns empty array if content directory does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      expect(getAllPosts()).toEqual([])
    })

    it('includes reading time', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        'first-post.mdx' as unknown as fs.Dirent,
      ])
      vi.spyOn(fs, 'readFileSync').mockReturnValue(MOCK_POST_1)

      const posts = getAllPosts()
      expect(posts[0].readingTime).toMatch(/min read/)
    })
  })

  describe('getPostBySlug', () => {
    it('returns post with frontmatter and content', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(MOCK_POST_1)

      const post = getPostBySlug('first-post')

      expect(post).not.toBeNull()
      expect(post!.frontmatter.title).toBe('First Post')
      expect(post!.content).toContain('Hello World')
      expect(post!.readingTime).toMatch(/min read/)
    })

    it('returns null if post does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      expect(getPostBySlug('nonexistent')).toBeNull()
    })
  })

  describe('getAllTags', () => {
    it('returns sorted unique tags from all posts', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        'first-post.mdx' as unknown as fs.Dirent,
        'second-post.mdx' as unknown as fs.Dirent,
      ])
      vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
        const path = filePath.toString()
        if (path.includes('first-post')) return MOCK_POST_1
        return MOCK_POST_2
      })

      const tags = getAllTags()

      expect(tags).toEqual(['ai', 'copilot', 'nextjs', 'react'])
    })
  })

  describe('getAllSlugs', () => {
    it('returns slugs from mdx filenames', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        'first-post.mdx' as unknown as fs.Dirent,
        'second-post.mdx' as unknown as fs.Dirent,
      ])

      const slugs = getAllSlugs()
      expect(slugs).toEqual(['first-post', 'second-post'])
    })

    it('returns empty array if directory does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      expect(getAllSlugs()).toEqual([])
    })
  })

  describe('formatPostDate', () => {
    it('formats date as readable string', () => {
      const formatted = formatPostDate('2026-04-10')
      expect(formatted).toContain('April')
      expect(formatted).toContain('2026')
      expect(formatted).toContain('10')
    })
  })
})
