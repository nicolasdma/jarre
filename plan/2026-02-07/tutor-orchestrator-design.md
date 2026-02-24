# Tutor Orchestrator — Embodied AI Tutor Design

> The tutor doesn't just chat. It inhabits the playground.

## The Problem

The current tutor is a chatbot in a sidebar. It reads simulation state and responds with text. But it can't point at things, highlight what matters, dim what doesn't, or draw attention paths. It's blind to the visual layer.

## The Vision

An AI entity that:
- Highlights the leader node with a glow when asking "¿por qué ganó la elección?"
- Dims everything except two nodes when explaining a partition
- Draws an animated trace between nodes to show a RequestVote flow
- Shakes a node that's about to fail
- Pulses a metric that just breached an SLO
- Has a subtle "breathing" presence indicator

## Architecture: 3 Layers

```
┌─────────────────────────────────────────────┐
│  LLM API (returns JSON: speech + actions)   │  ← Brain
├─────────────────────────────────────────────┤
│  TutorOrchestrator (React Context)          │  ← Nervous System
│  - Validates actions against current state   │
│  - Manages timers/animations/queues         │
│  - Exposes overlay state                    │
├─────────────────────────────────────────────┤
│  Playground Components (consume overlays)   │  ← Body
│  - useTutorOverlay(elementId) hook          │
│  - CSS-only effects (no logic changes)      │
└─────────────────────────────────────────────┘
```

## Layer 1: Brain (LLM)

### Model Selection

**Primary: Gemini 2.0 Flash**
- Cheapest: $0.10/1M input, $0.40/1M output
- Fastest: ~800ms latency
- Native structured output support
- Free tier: 250 req/day (enough for personal use)

**Fallback: DeepSeek V3.1**
- Already integrated
- $0.15/1M input, $0.75/1M output

### Response Format

```typescript
interface TutorResponse {
  speech: string;              // What it says in the chat
  actions: TutorAction[];      // What it does in the playground
  focus?: string;              // Element to center/scroll to
}

interface TutorAction {
  type: 'glow' | 'dim' | 'annotate' | 'trace' | 'shake' | 'pulse' | 'spotlight';
  targets: string[];           // Element IDs from the playground
  color?: string;              // Override color
  label?: string;              // For annotate actions
  duration?: number;           // ms, default 3000
}
```

### Prompt Strategy

The system prompt must:
1. List available element IDs (from current state)
2. List available action types with descriptions
3. Enforce the JSON schema
4. Say: "Use 1-3 actions max per response. Less is more."

Example system prompt addition:
```
ELEMENTOS DISPONIBLES: node-0 (follower, alive), node-1 (candidate, alive), node-2 (leader, alive)
ACCIONES: glow(targets, color), dim(targets), annotate(target, label), trace(from, to), shake(target), pulse(target), spotlight(target)
Responde SIEMPRE en JSON: { "speech": "...", "actions": [...] }
Usa máximo 3 acciones. Menos es más.
```

### Validation

The orchestrator MUST validate before executing:
- Target IDs exist in current state
- Action types are known
- Duration is reasonable (100ms - 10000ms)
- Fallback: if any action is invalid, skip it, still show speech

## Layer 2: Nervous System (TutorOrchestrator)

### React Context

```typescript
interface TutorOverlayState {
  glows: Map<string, { color: string; intensity: number }>;
  dimmed: Set<string>;
  annotations: Map<string, { text: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
  traces: Array<{ from: string; to: string; color: string; progress: number }>;
  shaking: Set<string>;
  pulsing: Set<string>;
}

interface TutorOrchestratorAPI {
  executeActions(actions: TutorAction[], validTargets: string[]): void;
  clearAll(): void;
  overlay: TutorOverlayState;
}
```

### Responsibilities

1. **Validate** action targets against known element IDs
2. **Execute** actions by updating overlay state
3. **Time** durations — auto-clear after `duration` ms with fade-out
4. **Queue** conflicting actions (e.g., don't glow + dim same element)
5. **Rate limit** — max 1 action batch per 2 seconds

### Timer Management

Each action gets a timeout:
```typescript
executeAction(action) {
  applyEffect(action);
  setTimeout(() => removeEffect(action.id), action.duration ?? 3000);
}
```

## Layer 3: Body (Playground Components)

### Hook

```typescript
function useTutorOverlay(elementId: string): {
  isGlowing: boolean;
  glowColor: string;
  isDimmed: boolean;
  annotation: string | null;
  isShaking: boolean;
  isPulsing: boolean;
}
```

Each visual component calls this hook with its ID and applies CSS accordingly.

### CSS Effects

```css
/* Glow */
.tutor-glow {
  box-shadow: 0 0 15px 5px var(--glow-color);
  transition: box-shadow 0.3s ease;
}

/* Dim */
.tutor-dimmed {
  opacity: 0.25;
  transition: opacity 0.5s ease;
}

/* Annotate */
.tutor-annotation {
  position: absolute;
  background: #1a1a1a;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
  animation: fadeInUp 0.3s ease;
}

/* Trace (SVG overlay) */
.tutor-trace {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: traceDraw 1s ease forwards;
}

/* Shake */
.tutor-shake {
  animation: shake 0.5s ease;
}

/* Pulse */
.tutor-pulse {
  animation: pulse 1s ease infinite;
}

/* Spotlight = dim all + glow target */
```

### Trace Implementation

Traces need an SVG overlay layer on top of the playground:
```tsx
<div className="relative">
  <ClusterVisualizer ... />
  <svg className="absolute inset-0 pointer-events-none">
    {traces.map(trace => (
      <line
        x1={getPosition(trace.from).x}
        y1={getPosition(trace.from).y}
        x2={getPosition(trace.to).x}
        y2={getPosition(trace.to).y}
        className="tutor-trace"
      />
    ))}
  </svg>
</div>
```

This requires playground components to expose element positions (getBoundingClientRect or stored coordinates).

## "Alive" Presence Effects

Beyond explicit actions:

1. **Breathing dot**: A small indicator (e.g., near the tutor tab) that gently pulses with a 3s CSS animation. Always on. Says "I'm watching."

2. **Passive notice**: When a significant event happens but the tutor doesn't speak, a micro-flash on the panel border. 200ms. Subtle. "I noticed."

3. **Typing with personality**: Character-by-character display with 30ms delay, slight randomness (20-40ms). Not mechanical.

4. **Focus follows speech**: When the tutor mentions a node by name, auto-highlight it for 2s even without an explicit glow action.

## Files to Create

1. `src/lib/llm/gemini.ts` — Gemini Flash client (structured output)
2. `src/components/playground/tutor-orchestrator.tsx` — React Context + Provider
3. `src/components/playground/use-tutor-overlay.ts` — Hook
4. `src/components/playground/tutor-effects.css` — CSS animations
5. `src/components/playground/trace-overlay.tsx` — SVG trace layer

## Files to Modify

1. Each playground's visualizer component — add `useTutorOverlay` calls
2. Each playground orchestrator — wrap with `TutorOrchestratorProvider`
3. `tutor-panel.tsx` — parse structured JSON response, dispatch actions
4. `tutor-prompts.ts` — add available targets + action vocabulary to system prompt

## Risks

1. **LLM hallucinating target IDs** → Strict validation, fallback to speech-only
2. **Position mapping for traces** → Need each playground to expose coordinates
3. **Visual noise** → Rate limiting + "less is more" prompt engineering
4. **Latency** → Gemini Flash at ~800ms is acceptable; local LLM (3-5s) is not

## Cost Estimate

~1,100 tokens per interaction. At Gemini Flash rates:
- 100 interactions/day = ~$0.017/day = ~$0.50/month
- Free tier covers 250 req/day = more than enough
