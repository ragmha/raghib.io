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
git clone https://github.com/yourusername/raghib.io.git
cd raghib.io
bun install
bun dev
```

Open [http://localhost:4321](http://localhost:4321).

## Commands

```bash
bun dev               # local development
bun run check         # Astro and TypeScript checks
bun run build         # static production build
bun run sync:projects # refresh projects from the selected GitHub star list
bun test              # unit tests
```

## Projects

The Projects page is generated from the public repositories in
[`ragmha/blog-projects`](https://github.com/stars/ragmha/lists/blog-projects).
Run `bun run sync:projects` with an authenticated `gh` CLI to refresh
`src/content/github-projects.json`, then commit and redeploy. Per-project
overrides (category, description, demo/extra links) live in
`src/content/project-snapshot.ts` and survive future syncs.

## Writing and project writeups

Posts live in `src/content/writing/`. A project can optionally have a longer
writeup at `/project/<project-name>/writings`, authored as MDX in
`src/content/project-writeups/`; set `published: true` when it's ready to go
live. Writeups are separate from the Writing archive/RSS feed.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
