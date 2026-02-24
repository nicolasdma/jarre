# Session 10 — ACTIVATE → LEARN → APPLY → EVALUATE Flow

**Date:** 2026-02-08

## Goals
Implement the evidence-based learning sequence designed in session 09.

## What was done

### Phase A: Database (migration 008)
- Created `resource_sections` table with RLS (public read)
- Renamed all migrations to timestamp format (Supabase CLI requirement)
- Marked 001-007 as applied, pushed 008 successfully
- Migration file: `supabase/migrations/20260208020000_resource_sections.sql`

### Phase B: PDF Pipeline Scripts (v1 — superseded by faithful pipeline)
- `scripts/pdf-extract.py` — Marker PDF → Markdown extraction
- `scripts/concept-segment.py` — Heading-based + LLM concept segmentation
- `scripts/translate-sections.py` — DeepSeek V3 glossary-aware EN→ES translation
- `scripts/seed-sections.ts` — Insert sections into Supabase (hardcoded + file modes)
- Initial seed was a crude summary (~2,268 words) — **rejected by user**

### Phase B2: Faithful Translation Pipeline (replaces v1)
- **User feedback**: content was a "resumen burdo" — need EXACT translation of full text
- Researched 30+ papers: Lamers et al. (2025), Karpinska & Iyyer (2023 WMT), He et al. (2024 TACL/MAPS)
- Key finding: LLMs are 5x more likely to generalize than translate faithfully
- `scripts/extract-chapter.py` — pymupdf4llm extraction + TOC-based concept segmentation
- `scripts/translate-chapter.py` — Paragraph-by-paragraph translation with anti-summarization
  - 35-term technical glossary for consistent terminology
  - Sliding context (500 chars) for coherence
  - Length ratio verification per paragraph (flags <0.85 or >1.5)
  - Explicit "DO NOT SUMMARIZE" in every API call
- Translation result: 7,986 EN → 9,068 ES words (ratio 1.135), cost $0.17
- Post-processed: removed 16 duplicate paragraphs (PDF page boundary artifacts) + 5 other artifacts
- `seed-sections.ts` updated: validates concept_ids against DB, skips unknown (e.g., chapter-summary)
- Final seed: 3 sections, ~7,600 words ES (reliability: 2652, scalability: 3489, maintainability: 1458)

### Phase C: Dependencies
- Installed `react-markdown`, `remark-gfm`, `rehype-highlight`

### Phase D: UI — Learn Page Restructured
- **`SectionContent`** (`src/components/section-content.tsx`) — Renders markdown as native HTML with Jarre design system styling
- **`ConceptSection`** (`src/components/concept-section.tsx`) — 4-phase state machine: pre-question → content → post-test → completed
- **`LearnFlow`** (`src/components/learn-flow.tsx`) — Orchestrates the full 4-step sequence with step navigator
- **Learn page** (`src/app/learn/[resourceId]/page.tsx`) — Fetches sections from DB; if sections exist → LearnFlow, else → original fallback
- 18 new translation keys added for the learn flow

### Phase E: Mastery Integration
- Added `micro_test` trigger type to `MasteryTriggerType`
- Added `canAdvanceFromMicroTests()` to `src/lib/mastery.ts` (threshold: 3+ correct)
- Updated `/api/review/submit` to check micro-test mastery advancement after each answer
- Records mastery history with `trigger_type: 'micro_test'`

## Architecture decisions

1. **Server Component fetches sections** → passes to client LearnFlow as props (avoids client-side DB calls)
2. **Fallback pattern** — resources without `resource_sections` rows get the original chapter-only view
3. **Pre-question doesn't call DeepSeek** — just records the attempt, saves API cost
4. **Post-test reuses existing review APIs** — `/api/review/random` + `/api/review/submit` (no duplication)
5. **Mastery check in submit route** — counts all correct answers across questions for a concept, not per-session

## Files created
- `supabase/migrations/20260208020000_resource_sections.sql`
- `scripts/pdf-extract.py` (v1, superseded)
- `scripts/concept-segment.py` (v1, superseded)
- `scripts/translate-sections.py` (v1, superseded)
- `scripts/extract-chapter.py` (v2, faithful pipeline)
- `scripts/translate-chapter.py` (v2, faithful pipeline)
- `scripts/seed-sections.ts`
- `src/components/section-content.tsx`
- `src/components/concept-section.tsx`
- `src/components/learn-flow.tsx`
- `scripts/output/chapter-01-translated.json` (faithful translation output)

## Files modified
- `src/app/learn/[resourceId]/page.tsx` — New flow + fallback
- `src/lib/translations.ts` — 18 learn flow keys
- `src/lib/mastery.ts` — `canAdvanceFromMicroTests()`
- `src/types/index.ts` — `micro_test` trigger type
- `src/app/api/review/submit/route.ts` — Mastery advancement check
- All migration filenames (timestamp format)

## Next steps
- Run the full pipeline on DDIA PDF (extract → segment → translate → seed)
- Test the UI end-to-end (login → library → learn/ddia-ch1 → complete all 3 sections)
- Add more chapters' sections (Ch2, Ch3, Ch5, Ch6, Ch8, Ch9)
- Polish: section completion persistence (currently client-state only)
- Consider adding section progress tracking per user (new table or concept_progress extension)
