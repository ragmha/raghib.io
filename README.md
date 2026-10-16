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
overrides (category, description, demo/extra links) live in
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

## Writing and project writeups

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
and image assets, and correct sitemap/robots/RSS discovery. Every published
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
