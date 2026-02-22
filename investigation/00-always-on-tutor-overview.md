# Always-On AI Tutor — Investigation Overview

**Date:** 2026-02-22
**Status:** Research complete, proposal defined
**Decision:** LiveKit Agents as migration target, Gemini Live retained short-term

## Documents in this investigation

| File | Contents |
|------|----------|
| `01-current-system-analysis.md` | Deep analysis of existing Gemini Live implementation |
| `02-market-landscape.md` | Voice AI market, competitors, pricing, opportunity analysis |
| `03-livekit-agents-deep-dive.md` | Full technical evaluation of LiveKit Agents |
| `04-pipecat-deep-dive.md` | Full technical evaluation of Pipecat (Daily.co) |
| `05-ten-framework-deep-dive.md` | Full technical evaluation of TEN Framework (descartado) |
| `06-framework-comparison.md` | Side-by-side comparison of all options |
| `07-proposal.md` | Recommended architecture and migration strategy |

## Vision

Evolve Jarre from episodic voice sessions to an ambient, always-on tutor:
- Whenever Jarre is open, the tutor is active
- Continuous back-and-forth conversation
- Feels like a human tutor "in the room"
- Zero friction to start talking

## Key Constraints

- **Latency:** Near real-time (<800ms acceptable, <500ms ideal)
- **Cost:** Must be viable for hours-long sessions ($0.02-0.06/min target)
- **Quality:** Must feel meaningfully better than current Gemini-based interactions
- **Stack:** Must integrate with Next.js + TypeScript (no Python if possible)

## TL;DR

1. **Gemini Live (current)** is excellent for short sessions (<15 min) but cost-prohibitive for always-on
2. **LiveKit Agents** is the best migration target (Node.js SDK, self-hosteable, Zod tool calling)
3. **Pipecat** is technically superior but Python-only (deal-breaker for our stack)
4. **TEN Framework** is immature and locked to Agora (descartado)
5. **Handy** is a dictation tool, irrelevant for conversational AI
6. **Recommended strategy:** Hybrid — Gemini Live for evaluations, LiveKit pipeline for long sessions
