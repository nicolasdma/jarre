# Session 01 — Voice Reading Companion (Grupo de Lectura con Voz)

**Fecha:** 2026-02-16
**Objetivo:** Implementar voice mode dentro del learn flow — el usuario activa voz mientras lee una sección y puede discutir con un tutor IA en tiempo real.

---

## Context

El análisis competitivo identificó que Jarre necesita mecanismos para validar mastery levels 2-4. En vez del Socratic Challenger (texto adversarial), el usuario quiere un **reading companion por voz**: poder leer una sección del learn flow y discutirla verbalmente con un tutor IA en tiempo real, con capacidad de interrumpir.

Investigación reveló que **Gemini Live API** es la opción óptima:
- $0.003/min
- 320-800ms latencia
- Modelo nativo multimodal (no pipeline STT→LLM→TTS separado)
- VAD e interrupción built-in

## Scope

**Fase 1 (este plan):** Voice mode dentro del learn flow — el usuario activa voz mientras lee una sección y puede discutir con el tutor.

**Fase 2 (futuro):** Standalone review mode — elegir un recurso/concepto y hacer sesión de repaso por voz.

---

## Architecture

```
┌─ Browser ─────────────────────────────────────────────┐
│                                                        │
│  Learn Flow (sección visible)                          │
│       ↕ contexto de la sección                         │
│  VoicePanel component                                  │
│       ↕ WebSocket bidireccional                        │
│  Gemini Live API (modelo nativo multimodal)            │
│       • Recibe audio del mic                           │
│       • Procesa con contexto de la sección             │
│       • Responde en audio (streaming)                  │
│       • VAD detecta interrupción automáticamente       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

No hay pipeline STT→LLM→TTS separado. Gemini procesa audio directo y responde en audio.

### Gemini Live API Integration

WebSocket bidireccional a `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`

- **System instruction**: contexto de la sección actual + rol de tutor Socrático
- **Audio input**: PCM 16kHz mono del micrófono del usuario
- **Audio output**: PCM 24kHz que se reproduce en el browser
- **Turn detection**: server-managed VAD (Gemini detecta cuándo el usuario termina de hablar)
- **Interruption**: cuando el usuario habla mientras Gemini responde, Gemini para automáticamente

### Auth Flow

Gemini Live requiere API key. La key va en `.env.local` (server-side). El browser necesita un **ephemeral token** que el server genera via API route:

```
Browser → POST /api/voice/token → Server genera ephemeral token → Browser usa token para WebSocket
```

---

## Files to Create (5)

| File | Purpose |
|------|---------|
| `src/lib/voice/gemini-live.ts` | WebSocket client wrapper: connect, send audio, receive audio, handle VAD signals, interruption |
| `src/app/api/voice/token/route.ts` | Generate ephemeral token for Gemini Live WebSocket auth |
| `src/components/voice/voice-panel.tsx` | UI panel: mic button, audio visualizer, status indicators, conversation transcript |
| `src/components/voice/use-voice-session.ts` | React hook: manages WebSocket lifecycle, mic access, audio playback, state |
| `src/lib/llm/voice-prompts.ts` | System instructions for voice tutor (section context, Socratic rules, Spanish) |

## Files to Modify (2)

| File | Change |
|------|--------|
| `src/components/learn-flow.tsx` (or equivalent section view) | Add voice toggle button, pass section content to VoicePanel |
| `.env.local` | Add `GEMINI_API_KEY` |

## No Migration Needed

Voice sessions are ephemeral conversations — no DB persistence required for Phase 1. Future: could save transcripts for review.

---

## Implementation Sequence

### Step 1: Gemini Live Client (`src/lib/voice/gemini-live.ts`)
- WebSocket connection to Gemini Live API
- Audio encoding/decoding (PCM 16kHz → base64 for sending, base64 → PCM 24kHz for playback)
- Message protocol: `BidiGenerateContentSetup` (initial config with system instruction), `BidiGenerateContentClientContent` (audio chunks), parse `BidiGenerateContentServerContent` (audio response chunks)
- Handle turn completion signals, interruption events
- Reconnection logic on disconnect

Key interfaces:
```typescript
interface GeminiLiveConfig {
  model: string; // 'gemini-2.0-flash-live' or similar
  systemInstruction: string;
  voiceName?: string; // e.g., 'Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck'
}

interface GeminiLiveClient {
  connect(token: string, config: GeminiLiveConfig): Promise<void>;
  sendAudio(pcmData: ArrayBuffer): void;
  onAudioResponse: (audioChunk: ArrayBuffer) => void;
  onTranscript: (text: string, role: 'user' | 'model') => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  disconnect(): void;
}
```

### Step 2: Ephemeral Token Route (`src/app/api/voice/token/route.ts`)
- `withAuth` protected
- Calls Gemini API to generate short-lived token
- Returns token to client
- Pattern: same as existing auth-protected API routes

### Step 3: Voice Prompts (`src/lib/llm/voice-prompts.ts`)
- `buildVoiceSystemInstruction(sectionContent, conceptName, language)`
- Tutor Socrático rules adapted for voice (shorter responses, conversational tone)
- Section content injected as context so tutor knows what the user is reading
- Spanish language

Prompt sketch:
```
Eres un tutor socrático en una sesión de lectura en voz. El estudiante está leyendo sobre {conceptName}.

CONTEXTO DE LA SECCIÓN:
{sectionContent}

REGLAS:
1. Respuestas cortas (2-3 oraciones). Esto es una conversación hablada, no un ensayo.
2. Haz preguntas que prueben comprensión, no memorización.
3. Si el estudiante interrumpe, adapta tu respuesta.
4. Si el estudiante dice algo incorrecto, no corrijas — haz una pregunta que exponga el error.
5. Habla en español. Tono natural, como un colega senior.
6. Puedes referirte a partes específicas del texto que el estudiante está leyendo.
```

### Step 4: React Hook (`src/components/voice/use-voice-session.ts`)
- `useVoiceSession({ sectionContent, conceptName, language })`
- Manages: mic permission request, AudioContext, GeminiLiveClient lifecycle
- Returns: `{ isConnected, isListening, isSpeaking, transcript, connect, disconnect }`
- Handles: getUserMedia → AudioWorklet for mic capture → send PCM chunks to GeminiLiveClient
- Handles: receive audio chunks → decode → play via AudioContext
- Auto-disconnect on unmount

### Step 5: Voice Panel UI (`src/components/voice/voice-panel.tsx`)
- Floating panel (bottom-right or side panel) with:
  - Mic toggle button (large, prominent)
  - Visual indicator: "listening" / "thinking" / "speaking" states
  - Simple audio waveform visualizer (canvas)
  - Running transcript (optional, collapsible)
  - Disconnect button
- Uses `useVoiceSession` hook
- Receives `sectionContent` and `conceptName` as props

### Step 6: Integration in Learn Flow
- Add voice toggle button in the section header/toolbar
- When activated, renders VoicePanel alongside section content
- Pass current section's content and concept name to VoicePanel

---

## Key Technical Details

### Audio Handling in Browser
```typescript
// Mic capture via AudioWorklet (low-latency)
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
});
const audioContext = new AudioContext({ sampleRate: 16000 });
const source = audioContext.createMediaStreamSource(stream);
// AudioWorklet processes PCM chunks and sends to WebSocket

// Playback via AudioContext
// Receive base64 audio chunks → decode to Float32Array → schedule on AudioContext
```

### Gemini Live WebSocket Protocol
```typescript
// 1. Setup message (first message after connect)
ws.send(JSON.stringify({
  setup: {
    model: `models/gemini-2.0-flash-live`,
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
    },
    systemInstruction: { parts: [{ text: systemPrompt }] }
  }
}));

// 2. Send audio chunks (continuous)
ws.send(JSON.stringify({
  realtimeInput: {
    mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64AudioChunk }]
  }
}));

// 3. Receive audio response
// ws.onmessage → parse → serverContent.modelTurn.parts[].inlineData.data (base64 audio)
// Also: serverContent.turnComplete signals end of model's turn
```

---

## Verification

1. Add `GEMINI_API_KEY` to `.env.local`
2. `npm run dev`
3. Navigate to learn flow → any section with content
4. Click voice toggle → grant mic permission
5. Start speaking about the section content
6. Verify: tutor responds in audio, references section content, asks Socratic questions
7. Verify: interrupt while tutor is speaking → tutor stops and adapts
8. Verify: disconnect cleanly, no audio leaks

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Gemini Live API availability/changes | It's in GA as of 2025. Wrap in abstraction layer for future swap. |
| Audio quality issues (echo, feedback) | Use AudioWorklet with echo cancellation. `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })` |
| Browser compatibility | AudioWorklet supported in Chrome, Firefox, Safari 14.1+. Fallback: ScriptProcessorNode (deprecated but universal). |
| Token expiration mid-session | Ephemeral tokens typically last 15-30 min. Monitor and refresh proactively. |
| User on mobile (no mic access easily) | Phase 1 is desktop-only. Show "desktop recommended" message on mobile. |
| Cost runaway | Track session duration client-side. Auto-disconnect after 30 min with warning at 25 min. |

---

## Decisions Made

- **Gemini Live** over OpenAI Realtime (cost, latency, native multimodal)
- **No DB persistence** for Phase 1 (voice sessions are ephemeral)
- **Ephemeral token pattern** to keep API key server-side
- **AudioWorklet** for low-latency mic capture (with ScriptProcessorNode fallback consideration)
- **Server-managed VAD** (Gemini handles turn detection, no client-side VAD needed)
