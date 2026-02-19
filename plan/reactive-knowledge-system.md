# Reactive Knowledge System — Plan Unificado

> Feature: Sistema de conocimiento reactivo con recursos externos, tutor conversacional libre, memoria enriquecida, y motor de insights proactivo.
> Fecha: 2026-02-18
> Status: Plan aprobado

---

## Visión

Jarre pasa de "bucket fijo de contenido con currícula estática" a **sistema de conocimiento reactivo** donde:

1. El usuario agrega cualquier recurso que consumió (video, artículo, paper, podcast)
2. Un pipeline LLM extrae conceptos y los vincula al grafo curricular existente
3. Los recursos NO crean capítulos nuevos — crean **edges complementarios** a conceptos existentes
4. El tutor de voz tiene **5 modos**: teaching, evaluation, practice, exploration (recurso externo), freeform (tema libre), debate (adversarial)
5. La **memoria del estudiante** captura cómo piensa: analogías, preguntas abiertas, conexiones, ejemplos personales
6. Una **bitácora** unifica todo lo consumido en una timeline + grafo visual
7. Un **motor de insights** sugiere proactivamente acciones basándose en el estado del grafo

---

## Arquitectura General

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                             │
│  [+ Recurso]  [Bitácora/Journal]  [Grafo Mental]  [Insights]      │
└──────┬──────────────┬──────────────────┬──────────────┬────────────┘
       │              │                  │              │
       ▼              ▼                  ▼              ▼
┌──────────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────────────┐
│   INGESTION  │ │ JOURNAL  │ │  VOICE TUTOR  │ │  INSIGHT ENGINE  │
│   PIPELINE   │ │  ENGINE  │ │  (6 modes)    │ │  (proactive)     │
│              │ │          │ │               │ │                  │
│ Content      │ │ Unified  │ │ teaching      │ │ Cross-resource   │
│ Resolver     │ │ timeline │ │ evaluation    │ │ consolidation    │
│ Concept      │ │ + graph  │ │ practice      │ │ suggestions      │
│ Extractor    │ │ view     │ │ exploration ★ │ │ Gap detection    │
│ Curriculum   │ │          │ │ freeform ★    │ │ Mastery catalyst │
│ Linker       │ │          │ │ debate ★      │ │                  │
│              │ │          │ │               │ │                  │
│ DeepSeek V3  │ │ Supabase │ │ Gemini Live   │ │ DeepSeek V3      │
└──────┬───────┘ └────┬─────┘ └───────┬───────┘ └────────┬─────────┘
       │              │               │                   │
       ▼              ▼               ▼                   ▼
┌────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                │
│                                                                    │
│  user_resources → user_resource_concepts → concepts (existing)     │
│  consumption_log (bitácora unificada)                              │
│  learner_concept_memory (enriched: analogies, open_questions...)   │
│  voice_sessions (extended: exploration, freeform, debate)          │
│  insight_suggestions (proactive recommendations)                   │
└────────────────────────────────────────────────────────────────────┘

★ = nuevos modos de voz
```

---

## Etapa 1: Fundamentos — Data Model + Ingestion Pipeline

**Objetivo**: El usuario puede agregar un recurso externo y el sistema lo vincula al grafo curricular.

**Dificultad**: Media — Migraciones estándar + 2 prompts DeepSeek + 1 API route.

**Dependencias**: Ninguna. Puede empezar ya.

### 1.1 Migraciones

Archivo: `supabase/migrations/XXXXXX_reactive_knowledge_system.sql`

**Tabla `user_resources`** — Recurso externo del usuario:
```sql
CREATE TABLE user_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'article', 'paper', 'podcast', 'book', 'course', 'other')),
  raw_content TEXT,                  -- transcript, texto scrapeado, o notas del usuario
  user_notes TEXT,                   -- notas personales
  summary TEXT,                      -- resumen generado por LLM
  extracted_concepts JSONB,          -- snapshot de extracción (audit trail)
  coverage_score FLOAT,              -- % de conceptos que matchean con currículo
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'linked', 'failed', 'standalone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
-- RLS: auth.uid() = user_id
```

**Tabla `user_resource_concepts`** — Join: user_resource ↔ concepto curricular:
```sql
CREATE TABLE user_resource_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_resource_id UUID NOT NULL REFERENCES user_resources(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES concepts(id),
  relationship TEXT NOT NULL CHECK (relationship IN (
    'reinforces', 'extends', 'contrasts', 'applies', 'prerequisite_for'
  )),
  relevance_score FLOAT NOT NULL CHECK (relevance_score BETWEEN 0 AND 1),
  extracted_concept_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'pipeline' CHECK (source IN ('pipeline', 'voice_discovery', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS via join con user_resources
```

**Tabla `consumption_log`** — Bitácora unificada:
```sql
CREATE TABLE consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES resources(id),
  user_resource_id UUID REFERENCES user_resources(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'started', 'completed', 'evaluated', 'discussed', 'added'
  )),
  concepts_touched TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exactly_one_resource CHECK (
    (resource_id IS NOT NULL AND user_resource_id IS NULL) OR
    (resource_id IS NULL AND user_resource_id IS NOT NULL)
  )
);
-- RLS: auth.uid() = user_id
```

**Extender `voice_sessions`**:
```sql
ALTER TABLE voice_sessions ADD COLUMN user_resource_id UUID REFERENCES user_resources(id);
-- session_type check se extiende en Etapa 3
```

### 1.2 Pipeline de Ingesta

Archivos nuevos en `src/lib/ingest/`:

| Archivo | Responsabilidad |
|---------|----------------|
| `types.ts` | ExtractedConcept, ConceptLink, IngestResult |
| `content-resolver.ts` | YouTube transcript (`youtube-transcript` npm), fallback a user_notes |
| `extract-concepts.ts` | DeepSeek prompt: summary + concept extraction + Zod schema |
| `link-to-curriculum.ts` | DeepSeek prompt: linking a ~150 conceptos (todos en contexto) + Zod schema |

API Route: `POST /api/resources/ingest`
```
create user_resource(status='processing')
  → resolve content
  → extract concepts (DeepSeek paso 1)
  → link to curriculum (DeepSeek paso 2)
  → calculate coverage_score
  → save edges in user_resource_concepts
  → update status='linked' (o 'standalone' si coverage < 0.1)
  → create consumption_log entry (event='added')
```

**Decisión técnica**: Sin embeddings en V1. ~150 conceptos × ~20 palabras = ~3K tokens. LLM > cosine similarity para este tamaño. Migrar a embeddings si currículo > 500 conceptos.

**Reutilizar**: `callDeepSeek()`, `parseJsonResponse()` de `src/lib/llm/deepseek.ts`. Patrón Zod de `src/lib/llm/prompts.ts`.

### 1.3 UI Mínima

- `AddResourceModal` — URL + título + tipo + notas → "Analizar y vincular"
- Resultado: resumen + links, usuario edita antes de confirmar
- Botón `+ Recurso` en Library

### Entregable
Usuario pega URL de YouTube, escribe notas → sistema muestra "3 conceptos vinculados: Memory Models (extends), Distributed Shared Memory (applies)..."

---

## Etapa 2: Bitácora + Vista de Recurso

**Objetivo**: Timeline unificado + página de detalle del recurso externo.

**Dificultad**: Baja-Media — UI + queries.

**Dependencias**: Etapa 1.

### 2.1 Página `/resources/[id]`

- Resumen + notas del usuario
- Conexiones: concepto extraído → relación → concepto curricular + definición + mastery level
- Botón "Discutir con tutor" (habilitado tras Etapa 3)
- Editar / eliminar

### 2.2 Página `/journal`

Timeline cronológico inverso:
- Curriculares: started, completed, evaluated
- Externos: added, discussed
- Sesiones de voz

### 2.3 Auto-logging

Insertar en `consumption_log` desde flows existentes:
- `saveEvaluationResults()` → event `evaluated`
- Learn flow completion → event `completed`
- Voice session end → event `discussed`

### 2.4 Backfill retroactivo

Script que puebla `consumption_log` desde `evaluations`, `learn_progress`, `voice_sessions` existentes.

### Entregable
Timeline: "Feb 17: evaluación Ch9 (82%) → Feb 18: agregó video LaurieWired → Feb 18: conversación 20 min."

---

## Etapa 3: Voice Exploration — Conversación sobre Recursos Externos

**Objetivo**: Tutor de voz discute recursos externos como **peer académico**.

**Dificultad**: Media — Nuevo hook + prompt + API routes. Patrones establecidos.

**Dependencias**: Etapa 1.

### 3.1 System Prompt: `buildVoiceExplorationInstruction`

Archivo: `src/lib/llm/voice-exploration-prompts.ts`

```typescript
function buildVoiceExplorationInstruction(params: {
  resource: { title: string; type: string; summary: string; userNotes: string };
  links: Array<{ extractedName: string; relationship: string;
    curriculumConceptName: string; curriculumDefinition: string; explanation: string }>;
  conceptProgress: Array<{ conceptName: string; level: number }>;
  language: 'en' | 'es';
}): string
```

Rol: **Academic peer** (NO teacher, NO evaluator).
1. Preguntar qué le llamó la atención
2. Bridge: conectar con conceptos curriculares
3. Probe depth adaptado a mastery level
4. Surface contradictions sin resolverlas
5. Generar preguntas que el estudiante no pensó
6. Cierre (15 min): sintetizar 2-3 conexiones descubiertas

### 3.2 Hook: `useVoiceExplorationSession`

Patrón de `useVoiceEvalSession`:
- Estado: `'idle' | 'connecting' | 'exploring' | 'summarizing' | 'done' | 'error'`
- `systemInstructionOverride` → `buildVoiceExplorationInstruction()`
- `sessionType: 'exploration'`, `maxDurationMs: 20 min`
- Sin scoring. Sí genera summary + actualiza learner memory.

### 3.3 Post-sesión

1. Fetch transcripts → DeepSeek genera: summary + discovered_connections[] + open_questions[]
2. Nuevas conexiones → insertar en `user_resource_concepts` con `source: 'voice_discovery'`
3. Actualizar `learner_concept_memory`
4. Crear `consumption_log` entry (event `discussed`)

### 3.4 Migración

```sql
-- Extender session_type check
ALTER TABLE voice_sessions DROP CONSTRAINT IF EXISTS voice_sessions_session_type_check;
ALTER TABLE voice_sessions ADD CONSTRAINT voice_sessions_session_type_check
  CHECK (session_type IN ('teaching', 'evaluation', 'practice', 'exploration'));
```

### Entregable
Usuario agrega video → vista del recurso → "Discutir con tutor" → 15 min de conversación → summary + nuevas conexiones descubiertas.

---

## Etapa 4: Enriched Learner Memory

**Objetivo**: La memoria captura **cómo piensa** el estudiante, no solo qué sabe/no sabe.

**Dificultad**: Media — Migración + cambios en scoring prompts + formatMemoryForPrompt.

**Dependencias**: Ninguna. Paralelizable con Etapas 2-3.

### 4.1 Migración

```sql
ALTER TABLE learner_concept_memory
  ADD COLUMN analogies JSONB DEFAULT '[]',
  ADD COLUMN open_questions JSONB DEFAULT '[]',
  ADD COLUMN personal_examples JSONB DEFAULT '[]',
  ADD COLUMN connections_made JSONB DEFAULT '[]';
```

Todos: arrays de strings planos, misma lógica de acumulación + dedup.

### 4.2 Actualizar scoring prompts

En voice-score, voice-practice-score, voice-teach-score, exploration-summary:
```json
{
  "perConcept": [{
    "misconceptions": ["..."],
    "strengths": ["..."],
    "analogies": ["analogía que usó y funcionó"],
    "openQuestions": ["pregunta que hizo y no se respondió"],
    "personalExamples": ["ejemplo de su experiencia"],
    "connectionsMade": ["conectó X con Y"]
  }]
}
```

### 4.3 Actualizar `updateLearnerConceptMemory` y `formatMemoryForPrompt`

En `src/lib/learner-memory.ts`:
- Nuevos campos en `UpdateMemoryParams`
- Acumulación + dedup para nuevos arrays
- `formatMemoryForPrompt` produce:
```
Analogies they use: "Raft es como una elección de presidente en un pueblo..."
Open questions: "¿Qué pasa si líder y follower tienen relojes desincronizados?"
Connections they've made: "Relacionó Raft con multi-agent coordination"
```

### 4.4 Propagación automática

Todos los prompts de voz ya inyectan `formatMemoryForPrompt`. Los cambios se propagan sin modificar los prompt builders existentes.

### Entregable
3 sesiones después, el tutor pregunta: "¿Tu analogía del pueblo funciona si algunos ciudadanos mienten?" (Byzantine faults).

---

## Etapa 5: Freeform Conversation + Debate Mode

**Objetivo**: Conversación libre sobre cualquier tema + modo adversarial.

**Dificultad**: Media-Alta — Nuevos session types + prompts complejos.

**Dependencias**: Etapas 3 + 4.

### 5.1 Modo Freeform

Session type: `freeform`. Sin recurso, sin sección. Solo el estudiante y su modelo mental.

```typescript
function buildVoiceFreeformInstruction(params: {
  conceptProgress: Array<{ conceptId: string; conceptName: string; level: number; phase: number }>;
  recentActivity: Array<{ title: string; type: string; date: string; concepts: string[] }>;
  learnerMemory: LearnerConceptMemory[]; // enriched
  openQuestions: string[]; // aggregated
  language: 'en' | 'es';
}): string
```

Rol: **Intellectual companion**. Sigue el hilo del estudiante, enriquece con contexto de mastery + memoria, surfacea preguntas abiertas. Duración: 30 min.

### 5.2 Modo Debate

Session type: `debate`. Tutor defiende posición técnica provocativa.

```typescript
function buildVoiceDebateInstruction(params: {
  topic: string;
  position: string; // "Paxos es estrictamente superior a Raft para producción"
  conceptIds: string[];
  conceptDefinitions: Record<string, string>;
  learnerMemory: LearnerConceptMemory[];
  language: 'en' | 'es';
}): string
```

Rol: **Devil's advocate con integridad intelectual**. Cede ante evidencia sólida, presiona ante debilidad. Duración: 15 min.

**Generación de temas**: DeepSeek genera temas basándose en conceptos con mastery >= 2. Afirmaciones provocativas pero defendibles.

### 5.3 Migración

```sql
ALTER TABLE voice_sessions DROP CONSTRAINT IF EXISTS voice_sessions_session_type_check;
ALTER TABLE voice_sessions ADD CONSTRAINT voice_sessions_session_type_check
  CHECK (session_type IN ('teaching', 'evaluation', 'practice', 'exploration', 'freeform', 'debate'));
```

### Entregable
Freeform: "Los problemas de consenso en Raft se parecen a coordinación de agentes LLM" → tutor cruza Phase 1 con Phase 4. Debate: "Paxos vs Raft" → discusión adversarial que valida mastery level 3.

---

## Etapa 6: Insight Engine — Sistema Proactivo

**Objetivo**: El sistema sugiere acciones basándose en el estado del grafo.

**Dificultad**: Alta — Análisis cross-resource + UI notificaciones.

**Dependencias**: Etapas 1-4.

### 6.1 Recurso como Catalizador de Mastery

Post-linking: si concepto vinculado tiene mastery 1-2 y relationship es `extends`/`contrasts`:
→ "¿Quieres una evaluación de tradeoffs usando este video como contexto?"

### 6.2 Consolidación Cruzada Periódica

Cada 5 entries o semanalmente: DeepSeek analiza consumption_log reciente → detecta cluster temático → sugiere sesión de síntesis.

Nueva tabla: `insight_suggestions` (user_id, type, content, related_concepts[], status: pending/accepted/dismissed).

### 6.3 Gap Detection

Análisis periódico:
- Mastery estancada > 2 semanas
- Misconceptions no resueltas en 3+ sesiones
- Open questions acumuladas

→ Sugerencias específicas: "3 preguntas abiertas sobre consensus. ¿Sesión freeform?"

### 6.4 Vista de Grafo Mental

Visualización interactiva (d3-force o react-flow):
- Nodos = conceptos (tamaño por mastery)
- Edges = prerequisitos + conexiones descubiertas
- Satélites = recursos externos
- Colores = por fase
- Clusters = fortalezas
- Zonas oscuras = gaps

### Entregable
"Tienes 2 misconceptions sobre consensus que llevan 3 sesiones. ¿Debatir 'Paxos vs Raft' para atacarlas?"

---

## Resumen de Etapas

| Etapa | Nombre | Dificultad | Sesiones | Dependencias |
|-------|--------|-----------|----------|-------------|
| 1 | Fundamentos (data + pipeline + UI mínima) | Media | 2-3 | Ninguna |
| 2 | Bitácora + Vista de Recurso | Baja-Media | 1-2 | Etapa 1 |
| 3 | Voice Exploration | Media | 2 | Etapa 1 |
| 4 | Enriched Learner Memory | Media | 1-2 | Ninguna (parallelizable) |
| 5 | Freeform + Debate | Media-Alta | 2-3 | Etapas 3 + 4 |
| 6 | Insight Engine (proactivo) | Alta | 3-4 | Etapas 1-4 |

**Total estimado**: 11-16 sesiones.

**Ruta crítica**: 1 → 3 → 5. Lo demás es paralelizable.

**Orden recomendado**: 1 → 4 (paralelo) → 2 → 3 → 5 → 6.

```
Semana 1-2: Etapa 1 (fundamentos) + Etapa 4 (enriched memory) en paralelo
Semana 3:   Etapa 2 (bitácora) + Etapa 3 (voice exploration)
Semana 4:   Etapa 5 (freeform + debate)
Semana 5-6: Etapa 6 (insight engine + grafo visual)
```

---

## Decisiones Técnicas Clave

| Decisión | Razón |
|----------|-------|
| Sin embeddings V1 | ~150 conceptos caben en un prompt (~3K tokens). LLM > cosine similarity |
| coverage_score como gate | Evita contaminar grafo. < 0.1 = standalone, >= 0.1 = linked |
| exploration como session type separado | Rol fundamentalmente diferente (peer vs teacher vs evaluator) |
| Enriched memory como strings[] | Mismo patrón que misconceptions/strengths. Acumulación + dedup |
| source en user_resource_concepts | Distingue pipeline automático vs descubierto en conversación vs manual |
| consumption_log con XOR constraint | Un entry es curricular O externo, nunca ambos |

---

## Riesgos y Mitigaciones

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| DeepSeek extrae conceptos irrelevantes | Media | Zod schema + usuario edita pre-confirmación |
| YouTube transcripts no disponibles | Baja | Fallback a notas del usuario |
| Coverage score rechaza recursos válidos | Baja | Threshold bajo (0.1) + forzar manual |
| Conversación exploración divaga | Media | Prompt guardrails + max duration + síntesis forzada |
| Costo acumulado ingesta | Baja | ~$0.005/recurso. 100 recursos = $0.50 |
| Linking degrada con currículo grande | Futura | Migrar a embeddings > 500 conceptos |
| Context window de freeform (todo el grafo) | Media | Resumir conceptos a id+name+level, ~2K tokens para 150 conceptos |

---

## Archivos Clave

### Nuevos
```
supabase/migrations/XXXXXX_reactive_knowledge_system.sql
supabase/migrations/XXXXXX_enriched_learner_memory.sql
src/lib/ingest/types.ts
src/lib/ingest/content-resolver.ts
src/lib/ingest/extract-concepts.ts
src/lib/ingest/link-to-curriculum.ts
src/app/api/resources/ingest/route.ts
src/app/api/resources/[id]/route.ts
src/app/api/resources/exploration-summary/route.ts
src/lib/llm/voice-exploration-prompts.ts
src/lib/llm/voice-freeform-prompts.ts
src/lib/llm/voice-debate-prompts.ts
src/components/voice/use-voice-exploration-session.ts
src/components/voice/use-voice-freeform-session.ts
src/components/voice/use-voice-debate-session.ts
src/components/resources/AddResourceModal.tsx
src/app/resources/[id]/page.tsx
src/app/journal/page.tsx
```

### Modificados
```
src/lib/learner-memory.ts                    — nuevos campos enriched
src/lib/llm/voice-prompts.ts                 — formatMemoryForPrompt enriched
src/lib/evaluate/save-results.ts             — auto-log to consumption_log
src/components/voice/use-voice-session.ts     — accept new session types
src/app/api/voice/session/start/route.ts      — accept new session types + user_resource_id
src/app/api/voice/session/end/route.ts        — handle exploration/freeform summary
src/app/api/voice/session/context/route.ts    — return user_resource data
src/app/library/page.tsx                      — botón + Recurso + sección externos
src/types/index.ts                            — new types
```

### Reutilizar (no modificar)
```
src/lib/llm/deepseek.ts          — callDeepSeek(), parseJsonResponse()
src/lib/voice/gemini-live.ts      — GeminiLiveClient
src/lib/voice/memory.ts           — generateConversationSummary() pattern
src/lib/mastery.ts                — mastery level logic
```

---

## Verificación por Etapa

1. `npx tsc --noEmit` + `npm run build` — sin errores
2. Test manual del flujo:
   - E1: agregar recurso → ver links generados
   - E2: journal timeline + vista de recurso
   - E3: sesión voz exploration → summary + discovered connections
   - E4: tutores usan enriched memory
   - E5: freeform sin recurso + debate adversarial
   - E6: sugerencias proactivas tras agregar recurso
3. RLS: usuario A no ve recursos de usuario B
4. Error handling: DeepSeek falla → status='failed', retry posible
