# DDIA Figure Extraction — Investigation

## Date: 2026-02-09

## Problem
79 figure references in translated DDIA content point to nothing (67 unique figures across 8 chapters). Text says "como se ilustra en la Figura 5-1" but no image exists.

## PDF Details
- **Path:** `scripts/output/ddia.pdf`
- **Size:** ~24.4 MB, PDF v1.4
- **Pages:** 1-indexed, matching book's ToC

## Chapter Page Ranges (1-indexed)

| Chapter | Start | End | Concepts |
|---------|-------|-----|----------|
| 1 | 25 | 48 | thinking-about-data-systems, reliability, scalability, maintainability |
| 2 | 49 | 89 | relational-vs-document, data-models, graph-models |
| 3 | 91 | 131 | storage-engines, oltp-vs-olap, column-storage |
| 5 | 173 | 219 | replication, replication-lag, multi-leader, leaderless |
| 6 | 221 | 241 | partitioning-intro, partitioning, secondary-indexes, rebalancing, request-routing |
| 8 | 295 | 341 | distributed-failures, unreliable-networks, unreliable-clocks, knowledge-truth |
| 9 | 343 | 405 | consistency-intro, consistency-models, ordering, consensus |
| 11 | 461 | 509 | stream-processing, databases-streams, processing-streams |

## Approach: Extract from PDF + Render-time injection

1. **Extract** PNGs from PDF using `pymupdf` (`page.get_images(full=True)`)
2. **Filter:** `width >= 500` to skip O'Reilly bird icons
3. **Caption matching:** regex on same-page text for `Figure X-Y`
4. **Output:** PNGs → `public/figures/ddia/fig-{ch}-{num}.png`, registry → `src/data/ddia-figures.json`
5. **Render-time:** `SectionContent` pre-processes markdown to inject `![caption](/figures/ddia/fig-X-Y.png)` at caption positions

## Registry Format
```json
{
  "1-1": { "path": "/figures/ddia/fig-1-1.png", "caption": "Figura 1-1. Una posible arquitectura..." },
  "5-1": { "path": "/figures/ddia/fig-5-1.png", "caption": "Figura 5-1. Replicación basada en líder..." }
}
```

## Expected Output
- ~68 PNG files, ~5.6 MB total
- 480+ DPI quality

## Existing Extraction Patterns
- `extract-chapter.py` uses `pymupdf4llm` for text extraction
- 1-indexed page numbers, converted to 0-indexed with `range(start - 1, end)`
- Artifact cleaning: page numbers, triple blanks, chapter headers
- Glossary system in `scripts/glossaries/`

## Key Decision
No markdown re-seeding needed — figures injected at render time by matching caption lines in the markdown.
