#!/usr/bin/env python3
"""
Complete pipeline for one DDIA chapter: extract → translate → deduplicate → save.

Usage:
  python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 2
  python scripts/process-ddia-chapter.py scripts/output/ddia.pdf --chapter 2 --skip-extract  # reuse existing sections JSON

Output:
  scripts/output/chapter-{NN}-translated.json (cleaned, ready to seed)

Requires:
  pip install pymupdf4llm openai python-dotenv
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

# Import our pipeline modules (hyphenated filenames need importlib)
import importlib.util

def _import_module(name: str, file_path: str):
    spec = importlib.util.spec_from_file_location(name, file_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

_scripts_dir = Path(__file__).parent
_extract_mod = _import_module("extract_chapter", str(_scripts_dir / "extract-chapter.py"))
_translate_mod = _import_module("translate_chapter", str(_scripts_dir / "translate-chapter.py"))

extract_chapter = _extract_mod.extract_chapter
split_into_paragraphs = _translate_mod.split_into_paragraphs
translate_paragraph = _translate_mod.translate_paragraph
verify_length_ratio = _translate_mod.verify_length_ratio

try:
    from dotenv import load_dotenv
    from openai import OpenAI
    import os
except ImportError:
    print("Install: pip install openai python-dotenv pymupdf4llm")
    sys.exit(1)

load_dotenv(".env.local")


def deduplicate_paragraphs(content: str) -> tuple[str, int]:
    """Remove duplicate paragraphs (PDF page boundary artifacts)."""
    paras = content.split("\n\n")
    cleaned = []
    seen_keys = {}
    removed = 0

    for p in paras:
        stripped = p.strip()
        if not stripped:
            continue

        key = stripped[:80]

        if key in seen_keys:
            prev_idx = seen_keys[key]
            prev_text = cleaned[prev_idx].strip()
            if prev_text == stripped or (len(stripped) > 30 and stripped[:80] == prev_text[:80]):
                removed += 1
                continue

        seen_keys[key] = len(cleaned)
        cleaned.append(p)

    return "\n\n".join(cleaned), removed


def clean_artifacts(content: str) -> tuple[str, int]:
    """Remove page headers, separators, and prompt leaks."""
    paras = content.split("\n\n")
    cleaned = []
    removed = 0

    for p in paras:
        stripped = p.strip()

        # Page header artifacts: **Title** **|** **123**
        if re.match(r"^\*\*.*\*\*\s*\*\*\|\*\*\s*\*\*\d+\*\*", stripped):
            removed += 1
            continue

        # Orphan --- separators (translation context artifacts)
        if stripped == "---":
            removed += 1
            continue

        # Translation prompt leaks
        if stripped.startswith("[TRADUCIR este párrafo"):
            removed += 1
            continue

        # Standalone page numbers
        if re.match(r"^\*\*\d+\*\*$", stripped):
            removed += 1
            continue

        cleaned.append(p)

    return "\n\n".join(cleaned), removed


def translate_section(client: OpenAI, section: dict, idx: int, total: int) -> dict:
    """Translate a single section paragraph by paragraph."""
    concept_id = section["concept_id"]
    original = section["content_original"]
    title = section.get("section_title", concept_id)

    paragraphs = split_into_paragraphs(original)
    en_words = len(original.split())
    print(f"\n  [{idx+1}/{total}] {concept_id}: {len(paragraphs)} paragraphs, {en_words} words")

    translated_paragraphs = []
    total_tokens = 0
    prev_translation = None
    warnings = []

    for i, para in enumerate(paragraphs):
        para_words = len(para.split())
        print(f"    Paragraph {i+1}/{len(paragraphs)} ({para_words} words)...", end="", flush=True)

        translated, tokens = translate_paragraph(client, para, prev_translation, title)
        total_tokens += tokens

        ratio, status = verify_length_ratio(para, translated)
        if status != "ok":
            warnings.append(f"  Para {i+1}: ratio={ratio:.2f} — {status}")
            print(f" ⚠ ratio={ratio:.2f}")
        else:
            print(f" ✓ ratio={ratio:.2f}")

        translated_paragraphs.append(translated)
        prev_translation = translated

        # Rate limit courtesy
        if i < len(paragraphs) - 1:
            time.sleep(1)

    content_markdown = "\n\n".join(translated_paragraphs)

    # Post-process: deduplicate and clean
    content_markdown, dedup_count = deduplicate_paragraphs(content_markdown)
    content_markdown, artifact_count = clean_artifacts(content_markdown)
    if dedup_count or artifact_count:
        print(f"    Post-process: removed {dedup_count} duplicates, {artifact_count} artifacts")

    es_words = len(content_markdown.split())
    ratio = es_words / en_words if en_words > 0 else 1.0
    print(f"    Final: {en_words} EN → {es_words} ES (ratio={ratio:.2f})")

    if warnings:
        print(f"    {len(warnings)} paragraphs with ratio warnings")

    return {
        "resource_id": section["resource_id"],
        "concept_id": section["concept_id"],
        "section_title": section.get("section_title", concept_id),
        "sort_order": section["sort_order"],
        "content_markdown": content_markdown,
        "content_original": original,
    }


def main():
    parser = argparse.ArgumentParser(description="Full pipeline: extract → translate → clean for one DDIA chapter")
    parser.add_argument("pdf_path", help="Path to DDIA PDF")
    parser.add_argument("--chapter", type=int, required=True, help="Chapter number")
    parser.add_argument("--skip-extract", action="store_true", help="Reuse existing sections JSON")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    sections_file = out_dir / f"chapter-{args.chapter:02d}-sections.json"
    translated_file = out_dir / f"chapter-{args.chapter:02d}-translated.json"

    # Step 1: Extract
    if args.skip_extract and sections_file.exists():
        print(f"Reusing existing {sections_file}")
        sections = json.loads(sections_file.read_text(encoding="utf-8"))
    else:
        print(f"{'='*60}")
        print(f"STEP 1: EXTRACT Chapter {args.chapter}")
        print(f"{'='*60}")
        sections = extract_chapter(args.pdf_path, args.chapter)
        sections_file.write_text(json.dumps(sections, indent=2, ensure_ascii=False), encoding="utf-8")

    # Step 2: Translate
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY not set in .env.local")
        sys.exit(1)

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    total_en = sum(len(s["content_original"].split()) for s in sections)
    print(f"\n{'='*60}")
    print(f"STEP 2: TRANSLATE Chapter {args.chapter} ({total_en} words, {len(sections)} sections)")
    print(f"{'='*60}")

    translated = []
    total_tokens = 0

    for i, section in enumerate(sections):
        result = translate_section(client, section, i, len(sections))
        translated.append(result)

    # Step 3: Save
    translated_file.write_text(json.dumps(translated, indent=2, ensure_ascii=False), encoding="utf-8")

    # Summary
    total_es = sum(len(s["content_markdown"].split()) for s in translated)
    ratio = total_es / total_en if total_en > 0 else 0
    print(f"\n{'='*60}")
    print(f"CHAPTER {args.chapter} COMPLETE")
    print(f"{'='*60}")
    print(f"  {total_en} EN → {total_es} ES (ratio={ratio:.2f})")
    print(f"  Sections: {len(translated)}")
    print(f"  Output: {translated_file}")
    print(f"\nSeed with: npx tsx scripts/seed-sections.ts --from-file {translated_file}")


if __name__ == "__main__":
    main()
