#!/usr/bin/env python3
"""
Extract figures from the DDIA PDF and build a registry for the learn UI.

Uses pymupdf (fitz) to extract images from each chapter's page range,
filters out small decorations (O'Reilly bird icons, etc.), and matches
each image to its caption text on the same page.

Usage:
  python3 scripts/extract-figures.py scripts/output/ddia.pdf

Options:
  --output-dir    Directory for PNGs (default: public/figures/ddia)
  --registry-path Path for JSON registry (default: src/data/ddia-figures.json)
  --min-width     Minimum image width to keep (default: 500)

Output:
  public/figures/ddia/fig-{ch}-{num}.png   — one PNG per figure
  src/data/ddia-figures.json               — registry mapping fig IDs to paths + captions
"""

import json
import re
import sys
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    print("Install: pip install --break-system-packages pymupdf")
    sys.exit(1)


# ============================================================================
# Chapter page ranges (1-indexed, matching the PDF/TOC)
# ============================================================================

CHAPTER_PAGES = {
    1:  (25, 48),
    2:  (49, 89),
    3:  (91, 131),
    5:  (173, 219),
    6:  (221, 241),
    8:  (295, 341),
    9:  (343, 405),
    11: (461, 509),
}


def find_captions_on_page(page: fitz.Page) -> list[dict]:
    """
    Extract all 'Figure X-Y. ...' captions from a page's text.

    Returns a list of dicts with:
      - fig_id: e.g. "1-1"
      - caption_en: full English caption line
      - caption_es: Spanish version (Figure → Figura)
      - y_position: vertical position on page (for matching to images)
    """
    captions = []
    blocks = page.get_text("dict")["blocks"]

    for block in blocks:
        if block["type"] != 0:  # text block
            continue

        for line in block.get("lines", []):
            line_text = ""
            for span in line.get("spans", []):
                line_text += span["text"]

            line_text = line_text.strip()
            match = re.match(r"(Figure\s+(\d+-\d+)\.\s+.+)", line_text)
            if match:
                caption_en = match.group(1)
                fig_id = match.group(2)
                caption_es = caption_en.replace("Figure", "Figura", 1)
                # Use the vertical midpoint of the line bbox for positioning
                y_pos = (line["bbox"][1] + line["bbox"][3]) / 2
                captions.append({
                    "fig_id": fig_id,
                    "caption_en": caption_en,
                    "caption_es": caption_es,
                    "y_position": y_pos,
                })

    return captions


def extract_image_from_pdf(doc: fitz.Document, xref: int) -> bytes | None:
    """Extract a single image by xref and return PNG bytes, or None on failure."""
    try:
        img = doc.extract_image(xref)
        if not img or not img.get("image"):
            return None

        # Convert to PNG via pixmap if not already PNG
        if img["ext"] == "png":
            return img["image"]

        # Reconstruct pixmap from raw image data
        pix = fitz.Pixmap(doc, xref)
        if pix.alpha:
            pix = fitz.Pixmap(fitz.csRGB, pix)  # remove alpha for PNG
        png_bytes = pix.tobytes("png")
        return png_bytes
    except Exception as e:
        print(f"    Warning: failed to extract xref {xref}: {e}")
        return None


def match_images_to_captions(
    images_with_pos: list[dict],
    captions: list[dict],
) -> list[dict]:
    """
    Match extracted images to captions by vertical proximity.

    Each image is matched to the nearest caption that appears BELOW it
    (captions typically sit under the figure). If only one image and one
    caption exist on the page, they match directly.
    """
    if not images_with_pos or not captions:
        return []

    # Simple case: 1 image, 1 caption
    if len(images_with_pos) == 1 and len(captions) == 1:
        return [{
            "image": images_with_pos[0],
            "caption": captions[0],
        }]

    # Multiple images: match each image to nearest caption below it
    matched = []
    used_captions = set()

    for img in sorted(images_with_pos, key=lambda x: x["y_position"]):
        best_caption = None
        best_distance = float("inf")

        for i, cap in enumerate(captions):
            if i in used_captions:
                continue
            # Caption should be at or below the image
            distance = abs(cap["y_position"] - img["y_position"])
            if distance < best_distance:
                best_distance = distance
                best_caption = (i, cap)

        if best_caption is not None:
            used_captions.add(best_caption[0])
            matched.append({
                "image": img,
                "caption": best_caption[1],
            })

    return matched


def extract_figures_from_chapter(
    doc: fitz.Document,
    chapter_num: int,
    start_page: int,
    end_page: int,
    min_width: int,
    output_dir: Path,
) -> dict:
    """
    Extract all figures from a chapter's page range.

    Returns a dict mapping fig_id → {path, caption}.
    """
    registry = {}
    figure_count = 0

    print(f"\nChapter {chapter_num}: pages {start_page}-{end_page}")

    for page_num in range(start_page - 1, end_page):  # 0-indexed for fitz
        page = doc[page_num]
        images_raw = page.get_images(full=True)

        if not images_raw:
            continue

        # Filter by width and collect positions
        images_with_pos = []
        seen_xrefs = set()

        for img_info in images_raw:
            xref = img_info[0]
            width = img_info[2]
            height = img_info[3]

            # Skip duplicates (same image referenced multiple times)
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            if width < min_width:
                continue

            # Get image position on page via the image's bbox
            # Find the image rect by looking at the page's image instances
            img_rects = page.get_image_rects(xref)
            if img_rects:
                rect = img_rects[0]
                y_pos = (rect.y0 + rect.y1) / 2
            else:
                y_pos = 0  # fallback

            images_with_pos.append({
                "xref": xref,
                "width": width,
                "height": height,
                "y_position": y_pos,
            })

        if not images_with_pos:
            continue

        # Find captions on this page
        captions = find_captions_on_page(page)

        # Match images to captions
        matches = match_images_to_captions(images_with_pos, captions)

        page_figures = 0

        for m in matches:
            img_data = m["image"]
            caption_info = m["caption"]
            fig_id = caption_info["fig_id"]

            # Extract the chapter and figure numbers for the filename
            parts = fig_id.split("-")
            if len(parts) != 2:
                print(f"    Warning: unexpected fig_id format: {fig_id}")
                continue

            ch_num, fig_num = parts[0], parts[1]

            # Extract image bytes
            png_bytes = extract_image_from_pdf(doc, img_data["xref"])
            if not png_bytes:
                continue

            # Save PNG
            filename = f"fig-{ch_num}-{fig_num}.png"
            filepath = output_dir / filename
            filepath.write_bytes(png_bytes)

            # Add to registry
            registry[fig_id] = {
                "path": f"/figures/ddia/fig-{ch_num}-{fig_num}.png",
                "caption": caption_info["caption_es"],
            }

            page_figures += 1
            figure_count += 1

        if page_figures > 0:
            print(f"  Page {page_num + 1}: {page_figures} figure(s) extracted")

        # Handle unmatched images on pages with captions on adjacent pages
        # (some figures span pages, caption might be on next page)
        unmatched_images = [
            img for img in images_with_pos
            if not any(
                m["image"]["xref"] == img["xref"]
                for m in matches
            )
        ]

        if unmatched_images and page_num + 1 < end_page:
            next_page = doc[page_num + 1]
            next_captions = find_captions_on_page(next_page)
            # Only use captions near the top of the next page
            top_captions = [c for c in next_captions if c["y_position"] < 150]

            for img, cap in zip(unmatched_images, top_captions):
                fig_id = cap["fig_id"]
                parts = fig_id.split("-")
                if len(parts) != 2:
                    continue

                ch_num, fig_num = parts[0], parts[1]
                png_bytes = extract_image_from_pdf(doc, img["xref"])
                if not png_bytes:
                    continue

                filename = f"fig-{ch_num}-{fig_num}.png"
                filepath = output_dir / filename
                filepath.write_bytes(png_bytes)

                registry[fig_id] = {
                    "path": f"/figures/ddia/fig-{ch_num}-{fig_num}.png",
                    "caption": cap["caption_es"],
                }

                figure_count += 1
                print(f"  Page {page_num + 1}: 1 figure matched to caption on next page")

    print(f"  Total: {figure_count} figures from chapter {chapter_num}")
    return registry


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract figures from DDIA PDF and build a registry"
    )
    parser.add_argument("pdf_path", help="Path to DDIA PDF")
    parser.add_argument(
        "--output-dir",
        default="public/figures/ddia",
        help="Directory for extracted PNGs (default: public/figures/ddia)",
    )
    parser.add_argument(
        "--registry-path",
        default="src/data/ddia-figures.json",
        help="Path for JSON registry (default: src/data/ddia-figures.json)",
    )
    parser.add_argument(
        "--min-width",
        type=int,
        default=500,
        help="Minimum image width in pixels to keep (default: 500)",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    registry_path = Path(args.registry_path)
    registry_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"PDF: {pdf_path}")
    print(f"Output dir: {output_dir}")
    print(f"Registry: {registry_path}")
    print(f"Min width: {args.min_width}px")

    doc = fitz.open(str(pdf_path))
    print(f"Opened PDF: {doc.page_count} pages")

    full_registry = {}

    for chapter_num in sorted(CHAPTER_PAGES.keys()):
        start_page, end_page = CHAPTER_PAGES[chapter_num]
        chapter_registry = extract_figures_from_chapter(
            doc=doc,
            chapter_num=chapter_num,
            start_page=start_page,
            end_page=end_page,
            min_width=args.min_width,
            output_dir=output_dir,
        )
        full_registry.update(chapter_registry)

    doc.close()

    # Sort registry by figure ID (natural sort: 1-1, 1-2, ..., 2-1, ...)
    def sort_key(fig_id: str) -> tuple[int, int]:
        parts = fig_id.split("-")
        return (int(parts[0]), int(parts[1]))

    sorted_registry = {
        k: full_registry[k]
        for k in sorted(full_registry.keys(), key=sort_key)
    }

    # Save registry
    registry_path.write_text(
        json.dumps(sorted_registry, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"\n{'=' * 60}")
    print(f"Done! Extracted {len(sorted_registry)} figures total")
    print(f"PNGs saved to: {output_dir}/")
    print(f"Registry saved to: {registry_path}")

    # Print summary by chapter
    print(f"\nPer-chapter breakdown:")
    for ch in sorted(CHAPTER_PAGES.keys()):
        ch_figs = [k for k in sorted_registry if k.startswith(f"{ch}-")]
        if ch_figs:
            print(f"  Ch{ch}: {len(ch_figs)} figures ({ch_figs[0]} ... {ch_figs[-1]})")
        else:
            print(f"  Ch{ch}: 0 figures")


if __name__ == "__main__":
    main()
