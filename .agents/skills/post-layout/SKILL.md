---
name: post-layout
description: Lay out a raghib.io post. Invent its isometric hero machine, choose its diagram with diagram-design and draw it in Mermaid or Excalidraw, and move large tutorial code into a companion repository. Use when creating, drafting, restructuring, or publishing any post in src/content/writing/, or when a post needs a hero banner, a diagram, or a companion repo.
---

# Post layout

Every post uses the same frame, so the author doesn't have to dictate it each
time: a hero machine, at least one diagram, and a post short enough to read.
`src/content/writing/decide-cheaply-generate-carefully.mdx` is the reference
layout. Words and mode come from the `raghib-editorial-voice` skill; this skill
covers structure and visuals.

## Order

1. Frontmatter, including `hero`, which the schema requires.
2. The disclaimer, when the `employer-disclaimer` skill requires it.
3. An opening of a few short paragraphs that states the question or
   observation, before the first `##`.
4. `##` and `###` sections. Put a diagram wherever the reader would otherwise
   read a long explanation of a flow, sequence, structure, or state. Use a
   table to compare options.
5. A close that fits the mode, such as what is still unknown or what to try
   next.

## Hero banner

The rule comes from [Anatomy](https://skills.wheresryan.sh/anatomy/collection):
**the object is the explanation**. Invent a real, recognizable machine whose
moving parts do what the post's idea does. Don't draw boxes, arrows, or
floating labels. The collection shows the vocabulary: a queue is a marble run,
an LRU cache is a bookcase, and a Bloom filter is a fruit machine. Heroes
already on this site include a ticket gate (agent harness), a fuel rig (budget
fallback), a railway junction (DNS delegation), and a sorting desk (action
triage). The schema and `tests/flow-hero.test.mjs` require every post to have
its own scene.

1. Write one sentence before drawing anything: "A *machine* where *part* is
   *concept*, and *motion* means *claim*." Map each concept to a part. The
   hero must not add claims the post doesn't make.
2. Add a scene function to `src/lib/flow-hero.mjs` that uses the `workshop`
   kit, and copy the shape of `agentHarness`:
   - Start with `t.base(...)` around the origin. The deck top is `B`, so parts
     sit at `z = B` and rails run at `B + 1`.
   - Draw from back to front, because paint order is draw order.
   - Use dozens of small parts (`plate`, `box`, `cyl`, `bar`, `tray`, `dial`,
     `lamp`), not a few large slabs. Make exactly one part the lit subject
     with `{ lit: true }`.
   - Use the `green`, `blue`, `red`, and `mid` tones for outcomes, and `lo`,
     `mid`, and `hi` for structure.
   - Put words only in short, all-caps `t.label` callouts. `render` fits the
     frame automatically.
3. Add a `flowHeroes` entry with these fields:
   - `art`: the scene function.
   - `label`: alt text that names the machine and what each part stands for.
   - `outputs`: two to four tone-coded outcomes that match the scene's labels.
   - `thesis`: two short lines.
   - `note`: an honest caveat, such as illustrative, simplified, or fictional
     data.
4. Set `hero: "<name>"` in the frontmatter.
5. Run `bun test tests/flow-hero.test.mjs`. Then start `bun run dev` and open
   `/hero/<name>.svg` and the post in light and dark themes, at 360 px and at
   desktop width. Labels must not overlap or clip.

The `decision` hero is a one-off for the reference post. New posts use flow
heroes.

## Diagrams

Every post needs at least one Mermaid or Excalidraw diagram, and
`tests/post-layout.test.mjs` enforces this. The hero is a metaphor; diagrams
show the post's own system directly.

### Choose the diagram with diagram-design

Use the `diagram-design` skill
([cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design),
MIT) to decide which diagram the post needs. If your harness doesn't have the
skill, install it with `npx skills add cathrynlavery/diagram-design`, or read
its [SKILL.md](https://github.com/cathrynlavery/diagram-design/blob/550fd66edff058bc73056c3416b76d69cfe865ba/skills/diagram-design/SKILL.md)
and the `references/` file for the type you choose. Use it only to choose and
edit the diagram. Skip its style guide, onboarding gate, fonts, and HTML
output, because this site's theme owns the look.

1. Find the claim in the post that a reader would understand faster from a
   picture than from a paragraph. If a sentence or a table would explain it
   just as well, pick a different claim.
2. If behavior, state, enforcement, or risk carries the meaning, choose a
   semantic pattern from `references/semantic-patterns.md` first. Then pick
   the visual type from its guide, and read that type's reference.
3. Keep to its budget: at most 9 nodes, at most 12 arrows, one or two focal
   elements, and nothing a reader wouldn't miss if you removed it. If the
   diagram goes over, split it into an overview and a detail.
4. Before drawing, tell the author the claim, the pattern and type, the
   medium, and anything the budget forced out.
5. Draw it in the medium that suits the type:
   - **Mermaid `flowchart`:** flowchart, process, data flow, architecture,
     tree, or dependency graph. This is the only Mermaid type the theme CSS in
     `astro.config.mjs` covers for light and dark.
   - **Another Mermaid type** (`sequenceDiagram`, `stateDiagram-v2`,
     `erDiagram`, `timeline`, `quadrantChart`, `xychart-beta`, `gantt`) for
     sequence, state machine, ER, timeline, quadrant, bar or line chart, or
     Gantt. These render, but check them in light and dark, and extend
     `themeCSS` if their colors don't follow the theme.
   - **Excalidraw:** spatial or editorial types such as loop, nested, layer
     stack, Venn, pyramid, swimlane, fishbone, service blueprint, and exploded
     or axonometric views.

### Draw it

- **Mermaid:** write a fenced `mermaid` block. Put the diagram's title in
  `accTitle` and a one-sentence description of its content in `accDescr`.
  Keep labels short. It renders to SVG at build time.
- **Excalidraw** is for concept art and scenes. Save the source as
  `src/assets/diagrams/<name>.excalidraw` and export the SVG to
  `public/diagrams/<name>.svg`. Then run `bun run theme:diagrams` and embed the
  SVG as `<figure class="excalidraw-figure">` with an `<img>` that has
  `width`, `height`, and descriptive `alt`. Wide diagrams need a `-portrait`
  variant inside `<picture>`; see the README.

## Code and companion repositories

A post explains the idea, and a repository runs it. When a tutorial needs more
than about 150 lines of code, or more than a couple of files, put the runnable
project in its own public repository with tests and a README, as with
[ragmha/build-your-harness](https://github.com/ragmha/build-your-harness). Ask
the author before you create a repository.

In the post:

- Link the repository near the top, and pin it to a commit or tag when the
  post shows results.
- Give the clone and run commands.
- Show only the excerpts that carry the idea, and link to the full files.

`tests/post-layout.test.mjs` fails any post with more than 150 lines of fenced
code, not counting Mermaid.
