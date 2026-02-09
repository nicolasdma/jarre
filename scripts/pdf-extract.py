#!/usr/bin/env python3
"""
PDF → Markdown extraction using Marker.

Usage:
  python scripts/pdf-extract.py <pdf_path> [--output-dir scripts/output]

Requirements:
  pip install marker-pdf

Example:
  python scripts/pdf-extract.py ~/Books/ddia.pdf --output-dir scripts/output
"""

import argparse
import subprocess
import sys
from pathlib import Path


def extract_pdf(pdf_path: str, output_dir: str) -> Path:
    """Extract PDF to Markdown using Marker CLI."""
    pdf = Path(pdf_path)
    if not pdf.exists():
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    print(f"Extracting {pdf.name} → {out}/")
    print("This may take a few minutes...")

    cmd = [
        "marker_single",
        str(pdf),
        str(out),
        "--max_pages", "50",  # DDIA Ch1 is ~30 pages
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(result.stdout)
    except FileNotFoundError:
        print("Error: 'marker_single' not found. Install with: pip install marker-pdf")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running marker: {e.stderr}")
        sys.exit(1)

    # Find the generated markdown file
    md_files = list(out.rglob("*.md"))
    if not md_files:
        print("Error: No markdown file generated")
        sys.exit(1)

    output_file = md_files[0]
    print(f"✓ Extracted to: {output_file}")
    return output_file


def extract_chapter(md_path: Path, chapter_num: int, output_dir: str) -> Path:
    """Extract a single chapter from the full markdown."""
    content = md_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    chapter_start = None
    chapter_end = None
    chapter_title = ""

    for i, line in enumerate(lines):
        # Look for chapter heading patterns
        if line.strip().startswith("#") and f"chapter {chapter_num}" in line.lower():
            chapter_start = i
            chapter_title = line.strip().lstrip("#").strip()
        elif chapter_start is not None and line.strip().startswith("# ") and i > chapter_start + 5:
            # Next chapter starts
            chapter_end = i
            break

    if chapter_start is None:
        # Try alternative patterns
        for i, line in enumerate(lines):
            stripped = line.strip().lower()
            if stripped.startswith("#") and any(
                pat in stripped
                for pat in [
                    f"chapter {chapter_num}",
                    f"ch{chapter_num}",
                    f"ch.{chapter_num}",
                ]
            ):
                chapter_start = i
                chapter_title = line.strip().lstrip("#").strip()
                break

    if chapter_start is None:
        print(f"Error: Could not find Chapter {chapter_num} in {md_path}")
        sys.exit(1)

    chapter_lines = lines[chapter_start : chapter_end if chapter_end else len(lines)]
    chapter_content = "\n".join(chapter_lines)

    out = Path(output_dir)
    output_file = out / f"chapter-{chapter_num:02d}-raw.md"
    output_file.write_text(chapter_content, encoding="utf-8")

    print(f"✓ Chapter {chapter_num} ({chapter_title}): {len(chapter_lines)} lines → {output_file}")
    return output_file


def main():
    parser = argparse.ArgumentParser(description="Extract PDF to Markdown using Marker")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    parser.add_argument(
        "--chapter",
        type=int,
        help="Extract a specific chapter number (requires prior full extraction)",
    )
    args = parser.parse_args()

    if args.chapter:
        # Extract specific chapter from already-extracted markdown
        out = Path(args.output_dir)
        md_files = list(out.rglob("*.md"))
        if not md_files:
            print("No markdown found. Run without --chapter first.")
            sys.exit(1)
        extract_chapter(md_files[0], args.chapter, args.output_dir)
    else:
        md_path = extract_pdf(args.pdf_path, args.output_dir)
        print(f"\nNext: python scripts/concept-segment.py {md_path} --chapter 1")


if __name__ == "__main__":
    main()
