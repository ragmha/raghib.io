import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { projectSnapshot } from './content/project-snapshot'
import { flowHeroes } from './lib/flow-hero.mjs'

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    seoTitle: z.string().trim().min(1).optional(),
    description: z.string(),
    socialImage: z.string().regex(/^\/(?!\/)/).optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
    cover: z.object({ src: image(), alt: z.string().trim().min(1) }).optional(),
    // Every post opens with an Anatomy illustration: the decision cover or a flow hero.
    hero: z.enum(['decision', ...Object.keys(flowHeroes)] as [string, ...string[]]),
  }),
})

const projectWriteups = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/project-writeups' }),
  schema: z.object({
    project: z.string().refine(
      (name) => projectSnapshot.some((project) => project.name === name),
      'Project must match a name in src/content/project-snapshot.ts',
    ),
    title: z.string().min(1),
    seoTitle: z.string().trim().min(1).optional(),
    description: z.string().min(1),
    date: z.coerce.date(),
    published: z.boolean().default(false),
  }),
})

export const collections = { writing, projectWriteups }
