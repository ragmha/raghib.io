---
description: Translates published English posts to Finnish and opens a draft PR for review
on:
  push:
    branches: [main]
    paths: ["src/content/writing/**"]
  workflow_dispatch:
permissions:
  contents: read
timeout-minutes: 30
# ponytail: agent runs only when a published post has no Finnish version or changed since its translation landed.
if: needs.stale.outputs.count != '0'
jobs:
  stale:
    runs-on: ubuntu-latest
    needs: [activation]
    permissions:
      contents: read
    outputs:
      count: ${{ steps.find.outputs.count }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          persist-credentials: false
      - id: find
        shell: bash
        run: |
          out=/tmp/gh-aw/agent/translate
          mkdir -p "$out"
          : > "$out/todo.txt"
          for src in src/content/writing/*.mdx; do
            name=$(basename "$src")
            fi_file="src/content/writing-fi/$name"
            grep -q '^published: false' "$src" && continue
            if [ ! -f "$fi_file" ]; then echo "new $name" >> "$out/todo.txt"; continue; fi
            # ponytail: diffs from the commit that last touched the translation; English edits made
            # while a translation PR was open are missed until the next edit to that post.
            since=$(git log -1 --format=%H -- "$fi_file")
            git diff --quiet "$since" HEAD -- "$src" && continue
            git diff "$since" HEAD -- "$src" > "$out/$name.diff"
            echo "update $name" >> "$out/todo.txt"
          done
          echo "count=$(grep -c . "$out/todo.txt" || true)" >> "$GITHUB_OUTPUT"
          cat "$out/todo.txt"
      - uses: actions/upload-artifact@v7
        with:
          name: translate
          path: /tmp/gh-aw/agent/translate/
          retention-days: 3
steps:
  - uses: actions/download-artifact@v8
    with:
      name: translate
      path: /tmp/gh-aw/agent/translate
tools:
  edit:
safe-outputs:
  create-pull-request:
    title-prefix: "[translate-fi] "
    labels: [automated, translation]
    draft: true
    if-no-changes: "ignore"
    allowed-files:
      - src/content/writing-fi/*.mdx
---

# Translate posts to Finnish

`/tmp/gh-aw/agent/translate/todo.txt` lists ${{ needs.stale.outputs.count }}
posts from `src/content/writing/`, one per line, as `new <file>` or
`update <file>`. For each `update`, `/tmp/gh-aw/agent/translate/<file>.diff` is
the English change since the Finnish version last changed.

Write each translation to `src/content/writing-fi/<file>`, keeping the file name
so the post is served at `/fi/writing/<slug>/`.

- **new:** translate the whole post.
- **update:** read the existing Finnish file first, then change only the
  passages the diff touches. Leave every other sentence exactly as it is, so
  wording does not drift between edits. If most of the post changed,
  retranslate it, but keep the existing translation's terminology and voice.

## How to translate

- Write natural, idiomatic Finnish for a broad technical audience, not a
  word-for-word rendering. Keep the author's voice: direct, curious, practical.
  Address the reader as "sinä" where the English says "you".
- Keep in English: product, company, project and people's names; commands, APIs
  and file names; and terms Finnish developers normally use untranslated (pull
  request, commit, branch, merge, CI/CD, DNS, frontend, backend, prompt, token,
  LLM). Use the established Finnish word where one exists (tekoäly, ohjelmisto,
  palvelin, tietoturva).
- Never change code blocks, inline code, URLs, file paths, Mermaid blocks, HTML
  or MDX tags and their attributes. Translate image alt text.
- If the post starts with a `**Disclaimer:**` paragraph, copy it verbatim in
  English as the first paragraph. CI rejects any other wording.
- Frontmatter: translate `title`, `description` and `seoTitle`; copy every other
  field unchanged. The page title is `<seoTitle or title> · Raghib Hasan` and
  must stay within 60 characters, so add a `seoTitle` of at most 44 characters
  when the Finnish title is longer.
- Links to other posts (`/writing/<slug>/`) point to `/fi/writing/<slug>/` only
  if `src/content/writing-fi/<slug>.mdx` exists or you are creating it now.

Do not touch any file outside `src/content/writing-fi/`.

Then create one pull request titled "Finnish translations". In the body, list
each file as new or updated, and any passage a Finnish-speaking reviewer should
check closely. If nothing needed changing, call `noop` with a one-line reason.
