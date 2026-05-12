"""Apple Health export.zip → daily step totals (whitelist JSON to stdout).

Used by the gh-aw `health-backfill.md` workflow as a one-time seeding step.
The script is paranoid about Layer 2 isolation:

- Reads only `HKQuantityTypeIdentifierStepCount`.
- Aggregates to UTC calendar days (the iOS Shortcut sends local dates for
  daily ingest; backfill uses UTC consistently for historical data, which is
  fine because the whole-day totals dominate any TZ shift edge effects).
- Writes only `[ { "date": "YYYY-MM-DD", "steps": <int> }, ... ]` to stdout.
- Never echoes any raw record, source identifier, device id, or location.

Usage:
    uv run python scripts/parse-export.py /path/to/export.zip
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

from apple_health_parser.config.options import Flag
from apple_health_parser.utils.loader import Loader


MAX_DAILY_STEPS = 200_000


def parse_export(zip_path: Path) -> list[dict[str, int | str]]:
    loader = Loader(export_path=str(zip_path))
    parsed = loader.get_flag_records(flag=Flag.HKQuantityTypeIdentifierStepCount)
    df = parsed.records  # pandas DataFrame

    # The parser exposes `start` / `end` as datetimes and `value` as the count.
    # Group by calendar date of the START timestamp; sum the values.
    if df.empty:
        return []

    daily: dict[str, float] = defaultdict(float)
    for start, value in zip(df["start"], df["value"], strict=False):
        date_str = start.strftime("%Y-%m-%d")
        try:
            daily[date_str] += float(value)
        except (TypeError, ValueError):
            continue

    out: list[dict[str, int | str]] = []
    for date_str in sorted(daily):
        steps = int(round(daily[date_str]))
        if steps < 0 or steps > MAX_DAILY_STEPS:
            # Layer 2: drop implausible values rather than emit them.
            continue
        out.append({"date": date_str, "steps": steps})
    return out


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: parse-export.py <path/to/export.zip>", file=sys.stderr)
        return 2
    zip_path = Path(sys.argv[1])
    if not zip_path.exists():
        print(f"parse-export: file not found: {zip_path}", file=sys.stderr)
        return 2
    days = parse_export(zip_path)
    json.dump(days, sys.stdout)
    print(f"parse-export: extracted {len(days)} days", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
