# raghib.io

Raghib Hasan's independent writing site: Astro, TypeScript, plain CSS, Bun,
statically generated.

- `PRODUCT.md` is the source of truth for audience and positioning: independent,
  cross-industry, not employer or product content. `DESIGN.md` covers visual
  design.
- Posts live in `src/content/writing/*.mdx`. Use the `raghib-editorial-voice`
  skill for drafting and the `employer-disclaimer` skill for the disclaimer.
  Posts use American English, and `seoTitle` must be 44 characters or fewer.
- Keep the CI job name `SEO readiness` unchanged: branch protection requires it.

Verify changes with the same steps CI runs:

```sh
npx --yes cspell@8.19.4 lint --no-progress
bun test --bail --timeout 20000
bun run build
bun run check:seo
bun run check:vitals
```
