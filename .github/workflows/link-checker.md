---
description: Weekly check of external links in posts and README; fixes broken ones or reports them
on:
  schedule: weekly
  workflow_dispatch:
permissions: read-all
timeout-minutes: 20
# ponytail: agent network is GitHub-only; add domains to network.allowed if it must research non-GitHub replacements.
network: defaults
steps:
  - name: Test external links
    run: |
      mkdir -p /tmp/gh-aw/agent
      out=/tmp/gh-aw/agent/broken-links.txt
      : > "$out"
      grep -rhoE 'https?://[^][[:space:]<>"'"'"'`()]+' src/content/writing src/content/project-writeups README.md \
        | sed -E 's/[.,;:]+$//' | grep -vE '^https?://(localhost|127\.0\.0\.1)' | sort -u \
        | while read -r url; do
            code=$(curl -sL -o /dev/null -w '%{http_code}' --max-time 15 -A 'Mozilla/5.0 raghib.io link check' "$url" || true)
            [[ "$code" =~ ^[23] ]] || echo "$code $url" >> "$out"
          done
      echo "Broken or unreachable links:"; cat "$out"
    shell: bash
tools:
  github:
    toolsets: [default]
  web-fetch:
safe-outputs:
  create-pull-request:
    title-prefix: "[link-checker] "
    labels: [automated]
    if-no-changes: "ignore"
  create-issue:
    title-prefix: "[link-checker] "
    labels: [automated]
    max: 1
---

# Weekly link checker

A setup step already tested every external link in `src/content/writing/`,
`src/content/project-writeups/`, and `README.md`. Broken or unreachable links
are listed one per line as `<http-code> <url>` in
`/tmp/gh-aw/agent/broken-links.txt`. An empty file means every link works.

1. If the file is empty, call `noop` with "All external links work" and stop.
2. Ignore codes `401`, `403`, `429`, and `999`: those are usually bot
   blocking, not dead pages. If nothing else remains, call `noop` and stop.
3. For each remaining link, find the file and line that uses it. Look for the
   page's current URL: for GitHub links use the GitHub tools; otherwise try
   `web-fetch`. Replace the URL only when you find the same content at a new
   address. Never change link text, surrounding prose, or anything else.
4. If you fixed any links, create one pull request titled
   "Fix broken links". List each old URL, its replacement, and the file.
5. List links you could not fix in one issue titled "Broken links", with the
   HTTP code, URL, and file for each. First check open issues with the
   `[link-checker]` prefix; if one already lists the same links, skip it.
