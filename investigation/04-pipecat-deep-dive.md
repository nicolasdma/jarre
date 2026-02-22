# Pipecat (Daily.co) — Deep Technical Dive

## Overview

- **GitHub:** ~10.4k stars, ~600 forks, 211 contributors
- **Backed by:** Daily.co
- **Language:** Python only (3.10+, recommended 3.12)
- **License:** BSD-2-Clause

## Architecture: Pipeline & Frame Model

Pipecat is built around a **linear pipeline model** where data flows as **Frames** (immutable data containers) through a chain of **FrameProcessors**.

### Frame Categories (Priority)

- **SystemFrames** (high priority): `StartFrame`, `EndFrame`, `InterruptionFrame` — processed immediately, bypassing normal queue. Critical for interruptions.
- **DataFrames** (normal priority): Audio, text, transcriptions — FIFO order.
- **ControlFrames** (normal priority): Shutdown signals, response limits.

### Four Message Types

- `AudioFrame`: Audio samples with timestamps
- `VideoFrame`: Visual frames with metadata
- `TextFrame`: Text content
- `TranscriptionFrame`: STT results

### Typical Voice Pipeline

```python
pipeline = Pipeline([
    transport.input(),      # Receive audio from user via WebRTC/WebSocket
    stt,                    # Speech-to-Text (e.g., Deepgram)
    context_aggregator,     # Maintains conversation history
    llm,                    # LLM (e.g., OpenAI, Anthropic, Gemini)
    tts,                    # Text-to-Speech (e.g., ElevenLabs, Cartesia)
    transport.output()      # Send audio back to user
])

task = PipelineTask(pipeline, params=PipelineParams(
    audio_in_sample_rate=8000,
    enable_metrics=True
))
runner = PipelineRunner(handle_sigint=False)
await runner.run(task)
```

### Custom FrameProcessor

```python
class MyProcessor(FrameProcessor):
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            # Do something with the transcription
            pass

        # CRITICAL: always forward the frame
        await self.push_frame(frame, direction)
```

**Golden rule:** Every FrameProcessor must forward all frames. If you don't, you block downstream pipeline.

Frames flow bidirectionally: **downstream** (input → output) and **upstream** (output → input, for feedback/events).

## Language: Python Only

No TypeScript/Node server support. Client-side SDKs exist:
- `@pipecat-ai/client-js` — Web client SDK
- `@pipecat-ai/client-react` — React hooks and components
- `@pipecat-ai/daily-transport` — WebRTC transport via Daily

**All bot logic (pipeline, STT, LLM, TTS) runs in a Python server.**

## Next.js Client Integration

### Architecture

```
[Next.js App (React)] <--WebRTC--> [Daily.co SFU] <---> [Python Bot Server (Pipecat)]
```

### React Integration

```tsx
import { PipecatClient } from '@pipecat-ai/client-js';
import { PipecatClientProvider, usePipecatClient } from '@pipecat-ai/client-react';
import { DailyTransport } from '@pipecat-ai/daily-transport';

const client = new PipecatClient({
  transport: new DailyTransport(),
});

function App() {
  return (
    <PipecatClientProvider client={client}>
      <VoiceBot />
    </PipecatClientProvider>
  );
}

function VoiceBot() {
  const { startBotAndConnect, disconnect } = usePipecatClient();

  const handleStart = async () => {
    await startBotAndConnect('/api/start-bot');
  };

  return <button onClick={handleStart}>Connect</button>;
}
```

### API Route (Next.js → Python server)

```typescript
// src/app/api/start-bot/route.ts
export async function POST(req: Request) {
  const response = await fetch('http://your-python-bot/create-session', {
    method: 'POST',
    body: JSON.stringify({ /* config */ })
  });
  const { room_url, token } = await response.json();
  return Response.json({ room_url, token });
}
```

### Available Transports

| Transport | Protocol | Use Case |
|-----------|----------|----------|
| **DailyTransport** | WebRTC | Web/mobile apps (recommended) |
| **FastAPIWebSocketTransport** | WebSocket | Telephony (Twilio, SIP), self-hosted |
| **WebSocket Server** | WebSocket | Custom integrations |
| **Local Audio** | N/A | Development/testing |

## Voice Pipeline: Provider Support

**80+ services** with uniform adapter pattern:

### STT (19+ providers)
Deepgram, AssemblyAI, Google Cloud Speech, OpenAI Whisper, Azure Speech, Speechmatics, Gladia, etc.

### LLM (18+ providers)
OpenAI, Anthropic, Google Gemini, Groq, Mistral, DeepSeek (via OpenAI-compatible endpoint), Together, Fireworks, etc.

### TTS (25+ providers)
ElevenLabs, Cartesia, Google Cloud TTS, Azure TTS, PlayHT, Neuphonic, Kokoro (open-source), etc.

### Speech-to-Speech (5 providers)
OpenAI Realtime API, Gemini Live, and others — these bypass the traditional STT+LLM+TTS pipeline.

### Full Bot Configuration Example

```python
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.services.openai import OpenAILLMService
from pipecat.services.cartesia import CartesiaTTSService
from pipecat.transports.services.daily import DailyTransport, DailyParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.aggregators.llm_context import LLMContext, LLMContextAggregatorPair

async def main():
    transport = DailyTransport(
        room_url="https://your-domain.daily.co/room-name",
        token="your-token",
        bot_name="Jarre Bot",
        params=DailyParams(audio_in_enabled=True, audio_out_enabled=True)
    )

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o"
    )

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="your-voice-id"
    )

    context = LLMContext(messages=[
        {"role": "system", "content": "You are an AI tutor..."}
    ])
    context_aggregator = LLMContextAggregatorPair(context)

    pipeline = Pipeline([
        transport.input(),
        stt,
        context_aggregator.user(),
        llm,
        tts,
        transport.output(),
        context_aggregator.assistant()
    ])

    task = PipelineTask(pipeline, PipelineParams(enable_metrics=True))
    runner = PipelineRunner()
    await runner.run(task)
```

## Turn-Taking & Interruptions

### VAD: Silero VAD

```python
from pipecat.audio.vad.silero import SileroVADAnalyzer

vad = SileroVADAnalyzer(
    confidence=0.7,
    start_secs=0.2,
    stop_secs=0.2,
    min_volume=0.6
)
```

- Processes 30+ms chunks in **less than 1ms**
- Single CPU thread

### Turn Detection Strategies

1. **Smart Turn Model** (default, recommended): AI model to understand if user really finished speaking. Uses `LocalSmartTurnAnalyzerV3`.
2. **Speech Timeout**: Simple — waits N seconds of silence after last transcription.

### Interruptions

Enabled by default. When user speaks while bot responds:
1. VAD detects user voice
2. `InterruptionFrame` generated (SystemFrame, high priority)
3. Frame bypasses normal queue, cancels in-progress tasks
4. Queued audio cleared
5. Bot stops speaking immediately

**Known issue:** Interruptions can be slow in certain scenarios. Sounds like "mhm" or background noise can trigger false `UserInterruptionFrames`.

## Tool Calling / Function Calling

### FunctionSchema (Recommended)

```python
from pipecat.services.llm_service import FunctionSchema, ToolsSchema

tools = ToolsSchema(
    standard_tools=[
        FunctionSchema(
            name="get_weather",
            description="Get current weather for a location",
            properties={
                "location": {
                    "type": "string",
                    "description": "City name"
                }
            },
            required=["location"]
        )
    ]
)

async def handle_get_weather(params):
    location = params.arguments["location"]
    weather = await fetch_weather(location)
    await params.result_callback({"temperature": weather.temp})

llm.register_function("get_weather", handle_get_weather)
```

**Features:**
- Function call results automatically stored in conversation context
- Control whether function calls cancel during user interruptions
- `FunctionCallResultProperties` controls LLM execution after each call
- Portable format across providers (OpenAI, Anthropic, Gemini) via `FunctionSchema`

## Session Memory / Context Management

### LLMContext

Universal context container storing:
- Message history (alternating user/assistant)
- Tool definitions
- Tool choice configuration
- Compatible with OpenAI format, auto-adapts per provider

### Automatic Updates via LLMContextAggregatorPair

- **User messages**: Speech → transcription → context
- **Assistant messages**: LLM output → TTS → context

### Long Conversation Handling

```python
context = LLMContext(
    messages=[...],
    enable_context_summarization=True  # Auto-summarize when context grows
)
```

### Mem0 Integration (Persistent Memory)

```python
from pipecat.services.mem0 import Mem0MemoryService

memory = Mem0MemoryService(api_key="...")
# Intercepts messages, stores in Mem0, enriches context with relevant memories
```

### Pipecat Flows

For structured conversations (like Jarre evaluations), Pipecat Flows defines **conversational state machines** that prevent "context rot" in long conversations.

## Latency

### TTFB by Component (built-in metrics)

| Component | Typical TTFB |
|-----------|-------------|
| STT (Deepgram) | ~200-300ms |
| STT (Speechmatics) | ~495ms (finals) |
| LLM (Anthropic) | ~838ms |
| LLM (GPT-4o) | ~500-800ms |
| LLM (Groq/Cerebras) | ~100-200ms |
| TTS (Cartesia) | ~172ms |
| TTS (Kokoro, self-hosted) | ~100-150ms |

### End-to-End (Voice-to-Voice)

- **Typical with cloud services**: **500-800ms** (official documentation)
- **Optimized (Modal + open-source)**: ~**1 second** median (Parakeet STT + Qwen3-4B + Kokoro TTS)
- **With fast LLMs (Groq)**: Potentially **400-600ms**

### Critical Factor: Geographic Proximity

Modal tests showed that **proximity between bot and inference services** matters more than client-to-bot distance (WebRTC handles that well). Co-locating services in the same region is essential.

## Pricing

### Pipecat Cloud (Managed Hosting by Daily.co)

| Resource | Price |
|----------|-------|
| Agent 1x (0.5 vCPU, 1GB) | $0.01/min active |
| Agent 2x (1 vCPU, 2GB) | $0.02/min active |
| Agent 3x (1.5 vCPU, 3GB) | $0.03/min active |
| Reserved 1x | $0.0005/min |
| Daily WebRTC Voice 1:1 | **FREE** on Pipecat Cloud |
| Daily WebRTC Video | $0.004/min per participant |
| SIP Dial-in/out | $0.005/min |
| PSTN | $0.018/min |
| Krisp noise reduction (>10k min) | $0.0015/min |
| Audio recording | $0.005/min |

### Self-Hosted

- Open-source (BSD-2-Clause), run on any VPS (~$10-20/month)
- Need Daily.co for WebRTC (free tier: 10,000 min/month)
- Or use FastAPIWebSocketTransport for self-hosted transport

### Cost Comparison with Current System

Current (Gemini Live direct): Only pay Gemini tokens, no infra overhead.
With Pipecat: hosting + Daily + STT + LLM + TTS separately. Significantly more expensive for simple flows.

## Known Issues & Gotchas

### GitHub Issues

1. **Slow interruptions** ([#1622](https://github.com/pipecat-ai/pipecat/issues/1622)): Bot speech cancellation not always instant
2. **False VAD positives** ([#1084](https://github.com/pipecat-ai/pipecat/issues/1084)): "mhm", background noise trigger false interruptions
3. **Context not updated on interruptions** ([#2791](https://github.com/pipecat-ai/pipecat/issues/2791)): Context can be inconsistent after interruption
4. **Function calls hang** ([#2179](https://github.com/pipecat-ai/pipecat/issues/2179)): Bot hangs at end of function calls with Realtime API
5. **Slow ICE gathering** ([#2818](https://github.com/pipecat-ai/pipecat/issues/2818)): JS SDK shows slower connections than native WebRTC
6. **SileroVAD sample rate ignored** ([#2494](https://github.com/pipecat-ai/pipecat/issues/2494)): `init_sample_rate` not respected
7. **Excessive log noise** ([#3633](https://github.com/pipecat-ai/pipecat/issues/3633)): "audio not received" warning every second during idle
8. **Sentry hangs sessions** ([#2285](https://github.com/pipecat-ai/pipecat/issues/2285)): Rapid terminations with Sentry cause zombie sessions

### Architectural Limitations

- **Python mandatory for bot**: Can't run agent logic in Node.js/TypeScript. For Jarre (Next.js), means maintaining **two stacks**
- **Daily.co dependency for WebRTC**: Need Daily service. Alternative is WebSocket transport but loses WebRTC advantages
- **Not serverless-friendly**: WebRTC/WebSocket require persistent connections
- **Verbosity**: Compared to current Gemini Live (one TypeScript file, direct connection), Pipecat requires significantly more code and a separate Python server

## What We'd Gain vs Lose

### Gains
- 80+ provider integrations (richest ecosystem)
- Pipecat Flows for structured conversations (ideal for evaluations)
- Built-in TTFB metrics per component
- More granular pipeline control
- Custom FrameProcessors for arbitrary audio/text processing
- Context summarization built-in
- Mem0 integration for persistent memory

### Losses
- **Python dependency** in a 100% TypeScript project (deal-breaker)
- Two deployments, two dependency sets
- Daily.co dependency for WebRTC
- Higher latency than Gemini Live native (~500-800ms vs ~300ms)
- More operational complexity

## Verdict for Jarre

**Not recommended as primary choice due to Python-only backend requirement.** Pipecat is technically superior to LiveKit in flexibility and ecosystem, but introducing Python into a 100% TypeScript project creates significant operational overhead that doesn't justify the benefits.

If the project were Python-based, Pipecat would be the clear winner.

## Sources

- [Pipecat Documentation](https://docs.pipecat.ai/)
- [Pipecat GitHub](https://github.com/pipecat-ai/pipecat)
- [Pipecat DeepWiki](https://deepwiki.com/pipecat-ai/pipecat)
- [Pipeline & Frame Processing Guide](https://docs.pipecat.ai/guides/learn/pipeline)
- [Function Calling Guide](https://docs.pipecat.ai/guides/learn/function-calling)
- [Speech Input & Turn Detection](https://docs.pipecat.ai/guides/learn/speech-input)
- [Context Management](https://docs.pipecat.ai/guides/learn/context-management)
- [React SDK](https://docs.pipecat.ai/client/react/introduction)
- [Pipecat Cloud Pricing](https://www.daily.co/pricing/pipecat-cloud/)
- [Daily.co Pricing](https://www.daily.co/pricing/)
- [One-Second Voice Latency with Modal + Pipecat](https://modal.com/blog/low-latency-voice-bot)
- [Pipecat Flows](https://github.com/pipecat-ai/pipecat-flows)
