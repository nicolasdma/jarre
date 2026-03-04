#!/usr/bin/env python3
"""
Extract page-ordered markdown from a PDF for the Jarre pipeline.

Output JSON schema:
{
  "pageCount": number,
  "totalImages": number,
  "metadataTitle": string | null,
  "pages": [
    {
      "pageNumber": number,
      "text": string,
      "markdown": string,
      "imageCount": number
    }
  ]
}
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter
from pathlib import Path

import fitz  # PyMuPDF


ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "webp"}
TOP_MARGIN_LINES = 4
BOTTOM_MARGIN_LINES = 3


def normalize_spaces(text: str) -> str:
  return re.sub(r"[ \t]+", " ", text).strip()


def is_page_number_line(text: str) -> bool:
  return bool(re.fullmatch(r"[0-9ivxlcdmIVXLCDM]+", text.strip()))


def clean_text_block(block: dict) -> str:
  lines: list[str] = []
  for line in block.get("lines", []):
    span_text = "".join(span.get("text", "") for span in line.get("spans", []))
    normalized = normalize_spaces(span_text)
    if not normalized:
      continue
    if is_page_number_line(normalized):
      continue
    lines.append(normalized)
  return "\n".join(lines).strip()


def normalize_margin_key(text: str) -> str:
  key = text.lower()
  key = re.sub(r"\bpage\s+\d+\b", "page", key)
  key = re.sub(r"\s+", " ", key)
  key = re.sub(r"[^a-z0-9 ]", "", key)
  return key.strip()


def is_margin_candidate(line: str) -> bool:
  stripped = line.strip()
  if not stripped:
    return False
  if len(stripped) < 6 or len(stripped) > 120:
    return False
  if re.search(r"[.!?;:]\s*$", stripped):
    return False

  letters = [ch for ch in stripped if ch.isalpha()]
  if not letters:
    return False

  uppercase_ratio = sum(1 for ch in letters if ch.isupper()) / len(letters)
  return uppercase_ratio >= 0.6 or bool(re.search(r"\b(volume|journal|proceedings)\b", stripped.lower()))


def detect_repeated_margin_keys(page_line_sets: list[list[str]]) -> set[str]:
  candidates: Counter[str] = Counter()

  for lines in page_line_sets:
    if not lines:
      continue

    margin_lines = lines[:TOP_MARGIN_LINES] + lines[-BOTTOM_MARGIN_LINES:]
    seen_on_page: set[str] = set()

    for line in margin_lines:
      if not is_margin_candidate(line):
        continue
      key = normalize_margin_key(line)
      if not key:
        continue
      seen_on_page.add(key)

    for key in seen_on_page:
      candidates[key] += 1

  min_pages = max(3, math.ceil(len(page_line_sets) * 0.3))
  return {key for key, count in candidates.items() if count >= min_pages}


def remove_margin_noise(page_markdown: str, repeated_keys: set[str]) -> str:
  if not repeated_keys:
    return page_markdown

  cleaned_lines: list[str] = []
  for line in page_markdown.split("\n"):
    stripped = line.strip()
    if not stripped:
      cleaned_lines.append(line)
      continue
    if stripped.startswith("![") and "](" in stripped:
      cleaned_lines.append(line)
      continue
    key = normalize_margin_key(stripped)
    if key in repeated_keys:
      continue
    cleaned_lines.append(line)

  cleaned = "\n".join(cleaned_lines)
  cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
  return cleaned


def get_image_payload(doc: fitz.Document, block: dict) -> tuple[bytes, str] | None:
  width = int(block.get("width") or 0)
  height = int(block.get("height") or 0)
  if width < 120 or height < 120:
    return None
  if width * height < 25_000:
    return None

  ext = str(block.get("ext") or "png").lower()
  img_bytes = block.get("image")

  xref = block.get("xref")
  if (not img_bytes) and xref:
    extracted = doc.extract_image(int(xref))
    if extracted and extracted.get("image"):
      img_bytes = extracted["image"]
      ext = str(extracted.get("ext") or ext).lower()

  if not img_bytes:
    return None

  if ext not in ALLOWED_IMAGE_EXTS and xref:
    try:
      pix = fitz.Pixmap(doc, int(xref))
      if pix.alpha:
        pix = fitz.Pixmap(fitz.csRGB, pix)
      img_bytes = pix.tobytes("png")
      ext = "png"
    except Exception:
      return None

  if ext not in ALLOWED_IMAGE_EXTS:
    ext = "png"

  return img_bytes, ext


def find_figure_captions(page: fitz.Page) -> list[dict]:
  captions: list[dict] = []
  blocks = page.get_text("dict").get("blocks", [])

  for block in blocks:
    if int(block.get("type") or 0) != 0:
      continue

    for line in block.get("lines", []):
      text = normalize_spaces("".join(span.get("text", "") for span in line.get("spans", [])))
      if not text:
        continue
      if not re.match(r"^(Figure|FIGURE|Fig\.?)\s*\d+", text):
        continue

      bbox = line.get("bbox") or [0, 0, 0, 0]
      captions.append({
        "text": text,
        "y0": float(bbox[1]),
        "y1": float(bbox[3]),
      })

  captions.sort(key=lambda c: c["y0"])
  return captions


def clip_rect_to_page(rect: fitz.Rect, page_rect: fitz.Rect) -> fitz.Rect:
  x0 = max(page_rect.x0, rect.x0)
  y0 = max(page_rect.y0, rect.y0)
  x1 = min(page_rect.x1, rect.x1)
  y1 = min(page_rect.y1, rect.y1)
  return fitz.Rect(x0, y0, x1, y1)


def extract_vector_figures(
  page: fitz.Page,
  page_number: int,
  out_dir: Path,
  public_prefix: str,
  max_images_per_page: int,
) -> list[dict]:
  captions = find_figure_captions(page)
  if not captions:
    return []

  drawing_rects = [
    d.get("rect")
    for d in page.get_drawings()
    if d.get("rect") is not None and d["rect"].get_area() >= 120
  ]
  if not drawing_rects:
    return []

  figures: list[dict] = []
  page_rect = page.rect
  previous_caption_bottom = float(page_rect.y0 + 40)

  for idx, caption in enumerate(captions, start=1):
    if len(figures) >= max_images_per_page:
      break

    caption_top = caption["y0"]
    if caption_top <= previous_caption_bottom + 24:
      previous_caption_bottom = max(previous_caption_bottom, caption["y1"])
      continue

    candidates = [
      rect
      for rect in drawing_rects
      if rect.y1 <= caption_top - 2
      and rect.y0 >= previous_caption_bottom - 10
      and rect.get_area() >= 240
    ]

    if not candidates:
      previous_caption_bottom = max(previous_caption_bottom, caption["y1"])
      continue

    union = fitz.Rect(candidates[0])
    for rect in candidates[1:]:
      union.include_rect(rect)

    union = fitz.Rect(union.x0 - 6, union.y0 - 6, union.x1 + 6, union.y1 + 6)
    clip = clip_rect_to_page(union, page_rect)

    if clip.width < 80 or clip.height < 60:
      previous_caption_bottom = max(previous_caption_bottom, caption["y1"])
      continue

    try:
      pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
      file_name = f"p{page_number:03d}-fig{idx:02d}.png"
      out_path = out_dir / file_name
      pix.save(str(out_path))
      figures.append({
        "caption": caption["text"],
        "path": f"{public_prefix}/{file_name}",
      })
    except Exception:
      pass

    previous_caption_bottom = max(previous_caption_bottom, caption["y1"])

  return figures


def inject_vector_figures(markdown: str, figures: list[dict]) -> str:
  if not figures:
    return markdown

  result = markdown
  for fig in figures:
    caption = fig["caption"]
    path = fig["path"]
    replacement = f"![{caption}]({path})\n\n_{caption}_"
    pattern = re.compile(re.escape(caption))
    if pattern.search(result):
      result = pattern.sub(replacement, result, count=1)
      continue
    result = f"{result}\n\n{replacement}".strip()

  return re.sub(r"\n{3,}", "\n\n", result).strip()


def extract_page_content(
  doc: fitz.Document,
  page: fitz.Page,
  page_number: int,
  out_dir: Path,
  public_prefix: str,
  max_images_per_page: int,
) -> tuple[str, str, int]:
  blocks = page.get_text("dict").get("blocks", [])
  ordered = sorted(
    blocks,
    key=lambda b: (float((b.get("bbox") or [0, 0, 0, 0])[1]), float((b.get("bbox") or [0, 0, 0, 0])[0])),
  )

  markdown_parts: list[str] = []
  text_parts: list[str] = []
  images_saved = 0
  seen_xrefs: set[int] = set()

  for block in ordered:
    block_type = int(block.get("type") or 0)

    if block_type == 0:
      text = clean_text_block(block)
      if text:
        markdown_parts.append(text)
        text_parts.append(text)
      continue

    if block_type != 1:
      continue

    if images_saved >= max_images_per_page:
      continue

    xref = block.get("xref")
    if isinstance(xref, int) and xref > 0:
      if xref in seen_xrefs:
        continue
      seen_xrefs.add(xref)

    payload = get_image_payload(doc, block)
    if not payload:
      continue

    img_bytes, ext = payload
    images_saved += 1

    file_name = f"p{page_number:03d}-img{images_saved:02d}.{ext}"
    out_path = out_dir / file_name
    out_path.write_bytes(img_bytes)

    alt = f"Page {page_number} image {images_saved}"
    markdown_parts.append(f"![{alt}]({public_prefix}/{file_name})")

  markdown = "\n\n".join(part for part in markdown_parts if part).strip()
  markdown = re.sub(r"\n{3,}", "\n\n", markdown)

  text = "\n\n".join(part for part in text_parts if part).strip()
  text = re.sub(r"\n{3,}", "\n\n", text)

  vector_figures = extract_vector_figures(
    page=page,
    page_number=page_number,
    out_dir=out_dir,
    public_prefix=public_prefix,
    max_images_per_page=max_images_per_page,
  )
  if vector_figures:
    markdown = inject_vector_figures(markdown, vector_figures)
    images_saved += len(vector_figures)

  return text, markdown, images_saved


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--pdf", required=True, help="Absolute path to PDF file")
  parser.add_argument("--out-dir", required=True, help="Absolute output dir for extracted images")
  parser.add_argument("--public-prefix", required=True, help="Public URL prefix (e.g. /generated/pdfs/abc)")
  parser.add_argument("--max-pages", type=int, default=150)
  parser.add_argument("--max-images-per-page", type=int, default=6)
  args = parser.parse_args()

  pdf_path = Path(args.pdf).resolve()
  out_dir = Path(args.out_dir).resolve()
  out_dir.mkdir(parents=True, exist_ok=True)

  doc = fitz.open(pdf_path)
  page_count = min(doc.page_count, max(args.max_pages, 1))

  pages: list[dict] = []
  total_images = 0
  raw_page_lines: list[list[str]] = []

  for i in range(page_count):
    page = doc.load_page(i)
    page_number = i + 1
    text, markdown, image_count = extract_page_content(
      doc=doc,
      page=page,
      page_number=page_number,
      out_dir=out_dir,
      public_prefix=args.public_prefix.rstrip("/"),
      max_images_per_page=max(args.max_images_per_page, 1),
    )

    markdown_value = markdown if markdown else text
    pages.append({
      "pageNumber": page_number,
      "text": text,
      "markdown": markdown_value,
      "imageCount": image_count,
    })
    raw_page_lines.append([
      line.strip()
      for line in markdown_value.split("\n")
      if line.strip() and not line.strip().startswith("![")
    ])
    total_images += image_count

  repeated_margin_keys = detect_repeated_margin_keys(raw_page_lines)
  if repeated_margin_keys:
    for page in pages:
      cleaned_markdown = remove_margin_noise(page["markdown"], repeated_margin_keys)
      page["markdown"] = cleaned_markdown
      page["text"] = re.sub(r"\n{3,}", "\n\n", remove_margin_noise(page["text"], repeated_margin_keys)).strip()

  metadata_title = (doc.metadata or {}).get("title")
  metadata_title = metadata_title.strip() if isinstance(metadata_title, str) else None
  if metadata_title == "":
    metadata_title = None

  result = {
    "pageCount": page_count,
    "totalImages": total_images,
    "metadataTitle": metadata_title,
    "pages": pages,
  }

  print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
  main()
