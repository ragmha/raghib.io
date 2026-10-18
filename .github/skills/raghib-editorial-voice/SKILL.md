---
name: raghib-editorial-voice
description: Helps draft, revise, and review Raghib Hasan's technology writing in distinct TIL, blog, and tutorial modes, grounded in his own writing and evidence. Use when working on posts in src/content/writing/ or when asked to develop or preserve Raghib's writing voice.
---

# Raghib's editorial voice

Build on Raghib's own writing, not another writer's voice or a fixed article
formula. Preserve the curious, first-person thought process when it is genuine:
notice something in practice, ask what it means, explore possible explanations
or approaches, and state what remains unknown. First person is a choice, not a
requirement.

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

## Fundamentals first

Lead with durable AI engineering fundamentals rather than a specific tool or
API: tools change quickly, while problems like evaluation, reliability, and
cost apply across providers. Readers include people at AI labs; a post that
only works inside one vendor's product reads as marketing.

- **Write about the problem, not the product.** Name the underlying problem
  (evaluation, context construction, cost, latency, reliability, safety,
  feedback loops). The tool you used belongs in the method, not the title.
- **Lay out the options before you pick one.** Lay out the realistic
  approaches, what each costs, and when each one wins. Leave the reader with
  the questions that decide it in their context, not a verdict for everyone.
- **Ground claims in sources.** Cite primary sources (papers, model cards,
  official docs, benchmarks) for factual claims, and say what a benchmark
  does and does not measure.
- **Evaluation is part of the work.** For any AI system, state how you know it
  works: the rubric or metric, the data, the baseline, and the failure cases.
- **Make the result reusable.** Make the takeaway transfer across providers:
  use a swappable interface in code, or an open standard (MCP, OpenTelemetry,
  Agent Skills) instead of one vendor's feature.

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
- Choose headings and length for the mode and material. Avoid stock headings,
  repeated catchphrases, forced anecdotes, hype, filler, and recap sections
  that add nothing.

## Workflow

1. Read the draft or notes, `AGENTS.md`, and relevant source material. Record
   the intended reader, primary mode, central idea, evidence, and uncertainties.
2. Preserve the author's actual thinking and phrasing where they carry
   personality. Edit for clarity, order, grammar, and precision without
   replacing an exploratory voice with polished generic prose.
3. Keep factual claims inside the evidence. Never invent a customer, scene,
   result, metric, citation, or personal experience.
4. Preserve frontmatter, disclosures, links, and sources unless asked to edit
   them. `seoTitle` must remain at most 44 characters.
5. Check the piece against its chosen mode in [EXAMPLES.md](EXAMPLES.md), then
   run `bun run build` and `bun run check:seo` for content changes.
