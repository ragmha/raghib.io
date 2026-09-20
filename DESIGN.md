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

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#161614` | `#f7f5f0` |
| Raised surface | `#1e1e1b` | `#f2f0e7` |
| Primary text | `#e7e5dc` | `#111` |
| Secondary text | `#a5a297` | `#6f6d63` |
| Tertiary text | `#918e83` | `#777` |
| Hairline divider | `#2d2d28` | `#dedbcf` |
| Highlight | `#cede3f` | `#e9f56c` |

Dark is the default; the theme toggle persists the reader's choice. Neutral
surfaces and restrained highlights communicate interaction, selection, and focus.

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
- Home opening: name, existing introduction, direct navigation, and links to
  recent published writing when available
- Archives and projects: editorial content beside a `6.5rem` navigation column,
  with a `4rem` gap
- Article: heading, author/date/reading metadata, body, return link, and a
  progressively enhanced contents rail
- At 600px and below: a single content column with wrapping navigation and
  reduced spacing; wide code and diagrams scroll internally

## Components

- Links use plain text and underline behavior rather than buttons or card shells.
- Index entries are rows separated by one-pixel rules.
- Callouts use a full one-pixel border and a compact semantic label.
- Code blocks use a solid near-black surface and one-pixel border.
- Images remain square-edged enough to read as evidence, not decorative media.
- Focus uses a visible two-pixel theme-highlight outline with offset.

## Motion

The site has no client-side transition framework. Small name-underline and
contents-indicator transitions support interaction. Smooth scrolling and
nonessential transitions respect `prefers-reduced-motion`.

## Voice

Direct, practical, and precise. Copy starts with recognizable problems, names the decision being made, and distinguishes demonstrations from production recommendations. Avoid hype, invented metrics, and unexplained jargon.
