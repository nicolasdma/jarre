#!/usr/bin/env python3
"""
Ingest an arXiv paper: download PDF, extract text, segment by sections, save JSON.

Downloads the paper PDF via the arxiv library, extracts markdown text with
pymupdf4llm, detects section headings (numbered and unnumbered), and outputs
a JSON file matching the resource_sections format used by seed-sections.ts.

Usage:
  python scripts/ingest-arxiv.py 2005.11401
  python scripts/ingest-arxiv.py 2005.11401 --concept-id rag-basics
  python scripts/ingest-arxiv.py 2005.11401 --translate

Output:
  scripts/output/arxiv-2005.11401-sections.json

Requires:
  pip install arxiv pymupdf4llm
  (for --translate: pip install openai python-dotenv)
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

try:
    import arxiv
except ImportError:
    print("Install: pip install --break-system-packages arxiv")
    sys.exit(1)

try:
    import pymupdf4llm
except ImportError:
    print("Install: pip install --break-system-packages pymupdf4llm")
    sys.exit(1)


# ============================================================================
# Section heading patterns for research papers
# ============================================================================

# Known section names for unnumbered heading detection.
# Includes content sections AND skip sections so all headings are detected
# as boundaries (skip sections are filtered later).
KNOWN_SECTIONS = (
    r"Abstract|Introduction|Related Work|Background|"
    r"Methodology|Method|Methods|Approach|"
    r"Model|Architecture|Framework|System|"
    r"Experiments?|Results?|Evaluation|Analysis|Discussion|"
    r"Conclusion|Conclusions|Summary|"
    r"Limitations|Future Work|Broader Impact|"
    # Skip sections (must also be detected as headings to act as boundaries)
    r"Acknowledgments?|Acknowledgements?|"
    r"References|Bibliography|"
    r"Appendix|Appendices|Supplementary|"
    r"Broader Impact Statement|Ethics Statement"
)

# Numbered heading on the normalized (bold-stripped) line
# Matches: "1 Introduction", "2. Related Work", "3.1 Models"
NUMBERED_HEADING_RE = re.compile(
    r"^(\d+\.?\d*\.?)\s+(.+)$"
)

# Unnumbered heading on the normalized (bold-stripped) line
UNNUMBERED_HEADING_RE = re.compile(
    rf"^({KNOWN_SECTIONS})$",
    re.IGNORECASE,
)

# Sections to skip entirely (references, appendix, acknowledgments, etc.)
SKIP_SECTIONS = re.compile(
    r"^(References|Bibliography|"
    r"Appendix|Appendices|Supplementary|"
    r"Acknowledgments?|Acknowledgements?|"
    r"Broader Impact Statement|Ethics Statement)$",
    re.IGNORECASE,
)


def download_paper(paper_id: str, output_dir: Path) -> tuple[str, Path]:
    """Download an arXiv paper PDF. Returns (paper_title, pdf_path)."""
    print(f"Searching arXiv for paper: {paper_id}")

    client = arxiv.Client()
    search = arxiv.Search(id_list=[paper_id])

    try:
        result = next(client.results(search))
    except StopIteration:
        print(f"Error: Paper '{paper_id}' not found on arXiv.")
        sys.exit(1)

    print(f"  Title: {result.title}")
    print(f"  Authors: {', '.join(a.name for a in result.authors[:5])}")
    print(f"  Published: {result.published.strftime('%Y-%m-%d')}")
    print(f"  PDF URL: {result.pdf_url}")

    output_dir.mkdir(parents=True, exist_ok=True)
    safe_id = paper_id.replace("/", "-")
    pdf_filename = f"arxiv-{safe_id}.pdf"
    pdf_path = output_dir / pdf_filename

    if pdf_path.exists():
        print(f"  PDF already exists: {pdf_path}")
        return result.title, pdf_path

    print(f"  Downloading PDF...")
    max_retries = 2
    for attempt in range(max_retries):
        try:
            result.download_pdf(dirpath=str(output_dir), filename=pdf_filename)
            print(f"  Saved to: {pdf_path}")
            return result.title, pdf_path
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"  Download failed (attempt {attempt + 1}): {e}")
                print(f"  Retrying in 3 seconds...")
                time.sleep(3)
            else:
                print(f"Error: Failed to download PDF after {max_retries} attempts: {e}")
                sys.exit(1)

    # Unreachable, but satisfies type checker
    sys.exit(1)


def extract_text(pdf_path: Path) -> str:
    """Extract markdown text from PDF using pymupdf4llm."""
    print(f"\nExtracting text from {pdf_path.name}...")
    md = pymupdf4llm.to_markdown(str(pdf_path))
    word_count = len(md.split())
    print(f"  Raw extraction: {word_count} words, {len(md)} chars")

    if word_count < 50:
        print("Error: Extraction produced almost no text. PDF may be image-only.")
        sys.exit(1)

    return md


def clean_page_artifacts(text: str) -> str:
    """Remove page headers, footers, page numbers, and excessive blank lines."""
    lines = text.split("\n")
    cleaned = []

    for line in lines:
        stripped = line.strip()

        # Skip standalone page numbers (bold or plain)
        if re.match(r"^\*?\*?\d+\*?\*?$", stripped):
            continue

        # Skip lines that look like "Author et al. | Page N" header/footer
        if re.match(r"^.{0,60}\|\s*\d+\s*$", stripped):
            continue

        # Skip arXiv identifier lines repeated as headers
        if re.match(r"^arXiv:\d{4}\.\d{4,5}", stripped):
            continue

        cleaned.append(line)

    result = "\n".join(cleaned)
    # Collapse 4+ blank lines into 2
    result = re.sub(r"\n{4,}", "\n\n\n", result)

    return result


def normalize_heading_line(line: str) -> str:
    """Strip markdown bold markers and heading prefixes to get plain text.

    Handles formats like:
      **1** **Introduction**        -> "1 Introduction"
      **1 Introduction**            -> "1 Introduction"
      ## 1 Introduction             -> "1 Introduction"
      ## **1** **Introduction**     -> "1 Introduction"
      **Abstract**                  -> "Abstract"
    """
    s = line.strip()
    # Remove markdown heading prefix (## or ###)
    s = re.sub(r"^#{1,3}\s*", "", s)
    # Remove all bold markers
    s = s.replace("**", "")
    # Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()
    return s


def is_bold_line(line: str) -> bool:
    """Check if the line is primarily formatted as bold text.

    A heading must be bold (**...**) or a markdown heading (## ...).
    This prevents matching normal paragraph text.
    """
    stripped = line.strip()
    if stripped.startswith("#"):
        return True
    # Must start with ** and contain mostly bold content
    if stripped.startswith("**"):
        # Count bold markers — headings typically have at least 2 opening **
        bold_count = stripped.count("**")
        return bold_count >= 2
    return False


def detect_heading(line: str) -> tuple[str, str] | None:
    """Detect if a line is a section heading.

    Returns (section_number_or_empty, heading_text) or None.
    Only matches lines that are bold-formatted or markdown headings.
    """
    stripped = line.strip()
    if not stripped:
        return None

    # Must be a bold line or markdown heading — skip plain text
    if not is_bold_line(stripped):
        return None

    # Normalize: strip bold markers, heading prefixes, collapse whitespace
    normalized = normalize_heading_line(stripped)
    if not normalized:
        return None

    # Try numbered heading: "1 Introduction", "2. Related Work"
    m = NUMBERED_HEADING_RE.match(normalized)
    if m:
        return m.group(1).rstrip("."), m.group(2).strip()

    # Try unnumbered heading: "Abstract", "Conclusion", etc.
    m = UNNUMBERED_HEADING_RE.match(normalized)
    if m:
        return "", m.group(1).strip()

    return None


def segment_sections(text: str) -> list[dict]:
    """Split text into sections based on detected headings.

    Returns list of {section_title, content, sort_order}.
    If no headings are found, returns the entire text as a single section.
    """
    lines = text.split("\n")
    headings: list[dict] = []

    for i, line in enumerate(lines):
        result = detect_heading(line)
        if result is None:
            continue

        num, title = result

        # Skip references and appendix sections
        if SKIP_SECTIONS.match(title):
            headings.append({
                "line": i,
                "number": num,
                "title": title,
                "skip": True,
            })
            continue

        headings.append({
            "line": i,
            "number": num,
            "title": title,
            "skip": False,
        })

    # Filter to only top-level sections (avoid subsections like 3.1, 3.2)
    # Keep: single numbers (1, 2, 3) and unnumbered headings
    # Also keep subsections but they'll be merged into parent
    top_level = []
    for h in headings:
        num = h["number"]
        # Unnumbered or single-digit numbered = top-level
        if num == "" or re.match(r"^\d+$", num):
            top_level.append(h)

    if not top_level:
        # No headings detected — return entire text as one section
        print("  Warning: No section headings detected. Treating entire paper as one section.")
        word_count = len(text.split())
        return [{
            "section_title": "Full Paper",
            "content": text.strip(),
            "sort_order": 0,
            "word_count": word_count,
        }]

    # Build sections from heading boundaries
    sections = []
    sort_order = 0

    for i, h in enumerate(top_level):
        if h["skip"]:
            continue

        start_line = h["line"]
        # End at next top-level heading (whether skipped or not)
        if i < len(top_level) - 1:
            end_line = top_level[i + 1]["line"]
        else:
            end_line = len(lines)

        content = "\n".join(lines[start_line:end_line]).strip()
        word_count = len(content.split())

        # Skip very short sections (probably artifacts)
        if word_count < 20:
            continue

        title = h["title"]
        if h["number"]:
            title = f"{h['number']}. {title}"

        sections.append({
            "section_title": title,
            "content": content,
            "sort_order": sort_order,
            "word_count": word_count,
        })
        sort_order += 1

    if not sections:
        # All detected sections were skipped or too short
        print("  Warning: All detected sections were filtered out. Using full text.")
        word_count = len(text.split())
        return [{
            "section_title": "Full Paper",
            "content": text.strip(),
            "sort_order": 0,
            "word_count": word_count,
        }]

    return sections


def build_output(
    sections: list[dict],
    resource_id: str,
    concept_id: str,
) -> list[dict]:
    """Build the final JSON output matching resource_sections format."""
    output = []
    for section in sections:
        output.append({
            "resource_id": resource_id,
            "concept_id": concept_id,
            "section_title": section["section_title"],
            "sort_order": section["sort_order"],
            "content_original": section["content"],
            "word_count": section["word_count"],
        })
    return output


def run_translation(sections_file: Path) -> None:
    """Run translation on the extracted sections by importing translate-chapter.py."""
    import importlib.util
    import os

    try:
        from dotenv import load_dotenv
    except ImportError:
        print("Error: --translate requires python-dotenv. Install: pip install python-dotenv")
        sys.exit(1)

    load_dotenv(".env.local")

    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY not set in .env.local")
        sys.exit(1)

    # Import translate-chapter module
    scripts_dir = Path(__file__).parent
    translate_path = scripts_dir / "translate-chapter.py"
    if not translate_path.exists():
        print(f"Error: {translate_path} not found")
        sys.exit(1)

    spec = importlib.util.spec_from_file_location("translate_chapter", str(translate_path))
    translate_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(translate_mod)

    # Run translation using translate-chapter's main logic
    print(f"\nRunning translation on {sections_file}...")
    sys.argv = ["translate-chapter.py", str(sections_file)]
    translate_mod.main()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest arXiv paper: download, extract, segment, save JSON"
    )
    parser.add_argument(
        "paper_id",
        help="arXiv paper ID (e.g., 2005.11401)"
    )
    parser.add_argument(
        "--concept-id",
        default=None,
        help="Concept ID for all sections (default: slugified paper ID)"
    )
    parser.add_argument(
        "--resource-id",
        default=None,
        help="Resource ID (default: arxiv-{paper_id})"
    )
    parser.add_argument(
        "--translate",
        action="store_true",
        help="Also run EN→ES translation after extraction"
    )
    parser.add_argument(
        "--output-dir",
        default="scripts/output",
        help="Output directory (default: scripts/output)"
    )
    args = parser.parse_args()

    paper_id: str = args.paper_id
    safe_id = paper_id.replace("/", "-")
    resource_id = args.resource_id or f"arxiv-{safe_id}"
    concept_id = args.concept_id or safe_id
    output_dir = Path(args.output_dir)

    # Step 1: Download
    print("=" * 60)
    print("STEP 1: DOWNLOAD")
    print("=" * 60)
    title, pdf_path = download_paper(paper_id, output_dir)

    # Step 2: Extract
    print("\n" + "=" * 60)
    print("STEP 2: EXTRACT")
    print("=" * 60)
    raw_text = extract_text(pdf_path)
    cleaned_text = clean_page_artifacts(raw_text)
    cleaned_words = len(cleaned_text.split())
    print(f"  After cleaning: {cleaned_words} words")

    # Step 3: Segment
    print("\n" + "=" * 60)
    print("STEP 3: SEGMENT")
    print("=" * 60)
    sections = segment_sections(cleaned_text)
    print(f"  Found {len(sections)} sections:")
    for sec in sections:
        print(f"    [{sec['sort_order']}] {sec['section_title']} ({sec['word_count']} words)")

    # Step 4: Build output
    output = build_output(sections, resource_id, concept_id)

    total_words = sum(s["word_count"] for s in output)
    sections_file = output_dir / f"arxiv-{safe_id}-sections.json"
    sections_file.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"\n{'=' * 60}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Paper: {title}")
    print(f"  Resource ID: {resource_id}")
    print(f"  Concept ID: {concept_id}")
    print(f"  Sections: {len(output)}")
    print(f"  Total words: {total_words}")
    print(f"  Output: {sections_file}")

    # Step 5: Translate (optional)
    if args.translate:
        print(f"\n{'=' * 60}")
        print(f"STEP 4: TRANSLATE")
        print(f"{'=' * 60}")
        run_translation(sections_file)
    else:
        print(f"\nNext steps:")
        print(f"  Translate: python scripts/translate-chapter.py {sections_file}")
        print(f"  Or seed:   npx tsx scripts/seed-sections.ts --from-file {sections_file}")


if __name__ == "__main__":
    main()
