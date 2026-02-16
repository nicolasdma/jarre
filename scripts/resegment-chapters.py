#!/usr/bin/env python3
"""
Re-segment DDIA Ch8, Ch9, Ch11 translated JSONs into concept-level subsections.
Pattern: chapter-05-resegmented.json (5 sections, ~15-25K chars each)

Splits by bold headings (**Heading**) that mark major conceptual boundaries.
"""
import json
import re
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')


def split_by_bold_headings(content: str, split_points: list[str]) -> list[str]:
    """Split content at specific bold heading lines."""
    parts = []
    current_start = 0

    for heading in split_points:
        pattern = re.compile(r'^(\*\*' + re.escape(heading) + r'\*\*)$', re.MULTILINE)
        match = pattern.search(content, current_start + 1)
        if match:
            parts.append(content[current_start:match.start()].strip())
            current_start = match.start()

    parts.append(content[current_start:].strip())
    return parts


def resegment_ch8():
    """Ch8: 1 massive section -> 5 concept sections + summary"""
    with open(os.path.join(OUTPUT_DIR, 'chapter-08-translated.json')) as f:
        data = json.load(f)

    main_content = data[0]['content_markdown']
    summary_content = data[1]['content_markdown']

    # Split points for Ch8
    split_points = [
        'Redes no fiables',
        'Relojes no confiables',
        'Conocimiento, verdad y mentiras',
        'Modelo del Sistema y la Realidad',
    ]

    parts = split_by_bold_headings(main_content, split_points)

    sections = [
        {
            'resource_id': 'ddia-ch8',
            'concept_id': 'distributed-failures',
            'section_title': 'Fallas y Fallos Parciales',
            'sort_order': 0,
            'content_markdown': parts[0],
        },
        {
            'resource_id': 'ddia-ch8',
            'concept_id': 'unreliable-networks',
            'section_title': 'Redes No Fiables',
            'sort_order': 1,
            'content_markdown': parts[1],
        },
        {
            'resource_id': 'ddia-ch8',
            'concept_id': 'unreliable-clocks',
            'section_title': 'Relojes No Confiables',
            'sort_order': 2,
            'content_markdown': parts[2],
        },
        {
            'resource_id': 'ddia-ch8',
            'concept_id': 'knowledge-truth',
            'section_title': 'Conocimiento, Verdad y Mentiras',
            'sort_order': 3,
            'content_markdown': parts[3],
        },
        {
            'resource_id': 'ddia-ch8',
            'concept_id': 'distributed-failures',
            'section_title': 'Modelos de Sistema y Corrección',
            'sort_order': 4,
            'content_markdown': parts[4],
        },
    ]

    # Add summary as final section
    sections.append({
        'resource_id': 'ddia-ch8',
        'concept_id': 'distributed-failures',
        'section_title': 'Resumen',
        'sort_order': 5,
        'content_markdown': summary_content,
    })

    out_path = os.path.join(OUTPUT_DIR, 'chapter-08-resegmented.json')
    with open(out_path, 'w') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)

    print(f'Ch8: {len(sections)} sections')
    for s in sections:
        print(f'  [{s["sort_order"]}] {s["concept_id"]} — {s["section_title"]} ({len(s["content_markdown"])} chars)')


def resegment_ch9():
    """Ch9: 2 main sections + summary -> 5 concept sections + summary"""
    with open(os.path.join(OUTPUT_DIR, 'chapter-09-translated.json')) as f:
        data = json.load(f)

    consistency_content = data[0]['content_markdown']
    consensus_content = data[1]['content_markdown']
    summary_content = data[2]['content_markdown']

    # Split consistency section
    consistency_splits = [
        'El Costo de la Linealizabilidad',
        'Garantías de Ordenación',
    ]
    consistency_parts = split_by_bold_headings(consistency_content, consistency_splits)

    # Split consensus section
    consensus_splits = [
        'Consenso Tolerante a Fallos',
    ]
    consensus_parts = split_by_bold_headings(consensus_content, consensus_splits)

    sections = [
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'consistency-models',
            'section_title': 'Linearizabilidad',
            'sort_order': 0,
            'content_markdown': consistency_parts[0],
        },
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'consistency-models',
            'section_title': 'El Costo de la Linearizabilidad',
            'sort_order': 1,
            'content_markdown': consistency_parts[1],
        },
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'ordering',
            'section_title': 'Garantías de Ordenación',
            'sort_order': 2,
            'content_markdown': consistency_parts[2],
        },
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'consensus',
            'section_title': 'Transacciones Distribuidas y Consenso',
            'sort_order': 3,
            'content_markdown': consensus_parts[0],
        },
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'consensus',
            'section_title': 'Consenso Tolerante a Fallos',
            'sort_order': 4,
            'content_markdown': consensus_parts[1],
        },
        {
            'resource_id': 'ddia-ch9',
            'concept_id': 'consensus',
            'section_title': 'Resumen',
            'sort_order': 5,
            'content_markdown': summary_content,
        },
    ]

    out_path = os.path.join(OUTPUT_DIR, 'chapter-09-resegmented.json')
    with open(out_path, 'w') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)

    print(f'Ch9: {len(sections)} sections')
    for s in sections:
        print(f'  [{s["sort_order"]}] {s["concept_id"]} — {s["section_title"]} ({len(s["content_markdown"])} chars)')


def resegment_ch11():
    """Ch11: 1 massive section -> 5 concept sections + summary"""
    with open(os.path.join(OUTPUT_DIR, 'chapter-11-translated.json')) as f:
        data = json.load(f)

    main_content = data[0]['content_markdown']
    summary_content = data[1]['content_markdown']

    split_points = [
        'Logs Particionados',
        'Bases de datos y flujos',
        'Event Sourcing',
        'Procesamiento de Flujos',
    ]

    parts = split_by_bold_headings(main_content, split_points)

    sections = [
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'stream-processing',
            'section_title': 'Transmisión de Flujos de Eventos',
            'sort_order': 0,
            'content_markdown': parts[0],
        },
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'stream-processing',
            'section_title': 'Logs Particionados',
            'sort_order': 1,
            'content_markdown': parts[1],
        },
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'databases-streams',
            'section_title': 'Bases de Datos y Flujos',
            'sort_order': 2,
            'content_markdown': parts[2],
        },
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'databases-streams',
            'section_title': 'Event Sourcing e Inmutabilidad',
            'sort_order': 3,
            'content_markdown': parts[3],
        },
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'processing-streams',
            'section_title': 'Procesamiento de Flujos',
            'sort_order': 4,
            'content_markdown': parts[4],
        },
        {
            'resource_id': 'ddia-ch11',
            'concept_id': 'stream-processing',
            'section_title': 'Resumen',
            'sort_order': 5,
            'content_markdown': summary_content,
        },
    ]

    out_path = os.path.join(OUTPUT_DIR, 'chapter-11-resegmented.json')
    with open(out_path, 'w') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)

    print(f'Ch11: {len(sections)} sections')
    for s in sections:
        print(f'  [{s["sort_order"]}] {s["concept_id"]} — {s["section_title"]} ({len(s["content_markdown"])} chars)')


if __name__ == '__main__':
    resegment_ch8()
    print()
    resegment_ch9()
    print()
    resegment_ch11()
