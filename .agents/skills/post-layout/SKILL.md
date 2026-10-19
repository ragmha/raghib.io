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
   - Put words only in short, all-caps `t.label` callouts. `render` scales the
     machine so that it and its labels fit the frame.
3. Add a `flowHeroes` entry with these fields:
   - `art`: the scene function.
   - `label`: alt text that names the machine and what each part stands for.
   - `outputs`: two to four tone-coded outcomes that match the scene's labels.
   - `thesis`: two short lines.
   - `note`: an honest caveat, such as illustrative, simplified, or fictional
     data.
4. Set `hero: "<name>"` in the frontmatter.
5. Run `bun test tests/flow-hero.test.mjs`, which checks that every label
   stays inside the frame. Then start `bun run dev` and open
   `/hero/<name>.svg` and the post in light and dark themes, at 360 px and at
   desktop width. Labels must not overlap each other or the parts they name.

The `decision` hero is a one-off for the reference post. New posts use flow
heroes.

## Diagrams

Every post needs at least one Mermaid or Excalidraw diagram, and
`tests/post-layout.test.mjs` enforces this. The hero is a metaphor; diagrams
show the post's own system directly.

### Choose the diagram with diagram-design

Choose with the `diagram-design` skill
([cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design),
MIT). Reading it is required, not optional: open its `SKILL.md`, then
`references/semantic-patterns.md` when step 2 applies, then the
`references/type-<type>.md` file for the type you pick. If your harness
doesn't have the skill, install it with
`npx skills add cathrynlavery/diagram-design`, or read the same files from its
[SKILL.md](https://github.com/cathrynlavery/diagram-design/blob/550fd66edff058bc73056c3416b76d69cfe865ba/skills/diagram-design/SKILL.md)
on GitHub. Use it only to choose and edit the diagram. Skip its style guide,
onboarding gate, fonts, and HTML output, because this site's theme owns the
look.

1. Find the claim in the post that a reader would understand faster from a
   picture than from a paragraph. If a sentence or a table would explain it
   just as well, pick a different claim.
2. If behavior, state, enforcement, or risk carries the meaning, choose a
   semantic pattern from `references/semantic-patterns.md` first. Then pick
   the nearest visual type from its selection table.
3. Keep to its budget: at most 9 nodes, at most 12 arrows, one or two focal
   elements, and nothing a reader wouldn't miss if you removed it. If the
   diagram goes over, split it into an overview and a detail.
4. Every node, arrow, and label must match something the post says. If the
   text doesn't support it, cut it from the diagram.
5. Before you draw, tell the author the claim, the pattern and type, the
   reference files you read, the medium, and anything the budget forced out.
   Repeat it in your final message.
6. Draw it in the medium that suits the type:
   - **Mermaid `flowchart`** for a flowchart, process, data flow,
     architecture, tree, or dependency graph. It's the only Mermaid type the
     site's theme covers: `themeCSS` in `astro.config.mjs` styles flowchart
     classes, and other types keep dark colors in the light theme.
   - **Excalidraw** for every other type, including sequence, state machine,
     timeline, quadrant, layer stack, loop, nested, Venn, pyramid, swimlane,
     fishbone, and exploded or axonometric views.

### Draw it

- **Mermaid:** write a fenced `mermaid` block. Put the diagram's title in
  `accTitle` and a one-sentence description of its content in `accDescr`.
  Keep labels short. It renders to SVG at build time.
- **Excalidraw:** save the source as `src/assets/diagrams/<name>.excalidraw`.
  Draw it in Excalidraw, or write element skeletons by hand. The export lays
  skeletons out with real font metrics and saves them back as an editable
  scene:

  ```json
  {
    "type": "excalidraw",
    "version": 2,
    "elements": [
      { "type": "rectangle", "id": "score", "x": 0, "y": 0, "width": 300, "height": 100, "label": { "text": "Score the request", "fontSize": 28 } },
      { "type": "rectangle", "id": "act", "x": 520, "y": 0, "width": 300, "height": 100, "strokeColor": "#47603e", "backgroundColor": "#e2ecd9", "fillStyle": "solid", "label": { "text": "Act on it", "fontSize": 28 } },
      { "type": "arrow", "id": "go", "x": 300, "y": 50, "points": [[0, 0], [220, 0]], "start": { "id": "score" }, "end": { "id": "act" }, "label": { "text": "above 0.9", "fontSize": 24 } },
      { "type": "text", "id": "rest", "x": 0, "y": 150, "text": "Everything else waits for a person.", "fontSize": 24, "strokeColor": "#6f6d63" }
    ]
  }
  ```

  Use only the colors in `scripts/theme-diagrams.mjs` and Excalidraw's
  default ink. Other colors wouldn't follow dark mode, so the export rejects
  them. Then run:

  ```sh
  bun run export:excalidraw <name> --title "…" --description "…"
  ```

  It writes `public/diagrams/<name>.svg` with embedded fonts, both palettes,
  and the title and description, then prints the SVG's size and the path of
  a PNG preview. Look at the preview and fix crowded or overlapping parts in
  the source.
- **Excalidraw layouts:** draw each Excalidraw diagram twice with the same
  facts: a landscape layout that exports about 956 px wide, and a
  `<name>-portrait` layout that exports at most 456 px wide, for screens up to
  60rem. The export adds 28 px of padding on each side, so draw about 900 px
  and 400 px of content. Set every `fontSize` between 24 and 30. Excalidraw's
  default of 20 is too small to read once a phone scales the diagram down.
  Embed the pair as
  `src/content/writing/a-friday-release-security-simulation.mdx` does: a
  `<figure class="excalidraw-figure responsive-diagram">` whose `<picture>`
  has a `<source media="(max-width: 60rem)">` for the portrait and an `<img>`
  for the landscape. Give both the printed `width` and `height`, and give the
  `<img>` descriptive `alt`.

## Code and companion repositories

A post explains the idea, and a repository runs it. When a tutorial's code
spans more than one file, or more than 150 lines, put the runnable project in
its own public repository with tests and a README, as with
[ragmha/build-your-harness](https://github.com/ragmha/build-your-harness).
Don't trim the code to get under this rule. Ask the author before you create a
repository, and until they answer, link the one you propose under
`github.com/ragmha/`.

In the post:

- Link the repository near the top, and pin it to a commit or tag when the
  post shows results.
- Give the clone and run commands.
- Show only the excerpts that carry the idea, and link to the full files.

`tests/post-layout.test.mjs` fails any post with more than 150 lines of fenced
code, not counting Mermaid.
