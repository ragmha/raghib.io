---
applyTo: "src/content/writing/**"
---

# Posts: no employer content

The site is independent writing. Posts never name the author's employer or its
products, and carry no employer disclaimer. `tests/no-employer.test.mjs` fails
CI on Microsoft, GitHub, Copilot, Azure, LinkedIn, VS Code, OpenAI, Bing and
similar names outside code blocks and URLs.

When reviewing a post, also flag what the keyword test can't catch:

- A post whose subject is an employer product described generically, such as
  its pricing, plans or internal workflow.
- Measurements, screenshots or examples that come from an employer product.
- Internal, pre-release, or customer material.

Suggest reframing around the tool-agnostic pattern: the constraint, the design
that resolves it, and its trade-offs.
