# raghib.io

Raghib Hasan's independent writing site about software, AI, systems,
governance, and technology adoption. Essays link to experiments, projects, and
source code where useful.

## Audience and positioning

- Readers are curious technical and non-technical people across industries,
  including people at AI labs. A post must make sense without knowing the
  author's employer or job.
- The author writes as an independent practitioner, not as a spokesperson for
  an employer or product. Lead with the problem and a point of view; the tool
  used belongs in the method, not the subject.
- Never invent customers, outcomes, metrics, testimonials, logos, or
  benchmarks.

## Stack and constraints

- Astro, TypeScript, plain CSS, and Bun. Pages are statically generated, with
  no application runtime or client-side framework.
- Keep pages fast, accessible (WCAG 2.2 AA: keyboard navigation, visible focus,
  reduced motion, readable contrast and line length), and comfortable for
  long-form reading.
- `DESIGN.md` is the visual design reference.

## Writing

- Posts live in `src/content/writing/*.mdx`. Use the `raghib-editorial-voice`
  skill to draft and revise, and the `employer-disclaimer` skill to decide on
  the disclaimer.
- Posts use American English. `seoTitle` must be 44 characters or fewer.

## Checks

Keep the CI job name `SEO readiness` unchanged: branch protection requires it.
Before handing off, run what CI runs:

```sh
npx --yes cspell@8.19.4 lint --no-progress
bun test --bail --timeout 20000
bun run build
bun run check:seo
bun run check:vitals
```
