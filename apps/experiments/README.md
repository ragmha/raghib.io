# experiments

The Astro app behind [raghib.io/experiments](https://raghib.io/experiments/),
a workspace in this repository. Each static experiment is a page in
`src/pages/`. It builds with `base: '/experiments'`, and the root
`bun run build` copies its `dist/` into the site's `dist/experiments/`.

| Experiment | What it does |
| --- | --- |
| [Agent Edits](https://raghib.io/experiments/agent-edits/) | Inspect local agent edit calls by agent, artifact category, and file |
| [Chess](https://raghib.io/experiments/chess/) | Play Stockfish locally |
| [Context Autopsy](https://raghib.io/experiments/context-autopsy/) | Inspect agent-session context and token use |
| [Session Flame](https://raghib.io/experiments/session-flame/) | Replay sessions as a flame chart |
| [Pixel Platformer](https://raghib.io/experiments/platformer/) | Play a 32-stage pixel platformer in the browser |
| [Token Diet](https://raghib.io/experiments/token-diet/) | Compare recorded token-use experiments |

Scripts (`dev`, `check`, `build`, `preview`, `test`, `test:browser`) run from
here or from the root with `bun run --filter experiments <script>`. Browser
tests run against the built app in Chromium and WebKit
(`bunx playwright install chromium webkit`), then record
`.checks/performance.json` at the repository root. Add new browser suites to
the `files` list in `scripts/test-browser.mjs`.

To add an experiment, create `src/pages/<slug>.astro`, add it to the
`experiments` list in `src/pages/index.astro`, and list the route in
`src/data/content-links.json`. Links, assets, workers and fetches must include
the base path through `import.meta.env.BASE_URL`; the browser tests fail on
root-relative URLs outside `/experiments/`.

The [token-diet reproduction kit](scripts/token-diet/README.md) can consume paid
model credits.

See [sources and licenses](PROVENANCE.md).
