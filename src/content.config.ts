import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { projectSnapshot } from './content/project-snapshot'

const postSchema = z.object({
  title: z.string(),
  seoTitle: z.string().trim().min(1).optional(),
  description: z.string(),
  socialImage: z.string().regex(/^\/(?!\/)/).optional(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(true),
})

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: postSchema,
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

// Finnish translations share the English file name, so /fi/writing/<slug>/ mirrors /writing/<slug>/.
const writingFi = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing-fi' }),
  schema: postSchema,
})

export const collections = { writing, writingFi, projectWriteups }
