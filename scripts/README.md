# scripts/

CI helper scripts that power the Apple Health pipeline. See
`docs/security-model.md` for the threat model these scripts implement.

| Script | Purpose | Layer |
|---|---|---|
| `validate-payload.ts` | Strict schema-guard for an incoming `repository_dispatch` payload. | 2 |
| `merge-steps.ts` | Idempotent merge of validated entries into `src/data/steps.json`. | 2 |
| `redact-guard.ts` | Defence-in-depth scan of the post-merge JSON for any forbidden key. Run *last*, before commit. | 2 |
| `parse-export.py` | Backfill helper. Reads `export.zip`, emits whitelist `[{ date, steps }]` to stdout. | 2 |

## Local invocation

```bash
# Validate + merge a single day
echo '{"date":"2024-05-01","steps":12345}' \
  | bunx tsx scripts/validate-payload.ts \
  | bunx tsx scripts/merge-steps.ts --mode=daily

# Redact-guard scan
bunx tsx scripts/redact-guard.ts

# Backfill from export.zip (requires uv)
cd scripts && uv sync && uv run python parse-export.py /path/to/export.zip > out.json
```

## gh-aw integration

The three workflows in `.github/workflows/` invoke these scripts:

* `health-ingest.md` — `validate-payload.ts` → `merge-steps.ts --mode=daily` → `redact-guard.ts`
* `health-backfill.md` — `parse-export.py` → `validate-payload.ts` → `merge-steps.ts --mode=backfill` → `redact-guard.ts`
* `health-summarize.md` — reads `steps.json`, generates AI insights, schema-validates them, then runs `redact-guard.ts` against the resulting `insights.json`

Each markdown workflow must be compiled to its `.lock.yml` companion via
`gh aw compile` before the workflow will run on GitHub Actions. Both the
`.md` source and the generated `.lock.yml` are committed alongside each
other.
