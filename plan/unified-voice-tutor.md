# Unified Voice Tutor — Plan de Arquitectura

> Feature: Unificar los 6 tipos de sesión de voz en un solo tutor con personalidad coherente, memoria global, tool-use para manipular UI, y visual feedback unificado (orb).
> Fecha: 2026-02-19
> Status: Plan definido — pendiente de implementación

---

## Problema

Hoy Jarre tiene **6 sesiones de voz independientes**, cada una con su propia personalidad, hook, prompt y flujo:

| Sesión | Hook | Prompt | Rol del AI |
|--------|------|--------|-----------|
| Eval | `use-voice-eval-session.ts` | `voice-eval-prompts.ts` | Evaluador socrático encubierto |
| Practice | `use-voice-practice-session.ts` | `voice-practice-prompts.ts` | Mentor (productive failure) |
| Exploration | `use-voice-exploration-session.ts` | `voice-exploration-prompts.ts` | Guía de conexiones |
| Debate | `use-voice-debate-session.ts` | `voice-debate-prompts.ts` | Abogado del diablo |
| Freeform | `use-voice-freeform-session.ts` | `voice-freeform-prompts.ts` | Compañero intelectual |
| Teach | `use-voice-teach-session.ts` | `voice-eval-prompts.ts` | Junior confundido |

**Consecuencias:**
- 6 personalidades desconectadas — no se siente como UN tutor
- Código duplicado en scoring, connect/disconnect, state derivation
- Cada sesión tiene su propia state machine
- No hay capacidad de tool-use (scroll, navigate, show content)
- UI separada por tipo — no hay entidad visual unificada
- El tutor no puede "armar" la UI mientras habla

---

## Visión

Un **único tutor** con:
- **Una personalidad** constante que el estudiante reconoce
- **Múltiples estrategias pedagógicas** que se activan según contexto
- **Memoria global** que acumula conocimiento del estudiante across todas las sesiones
- **Tool-use** para manipular la UI en tiempo real (scroll, highlight, navigate, show cards)
- **Visual feedback** unificado: un orb animado que representa al tutor como entidad

---

## Investigación Académica

### Fuentes principales

| Paper/Sistema | Insight clave | Aplicación a Jarre |
|--------------|---------------|---------------------|
| **LearnLM** (Google DeepMind, 2024) | Comportamiento pedagógico via system instructions, no modelos separados. Hard constraints + soft constraints. | Un prompt base + instrucciones pedagógicas variables por modo |
| **Duolingo Video Call** | Pre-sesión genera plan, sesión ejecuta, post-sesión extrae knowledge. Combinar instrucciones degrada calidad. | Separar preparación de ejecución |
| **LOOM** (arXiv, Nov 2025) | Grafo dinámico de memoria: strengthen mode vs explore mode. Reagrupación de goals. | El tutor decide automáticamente si reforzar o explorar |
| **Khanmigo** (Khan Academy) | Problema #1 a escala: "I don't know". Necesita re-engagement fluido. | Estrategias de desbloqueo, no modos rígidos |
| **PersonaAgent** (Amazon, 2025) | Persona del tutor se refina iterativamente con cada sesión. | Learner persona que evoluciona |
| **KELE** (EMNLP 2025) | Separar decisión pedagógica de ejecución conversacional. | Meta-cognición del tutor como capa |
| **EducationQ** (ACL 2025) | Eficacia pedagógica no correlaciona con tamaño del modelo. La optimización del prompt es clave. | DeepSeek puede ser efectivo si se optimiza pedagógicamente |

### Fuentes de UI/UX

| Sistema | Insight |
|---------|---------|
| **Gemini Visual Design** (Google) | Gradientes como lenguaje, 3 estados animados (listening/thinking/speaking), "thoughtful imperfection" |
| **ChatGPT Voice** (Nov 2025) | Eliminó pantalla separada del orb. Voz y texto coexisten. Transcript visible en tiempo real. |
| **ElevenLabs UI Orb** | Componente React Three Fiber open source, audio-reactive, estados de agente |

### Papers completos

- [LearnLM: Improving Gemini for Learning](https://arxiv.org/html/2412.16429v2)
- [LOOM: Dynamic Learner Memory Graph](https://arxiv.org/abs/2511.21037)
- [EducationQ: Evaluating LLMs' Teaching Capabilities](https://aclanthology.org/2025.acl-long.1576/)
- [KELE: Multi-Agent Socratic Teaching](https://aclanthology.org/2025.findings-emnlp.888.pdf)
- [Knowledge Tracing in Tutor-Student Dialogues](https://dl.acm.org/doi/full/10.1145/3706468.3706501)
- [PersonaAgent: LLM Agents Meet Personalization](https://arxiv.org/abs/2506.06254)
- [Enhancing Critical Thinking with Socratic Chatbot](https://arxiv.org/html/2409.05511v1)
- [Conversational Spaced Repetition](https://davidbieber.com/snippets/2024-03-04-conversational-spaced-repetition/)
- [AI vs Human Voices and Avatars](https://link.springer.com/article/10.1007/s10639-025-13654-x)
- [LECTOR: LLM-Enhanced Spaced Learning](https://arxiv.org/html/2508.03275v1)
- [Gemini AI Visual Design](https://design.google/library/gemini-ai-visual-design)
- [ChatGPT Voice Unified Interface](https://techcrunch.com/2025/11/25/chatgpts-voice-mode-is-no-longer-a-separate-interface/)

---

## Decisiones Técnicas

### DB vs .md local

**Decisión: DB (Supabase). Sin debate.**

| Criterio | DB | .md local |
|----------|---|----|
| Queries filtradas en runtime (misconceptions por concepto, progress por nivel) | Indexed, 2-5ms | Parsear archivos, O(n) |
| Escrituras atómicas durante voice session | UPSERT con dedup | Read-parse-modify-write, race conditions |
| Concurrencia (múltiples sesiones/tabs) | RLS + transactions | File locks |
| Tool-use logging | INSERT por tool call | Append to file, sin estructura |
| Evolución del schema | Migrations | Refactor de parsers |

### Gemini Live API: Tool-Use

**Decisión: Sí soporta function calling nativo.**

Gemini Live (Multimodal Live API) permite declarar funciones arbitrarias que el modelo puede invocar mid-conversation:

```
Tutor hablando → "Mirá el concepto de Raft..."
  → PAUSA (~100ms para acciones locales)
  → Gemini emite: toolCall { name: "scroll_to_concept", args: { id: "raft" } }
  → Cliente ejecuta: scrollToSection("raft")
  → Cliente responde: toolResponse { success: true }
  → Tutor retoma: "...como podés ver acá, el líder..."
```

**Dos modos:**
- **BLOCKING** (recomendado): modelo pausa mientras espera resultado. Aceptable para acciones UI (<100ms).
- **NON_BLOCKING** (futuro): modelo sigue hablando. Bug conocido: alucina respuestas especulativas antes de recibir resultado (googleapis/python-genai#1894).

**Decisión: Empezar con BLOCKING.** Las funciones de UI son locales y resuelven en <100ms.

### Arquitectura del prompt unificado

**Decisión: Patrón LearnLM — un prompt base + instrucciones pedagógicas variables.**

```
BASE PERSONA (constante en todas las sesiones)
├── Nombre, voz, personalidad, estilo conversacional
├── Conocimiento del dominio (lo que el estudiante está aprendiendo)
├── Learner persona (cómo piensa, qué le funciona, qué le cuesta)
└── Tool declarations (qué puede hacer en la UI)

PEDAGOGICAL INSTRUCTIONS (variable por modo)
├── Modo actual: practice | eval | exploration | debate | freeform | teach
├── Hard constraints del modo (ej: "en eval, NUNCA revelar la respuesta")
├── Soft constraints globales (ej: "usá analogías concretas")
├── Conceptos objetivo de la sesión
├── Misconceptions conocidas a atacar
└── Nivel de dificultad target

META-COGNITION (instrucciones de runtime)
├── Cuándo y cómo usar cada tool
├── Cuándo escalar/des-escalar dificultad
├── Cuándo cerrar la sesión (via tool, no keyword)
└── Cómo manejar "no sé" y bloqueos
```

---

## Arquitectura Target

```
┌──────────────────────────────────────────────────────────────┐
│                    UNIFIED TUTOR (Gemini Live)                │
│                                                               │
│  System Instruction:                                          │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ BASE PERSONA (constante)                             │      │
│  │ + PEDAGOGICAL INSTRUCTIONS (por modo)                │      │
│  │ + LEARNER MEMORY (pre-fetched de Supabase)           │      │
│  │ + TOOL DECLARATIONS (scroll, show, navigate, end)    │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                               │
│  Modes: eval | practice | explore | debate | freeform | teach │
│  (misma persona, distinta estrategia pedagógica)              │
└───────────────┬───────────────────────┬───────────────────────┘
                │                       │
      WebSocket Audio             Tool Calls (BLOCKING)
                │                       │
┌───────────────▼───────────────────────▼───────────────────────┐
│                     CLIENTE (React)                            │
│                                                                │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   TUTOR   │  │  TRANSCRIPT  │  │    CONTENT PANEL       │  │
│  │   ORB     │  │  (live)      │  │  (scrollable,          │  │
│  │           │  │              │  │   highlightable,       │  │
│  │ states:   │  │ Real-time    │  │   navigable)           │  │
│  │ idle      │  │ transcription│  │                        │  │
│  │ listening │  │ of both      │  │  Tool actions:         │  │
│  │ thinking  │  │ parties      │  │  - scroll_to_concept   │  │
│  │ speaking  │  │              │  │  - show_definition     │  │
│  └───────────┘  └──────────────┘  │  - highlight_text      │  │
│                                    │  - show_diagram        │  │
│                                    │  - navigate_to_page    │  │
│                                    └────────────────────────┘  │
│                                                                │
│  Unified Hook: useUnifiedVoiceSession()                        │
│  ├── Replaces all 6 individual hooks                           │
│  ├── Mode parameter determines pedagogical strategy            │
│  ├── Tool handler dispatches UI actions                        │
│  └── Single state machine for all modes                        │
└────────────────────────────┬───────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │    Supabase DB    │
                   │                   │
                   │ learner_memory    │
                   │ voice_sessions    │
                   │ concept_progress  │
                   │ voice_tool_calls  │  ← NEW
                   │ voice_transcripts │
                   │ consumption_log   │
                   └───────────────────┘
```

---

## Plan de Implementación

### Fase 0: Preparación (no rompe nada existente)

**0.1 — Nueva tabla `voice_tool_calls`**

```sql
CREATE TABLE voice_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  error TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_tool_calls_session ON voice_tool_calls(session_id, created_at);

ALTER TABLE voice_tool_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tool calls" ON voice_tool_calls
  FOR ALL USING (
    session_id IN (SELECT id FROM voice_sessions WHERE user_id = auth.uid())
  );
```

**0.2 — Agregar tool-call support a `gemini-live.ts`**

Extender `GeminiLiveCallbacks` con:
```typescript
onToolCall?: (toolCalls: FunctionCall[]) => void;
onToolCallCancellation?: (cancelledIds: string[]) => void;
```

Agregar método `sendToolResponse()` al cliente.

**0.3 — Definir tool declarations como constante**

```typescript
// src/lib/voice/tool-declarations.ts
export const VOICE_TUTOR_TOOLS: FunctionDeclaration[] = [
  { name: 'scroll_to_concept', ... },
  { name: 'show_definition', ... },
  { name: 'highlight_section', ... },
  { name: 'end_session', ... },
  { name: 'mark_discussed', ... },
];
```

---

### Fase 1: Prompt Unificado (el corazón del cambio)

**1.1 — Diseñar base persona**

Crear `src/lib/llm/voice-unified-prompt.ts`:
- `buildBasePersona(language)` — personalidad constante
- `buildPedagogicalInstructions(mode, concepts, memory, options)` — variable por modo
- `buildToolInstructions()` — cuándo y cómo usar cada tool
- `buildUnifiedSystemInstruction(params)` — compositor que ensambla todo

**1.2 — Migrar lógica de cada prompt existente**

Cada archivo `voice-*-prompts.ts` tiene lógica pedagógica valiosa que NO se descarta:
- `voice-eval-prompts.ts` → `mode: 'eval'` instructions (Socratic evaluation, AI detection, depth guidance)
- `voice-practice-prompts.ts` → `mode: 'practice'` instructions (productive failure, AutoTutor escalation)
- `voice-exploration-prompts.ts` → `mode: 'exploration'` instructions (mastery-adaptive walkthrough)
- `voice-debate-prompts.ts` → `mode: 'debate'` instructions (adversarial discourse, misconception exploitation)
- `voice-freeform-prompts.ts` → `mode: 'freeform'` instructions (cross-pollination, open questions)
- `voice-eval-prompts.ts` (teach) → `mode: 'teach'` instructions (confused junior)

**1.3 — Scoring prompts permanecen separados**

`buildVoiceScoringPrompt()` y `buildVoicePracticeScoringPrompt()` NO cambian — son para DeepSeek post-sesión, no para Gemini Live.

---

### Fase 2: Hook Unificado

**2.1 — Crear `useUnifiedVoiceSession()`**

Un solo hook que reemplaza los 6 individuales:

```typescript
interface UseUnifiedVoiceSessionParams {
  mode: 'eval' | 'practice' | 'exploration' | 'debate' | 'freeform' | 'teach';
  sectionId?: string;
  sectionContent?: string;
  conceptIds?: string[];
  resourceId?: string;
  userResourceId?: string;
  language: Language;
  // Tool handlers
  onToolCall?: (call: ToolCall) => ToolResponse;
}

interface UnifiedVoiceSession {
  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;

  // State
  connectionState: ConnectionState;
  tutorState: TutorState;  // idle | listening | thinking | speaking
  sessionId: string | null;
  elapsed: number;
  error: string | null;

  // Results (populated after scoring)
  result: SessionResult | null;
  isScoring: boolean;
}
```

**2.2 — Extraer scoring a hook separado**

`useVoiceSessionScoring(endpoint, onSuccess)` — elimina duplicación entre eval/practice/teach.

**2.3 — State machine unificada**

```
idle → connecting → active → scoring → done
                     ↑          ↓
                     └── error ──┘
```

En `active`, el `tutorState` (idle/listening/thinking/speaking) viene del base hook existente.

---

### Fase 3: Tool Handler en Cliente

**3.1 — Tool dispatcher**

```typescript
// src/lib/voice/tool-handler.ts
export function createToolHandler(dispatch: ToolDispatch): ToolCallHandler {
  return (call: FunctionCall) => {
    switch (call.name) {
      case 'scroll_to_concept':
        dispatch({ type: 'SCROLL_TO', conceptId: call.args.conceptId });
        return { success: true };
      case 'show_definition':
        dispatch({ type: 'SHOW_DEFINITION', conceptId: call.args.conceptId });
        return { success: true };
      case 'end_session':
        dispatch({ type: 'END_SESSION', reason: call.args.reason });
        return { success: true };
      // ...
    }
  };
}
```

**3.2 — Logging de tool calls (fire-and-forget)**

Cada tool call se loguea a `voice_tool_calls` sin bloquear.

**3.3 — Reemplazar keyword detection por tool**

Actualmente: regex `\bsession complete\b` en transcript → auto-disconnect.
Nuevo: Gemini llama `end_session(reason)` → handler cierra sesión.
Más confiable, sin falsos positivos, sin mínimo de 120 segundos.

---

### Fase 4: UI Unificada

**4.1 — Tutor Glow Component (CSS puro MVP)**

NO un orb (eso es "personaje"). Es un **glow ambiental** — una presencia intelectual, no una entidad separada.

Color: **Ámbar/dorado (#d97706)** — luz de biblioteca, sesión de estudio nocturna. Cálido sin ser infantil, serio sin ser frío.

La intensidad modula el estado, NO el color:

```
Estados visuales (mismo ámbar, distinta intensidad):
- idle: glow tenue, apenas visible (opacity 0.15, breathe lento 4s)
- listening: glow se intensifica, respira con la voz del usuario (audio-reactive)
- thinking: glow pulsa lento, concentrado (opacity 0.3, pulse 2s)
- speaking: glow se expande suavemente con el audio del tutor (audio-reactive)
- error: glow rojo tenue, estático
```

Implementación CSS puro con Tailwind + CSS custom properties:
```tsx
<div
  className="fixed bottom-0 inset-x-0 h-32 pointer-events-none"
  style={{
    '--glow-intensity': audioLevel, // 0-1 from useAudioLevel hook
    opacity: state === 'idle' ? 0.15 : 0.4 + audioLevel * 0.4,
  }}
>
  <div className="w-full h-full bg-gradient-radial from-amber-600/30 to-transparent blur-3xl
                  transition-opacity duration-300" />
</div>
```

Upgrade path: si el CSS se queda corto → Canvas 2D (voice-orb-visualizer, 0 deps pesadas). Three.js solo si se necesitan formas orgánicas/partículas.

**4.2 — Layout híbrido con transcript**

NO pantalla completa separada. El tutor es una capa sobre el contenido.
Transcript: **híbrido** — última línea siempre visible, expandible para historial completo.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              CONTENT PANEL                       │
│  (concepts, definitions, diagrams)               │
│                                                  │
│  ← scrollable by tutor tool calls                │
│  ← highlightable by tutor tool calls             │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  🟠 "...el líder replica el log antes de..."     │ ← última línea transcript
│  [expandir historial ▼]                          │
├──────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░ AMBER GLOW ░░░░░░░░░░░░░░░░░░░░░  │ ← glow ambiental
│  ░░░░░░░░ (audio-reactive, bottom edge) ░░░░░░░  │
└──────────────────────────────────────────────────┘
```

**4.3 — Migrar flows existentes**

- `voice-evaluation-flow.tsx` (725 líneas) → migrar a layout unificado
- `voice-practice-flow.tsx` (610 líneas) → migrar a layout unificado
- `VoiceSessionOverlay.tsx` → reemplazar por glow + panel

---

### Fase 5: Learner Persona Evolutiva

**5.1 — Extender learner memory con "learning style profile"**

Post-sesión, DeepSeek analiza el transcript y actualiza un perfil:

```typescript
interface LearnerProfile {
  // Cómo aprende mejor
  respondsWellTo: string[];     // "analogías concretas", "preguntas de tradeoff"
  getsBlockedBy: string[];      // "preguntas abiertas sin contexto", "abstracción excesiva"
  conversationalStyle: string;  // "conciso", "verbose", "pregunta mucho"

  // Evoluciona con cada sesión
  updatedAt: string;
}
```

**5.2 — Inyectar perfil en base persona**

El tutor adapta su estilo no solo al modo, sino al estudiante:
```
"Este estudiante tiende a sobre-simplificar trade-offs.
Responde mejor a analogías concretas.
Se frustra con preguntas demasiado abiertas sin contexto.
Adapta tu estilo acorde."
```

---

### Fase 6: Knowledge Tracing Post-Sesión

**6.1 — Análisis de transcript enriquecido**

Después de cada sesión (cualquier modo), DeepSeek analiza:
- Qué conceptos se discutieron (incluso si no eran el objetivo)
- Cuáles se demostraron entendidos
- Cuáles tuvieron misconceptions nuevas
- Qué tools usó el tutor y si fueron efectivas
- Señales para FSRS (parcialmente correcto ≠ incorrecto por misconception)

**6.2 — Alimentar FSRS con señales conversacionales**

No solo scores discretos: una respuesta parcialmente correcta con buena intuición debería schedulear diferente a una incorrecta por misconception fundamental.

---

## Orden de Ejecución y Dependencias

```
Fase 0 (Preparación)
├── 0.1 voice_tool_calls table
├── 0.2 gemini-live.ts tool support
└── 0.3 tool declarations constant
     ↓
Fase 1 (Prompt Unificado)          Fase 4.1 (Glow CSS MVP)
├── 1.1 base persona                ├── glow component (ámbar)
├── 1.2 migrate mode instructions   ├── useAudioLevel hook
└── 1.3 keep scoring prompts        └── state animations
     ↓                                   ↓
Fase 2 (Hook Unificado)            Fase 4.2 (Layout Híbrido)
├── 2.1 useUnifiedVoiceSession      ├── glow + content + transcript
├── 2.2 useVoiceSessionScoring      └── tool action rendering
└── 2.3 unified state machine
     ↓
Fase 3 (Tool Handler)
├── 3.1 tool dispatcher
├── 3.2 tool call logging
└── 3.3 replace keyword detection
     ↓
Fase 4.3 (Migrate existing flows)
     ↓
Fase 5 (Learner Persona)
     ↓
Fase 6 (Knowledge Tracing)
```

**Fases 0-3** son el core — sin esto no hay tutor unificado.
**Fase 4** es el UI — puede avanzar en paralelo con Fases 1-2.
**Fases 5-6** son mejoras incrementales que pueden venir después.

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Prompt unificado demasiado largo | Degradación de calidad (hallado por Duolingo) | Separar preparación de ejecución. Pre-sesión LLM call genera plan, sesión ejecuta. |
| Tool calls agregan latencia | Pausas perceptibles durante conversación | BLOCKING mode + acciones locales (<100ms). Si latencia > 200ms, considerar NON_BLOCKING con fallback. |
| NON_BLOCKING hallucinations | Modelo alucina antes de recibir resultado | Quedarse en BLOCKING. Reevaluar cuando Gemini fixee el bug. |
| Migración rompe sesiones existentes | Regresión en funcionalidad actual | Migrar un modo a la vez (freeform → debate → exploration → practice → eval → teach). Testear cada uno antes de borrar hook viejo. Git revert como safety net. |
| Context window de Gemini (~15 min sin compresión) | Sesiones largas pierden contexto | Ya manejado con transcript buffer. Tool calls no agregan mucho al contexto. |
| Glow CSS insuficiente visualmente | No genera el impacto deseado | Empezar con CSS puro. Upgrade a Canvas 2D si necesario. Three.js solo como último recurso. |

---

## Métricas de Éxito

- [ ] Un solo hook maneja todos los modos de sesión
- [ ] El tutor puede scroll/highlight/navigate via tool calls durante conversación
- [ ] El session end usa tool call, no keyword detection
- [ ] El glow ámbar refleja los 5 estados (idle, listening, thinking, speaking, error)
- [ ] La UI no es full-screen takeover — contenido visible durante sesión
- [ ] Learner memory se actualiza después de TODAS las sesiones (no solo eval/practice)
- [ ] Zero regresión en funcionalidad existente de eval/practice/teach scoring

---

## Referencias a Código Existente

| Archivo | Líneas | Rol actual | Destino |
|---------|--------|-----------|---------|
| `src/components/voice/use-voice-session.ts` | 740 | Base hook (WebSocket, audio, reconnect) | Se mantiene como base |
| `src/lib/voice/gemini-live.ts` | 342 | Cliente Gemini SDK | Extender con tool support |
| `src/components/voice/use-voice-eval-session.ts` | 206 | Hook eval | Migrar a useUnifiedVoiceSession mode='eval' |
| `src/components/voice/use-voice-practice-session.ts` | 199 | Hook practice | Migrar a mode='practice' |
| `src/components/voice/use-voice-exploration-session.ts` | 212 | Hook exploration | Migrar a mode='exploration' |
| `src/components/voice/use-voice-debate-session.ts` | 129 | Hook debate | Migrar a mode='debate' |
| `src/components/voice/use-voice-freeform-session.ts` | 108 | Hook freeform | Migrar a mode='freeform' |
| `src/components/voice/use-voice-teach-session.ts` | 182 | Hook teach | Migrar a mode='teach' |
| `src/lib/llm/voice-eval-prompts.ts` | 495 | Prompts eval + teach | Extraer a módulos de modo |
| `src/lib/llm/voice-practice-prompts.ts` | 288 | Prompt practice | Extraer a módulo de modo |
| `src/lib/llm/voice-exploration-prompts.ts` | 420 | Prompt exploration | Extraer a módulo de modo |
| `src/lib/llm/voice-debate-prompts.ts` | 170 | Prompt debate | Extraer a módulo de modo |
| `src/lib/llm/voice-freeform-prompts.ts` | 201 | Prompt freeform | Extraer a módulo de modo |
| `src/components/voice/voice-evaluation-flow.tsx` | 725 | UI eval completa | Migrar a layout unificado |
| `src/components/voice/voice-practice-flow.tsx` | 610 | UI practice completa | Migrar a layout unificado |
| `src/components/voice/VoiceSessionOverlay.tsx` | 177 | Overlay freeform/debate | Reemplazar por orb + panel |

---

## Decisiones Tomadas

### D1: Personalidad del tutor — Abierta y evolutiva

**No hay nombre fijo ni persona predefinida.** La personalidad emerge de rasgos invariantes observados en las sesiones que mejor funcionan (practice, teaching, exploration):

**Rasgos invariantes (el ADN del tutor):**

```
IDENTIDAD:
- Ingeniero senior. Colega, no profesor. Nunca condescendiente.
- Español rioplatense natural: "vos", "dale", "ponele". Jamás "vale" ni "tío".
- Opiniones reales. Desacuerda cuando tiene otra mirada.
- Piensa en voz alta: "Dejame pensar eso... sí, el tema es..."

COMUNICACIÓN:
- Conciso. Ritmo oral natural. Oraciones cortas.
- Sin muletillas de arranque: "Dale", "Bueno", "De una" → directo al contenido.
- No más de 30 segundos sin pausa o pregunta.
- Termina sus ideas. No deja cosas a medias.

ANTI-ADULACIÓN (NO NEGOCIABLE):
- Nunca "Buena pregunta!", "Qué interesante!", "Excelente punto!"
- Feedback directo: "Bien", "No del todo", "Cerca — pensá en..."
- Reacciones mínimas: "OK", "Entendido" → siguiente pregunta.
- Si la comprensión está mal, lo dice con onda pero directo.
- Si una conexión no se sostiene, explica por qué.
- No dice "buen punto" a menos que genuinamente lo sea.

ENGAGEMENT:
- Curiosidad intelectual genuina, no simulada.
- Sigue la energía del estudiante.
- Usa las analogías y ejemplos del estudiante de vuelta.
- Ejemplos concretos de sistemas reales, no abstracciones vacías.
```

**Lo que varía por modo** es la ESTRATEGIA, no la persona:
- En eval: evalúa encubiertamente, no revela respuestas
- En practice: guía con productive failure, escala con AutoTutor
- En exploration: hace puentes mecanísticos entre recurso y currículo
- En debate: defiende posición contraria con argumentos reales
- En freeform: sigue el hilo del estudiante, cross-pollination
- En teach: actúa como junior confundido (único modo donde cambia rol)

**Evolución:** La personalidad se refina con cada sesión. Post-sesión, DeepSeek actualiza un "learner profile" que describe cómo aprende mejor este estudiante, y el tutor adapta su estilo acorde (Fase 5).

---

### D2: Pre-sesión inteligente — Contexto adaptivo

**Sí a la pre-sesión, pero inteligente sobre qué traer.**

No siempre traer todo. La lógica de qué contexto pre-fetchear depende del modo y del historial:

```typescript
// Lógica de contexto adaptivo
function resolvePreSessionContext(mode, sessionHistory, sectionId) {
  // ¿Cuántas sesiones previas tiene en esta sección?
  const prevSessions = sessionHistory.filter(s => s.sectionId === sectionId);

  if (prevSessions.length === 0) {
    // Primera vez: NO traer summary (no hay), solo learner memory global
    return { summary: null, learnerMemory: fetchGlobal() };
  }

  const lastSession = prevSessions[0];
  const hoursSinceLast = hoursAgo(lastSession.endedAt);

  if (hoursSinceLast < 2) {
    // Retomando sesión reciente: solo últimos minutos
    // El estudiante recuerda lo que pasó, no necesita recap completo
    return {
      summary: lastSession.cachedSummary?.slice(-500), // últimos ~500 chars
      learnerMemory: fetchForConcepts(lastSession.conceptIds),
    };
  }

  if (hoursSinceLast < 48) {
    // Hace poco: summary completo pero sin transcript detallado
    return {
      summary: lastSession.cachedSummary,
      learnerMemory: fetchForConcepts(lastSession.conceptIds),
    };
  }

  // Hace días: summary + highlight de misconceptions pendientes
  return {
    summary: lastSession.cachedSummary,
    learnerMemory: fetchGlobal(), // traer todo, puede haber evolucionado
    staleWarning: true, // el tutor puede decir "hace unos días vimos..."
  };
}
```

**Para el prompt de Gemini:** El contexto se inyecta con etiquetas que le dicen al tutor qué tan viejo es:
```
PREVIOUS SESSION (2 days ago):
[summary]

KNOWN ABOUT THIS STUDENT:
[learner memory]

Note: It's been a few days. Briefly check if they still remember key points before diving deep.
```

---

### D3: Migración directa — Sin feature flag

**Decisión: Migración directa, sin dead code.**

Razones:
- Feature flag implica mantener DOS codepaths (6 hooks viejos + 1 nuevo) durante semanas
- El sistema tiene UN usuario — no necesita A/B testing
- Los hooks viejos tienen lógica que se migra al nuevo, no se descarta
- Dead code viola las reglas del proyecto (`CLAUDE.md`: "REMOVE unused code")

**Estrategia de migración segura SIN feature flag:**

```
Fase 1: Crear el nuevo sistema EN PARALELO (no reemplaza nada aún)
  └── voice-unified-prompt.ts, useUnifiedVoiceSession (new files)
  └── Los hooks viejos siguen funcionando

Fase 2: Migrar UN modo a la vez, testear, commitear
  └── Orden: freeform (más simple) → debate → exploration → practice → eval → teach
  └── Cada migración: actualizar el componente que usa el hook viejo → usar el nuevo
  └── Testear que funciona → borrar el hook viejo → commit

Fase 3: Cuando todos los modos están migrados
  └── Borrar todos los hooks viejos
  └── Borrar los archivos de prompts viejos (la lógica ya está en módulos del nuevo)
  └── Clean codebase, zero dead code
```

**Safety net:** Git. Si algo se rompe, `git revert` del commit específico. Más simple que mantener flags.

---

### D4: Visual — Glow ámbar ambiental, no orb

- **Glow ambiental**, no orb. Presencia intelectual, no personaje.
- **Color ámbar/dorado (#d97706)** constante. Los estados modulan intensidad, no color.
- **Transcript híbrido**: última línea siempre visible, expandible para historial.
- **CSS puro para MVP**. Upgrade path: Canvas 2D → Three.js (solo si necesario).

---

### Open Questions (restantes)

*Ninguna bloqueante para empezar la implementación.*
