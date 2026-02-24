# Session 13: DDIA Figures + Inline Micro-Quizzes

**Date:** 2026-02-09
**Duration:** ~1 session
**Build status:** Clean (npx next build passes)

---

## Goals

1. Extract all 67 DDIA figures from PDF and integrate into learn flow
2. Build inline MC/TF quiz system interleaved during reading
3. Seed proof-of-concept quizzes for Ch5 (Replication)

---

## What Was Done

### Feature 1: Figure Extraction + Rendering

| File | Action | Lines |
|------|--------|-------|
| `scripts/extract-figures.py` | CREATE | 400 |
| `public/figures/ddia/*.png` | CREATE | 67 files, 4.4 MB |
| `src/data/ddia-figures.json` | CREATE | registry (67 entries) |
| `src/lib/figure-registry.ts` | CREATE | 15 |
| `src/lib/figure-injector.ts` | CREATE | 42 |
| `src/components/section-content.tsx` | MODIFY | +80 lines |

**How it works:**
1. `extract-figures.py` uses pymupdf to extract images from DDIA PDF
2. Matches images to captions via vertical proximity on same page
3. Saves PNGs to `public/figures/ddia/`, registry to `src/data/ddia-figures.json`
4. At render time, `injectFigures()` pre-processes markdown, inserting `![caption](path)` before `_Figura X-Y. ..._` lines
5. `em` renderer hides caption text (shown as `<figcaption>` instead)
6. `img` renderer wraps in `<figure>` with Jarre styling

**Results:**
- Ch1: 5 figures (1-1...1-5)
- Ch2: 6 figures (2-1...2-6)
- Ch3: 12 figures (3-1...3-12)
- Ch5: 14 figures (5-1...5-14)
- Ch6: 8 figures (6-1...6-8)
- Ch8: 5 figures (8-1...8-5)
- Ch9: 10 figures (9-1...9-10)
- Ch11: 7 figures (11-1...11-7)

### Feature 2: Inline Micro-Quizzes

| File | Action | Lines |
|------|--------|-------|
| `supabase/migrations/20260209020000_inline_quizzes.sql` | CREATE | 19 |
| `src/types/index.ts` | MODIFY | +17 |
| `src/lib/markdown-splitter.ts` | CREATE | 50 |
| `src/components/inline-quiz.tsx` | CREATE | 222 |
| `src/components/section-content.tsx` | MODIFY | interleaved rendering |
| `src/components/concept-section.tsx` | MODIFY | +2 props |
| `src/components/learn-flow.tsx` | MODIFY | +2 props |
| `src/app/learn/[resourceId]/page.tsx` | MODIFY | fetch + group quizzes |
| `scripts/seed-inline-quizzes.ts` | CREATE | ~300 |

**How it works:**
1. `inline_quizzes` table: section_id, position_after_heading, format (mc/tf), options (JSONB), correct_answer
2. `splitAtBoldHeadings()` splits markdown at `**Heading Text**` lines
3. Quizzes mapped by heading → inserted between content segments
4. `InlineQuiz` component: purely client-side grading (no LLM calls)
5. MC: radio buttons → submit → green/red highlight + explanation
6. TF: "Verdadero"/"Falso" buttons → instant feedback

**Quiz Coverage (Ch5):**
- Líderes y Seguidores: 5 quizzes
- Problemas con el Retraso de Replicación: 4 quizzes
- Replicación Multi-Líder: 5 quizzes
- Replicación sin Líder: 5 quizzes
- Escrituras Concurrentes: 3 quizzes
- **Total: 22 quizzes**

---

## Decisions

1. **Figures injected at render time, not re-seeded** — avoids re-running the translation pipeline; registry is a build-time JSON file
2. **Inline quizzes separate from question_bank** — different schema (MC/TF vs open-ended), no SM-2, no LLM evaluation, position-aware
3. **Client-side grading** — zero API calls for quiz feedback, instant UX
4. **`em` renderer hides captions** — when figure is injected, the original italic caption is suppressed (rendered as `<figcaption>` instead)
5. **Figure captions in English** — registry captions from PDF are English; the markdown already has Spanish captions used as `alt` text

---

## Files Created/Modified

### New Files (8)
- `scripts/extract-figures.py`
- `src/data/ddia-figures.json`
- `src/lib/figure-registry.ts`
- `src/lib/figure-injector.ts`
- `src/lib/markdown-splitter.ts`
- `src/components/inline-quiz.tsx`
- `supabase/migrations/20260209020000_inline_quizzes.sql`
- `scripts/seed-inline-quizzes.ts`
- `investigations/ddia-figures-extraction.md`
- `investigations/inline-quizzes-research.md`

### Modified Files (5)
- `src/types/index.ts` — added InlineQuiz types
- `src/components/section-content.tsx` — figures + quiz interleaving
- `src/components/concept-section.tsx` — pass figureRegistry + inlineQuizzes
- `src/components/learn-flow.tsx` — accept + pass figureRegistry + quizzesBySectionId
- `src/app/learn/[resourceId]/page.tsx` — import registry, fetch quizzes, group by section

### Generated Assets
- `public/figures/ddia/*.png` — 67 PNG files (4.4 MB total)

---

## Next Steps

- [ ] Seed inline quizzes for remaining DDIA chapters
- [ ] Re-segment long chapters (Ch2, Ch3, Ch8, Ch9, Ch11)
- [ ] Test learn flow end-to-end with figures + quizzes
- [ ] Create ConceptVisuals for other chapters
- [ ] Translate and seed first arXiv paper
