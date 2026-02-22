# TEN Framework — Deep Technical Dive

**Status: DESCARTADO — Not recommended for Jarre**

## Overview

- **GitHub:** ~10.1k stars, ~1.2k forks, ~1,915 commits
- **Organization:** TEN-framework (Chinese company, theten.ai)
- **License:** Apache 2.0
- **Open issues:** ~151

## Architecture: Extension/Graph Model

TEN uses **extensions as nodes in a directed graph**:

- **Runtime Core**: Rust (`ten_rust`) + C++ (`ten_runtime`). Handles extension lifecycle, message routing, graph processing
- **Extensions**: Modular components communicating exclusively via message passing (never direct calls)
- **Graph**: Defined declaratively in `property.json` with:
  - **Nodes**: Extension instances with config properties
  - **Connections**: Directed message flows between nodes
  - **Exposed Messages**: External data entry/exit points

### Graph Processing Pipeline

```
Parse → Validate → Expand → Flatten Selectors → Flatten Subgraphs → Inject Graph Proxy → Schema Check
```

### Message Types

- `Cmd`: Control commands expecting response
- `Data`: Generic payloads (text, JSON)
- `AudioFrame`: Audio samples with timestamps
- `VideoFrame`: Visual frames with metadata

### Extension Lifecycle

`on_init` → `on_start` → `on_cmd/on_data` → `on_stop` → `on_deinit`

### TMAN Designer

Visual graph editor at `localhost:49483` for drag-and-drop prototyping. Interesting but not suitable for production.

## Language Support

| Language | Status | Mechanism |
|----------|--------|-----------|
| C++ | Mature | Native linking to runtime |
| Python | Mature | C extension `libten_runtime_python` |
| Go | Mature | Bridge via CGO |
| **Node.js/TypeScript** | **Experimental/Future** | N-API native addon |

**Critical for our case:** Node.js/TypeScript support exists as N-API binding but documentation describes it as future support. Custom extensions are primarily Python/C++/Go. **Cannot write mature custom extensions in TypeScript today.**

## Client-Side Integration

### Two Transport Modes

1. **RTC (via Agora)**: Primary mode. Requires Agora App ID + Certificate. Audio travels via Agora's RTC network. **Introduces strong dependency on proprietary third-party service.**
2. **WebSocket**: Alternative mode. Less documented.

### No Official React/Next.js SDK

- Example frontend is React but not designed as reusable library
- Integration requires:
  - Running TEN backend as separate Docker service
  - Connecting Next.js via WebSocket or Agora SDK
  - Managing audio session manually on frontend

**Significantly more complex than current Gemini Live WebSocket integration.**

## Voice Pipeline

```
Audio In → VAD → STT → LLM → TTS → Audio Out
```

### Supported Providers (via extensions)

- **STT**: Deepgram, Google, Azure
- **LLM**: OpenAI, DeepSeek, Gemini, Qwen
- **TTS**: ElevenLabs, FishAudio, Azure
- **VAD**: TEN VAD (proprietary, 306KB, RT factor 0.015)
- **Speech-to-Speech**: OpenAI Realtime API, Gemini Live

Configuration is declarative in `property.json`.

## Turn-Taking & Interruptions

**TEN VAD (proprietary):**
- 306KB, real-time factor 0.015 on AMD Ryzen
- Significantly faster than Silero VAD
- 16kHz with configurable hop sizes (160/256 samples = 10/16ms)
- Cross-platform: Linux, Windows, macOS, Android, iOS, WASM

- Turn detection: Dedicated module separate from VAD
- Barge-in: Supported via interrupt detector

## Tool Calling

- Documentation references "tool call logs" and agent task responses
- MCP (Model Context Protocol) integration via MCP Registry
- Example: Bing Search as tool
- **Documentation is sparse.** No clear guides for custom tool implementation compared to LiveKit or Pipecat.

## Latency

No official end-to-end benchmarks published.

- **TEN VAD**: RT factor 0.015 (extremely fast)
- **RTC transport (Agora)**: Sub-100ms for audio
- **Full pipeline**: Depends on chosen providers
- Marketing claims "hundreds or even tens of milliseconds" but no rigorous data

## Community & Maturity Assessment

**Honest evaluation:**
- Project has traction but **community is still small**
- Hacker News discussion was superficial — few production usage reports
- Documentation is **weak**: missing detailed guides, code comments, advanced examples
- SSL on documentation site (`doc.theten.ai`) was broken during investigation
- **No prominent companies publicly report production usage**
- Chinese company with limited transparency on funding, team, long-term roadmap

## Reasons for Rejection

1. **No mature TypeScript/Node.js support** — can't write custom extensions in TS
2. **No React/Next.js SDK** — must build own integration
3. **Agora dependency** — vendor lock-in to proprietary service for RTC mode
4. **Docker mandatory** — minimum 2 CPU cores, 4GB RAM
5. **Poor documentation** — multiple sources confirm this
6. **Low transparency** — unclear company funding, roadmap
7. **Immature ecosystem** — few production deployments reported
8. **Overkill for our use case** — designed for complex multimodal graphs, not simple voice tutoring

## When TEN Would Make Sense

- Complex multimodal pipelines (audio + video + avatars)
- Live2D/HeyGen avatar integration
- Projects already using C++/Go/Python
- Need for visual graph editor for non-developers

## Sources

- [TEN Framework GitHub](https://github.com/TEN-framework/ten-framework)
- [TEN Agent GitHub](https://github.com/TEN-framework/TEN-Agent)
- [TEN VAD GitHub](https://github.com/TEN-framework/ten-vad)
- [DeepWiki - TEN Framework](https://deepwiki.com/TEN-framework/ten-framework/2-getting-started)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=41623997)
- [AssemblyAI - Orchestration Tools Comparison](https://www.assemblyai.com/blog/orchestration-tools-ai-voice-agents)
