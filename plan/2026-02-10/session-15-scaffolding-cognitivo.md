# Session 15: Scaffolding Cognitivo — Bridging Bloom Gap

**Date:** 2026-02-10
**Status:** Complete (all 6 phases implemented, TypeScript clean)

## Problem

User completes learn flow (ACTIVATE → LEARN → APPLY → REVIEW → EVALUATE), aces MC/TF quizzes, feels confident, then scores 40% on final evaluation. Root cause: **severe cognitive misalignment**.

| Component | Bloom Level | Format |
|-----------|-------------|--------|
| Inline quizzes (MC/TF) | 1-2 (recognition) | Client-side, 0 production |
| Question bank (review) | 82% Bloom 1-2 | Mostly definition/property/fact |
| Final evaluation | 100% Bloom 4-6 | Free-form scenario/tradeoff/error |

Nothing between Bloom 2 and Bloom 5. User never practices what they're tested on.

## What Was Done

### FASE 1: New Question Types in Question Bank
- **Migration:** `20260211010000_question_bank_new_types.sql` — adds `scenario`, `limitation`, `error_spot` to `question_bank_type` enum
- **Types:** Updated `QuestionBankType` in `src/types/index.ts`
- **Rubrics:** Mapped new types in `src/lib/llm/rubrics.ts` (scenario→SCENARIO_RUBRIC, limitation→TRADEOFF_RUBRIC, error_spot→ERROR_DETECTION_RUBRIC)
- **Schemas:** Updated Zod enum in `src/lib/llm/schemas.ts`
- **Seed:** Created `scripts/seed-high-order-questions.ts` (~35 Bloom 4-5 questions for DDIA Ch1, Ch5, Ch6)
- **UI:** Added `QuestionTypeBadge` component in `review-step.tsx` with color-coded badges

### FASE 2: MC Two-Tier (mc2) Format
- **Migration:** `20260211020000_inline_quiz_mc2_format.sql` — adds `mc2` to format check, adds `justification_hint` column
- **Types:** Added `'mc2'` to `InlineQuizFormat`, `justificationHint` to `InlineQuiz`
- **Component:** Rewrote `inline-quiz.tsx` with state machine: `unanswered → mc_answered → justified → answered`
- **Progress:** Added `justification` field to `ReviewStepState.inlineAnswers`
- **Data flow:** Updated `page.tsx`, `section-content.tsx`, `review-step.tsx` to pass `justificationHint`

### FASE 3: Obligatory Self-Explanation
- **Component:** Rewrote `self-explanation.tsx` — required prop, minLength, character counter, nudge timer, contextual prompts
- **Gate:** `concept-section.tsx` — advance button disabled until self-explanation valid (50 chars if <80%, 30 if ≥80%)
- **API:** Created `src/app/api/self-explanation/validate/route.ts` — fire-and-forget LLM validation

### FASE 4: Practice Evaluation with Scaffolding
- **New step:** `practice-eval` added between REVIEW and EVALUATE in `STEP_ORDER`
- **Component:** Created `practice-eval-step.tsx` — fetches high-order questions, 3 scaffold levels (hints → rubric → unassisted)
- **Progress:** Added `PracticeEvalState` and `PracticeEvalAnswer` to `learn-progress.ts`
- **Flow:** Updated `learn-flow.tsx` with new step rendering and state management
- **TOC:** Updated `learn-toc.tsx` with practice-eval step
- **Translations:** Added `learn.step.practiceEval`

### FASE 5: Confidence Calibration
- **Migration:** `20260211030000_evaluation_predicted_score.sql` — adds `predicted_score` to `evaluations`
- **UI:** Updated `evaluation-flow.tsx` — ReviewPrediction slider in intro, comparison in results
- **API:** Updated `evaluate/submit/route.ts` — saves `predicted_score` to DB

### FASE 6: Review Interleaved
- **Algorithm:** `interleaveByConcept()` helper — greedy, no 2 consecutive same-concept items
- **UI:** Flat interleaved list with concept origin badges, position counter (N/total)
- **Rewrite:** `review-step.tsx` — replaced section-grouped rendering with flat interleaved rendering

## Files Created (4)
- `supabase/migrations/20260211010000_question_bank_new_types.sql`
- `supabase/migrations/20260211020000_inline_quiz_mc2_format.sql`
- `supabase/migrations/20260211030000_evaluation_predicted_score.sql`
- `scripts/seed-high-order-questions.ts`
- `src/components/practice-eval-step.tsx`
- `src/app/api/self-explanation/validate/route.ts`

## Files Modified (12)
- `src/types/index.ts`
- `src/lib/llm/rubrics.ts`
- `src/lib/llm/schemas.ts`
- `src/lib/learn-progress.ts`
- `src/lib/translations.ts`
- `src/components/inline-quiz.tsx`
- `src/components/review-step.tsx`
- `src/components/self-explanation.tsx`
- `src/components/concept-section.tsx`
- `src/components/learn-flow.tsx`
- `src/components/learn-toc.tsx`
- `src/app/learn/[resourceId]/page.tsx`
- `src/components/section-content.tsx`
- `src/app/evaluate/[resourceId]/evaluation-flow.tsx`
- `src/app/api/evaluate/submit/route.ts`

## Research Base
- Transfer-Appropriate Processing (practice same format as test)
- ICAP framework (Constructive > Active > Passive)
- Chi & Wylie 2014 (self-explanation = highest-impact individual intervention)
- Two-tier MC (doubles learning vs simple MC)
- Gardner-Medwin (confidence calibration)

## Pending
- Run 3 migrations against Supabase
- Run `npx tsx scripts/seed-high-order-questions.ts`
- Seed mc2 quizzes for Ch5 (convert some existing MC to mc2)
- End-to-end testing of new learn flow steps
- Seed inline quizzes for remaining DDIA chapters
