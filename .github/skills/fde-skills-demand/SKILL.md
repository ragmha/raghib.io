---
name: fde-skills-demand
description: Ranks the skills that forward deployed engineer (FDE) job postings ask for, from a parsed snapshot of every role on forwarddeployed.fun, and refreshes that snapshot with a bundled script. Use when deciding what to learn for FDE, deployment strategist, or applied AI engineer roles; tailoring a résumé, portfolio, or this site's about and project pages to them; preparing for FDE interviews; or writing about the FDE job market.
---

# FDE skills demand

What forward deployed engineering roles ask for, measured from the postings
themselves. Quote the snapshot rather than intuition, and say how it was
measured.

## Snapshot: 2026-10-19

919 of 919 roles parsed, from 351 companies on [forwarddeployed.fun](https://www.forwarddeployed.fun/). Share = postings whose full description matches the skill's pattern.

| KPI | Value |
| --- | --- |
| Remote-eligible | 41% |
| Based in the United States | 63% |
| Median minimum experience | 5 years (609 postings state it) |
| Median posted pay, range midpoint | $210k (242 postings state a $ range) |
| Biggest hirers | OpenAI 72, Palantir 54, Databricks 43, Anthropic 35, LangChain 17 |

| # | Skill | Group | Share |
| --- | --- | --- | --- |
| 1 | Communication | Customer | 76% |
| 2 | End-to-end ownership | Customer | 72% |
| 3 | Stakeholder & executive management | Customer | 67% |
| 4 | APIs & integrations | Build | 66% |
| 5 | Customer-facing | Customer | 63% |
| 6 | Ambiguity & problem solving | Customer | 62% |
| 7 | Python | Build | 61% |
| 8 | AI agents | AI | 57% |
| 9 | Architecture & system design | Build | 57% |
| 10 | LLMs & generative AI | AI | 54% |
| 11 | Travel | Customer | 47% |
| 12 | Machine learning | AI | 31% |
| 13 | TypeScript | Build | 27% |
| 14 | AWS | Infra | 25% |
| 15 | Evals | AI | 24% |
| 16 | JavaScript / Node | Build | 24% |
| 17 | Pre-sales & POCs | Customer | 24% |
| 18 | Data pipelines & ETL | Build | 19% |
| 19 | SQL | Build | 17% |
| 20 | GCP | Infra | 17% |

Also measured: Azure 16%, Full-stack 16%, RAG & retrieval 15%, Prompt engineering 15%, Docker & containers 13%, Kubernetes 13%, CI/CD 13%, Security clearance 12%, React 12%, Java 10%, MCP 9%, C++ 8%, Go 7%, Fine-tuning 7%, Terraform & IaC 6%, Rust 4%.

## Read it

- **Customer work leads.** Communication, ownership, executive stakeholders,
  customer-facing work, and ambiguity each appear in more postings than any
  single technology.
- **The build core is Python plus integrations.** They are the only technical
  skills in the top tier; TypeScript or JavaScript is a distant second language.
- **AI means agents and LLMs first.** Each appears in about half of postings;
  evals, RAG, and prompt engineering are specialisms.
- **No cloud dominates.** AWS leads, but know one cloud well rather than all.
- **Expect the road.** Travel comes up in nearly half of postings.

## Use it

- **Learning plan:** work down the table and prove each skill with something
  shipped. One project can cover most of the top ten: a Python integration
  against a real API, wrapped in an agent with an eval set, demoed to a
  non-technical stakeholder.
- **Résumé, portfolio, about page:** mirror the top-ten wording with evidence.
  "Shipped a Python integration with a customer's API to production in two
  weeks" beats "strong communicator".
- **Interview prep:** have one story each for ambiguity, an executive
  stakeholder, and owning something end to end; practise building a small API
  integration in Python.
- **Writing about it:** cite "N% of postings on forwarddeployed.fun, <date>",
  never "most FDEs". A post on FDE hiring is a big-tech hiring topic, so apply
  the [employer-disclaimer](../employer-disclaimer/SKILL.md) skill.

## Limits

- A match means the words appear, sometimes in company boilerplate, not that
  the skill is required. Treat gaps under about 5 points as ties.
- One job board's index of FDE-titled roles: mostly US-based and dominated by a
  few hirers (see the KPI table).
- Pay is the midpoint of a posting's first dollar range; US and non-US dollars
  are mixed, and many postings state none.
- The site refreshes hourly. Refresh before quoting numbers publicly.

## Refresh

```sh
python3 .github/skills/fde-skills-demand/scripts/fde_demand.py
```

The first run fetches every posting (about three minutes) and caches the
descriptions in the system temp directory. Rerun if it reports `skipped`
postings, replace the Snapshot section with the output, then check **Read it**
against the new table. Skill patterns live in `SKILLS` at the top of the
script; its asserts guard the false positives they were tuned against. If no
roles or descriptions come back, the site's markup changed: fix `roles()` or
`describe()`.
