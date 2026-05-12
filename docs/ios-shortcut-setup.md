# iPhone Shortcut setup — Apple Health → GitHub

This is the one-time setup that turns your iPhone into the daily ingest
source for the `/health` page. After this is configured the pipeline runs
on its own; nothing on your phone needs your attention again until the PAT
needs rotating in 90 days.

The same setup is what makes the *fully automated* version of the pipeline
possible without any Apple ID credential ever touching CI — see
`security-model.md` for why.

---

## 1 — Create a fine-grained Personal Access Token

1. On github.com → **Settings → Developer settings → Personal access tokens
   → Fine-grained tokens → Generate new token**.
2. Name: `GH_APPLE_HEALTH`.
3. Expiration: **90 days** (longest you should ever set; calendar reminder
   to rotate is a good idea).
4. Repository access: **Only select repositories →** this repo.
5. Repository permissions: **Contents: Read and write** (this is the
   permission used by `repository_dispatch`). Everything else can stay
   "No access".
6. Generate. Copy the token — you will not see it again.

## 2 — Store it as a repository secret (for CI usage)

Even though only the iPhone uses the token, store it as a repo secret so it
is recorded in one place and easy to rotate later:

* On the repo → **Settings → Secrets and variables → Actions → New
  repository secret**.
* Name: `GH_APPLE_HEALTH`. Value: paste the PAT.

The CI workflows themselves never need this secret — they receive the
dispatched event from your phone — but storing it here gives you a single
canonical record of which token is currently in use.

## 3 — Build the iPhone Shortcut

Open the **Shortcuts** app on iPhone → **+** to create a new shortcut. Add
these actions in order:

1. **Get Current Date** — output: Current Date.
2. **Adjust Date** — input: Current Date; **Subtract 1 Day**. Output:
   Yesterday.
3. **Format Date** — input: Yesterday; Format: `yyyy-MM-dd`. Save the
   variable as `DateString`.
4. **Find Health Sample** — Type: **Steps**; **Sort by**: Start Date;
   **Limit**: 0 (all). Filter: **Start Date is today** *(use the calendar
   selector for "yesterday" if available, otherwise filter in step 5)*.
   - If your iOS version exposes "Sum" / "Statistics" directly, prefer
     **Health Statistics** with type **Steps**, **Aggregate: Sum**,
     **Period: Day**, **Date: Yesterday**. That returns a single number
     and removes the need for the next two steps.
5. **Calculate Statistics** *(skip if you used Health Statistics above)* —
   Operation: **Sum**; Input: previous result. Save as `StepsRaw`.
6. **Round Number** — input: `StepsRaw`; To: 0 places. Save as `Steps`.
7. **Text** — content (mark this action as a **secret** action by long-press
   → "Show in Share Sheet → off"; the value is templated only at run time):

       {"event_type":"apple-health-step","client_payload":{"date":"DateString","steps":Steps}}

   Drag the variables `DateString` and `Steps` into the placeholders.
8. **Get Contents of URL** —
   - URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
     (substitute your repo).
   - Method: **POST**.
   - Headers:
     - `Accept: application/vnd.github+json`
     - `Authorization: token GH_APPLE_HEALTH_PAT_VALUE_PASTED_HERE`
       *(paste the actual PAT value here, not the variable name; Shortcuts
       stores this in the iOS Keychain)*.
     - `X-GitHub-Api-Version: 2022-11-28`
   - Request Body: **JSON**, value = the `Text` action output from step 7.

A successful POST returns HTTP 204 with an empty body — that is normal.

## 4 — Schedule it

1. **Shortcuts → Automation → +** (top right).
2. **Personal Automation → Time of Day**, set to **00:05** (any minute
   after midnight is fine; the script reads *yesterday's* total so timing
   beyond "after midnight local" doesn't matter).
3. **Repeat: Daily**.
4. **Run Shortcut** → choose the shortcut you just built.
5. Toggle **Run Immediately** on (no confirmation prompt). Save.

## 5 — First run smoke test

Run the shortcut manually once:

* In **Shortcuts**, tap the play button on your shortcut.
* Watch the GitHub repo — within a few seconds the
  `Health Ingest` workflow should appear under **Actions**, then a pull
  request with a one-line update to `src/data/steps.json` should appear.
* Review and merge.

## 6 — Rotation

Every ~80 days, set a reminder to:

1. Generate a new fine-grained PAT with the same name.
2. Update the `Authorization` header in the iPhone Shortcut.
3. Update the `GH_APPLE_HEALTH` repo secret.
4. Delete the old PAT in GitHub → Settings → Developer settings.

---

## Optional: backfill historical data

For data older than the day you set up the shortcut, do a one-time backfill:

1. iPhone **Health → top-right profile → Export All Health Data → Export**.
2. Share it to your laptop (AirDrop / iCloud Drive). The file is `export.zip`.
3. Upload it somewhere with a short-lived presigned URL (e.g.
   `transfer.sh`, `bashupload.com`, an S3 / R2 presigned URL good for
   ~10 minutes — never hand the file out longer than necessary).
4. **GitHub → Actions → Health Backfill → Run workflow**, paste the URL.
5. The workflow downloads the zip into `$RUNNER_TEMP`, runs
   `apple-health-parser` to extract daily totals, gap-fills
   `src/data/steps.json`, runs the redact-guard, and opens a PR. The zip is
   wiped from the runner before commit.
