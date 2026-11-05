#!/usr/bin/env python3
"""Print the Snapshot section of the fde-skills-demand SKILL.md.

Reads every role listed on forwarddeployed.fun plus its full job description,
then counts the postings whose description matches each skill pattern.
Stdlib only. Descriptions are cached in the system temp dir.

    python3 .github/skills/fde-skills-demand/scripts/fde_demand.py
"""
import collections
import datetime
import html
import json
import os
import re
import statistics
import sys
import tempfile
import urllib.request
from concurrent.futures import ThreadPoolExecutor

SITE = "https://www.forwarddeployed.fun"
CACHE = os.path.join(tempfile.gettempdir(), "fde-demand-cache")
LANGS = r"(?:python|java|rust|typescript|scala|kotlin|ruby|c\+\+|c#)"
SEP = r"(?:\s*[,/]\s*(?:(?:or|and)\s+)?|\s+(?:or|and)\s+)"

# ponytail: keyword patterns, not comprehension, so shares carry a few points
# of noise. Use an LLM extractor if a decision hinges on a small gap.
SKILLS = {
    "Customer": {
        "Communication": r"communicat",
        "Stakeholder & executive management": r"stakeholder|c-suite|c-level|(?<!account )executives?\b(?! order)",
        "Customer-facing": r"customer[- ]facing|client[- ]facing|work(?:ing)? (?:directly )?with customers",
        "Ambiguity & problem solving": r"ambigu|problem[- ]solv",
        "End-to-end ownership": r"ownership|end[- ]to[- ]end",
        "Pre-sales & POCs": r"pre-?sales|proofs? of concept|\bpocs?\b|\bpilots?\b",
        "Travel": r"\btravel",
    },
    "Build": {
        "APIs & integrations": r"\bapis?\b|integrations?\b",
        "Python": r"\bpython\b",
        "TypeScript": r"typescript",
        "JavaScript / Node": r"javascript|node\.?js",
        "SQL": r"\bsql\b",
        "Java": r"\bjava\b",
        "Go": rf"\bgolang\b|\bgo\b(?={SEP}{LANGS})|{LANGS}{SEP}go\b",
        "Rust": r"\brust\b",
        "C++": r"c\+\+",
        "React": r"\breact(?:\.js|js)?\b",
        "Full-stack": r"full[- ]stack",
        "Architecture & system design": r"solutions? architect|system design|architect(?:ing|ure)",
        "Data pipelines & ETL": r"data pipelines?|\betl\b|\belt\b",
    },
    "AI": {
        "LLMs & generative AI": r"\bllms?\b|large language models?|generative ai|\bgen ?ai\b|\b(?:chat)?gpt|\bclaude\b|foundation models?",
        "AI agents": r"\bagent(?:s|ic)\b|multi-agent",
        "RAG & retrieval": r"\brag\b|retrieval[- ]augmented|vector (?:db|database|search|store)s?|\bembeddings\b|embedding models?",
        "Evals": r"\bevals?\b|evaluation (?:frameworks?|harness|pipelines?|suites?)|(?:llm|model|ai) evaluations?",
        "Prompt engineering": r"prompt(?:ing| engineering| design)",
        "Fine-tuning": r"fine-?tun",
        "Machine learning": r"machine learning|\bml\b",
        "MCP": r"\bmcp\b|model context protocol",
    },
    "Infra": {
        "AWS": r"\baws\b|amazon web services",
        "GCP": r"\bgcp\b|google cloud",
        "Azure": r"\bazure\b",
        "Kubernetes": r"kubernetes|\bk8s\b",
        "Docker & containers": r"docker|container",
        "Terraform & IaC": r"terraform|infrastructure[- ]as[- ]code",
        "CI/CD": r"ci/cd|continuous (?:integration|delivery|deployment)",
        "Security clearance": r"clearance|ts/sci",
    },
}
GROUP = {skill: group for group, skills in SKILLS.items() for skill in skills}
YEARS = re.compile(
    r"(\d{1,2})(?:\+|\s*(?:-|–|to)\s*\d{1,2}\+?)\s*years"
    r"|(\d{1,2})\s*years?\W?\s*(?:of\s+)?(?:[\w/&,-]+\s+){0,5}?experience"
)
PAY = re.compile(r"\$\s?(\d{2,3})(?:,\d{3}(?:\.\d{2})?|k)\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3})(?:,\d{3}|k)")


def matches(text):
    return {skill for skill, group in GROUP.items() if re.search(SKILLS[group][skill], text)}


# The false positives these patterns were tuned against, plus the hits they must keep.
assert not matches(
    "executive order 11246 binds our account executives. embedding with the team. let's go, team."
)
assert matches("python, go and react. build ai agents with rag. ts/sci clearance. 25% travel.") == {
    "Python", "Go", "React", "AI agents", "RAG & retrieval", "Security clearance", "Travel"
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 fde-demand"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode()


def roles():
    # The listing ships as a Next.js flight payload: JSON strings pushed to self.__next_f.
    page = fetch(SITE + "/")
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"([^"\\]*(?:\\.[^"\\]*)*)"\]\)', page)
    payload = "".join(json.loads(f'"{chunk}"') for chunk in chunks)
    return json.JSONDecoder().raw_decode(payload, payload.index('"roles":') + 8)[0]


def describe(role):
    path = os.path.join(CACHE, role["href"].strip("/").replace("/", "_") + ".txt")
    if not os.path.exists(path):
        try:
            page = fetch(SITE + role["href"])
            body = page.split('<div class="description">', 1)[1].split("</article>", 1)[0]
        except Exception as err:  # one dead posting shouldn't sink the run
            print(f"skipped {role['href']}: {err}", file=sys.stderr)
            return ""
        with open(path, "w", encoding="utf-8") as f:
            f.write(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", body))))
    with open(path, encoding="utf-8") as f:
        return f.read().lower()


def first_number(rx, text):
    m = rx.search(text)
    return m and int(next(g for g in m.groups() if g))


def main():
    os.makedirs(CACHE, exist_ok=True)
    listed = roles()
    with ThreadPoolExecutor(8) as pool:
        texts = list(pool.map(describe, listed))
    parsed = [(role, text) for role, text in zip(listed, texts) if text]
    n = len(parsed)
    counts = collections.Counter(skill for _, text in parsed for skill in matches(text))
    ranked = sorted(GROUP, key=lambda skill: (-counts[skill], skill))
    years = [y for _, t in parsed if (y := first_number(YEARS, t)) and y <= 20]
    pay = [(int(m[1]) + int(m[2])) / 2 for _, t in parsed if (m := PAY.search(t)) and 50 <= int(m[1]) <= int(m[2]) <= 900]
    hirers = collections.Counter(role["company"] for role, _ in parsed).most_common(5)

    def share(k):
        return f"{k / n:.0%}"

    print(f"## Snapshot: {datetime.date.today()}\n")
    print(
        f"{n} of {len(listed)} roles parsed, from {len({r['company'] for r, _ in parsed})} companies on "
        f"[forwarddeployed.fun]({SITE}/). Share = postings whose full description matches the skill's pattern.\n"
    )
    print("| KPI | Value |\n| --- | --- |")
    print(f"| Remote-eligible | {share(sum(r['remote'] for r, _ in parsed))} |")
    print(f"| Based in the United States | {share(sum('United States' in r['places'] for r, _ in parsed))} |")
    print(f"| Median minimum experience | {statistics.median(years):g} years ({len(years)} postings state it) |")
    print(f"| Median posted pay, range midpoint | ${statistics.median(pay):.0f}k ({len(pay)} postings state a $ range) |")
    print(f"| Biggest hirers | {', '.join(f'{c} {k}' for c, k in hirers)} |")
    print("\n| # | Skill | Group | Share |\n| --- | --- | --- | --- |")
    for i, skill in enumerate(ranked[:20], 1):
        print(f"| {i} | {skill} | {GROUP[skill]} | {share(counts[skill])} |")
    print("\nAlso measured: " + ", ".join(f"{s} {share(counts[s])}" for s in ranked[20:]) + ".")


if __name__ == "__main__":
    main()
