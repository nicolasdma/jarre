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
import re
from pathlib import Path

import fitz  # PyMuPDF


ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "webp"}


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

    pages.append({
      "pageNumber": page_number,
      "text": text,
      "markdown": markdown if markdown else text,
      "imageCount": image_count,
    })
    total_images += image_count

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
