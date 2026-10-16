# Token-diet experiment

This kit compares five Copilot CLI setups on the same seeded bug-fix task:

| Setup | What changes |
| --- | --- |
| `a` | Baseline |
| `b` | Six simple instructions in the user instructions file |
| `c` | caveman |
| `d` | rtk |
| `e` | caveman, rtk, and the six instructions |

Each setup runs five times in a fresh repository copy and home directory. The
runner verifies the committed changes against the original tests and an
additional hidden test. Raw logs stay under the ignored `.work/` directory;
the summarizer redacts paths and writes the publishable measurements to
`src/data/token-diet.json`.

## Requirements

- macOS or Linux, with Bash, Git, Node.js, npm/npx, and Bun
- GitHub Copilot CLI, authenticated with `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or
  `gh auth login`
- `uv` and Python 3.12
- rtk 1.0.1 executable at `scripts/token-diet/.work/tools/rtk`
- Network access for npx to install the pinned caveman revision

The script honors `COPILOT`, `NODE_BIN`, `MODEL`, `EFFORT`, `CREDITS`, and
`TIMEOUT` environment overrides. Defaults match the recorded experiment; change
them only when intentionally producing a different dataset.

## Run

From the repository root:

```sh
mkdir -p scripts/token-diet/.work/tools
cp /path/to/rtk scripts/token-diet/.work/tools/rtk
chmod +x scripts/token-diet/.work/tools/rtk

./scripts/token-diet/run.sh setup
./scripts/token-diet/run.sh selfcheck
./scripts/token-diet/run.sh run 1
./scripts/token-diet/run.sh run 2
./scripts/token-diet/run.sh run 3
./scripts/token-diet/run.sh run 4
./scripts/token-diet/run.sh run 5
bun scripts/token-diet/summarize.ts
```

`setup` creates the fixture and isolated configuration homes. `selfcheck` proves
the verifier catches each seeded bug and rejects invalid commit subjects. Each
`run <round>` launches all five setups concurrently. The summarizer requires all
25 run records and checks token totals, usage charges, and redaction before
writing the JSON file.

The public page is `/experiments/token-diet/`. Its animated lanes show each
setup's median-token run; the table and dot plot show all 25 runs. The published
JSON contains aggregate call metrics and short redacted tool labels, not raw
Copilot event logs, source paths, or credentials.

The experiment measures one task, one model, and five runs per setup. It is a
small demonstration, not a general benchmark; rerun it on representative tasks
before drawing broader conclusions.
