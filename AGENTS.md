# raghib.io

Raghib Hasan's independent writing site about software, AI, systems,
governance, and technology adoption. It is a place to share interests,
learning, and knowledge—not a marketing channel, CV, company showcase, or
content mill. Essays link to experiments, projects, and source code where useful.

## Audience and positioning

- Readers are curious technical and non-technical people across industries,
  including people at AI labs. A post must make sense without knowing the
  author's employer or job.
- The author writes as an independent practitioner, not as a spokesperson for
  an employer or product. Lead with the subject and a point of view when the
  material supports one; name a product when it is central to the idea or
  reader's task, not to promote it.
- Never invent customers, outcomes, metrics, testimonials, logos, or
  benchmarks, or attribute opinions, experiences, or conclusions to the author
  that they did not express.
- Let the idea and intended reader determine a piece's structure, length, and
  use of first person, examples, diagrams, or other visuals. Search discovery
  and SEO support the writing; they do not choose its subject or impose a
  recurring formula.

## Stack and constraints

- Astro, TypeScript, plain CSS, and Bun. Pages are statically generated, with
  no application runtime or client-side framework.
- Keep pages fast, accessible (WCAG 2.2 AA: keyboard navigation, visible focus,
  reduced motion, readable contrast and line length), and comfortable for
  long-form reading.
- `DESIGN.md` is the visual design reference.

## Writing

- Posts live in `src/content/writing/*.mdx`. Project skills live in
  `.agents/skills/` in the [Agent Skills](https://agentskills.io) format, so
  any agent harness can load them:
  - `raghib-editorial-voice` drafts and revises posts.
  - `post-layout` covers the hero machine, diagrams, and companion
    repositories.
  - `publication-preflight` checks a draft or post before review or release.
- Use an isometric hero machine or Mermaid/Excalidraw diagram when it makes the
  idea easier to understand; do not add one just to satisfy a formula. A
  tutorial whose code spans more than one file, or more than 150 lines, puts
  the runnable project in a companion repository.
- Posts never name the author's employer or its products (Microsoft, GitHub,
  Copilot, Azure, LinkedIn, VS Code, OpenAI and similar), and carry no
  disclaimer. `tests/no-employer.test.mjs` fails CI on any such name outside
  code blocks and URLs.
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
