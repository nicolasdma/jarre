# Session 01 — Phase 2 Karpathy Restructure

> Date: 2026-02-20
> Duration: ~3h (complete)

## Goal

Restructure Phase 2 from a mixed bag (math prereqs, ML infrastructure, DL books, generic Karpathy) to a focused progression: Karpathy "Neural Networks: Zero to Hero" (8 videos) + 3 canonical papers.

## What Was Done

### Paso 1: Migration + Frontend Cleanup (COMPLETE)

**Migration:** `supabase/migrations/20260220040000_phase2_karpathy_restructure.sql`

1. Archived 16 obsolete resources:
   - 7 p0-* math resources (concepts remain as prerequisites)
   - p2-nielsen-nn-dl, p2-goodfellow-dl (replaced by Karpathy)
   - p2-google-mlops, p2-zero-paper, p2-mixed-precision-paper, p2-hidden-tech-debt-paper, p2-docker-bentoml-tutorial
   - karpathy-nn-zero-to-hero, karpathy-intro-llms (replaced by 8 individual videos)

2. Confirmed p2-lilian-weng-distributed and p2-horace-he-gpu already in Phase 5

3. Created 4 new concepts:
   - character-level-lm, neural-language-model, activation-functions-batchnorm, deep-architectures

4. Moved 4 concepts from F3 → F2:
   - attention-mechanism, transformer-architecture, tokenization-bpe, word-embeddings

5. Inserted 9 new resources (8 kz2h-* + p2-bengio-lm-paper)

6. Moved attention-paper to Phase 2 (sort_order 190), updated p2-resnet-paper sort_order to 160

7. Full resource_concepts mappings (teaches + requires)

**Frontend cleanup:**
- Removed p0-* imports, PRACTICAL_ROUTES, EXPLANATION_COMPONENTS from page.tsx
- Removed p0-* entries from reading-questions.ts
- Deleted 4 p0-*.tsx component files
- Deleted 4 p0-* JSON files from scripts/output/

**FK issue encountered:** `question_bank.resource_section_id` references `resource_sections` without CASCADE. Fixed by adding `DELETE FROM question_bank WHERE resource_section_id IN (SELECT id FROM resource_sections WHERE resource_id IN (...))` before the section delete.

### Paso 2: kz2h-micrograd Content (COMPLETE — partial)

1. Extracted transcript: 24,350 words, 39 segments, 2:25:53 duration
2. Translated via DeepSeek ($0.11, ratio 0.93): 22,684 ES words
3. Resegmented into 5 concept-mapped sections (22,707 words total)
4. Seeded to Supabase via `scripts/seed-kz2h-micrograd-sections.ts`
5. Created advance organizer TSX: `kz2h-micrograd.tsx` (5 sections: Value & DAG, Chain Rule, Automatic Backprop, Neurons/Layers/MLP, Training Loop)
6. Added 7 reading questions to reading-questions.ts
7. Registered in page.tsx (import, PRACTICAL_ROUTES, EXPLANATION_COMPONENTS)

**Still pending for kz2h-micrograd:** inline quizzes (12-20), exercises (3)

### Bug Fix: Videos Not Visible in Library

**Problem:** After migration, only 3 papers showed in Phase 2 library — all 8 kz2h-* videos were hidden.
**Root cause:** `src/app/library/page.tsx` line 273: `const hiddenTypes = ['course', 'video']` filters out `type='video'` from main view.
**Fix:** Created new `'lecture'` resource type via migration `20260220050000_kz2h_lecture_type.sql`. Updated all kz2h-* resources from `video` → `lecture`. Added `lecture: '🎓'` icon to `resource-card.tsx`.

## Decisions

- Phase 2 now has exactly 11 resources in clean progression (sort 100-200)
- Math concepts (linear-algebra-ml, etc.) remain as Phase 2 prerequisites but without dedicated resources
- attention-paper comes AFTER kz2h-building-gpt (sort 190 vs 180) since the video is implementation-first, paper is theory-after
- New `lecture` resource type distinguishes structured video content (main library) from supplementary `video` resources (collapsible section)

## Next Steps

1. Create inline quizzes for kz2h-micrograd (12-20)
2. Create exercises for kz2h-micrograd (3)
3. Continue with remaining 10 resources (kz2h-makemore-bigram through kz2h-tokenizers + p2-bengio-lm-paper)

## Commits

- `2dbef6c` [Curriculum] Remove DDIA Ch11, stream-processing playground
- `fdc3b7f` [Curriculum] Phase 2 Karpathy restructure + micrograd content
- `38a0d30` [Library] Add 'lecture' resource type for Karpathy videos
