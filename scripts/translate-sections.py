#!/usr/bin/env python3
"""
Translate concept sections from English to Spanish using DeepSeek V3.

Strategy:
  - Translate section by section (1,000-5,000 tokens each)
  - Glossary preamble with key technical terms
  - Preserve code blocks, formulas, and acronyms
  - Sliding context: include previous section's last paragraph

Usage:
  python scripts/translate-sections.py scripts/output/chapter-01-sections.json

Output:
  scripts/output/chapter-01-translated.json

Requirements:
  pip install openai python-dotenv
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError:
    print("Install dependencies: pip install openai python-dotenv")
    sys.exit(1)

load_dotenv(".env.local")

GLOSSARY = """
GLOSARIO (usar estos términos exactos en la traducción):
- reliability → fiabilidad
- scalability → escalabilidad
- maintainability → mantenibilidad
- fault → fallo
- failure → fallo del sistema / caída
- fault-tolerant → tolerante a fallos
- throughput → rendimiento (throughput)
- latency → latencia
- percentile → percentil
- tail latency → latencia de cola
- fan-out → fan-out (no traducir)
- load → carga
- SLA → SLA (no traducir)
- SLO → SLO (no traducir)
- head-of-line blocking → bloqueo de cabecera
- operability → operabilidad
- evolvability → evolucionabilidad
- batch processing → procesamiento por lotes
- stream processing → procesamiento de flujos
- data model → modelo de datos
- query → consulta
- index → índice
- node → nodo
- replica → réplica
- partition → partición
- leader → líder
- follower → seguidor
- consensus → consenso
- trade-off → trade-off (no traducir)
"""

SYSTEM_PROMPT = """You are a technical translator specializing in distributed systems.
Translate the following English text to Spanish.

Rules:
1. Preserve ALL markdown formatting (headings, bold, italic, lists, code blocks)
2. Do NOT translate content inside code blocks (```)
3. Do NOT translate acronyms (SLA, SLO, API, CPU, RAM, etc.)
4. Use the glossary terms exactly as specified
5. Maintain the technical precision of the original
6. The translation should read naturally in Spanish, not be a word-by-word translation
7. Keep the same paragraph structure

{glossary}"""


def translate_section(
    client: OpenAI,
    content: str,
    prev_context: str | None = None,
) -> str:
    """Translate a single section using DeepSeek V3."""
    user_prompt = ""
    if prev_context:
        user_prompt += f"[Contexto previo para coherencia:]\n{prev_context}\n\n---\n\n"
    user_prompt += f"[Traducir este texto:]\n\n{content}"

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.format(glossary=GLOSSARY)},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=4000,
    )

    translated = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0
    return translated, tokens


def translate_all(input_path: str, output_dir: str) -> Path:
    """Translate all sections in a chapter JSON file."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY not set in .env.local")
        sys.exit(1)

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    sections = json.loads(Path(input_path).read_text(encoding="utf-8"))
    total_tokens = 0
    prev_context = None

    print(f"Translating {len(sections)} sections...")

    for i, section in enumerate(sections):
        original = section["content_original"]
        print(f"\n  [{i+1}/{len(sections)}] {section['concept_id']} ({len(original)} chars)...")

        translated, tokens = translate_section(client, original, prev_context)
        section["content_markdown"] = translated
        total_tokens += tokens

        # Sliding context: last paragraph of translated section
        paragraphs = translated.strip().split("\n\n")
        prev_context = paragraphs[-1] if paragraphs else None

        print(f"    ✓ Translated ({tokens} tokens)")

        # Rate limit courtesy
        if i < len(sections) - 1:
            time.sleep(1)

    # Cost estimate (DeepSeek V3: $0.14/1M input + $0.28/1M output)
    cost_estimate = total_tokens * 0.00000028
    print(f"\n✓ Total tokens: {total_tokens} (~${cost_estimate:.4f})")

    # Save
    out = Path(output_dir)
    stem = Path(input_path).stem.replace("-sections", "-translated")
    output_file = out / f"{stem}.json"
    output_file.write_text(json.dumps(sections, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"✓ Saved to {output_file}")
    print(f"\nNext: npx tsx scripts/seed-sections.ts {output_file}")

    return output_file


def main():
    parser = argparse.ArgumentParser(description="Translate chapter sections EN→ES")
    parser.add_argument("input_path", help="Path to chapter sections JSON")
    parser.add_argument("--output-dir", default="scripts/output", help="Output directory")
    args = parser.parse_args()

    translate_all(args.input_path, args.output_dir)


if __name__ == "__main__":
    main()
