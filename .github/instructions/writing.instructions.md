---
applyTo: "src/content/writing/**"
---

# Posts: no employer content

The site is independent writing about the author's interests, learning, and
knowledge—not marketing, a CV, or company promotion. Posts never name the
author's employer or its products, and carry no employer disclaimer.
`tests/no-employer.test.mjs` fails CI on Microsoft, GitHub, Copilot, Azure,
LinkedIn, VS Code, OpenAI, Bing and similar names outside code blocks and URLs.

When reviewing a post, also flag what the keyword test can't catch:

- A post whose subject is an employer product described generically, such as
  its pricing, plans or internal workflow.
- Measurements, screenshots or examples that come from an employer product.
- Internal, pre-release, or customer material.

Suggest reframing around the underlying idea when useful. Do not flatten a
genuine argument into false neutrality: a point of view is welcome when it is
the author's and its claims are supported.

## Independence check

The goal is independent, evidence-led writing, not forced neutrality. Hiding a
name doesn't remove a conflict of interest. For posts and experiments, flag
work that fails any of these, and leave the decision to the author:

1. **Does it endorse a commercial vendor?** Avoid ranking vendors by cost,
   quality, or speed, telling readers which to buy, or measuring on one
   vendor's product only. A supported point of view on ideas, practices, and
   trade-offs is welcome.
2. **Is every claim public?** No internal pricing mechanics, roadmap,
   telemetry, or customer material, even reworded.
3. **Would the vendor publish it?** Using fewer tokens, caching, or routing to
   smaller models is fine. A technique that works only because of a gap in
   metering, quotas, pricing, or terms is not; report it privately instead.
4. **Is it a substitute?** Building or promoting a replacement for an employer
   product is an outside-activity question for the author, not a style fix.
