#!/usr/bin/env python3
"""
Segment a chapter's markdown into concept-level sections.

Strategy:
  1. Split on ## headings (structural)
  2. Map headings to known concept IDs via fuzzy matching
  3. For ambiguous sections, use DeepSeek V3 for classification

Usage:
  python scripts/concept-segment.py scripts/output/chapter-01-raw.md --chapter 1

Output:
  scripts/output/chapter-01-sections.json

Requirements:
  pip install openai python-dotenv
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError:
    print("Install dependencies: pip install openai python-dotenv")
    sys.exit(1)

load_dotenv(".env.local")

# Concept mapping per chapter (Jarre concept IDs)
CHAPTER_CONCEPTS: dict[int, dict[str, list[str]]] = {
    1: {
        "reliability": [
            "reliability",
            "reliable",
            "fault",
            "failure",
            "hardware fault",
            "software error",
            "human error",
        ],
        "scalability": [
            "scalability",
            "scalable",
            "load",
            "performance",
            "throughput",
            "latency",
            "percentile",
            "tail latency",
            "fan-out",
        ],
        "maintainability": [
            "maintainability",
            "maintainable",
            "operability",
            "simplicity",
            "evolvability",
            "abstraction",
        ],
    },
}


def split_on_headings(content: str) -> list[dict]:
    """Split markdown content on ## headings, preserving hierarchy."""
    sections: list[dict] = []
    current_heading = "Introduction"
    current_lines: list[str] = []

    for line in content.split("\n"):
        if re.match(r"^##\s+", line):
            if current_lines:
                sections.append(
                    {
                        "heading": current_heading,
                        "content": "\n".join(current_lines).strip(),
                    }
                )
            current_heading = line.lstrip("#").strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        sections.append(
            {
                "heading": current_heading,
                "content": "\n".join(current_lines).strip(),
            }
        )

    return sections


def match_concept(heading: str, concepts: dict[str, list[str]]) -> str | None:
    """Fuzzy-match a heading to a concept ID using keyword lists."""
    heading_lower = heading.lower()

    for concept_id, keywords in concepts.items():
        for keyword in keywords:
            if keyword in heading_lower:
                return concept_id

    return None


def classify_with_llm(
    sections: list[dict], concept_ids: list[str], chapter_num: int
) -> list[dict]:
    """Use DeepSeek V3 to classify ambiguous sections."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("Warning: DEEPSEEK_API_KEY not set. Skipping LLM classification.")
        return sections

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    unclassified = [s for s in sections if s.get("concept_id") is None]
    if not unclassified:
        return sections

    # Build context for LLM
    section_texts = []
    for i, s in enumerate(unclassified):
        preview = s["content"][:500]
        section_texts.append(f"[Section {i}] {s['heading']}\n{preview}")

    prompt = f"""Classify each section into ONE of these concept categories: {json.dumps(concept_ids)}

These are sections from DDIA Chapter {chapter_num}. For each section, respond with a JSON array:
[{{"section_index": 0, "concept_id": "reliability", "confidence": 0.9}}, ...]

Only use concept IDs from the list above. If a section doesn't fit any concept, use the most relevant one.

Sections:
{chr(10).join(section_texts)}"""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "You classify text sections into predefined categories. Respond only with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        result = json.loads(content)
        classifications = result if isinstance(result, list) else result.get("classifications", [])

        for c in classifications:
            idx = c.get("section_index")
            cid = c.get("concept_id")
            conf = c.get("confidence", 0.5)
            if idx is not None and cid in concept_ids:
                unclassified[idx]["concept_id"] = cid
                unclassified[idx]["confidence"] = conf

        print(f"  LLM classified {len(classifications)} sections")

    except Exception as e:
        print(f"  Warning: LLM classification failed: {e}")

    return sections


def segment_chapter(md_path: str, chapter_num: int, output_dir: str) -> Path:
    """Segment a chapter markdown into concept-level sections."""
    content = Path(md_path).read_text(encoding="utf-8")
    concepts = CHAPTER_CONCEPTS.get(chapter_num)

    if not concepts:
        print(f"Error: No concept mapping defined for chapter {chapter_num}")
        print(f"Add it to CHAPTER_CONCEPTS in this script.")
        sys.exit(1)

    concept_ids = list(concepts.keys())
    print(f"Chapter {chapter_num}: segmenting into {concept_ids}")

    # Phase 1: structural split
    sections = split_on_headings(content)
    print(f"  Found {len(sections)} heading-based sections")

    # Phase 2: match headings to concepts
    for section in sections:
        concept_id = match_concept(section["heading"], concepts)
        section["concept_id"] = concept_id
        section["confidence"] = 1.0 if concept_id else None

    matched = sum(1 for s in sections if s["concept_id"])
    print(f"  Matched {matched}/{len(sections)} sections via keywords")

    # Phase 3: LLM for unmatched
    if matched < len(sections):
        sections = classify_with_llm(sections, concept_ids, chapter_num)

    # Assign any remaining unmatched to nearest concept
    last_concept = concept_ids[0]
    for section in sections:
        if section["concept_id"] is None:
            section["concept_id"] = last_concept
            section["confidence"] = 0.3
        else:
            last_concept = section["concept_id"]

    # Group by concept and build output
    output_sections = []
    sort_order = 0
    for concept_id in concept_ids:
        concept_sections = [s for s in sections if s["concept_id"] == concept_id]
        if not concept_sections:
            continue

        merged_content = "\n\n".join(s["content"] for s in concept_sections)
        avg_confidence = sum(s.get("confidence", 0.5) for s in concept_sections) / len(
            concept_sections
        )

        output_sections.append(
            {
                "concept_id": concept_id,
                "section_title": concept_id.replace("-", " ").title(),
                "sort_order": sort_order,
                "content_original": merged_content,
                "segmentation_confidence": round(avg_confidence, 2),
                "heading_count": len(concept_sections),
                "char_count": len(merged_content),
            }
        )
        sort_order += 1

    # Save output
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    output_file = out / f"chapter-{chapter_num:02d}-sections.json"
    output_file.write_text(json.dumps(output_sections, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Segmented into {len(output_sections)} concept sections → {output_file}")
    for s in output_sections:
        print(f"  {s['concept_id']}: {s['char_count']} chars, confidence={s['segmentation_confidence']}")

    return output_file


def main():
    parser = argparse.ArgumentParser(description="Segment chapter markdown into concept sections")
    parser.add_argument("md_path", help="Path to chapter markdown file")
    parser.add_argument("--chapter", type=int, required=True, help="Chapter number")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    args = parser.parse_args()

    segment_chapter(args.md_path, args.chapter, args.output_dir)
    print(f"\nNext: python scripts/translate-sections.py scripts/output/chapter-{args.chapter:02d}-sections.json")


if __name__ == "__main__":
    main()
