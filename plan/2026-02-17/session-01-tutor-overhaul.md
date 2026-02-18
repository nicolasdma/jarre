# Session 01 — Tutor Model Overhaul (2026-02-17)

## Goal
Transform the Socratic-only tutor into a hybrid adaptive model with escalation, post-evaluation consolidation, and cross-session misconception memory.

## What Was Done

### Phase 1: Prompts Overhaul (3 files)
- **`voice-prompts.ts`**: Added AutoTutor escalation (pump→hint→prompt→assertion), Revoicing, Think-Aloud, session structure (warm-up→core→closing), INTERNAL REASONING section, mastery-adaptive proportions (level 0-1: 40/40/20, level 2-3: 80/10/10), previousSessionContext injection, reinforced anti-sycophancy
- **`voice-eval-prompts.ts`**: Added masteryLevel-based depth guidance, knownMisconceptions probing, AI detection (linguistic register change), misconceptions/strengths in scoring JSON output, specific misconception injection in teach-the-tutor mode
- **`voice-practice-prompts.ts`**: Added Productive Failure phase (struggle first, guide after), AutoTutor escalation, knownMisconceptions injection, misconceptions/strengths in scoring output

### Phase 2: Post-Evaluation Consolidation (5 files)
- **Created `consolidation-prompts.ts`**: Generates per-concept consolidation (ideal answer, divergence, connections, review suggestion)
- **Updated `schemas.ts`**: New `VoiceEvalScoringResponseSchema` with misconceptions/strengths per response, `ConsolidationResponseSchema`, `VoicePracticeScoringResponseSchema` with same additions
- **Updated `voice-score/route.ts`**: Calls consolidation after scoring, updates learner memory, returns consolidation in response
- **Updated `voice-practice-score/route.ts`**: Same consolidation + memory integration
- **Updated `voice-evaluation-flow.tsx`**: Expandable consolidation section per concept (ideal answer, divergence, connections, review)
- **Updated `voice-practice-flow.tsx`**: Simplified consolidation (ideal answer + what to review)

### Phase 3: Learner Concept Memory (8 files)
- **Created migration `20260217090000_learner_concept_memory.sql`**: Table with RLS, misconceptions/strengths as JSONB, escalation_level
- **Created `learner-memory.ts`**: `getLearnerConceptMemory()`, `updateLearnerConceptMemory()` (accumulates, deduplicates), `formatMemoryForPrompt()`
- **Updated `tables.ts`**: Added `learnerConceptMemory`
- **Updated `voice-teach-score/route.ts`**: Saves misconceptions/strengths after teach scoring
- **Updated `voice/session/context/route.ts`**: Returns learner memory alongside conversation summary
- **Updated `use-voice-session.ts`**: Fetches learner memory, injects into system instruction via formatMemoryForPrompt
- **Updated `use-voice-eval-session.ts`**: EvaluationResult type includes consolidation
- **Updated `use-voice-practice-session.ts`**: PracticeResult type includes consolidation

## Files Created (3)
- `src/lib/llm/consolidation-prompts.ts`
- `src/lib/learner-memory.ts`
- `supabase/migrations/20260217090000_learner_concept_memory.sql`

## Files Modified (10)
- `src/lib/llm/voice-prompts.ts`
- `src/lib/llm/voice-eval-prompts.ts`
- `src/lib/llm/voice-practice-prompts.ts`
- `src/lib/llm/schemas.ts`
- `src/lib/db/tables.ts`
- `src/app/api/evaluate/voice-score/route.ts`
- `src/app/api/evaluate/voice-practice-score/route.ts`
- `src/app/api/evaluate/voice-teach-score/route.ts`
- `src/app/api/voice/session/context/route.ts`
- `src/components/voice/use-voice-session.ts`
- `src/components/voice/use-voice-eval-session.ts`
- `src/components/voice/use-voice-practice-session.ts`
- `src/components/voice/voice-evaluation-flow.tsx`
- `src/components/voice/voice-practice-flow.tsx`

## Verification
- `npx tsc --noEmit` — 0 errors
- `npm run build` — successful

## Decisions
- Misconceptions accumulate (not replace) — a concept can have misconceptions from multiple evaluations
- Consolidation runs in parallel with memory updates (not blocking)
- Consolidation uses DeepSeek (text, not voice) — cheaper and more structured
- Schemas use `.optional().default([])` for backward compatibility with existing scoring data
- Learner memory injected into ALL session types (teaching, eval, practice) via formatMemoryForPrompt

## Pending
- [ ] Run migration against Supabase: `20260217090000_learner_concept_memory.sql`
- [ ] Manual test: complete evaluation → verify consolidation appears
- [ ] Manual test: complete evaluation → verify misconceptions saved in DB → start new session → verify tutor probes known misconceptions
- [ ] Consider adding "Mark as reviewed" button for consolidation items
