---
name: raghib-editorial-voice
description: Helps draft, revise, and review Raghib Hasan's technology writing in distinct TIL, blog, and tutorial modes, grounded in his own writing and evidence. Use when working on posts in src/content/writing/ or when asked to develop or preserve Raghib's writing voice.
---

# Raghib's editorial voice

Build on Raghib's own writing, not another writer's voice or a fixed article
formula. The site is a place to share the author's interests, learning, and
knowledge—not marketing, a CV, company promotion, or an AI-search content mill.
Preserve the author's actual thoughts and phrasing where they carry personality.
First person, reflection, and argument are choices, not requirements; never
invent an opinion or experience to make a piece feel personal.

`AGENTS.md` is authoritative: keep the writing independent, cross-industry,
and understandable beyond a narrow specialist audience. Use [EXAMPLES.md](EXAMPLES.md)
as evidence, not as templates.

## Choose the mode

Choose one primary mode by what the reader should take away. A piece may borrow
elements from another mode, but do not make every post follow the same rhythm.

- **TIL:** Share one specific thing learned, the context needed to understand
  it, and why it matters. Keep the scope narrow. Do not inflate one discovery
  into a broad essay or claim it applies universally without evidence.
- **Blog post:** Explore a question, observation, argument, or experiment. Let
  the reasoning develop; distinguish what happened, what you think it means,
  and what you might try next. Use personal reflection when it advances the
  idea. A blog post does not need numbered steps or a formal conclusion.
- **Tutorial:** Help the reader reach a defined result. State prerequisites,
  then give ordered, tested steps with commands, expected outcomes, and
  relevant failure or safety notes. Explain why a step matters where useful;
  do not add essay-like reflection just to close the piece.

If a piece is hybrid, prioritize the reader's main job: learn one fact (TIL),
think through an idea (blog), or reproduce a result (tutorial).

## Subject and evidence

Let the subject determine how much context, comparison, and technical detail a
piece needs. Name a product when it is genuinely central to the reader's task;
do not make a product the subject just to promote it. Cite reliable sources
for claims that need them, explain what measurements establish, and separate
observations from interpretations and proposals. Do not add a comparison,
evaluation, or abstraction merely to make every piece reusable or comprehensive.

## Writing principles

- Lead with the question, discovery, or outcome that gives this piece a reason
  to exist. Do not invent a scene to make an opening vivid.
- Make the point of view clear, then follow the evidence and consequences.
- Explain technical mechanisms in plain language before adding specialist
  detail.
- Use real artifacts, examples, code, diagrams, or numbers only when they help
  the reader inspect the claim.
- Separate observed results from hypotheses, proposals, and open questions.
- Name meaningful limitations; do not let caveats bury the main point.
- Prefer headings that advance the point, not just label the topic.
- When useful, give readers a small check they can run before acting.
- Say when an approach does not fit, including its meaningful trade-offs.
- End with a concrete next step when it helps; skip generic calls to action
  and recap sections.
- Choose structure, headings, and length for the mode and material. Avoid
  stock headings, repeated catchphrases, forced anecdotes, hype, filler, and
  recap sections that add nothing.

## Workflow

1. Read the draft or notes, `AGENTS.md`, and relevant source material. Record
   the intended reader, central idea, evidence, and uncertainties; choose a
   mode only when it helps guide the work.
2. Preserve the author's actual thinking and phrasing where they carry
   personality. Edit for clarity, order, grammar, and precision without
   replacing an exploratory voice with polished generic prose.
3. Keep factual claims inside the evidence. Never invent a customer, scene,
   result, metric, citation, or personal experience.
4. Preserve frontmatter, disclosures, links, and sources unless asked to edit
   them. `seoTitle` must remain at most 44 characters.
5. Use [EXAMPLES.md](EXAMPLES.md) as evidence of range, not a template. For a
   substantive preflight, compare the draft with a few relevant recent posts
   for a repeated argument, opening, example, or conclusion. Report the exact
   passages and offer revision options; do not score originality or rewrite
   automatically.
6. Use a hero or diagram only when it clarifies the material. Search discovery
   and SEO are checks after the idea is written, not a reason to reshape it.
   Run `bun run build` and `bun run check:seo` for content changes.

## Audit for vendor drift

When asked to audit existing posts, report findings per post; do not
unpublish, rename slugs, or rewrite without the author's go-ahead.

- **So what?** State in one sentence why the post matters to a builder outside
  the author's company. If you can't, flag it.
- **Problem, not product.** `title`, `seoTitle`, `description`, and headings
  name the problem or pattern. A vendor name belongs only where it is a cited
  source, a step the reader runs, or the incident being explained.
- **Independent, not neutral by default.** A clear argument is welcome when
  it is the author's and is grounded in evidence; do not manufacture
  neutrality or suppress a supported point of view.
- **Plain findings.** Keep genuine uncertainty; cut justification that defends
  the author's diligence instead of informing the reader.
- **Product tours.** A post that mainly lists one product's features should be
  reframed around a pattern or retired. Ask the author which.
- **No employer.** Never name the author's employer or its products; describe
  the pattern instead. `tests/no-employer.test.mjs` enforces this.
- **Independence check.** Apply the same four questions as
  `.github/instructions/writing.instructions.md`. Flag conflicts or unsupported
  claims to the author; do not treat a supported point of view as a failure.
