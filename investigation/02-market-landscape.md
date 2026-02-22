# Voice AI Market Landscape (February 2026)

## Market Size

| Segment | 2025 | 2034-2035 | CAGR |
|---------|------|-----------|------|
| Conversational AI (general) | $14.8B | $82.5B | 21% |
| Voice AI Agents | $2.4B | $47.5B | 34.8% |
| AI Voice Companion Products | $12.4B | $63.4B | 17.75% |
| AI Voice Generator (TTS) | $4.2B | $20.7B | 30.7% |

**Key signals:**
- 22% of latest YC batch builds with voice
- 90 voice agent companies in YC since 2020, accelerating (10 in W25 alone)
- ElevenLabs closed 2025 with $330M ARR
- LiveKit valued at $1B (Series C, Jan 2026)

## Competitive Landscape

### Tier 1: Infrastructure & Open Source Frameworks

| Project | GitHub Stars | Funding | Status |
|---------|-------------|---------|--------|
| **LiveKit Agents** | ~9.3k | $183M total ($100M Series C, $1B valuation) | Market leader. Used by OpenAI, xAI, Salesforce, Coursera, Spotify. 1M+ downloads/month |
| **Pipecat (Daily.co)** | ~10.4k | Backed by Daily.co | Strong second. 80+ provider integrations |
| **TEN Framework** | ~10.1k | Unknown | Full ecosystem but weak documentation, low real adoption |
| **Vocode** | ~3.6k | -- | Pivoted to full open-source 2025. Slowing development |
| **Bolna** | ~small | -- | Niche, production-ready but small community |

### Tier 2: Voice Agent Platforms (SaaS/API)

| Company | Funding | Price | Differentiator |
|---------|---------|-------|---------------|
| **ElevenLabs** | $680M+ ($500M Series D, $11B valuation, Feb 2026) | Variable | Best TTS quality. $330M ARR. Conversational AI 2.0 |
| **Vapi.ai** | ~$22-28M (Series A, $130M valuation) | ~$0.05/min + component costs | API-first, flexible, choose your models |
| **Bland.ai** | $65M ($40M Series B) | ~$0.09/min | Vertical integrated stack (own STT+LLM+TTS). Enterprise telephony |
| **Retell.ai** | Seed (YC) | $0.07+/min | No-code conversation designer |
| **Deepgram** | Significant | $4.50/hr (~$0.075/min) | STT+TTS+orchestration in single API |

### Tier 3: Big Player APIs

| API | Price | Status |
|-----|-------|--------|
| **OpenAI Realtime API** | $32/1M input tokens, $64/1M output (audio) | GA in 2025. SIP, MCP, images support. Expensive for long sessions |
| **Gemini Live API** | Audio input 2-7x more than text | Generous free tier (1000 req/day). Bidirectional WebSocket |

### Tier 4: Open Source Speech-to-Speech Models

| Model | Latency | Notes |
|-------|---------|-------|
| **Moshi (Kyutai)** | 160-200ms theoretical | First full-duplex speech-to-speech. CC-BY 4.0 |
| **Kyutai Pocket TTS** | Runs on CPU in real-time | Only 100M parameters. Jan 2026 |
| **Kyutai TTS 1.6B** | Streaming | July 2025 |

### Tier 5: Emotion & Expressivity

| Company | Status |
|---------|--------|
| **Hume AI** | Raised $50M Series B. Google acqui-hired CEO + 7 senior engineers Jan 2026. Company continues under new leadership. Projected $100M revenue 2026 |

## STT Providers (Speech-to-Text)

| Provider | Latency | WER (Error Rate) | Cost | Notes |
|----------|---------|-------------------|------|-------|
| **Deepgram Nova-3** | 150ms (US), 250-350ms (global) | 18.3% | $0.0043/min ($0.26/hr) | Best latency/price ratio |
| **AssemblyAI Universal-2** | 300-600ms | 14.5% (best) | $0.015/min ($0.90/hr) | Best accuracy |
| **Whisper (self-hosted, GPU)** | 380-520ms (optimized) | Very high accuracy | ~$1/hr GPU (AWS g5.xlarge) | Full control, high latency |
| **Whisper via Groq** | <300ms | High accuracy | Groq pricing | Fast but limited availability |
| **Google Cloud STT** | 200-400ms | Good | $0.006/min | Solid, enterprise |

**Recommendation for always-on:** Deepgram Nova-3 for streaming. Best balance latency/cost.

## LLM Providers (Low Latency)

| Provider/Model | TTFT | Tokens/sec | Cost (input/output per 1M tokens) |
|----------------|------|------------|-----------------------------------|
| **Groq (Llama 3.x 70B)** | ~200ms | 241-500 tok/s | ~$0.59/$0.79 |
| **Cerebras (Llama 3.x 70B)** | ~150ms | ~1,000-3,000 tok/s | Free tier available |
| **Gemini 2.5 Flash** | ~300ms | Fast | $0.15/$0.60 (text) |
| **GPT-4o-mini** | ~400ms | Moderate | $0.15/$0.60 |
| **DeepSeek V3** | ~500-700ms | Moderate | $0.27/$1.10 |
| **Claude 3.5 Haiku** | ~350ms | Fast | $0.80/$4.00 |
| **GPT-4o** | ~700ms | Moderate | $2.50/$10.00 |

**Recommendation for always-on:** Groq or Cerebras with Llama 3.x for minimum latency.

## TTS Providers (Text-to-Speech)

| Provider | Time-to-First-Audio | Quality | Cost |
|----------|---------------------|---------|------|
| **Cartesia Sonic** | 40-95ms | Excellent | $0.038/1K chars (~$0.03/min) |
| **ElevenLabs Flash v2.5** | 75ms | Leader in quality | $0.050/1K chars |
| **Deepgram Aura-2** | <150ms | Enterprise | $0.030/1K chars |
| **Kokoro 82M (self-hosted)** | Variable | Good | **Free** (open source, Apache) |
| **Kokoro via API (Together AI)** | Variable | Good | <$0.06/hr audio output |
| **PlayHT** | ~300ms | Wide library | Low |

**Recommendation:** Cartesia Sonic for minimum latency in production. Kokoro 82M self-hosted for zero-cost TTS.

## Cost Analysis: Always-On Tutor (4 hours/day)

| Architecture | Cost/month | Complexity |
|--------------|-----------|------------|
| OpenAI Realtime | $1,440-2,400 | Low |
| Gemini Live (current) | $1,000-1,590 | Low (already implemented) |
| Custom pipeline (APIs) | $319-391 | Medium |
| Custom + Kokoro self-hosted | $110-182 | Medium-High |
| Full self-hosted | $60-120 | Very High |

### Pipeline cost breakdown (APIs, 4hr/day):

| Component | Provider | Cost/min | Cost 4hr/day |
|-----------|----------|----------|--------------|
| STT | Deepgram Nova-3 | $0.0043 | $1.03 |
| LLM | Groq (Llama 70B) | ~$0.01-0.02 | $2.40-4.80 |
| TTS | Cartesia Sonic | ~$0.03 | $7.20 |
| **Total** | | **~$0.05-0.06/min** | **$10.63-13.03/day** |

## End-to-End Latency Comparison

| Architecture | Latency E2E | Notes |
|-------------|-------------|-------|
| **OpenAI Realtime** | 250-300ms | Native speech-to-speech, no pipeline |
| **Gemini Live** | 280-350ms | Native speech-to-speech |
| **Ultravox** | ~190ms | Open source, speech-to-speech |
| **Moshi** | ~160ms | Open source, experimental |
| **Custom (Deepgram+Groq+Cartesia)** | 500-800ms | Pipeline cascading |
| **Custom (Whisper+local LLM+Kokoro)** | 800-1500ms | All local, no network |

**Critical threshold:** Users abandon conversations with >1.2s latency. Natural human conversation has ~200ms delay. 300-600ms feels "acceptable" for a voice assistant.

## What's Unsolved (Developer Pain Points)

From AssemblyAI 2026 developer survey:
- **82.5%** feel capable of building voice agents, but **75% struggle with production reliability**
- **55%** of users cite "having to repeat themselves" as #1 frustration
- **76%** rate STT accuracy as critical for success

### Specific unsolved problems:

1. **Latency still not natural**: Humans expect 200-300ms. Production median is 1,400-1,700ms
2. **Turn-taking/interruptions**: Agents don't understand when user finished speaking
3. **Conversational memory**: Systems forget what user said 2 minutes ago
4. **Long session cost**: Context accumulation makes always-on prohibitive
5. **Production reliability**: STT fails with accents, background noise, load spikes
6. **Multi-system debugging**: No standard tooling for voice pipeline observability

## Market Gaps (Where Opportunity Exists)

### CROWDED (don't enter):
- Customer service/call centers B2B (saturated: Bland, Retell, Vapi, dozens more)
- Base infrastructure (LiveKit won)
- High-quality TTS (ElevenLabs at $11B valuation dominates)

### UNDERSERVED:
1. **Cost optimization for long sessions** — nobody solved progressive context compression + intelligent caching + cheap model routing for voice
2. **Education/Tutoring with voice** — only ~13% of YC voice startups are consumer; education even less. No "Duolingo but voice-native for deep learning"
3. **Local/self-hosted voice agents** — Moshi opened the door but nobody packaged it into a usable developer framework
4. **"Last mile" natural UX** — turn-taking, interruptions, emotion detection. Hume AI vacuum after Google acqui-hire
5. **"Boring" high-volume verticals** — manufacturing, industrial suppliers, vendor coordination (a16z explicitly calls this out)

## Handy (https://handy.computer/)

**Verdict: IRRELEVANT for our use case.**

- Desktop app for local speech-to-text dictation (push-to-talk)
- Stack: Rust (Tauri) + React + whisper-rs + Silero VAD
- No TTS, no LLM integration, no turn management
- Crashes reported on Windows/Linux
- Only useful as isolated local STT component

## Sources

- [Voice AI Market $47.5B by 2034 - AgentVoice](https://www.agentvoice.com/ai-voice-in-2025-mapping-a-45-billion-market-shift/)
- [AI Voice Companion Market $63B by 2035 - Precedence Research](https://www.precedenceresearch.com/voice-based-ai-companion-product-market)
- [Conversational AI Market - Fortune Business Insights](https://www.fortunebusinessinsights.com/conversational-ai-market-109850)
- [a16z Voice Agents 2025 Update](https://a16z.com/ai-voice-agents-2025-update/)
- [LiveKit Series C ($100M, $1B valuation)](https://blog.livekit.io/livekit-series-c/)
- [ElevenLabs $500M Series D, $11B valuation](https://elevenlabs.io/blog/series-d)
- [Vapi.ai $20M Series A](https://vapi.ai/blog/vapi-secures-20m-to-start-the-voice-revolution-2)
- [Bland.ai $40M Series B](https://www.bland.ai/blogs/bland-raises-a-40m-series-b)
- [Hume AI acqui-hire by Google](https://techcrunch.com/2026/01/22/google-reportedly-snags-up-team-behind-ai-voice-startup-hume-ai/)
- [Developer Frustrations - AssemblyAI 2026 Report](https://www.assemblyai.com/blog/new-2026-insights-report-what-actually-makes-a-good-voice-agent)
- [Voice AI Infrastructure Guide - Introl](https://introl.com/blog/voice-ai-infrastructure-real-time-speech-agents-asr-tts-guide-2025)
- [The Voice AI Stack - AssemblyAI](https://www.assemblyai.com/blog/the-voice-ai-stack-for-building-agents)
- [OpenAI Realtime API Pricing](https://platform.openai.com/docs/pricing)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Groq Pricing](https://groq.com/pricing)
- [Deepgram vs Whisper](https://deepgram.com/learn/whisper-vs-deepgram)
- [Best TTS APIs 2026 - Inworld](https://inworld.ai/resources/best-voice-ai-tts-apis-for-real-time-voice-agents-2026-benchmarks)
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M)
- [Handy GitHub](https://github.com/cjpais/Handy)
