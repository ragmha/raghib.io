---
name: site-change
description: Change the raghib.io site itself rather than its posts. Covers layouts, components, pages, styles, metadata, redirects, build and check scripts, and CI. Use when editing src/components, src/layouts, src/pages, src/styles, src/lib, astro.config.mjs, scripts/, or .github/workflows/, or when adding a page, head tag, redirect, or analytics or verification snippet.
---

# Site change

The site is static Astro with plain CSS and no client framework. `AGENTS.md`
sets the constraints and `DESIGN.md` the look. Posts go through
`raghib-editorial-voice` and `post-layout` instead.

## Where things go

- **Head tags.** Put site-wide `<head>` tags such as metadata, analytics, and
  site verification in `src/components/SeoHead.astro`. `BaseLayout` and
  `WritingLayout` each render their own `<html>` and include `SeoHead`, and
  `WritingLayout` doesn't wrap `BaseLayout`, so a tag added to one layout
  misses half the site.
- **Search verification.** Use a `<meta>` tag in `SeoHead.astro`, never a raw
  verification `.html` file in `public/`: `check:seo` requires canonical,
  title, and social metadata on every HTML file in `dist/`.
- **Colors, type, and width.** Use the tokens in `src/styles/theme.css`,
  `--font-mono` from `src/styles/fonts.css`, and `--layout-width` from
  `src/styles/layout.css`. Don't add a palette for one page.
- **Moved URLs.** Add them to `redirects` in `astro.config.mjs`. Astro writes
  meta-refresh pages, which `check:seo` and `check:vitals` skip.
- **Pages kept out of search.** Pair the `noindex` prop (on `SeoHead`,
  `WritingLayout`, or `ArchiveLayout`) with the sitemap `filter` in
  `astro.config.mjs`. `check:seo` fails unless the sitemap lists exactly the
  indexable pages.
- **Script-revealed UI.** Reserve its space before the script runs.
  `ThemeToggle` renders `hidden` until `src/scripts/theme.js` shows it, and
  `check:vitals` fails any page over 0.1 CLS at 360×640.
- **Markdown plugins.** `src/lib/rehype-*.mjs` run when a page renders.
  Restart `astro dev` after editing one, because the dev server keeps serving
  old markup. Mermaid's `themeCSS` in `astro.config.mjs` styles only
  flowcharts.

## CI

`.github/workflows/seo.yml` builds, checks, and deploys. Its `lanes` job lets
PRs that only touch agent skills and contributor docs skip the release checks
through a job-level `if` on the `SEO readiness` job, never `on: paths`: a
skipped job reports success, while a path-skipped workflow leaves the required
check pending. Keep the job name `SEO readiness`. `tests/workflow.test.mjs`
runs the workflow scripts with mocked `gh` and `curl`; update it with every
workflow change.

## Verify

1. Run the checks in `AGENTS.md`.
2. Preview with `bun dev` and open every page you touched at 360 px and at
   desktop width, in light and dark themes, and tab through it to see the
   focus outline. Show the author the rendered page.
3. For writing-layout changes, run `node scripts/check-writing-responsive.mjs`
   against the dev server, setting `WRITING_TEST_URL` for a port other than
   4321. For the decision hero, run `tests/decision-hero.browser.mjs` as
   `README.md` describes.
