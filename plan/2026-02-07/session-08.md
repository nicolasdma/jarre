# Session 08 — AI Tutor: Chat + Orchestrator Design
**Date:** 2026-02-07

## What was done

### 1. Socratic Tutor Chat (IMPLEMENTED)

Created a context-aware AI tutor that lives inside each playground sidebar.

**5 new files:**
- `src/lib/llm/streaming.ts` — `callDeepSeekStream()` for SSE streaming
- `src/lib/llm/tutor-prompts.ts` — Socratic system prompt + 4 state serializers
- `src/app/api/playground/tutor/route.ts` — streaming chat API (reactive + proactive modes)
- `src/components/playground/tabbed-sidebar.tsx` — "Lecciones" / "Tutor IA" tab switcher
- `src/components/playground/tutor-panel.tsx` — chat UI with streaming + proactive questions

**4 modified files (playground integrations):**
- `consensus-playground.tsx` — accent `#991b1b`, triggers: election, partition, commit
- `replication-playground.tsx` — accent `#2d4a6a`, triggers: violation, crash, split brain
- `partition-playground.tsx` — accent `#059669`, triggers: rebalance >30% keys moved
- `latency-playground.tsx` — accent `#d97706`, triggers: SLO violation >10%, p99 > 3x p50

**Build:** `npm run build` passes with zero errors.

### 2. Embodied Tutor Orchestrator (DESIGNED, NOT IMPLEMENTED)

Designed the architecture for a tutor that doesn't just chat — it interacts with the playground visuals (glows, dims, annotations, traces). Full design doc at `plan/2026-02-07/tutor-orchestrator-design.md`.

### 3. LLM Cost Analysis for Orchestrator

Compared models for the orchestrator use case (~1,100 tokens/call, needs structured JSON, low latency):

| Model | Input/1M | Output/1M | Cost x 1K calls | Latency |
|---|---|---|---|---|
| Gemini 2.0 Flash | $0.10 | $0.40 | ~$0.17 | ~800ms |
| DeepSeek V3.1 | $0.15 | $0.75 | ~$0.28 | ~1.5s |
| Kimi K2 0905 | $0.39 | $1.90 | ~$0.73 | ~2s |
| Local (Qwen3 8B) | $0 | $0 | $0 | 3-5s |

**Decision:** Gemini 2.0 Flash as primary (cheapest API + fastest), DeepSeek as fallback.

## Decisions made
- Tutor uses Socratic method (never gives direct answers)
- All text in Spanish
- Proactive questions have 30s cooldown
- No auth required for tutor API (playgrounds are public)
- Orchestrator will use structured JSON actions (glow, dim, annotate, trace, shake, pulse, spotlight)

## Next session
- [ ] Implement tutor orchestrator (3-layer architecture: Brain → Nervous System → Body)
- [ ] Add Gemini Flash client
- [ ] Create TutorOrchestrator React Context
- [ ] Add `useTutorOverlay(elementId)` hook
- [ ] CSS effects: glow, dim, annotate, trace
- [ ] Integrate with consensus playground first, then remaining 3
