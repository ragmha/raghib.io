import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { projectSnapshot } from './content/project-snapshot'

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().trim().min(1).optional(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
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
