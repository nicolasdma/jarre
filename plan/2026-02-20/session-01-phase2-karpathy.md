# Session 01 — Phase 2 Karpathy Restructure

> Date: 2026-02-20
> Duration: ~2h (in progress)

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

### Paso 2: kz2h-micrograd Content (IN PROGRESS)

1. Extracted transcript: 24,350 words, 39 segments, 2:25:53 duration
2. Translation running via DeepSeek (39 sections × API calls)
3. Created advance organizer TSX: `kz2h-micrograd.tsx` (5 sections: Value & DAG, Chain Rule, Automatic Backprop, Neurons/Layers/MLP, Training Loop)
4. Added 7 reading questions to reading-questions.ts
5. Registered in page.tsx (import, PRACTICAL_ROUTES, EXPLANATION_COMPONENTS)

## Decisions

- Phase 2 now has exactly 11 resources in clean progression (sort 100-200)
- Math concepts (linear-algebra-ml, etc.) remain as Phase 2 prerequisites but without dedicated resources
- attention-paper comes AFTER kz2h-building-gpt (sort 190 vs 180) since the video is implementation-first, paper is theory-after

## Blockers

- Translation of micrograd transcript still running (~39 API calls to DeepSeek)
- Resegmentation into concept-mapped sections pending translation completion

## Next Steps

1. Complete translation → resegment into 5 concept-mapped sections → seed to Supabase
2. Create inline quizzes for kz2h-micrograd (12-20)
3. Create exercises (3)
4. Continue with remaining 10 resources (kz2h-makemore-bigram through kz2h-tokenizers + p2-bengio-lm-paper)

## Commits

- Pending (will commit when translation completes and code is verified)
