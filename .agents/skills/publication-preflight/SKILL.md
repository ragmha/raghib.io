---
name: publication-preflight
description: Check raghib.io writing for publication readiness without changing or publishing it. Use when asked to preflight, review, or prepare a post or draft for release.
---

# Publication preflight

Report readiness and blockers; do not edit, publish, commit, or push. Use
`raghib-editorial-voice` for a substantive editorial review and `post-layout`
for hero or diagram work.

## Check

1. Confirm the current worktree and branch with `pwd`, `git status --short`,
   and `git branch --show-current`. Do not assume a dev server on a familiar
   port belongs to this checkout.
2. Read the post and `AGENTS.md`. Check required frontmatter, `seoTitle`
   (44 characters or fewer), American English, evidence and links, vendor
   neutrality, and the no-employer rule. Do not mistake names in code or URLs
   for prose violations; CI handles those exclusions.
3. Confirm the post has its own required hero and at least one diagram. Use
   `post-layout` for detailed visual criteria. Check tutorial code against the
   150-line limit and companion-repository rule.
4. Preview the post from this worktree's dev server at the actual post URL.
   Check light and dark themes, a narrow phone viewport, and desktop; inspect
   the hero and diagram for clipping, overlap, readability, and horizontal
   page overflow. Keep draft URLs local: unpublished source in a public Git
   repository is still publicly visible.
5. Check accessibility (WCAG 2.2 AA) in the same preview. CI checks only
   image alt text and a single H1:
   - Tab through the page. Every link and control is reachable in reading
     order, and its focus outline stays visible, not covered by sticky
     elements.
   - At 320 px the page reflows without sideways scrolling (code blocks may
     scroll inside themselves). At 360 px, diagram labels render at 16 px or
     larger: an inline SVG's smallest `font-size` times its rendered width
     divided by its `viewBox` width.
   - Every diagram has a text alternative: `accTitle` and `accDescr` in
     Mermaid, or `alt` plus an SVG title and description for Excalidraw.
   - With reduced motion requested, smooth scrolling and transitions stop.
   - Any new text color meets 4.5:1 contrast in both themes.
6. Run the repository checks in `AGENTS.md`. For a published post, verify the
   generated page and its metadata in the production build; drafts do not ship
   in production builds.

## Report

Give a short ready / not ready verdict, followed by concrete blockers and the
checks actually completed. Separate automated failures from editorial
judgment. Never claim a preview or check passed unless it was run.
