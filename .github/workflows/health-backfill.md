---
name: Health Backfill
description: One-time / occasional backfill of daily step totals from an Apple Health export.zip using apple-health-parser. Gap-fill only; never overwrites existing entries.
on:
  workflow_dispatch:
    inputs:
      export_url:
        description: 'HTTPS URL to download export.zip from (use a short-lived presigned URL, e.g. a transfer.sh link).'
        required: true
        type: string

permissions:
  contents: read

engine:
  id: copilot

strict: true
timeout-minutes: 20

network:
  allowed:
    - defaults
    - node
    - python
    - "transfer.sh"
    - "*.s3.amazonaws.com"
    - "*.r2.cloudflarestorage.com"

sandbox:
  agent: awf

tools:
  bash:
    - "bun *"
    - "uv *"
    - "curl *"
    - "rm -rf $RUNNER_TEMP/*"
    - "mkdir -p $RUNNER_TEMP/*"
    - "ls *"
    - "cat src/data/steps.json"
  edit:

safe-outputs:
  create-pull-request:
    title-prefix: "[health] "
    labels: [automation, health-data, backfill]
    max: 1
---

# Health Backfill Agent

You are an automated pipeline that seeds historical daily step totals from an
Apple Health `export.zip`. You must process the file **only** inside
`$RUNNER_TEMP` and you must wipe the temp directory before exiting.

## Inputs

The download URL for the `export.zip` is in `${{ github.event.inputs.export_url }}`.
Treat the file contents as untrusted.

## Pipeline (run in order, fail closed)

1. **Stage** — `mkdir -p $RUNNER_TEMP/health` and `curl -fsSL --max-time 120
   --output $RUNNER_TEMP/health/export.zip "${{ github.event.inputs.export_url }}"`.
   Verify the file exists and is non-empty.

2. **Parse** — `cd scripts && uv sync` to install `apple-health-parser`,
   then `uv run python parse-export.py $RUNNER_TEMP/health/export.zip`.
   This script reads only `HKQuantityTypeIdentifierStepCount`, aggregates to
   daily totals, and writes a whitelist JSON array (`[{date, steps}, ...]`)
   to stdout. Capture stdout to `$RUNNER_TEMP/health/days.json`.

3. **Validate** — `bun scripts/validate-payload.ts --input
   $RUNNER_TEMP/health/days.json`. Pipe its stdout into the next step.

4. **Merge (gap-fill only)** — pipe into
   `bun scripts/merge-steps.ts --mode=backfill`. Backfill mode preserves any
   existing entry in `src/data/steps.json` and only fills missing dates.

5. **Redact-guard** — run `bun scripts/redact-guard.ts`. Treat any non-zero
   exit as a hard failure.

6. **Wipe** — `rm -rf $RUNNER_TEMP/health`. The export.zip and any
   intermediate artefacts must not survive the workflow run.

7. **Commit** — emit a single `create-pull-request` safe-output with:
   - title: `Historical steps backfill`
   - body: a one-paragraph summary stating only the count of newly added
     days and the resulting date range. Do **not** include any individual
     daily values, place names, or device identifiers.

## Security invariants

* Read-only `contents` permission. Only `src/data/steps.json` may be written
  via the safe-output channel.
* `export.zip` lives **only** in `$RUNNER_TEMP/health`. It must be deleted
  before commit.
* `parse-export.py` is the only code allowed to touch the raw export. The
  agent must not attempt to read the XML directly.
* If any step fails, abort. Do not attempt recovery.
