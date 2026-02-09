#!/usr/bin/env python3
"""
Extract a single chapter from DDIA PDF with clean markdown output.

Uses pymupdf4llm for extraction, then cleans page headers/footers
and segments into concept-level sections based on the actual TOC.

Usage:
  python scripts/extract-chapter.py scripts/output/ddia.pdf --chapter 1

Output:
  scripts/output/chapter-01-sections.json (ready for translation)
"""

import json
import re
import sys
from pathlib import Path

try:
    import pymupdf
    import pymupdf4llm
except ImportError:
    print("Install: pip install --break-system-packages pymupdf4llm")
    sys.exit(1)


# ============================================================================
# Chapter definitions: page ranges and concept sections from TOC
# Page numbers are 1-indexed (as in the TOC), converted to 0-indexed for pymupdf
# ============================================================================

CHAPTERS = {
    1: {
        "title": "Reliable, Scalable, and Maintainable Applications",
        "start_page": 25,
        "end_page": 48,
        "sections": [
            {
                "concept_id": "thinking-about-data-systems",
                "title": "Thinking About Data Systems",
                "heading_pattern": r"Thinking About Data Systems",
                "include_in_concept": "reliability",  # merge into reliability
            },
            {
                "concept_id": "reliability",
                "title": "Fiabilidad",
                "heading_pattern": r"^Reliability$",
                "subsections": [
                    "Hardware Faults",
                    "Software Errors",
                    "Human Errors",
                    "How Important Is Reliability?",
                ],
            },
            {
                "concept_id": "scalability",
                "title": "Escalabilidad",
                "heading_pattern": r"^Scalability$",
                "subsections": [
                    "Describing Load",
                    "Describing Performance",
                    "Approaches for Coping with Load",
                ],
            },
            {
                "concept_id": "maintainability",
                "title": "Mantenibilidad",
                "heading_pattern": r"^Maintainability$",
                "subsections": [
                    "Operability: Making Life Easy for Operations",
                    "Simplicity: Managing Complexity",
                    "Evolvability: Making Change Easy",
                ],
            },
            {
                "concept_id": "chapter-summary",
                "title": "Summary",
                "heading_pattern": r"^Summary$",
                "include_in_concept": None,  # skip summary, or merge
            },
        ],
    },
}


def clean_page_artifacts(text: str) -> str:
    """Remove page headers, footers, and page numbers from extracted text."""
    lines = text.split("\n")
    cleaned = []

    for line in lines:
        stripped = line.strip()

        # Skip page number patterns like "**8** **|** **Chapter 1: ...**"
        if re.match(r"^\*\*\d+\*\*\s*\*\*\|\*\*", stripped):
            continue

        # Skip standalone page numbers
        if re.match(r"^\*\*\d+\*\*$", stripped):
            continue

        # Skip "Reliability | 7" style headers
        if re.match(r"^\*\*\w+\*\*\s*\*\*\|\*\*\s*\*\*\d+\*\*", stripped):
            continue

        # Skip chapter header repetitions
        if re.match(
            r"^\*\*Chapter \d+:.*\*\*$", stripped
        ):
            continue

        # Skip footnote markers like "i. Defined in..."
        # Keep them — they're part of the text

        cleaned.append(line)

    # Collapse triple+ blank lines into double
    result = "\n".join(cleaned)
    result = re.sub(r"\n{4,}", "\n\n\n", result)

    return result


def find_section_boundaries(text: str, sections: list[dict]) -> list[dict]:
    """Find where each section starts in the text using heading patterns."""
    lines = text.split("\n")
    boundaries = []

    for section in sections:
        pattern = section["heading_pattern"]
        found = False

        for i, line in enumerate(lines):
            # Match bold headings: **Reliability** or plain headings
            clean_line = line.strip().replace("**", "").strip()
            if re.match(pattern, clean_line, re.IGNORECASE):
                boundaries.append(
                    {
                        "concept_id": section["concept_id"],
                        "title": section["title"],
                        "line_start": i,
                        "include_in_concept": section.get("include_in_concept"),
                    }
                )
                found = True
                break

        if not found:
            print(f"  Warning: Could not find section '{pattern}' in text")

    # Sort by line number
    boundaries.sort(key=lambda b: b["line_start"])

    # Set end boundaries
    for i, b in enumerate(boundaries):
        if i < len(boundaries) - 1:
            b["line_end"] = boundaries[i + 1]["line_start"]
        else:
            b["line_end"] = len(lines)

    return boundaries


def extract_chapter(pdf_path: str, chapter_num: int) -> list[dict]:
    """Extract and segment a chapter into concept-level sections."""
    chapter = CHAPTERS.get(chapter_num)
    if not chapter:
        print(f"Error: Chapter {chapter_num} not defined")
        sys.exit(1)

    print(f"Extracting Chapter {chapter_num}: {chapter['title']}")
    print(f"  Pages {chapter['start_page']}-{chapter['end_page']}")

    # Extract with pymupdf4llm (0-indexed pages)
    pages = list(range(chapter["start_page"] - 1, chapter["end_page"]))
    md = pymupdf4llm.to_markdown(pdf_path, pages=pages)

    print(f"  Raw extraction: {len(md.split())} words, {len(md)} chars")

    # Clean artifacts
    md = clean_page_artifacts(md)
    print(f"  After cleaning: {len(md.split())} words")

    # Find section boundaries
    boundaries = find_section_boundaries(md, chapter["sections"])
    print(f"  Found {len(boundaries)} section boundaries")

    # Extract section content
    lines = md.split("\n")
    concept_sections = {}

    # Build a map from concept_id to its canonical title
    concept_titles = {}
    for section in chapter["sections"]:
        cid = section["concept_id"]
        if cid not in concept_titles:
            concept_titles[cid] = section["title"]

    for b in boundaries:
        content = "\n".join(lines[b["line_start"] : b["line_end"]]).strip()

        # Merge sections that belong to another concept
        target_id = b.get("include_in_concept") or b["concept_id"]
        if target_id is None:
            continue  # skip (e.g., references)

        if target_id in concept_sections:
            concept_sections[target_id]["content_original"] += "\n\n" + content
        else:
            concept_sections[target_id] = {
                "concept_id": target_id,
                "title": concept_titles.get(target_id, b["title"]),
                "content_original": content,
            }

    # Build output with sort order
    # Use the order defined in CHAPTERS
    concept_order = []
    seen = set()
    for section in chapter["sections"]:
        target = section.get("include_in_concept") or section["concept_id"]
        if target and target not in seen and target in concept_sections:
            seen.add(target)
            concept_order.append(target)

    output = []
    for i, cid in enumerate(concept_order):
        sec = concept_sections[cid]
        word_count = len(sec["content_original"].split())
        output.append(
            {
                "resource_id": f"ddia-ch{chapter_num}",
                "concept_id": sec["concept_id"],
                "section_title": sec["title"],
                "sort_order": i,
                "content_original": sec["content_original"],
                "word_count": word_count,
            }
        )
        print(f"  [{i}] {sec['concept_id']}: {word_count} words")

    total_words = sum(s["word_count"] for s in output)
    print(f"\n  Total: {total_words} words across {len(output)} sections")

    return output


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Extract DDIA chapter into concept sections")
    parser.add_argument("pdf_path", help="Path to DDIA PDF")
    parser.add_argument("--chapter", type=int, required=True, help="Chapter number")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    args = parser.parse_args()

    sections = extract_chapter(args.pdf_path, args.chapter)

    # Save
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_file = out_dir / f"chapter-{args.chapter:02d}-sections.json"
    output_file.write_text(json.dumps(sections, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Saved to {output_file}")
    print(f"Next: python scripts/translate-chapter.py {output_file}")


if __name__ == "__main__":
    main()
