# raghib.io

A minimal independent technology blog built with Astro, TypeScript, plain CSS,
and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (required)
- [Node.js](https://nodejs.org/) 20 or newer
- [Git](https://git-scm.com/)

> On Windows, using [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) is recommended for a smoother experience.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/raghib.io.git
   cd raghib.io
   ```
2. Install dependencies (Bun required):
   ```bash
   bun install
   ```
3. Start the development server:
   ```bash
   bun dev
   ```
4. Open your browser and visit [http://localhost:4321](http://localhost:4321)

## Commands

```bash
bun dev       # local development
bun run check # Astro and TypeScript checks
bun run build # static production build
bun run sync:projects # refresh projects from the selected GitHub star list
```

## Project list

The Projects page renders the public repositories in
[`ragmha/blog-projects`](https://github.com/stars/ragmha/lists/blog-projects).
Run `bun run sync:projects` with an authenticated `gh` CLI to refresh
`src/content/github-projects.json`, then commit the snapshot and rebuild/deploy.
The command paginates both lists and repositories, updates the snapshot only
after a complete fetch, and refuses private repositories or duplicate project
names. The selected list may be private; the CLI account must have access.
Only this named list is read for publication.

Names, descriptions, source URLs, homepages, and languages come from GitHub.
Category, short display-description, demo URL, and extra-link overrides are keyed by `owner/repo` in
`src/content/project-snapshot.ts` and survive subsequent syncs; writeups remain
local. Language and category metadata are retained but not displayed.
Removing a project with an existing writeup requires removing or reassigning
that writeup, otherwise content validation deliberately fails.

Builds and page views use the checked-in snapshot, not the network. No token
is bundled into the site, and GitHub outages do not break an ordinary build.
List changes are not live: run the sync command and deploy to publish them.
The existing deployment workflow needs no additional credential.

### Project resource links

Each row always includes **Source ↗** linking to its GitHub repository.
**Live demo ↗** appears when `homepage` is set (from GitHub or a local override).
Additional resources use named `extraLinks`, rather than a generic "Others"
destination. For example, an entry in the local `overrides` map can include:

```ts
homepage: 'https://example.com/demo',
extraLinks: [
  { label: 'YouTube', url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID' },
  { label: 'Chrome Web Store', url: 'https://chromewebstore.google.com/detail/YOUR_EXTENSION_ID' },
],
```

Replace these illustrative URLs with real destinations before adding them.
Missing resources are omitted; no placeholder links are rendered. Local
overrides survive GitHub sync, and invalid URLs or empty labels fail rendering.

## Project writeups

Projects and Writing share the editorial archive layout. Projects hides its
visible page title/count and uses resource-list rows: a small decorative
repository icon tile, linked name, muted one-line summary, and thin dividers.
Source, optional Live demo, extra resources, and published Writeup links appear
as compact pills on the right, wrapping beneath the text on narrower screens.
Pills are small neutral outlined links, not status indicators; no fabricated
status is displayed. Rows use 32px icon tiles and compact spacing, with no
hover color or decoration changes. Keyboard focus outlines remain visible.
An accessible page heading remains available to screen readers.
The footer sits at the bottom of short pages and follows the content
on longer pages, without a fixed overlay.

Project writeups are separate from the Writing archive and its RSS feed.
Each project can have one writeup at `/project/<project-name>/writings`.
The repository README covers what the project does and how to use it; the
writeup explains the problem, decisions, alternatives, trade-offs, and lessons.

1. Add an MDX file in `src/content/project-writeups/`. The unpublished
   `apple-books-mcp.mdx` writeup is a draft awaiting editorial review.
2. Set `project` to the exact name in `src/content/project-snapshot.ts`, plus
   `title`, `description`, and the publication `date`.
3. Write your account and set `published: true` when ready. Omitted or false
   `published` values keep the writeup private from the built site.

Published writeups automatically add **Writeup →** beside the project's
repository name and optional Live link. Drafts are never linked from Projects, including during
development. During `bun dev`, open a draft directly at
`/project/<project-name>/writings` to review it with a visible draft notice
and `noindex` metadata. Production builds (including
`bun run preview`) generate neither draft pages nor draft links. Unknown projects
and duplicate writeups for the same project fail the build. The page reuses
the editorial theme and contents rail, with links back to Projects and the
repository README; no GitHub README is fetched or copied automatically.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
