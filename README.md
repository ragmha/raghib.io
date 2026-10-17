# raghib.io

A minimal independent technology blog built with Astro, TypeScript, plain CSS,
and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (required)
- [Node.js](https://nodejs.org/) 20 or newer
- [Git](https://git-scm.com/)

> On Windows, using [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) is recommended for a smoother experience.

## Getting started

```bash
git clone https://github.com/ragmha/raghib.io.git
cd raghib.io
bun install
bun dev
```

Open [http://localhost:4321](http://localhost:4321).

## Commands

```bash
bun dev                      # local development
bun run check                # Astro and TypeScript checks
bun run build                # static production build
bun run check:seo             # audit the fresh production build (requires Chromium)
bun run check:vitals          # controlled mobile LCP/CLS regression checks
bun run generate:social-card  # regenerate public/social-card.png
bun run sync:projects         # refresh projects from the selected GitHub star list
bun test --bail               # unit and publication-contract tests
```

## Projects

The Projects page is generated from the public repositories in
[`ragmha/blog-projects`](https://github.com/stars/ragmha/lists/blog-projects).
Run `bun run sync:projects` with an authenticated `gh` CLI to refresh
`src/content/github-projects.json`, then commit and redeploy. Per-project
overrides (description, demo/extra links) live in
`src/content/project-snapshot.ts` and survive future syncs.

## What’s Under the Prompt?

`/experiments/context-autopsy/` (“What’s Under the Prompt?”) reads coding-agent session logs in a Web Worker
and shows how the agent used the model: an interactive per-call context chart
(hover, tap, or arrow keys; per-call or running total), plain-language findings
on cache reuse, context growth and output ratio, token mix, per-model usage and
tool activity. Model savings uses two cost lines and a task-volume slider to
reprice the same token workload on another model. It replaces the two-session
before/after report: no second upload is needed. Cost ranges are preserved;
the projection assumes unchanged token/cache usage, not equal model quality.
These are API savings estimates, not profit or Copilot subscription savings.
Nothing is uploaded.
Inspired by Steve Kinney's
[model calculator](https://stevekinney.com/experiments/model-calculator).

- Supported: GitHub Copilot CLI (`~/.copilot/session-state/<id>/events.jsonl`),
  Codex CLI (`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`), Claude Code
  (`~/.claude/projects/<project>/<session>.jsonl`) and OTLP JSON GenAI spans.
- Copilot helper: `bash public/copilot-export.sh --list`, then
  `--session ID --output file.jsonl` (PowerShell: `copilot-export.ps1 -List`).
  Exports are raw and unredacted.
- `src/lib/model-pricing.ts` snapshots provider-published API rates in USD;
  each comparison row links its source. Rates are not coding-assistant
  subscriptions or plan allowances. Update `pricingDate` and individual model
  entries from their provider pages when prices change.
- Claude Code cache writes with reported TTLs are priced separately at 5 minutes
  and 1 hour. When a log has only aggregate writes, the estimate shows the
  provider's TTL range. Editing the session-populated token counts reprices the
  workload live; the comparison table can be sorted by model, reference cost,
  or workload cost.
- Tests: `bun test --bail 1 tests/agent-usage.test.ts tests/copilot-export.test.ts`.

## Where Did the Time Go?

`/experiments/session-flame/` (“Where Did the Time Go?”) is a full-screen app
that replays a coding-agent session. The page does not scroll: a header holds
Flame, Transcript and Breakdown tabs (arrow keys move between them) and a Help
dialog with the lane and icon key and log loading, playback controls stay fixed
below it, and a side panel follows the
playhead and the selected span. Each panel scrolls on its own; on narrow
screens the side panel stacks under the tabs. The Flame tab draws the session
as an interactive flame chart: prompts, model turns, tool calls,
sub-agents, hooks, approvals and compactions, nested by what caused them. Idle
stretches over a minute fold into fixed-width breaks so the work stays legible.
Click a bar to expand it to full width: only its subtree stays, with its
ancestors stacked above as a grey trail. Click a trail bar or press Escape to
step out a level, and Fit or `0` to return to the whole session; Enter expands
the selected span. The mouse wheel zooms at the pointer, and zooming or panning
out past an expanded bar steps out to the ancestor that still covers the view.
Drag or Shift-scroll to pan; the inspector shows each span's facts and raw
events. Play/pause, event stepping, and a scrubbable playhead
synchronize the flame chart with recorded prompts, responses, tool inputs and
outputs. A story strip under the controls lights the current step of the loop
(Prompt › Think › Act › Observe › Reply), counts turns, tool calls and results since
the last prompt, and narrates each event in a plain sentence. The clock, scrubber,
speed and idle-skip controls sit behind a Timeline toggle, and the header's
Replay button hides the whole bar so the chart can use its height.
Playback offers 1×, 4× and 16× speeds and optional long-idle-gap skipping;
the clock always reports wall time, while the scrubber uses the chart's folded
axis. Click or drag the ruler to seek, or press Space with the chart focused to
play/pause. Replay stops at the end and pauses when the page is hidden or a new
log is loaded. Event details show only what was recorded at that moment, not a
span's future result; the separate span inspector retains the full-log view.
The event list keeps the latest 100 events up to the playhead, with older events
available by seeking back. Six lanes above the bars sort every event into one
step of the agent loop (Prompt, Think, Act, Observe, Reply, System); click a
tick to seek, and filter the transcript by step. While replaying, the work
running at the playhead is outlined and work not yet started fades back. Line
icons mark each kind of work (prompt, model turn, tool call, sub-agent,
response, hook, approval, compaction, session) on bars, transcript rows
and the playhead panel. A table counts each moment of active time once,
split evenly across the innermost work running then. Bars run red to violet in
order of time taken, with dark labels at 4.5:1 contrast or better on every hue.
Nothing is uploaded.
Inspired by [AgentViz](https://jfhelin.github.io/copilot-ledger/agentviz/).

**Comparing models and context.** Choose **Compare** in the Flame view and import
2–6 recorded Copilot CLI sessions (100 MiB combined). Select any two runs; the
two flames keep the same elapsed-time scale across the whole imported set.
Each starts at its first user prompt, with idle gaps left uncompressed.
**Inspect run** opens the selected log in the existing replay and span inspector.
The illustrative TodoMVC sample is not benchmark evidence.

**Recorded runs.** The Flame view's **Model** and **Context** menus load real
Copilot CLI logs of one TodoMVC prompt: Claude Opus 5.5, Claude Sonnet 5.5,
GPT-6 Astra and GPT-6.1 Sol at the default and long context tiers, plus
HydraFusion, which takes no tier. HydraFusion Max was recorded but omitted: its
solver was still running when the 15-minute cap stopped it. Each ran once from an empty
folder with an isolated config, all tools allowed and no way to ask for approval,
two runs at a time. The published logs in `public/experiments/session-flame/runs/`
keep only whitelisted fields: system prompts, local paths, file-path telemetry
and encrypted reasoning are removed, and each log was checked to parse to the
same spans as its raw original. `src/lib/session-flame-runs.json` lists each
run's length, prompt limit and SHA-256. All runs share the slowest run's scale.
The tier raised only the prompt limit; every call read well under it, so tier
differences in these runs are run-to-run variation, not an effect of the tier.
HydraFusion logs its fusion phases with durations but replays tool calls at
commit, so the chart draws the phases over their real time and the tool bars as
replays. One run per setting is a demonstration, not a benchmark.

Run selectors identify recorded main models and per-call input-token ranges.
Main-agent `session.usage_record` (or older `assistant.usage`) input tokens are
kept separate from occasional context snapshots at compaction/shutdown, and
recorded token limits are not treated as context used. Missing measurements stay
unknown. The replay gauge likewise shows the last recorded reading, not an
estimate between events. Multi-model logs, differing prompts, partial logs and
missing readings are flagged rather than assigned synthetic durations or context
values.

For a fair TodoMVC experiment, hold the starter commit, prompts, harness/version,
tools, permissions and acceptance tests constant. Change model **or** input
payload, record reasoning/cache settings, and repeat each condition. Elapsed time
includes tools, output generation and idle time; one pair cannot establish
causation or a universal model ranking. Input token counts also depend on the
model's tokenizer. A larger available context window alone need not widen a flame.
**Download evidence for gist** saves a local Markdown summary with file SHA-256
hashes, measured values, coverage warnings and reproduction requirements. It
includes no prompt or tool contents and publishes nothing; review filenames and
complete the methodology before sharing it.

- Supported: GitHub Copilot CLI (`~/.copilot/session-state/<id>/events.jsonl`),
  up to 100 MiB. The Copilot export helpers above work here too.
- `src/lib/session-flame.ts` holds the parser, folded axis, lane layout, time
  attribution, replay timing/event descriptions and palette; the page draws the
  canvas and handles input. External-tool telemetry remains excluded from the
  chart and replay; raw logs are not altered.
- Tests: `bun test --bail 1 tests/session-flame.test.ts`.
- Browser interactions (with a local dev or preview server running):
  `SESSION_FLAME_TEST_URL=http://127.0.0.1:4321/experiments/session-flame/ node --test tests/session-flame.browser.mjs`.
  Covers Chromium and WebKit playback, same-time events, seek/inspect behavior,
  idle gaps, keyboard and tab controls, restart/reload, and that the app fits
  the viewport without page scrolling at desktop and phone sizes.

## Writing and project writeups

Every writing post uses `src/pages/writing/[slug].astro`, `WritingLayout.astro`,
and `src/styles/writing.css` for the same header, metadata, contents navigation,
and reading layout. Keep content in MDX rather than duplicating page markup;
headings supply the contents list without imposing the same outline on every post.
The standard opening `**Disclaimer:**` paragraph automatically becomes a
theme-aware informational callout. Keep its wording and position as defined in
`.github/skills/employer-disclaimer/SKILL.md`; no per-post styling is needed.

Posts live in `src/content/writing/`. A project can optionally have a longer
writeup at `/project/<project-name>/writings/`, authored as MDX in
`src/content/project-writeups/`; set `published: true` when it's ready to go
live. Writeups are separate from the Writing archive/RSS feed.

A post can open with a full-bleed cover image. Put the image in
`src/assets/covers/` and add it to the frontmatter:

```yaml
cover:
  src: ../../assets/covers/my-post.jpg
  alt: "What the image shows"
```

Rendered diagrams live in `public/diagrams/`; editable `.excalidraw` sources live
in `src/assets/diagrams/`. Edit a source in Excalidraw, then export the matching
SVG. Keep SVG diagrams as native `<img>` elements with explicit `width`, `height`,
and descriptive `alt` attributes; shared writing styles scale them to their
container. Put raster content images in `src/assets/` and render them with
Astro's `<Image />` or `<Picture />` components so responsive `srcset` values and
optimized formats are generated automatically. Icon credits and reuse terms are
in `public/diagrams/ICONS-LICENSE.txt`.

The Keep Shipping article includes three `copilot-*.excalidraw` concept diagrams:
budget versus model access, the example credit journey, and additive model
grants. Their SVGs are static exports with embedded Excalifont, accessible text,
and no client-side drawing library. Match the exported dimensions in the MDX
when updating a diagram.
Each has a `-portrait` source/export for viewports up to 60rem. The article uses
`picture` to switch compositions instead of shrinking labels or requiring
sideways scrolling. Keep equivalent facts in both versions.
The credit journey is an original black-ink office illustration with two
personas: a GHCP user and a GH admin responsible for budgets and model policy.
The user wears headphones and casual clothing; the admin has glasses, an ID
badge, and a policy clipboard. These cues stay consistent in both layouts.
The admin's automation is a labelled tool, not an additional persona. It uses
open dialogue rather than card panels, with a stacked composition for small
screens. Elements retain their actor, automation-owner, and prop roles in
`customData`. The reusable personal `stick-figure-explainer` skill can render
these scene files without adding drawing dependencies to the site.
The illustrations use original line art, not third-party figure libraries.

With the local dev server running on port 4321, check phone, narrow-panel, and
desktop reading layouts with:

```bash
node scripts/check-writing-responsive.mjs
```

For a server on another port, set `WRITING_TEST_URL`, for example
`WRITING_TEST_URL=http://localhost:4322 node scripts/check-writing-responsive.mjs`.

This exercises portrait image selection, diagram legibility, contents navigation,
the always-visible contents list, the no-JavaScript fallback, and an existing
published article.

After exporting an SVG, run `bun run theme:diagrams` to apply the shared light
and dark palettes. At build time, `src/lib/rehype-inline-diagrams.mjs` inlines
`<img src="/diagrams/*.svg">` in posts so diagrams follow the site's
`data-theme` toggle; Safari only shows the OS theme to SVGs loaded as images.
Images inside `<picture>` remain native images so responsive sources still work.
Opened directly, the files still follow the OS theme. Palette roles live in
`scripts/theme-diagrams.mjs`; preserve pure black/white SVG mask colors.

The decision-model post uses one isometric hero, built server-side by
`src/lib/decision-hero.mjs` with the MIT-licensed
[Anatomy](https://github.com/wheresryan22/anatomy) geometry kit. The vendored
kit and license live in `scripts/vendor/anatomy/` (upstream commit
`689dcf966e63d92be10a5d593c6e19e10acd4422`). A plain-language key explains
the input, small decision model and example routes without requiring JavaScript.
The hero inherits the site's theme. Because it is about 580 KB, it is served
as `/decision-hero.svg` and inlined after load, so it doesn't delay the title.
To verify it in a browser, start the dev server and run
`DECISION_HERO_TEST_URL=http://localhost:4329/writing/decide-cheaply-generate-carefully/ node --test tests/decision-hero.browser.mjs`.

Every other post opens with the same cover anatomy: an isometric illustration
above the title, a two-line thesis and a short note. Each post gets its own
invented machine whose working is the explanation, drawn by a scene function in
`src/lib/flow-hero.mjs` from a shared workshop kit and fitted to the frame
automatically. `hero` is required frontmatter. For a new post, write a new
scene and add a `flowHeroes` entry that paraphrases the post without adding
claims, then set `hero: "<name>"`.

JetBrains Mono uses `font-display: optional` and width-matched fallback text to
avoid rewrapping content after the first paint. On slow first visits, the system
monospace font may remain for that page load. The header reserves space for the
theme button before its script initializes.

Article social cards can be generated with:

```bash
bun scripts/generate-social-card.mjs "Keep Shipping" "When an AI budget runs out, safer ways to keep work moving." social-card-keep-shipping.png
```

Set a post's `socialImage` frontmatter to its generated `/...png` path. To enable
Cloudflare Web Analytics, add the site token from its dashboard as the repository
variable `CF_WEB_ANALYTICS_TOKEN`. The token is public in the generated page;
local development does not load analytics.

## SEO readiness before merging

The `SEO readiness` job in `.github/workflows/seo.yml` runs on every pull
request into `main`, on merge-queue builds, and on pushes to `main`, where it
also uploads the site for the `deploy` job. Its job name is the required-check
identifier: keep it stable when editing the workflow. A required status-check
rule on `main` enforces the gate; merely adding a workflow does not prevent
merging. The gate also runs `cspell` (American English) over posts; add real
terms to `cspell.json`. A weekly `Link check` workflow opens or updates a
`Broken links` issue when external links fail.

Run the gate locally with:

```bash
bunx playwright install chromium # once, if the browser is not installed
npx cspell@8.19.4 lint --no-progress
bun test --bail --timeout 20000
bun run build
bun run check:seo
bun run check:vitals
```

The audit reads the generated HTML in Chromium with page scripts disabled.
It requires unique titles/descriptions, one H1, canonical and social metadata,
a real social-preview image, valid author/article schema, working internal links
and image assets, and correct sitemap/robots/RSS discovery. `/sitemap.xml`
and `/sitemap.txt` mirror the generated indexable pages; the XML includes
`lastmod` on published writing.
`llms.txt` and `llms-full.txt` must list exactly the published writing. Every published
source entry must have a corresponding rendered article with matching metadata;
drafts must not leak into the build. An intentionally empty writing archive is
valid. Editable `.excalidraw` originals belong outside `public/`.

Published writing needs a title, description, date, and nonempty body.
Whitespace and HTML comments alone do not count as a body. The body check
looks for content outside comments; it does not sanitize or render HTML.
Use `published: false` for writing drafts; project writeups default to unpublished.
During `bun dev`, writing drafts are available at their normal
`/writing/<filename-without-extension>/` URL with a draft notice and `noindex`.
The home page, Writing archive, and RSS remain published-only, including in
development. Production builds do not generate draft article routes.
For a private local review, bind the dev server to loopback:

```bash
bun dev --host 127.0.0.1
```

Keeping a post unpublished hides it from the generated site, not from a public
GitHub repository. Leave the draft uncommitted and unpushed until it is ready
for source-level review.

An optional `seoTitle` gives search results a shorter title without changing the
visible article heading. Shared metadata lives in `SeoHead.astro` and
`src/lib/seo.ts`; regenerate the social card after changing its text or design.
No article text or draft is automatically published by the audit.

The vitals check measures mobile LCP and CLS under fixed network and CPU
throttling. The gate checks technical readiness, not rankings, keyword demand,
factual accuracy, or field Core Web Vitals. Those still need editorial review and
production evidence. After deployment, submit `/sitemap-index.xml` in Search
Console using an account authorized for the site.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
