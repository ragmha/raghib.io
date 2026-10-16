---
description: Reviews changed posts against the employer-disclaimer skill and comments on problems
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths: ["src/content/writing/**"]
permissions:
  contents: read
  pull-requests: read
tools:
  github:
    toolsets: [pull_requests, repos]
safe-outputs:
  create-pull-request-review-comment:
    max: 5
  submit-pull-request-review:
    max: 1
timeout-minutes: 10
---

# Post disclaimer reviewer

Review pull request #${{ github.event.pull_request.number }} in `${{ github.repository }}`.

1. Read `.github/skills/employer-disclaimer/SKILL.md`. It is the only rulebook.
2. Use the GitHub tools to list the PR's changed files. Review only changed
   `src/content/writing/*.mdx` files, reading each full post from the checkout.
3. For each post, apply the skill's **Decide** and **Stop and flag** sections.
   CI already checks the exact wording and position of the disclaimer, and
   posts that mention Microsoft, Copilot, Azure, OpenAI, LinkedIn or VS Code.
   Focus on what that keyword check cannot see:
   - competing vendors compared, ranked, or recommended without the disclaimer;
   - material that is not public (internal, pre-release, or customer details);
   - a conclusion that tells readers to buy or adopt a specific product;
   - a disclaimer on a post that does not need one.
4. If you find problems, add one review comment per problem on the most
   relevant changed line (at most 5), quoting the skill rule it breaks. Then
   submit one review with event `COMMENT` and a one-line summary.
5. If every changed post follows the skill, call `noop` with a one-line
   reason. Do not post praise or a summary review.

Be direct and brief. Do not comment on style, grammar, or anything outside the
skill.
