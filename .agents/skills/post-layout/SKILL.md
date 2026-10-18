---
name: post-layout
description: Lay out a raghib.io post. Invent its isometric hero machine, add Mermaid or Excalidraw diagrams, and move large tutorial code into a companion repository. Use when creating, drafting, restructuring, or publishing any post in src/content/writing/, or when a post needs a hero banner, a diagram, or a companion repo.
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

- **Mermaid** is the default. Write a fenced `mermaid` block with `accTitle`
  and `accDescr`, and keep it to about 12 nodes. It renders to SVG at build
  time.
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
