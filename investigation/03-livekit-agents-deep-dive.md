# LiveKit Agents — Deep Technical Dive

## Overview

- **GitHub:** ~9.3k stars, 1M+ downloads/month
- **Funding:** $183M total ($100M Series C, Jan 2026, $1B valuation)
- **Used by:** OpenAI, xAI, Salesforce, Coursera, Spotify
- **Node.js SDK:** v1.0 since August 2025

## Architecture

```
[Browser/Next.js] <--WebRTC--> [LiveKit Server (SFU)] <--gRPC--> [Agent Server (Node/Python)]
                                                                    |
                                                          [STT] -> [LLM] -> [TTS]
```

**Key difference from Gemini Live:** Browser connects to a LiveKit "Room" via WebRTC. All AI pipeline complexity lives server-side in the Agent process. The frontend is simple — just a room participant.

**Data flow:**
1. Frontend connects to a Room via WebRTC (audio/video/data)
2. LiveKit Server dispatches a Job to the registered Agent Server
3. Agent Server launches a process that joins the room as a participant
4. Agent receives user audio via WebRTC, pipes through STT → LLM → TTS, publishes response audio back

## Node.js/TypeScript Support

SDK: `@livekit/agents` (npm), reached **v1.0 August 2025**.

### Available Node.js Plugins

| Category | Providers |
|----------|-----------|
| **STT** | Deepgram, OpenAI |
| **TTS** | Cartesia, ElevenLabs, Google, OpenAI, Rime, Neuphonic |
| **LLM** | OpenAI, Google, XAI (+ any OpenAI-compatible API like Groq) |
| **VAD** | Silero |

### Limitations vs Python SDK
- Fewer plugins (e.g., AssemblyAI STT only in Python)
- MCP not supported yet in JS
- Open issues about memory leaks and plugin cleanup
- Feature parity gaps

## Minimal Agent Example (Node.js)

```typescript
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
    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad,
      stt: new deepgram.STT({ model: 'nova-3' }),
      llm: new openai.LLM({
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      tts: new cartesia.TTS({ model: 'sonic-3' }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    await ctx.connect();
    const participant = await ctx.waitForParticipant();

    await session.start(ctx.room, participant, {
      agent: new MyTutorAgent(),
    });
  },
});

class MyTutorAgent extends voice.Agent {
  constructor() {
    super({
      instructions: 'You are a technical tutor...',
      tools: {
        lookupConcept: llm.tool({
          description: 'Look up a concept in the knowledge base',
          parameters: z.object({
            concept: z.string().describe('The concept to look up'),
          }),
          execute: async ({ concept }) => {
            return { definition: '...', mastery_level: 2 };
          },
        }),
      },
    });
  }
}
```

### LiveKit Inference (Simplified)

```typescript
const session = new voice.AgentSession({
  stt: 'deepgram/nova-3',
  llm: 'groq/gpt-oss-120b',
  tts: 'cartesia/sonic-3',
});
```

## Next.js Frontend Integration

### Token Generation (API Route)

```typescript
// app/api/livekit-token/route.ts
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  const { userId } = await req.json();

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: userId }
  );
  token.addGrant({ roomJoin: true, room: `session-${userId}` });

  return Response.json({ token: await token.toJwt() });
}
```

### React Component

```typescript
'use client';
import { AgentSessionProvider } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';

const tokenSource: TokenSource = {
  getToken: async () => {
    const res = await fetch('/api/livekit-token', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    const { token } = await res.json();
    return token;
  },
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL!,
};

export function VoiceSession() {
  return (
    <AgentSessionProvider tokenSource={tokenSource}>
      <AudioVisualizer />
      <TranscriptDisplay />
      <Controls />
    </AgentSessionProvider>
  );
}
```

**Key architectural shift:** With Gemini Live, the frontend (VoicePanel) directly manages WebSocket, PCM audio, and reconnection logic. With LiveKit, the frontend just connects to a room via WebRTC — all AI pipeline complexity lives on the agent server.

## Turn-Taking & Interruptions

Most sophisticated turn-taking system among the frameworks evaluated:

### Turn Detection Modes

1. **Turn Detector Model** (recommended): Open-weights transformer for semantic end-of-turn detection. Variants: `MultilingualModel()` and `EnglishModel()`
2. **VAD only**: Silence/voice detection with Silero VAD
3. **STT endpointing**: Uses phrase endpoints from STT
4. **Manual**: Full programmatic control

### Configuration

```typescript
const session = new voice.AgentSession({
  turnDetection: new livekit.turnDetector.MultilingualModel(),
  vad: await silero.VAD.load(),

  // Interruptions
  allowInterruptions: true,
  minInterruptionDuration: 0.5,  // min seconds of voice to interrupt

  // False interruption handling
  falseInterruptionTimeout: 2.0,  // wait before declaring false positive
  resumeFalseInterruption: true,  // resume where it left off

  // Preemptive generation (start generating before turn ends)
  preemptiveGeneration: true,

  // Timing
  minEndpointingDelay: 0.5,
  maxEndpointingDelay: 3.0,
});
```

**Comparison with Gemini Live:** Gemini handles VAD/turn-taking internally (black box). LiveKit gives much more control but also more configuration responsibility.

## Tool Calling

Fully supported with Zod schemas:

```typescript
class TutorAgent extends voice.Agent {
  constructor() {
    super({
      instructions: 'You are a tutor evaluating understanding...',
      tools: {
        checkMastery: llm.tool({
          description: 'Check mastery level for a concept',
          parameters: z.object({ conceptId: z.string() }),
          execute: async ({ conceptId }, { ctx }) => {
            const mastery = await db.getMastery(conceptId);
            return mastery;
          },
        }),

        saveEvaluation: llm.tool({
          description: 'Save evaluation results',
          parameters: z.object({
            score: z.number().min(0).max(4),
            misconceptions: z.array(z.string()),
          }),
          execute: async ({ score, misconceptions }, { ctx }) => {
            ctx.disallowInterruptions();  // non-reversible operation
            await db.saveResults({ score, misconceptions });
            return { saved: true };
          },
        }),
      },
    });
  }
}
```

**Advanced features:**
- Tools can call `ctx.session.say()` for verbal feedback during execution
- Tools can RPC to frontend (`room.localParticipant.performRpc()`)
- Dynamic tool updates with `agent.updateTools()`
- MCP support (Python only for now)
- `ToolError` for returning errors to LLM

## Session Memory / Context

```typescript
class TutorAgent extends voice.Agent {
  constructor(chatCtx?: ChatContext) {
    super({
      instructions: 'You are a tutor...',
      chatCtx,  // previous history
    });
  }

  // Hook: runs after each user turn, BEFORE LLM
  async onUserTurnCompleted(turnCtx: ChatContext, newMessage: ChatMessage) {
    const relevant = await ragLookup(newMessage.textContent());
    turnCtx.addMessage({
      role: 'assistant',
      content: `Context: ${relevant}`,
    });
  }
}

// In entrypoint, load previous context
entry: async (ctx) => {
  const initialCtx = new ChatContext();
  initialCtx.addMessage({
    role: 'system',
    content: `Student profile: ${JSON.stringify(learnerMemory)}`,
  });
  const agent = new TutorAgent(initialCtx);
}
```

**Progressive compression:** LiveKit does NOT have built-in progressive compression. `ChatContext` is an array of messages you control manually. You'd need to implement summarization yourself (same as current Gemini approach).

## Latency

### Pipeline Component Latencies

| Component | Typical Latency |
|-----------|----------------|
| Deepgram STT | ~150ms |
| Groq LLM (llama-3.3-70b) | ~200-400ms |
| Cartesia TTS | ~100-150ms |
| **Pipeline subtotal** | **~500-800ms** |
| LiveKit WebRTC overhead | ~50-100ms |
| **End-to-end** | **~600-900ms** |

**vs Gemini Live:** Gemini Live is native speech-to-speech at ~300-500ms. Pipeline is inherently slower (~600-900ms) because it serializes three models. However, `preemptiveGeneration: true` starts generating before user finishes, reducing perceived latency.

**Known issue:** EU Cloud latency reported at 4+ seconds per turn. US Cloud or self-hosted is much better.

## Pricing

### LiveKit Cloud

| Plan | Price/month | Agent minutes included | Concurrent sessions |
|------|------------|----------------------|---------------------|
| **Build** (free) | $0 | 1,000 | 5 |
| **Ship** | $50 | 5,000 | 20 |
| **Scale** | $500 | 50,000 | Up to 600 |

**Overage costs:**
- Agent sessions: $0.01/min
- WebRTC: ~$0.0004/min
- Data transfer: $0.10-0.12/GB

### Self-Hosted

LiveKit Server and Agents framework are **fully open-source**. Run everything on your own infra (Docker/K8s) and only pay AI provider costs + your infra.

### Total Estimated Cost per Minute

| Component | Cost/min |
|-----------|----------|
| LiveKit Cloud (agent) | $0.01 |
| Deepgram STT | $0.0043 |
| Groq LLM | ~$0.001-0.003 |
| Cartesia TTS | ~$0.005 |
| **Total** | **~$0.02-0.03/min** |

## Known Issues & Gotchas

### Active GitHub Issues

1. **Memory leaks in Node.js**: Processes don't clean up correctly on disconnect
2. **`preemptiveGeneration=true` duplicates LLM requests**: Makes two calls per turn, doubling token costs ([#4219](https://github.com/livekit/agents/issues/4219))
3. **Deepgram STT causes self-interruption**: Agent interrupts itself in certain configs
4. **ElevenLabs creates new WebSocket per turn**: Instead of reusing, causing latency
5. **Feature parity gaps Node.js vs Python**: MCP not supported, fewer plugins
6. **EU Cloud latency**: 4+ seconds reported ([#4053](https://github.com/livekit/agents/issues/4053))
7. **Shutdown callbacks don't fire**: Unreliable cleanup
8. **Turn detection too sensitive**: Agent interrupts user prematurely ([#3427](https://github.com/livekit/agents/issues/3427))

### Architectural Limitations

- Requires separate server for the agent (can't run inside Next.js)
- 3 services to manage: Next.js app, LiveKit Server (or Cloud), Agent Server
- No progressive context compression built-in
- No native speech-to-speech (always STT→LLM→TTS cascade)
- Audio PCM handling differs from current approach (WebRTC abstracts it)

## What We'd Gain vs Lose

### Gains
- Choice of any STT/LLM/TTS combination
- Configurable semantic turn detection
- Zod-based tool calling (already using Zod in Jarre)
- Simpler frontend (WebRTC abstraction)
- Built-in WebRTC reconnection
- Multi-agent handoffs
- Telephony/SIP support
- Self-hosteable (no vendor lock-in)

### Losses
- ~200-400ms additional latency (pipeline vs native speech-to-speech)
- Operational complexity (+2 services)
- Node.js SDK still has active issues (6 months old)
- No progressive compression built-in
- Audio quality slightly lower (pipeline vs native)

## Sources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [LiveKit Agents JS (GitHub)](https://github.com/livekit/agents-js)
- [LiveKit Agents Python (GitHub)](https://github.com/livekit/agents)
- [Agent Starter Node](https://github.com/livekit-examples/agent-starter-node)
- [Agent Starter React](https://github.com/livekit-examples/agent-starter-react)
- [Tool Calling Docs](https://docs.livekit.io/agents/logic/tools/)
- [External Data & RAG Docs](https://docs.livekit.io/agents/build/external-data/)
- [Turn Detection Docs](https://docs.livekit.io/agents/logic/turns/)
- [Groq Integration](https://docs.livekit.io/agents/integrations/groq/)
- [LiveKit Pricing](https://livekit.io/pricing)
