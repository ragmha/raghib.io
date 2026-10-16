# Design System

<!-- impeccable:design-schema 1 -->

## Direction

raghib.io is a restrained independent publishing home. Its author introduction,
writing, projects, and evidence should be immediately legible without an
animated portfolio or terminal simulation. Preserve the author's chosen homepage
biography; search metadata does not require replacing that copy.

The supplied `matchaonmuffins.dev` reference is the layout authority: direct text navigation, compact composition, minimal ornament, and content that does not sit inside decorative cards.

## Color

Use the shared tokens in `src/styles/theme.css`; do not introduce a separate
palette for a new page.

Colors follow the neutral palette of the OpenAI Developers blog; the layout and
typography remain this site's own.

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#000` | `#fff` |
| Raised surface | `#181818` | `#f3f3f3` |
| Primary text | `#fff` | `#0d0d0d` |
| Secondary text | `#b9b9b9` | `#5d5d5d` |
| Tertiary text | `#8f8f8f` | `#737373` |
| Hairline divider | `#292929` | `#e8e8e8` |
| Highlight | `#dcdcdc` | `#282828` |

Dark is the default; the theme toggle persists the reader's choice. Neutral
surfaces and restrained highlights communicate interaction, selection, and focus.
Semantic illustration accents (red, green and blue) and the diagram halo also
use shared theme tokens; page styles must not introduce their own accent palette.

## Typography

- Interface, reading, and code: self-hosted JetBrains Mono through
  `src/styles/fonts.css` and `--font-mono`
- Available faces: regular, semibold, bold, and regular italic; retain the OFL
  licence alongside the font files
- Homepage heading: `1.1rem`, weight 600
- Homepage body: `1rem` with line-height 1.6
- Editorial body: `0.95rem` with line-height 1.75

Monospace is the current publishing identity, not a terminal UI. Use spacing
and restrained hierarchy rather than simulated commands or dense chrome.

## Layout

- Primary frame: `--layout-width: 960px` with `1.25rem` gutters, shared through
  `src/styles/layout.css`
- Home opening: name, existing introduction, and direct navigation; posts are
  listed only on the writing archive
- Archives and projects: editorial content beside a `6.5rem` navigation column,
  with a `4rem` gap
- Article: optional full-bleed cover image (up to 85% of viewport height),
  breadcrumb, large left-aligned title, description, a labelled
  category/published/reading-time/tags row, body, return link, and an
  always-visible "On this page" list. The header spans the frame above a rule;
  from `64rem` the list is a sticky `13rem` left column beside the article,
  and it stacks above the article on narrower screens
- At 600px and below: a single content column with wrapping navigation and
  reduced spacing; wide code and diagrams scroll internally
- Concept diagrams with portrait exports switch to stacked compositions below
  60rem. They fit the column without horizontal scrolling or shrinking labels
  into unreadable text; other wide technical diagrams retain their scroll region.

## Components

- Links use plain text and underline behavior rather than buttons or card shells.
- Index entries are rows separated by one-pixel rules.
- Callouts use a full one-pixel border and a compact semantic label.
- Code blocks use a solid near-black surface and one-pixel border.
- Images remain square-edged enough to read as evidence, not decorative media.
- The Copilot credit-journey illustration uses an ink-on-paper treatment:
  original GHCP-user and GH-admin figures, a desk and whiteboard, open
  handwritten dialogue, and no comic-card frames. Automation is the admin's
  tool, not a third persona. The user has headphones and casual clothing;
  the admin has glasses, an ID badge, and a policy clipboard. Both layouts
  retain these cues so the roles are recognizable without reading the labels.
- Diagram ink, paper, and highlighted surfaces adapt together through
  `scripts/theme-diagrams.mjs`; dark surfaces must not retain black export text.
- Focus uses a visible two-pixel theme-highlight outline with offset.

## Motion

The site has no client-side transition framework. Small name-underline and
contents-indicator transitions support interaction. Smooth scrolling and
nonessential transitions respect `prefers-reduced-motion`.

## Voice

Direct, practical, and precise. Copy starts with recognizable problems, names the decision being made, and distinguishes demonstrations from production recommendations. Avoid hype, invented metrics, and unexplained jargon.
