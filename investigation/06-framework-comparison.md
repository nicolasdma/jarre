# Framework Comparison — Side by Side

## Summary Table

| | **LiveKit Agents** | **Pipecat** | **TEN Framework** | **Gemini Live (current)** |
|---|---|---|---|---|
| **Backend language** | Python + **Node.js** | Python only | C++/Go/Python | TypeScript (direct) |
| **React SDK** | Yes (`@livekit/components-react`) | Yes (`@pipecat-ai/client-react`) | No | Manual (our code) |
| **Latency E2E** | 600-900ms | 500-800ms | ~500-800ms | **280-350ms** |
| **Self-hosting** | Full (own SFU) | Partial (needs Daily.co) | Partial (needs Agora) | N/A (Google API) |
| **Tool calling** | Well documented, Zod schemas | Well documented, FunctionSchema | Basic, poor docs | Supported |
| **Provider integrations** | 10-20 | **80+** | 5-15 | Gemini only |
| **Turn detection** | Semantic model + Silero | Smart Turn Model + Silero | Own VAD (very fast) | Google black box |
| **Operational complexity** | +2 services (LK server + agent) | +2 services (Daily + Python bot) | Docker + Agora | 0 extra services |
| **Infra cost** | $0-50/month + AI providers | $0-10/month + Daily free tier + AI providers | Agora pricing + providers | Only Gemini tokens |
| **Maturity** | High ($1B valuation) | High (Daily.co backing) | **Low-Medium** | High |
| **GitHub stars** | 9.3k | 10.4k | 10.1k (inflated vs real adoption) | — |
| **Memory management** | Manual (ChatContext array) | Auto-summarization + Mem0 | Unknown | Manual (our compression) |
| **Structured conversations** | Manual | Pipecat Flows (state machines) | Via graph | Our prompt system |
| **Interruption quality** | Good (configurable) | Good (but false positives reported) | Good (fast VAD) | Good (native) |
| **WebRTC** | Own SFU (self-hosteable) | Daily.co SFU | Agora SFU | N/A (WebSocket) |

## Decision Matrix (Weighted)

Weights reflect Jarre's priorities: TypeScript compatibility, latency, cost for long sessions, and pedagogical features.

| Criterion | Weight | LiveKit | Pipecat | TEN | Gemini Live |
|-----------|--------|---------|---------|-----|-------------|
| TypeScript/Node.js support | 25% | 8/10 | 3/10 | 2/10 | **10/10** |
| Latency | 20% | 6/10 | 6/10 | 6/10 | **10/10** |
| Cost for long sessions | 20% | **8/10** | **8/10** | 7/10 | 3/10 |
| Tool calling quality | 10% | **9/10** | 8/10 | 4/10 | 7/10 |
| Provider flexibility | 10% | 7/10 | **10/10** | 5/10 | 2/10 |
| Operational simplicity | 10% | 5/10 | 4/10 | 3/10 | **10/10** |
| Documentation | 5% | 8/10 | **8/10** | 3/10 | 7/10 |
| **Weighted Score** | | **7.15** | **5.95** | **4.35** | **7.35** |

## Interpretation

1. **Gemini Live (7.35)** — Best overall score due to TypeScript nativeness, latency, and zero operational overhead. Only weakness is cost for long sessions.

2. **LiveKit Agents (7.15)** — Close second. Loses on latency and operational complexity but wins on cost for long sessions and provider flexibility. **Best migration target when needed.**

3. **Pipecat (5.95)** — Technically excellent but Python-only backend kills the score for a TypeScript project.

4. **TEN Framework (4.35)** — Immature, poor docs, vendor lock-in. Not viable.

## When Each Framework Wins

### Gemini Live wins when:
- Sessions are short (<15 min)
- Latency is the top priority
- You want minimal operational complexity
- Budget per session is acceptable

### LiveKit Agents wins when:
- Sessions are long (30+ min)
- You need to swap LLM providers
- You want self-hosted infrastructure
- You need TypeScript on the agent server
- You need multi-agent handoffs

### Pipecat wins when:
- Your backend is already Python
- You need 80+ provider integrations
- You want structured conversation flows (state machines)
- You need the most granular pipeline control
- You need built-in context summarization

### TEN Framework wins when:
- You need avatar integration (Live2D, HeyGen)
- Your backend is C++/Go
- You need visual graph editing for non-developers

## Cost Comparison (4 hours/day, 30 days/month)

| Architecture | Monthly Cost | Notes |
|-------------|-------------|-------|
| Gemini Live (current) | $1,000-1,590 | Context accumulation problem |
| LiveKit Cloud + Deepgram + Groq + Cartesia | $319-391 | No context accumulation |
| LiveKit Self-hosted + Deepgram + Groq + Cartesia | $200-300 | Save on LiveKit hosting |
| LiveKit + Deepgram + Groq + Kokoro (self-hosted) | $110-182 | Cheapest viable option |
| Pipecat Cloud + providers | $320-400 | Similar to LiveKit |

## Latency Comparison (Detailed)

```
Gemini Live (native speech-to-speech):
  Total: ~300ms  ████████░░

LiveKit (Deepgram + Groq + Cartesia):
  STT:    150ms  ███░░░░░░░
  LLM:    250ms  █████░░░░░
  TTS:    120ms  ██░░░░░░░░
  WebRTC:  80ms  █░░░░░░░░░
  Total: ~600ms  ████████████░░░░

Pipecat (Deepgram + Groq + Cartesia):
  STT:    200ms  ████░░░░░░
  LLM:    250ms  █████░░░░░
  TTS:    172ms  ███░░░░░░░
  WebRTC:  80ms  █░░░░░░░░░
  Total: ~700ms  ██████████████░░░░

Human conversation baseline:
  Total: ~200ms  ████░░░░░░
```
