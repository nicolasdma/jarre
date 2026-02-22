# Proposal: Always-On Tutor Architecture

**Date:** 2026-02-22
**Author:** Investigation session
**Status:** Proposed

## Recommendation: Hybrid Architecture (Phased)

### Phase 1: Optimize Current System (Now — 2 weeks)

**Goal:** Make Gemini Live feel "always present" without being always connected.

No new infrastructure. Maximize what we already have:

1. **Instant reconnection**: When user returns to tab, reconnect in <1s using cached resumption handle
2. **Context persistence between micro-sessions**: Store conversation state so reconnecting feels seamless
3. **"Continue talking" UX**: One-tap to resume conversation, tutor remembers exactly where you left off
4. **Staleness-aware greeting**: Already have staleness detection (recent/fresh/stale) — use it for natural re-engagement
5. **Background audio**: Keep mic/audio active even when navigating between sections (opt-in)

**Cost:** $0 additional
**Latency:** Same as current (280-350ms)
**Risk:** Low

### Phase 2: LiveKit Spike (Week 3-4)

**Goal:** Validate LiveKit Agents pipeline latency and quality with real hardware.

Build a minimal proof-of-concept with **two STT options and two LLM options**:

```
Pipeline A: Deepgram Nova-3 (STT) → Groq Llama 3.3 70B (LLM) → Cartesia Sonic (TTS)
Pipeline B: Groq Whisper (STT)    → Groq Llama 3.3 70B (LLM) → Cartesia Sonic (TTS)
Pipeline C: Deepgram Nova-3 (STT) → DeepSeek V3 (LLM)        → Cartesia Sonic (TTS)
```

#### STT Comparison: Deepgram vs Groq Whisper

| | Deepgram Nova-3 | Groq Whisper |
|---|---|---|
| Streaming (interim results) | Yes | No |
| Latency | ~150ms | ~50-100ms (batch) |
| Cost | $0.0043/min | Cheaper |
| UX responsiveness | Better (user sees they're being heard) | Faster total but no interim feedback |

Deepgram is likely better for conversation (interim results give immediate feedback). Groq is faster total but no streaming. **Test both.**

#### LLM Comparison: Groq Llama vs DeepSeek V3

| | Groq Llama 3.3 70B | DeepSeek V3 |
|---|---|---|
| TTFT | ~200ms | ~500-700ms |
| Pedagogical quality | Unknown (must test) | Proven (current system) |
| Cost | ~$0.59/$0.79 per 1M tokens | ~$0.27/$1.10 per 1M tokens |
| Use case | Quick turns, simple Q&A | Deep reasoning, evaluation |

**Test with real Jarre pedagogical prompts** — not generic benchmarks. The question is whether Llama 3.3 can:
- Detect misconceptions in student explanations
- Ask probing follow-up questions
- Maintain Socratic dialogue quality

If Llama quality is insufficient, the spike should also validate **intelligent LLM routing**:
- Simple turns ("what is backpropagation?") → Groq Llama (fast)
- Complex turns (evaluation, connections, debate) → DeepSeek V3 (better quality)

Using:
- [agent-starter-node](https://github.com/livekit-examples/agent-starter-node)
- [agent-starter-react](https://github.com/livekit-examples/agent-starter-react)
- LiveKit Cloud Build tier (free, 1000 min/month)

**Measure:**
- End-to-end latency per pipeline combination (target: <800ms)
- Turn-taking quality (false interruptions, missed endings)
- Audio quality vs Gemini Live
- Reconnection behavior
- Tool calling reliability
- **Memory stability in 30+ minute sessions** (critical for always-on)
- **Pedagogical quality**: Groq Llama vs DeepSeek with real Jarre prompts

**Success criteria:**
- Latency consistently <800ms (at least one pipeline combination)
- Turn-taking feels natural (no worse than Gemini)
- Tool calling works reliably with Zod schemas
- **No memory leaks in 30-minute sessions** (not just 15 min — always-on requires longer validation)
- At least one LLM option produces acceptable pedagogical quality

**Cost:** $0 (free tiers)
**Risk:** Medium (Node.js SDK is 6 months old, known issues)

### Phase 3: Gradual Migration (Month 2-3)

**Only proceed if Phase 2 succeeds.**

Migrate low-stakes voice modes first:

| Priority | Mode | Why |
|----------|------|-----|
| 1st | **freeform** | Least structured, latency less critical |
| 2nd | **exploration** | Conversational, no scoring |
| 3rd | **learning** (sidebar) | Supplementary, not evaluative |
| 4th | **practice** | Has scoring but lower stakes |
| Last | **eval, teaching, debate** | High stakes, latency matters most |

**Architecture:**

```
┌─────────────────────────────────────────────┐
│ Next.js App                                  │
│                                              │
│  ┌─────────┐     ┌─────────────────────┐    │
│  │ Voice   │     │ Voice Session       │    │
│  │ Panel   │────▶│ Router              │    │
│  └─────────┘     │                     │    │
│                  │ eval/debate/teach    │    │
│                  │   → Gemini Live      │    │
│                  │                     │    │
│                  │ freeform/explore     │    │
│                  │   → LiveKit Agent    │    │
│                  └─────────────────────┘    │
└─────────────────────────────────────────────┘
         │                    │
    WebSocket            WebRTC
         │                    │
    Gemini API         LiveKit Server
                            │
                      Agent Server (Node.js)
                      ├─ Deepgram STT
                      ├─ Groq LLM
                      └─ Cartesia TTS
```

**Key implementation details:**

1. **Shared interfaces**: Both pipelines must implement the same voice session interface:
   - `connect()`, `disconnect()`
   - `onTranscript(role, text)`
   - `onToolCall(functionCalls)`
   - `onAudioLevel(level)`
   - Session lifecycle (start, context, transcript, end)

2. **Shared backend**: Voice session API routes remain the same. Only the audio transport changes.

3. **Learner memory**: Same `learner-memory.ts` feeds both pipelines.

4. **Scoring**: Post-session scoring (via DeepSeek) remains identical regardless of pipeline.

5. **Transcriptions come free**: With LiveKit pipeline, transcriptions are a natural byproduct of the STT step (user speech) and the LLM output (tutor speech). No need for Gemini's separate transcription feature. This actually simplifies the `voice_transcripts` save flow — the transcript is already text before it reaches TTS.

### Phase 4: Always-On Mode (Month 3-4)

**Only once LiveKit pipeline is stable.**

1. **Persistent connection**: LiveKit room stays open while Jarre is open
2. **Continuous listening**: VAD-triggered — mic is active but only processes when user speaks
3. **Context windowing**: Rolling 15-minute context window with progressive summarization
4. **Intelligent LLM routing** (validated in spike):
   - Simple turns → Groq Llama (fast, cheap)
   - Complex reasoning → DeepSeek V3 (better quality)
   - Routing heuristic: turn length, presence of evaluation keywords, conversation depth

**Target metrics:**
- Cost: <$0.05/min (~$12/day for 4hr)
- Latency: <800ms for simple turns, <1.2s for complex reasoning
- Session duration: Unlimited (with context windowing)

## Cost Projection

| Phase | Monthly Cost | Delta from Current |
|-------|-------------|-------------------|
| Phase 1 (optimize current) | ~$50-100 (current usage) | $0 |
| Phase 2 (spike) | ~$50-100 + $0 (free tier) | $0 |
| Phase 3 (hybrid) | ~$150-250 | +$50-150 |
| Phase 4 (always-on) | ~$300-400 | +$200-300 |

## Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| LiveKit Node.js SDK memory leaks | **High** | **High** | **Blocking for always-on.** Test 30+ min sessions in spike. Monitor heap growth. Report upstream if found. |
| `preemptiveGeneration` double-billing | **Known bug** | **High** | Disable until [#4219](https://github.com/livekit/agents/issues/4219) fixed. Accept +200ms latency. |
| Latency >800ms consistently | Low | High | Fall back to Gemini Live for all modes |
| Groq Llama pedagogical quality insufficient | Medium | High | Fallback to DeepSeek V3 for complex turns, or hybrid routing |
| Groq rate limits for long sessions | Medium | Medium | Fallback to Gemini Flash or DeepSeek |
| Turn detection too sensitive | Medium | Medium | Tune `minEndpointingDelay`, `falseInterruptionTimeout` |
| Tool calling unreliable | Low | High | Test exhaustively in spike phase |
| EU Cloud latency 4+ seconds | Known | High | **Must deploy in US region.** Self-host if needed. |

## What NOT To Build

1. **Don't build a custom voice framework** — LiveKit/Pipecat already solved this
2. **Don't self-host STT/TTS yet** — API costs are manageable, self-hosting adds DevOps burden
3. **Don't migrate evaluations early** — these are the highest-stakes interactions, latency matters most
4. **Don't build progressive compression from scratch** — reuse existing `cached_summary` + `compress` endpoint logic
5. **Don't try full-duplex on custom pipeline** — accept turn-based for now, it's good enough for tutoring

## Open Questions

1. **Groq Llama vs DeepSeek for pedagogy:** Must test with real Jarre prompts in spike. If Llama is insufficient, validate intelligent routing (simple→Groq, complex→DeepSeek).
2. **Deepgram vs Groq Whisper for STT:** Deepgram has streaming interim results (better UX), Groq is faster total. Test both in spike.
3. **LiveKit Cloud vs self-hosted:** Free tier (1000 min) is enough for spike. Production may need self-hosted to control costs and latency (especially to avoid EU latency issues).
4. **Voice cloning:** Should the tutor have a consistent, custom voice? Cartesia supports voice cloning.
5. **Multilingual turn detection:** LiveKit's `MultilingualModel()` — how well does it work with Spanish (Rioplatense)?
6. **LLM routing heuristic:** How to classify turns as "simple" vs "complex" for routing? Options: turn length, keyword detection, or a lightweight classifier.

## Decision Criteria for Go/No-Go

After Phase 2 spike, evaluate:

| Criterion | Go | No-Go |
|-----------|-----|--------|
| Latency | <800ms median | >1000ms median |
| Turn quality | Comparable to Gemini | Noticeably worse |
| Tool calling | Works reliably | Unreliable/crashes |
| **Memory stability (30+ min)** | **No leaks, stable heap** | **Leaks, crashes, or growing memory** |
| Audio quality | Acceptable | Noticeably worse |
| **Pedagogical quality** | **At least one LLM option adequate** | **Neither Llama nor DeepSeek works in pipeline** |

If No-Go: Continue with Gemini Live, revisit in 3 months when Node.js SDK matures.

## Timeline

```
Week 1-2:  Phase 1 — Optimize current Gemini Live UX
Week 3-4:  Phase 2 — LiveKit spike (PoC)
           ├─ Go/No-Go decision
Week 5-8:  Phase 3 — Gradual migration (freeform → exploration → learning)
Week 9-12: Phase 4 — Always-on mode (if Phase 3 stable)
```

## Appendix: LiveKit Agent Skeleton for Jarre

```typescript
// jarre-agent/src/agent.ts
import { voice, llm, defineAgent } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import * as livekit from '@livekit/agents-plugin-livekit';
import { z } from 'zod';

export default defineAgent({
  prewarm: async (proc) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    // Fetch session context from Jarre API
    const sessionConfig = ctx.room.metadata
      ? JSON.parse(ctx.room.metadata)
      : {};

    const { sessionType, systemPrompt, learnerMemory, tools } = sessionConfig;

    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad,
      stt: new deepgram.STT({ model: 'nova-3' }),
      llm: new openai.LLM({
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      tts: new cartesia.TTS({
        model: 'sonic-3',
        voiceId: process.env.CARTESIA_VOICE_ID,
      }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      allowInterruptions: true,
      minInterruptionDuration: 0.5,
      falseInterruptionTimeout: 2.0,
      resumeFalseInterruption: true,
    });

    await ctx.connect();
    const participant = await ctx.waitForParticipant();

    const agent = new JarreTutor(systemPrompt, learnerMemory);

    await session.start(ctx.room, participant, { agent });
  },
});

class JarreTutor extends voice.Agent {
  constructor(systemPrompt: string, learnerMemory: unknown) {
    const instructions = `${systemPrompt}

KNOWN ABOUT THIS STUDENT:
${JSON.stringify(learnerMemory, null, 2)}`;

    super({
      instructions,
      tools: {
        scrollToConcept: llm.tool({
          description: 'Scroll the UI to show a specific concept',
          parameters: z.object({ conceptId: z.string() }),
          execute: async ({ conceptId }, { ctx }) => {
            // RPC to frontend
            await ctx.room.localParticipant.performRpc({
              destinationIdentity: 'user',
              method: 'scrollToConcept',
              payload: JSON.stringify({ conceptId }),
            });
            return { scrolled: true };
          },
        }),
        showDefinition: llm.tool({
          description: 'Show a concept definition card in the UI',
          parameters: z.object({
            conceptId: z.string(),
            highlight: z.boolean().optional(),
          }),
          execute: async ({ conceptId, highlight }, { ctx }) => {
            await ctx.room.localParticipant.performRpc({
              destinationIdentity: 'user',
              method: 'showDefinition',
              payload: JSON.stringify({ conceptId, highlight }),
            });
            return { shown: true };
          },
        }),
        markDiscussed: llm.tool({
          description: 'Mark a concept as discussed',
          parameters: z.object({
            conceptId: z.string(),
            understood: z.boolean(),
          }),
          execute: async ({ conceptId, understood }, { ctx }) => {
            // Fire-and-forget to Jarre API
            fetch(`${process.env.JARRE_API_URL}/api/voice/mark-discussed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conceptId, understood }),
            }).catch(console.error);
            return { marked: true };
          },
        }),
        endSession: llm.tool({
          description: 'End the tutoring session',
          parameters: z.object({
            reason: z.enum(['completed', 'student_request', 'time_limit']),
          }),
          execute: async ({ reason }, { ctx }) => {
            ctx.disallowInterruptions();
            // Notify Jarre API
            await fetch(`${process.env.JARRE_API_URL}/api/voice/session/end`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason }),
            });
            return { ended: true, reason };
          },
        }),
      },
    });
  }
}
```
