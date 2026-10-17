---
applyTo: "src/content/writing/**"
---

# Posts: employer disclaimer

The author works at Microsoft; the site is independent writing. The full rules
live in `.github/skills/employer-disclaimer/SKILL.md`. When reviewing or
editing a post, apply them. CI already fails a post that mentions Microsoft,
Copilot, Azure, OpenAI, LinkedIn or VS Code without the disclaimer, or where
the disclaimer is reworded or not the first paragraph. Focus on what that
keyword check cannot see.

The disclaimer, verbatim, as the first paragraph after the frontmatter:

> **Disclaimer:** I work at Microsoft. This is my personal view, based only on public information. It isn’t an official position or a product recommendation.

Keep it as a plain bold-label paragraph in MDX. The shared Markdown renderer
adds the informational callout automatically; do not add per-post components,
wrappers, or styles.

Flag a post that is missing the disclaimer when it:

- compares, ranks, or recommends commercial products in a market where
  Microsoft competes (cloud, AI models and assistants, developer tools,
  productivity, security, collaboration), even if no Microsoft product is
  named;
- evaluates a Microsoft-family product (GitHub, LinkedIn, Azure, Copilot,
  VS Code, npm, etc.) or a close partner such as OpenAI as a vendor;
- discusses big-tech employment, hiring, layoffs, or regulation that directly
  affects Microsoft.

Flag a post that has the disclaimer but breaks its promises:

- it relies on internal, pre-release, customer, or other non-public material;
- its conclusion tells readers to buy or adopt a specific product.

Flag a disclaimer on a post where vendors appear only incidentally (a docs
link, the editor or host used, "the repo is on GitHub") and no product is
evaluated, compared, recommended, or criticised.

Quote the rule that applies. Do not comment on style or grammar for this
check.
