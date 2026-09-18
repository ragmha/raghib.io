---
title: "About"
description: "Who I am and how this site is built"
---

## Who

I'm Raghib Hasan, a Solution Engineer at Microsoft. I spend my days close to
developer workflows: the tools, pipelines and feedback loops that decide
whether shipping software feels like flow or friction.

Most of my writing here is about that — ==the unglamorous middle layer==
between an idea and something running in production.

## How This Site Works

There is no framework. Markdown files in `site/content/` are turned into
static HTML by a single `build.mjs` script, roughly 400 lines of plain
Node. The output is HTML, one stylesheet, and one module of vanilla
JavaScript.

```
site/
  content/
    home.md            the homepage intro
    posts/*.md         writing, newest first
    pages/*.md         standalone pages like this one
  assets/
    style.css          the whole design system
    app.js             theme toggle, scroll spy, diagrams
    diagrams/          Excalidraw exports
```

The JavaScript is progressive enhancement only. Disable it and every word on
this site still renders — you lose the theme button, the section highlight
in the sidebar, and Mermaid diagrams. Nothing else.

## Colophon

- **Type** — the system monospace stack, so nothing is fetched over the wire
- **Colour** — warm paper in light mode, ink in dark, one highlighter yellow
- **Diagrams** — [Mermaid](https://mermaid.js.org) for text-authored charts,
  [Excalidraw](https://excalidraw.com) exports for hand-drawn ones
- **Hosting** — plain static files; any static host will do

## Elsewhere

- [GitHub](https://github.com/ragmha)
- [RSS feed](/feed.xml)
