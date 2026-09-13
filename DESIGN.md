# Design System

<!-- impeccable:design-schema 1 -->

## Direction

raghib.io is a restrained solution-engineering field notebook. It rejects the animated developer-portfolio convention in favor of a narrow editorial index where role, writing, projects, and evidence are immediately legible.

The supplied `matchaonmuffins.dev` reference is the layout authority: direct text navigation, compact composition, minimal ornament, and content that does not sit inside decorative cards.

## Color

- Background: `#10110f`
- Raised/code surface: `#171916`
- Primary text: `#e9ebe4`
- Reading text: `#d4d7cf`
- Secondary text: `#a6aa9f`
- Tertiary text: `#777d72`
- Hairline divider: `#2d302b`
- Link accent: `#b8cea6`
- Strong link accent: `#d2e5c3`

The strategy is restrained: neutral surfaces and one muted green accent. Color communicates links, selection, and focus rather than decoration.

## Typography

- Interface and reading: native system sans-serif stack
- Code and technical identifiers: native system monospace stack
- Homepage display: `clamp(1.9rem, 7vw, 2.8rem)`, weight 600
- Body: 16px with approximately 60–68 characters per line

Monospace is reserved for code, references, and machine-readable information. It is not used as a general technical costume.

## Layout

- Primary frame: `40rem` maximum width with `1rem` minimum side gutters
- Home opening: name, role, positioning, and direct navigation
- Archive and projects: single-column indexes separated by hairlines
- Article: title, description, compact metadata, optional collapsed contents, body, and return link
- Mobile: navigation wraps beneath the name; link descriptions stack under labels; footer stacks vertically

## Components

- Links use plain text and underline behavior rather than buttons or card shells.
- Index entries are rows separated by one-pixel rules.
- Callouts use a full one-pixel border and a compact semantic label.
- Code blocks use a solid near-black surface and one-pixel border.
- Images remain square-edged enough to read as evidence, not decorative media.
- Focus uses a visible two-pixel green outline with offset.

## Motion

The site uses no decorative animation or client-side transition layer. Smooth scrolling is the only authored motion and is disabled when reduced motion is requested.

## Voice

Direct, practical, and precise. Copy starts with recognizable problems, names the decision being made, and distinguishes demonstrations from production recommendations. Avoid hype, invented metrics, and unexplained jargon.
