import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { projectSnapshot } from './content/project-snapshot'
import { flowHeroes } from './lib/flow-hero.mjs'
import { TOPICS } from './lib/topics'
import { rstackVersionPattern, rstackPathPattern } from './lib/rstack.mjs'

const rstack = z
  .object({
    version: z.string().regex(rstackVersionPattern),
    uses: z.array(z.string().regex(rstackPathPattern)),
  })
  .optional()

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seoTitle: z.string().trim().min(1).optional(),
      description: z.string(),
      socialImage: z
        .string()
        .regex(/^\/(?!\/)/)
        .optional(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      topics: z.array(z.enum(TOPICS)).min(1),
      tags: z.array(z.string()).default([]),
      published: z.boolean().default(true),
      lab: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/)
        .optional(),
      rstack,
      cover: z
        .object({ src: image(), alt: z.string().trim().min(1) })
        .optional(),
      // Every post opens with an Anatomy illustration: the decision cover or a flow hero.
      hero: z.enum(['decision', ...Object.keys(flowHeroes)] as [
        string,
        ...string[],
      ]),
    }),
})

const projectWriteups = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/project-writeups',
  }),
  schema: z.object({
    project: z
      .string()
      .refine(
        (name) => projectSnapshot.some((project) => project.name === name),
        'Project must match a name in src/content/project-snapshot.ts',
      ),
    title: z.string().min(1),
    seoTitle: z.string().trim().min(1).optional(),
    description: z.string().min(1),
    date: z.coerce.date(),
    published: z.boolean().default(false),
    rstack,
  }),
})

// Marp decks. The page renders each file with Marp, so its frontmatter also
// carries Marp directives such as `paginate`; zod drops those here.
const talks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    kind: z.enum(['talk', 'workshop']),
    locked: z.boolean().default(false),
  }),
})

export const collections = { writing, projectWriteups, talks }
