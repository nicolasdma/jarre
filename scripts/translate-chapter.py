#!/usr/bin/env python3
"""
Faithful paragraph-by-paragraph translation of chapter sections.

Based on:
- Karpinska & Iyyer (2023, WMT): paragraph-level > sentence-level translation
- He et al. (2024, TACL/MAPS): multi-step translation reduces hallucination
- Lamers et al. (2025): LLMs 5x more likely to generalize than humans
- Wang et al. (2024, ACL): quality degrades with longer texts

Strategy:
  1. Split each section into paragraphs (~100-300 words each)
  2. Translate each paragraph with sliding context (previous paragraph)
  3. Explicit "DO NOT SUMMARIZE" instruction in every call
  4. Verify output length ratio (ES should be ~1.15-1.25x EN)
  5. Flag paragraphs where ratio is suspicious (<0.9 or >1.5)

Usage:
  python scripts/translate-chapter.py scripts/output/chapter-01-sections.json

Output:
  scripts/output/chapter-01-translated.json

Requires:
  pip install openai python-dotenv
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError:
    print("Install: pip install openai python-dotenv")
    sys.exit(1)

load_dotenv(".env.local")

# ============================================================================
# GLOSSARY — Technical terms with exact Spanish equivalents
# ============================================================================

GLOSSARY = """GLOSARIO TÉCNICO (usar estos términos exactos):
- reliability → fiabilidad
- scalability → escalabilidad
- maintainability → mantenibilidad
- fault → fallo
- failure (system failure) → fallo del sistema / caída
- fault-tolerant → tolerante a fallos
- throughput → throughput (no traducir)
- latency → latencia
- response time → tiempo de respuesta
- percentile → percentil
- tail latency → latencia de cola
- fan-out → fan-out (no traducir)
- load → carga
- SLA/SLO → SLA/SLO (no traducir)
- head-of-line blocking → bloqueo de cabecera
- operability → operabilidad
- evolvability → evolucionabilidad
- batch processing → procesamiento por lotes
- stream processing → procesamiento de flujos
- rolling upgrade → actualización gradual (rolling upgrade)
- data model → modelo de datos
- query → consulta
- index → índice
- node → nodo
- replica → réplica
- partition → partición
- cache → caché
- database → base de datos
- trade-off → trade-off (no traducir)
- scaling up → escalamiento vertical (scaling up)
- scaling out → escalamiento horizontal (scaling out)
- elastic → elástico
- stateless → sin estado (stateless)
- stateful → con estado (stateful)
- shared-nothing → shared-nothing (no traducir)
- MTTF (mean time to failure) → MTTF (tiempo medio hasta fallo)
"""

# ============================================================================
# TRANSLATION PROMPT — Explicit anti-summarization instructions
# ============================================================================

SYSTEM_PROMPT = f"""Eres un traductor técnico profesional especializado en sistemas distribuidos.

Tu tarea es TRADUCIR fielmente del inglés al español.

REGLAS CRÍTICAS:
1. TRADUCE CADA ORACIÓN. No omitas ninguna oración, ejemplo, o detalle.
2. NO RESUMAS. Si el original tiene 5 oraciones, tu traducción debe tener 5 oraciones.
3. NO SIMPLIFIQUES. Si el autor usa una analogía larga, traduce la analogía completa.
4. NO AGREGUES información que no está en el original.
5. Preserva TODA la estructura de markdown: headings, bold, italic, listas, bloques de código.
6. NO traduzcas el contenido dentro de bloques de código (```).
7. NO traduzcas acrónimos: SLA, SLO, API, CPU, RAM, MTTF, AWS, RAID, etc.
8. Preserva las referencias bibliográficas [1], [2], etc. tal cual.
9. Mantén las notas al pie tal cual.
10. La traducción debe leerse natural en español, pero NUNCA a costa de perder contenido.

{GLOSSARY}

VERIFICACIÓN: Tu traducción debería tener aproximadamente la misma cantidad de oraciones
que el original. El español suele ser 15-25% más largo que el inglés en caracteres."""


def split_into_paragraphs(text: str) -> list[str]:
    """Split text into paragraphs, preserving markdown structure."""
    # Split on double newlines (paragraph boundaries)
    raw_paragraphs = re.split(r"\n\n+", text.strip())

    # Group very short fragments with their neighbors
    paragraphs = []
    buffer = ""

    for p in raw_paragraphs:
        stripped = p.strip()
        if not stripped:
            continue

        # If it's a heading or very short, buffer it with the next paragraph
        is_heading = stripped.startswith("#") or stripped.startswith("**") and len(stripped) < 80
        is_short = len(stripped.split()) < 15

        if is_heading or is_short:
            buffer += ("\n\n" if buffer else "") + stripped
        else:
            if buffer:
                # Attach buffered heading/short text to this paragraph
                paragraphs.append(buffer + "\n\n" + stripped)
                buffer = ""
            else:
                paragraphs.append(stripped)

    if buffer:
        if paragraphs:
            paragraphs[-1] += "\n\n" + buffer
        else:
            paragraphs.append(buffer)

    return paragraphs


def translate_paragraph(
    client: OpenAI,
    paragraph: str,
    prev_translation: str | None,
    section_title: str,
) -> tuple[str, int]:
    """Translate a single paragraph with context."""
    user_msg = ""

    if prev_translation:
        # Sliding context: last 200 chars of previous translation
        context = prev_translation[-500:] if len(prev_translation) > 500 else prev_translation
        user_msg += f"[Contexto del párrafo anterior para mantener coherencia:]\n{context}\n\n---\n\n"

    user_msg += f"[TRADUCIR este párrafo de la sección '{section_title}':]\n\n{paragraph}"

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.15,
        max_tokens=4000,
    )

    translated = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0
    return translated.strip(), tokens


def verify_length_ratio(original: str, translated: str) -> tuple[float, str]:
    """Check if translation length is reasonable (ES ~1.15-1.25x EN)."""
    en_words = len(original.split())
    es_words = len(translated.split())

    if en_words == 0:
        return 1.0, "ok"

    ratio = es_words / en_words

    if ratio < 0.85:
        return ratio, "WARNING: possible content omission"
    elif ratio > 1.50:
        return ratio, "WARNING: possible content addition"
    else:
        return ratio, "ok"


def translate_section(
    client: OpenAI, section: dict, section_index: int, total_sections: int
) -> dict:
    """Translate an entire section paragraph by paragraph."""
    concept_id = section["concept_id"]
    original = section["content_original"]
    title = section["section_title"]

    paragraphs = split_into_paragraphs(original)
    print(f"\n  [{section_index+1}/{total_sections}] {concept_id}: {len(paragraphs)} paragraphs, {len(original.split())} words")

    translated_paragraphs = []
    total_tokens = 0
    prev_translation = None
    warnings = []

    for i, para in enumerate(paragraphs):
        para_words = len(para.split())
        print(f"    Paragraph {i+1}/{len(paragraphs)} ({para_words} words)...", end="", flush=True)

        translated, tokens = translate_paragraph(client, para, prev_translation, title)
        total_tokens += tokens

        # Verify length
        ratio, status = verify_length_ratio(para, translated)
        if status != "ok":
            warnings.append(f"  Para {i+1}: ratio={ratio:.2f} — {status}")
            print(f" ⚠ ratio={ratio:.2f}")
        else:
            print(f" ✓ ratio={ratio:.2f}")

        translated_paragraphs.append(translated)
        prev_translation = translated

        # Rate limit courtesy (1 sec between calls)
        if i < len(paragraphs) - 1:
            time.sleep(1)

    content_markdown = "\n\n".join(translated_paragraphs)

    # Overall section verification
    overall_ratio, overall_status = verify_length_ratio(original, content_markdown)
    print(f"    Section total: {len(content_markdown.split())} words (ratio={overall_ratio:.2f})")

    if warnings:
        print("    Warnings:")
        for w in warnings:
            print(f"      {w}")

    return {
        "resource_id": section["resource_id"],
        "concept_id": section["concept_id"],
        "section_title": section["section_title"],
        "sort_order": section["sort_order"],
        "content_markdown": content_markdown,
        "content_original": original,
        "word_count_en": len(original.split()),
        "word_count_es": len(content_markdown.split()),
        "length_ratio": round(overall_ratio, 3),
        "tokens_used": total_tokens,
        "warnings": warnings,
    }


def main():
    parser = argparse.ArgumentParser(description="Translate chapter sections EN→ES faithfully")
    parser.add_argument("input_path", help="Path to chapter sections JSON")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    args = parser.parse_args()

    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY not set in .env.local")
        sys.exit(1)

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    sections = json.loads(Path(args.input_path).read_text(encoding="utf-8"))

    print(f"Translating {len(sections)} sections...")
    print(f"Total source words: {sum(s.get('word_count', len(s['content_original'].split())) for s in sections)}")

    translated_sections = []
    total_tokens = 0

    for i, section in enumerate(sections):
        result = translate_section(client, section, i, len(sections))
        translated_sections.append(result)
        total_tokens += result["tokens_used"]

    # Summary
    print("\n" + "=" * 60)
    print("TRANSLATION SUMMARY")
    print("=" * 60)

    total_en = sum(s["word_count_en"] for s in translated_sections)
    total_es = sum(s["word_count_es"] for s in translated_sections)
    overall_ratio = total_es / total_en if total_en > 0 else 0

    for s in translated_sections:
        status = "✓" if 0.85 <= s["length_ratio"] <= 1.50 else "⚠"
        print(f"  {status} {s['concept_id']}: {s['word_count_en']} EN → {s['word_count_es']} ES (ratio={s['length_ratio']})")

    print(f"\n  Total: {total_en} EN → {total_es} ES (ratio={overall_ratio:.3f})")
    print(f"  Tokens used: {total_tokens}")

    # Cost estimate (DeepSeek V3: $0.27/1M input, $1.10/1M output)
    cost = total_tokens * 0.0000011
    print(f"  Estimated cost: ${cost:.4f}")

    # Save
    out_dir = Path(args.output_dir)
    stem = Path(args.input_path).stem.replace("-sections", "-translated")
    output_file = out_dir / f"{stem}.json"

    # Clean output (remove internal tracking fields)
    clean_output = []
    for s in translated_sections:
        clean_output.append(
            {
                "resource_id": s["resource_id"],
                "concept_id": s["concept_id"],
                "section_title": s["section_title"],
                "sort_order": s["sort_order"],
                "content_markdown": s["content_markdown"],
                "content_original": s["content_original"],
            }
        )

    output_file.write_text(json.dumps(clean_output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✓ Saved to {output_file}")
    print(f"Next: npx tsx scripts/seed-sections.ts --from-file {output_file}")


if __name__ == "__main__":
    main()
