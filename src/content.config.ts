import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { projectSnapshot } from './content/project-snapshot'
import { createWritingSchema, rstackSchema } from './lib/writing-schema'

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: ({ image }) => createWritingSchema(image),
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
    rstack: rstackSchema,
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
