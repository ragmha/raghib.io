# Apple Health pipeline — security model

This document describes the three layers of protection that keep personal
information out of the repository and the public site. Each layer is
independently verifiable and stands on its own — no single failure leaks data.

---

## Layer 1 — Source minimisation (on the iPhone)

The iPhone is the **only** place that has access to raw HealthKit data. The
goal of Layer 1 is to make sure as little of that data as possible ever
leaves the device.

* The iOS Shortcut reads **only**
  `HKQuantityTypeIdentifierStepCount`, summed for the previous full local
  calendar day. No location, GPS, source app, device id, sub-day timestamps,
  or any other HealthKit identifier is ever read.
* The Shortcut sends a payload of exactly
  `{ "date": "YYYY-MM-DD", "steps": <integer> }` — nothing more.
* Authentication is a **fine-grained Personal Access Token** named
  `GH_APPLE_HEALTH`, scoped to this single repository, with the minimum
  permission required for `repository_dispatch` (`Contents: Read & Write`),
  set to expire in 90 days. The token is stored in the iPhone Keychain via
  the Shortcut and is **never** written to a file or shared.
* Date is the user's local date for the previous full day, so partial-day
  values can never leak.

See `docs/ios-shortcut-setup.md` for the one-time setup walkthrough,
including PAT rotation.

---

## Layer 2 — CI-side validation, redaction & isolation

Even though Layer 1 should send the right payload, the CI pipeline treats the
incoming data as **untrusted** and validates it from scratch.

* The gh-aw orchestrator workflow (`.github/workflows/health-ingest.md`)
  runs with read-only `permissions:` and writes only through gh-aw
  `safe-outputs`.
* **Schema validation** — `scripts/validate-payload.ts` invokes the type
  guards in `src/lib/health/schema.ts`. The accepted schema is exactly:

      { date: 'YYYY-MM-DD', steps: integer in 0..200000 }

  Unknown keys are dropped. Out-of-range values, malformed dates, or extra
  structure cause the entire payload to be rejected and the workflow to fail.
* **Defence-in-depth scan** — `scripts/redact-guard.ts` runs as the *last*
  step before commit. It walks the new `steps.json` and `insights.json` and
  fails the workflow if any of the keys in `FORBIDDEN_KEYS` appears anywhere
  (case-insensitive). The list includes `source`, `device`, `uuid`,
  `latitude`, `longitude`, `gps`, `metadata`, `userid`, etc.
* **Log hygiene** — every step uses `::add-mask::` on the PAT and never
  echoes the dispatch payload. AI summarisation in the `health-summarize.md`
  workflow runs against the already-redacted JSON only — the AI never sees
  the raw payload.
* **Backfill isolation** — `scripts/parse-export.py` (Apple Health Parser
  wrapper) processes `export.zip` only inside `${RUNNER_TEMP}`. The temp
  directory is wiped at the end of every job. The zip is **never committed**
  and is excluded by `.gitignore` (`*.zip`, `export.xml`,
  `apple_health_export/`).

---

## Layer 3 — Output redaction & coarsening (what lives in the repo)

The committed JSON is the public-facing artefact. Layer 3 makes sure its
shape is intentionally minimal so that even a curious observer with full
git history cannot reconstruct anything sensitive.

* `src/data/steps.json` schema is **whitelist-only and bounded**:

      { updatedAt: ISO, days: Array<{ date: 'YYYY-MM-DD', steps: integer }> }

* **Day-level granularity only.** No hourly or minute-level samples are ever
  stored. This is the single most important coarsening: it prevents
  inference of location patterns, sleep schedule, commute timings, or workout
  timings from the data.
* `src/data/insights.json` (the AI-generated narrative summaries) is also
  schema-validated, with bounded length per field
  (`weekly` ≤ 400 chars, `monthly` ≤ 600, `yearly` ≤ 800). The summariser
  prompt forbids place names and exact dates; the schema check truncates
  anything that exceeds the bounds.
* TypeScript types in `src/lib/health/schema.ts` are the single source of
  truth — both the build and the CI scripts import from there, so a schema
  drift surfaces immediately as a type error.

---

## What is *not* protected by this model

* The shape of the data (daily step counts) is itself public once committed.
  Treat the repository as the public boundary.
* If the PAT is leaked from the iPhone Keychain, an attacker could send fake
  step data to the dispatch endpoint. The schema guard prevents structural
  damage, but the values themselves would be untrusted. Rotate the PAT
  promptly if you suspect exposure.
* This model does not encrypt the committed data. It coarsens it.
