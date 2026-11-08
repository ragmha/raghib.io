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
bun run build                # experiments, then the blog, into dist/
bun run check:seo             # audit the fresh production build (requires Chromium)
bun run check:vitals          # controlled mobile LCP/CLS regression checks
bun run generate:social-card  # regenerate public/social-card.png
bun run sync:projects         # refresh projects from the selected GitHub star list
bun test --bail               # unit and publication-contract tests
bun run --filter experiments dev           # experiments at localhost:4321/experiments/
bun run --filter experiments test          # experiments unit tests
bun run --filter experiments test:browser  # after a build; needs Chromium and WebKit
```

## Projects

The Projects page leads with selected projects defined in
`src/content/project-snapshot.ts`, followed by public repositories in
[`ragmha/blog-projects`](https://github.com/stars/ragmha/lists/blog-projects).
Run `bun run sync:projects` with an authenticated `gh` CLI to refresh
`src/content/github-projects.json`, then commit and redeploy. Per-project
overrides (description, demo/extra links) live in
`src/content/project-snapshot.ts` and survive future syncs.
The same file owns the selected projects and their order; syncing the star list
does not remove them or duplicate them. Repository identities (owner/name) are
compared case-insensitively after removing trailing slashes and a `.git` suffix,
with selected entries taking precedence. Distinct repositories must have unique
project names, also case-insensitively; any name
collision between distinct repositories fails site checks and builds rather than
hiding a project.

## Experiments

This repository is a Bun workspace. The blog is the root package; the browser
experiments are [`apps/experiments`](apps/experiments/README.md), an Astro app
with its own pages, tests, data, and reproduction kits. Its history from
[ragmha/lab](https://github.com/ragmha/lab) is merged here.

`bun run build` builds the experiments with `base: '/experiments'`, then the
blog, and copies them into `dist/experiments/`, so one GitHub Pages deployment
serves both: `/experiments/` and every `/experiments/<name>/` are real pages,
not redirects. The SEO and vitals checks audit the blog's pages, including
every link into `/experiments/`. Experiment pages have their own unit, browser,
and performance tests and stay out of the sitemap.

Writing frontmatter can declare `lab: <lab-slug>`. This renders a companion
experiment link. Only declare a
pairing when the experiment actually accompanies that post; shared topics are
not enough. The experiment's reciprocal field is `writing: <writing-slug>` in
`apps/experiments/src/data/content-links.json`. `/content-links.json` publishes
`{writings: [{slug, lab?}]}` for published posts only; the experiments publish
`{labs: [{slug, writing?}]}` at `/experiments/content-links.json`. After a
build, `node apps/experiments/scripts/check-content-links.mjs` fails on missing
or non-reciprocal pairs.
Cross-repository checks can fetch those manifests or use local build snapshots.
Check both destinations and reciprocal declarations when updating either side.

## Talks

`/talks/` lists talks and workshops written as [Marp](https://marp.app) decks
in `src/content/talks/*.md` (frontmatter: `title`, `description`, `date`,
`kind: talk | workshop`, optional `locked`). Each deck renders inline in the
site theme from `src/styles/talk-theme.css`. After `astro build`,
`scripts/export-talks.mjs` writes `<slug>.pdf` and an image-only `<slug>.pptx`
next to each public deck for the Download menu.

A deck marked `locked: true` keeps its full slides on request. Its page shows
the cover slide and a one-slide PDF preview; a separate "Can I view this
presentation?" link opens a prefilled public issue
(`.github/ISSUE_TEMPLATE/view-request.yml`, label `view-request`). Compare the
page's views with `gh issue list -l view-request` to see the demand.
`astro dev` always shows locked decks. Remove `locked` to publish.

## Writing and project writeups

Every writing post uses `src/pages/writing/[slug].astro`, `WritingLayout.astro`,
and `src/styles/writing.css` for the same header, metadata, contents navigation,
and reading layout. Keep content in MDX rather than duplicating page markup;
headings supply the contents list without imposing the same outline on every post.
Code examples get keyboard-accessible Copy controls using the native clipboard
API. Success and failure are announced inline; manual selection still works
without JavaScript or clipboard permission. Diagrams are not copy targets.
Posts name no employer or employer product and carry no disclaimer;
`tests/no-employer.test.mjs` enforces it.

Posts live in `src/content/writing/`. A project can optionally have a longer
writeup at `/project/<project-name>/writings/`, authored as MDX in
`src/content/project-writeups/`; set `published: true` when it's ready to go
live. Writeups are separate from the Writing archive/RSS feed.

Writing posts and project writeups can credit the skills, agents, and workflows
they actually used with release-pinned frontmatter:

```yaml
rstack:
  version: v0.2.0
  uses: [skills/diagnose, skills/tdd, skills/triage]
```

This renders a **Built with rstack** box after the article. Inline Markdown such
as `[diagnose](rstack:skills/diagnose)` links to the same release in
`ragmha/rstack`. Every shorthand reference must appear in `rstack.uses`;
missing versions and unlisted references fail the build. Versions must be
`v<major>.<minor>.<patch>`. Skills use `skills/<name>` directories; agents use
`agents/<name>.md` or `agents/<name>.agent.md`; workflows use
`workflows/<name>.md`, `.yml`, or `.yaml`. Names contain only lowercase letters,
digits, and hyphens. Links use `tree` for skill directories and `blob` for files.
`bun scripts/rstack-urls.mjs` expands the frontmatter links for the weekly link
check. Only declare resources present in the selected release.

A post can open with a full-bleed cover image. Put the image in
`src/assets/covers/` and add it to the frontmatter:

```yaml
cover:
  src: ../../assets/covers/my-post.jpg
  alt: 'What the image shows'
```

Every post needs at least one Mermaid or Excalidraw diagram. Choose its type
with [diagram-design](https://github.com/cathrynlavery/diagram-design), as
described in `.agents/skills/post-layout/SKILL.md`.

Rendered diagrams live in `public/diagrams/`; editable `.excalidraw` sources live
in `src/assets/diagrams/`. Edit a source in Excalidraw, or write element
skeletons by hand, then export the matching SVG:

```bash
bun run export:excalidraw <name> --title "…" --description "…"
```

The export runs Excalidraw's own renderer in headless Chromium, so text is
measured with the real fonts. It embeds the fonts, applies the shared light and
dark palettes, adds the title and description, and writes a PNG preview. It
rejects labels that overflow their shapes and colors that wouldn't follow dark
mode, and writes nothing when a check fails. A skeleton source is saved back as
a full, editable scene.

Keep SVG diagrams as native `<img>` elements with explicit `width`, `height`,
and descriptive `alt` attributes; shared writing styles scale them to their
container. Put raster content images in `src/assets/` and render them with
Astro's `<Image />` or `<Picture />` components so responsive `srcset` values and
optimized formats are generated automatically. Icon credits and reuse terms are
in `public/diagrams/ICONS-LICENSE.txt`.

The Friday release simulation includes three Excalidraw concept diagrams. Their SVGs are static exports with embedded Excalifont, accessible text,
and no client-side drawing library. Match the exported dimensions in the MDX
when updating a diagram.
Each has a `-portrait` source/export for viewports up to 60rem. The article uses
`picture` to switch compositions instead of shrinking labels or requiring
sideways scrolling. Keep equivalent facts in both versions.

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

`bun run export:excalidraw` applies the shared light and dark palettes itself.
After changing an SVG any other way, run `bun run theme:diagrams`. At build
time, `src/lib/rehype-inline-diagrams.mjs` inlines
`<img src="/diagrams/*.svg">` in posts so diagrams follow the site's
`data-theme` toggle; Safari only shows the OS theme to SVGs loaded as images.
A `<picture>` pair (portrait `<source media="(max-width: 60rem)">` plus a
landscape `<img>`) becomes both inline SVGs, and `writing.css` shows one per
viewport at the same breakpoint.
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
merging. A pull request that only changes agent skills or contributor docs
(see the `lanes` job) skips the checks,
and the skipped job still reports success. The gate also runs `cspell`
(American English) over posts; add real terms to `cspell.json`. A weekly
`Link check` workflow opens or updates a `Broken links` issue when external
links fail.

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
`lastmod` on published writing. Tag and topic archives are `noindex` and stay
out of the sitemap because they only repeat post summaries.
`llms.txt` and `llms-full.txt` must list exactly the published writing. Every published
source entry must have a corresponding rendered article with matching metadata;
drafts must not leak into the build. An intentionally empty writing archive is
valid. Editable `.excalidraw` originals belong outside `public/`.

Published writing needs a title, description, date, and nonempty body.
An optional `updated` date, on or after `date`, shows next to the publication
date and sets `dateModified` and the sitemap `lastmod`.
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

Bing and other IndexNow search engines hear about changes from the deploy
itself. With an `INDEXNOW_KEY` repository secret set (8–128 letters, digits, or
hyphens), each `main` deploy publishes `/<key>.txt` and submits the URLs that
joined or left the sitemap since the previous deploy. Edits to existing pages
rely on the sitemap. A rejected or stalled submission is logged without failing
the deploy.
Google doesn't use IndexNow.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
