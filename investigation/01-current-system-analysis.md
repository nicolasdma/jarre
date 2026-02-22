# Current System Analysis — Gemini Live Voice Implementation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                         │
├─────────────────────────────────────────────────────────┤
│ VoicePanel / VoiceSessionOverlay (React)                │
│  ├─ useVoiceSession()        [31KB hook]                │
│  │  ├─ GeminiLiveClient       [WebSocket + Audio]       │
│  │  ├─ AudioWorklet           [PCM capture 16kHz]       │
│  │  ├─ Web Audio API          [PCM playback 24kHz]      │
│  │  └─ Transcript buffer      [Layer 2 fallback]        │
│  │                                                       │
│  └─ useUnifiedVoiceSession() [25KB wrapper]             │
│     ├─ buildUnifiedSystemInstruction()                   │
│     ├─ Tool call handling                                │
│     └─ Post-session scoring                              │
│                                                          │
│ Visualization:                                           │
│  ├─ VoiceAuraOverlay         [Reactive glow]            │
│  ├─ useAudioLevel()          [Mic level 0-1]            │
│  └─ useTutorFrequency()      [8 frequency bands]        │
└─────────────────────────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│ SERVER (Next.js API Routes)                              │
├─────────────────────────────────────────────────────────┤
│ Token:     POST /api/voice/token                         │
│ Lifecycle: POST /api/voice/session/start                 │
│            GET  /api/voice/session/context                │
│            POST /api/voice/session/transcript             │
│            POST /api/voice/session/compress               │
│            POST /api/voice/session/end                    │
│ Scoring:   POST /api/evaluate/voice-score                │
│            POST /api/evaluate/voice-practice-score        │
│            POST /api/evaluate/voice-teach-score           │
│ Context:   GET  /api/voice/freeform/context              │
└─────────────────────────────────────────────────────────┘
                      │ Supabase SDK
┌─────────────────────────────────────────────────────────┐
│ DATABASE (Supabase PostgreSQL)                           │
│  voice_sessions, voice_transcripts,                      │
│  learner_concept_memory                                  │
└─────────────────────────────────────────────────────────┘
```

## Gemini Live Integration Details

### Connection

- SDK-based: `@google/genai`
- Bidirectional WebSocket for real-time audio
- Audio format: PCM 16kHz mono (input), PCM 24kHz (output)
- Automatic input/output transcription
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Voice: "Kore" (configurable)

### Connection States

```
disconnected → connecting → connected
                    ↕
              reconnecting ↔ error
```

### Resilience — 3 Layers

1. **Proactive GoAway**: Detects server message before closure, reconnects with resumption handle
2. **Layer 1 (Resumption)**: Uses previous session handle to resume
3. **Layer 2 (Fallback)**: Rebuilds context from local transcript buffer
4. **Layer 3**: Exhaustion = honest error to user
- Max 3 retries with exponential backoff (1s, 2s, 4s)
- Certain close codes (1000, 1002, 1003, 1007, 1009, 1010) are not retried

### Audio Processing

**Mic Capture (Input):**
```javascript
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const samples = inputs[0][0];
    const int16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      int16[i] = samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7FFF;
    }
    this.port.postMessage(int16.buffer);
  }
}
```

- Buffer: 100ms chunks to avoid WebSocket flooding
- Audio level analysis: bins 10-40 @ 16kHz, smoothing 12% per frame

**Playback (Output):**
- PCM 24kHz → Web Audio API
- Float32 conversion from Int16
- BufferSource → AnalyserNode → frequency visualization
- 8 bands (128 bins → 8), fast attack (0.4), slow release (0.05)

## Session Lifecycle

### Phase 1: Start (~1.5-2.5s total)

| Step | Latency |
|------|---------|
| Prefetch token + context (parallel) | 500-1000ms |
| WebSocket connect | 800-1200ms |
| Mic permission + setup | 150-300ms |
| First tutor audio | 1.5-2.5s total |

1. `GET /api/voice/token` → ephemeral token (GEMINI_API_KEY)
2. `GET /api/voice/session/context` → cached_summary + learnerMemory
3. `POST /api/voice/session/start` → creates DB row, returns sessionId
4. `buildVoiceSystemInstruction()` → injects section content, cached_summary, learner memory, mastery adaptation, tool instructions
5. `client.connect(token, config)` → WebSocket established
6. `startMic()` → AudioWorklet captures PCM 16kHz
7. `client.sendText(initialMessage)` → model starts with warm-up question

### Phase 2: Active Conversation

```
idle → listening → thinking → speaking → idle
```

- Transcripts saved fire-and-forget to `voice_transcripts`
- Session end detection: keyword `/\bsession complete\b/i` in model transcript
- Requires ≥120 seconds elapsed (prevents early false positives)
- Auto-disconnect after 3 seconds
- Interruptions: VAD server-side, `onInterrupted()` stops playback

### Phase 3: End

- `POST /api/voice/session/end` → updates duration, turn_count
- Fire-and-forget: `generateSummaryCached()` in background
  - Fetches transcripts → DeepSeek summary (500 tokens max)
  - Saves to `cached_summary` for next session context

## Latency Characteristics

### Audio Round-Trip

| Component | Latency |
|-----------|---------|
| Mic capture (AudioWorklet) | ~8ms |
| Buffer (100ms chunks) | 100ms |
| Network (WebSocket) | 50-200ms |
| Model processing | 200-800ms |
| Audio decode + playback | ~100ms |
| **Round-trip** | **500-1500ms** |

### Speech-to-Speech (Native)

Gemini Live processes audio natively (no STT→LLM→TTS cascade):
- **Typical latency: 280-350ms**
- This is the key advantage over pipeline architectures

## Context and Memory Management

### Per-Session Context

`GET /api/voice/session/context`:

**For teaching sessions (sectionId):**
```json
{
  "summary": "Previous session summary (bullets)",
  "learnerMemory": [
    {
      "conceptId": "...",
      "misconceptions": ["Thinks X is Y when actually..."],
      "strengths": ["Understands async patterns"],
      "escalationLevel": "hint",
      "analogies": ["TCP handshake is like..."],
      "openQuestions": ["How does this scale?"]
    }
  ]
}
```

**Staleness Detection:**
- recent (< 10 min): Skip recap, jump to content
- fresh (< 2 days): Brief recap, then proceed
- stale (days): Check if they remember key points first

### Progressive Compression

`POST /api/voice/session/compress`:
- Manual call from client when conversation grows
- Compresses old turns to running summary via DeepSeek (400 tokens max)
- Used for sessions >15min
- Graceful degradation: returns empty summary on failure

## Prompt System

### 7 Session Modes (voice-unified-prompt.ts, 37KB)

| Mode | DB Type | Flow | Termination |
|------|---------|------|-------------|
| eval | evaluation | Warmup → Explain → Probe → Connect → Challenge | Tool: `end_session(completed)` |
| practice | practice | Warmup → Productive Failure → Consolidation → Connect | Tool: `end_session(completed)` |
| teaching | evaluation | Student teaches junior AI | Tool: `end_session(completed)` |
| learning | teaching | Sidebar tutor for section | Keyword: "session complete" |
| exploration | exploration | Discuss custom resource + links | Tool: `end_session(completed)` |
| debate | debate | Take position, challenge connections | Tool: `end_session(completed)` |
| freeform | freeform | Open conversation + recent context | Tool: `end_session(completed)` |

### Tool Declarations

```typescript
TUTOR_TOOLS: [
  scroll_to_concept(conceptId)
  show_definition(conceptId, highlight)
  end_session(reason: 'completed' | 'student_request' | 'time_limit')
  mark_discussed(conceptId, understood)
]
```

## Post-Session Scoring

### Eval Voice Score Flow

1. Fetch transcripts from `voice_transcripts`
2. Validate: ≥4 user turns, ≥3 minutes
3. DeepSeek scoring prompt → `VoiceEvalScoringResponseSchema`
4. `saveEvaluationResults()` → evaluations + evaluation_questions + evaluation_responses
5. `updateLearnerConceptMemory()` → accumulate misconceptions/strengths
6. **Total: 3.5-5.5s**

## Cost Analysis

### Current Cost (Gemini Live)

- Pricing: $3.00/1M tokens input audio, $12.00/1M tokens output audio
- Audio consumes ~25 tokens/second
- Estimated: ~$0.22/min baseline
- **Problem:** Context accumulation — each turn re-charges all previous tokens
- Free tier available but with aggressive rate limits

### Cost for Always-On (4 hr/day)

- **Estimated: ~$53/day ($1,590/month)** worst case
- Viable only for short sessions (<15 min)

## Known Limitations

1. **Context window compression removed**: Caused WebSocket 1008 "Operation not implemented"
2. **Sessions limited to ~15 min** without compression
3. **Ephemeral tokens buggy**: system_instruction ignored + immediate closure, using full API key
4. **Resumption handles valid only ~30 min**
5. **Single model lock-in**: Can only use Gemini models
6. **No control over VAD/turn-taking**: Black box on Google's side

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/voice/gemini-live.ts` | Gemini Live WebSocket client |
| `src/components/voice/use-voice-session.ts` | Main voice session hook (31KB) |
| `src/lib/llm/voice-unified-prompt.ts` | Unified prompt system (37KB) |
| `src/lib/voice/tool-declarations.ts` | Tool schemas for Gemini |
| `src/lib/voice/tool-handler.ts` | Tool call execution |
| `src/lib/learner-memory.ts` | Per-concept misconceptions/strengths |
| `src/lib/evaluate/save-results.ts` | Shared eval result saving |
