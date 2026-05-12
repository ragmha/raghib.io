# Getting started — Apple Health step counter

A practical, top-to-bottom checklist to take this code from "freshly merged"
to "step counts updating on `/health` automatically every day". Plan on ~20
minutes the first time; everything after is hands-off.

> Two deeper companion docs are referenced where useful:
> - [`docs/security-model.md`](./security-model.md) — *what* is protected and *why*
> - [`docs/ios-shortcut-setup.md`](./ios-shortcut-setup.md) — *every* iPhone Shortcut action in detail

---

## 0 — What you need

- iPhone with the **Health** app and the **Shortcuts** app
- This repo pushed to GitHub with **Actions enabled**
- Local dev: **Bun ≥ 1.3** + Node 20+ (see `.nvmrc`)
- The [GitHub CLI](https://cli.github.com/) (`gh`) plus the gh-aw extension:
  ```bash
  gh extension install github/gh-aw
  ```
- *(Optional, only for backfill of historical data)* [`uv`](https://github.com/astral-sh/uv) to run the Python parser locally

---

## 1 — Verify the code locally

```bash
bun install
bun run test --run     # 144/144 should pass
bun run build          # /health should appear as a static route
bun run dev            # open http://localhost:3000/health
```

You should see the empty-state version of the page (today ring at 0, empty
calendar, "Awaiting first sync"). That's correct — the seed `steps.json`
is empty until the first iPhone payload arrives.

---

## 2 — Push the code & confirm Actions is enabled

```bash
git add -A
git commit -m "feat(health): step counter + gh-aw pipeline"
git push -u origin <your-branch>
```

Open the PR, merge to `main`, then on github.com:

1. **Settings → Actions → General → Actions permissions** → "Allow all
   actions and reusable workflows" (or your org's equivalent).
2. **Settings → Actions → General → Workflow permissions** → "Read and
   write permissions" + check "Allow GitHub Actions to create and approve
   pull requests" (gh-aw needs this for the safe-output write job to
   open PRs).

---

## 3 — Re-compile the gh-aw lock files (only if you edited the `.md` workflows)

If you didn't touch `.github/workflows/health-*.md`, skip this — the
committed `.lock.yml` files are ready to go. Otherwise:

```bash
gh aw compile --no-check-update
git add .github/workflows/*.lock.yml .gitattributes
git commit -m "chore(health): recompile gh-aw lock files"
git push
```

---

## 4 — Create the GitHub Personal Access Token

1. **github.com → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Fill in:
   - **Token name:** `GH_APPLE_HEALTH`
   - **Expiration:** 90 days (longest you should ever set)
   - **Repository access:** Only select repositories → choose this repo
   - **Repository permissions:**
     - **Contents → Read and write** ✅ *(required for `repository_dispatch`)*
     - everything else: **No access**
3. **Generate token** → copy the value once (you won't see it again).

---

## 5 — Save the PAT as a repo secret (record only)

```bash
gh secret set GH_APPLE_HEALTH       # paste when prompted
```

Or via the UI: **Settings → Secrets and variables → Actions → New
repository secret** → name `GH_APPLE_HEALTH`, paste the value.

> The CI workflows themselves don't need the secret — your phone is the one
> that uses it. Storing it here just gives you a single canonical record of
> "which PAT is currently in use" so rotations are easy.

---

## 6 — Build the iPhone Shortcut

Full action-by-action walkthrough lives in
[`docs/ios-shortcut-setup.md` §3](./ios-shortcut-setup.md#3--build-the-iphone-shortcut).
Quick checklist version:

1. **Shortcuts app → +** to create a new shortcut, name it
   "Sync steps to GitHub".
2. Add actions, in order:
   - **Get Current Date** → **Adjust Date** (subtract 1 day)
   - **Format Date** as `yyyy-MM-dd` → save as `DateString`
   - **Health Statistics**: type *Steps*, aggregate *Sum*, period *Day*,
     date *Yesterday* → save as `Steps`
   - **Round Number** → 0 places (the Health value is sometimes a decimal)
   - **Text** action with body:
     ```json
     {"event_type":"apple-health-step","client_payload":{"date":"DateString","steps":Steps}}
     ```
     (drag `DateString` and `Steps` into the placeholders)
   - **Get Contents of URL**:
     - URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
     - Method: **POST**
     - Headers:
       - `Accept: application/vnd.github+json`
       - `Authorization: token <paste your PAT here>`
       - `X-GitHub-Api-Version: 2022-11-28`
     - Request Body: **JSON**, value = the previous Text action

A successful POST returns HTTP 204 with empty body — that is normal.

---

## 7 — Schedule it daily

1. **Shortcuts → Automation → +** (top right)
2. **Personal Automation → Time of Day**, set to **00:05** local time
3. **Repeat: Daily**
4. **Run Shortcut** → choose the one you just built
5. **Run Immediately: ON** (no confirmation prompt)
6. **Save**

---

## 8 — Smoke test the whole pipeline

1. In **Shortcuts**, tap ▶ on your shortcut to fire it manually.
2. On github.com → **Actions** tab → **Health Ingest** workflow run should
   appear within seconds.
3. When it finishes, a **PR titled `[health] Daily steps update`** is
   opened, modifying only `src/data/steps.json` with one new day.
4. Review the diff (it should look like just `{ "date": "...", "steps": N }`),
   then **merge**.
5. Vercel (or whatever you deploy with) rebuilds; your `/health` page now
   shows yesterday's step count.

**If the Actions run fails:**
- *401 Unauthorized* — PAT is wrong, expired, or missing the `Contents:
  Read and write` permission. Fix and re-fire the Shortcut.
- *Schema validation error* — the Shortcut sent something other than
  `{ date, steps }`. Most likely cause: `Steps` came through as a string;
  add a **Round Number** action before the Text action.
- *Redact-guard failure* — should never happen with the documented
  Shortcut flow. If it does, something added an unexpected field; check
  the workflow log for the offending key.

---

## 9 — *(Optional)* Backfill historical data

For data older than your first daily sync, do a **one-time** backfill:

1. iPhone → **Health** → top-right profile photo → scroll down →
   **Export All Health Data** → wait → **Export**.
2. Share `export.zip` to your laptop (AirDrop / iCloud Drive).
3. Upload it to a temporary, short-lived URL — e.g.
   ```bash
   curl --upload-file export.zip https://transfer.sh/export.zip
   ```
   or generate a presigned S3 / R2 URL valid for ~10 minutes. **Do not**
   commit the zip anywhere.
4. **GitHub → Actions → Health Backfill → Run workflow** → paste the URL.
5. The workflow downloads the zip into `$RUNNER_TEMP`, parses with
   `apple-health-parser`, gap-fills `src/data/steps.json` (never overwrites
   existing days), wipes the temp directory, and opens a PR.
6. Review and merge.

---

## 10 — *(Optional)* Enable the weekly AI summariser

Already enabled — the workflow `health-summarize.md` runs every Monday
06:00 UTC and opens a PR updating `src/data/insights.json`. To trigger it
manually:

```bash
gh workflow run health-summarize.lock.yml
```

To disable, comment out the `schedule:` line in
`.github/workflows/health-summarize.md` and re-run `gh aw compile`.

---

## 11 — Maintenance

| When | What |
|---|---|
| Every ~80 days | Rotate the PAT: regenerate it with the same name, update the iPhone Shortcut's `Authorization` header, update the `GH_APPLE_HEALTH` repo secret, delete the old PAT. |
| If you lose your phone | Delete the `GH_APPLE_HEALTH` PAT immediately on github.com → Settings → Developer settings. |
| If you change repo name | Update the URL in the Shortcut's "Get Contents of URL" action. |
| If the parser package updates | `cd scripts && uv sync --upgrade && uv lock`, commit `scripts/uv.lock`. |

---

## 12 — Cheat sheet

```bash
# Local development
bun install && bun run dev          # http://localhost:3000/health
bun run test --run                  # all tests

# Manually fire a fake daily-ingest dispatch (without the iPhone)
gh api -X POST /repos/:owner/:repo/dispatches \
  -f event_type=apple-health-step \
  -f 'client_payload[date]=2024-05-12' \
  -F 'client_payload[steps]=12345'

# Recompile gh-aw workflows after editing any .md
gh aw compile --no-check-update

# Trigger backfill from the CLI
gh workflow run health-backfill.lock.yml \
  -f export_url='https://transfer.sh/abc/export.zip'

# Trigger weekly summariser on demand
gh workflow run health-summarize.lock.yml
```

That's it. Once the first daily run succeeds you can largely forget about
this until the PAT rotation reminder fires in 80 days.
