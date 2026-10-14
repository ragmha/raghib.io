#!/usr/bin/env bash
# Token diet: one repo with three seeded bugs, five agent setups, every run isolated.
#   ./run.sh setup              build the fixture repo and the five template homes
#   ./run.sh selfcheck          prove the verifier catches each seeded bug and passes the fixes
#   ./run.sh run <rep> [a..e]   run variants in parallel into .work/runs/<variant><rep>
set -euo pipefail

KIT=$(cd "$(dirname "$0")" && pwd)
WORK=$KIT/.work
VENV=$WORK/venv
NODE_BIN=${NODE_BIN:-$(dirname "$(command -v node)")}
COPILOT=${COPILOT:-$(command -v copilot)}
MODEL=${MODEL:-claude-sonnet-5.5}
EFFORT=${EFFORT:-medium}
CREDITS=${CREDITS:-300}
TIMEOUT=${TIMEOUT:-1500}
CAVEMAN=github:JuliusBrussee/caveman#d262ab3882952a59312ff3537cd86d894523c5ab
PROMPT="CI is red on main and finance reports wrong totals on some invoices. Find and fix the root causes, make sure the whole test suite passes, and commit the fixes following this repository's commit message convention."
# CONTRIBUTING.md: scope required for feat/fix/refactor/perf; lowercase summary, no trailing period.
SCOPES='(money|tax|discounts|invoice|format|cli|samples|release)'
SUBJECT_RE='^((feat|fix|refactor|perf)\('"$SCOPES"'\)|(docs|test|chore)(\('"$SCOPES"'\))?): [a-z].*[^.]$'
# The kit's own git calls ignore the user's global config (hooks, signing).
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1

die() { echo "run.sh: $*" >&2; exit 1; }
json_lines() { "$VENV/bin/python" -c 'import json, sys; print(json.dumps(sys.argv[1].splitlines()))' "$1"; }

agent_env() { # agent_env <home> <cmd...>: run with nothing from this machine but the token
  local home=$1; shift
  env -i HOME="$home" PATH="$WORK/tools:$VENV/bin:$NODE_BIN:$(dirname "$COPILOT"):/usr/bin:/bin:/usr/sbin:/sbin" \
    COPILOT_GITHUB_TOKEN="${COPILOT_GITHUB_TOKEN:-${GH_TOKEN:-$(gh auth token)}}" LANG=en_US.UTF-8 TERM=dumb \
    GIT_AUTHOR_NAME=Agent GIT_AUTHOR_EMAIL=agent@example.invalid \
    GIT_COMMITTER_NAME=Agent GIT_COMMITTER_EMAIL=agent@example.invalid "$@"
}

build_repo() {
  local repo=$WORK/fixture-repo date subject paths
  rm -rf "$repo" && mkdir -p "$repo"
  (cd "$KIT/fixture" && tar --exclude __pycache__ --exclude .pytest_cache -cf - .) | tar -xf - -C "$repo"
  git -C "$repo" init -q -b main
  while IFS='|' read -r date subject paths; do
    # shellcheck disable=SC2086 # paths is a space-separated list
    git -C "$repo" add -- $paths
    GIT_AUTHOR_DATE=$date GIT_COMMITTER_DATE=$date \
      git -C "$repo" -c user.name='Sam Rivera' -c user.email=sam@example.com commit -q -m "$subject"
  done <<'EOF'
2024-03-04T09:12:00Z|chore: scaffold project|pyproject.toml README.md .gitignore invoicer/__init__.py tests/conftest.py
2024-03-05T10:30:00Z|feat(money): add decimal money helpers|invoicer/money.py tests/test_money.py
2024-03-07T14:02:00Z|feat(tax): add sales tax, gst and vat rates|invoicer/rates.py tests/test_rates.py
2024-03-11T16:45:00Z|feat(discounts): split coupons across lines by largest remainder|invoicer/discounts.py tests/test_discounts.py
2024-03-14T11:20:00Z|feat(invoice): apply coupons per line before tax|invoicer/invoice.py tests/test_invoice.py
2024-03-18T09:55:00Z|feat(format): render invoices as text, markdown and csv|invoicer/formatting.py tests/test_formatting.py
2024-03-20T13:10:00Z|feat(cli): add total, render and regions commands|invoicer/cli.py tests/test_cli.py
2024-03-22T15:40:00Z|docs: add contributing guide|CONTRIBUTING.md
2024-03-27T10:05:00Z|test(samples): add golden invoices checked by finance|tests/test_samples.py tests/data/samples.json
2024-04-02T17:30:00Z|chore(release): 0.9.0|CHANGELOG.md
EOF
  [ -z "$(git -C "$repo" status --porcelain)" ] || die "the history does not commit every fixture file"
  git -C "$repo" rev-parse HEAD >"$WORK/base.sha"
}

build_homes() {
  local v
  rm -rf "$WORK/homes"
  for v in a b c d e; do
    mkdir -p "$WORK/homes/$v/.copilot"
    printf '{ "memory": false }\n' >"$WORK/homes/$v/.copilot/config.json"
  done
  cp "$KIT/principles.md" "$WORK/homes/b/.copilot/copilot-instructions.md"
  for v in c e; do
    env -i HOME="$WORK/homes/$v" PATH="$NODE_BIN:$(dirname "$COPILOT"):/usr/bin:/bin" LANG=en_US.UTF-8 \
      npm_config_cache="$WORK/npm-cache" npx -y "$CAVEMAN" -- --only copilot --non-interactive --no-color >/dev/null
  done
  for v in d e; do
    env -i HOME="$WORK/homes/$v" PATH="$WORK/tools:/usr/bin:/bin" LANG=en_US.UTF-8 \
      rtk init -g --copilot --auto-patch --no-trust-filters >/dev/null
  done
  { echo; cat "$KIT/principles.md"; } >>"$WORK/homes/e/.copilot/copilot-instructions.md"
}

setup() {
  [ -x "$WORK/tools/rtk" ] || die "put the rtk-oss 1.0.1 binary in $WORK/tools (see README.md)"
  [ -x "$VENV/bin/python" ] || { uv venv -q --python 3.12 "$VENV" && uv pip install -q --python "$VENV/bin/python" pytest==8.4.2; }
  build_repo
  build_homes
  {
    echo "copilot $("$COPILOT" --version | head -n 1)"
    echo "rtk $("$WORK/tools/rtk" --version)"
    echo "caveman ${CAVEMAN#*#}"
    echo "python $("$VENV/bin/python" -c 'import platform; print(platform.python_version())')"
    echo "pytest $("$VENV/bin/python" -m pytest --version 2>&1)"
  } >"$WORK/versions.txt"
  cat "$WORK/versions.txt"
}

verify() { # verify <repo>: JSON verdict on what the agent committed
  local repo=$1 base head subjects s tmp ok=false committed=false subject_ok=false tests_pass=false tests_changed=false
  base=$(cat "$WORK/base.sha")
  head=$(git -C "$repo" rev-parse HEAD)
  [ "$head" != "$base" ] && git -C "$repo" merge-base --is-ancestor "$base" "$head" && committed=true
  subjects=$(git -C "$repo" log --reverse --format=%s "$base..HEAD")
  if $committed; then
    subject_ok=true
    while IFS= read -r s; do
      { [ ${#s} -le 72 ] && grep -Eq "$SUBJECT_RE" <<<"$s"; } || subject_ok=false
    done <<<"$subjects"
  fi
  git -C "$repo" diff --quiet "$base" HEAD -- tests || tests_changed=true
  # Committed source + the original tests + a hidden acceptance test.
  tmp=$(mktemp -d)
  git -C "$repo" archive HEAD | tar -xf - -C "$tmp"
  rm -rf "$tmp/tests" && git -C "$repo" archive "$base" tests | tar -xf - -C "$tmp"
  cp "$KIT/hidden_test.py" "$tmp/tests/test_hidden.py"
  (cd "$tmp" && PYTHONDONTWRITEBYTECODE=1 "$VENV/bin/python" -m pytest -q -p no:cacheprovider >/dev/null 2>&1) && tests_pass=true
  rm -rf "$tmp"
  $committed && $subject_ok && $tests_pass && ok=true
  printf '{"success":%s,"committed":%s,"subjectOk":%s,"testsPass":%s,"testsChanged":%s,"subjects":%s}\n' \
    "$ok" "$committed" "$subject_ok" "$tests_pass" "$tests_changed" "$(json_lines "$subjects")"
}

selfcheck() {
  local dir=$WORK/selfcheck n i
  fresh() { rm -rf "$dir" && cp -R "$WORK/fixture-repo" "$dir"; }
  fix_all_but() { # fix_all_but <n>: apply every fix in bugs.tsv except line n, then commit
    local path bug fix line=0
    while IFS=$'\t' read -r path bug fix; do
      line=$((line + 1))
      [ "$line" = "$1" ] || BUG=$bug FIX=$fix perl -pi -e 's/\Q$ENV{BUG}\E/$ENV{FIX}/g' "$dir/$path"
    done <"$KIT/bugs.tsv"
    git -C "$dir" -c user.name=x -c user.email=x@example.invalid commit -qam 'fix(invoice): correct invoice totals'
  }
  fresh
  verify "$dir" | grep -q '"success":false' || die "the unfixed fixture passed verification"
  n=$(($(wc -l <"$KIT/bugs.tsv")))
  for ((i = 1; i <= n; i++)); do
    fresh && fix_all_but "$i"
    verify "$dir" | grep -q '"testsPass":false' || die "verification misses bug $i in bugs.tsv"
  done
  fresh && fix_all_but 0
  verify "$dir" | grep -q '"success":true' || die "the known fixes failed verification"
  git -C "$dir" -c user.name=x -c user.email=x@example.invalid commit -q --allow-empty -m 'Fix tax.'
  verify "$dir" | grep -q '"subjectOk":false' || die "a bad commit subject passed verification"
  rm -rf "$dir"
  echo "selfcheck ok: $n bugs, each caught on its own"
}

run_one() { # run_one <variant> <rep>
  local v=$1 dir=$WORK/runs/$1$2 box f
  rm -rf "$dir" && mkdir -p "$dir"
  # The agent sees its cwd and home in the system prompt, so keep both neutral.
  box=$(cd "$(mktemp -d /tmp/ws.XXXXXX)" && pwd -P)
  cp -R "$WORK/fixture-repo" "$box/invoicer"
  cp -R "$WORK/homes/$v" "$box/home"
  echo "$box" >"$dir/sandbox.txt"
  # Hook configs hold absolute paths into the template home.
  for f in "$box"/home/.copilot/hooks/*.json; do
    [ -e "$f" ] && perl -pi -e "s#\Q$WORK/homes/$v\E#$box/home#g" "$f"
  done
  (cd "$box/invoicer" && agent_env "$box/home" perl -e 'alarm shift; exec @ARGV' "$TIMEOUT" "$COPILOT" -p "$PROMPT" \
    --model "$MODEL" --reasoning-effort "$EFFORT" --allow-all-tools --no-ask-user --no-auto-update \
    --disable-builtin-mcps --excluded-tools session_store_sql --secret-env-vars COPILOT_GITHUB_TOKEN \
    --max-ai-credits "$CREDITS" --output-format json >"$dir/stdout.jsonl" 2>"$dir/stderr.txt") ||
    echo "exit $?" >>"$dir/stderr.txt"
  cp "$box"/home/.copilot/session-state/*/events.jsonl "$dir/events.jsonl" || echo "no events.jsonl" >>"$dir/stderr.txt"
  verify "$box/invoicer" >"$dir/verdict.json"
  if [ -e "$box/home/.copilot/hooks/rtk-rewrite.json" ]; then
    (cd "$box/invoicer" && agent_env "$box/home" rtk gain -f json >"$dir/rtk-gain.json" 2>/dev/null) || true
  fi
  mv "$box" "$dir/sandbox"
  echo "$v$2 $(cat "$dir/verdict.json")"
}

run() {
  local rep=${1:?usage: run.sh run <rep> [variants]} v
  shift
  for v in ${*:-a b c d e}; do run_one "$v" "$rep" & done
  wait
}

case ${1:-} in
setup | selfcheck) "$1" ;;
run) shift && run "$@" ;;
*) sed -n '2,5p' "$0" && exit 2 ;;
esac
