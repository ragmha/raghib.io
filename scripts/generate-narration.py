#!/usr/bin/env python3
import argparse
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/writing"
OUTPUT = ROOT / "public/audio"
VOICES = (("heart", "af_heart"), ("michael", "am_michael"))
# Hashes of the spoken text per output, so CI checkouts (fresh mtimes) skip current audio.
MANIFEST = OUTPUT / "narration.json"


def published_articles():
    for path in sorted(POSTS.glob("*.mdx")):
        source = path.read_text()
        if not re.search(r"^published:\s*false\s*$", source, re.MULTILINE):
            yield path, source


def narration_text(source):
    source = re.sub(r"\A---\s*\n.*?\n---\s*", "", source, count=1, flags=re.DOTALL)
    source = re.sub(r"(?ms)^[ \t]*(```|~~~)[^\n]*\n.*?^[ \t]*\1\s*$", "", source)
    source = re.sub(r"(?s)<!--.*?-->", "", source)
    source = re.sub(r"(?m)^\s*(?:import|export)\b.*$", "", source)
    # Figures contain visual diagrams and captions, which should stay visual.
    source = re.sub(r"(?is)<figure\b[^>]*>.*?</figure>", "", source)
    source = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", source)
    source = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", source)
    source = re.sub(r"<https?://[^>]+>|https?://\S+", "", source)
    source = re.sub(r"<[^>]+>", "", source)
    source = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", source)
    source = re.sub(r"(?m)^\s{0,3}(?:[-*+]|\d+[.)])\s+", "", source)
    source = re.sub(r"(?m)^\s{0,3}>\s?", "", source)
    source = re.sub(r"[`*_~|]", " ", source)
    source = html.unescape(source)
    source = re.sub(r"\s+([,.;:!?])", r"\1", source)
    paragraphs = (re.sub(r"\s+", " ", paragraph).strip() for paragraph in source.split("\n\n"))
    return "\n".join(paragraph for paragraph in paragraphs if paragraph)


def self_check():
    sample = """---
title: Example
---
# A heading

Read [this link](https://example.com) and `inline code`.

![A diagram with text that should not be read](diagram.svg)

<figure>
  <img alt="Diagram labels that should not be read" />
  <figcaption>Diagram caption that should not be read.</figcaption>
</figure>

```ts
not spoken
```
"""
    assert narration_text(sample) == "A heading\nRead this link and inline code."
    for fence in ("```", "~~~"):
        for indent in ("   ", "    "):
            sample = f"""1. Save the script.

{indent}{fence}js
{indent}const notSpoken = true
{indent}{fence}

{indent}Run it with `node`.
"""
            text = narration_text(sample)
            assert text == "Save the script.\nRun it with node.", text


def outputs():
    for path, source in published_articles():
        text = narration_text(source)
        if not text:
            raise RuntimeError(f"No article text found in {path}")
        for voice_name, voice_id in VOICES:
            suffix = "" if voice_name == "heart" else f"-{voice_id}"
            name = f"{path.stem}{suffix}"
            digest = hashlib.sha256(f"{voice_id}\n{text}".encode()).hexdigest()[:16]
            yield path, text, voice_name, voice_id, name, digest


def read_manifest():
    return json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}


def stale(manifest):
    return [
        output for output in outputs()
        if manifest.get(output[4]) != output[5] or not (OUTPUT / f"{output[4]}.mp3").exists()
    ]


def generate(force):
    import soundfile as sf
    import torch
    from kokoro import KPipeline

    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required; install it and rerun narration:generate")

    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipeline = KPipeline(lang_code="a", device=device)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    manifest = read_manifest()
    for path, text, voice_name, voice_id, name, digest in (list(outputs()) if force else stale(manifest)):
        target = OUTPUT / f"{name}.mp3"
        print(f"Generating narration: {path.stem} ({voice_name})")
        with tempfile.TemporaryDirectory() as temp_dir:
            wav = Path(temp_dir) / "article.wav"
            encoded = Path(temp_dir) / "article.mp3"
            with sf.SoundFile(wav, mode="w", samplerate=24000, channels=1) as output:
                for _, _, audio in pipeline(text, voice=voice_id, split_pattern=r"\n+"):
                    if hasattr(audio, "detach"):
                        audio = audio.detach().cpu().numpy()
                    output.write(audio)
            subprocess.run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(wav), "-codec:a", "libmp3lame",
                    "-b:a", "40k", "-ar", "24000", "-ac", "1", str(encoded),
                ],
                check=True,
            )
            if encoded.stat().st_size <= 1000:
                raise RuntimeError(f"Generated audio is unexpectedly small: {path.stem} ({voice_name})")
            encoded.replace(target)
        manifest[name] = digest
        MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate static Kokoro narration for published articles.")
    parser.add_argument("--force", action="store_true", help="Regenerate audio even when it is up to date.")
    parser.add_argument("--check", action="store_true", help="Run the text-cleaning self-check without loading Kokoro.")
    parser.add_argument("--stale", action="store_true", help="List outputs whose audio is missing or out of date, without loading Kokoro.")
    parser.add_argument("--text", metavar="DIR", help="Write each published article's spoken text to DIR/<slug>.txt, without loading Kokoro.")
    args = parser.parse_args()
    if args.check:
        self_check()
        print("Narration text check passed.")
    elif args.stale:
        for output in stale(read_manifest()):
            print(output[4])
    elif args.text:
        Path(args.text).mkdir(parents=True, exist_ok=True)
        for path, source in published_articles():
            (Path(args.text) / f"{path.stem}.txt").write_text(narration_text(source) + "\n")
    else:
        generate(args.force)
