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
```

## Project writeups

Project writeups are separate from the Writing archive and its RSS feed.
Each project can have one writeup at `/project/<project-name>/writings`.
The repository README covers what the project does and how to use it; the
writeup explains the problem, decisions, alternatives, trade-offs, and lessons.

1. Add an MDX file in `src/content/project-writeups/`. Use the unpublished
   `apple-books-mcp.mdx` starter as a structure, not as publishable copy.
2. Set `project` to the exact name in `src/content/project-snapshot.ts`, plus
   `title`, `description`, and the publication `date`.
3. Write your account and set `published: true` when ready. Omitted or false
   `published` values keep the writeup private from the built site.

Published writeups automatically add **Writeup →** beside the project's
Source/Live links. Drafts generate neither a page nor a link. Unknown projects
and duplicate writeups for the same project fail the build. The page reuses
the editorial theme and contents rail, with links back to Projects and the
repository README; no GitHub README is fetched or copied automatically.

---

Feel free to open issues or contribute!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
