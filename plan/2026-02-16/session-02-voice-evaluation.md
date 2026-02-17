# Session 02 — Voice Evaluation (Socratic) + Teach the Tutor

> Date: 2026-02-16
> Duration: ~1 session (all 3 planned sessions completed in one)

## Goals
- Replace textarea-based evaluation with oral Socratic assessment via Gemini Live
- Add Level 4 "Teach the Tutor" advancement pathway
- Maintain full backwards compatibility with text evaluations

## What Was Done

### Phase 1: DB + Prompts (Infrastructure)

1. **Migration** `20260216060000_voice_evaluation.sql`:
   - `voice_sessions.session_type` (teaching | evaluation)
   - `voice_sessions.resource_id` (nullable FK to resources)
   - `voice_sessions.section_id` now nullable (eval sessions don't need a section)
   - `evaluations.voice_session_id` (FK to voice_sessions)
   - `evaluations.eval_method` (text | voice)

2. **Prompts** `src/lib/llm/voice-eval-prompts.ts`:
   - `buildVoiceEvalInstruction()` — Stealth oral assessment (WARM-UP → EXPLAIN → PROBE → CONNECT → CHALLENGE)
   - `buildVoiceScoringPrompt()` — DeepSeek analyzes transcripts, produces per-concept scores
   - `buildVoiceTeachInstruction()` — AI acts as confused junior engineer
   - `buildVoiceTeachScoringPrompt()` — DeepSeek evaluates teaching quality

3. **Schema** `VoiceEvalScoringResponseSchema` — aliases `EvaluateAnswersResponseSchema` for compatibility

4. **Types/Constants**:
   - `MasteryTriggerType` += `voice_evaluation`, `teach_session`
   - `LEVEL_4_SCORE = 80`, `XP_REWARDS.VOICE_EVAL_COMPLETE = 30`
   - `canAdvanceToLevel4()`, `computeNewLevelFromTeaching()` in mastery.ts

### Phase 2: Backend

5. **Refactor** `src/lib/evaluate/save-results.ts`:
   - Extracted ~140 lines of evaluation saving logic from submit/route.ts
   - Shared by both text and voice endpoints
   - Handles: evaluation record, questions, responses, mastery updates, review schedule, user stats, XP

6. **Modified** `/api/voice/session/start`:
   - Accepts `sessionType`, `resourceId`
   - Validates based on session type

7. **New endpoint** `/api/evaluate/voice-score`:
   - Fetches transcripts, validates minimum quality (≥4 user turns, ≥3 min)
   - Calls DeepSeek for scoring, saves via shared save-results

8. **New endpoint** `/api/evaluate/voice-teach-score`:
   - Scores teaching sessions, handles Level 3→4 advancement
   - Awards mastery advance XP

### Phase 3: Frontend

9. **Parametrized** `useVoiceSession`:
   - Added: `systemInstructionOverride`, `sessionType`, `resourceId`, `maxDurationMs`, `initialMessage`
   - Exported `TutorState`, `VoiceSession` types
   - Exposed `sessionId` for scoring reference

10. **New hook** `useVoiceEvalSession`:
    - Wraps useVoiceSession with eval instruction + 10-min timer
    - Auto-scores on disconnect (manual or AI-driven)
    - States: `idle → connecting → conversing → scoring → done`

11. **New component** `VoiceEvaluationFlow`:
    - 4 phases: INTRO (concepts + mic button), SESSION (waveform + progress bar), SCORING (spinner), RESULTS (score + rubric + per-concept feedback)
    - Drop-in replacement for EvaluationFlow (same props)
    - "Prefiero escribir" fallback to text mode

12. **Integrated in** `LearnFlow`:
    - Step `evaluate` now defaults to VoiceEvaluationFlow
    - `evalMode` state ('voice' | 'text') with switchable fallback

### Phase 4: Level 4 — Teach the Tutor

13. **New hook** `useVoiceTeachSession`:
    - 8-minute max, uses teach prompt (confused junior)
    - Calls voice-teach-score endpoint after session

14. **New component** `VoiceTeachFlow`:
    - Full inline UI for teach sessions
    - Shows mastery advancement result (3→4 with animation, or retry suggestion)

15. **Integrated in** `ConceptDetailPanel`:
    - Level 3 concepts show "Teach this concept" button (warm color, mic icon)
    - Clicking opens VoiceTeachFlow inline in the side panel
    - Score >= 80% advances to Level 4

## Architecture Decision: Reuse vs New

Chose to parametrize the existing `useVoiceSession` hook rather than creating a parallel implementation. This avoids duplicating ~400 lines of AudioWorklet/WebSocket code. The new hooks (`useVoiceEvalSession`, `useVoiceTeachSession`) are thin wrappers that provide eval-specific behavior.

## Files Created (6)
- `supabase/migrations/20260216060000_voice_evaluation.sql`
- `src/lib/llm/voice-eval-prompts.ts`
- `src/lib/evaluate/save-results.ts`
- `src/app/api/evaluate/voice-score/route.ts`
- `src/app/api/evaluate/voice-teach-score/route.ts`
- `src/components/voice/use-voice-eval-session.ts`
- `src/components/voice/use-voice-teach-session.ts`
- `src/components/voice/voice-evaluation-flow.tsx`
- `src/components/voice/voice-teach-flow.tsx`

## Files Modified (8)
- `src/components/voice/use-voice-session.ts` (parametrized)
- `src/app/api/voice/session/start/route.ts` (sessionType, resourceId)
- `src/app/api/evaluate/submit/route.ts` (refactored to use save-results)
- `src/components/learn-flow.tsx` (VoiceEvaluationFlow + fallback)
- `src/components/system-viz/concept-detail-panel.tsx` (teach button)
- `src/lib/mastery.ts` (Level 4 functions)
- `src/lib/constants.ts` (LEVEL_4_SCORE, VOICE_EVAL_COMPLETE)
- `src/lib/llm/schemas.ts` (VoiceEvalScoringResponseSchema)
- `src/types/index.ts` (MasteryTriggerType extended)

## Verification Status
- [x] TypeScript compiles (tsc --noEmit)
- [x] Next.js build succeeds
- [x] Migration applied to Supabase
- [ ] End-to-end voice eval test (needs mic + Gemini API)
- [ ] End-to-end teach session test
- [ ] Verify mastery 3→4 advancement

## Next Steps
- Test voice evaluation flow end-to-end
- Test teach-the-tutor flow end-to-end
- Consider adding a "recent voice evaluations" section to dashboard
