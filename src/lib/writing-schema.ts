import { z } from 'astro/zod'
import { flowHeroes } from './flow-hero.mjs'
import { TOPICS } from './topics'
import { rstackPathPattern, rstackVersionPattern } from './rstack.mjs'

export const rstackSchema = z
  .object({
    version: z.string().regex(rstackVersionPattern),
    uses: z.array(z.string().regex(rstackPathPattern)),
  })
  .optional()

export const createWritingSchema = <Image extends z.ZodType>(image: () => Image) =>
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
    rstack: rstackSchema,
    cover: z
      .object({ src: image(), alt: z.string().trim().min(1) })
      .optional(),
    // Optional illustration: the decision cover or a flow hero.
    hero: z.enum(['decision', ...Object.keys(flowHeroes)] as [
      string,
      ...string[],
    ]).optional(),
  })
