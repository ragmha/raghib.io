---
description: Weekly American English spellcheck of site content; opens a fix PR only when cspell finds something
on:
  schedule: weekly
  workflow_dispatch:
permissions:
  contents: read
timeout-minutes: 15
# ponytail: agent runs only when cspell finds something, so a clean week costs no AI credits.
if: needs.spellcheck.outputs.findings != '0'
jobs:
  spellcheck:
    runs-on: ubuntu-latest
    needs: [activation]
    permissions:
      contents: read
    outputs:
      findings: ${{ steps.cspell.outputs.findings }}
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
      - id: cspell
        shell: bash
        run: |
          mkdir -p /tmp/gh-aw/agent/spellcheck
          out=/tmp/gh-aw/agent/spellcheck/findings.txt
          set +e
          npx --yes cspell@8.19.4 lint --no-progress --no-summary --no-color --show-suggestions > "$out"
          code=$?
          set -e
          count=$(grep -c . "$out" || true)
          # cspell exits 1 for spelling findings; anything else, or a failure with no findings, is a broken run.
          if [ "$code" -ne 0 ] && { [ "$code" -ne 1 ] || [ "$count" -eq 0 ]; }; then cat "$out"; exit "$code"; fi
          echo "findings=$count" >> "$GITHUB_OUTPUT"
          cat "$out"
      - uses: actions/upload-artifact@v7
        with:
          name: spellcheck
          path: /tmp/gh-aw/agent/spellcheck/findings.txt
          retention-days: 3
steps:
  - uses: actions/download-artifact@v8
    with:
      name: spellcheck
      path: /tmp/gh-aw/agent/spellcheck
tools:
  edit:
safe-outputs:
  create-pull-request:
    title-prefix: "[spellcheck] "
    labels: [automated]
    if-no-changes: "ignore"
    allowed-files:
      - src/content/**/*.md
      - src/content/**/*.mdx
      - cspell.json
---

# Weekly spellcheck

cspell (American English, config in `cspell.json`) found
${{ needs.spellcheck.outputs.findings }} unknown words in `src/content/`. They are
listed in `/tmp/gh-aw/agent/spellcheck/findings.txt` as
`<file>:<line>:<col> - Unknown word (<word>) Suggestions: [<suggestions>]`.

For each finding, read the surrounding sentence and decide:

- **Genuine typo:** fix the word in the post. Change only that word. Never
  touch code blocks, URLs, frontmatter keys, quotations, or anything else.
- **Correct word** (a name, product, command, flag, or technical term): add it
  to the `words` list in `cspell.json`, keeping the list alphabetical
  (case-insensitive). Do not change the post.

Do not re-run cspell; the file is the source of truth.

Then create one pull request titled "Fix spelling". In the body, list each
typo fixed (old → new, file) and each word added to `cspell.json`. If nothing
needed changing, call `noop` with a one-line reason.
