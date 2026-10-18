---
name: employer-disclaimer
description: Decide whether a raghib.io post needs the Microsoft employer disclaimer, and add it in the standard form and place. Use when drafting, reviewing, or publishing any post in src/content/writing/, or when a post names, compares, critiques, or recommends a vendor product.
---

# Employer disclaimer

The author works at Microsoft. The site is independent writing (see
`PRODUCT.md`), so the disclaimer is added only when an employer connection
could reasonably colour how a reader trusts the post.

## The text

Use this exact text, unchanged:

```mdx
**Disclaimer:** I work at Microsoft. This is my personal view, based only on public information. It isn’t an official position or a product recommendation.
```

## Decide

Add the disclaimer if **any** of these are true:

1. **Microsoft-family subject.** The post explains, evaluates, critiques,
   prototypes against, or proposes changes to a product, service, policy, or
   pricing from Microsoft or its subsidiaries (GitHub, LinkedIn, Azure,
   Copilot, VS Code, Microsoft 365, Windows, Xbox, npm, etc.).
2. **Competing vendors judged.** The post compares, ranks, or recommends
   specific commercial products in a market where Microsoft competes (cloud,
   AI models and assistants, developer tools, productivity, security,
   collaboration), even if no Microsoft product is named.
3. **Close partners judged.** The post evaluates a company with a major
   Microsoft partnership or investment (for example OpenAI) as a vendor.
4. **Workplace topic.** The post discusses big-tech employment, hiring,
   industry layoffs, or regulation that directly affects Microsoft.

Skip it when **all** of these are true:

- Vendors appear only incidentally: a link to docs, the editor or host used,
  "the repo is on GitHub", a screenshot of a tool in passing.
- No product is evaluated, compared, recommended, or criticised.
- The subject is a concept, open-source project, or personal build (for
  example React Server Components, building this site, DNS lessons that
  compare non-Microsoft hosts without touching the markets above).

When unsure, add it. A redundant disclaimer costs one line; a missing one
costs trust.

## Stop and flag instead of adding

The disclaimer makes two promises. If the post breaks either, do not paper
over it; tell the author:

- **"Based only on public information."** The post relies on internal,
  pre-release, customer, or non-public material. Remove that material or do
  not publish.
- **"Isn't a product recommendation."** The post's conclusion tells readers to
  buy or adopt a specific product. Reframe it as trade-offs, or flag the
  conflict.

## Place

- Once per post, as the first paragraph after the frontmatter, before any
  other content.
- Keep a plain bold-label paragraph in MDX, not a component or hand-built box.
  The shared Markdown renderer highlights it as an informational callout,
  using the site's light and dark themes without client-side JavaScript.
- Do not repeat it in `description`, `seoTitle`, social images, or RSS-only
  fields.
- If an older `**Disclosure:**` paragraph exists, replace it with the text
  above so every post reads the same.

## Check

CI (`bun test`, part of the required `SEO readiness` check) runs
`tests/employer-disclaimer.test.mjs`. It fails if a post mentions Microsoft,
Copilot, Azure, OpenAI, LinkedIn, or VS Code without the disclaimer, or if the
disclaimer is reworded or not first. It is a keyword tripwire only: competitor
comparisons and the **Stop and flag** cases still need this skill's judgment.
Copilot code review applies that judgment to PRs that change posts, via
`.github/instructions/writing.instructions.md`; keep that file in step with
this skill. It is advisory and does not block merging.

```sh
bun test tests/employer-disclaimer.test.mjs
```
