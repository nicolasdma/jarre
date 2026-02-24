# Plan: Pipeline "YouTube URL → Curso Automático"

## Context

Jarre tiene un motor pedagógico profundo (FSRS, mastery 0-4, voice tutoring, learner memory, 5 tipos de evaluación) pero el contenido se genera manualmente via CLI con Claude. Para hacer el producto público y competir con YouLearn ($70K MRR, 150K MAU), necesitamos automatizar: **usuario pega URL de YouTube → sistema genera curso completo**.

YouLearn genera "study aids" superficiales (resúmenes + flashcards MCQ). Jarre genera **experiencias de aprendizaje profundo** con contenido enriquecido, quizzes posicionados, video segmentado, y evaluación de comprensión real. Ese es el diferenciador.

### Decisiones del usuario:
- **Idioma**: Depende del video (si EN → genera EN y traduce; si ES → directo)
- **Visibilidad**: Solo creador (MVP), arquitectura preparada para público
- **Profundidad**: Intermedia (headings claros, explicaciones expandidas, ~2 min procesamiento)
- **Fases**: Sin fases. Cursos auto-generados son independientes, sección "Mis Cursos" aparte

---

## Arquitectura del Pipeline

```
YouTube URL
    ↓
[1. Resolve] → transcript con timestamps + chapters + metadata
    ↓
[2. Segment] → 4-6 secciones temáticas (LLM)
    ↓
[3. Generate Content] → markdown enriquecido con **headings** por sección (LLM × N)
    ↓
[4. Generate Quizzes] → inline quizzes posicionados por heading (LLM × N)
    ↓
[5. Map Video] → video segments mapeados a headings (determinista)
    ↓
[6. Link Concepts] → conceptos extraídos + enlazados (LLM, reutiliza existente)
    ↓
[7. Write DB] → resource + sections + quizzes + video_segments + concepts
```

Estado persistido en `pipeline_jobs` después de cada etapa → recuperable si falla.

---

## Fase 1: Infraestructura Base

### 1.1 Migración DB

**Archivo nuevo**: `supabase/migrations/YYYYMMDD_pipeline_jobs.sql`

```sql
-- Tabla para tracking de jobs del pipeline
CREATE TABLE pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  language TEXT DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | processing | completed | failed
  current_stage TEXT,
  stages_completed INTEGER DEFAULT 0,
  total_stages INTEGER DEFAULT 7,
  resource_id TEXT,  -- FK cuando se complete
  error TEXT,
  failed_stage TEXT,
  stage_outputs JSONB DEFAULT '{}',  -- Outputs intermedios para resume
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own jobs" ON pipeline_jobs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_pipeline_jobs_user ON pipeline_jobs(user_id, created_at DESC);

-- Columna para advance organizer en resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS activate_data JSONB;
-- Columna para marcar quién creó el recurso (preparación para público)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

### 1.2 Tipos del Pipeline

**Archivo nuevo**: `src/lib/pipeline/types.ts`

```typescript
// Stage outputs
interface ResolveOutput {
  videoId: string;
  title: string;
  durationSeconds: number;
  language: 'en' | 'es' | string;
  snippets: Array<{ text: string; start: number; duration: number }>;
  chapters: Array<{ title: string; startSeconds: number }>;
  fullTranscript: string;
}

interface SegmentOutput {
  sections: Array<{
    title: string;
    conceptName: string;
    conceptSlug: string;
    startSeconds: number;
    endSeconds: number;
    transcriptText: string;
  }>;
}

interface ContentOutput {
  sections: Array<{
    title: string;
    conceptName: string;
    conceptSlug: string;
    contentMarkdown: string;  // Con **bold headings**
    headings: string[];       // Extraídos para validación
    startSeconds: number;
    endSeconds: number;
  }>;
  activateData: ActivateData;
}

interface QuizOutput {
  quizzesBySection: Array<{
    sectionTitle: string;
    quizzes: Array<InlineQuizDef>;
  }>;
}

interface VideoMapOutput {
  segmentsBySection: Array<{
    sectionTitle: string;
    segments: Array<VideoSegmentDef>;
  }>;
}

interface ConceptOutput {
  concepts: Array<{ id: string; name: string; slug: string; isNew: boolean }>;
  resourceConcepts: Array<{ conceptId: string; isPrerequisite: boolean }>;
}

interface WriteOutput {
  resourceId: string;
  sectionsCreated: number;
  quizzesCreated: number;
  videoSegmentsCreated: number;
  conceptsLinked: number;
}
```

### 1.3 Schemas Zod

**Archivo nuevo**: `src/lib/pipeline/schemas.ts`

Zod schemas para validar cada output LLM (segment, content, quizzes).

### 1.4 Actualizar constantes

**Modificar**: `src/lib/db/tables.ts` — agregar `pipelineJobs: 'pipeline_jobs'`
**Modificar**: `src/lib/constants.ts` — agregar token budgets para pipeline stages

---

## Fase 2: YouTube Resolver Extendido

**Archivo nuevo**: `src/lib/pipeline/stages/resolve-youtube.ts`

Extiende la lógica de `content-resolver.ts` para obtener:
1. **Transcript con timestamps** — yt-dlp `--write-auto-sub` + parsear VTT preservando timestamps
2. **Chapters** — yt-dlp `--dump-json` → `chapters` array del JSON
3. **Metadata** — título, duración, idioma detectado del video
4. **Detección de idioma** — Si transcript es EN o ES (heurística simple o LLM rápido)

Reutiliza: `extractYouTubeVideoId()` de `content-resolver.ts`, patrón de `execFile` con yt-dlp.

---

## Fase 3: Segmentación + Generación de Contenido (LLM)

### 3.1 Segmentador

**Archivo nuevo**: `src/lib/pipeline/stages/segment-content.ts`

- Input: transcript completo + chapters de YouTube
- LLM (DeepSeek): "Segmenta en 4-6 secciones temáticas, dame título + concepto + timestamps"
- Si hay chapters de YouTube, usarlos como guía (no ignorarlos)
- Output validado con Zod

### 3.2 Generador de Contenido

**Archivo nuevo**: `src/lib/pipeline/stages/generate-sections.ts`

- Input: texto del transcript por sección
- LLM (DeepSeek) × N secciones (paralelo con Promise.allSettled, max 3 concurrent)
- Prompt: genera markdown con **bold headings**, explicaciones claras, analogías cuando aplique
- Si idioma del video ≠ idioma del usuario → paso adicional de traducción
- Post-procesamiento: validar que hay bold headings, extraer lista de headings
- Output: markdown enriquecido + activateData (resumen para componente ACTIVATE)

### 3.3 Traducción (condicional)

**Archivo nuevo**: `src/lib/pipeline/stages/translate-content.ts`

- Solo si video EN → contenido ES
- Reutiliza patrón de `translate-chapter.py`: párrafo por párrafo, contexto deslizante, glosario
- Implementado en TypeScript usando `callDeepSeek()`

---

## Fase 4: Quizzes y Video Mapping

### 4.1 Generador de Quizzes

**Archivo nuevo**: `src/lib/pipeline/stages/generate-quizzes.ts`

- Input: markdown de sección + lista de bold headings
- LLM × N secciones: genera 3-5 quizzes por sección, posicionados en headings
- Formatos: ~35% mc, ~30% tf, ~35% mc2
- Validación Zod: `positionAfterHeading` debe estar en la lista de headings de esa sección
- Output: quizzes listos para insertar

### 4.2 Video Mapper (determinista, sin LLM)

**Archivo nuevo**: `src/lib/pipeline/stages/map-video-segments.ts`

- Input: secciones con headings + snippets con timestamps + chapters YouTube
- Algoritmo:
  1. Para cada sección, tomar rango de timestamps (startSeconds → endSeconds)
  2. Para cada heading en la sección, estimar qué porción del video cubre
  3. Usar chapters de YouTube como boundaries cuando coincidan
  4. Generar video_segments con positionAfterHeading
- No todos los headings tendrán video (headings "editoriales" se skipean)
- Heurística: si heading corresponde a texto expandido sin equivalente directo en transcript → skip

---

## Fase 5: Concepts + DB Writer

### 5.1 Concept Linker

**Archivo nuevo**: `src/lib/pipeline/stages/link-concepts.ts`

- Wrapper sobre `extractConcepts()` y `linkToCurriculum()` existentes
- Para cursos auto-generados: crear concepts nuevos si no matchean con curriculum
- Concepts nuevos van a la tabla `concepts` con phase NULL (sin fase)

### 5.2 DB Writer

**Archivo nuevo**: `src/lib/pipeline/stages/write-to-db.ts`

- Crea recurso en `resources` con `type: 'lecture'`, `created_by: userId`, `activate_data`
- Crea concepts nuevos si hay
- Crea `resource_concepts` links
- Crea `resource_sections` con contenido markdown
- Crea `inline_quizzes` posicionados
- Crea `video_segments` posicionados
- Sigue patrón de seed scripts: validate → clean dependents → insert
- Usa `createAdminClient()` para bypass RLS (tabla `resources` es pública)

---

## Fase 6: Orquestador + API

### 6.1 Orquestador

**Archivo nuevo**: `src/lib/pipeline/orchestrator.ts`

```typescript
export async function startPipeline(config: PipelineConfig): Promise<string>
// Crea job, lanza ejecución fire-and-forget, retorna jobId

export async function getPipelineStatus(jobId: string, userId: string): Promise<PipelineStatus>
// Lee estado de pipeline_jobs

// Interno:
async function executePipeline(jobId: string, config: PipelineConfig): Promise<void>
// Ejecuta stages en secuencia, persiste estado por stage
// Si stage ya completado (resume), lo salta
```

### 6.2 API Routes

**Archivo nuevo**: `src/app/api/pipeline/route.ts`

```
POST /api/pipeline
  Body: { url: string, title?: string }
  Response: { jobId, status: 'queued' }
```

**Archivo nuevo**: `src/app/api/pipeline/[jobId]/route.ts`

```
GET /api/pipeline/:jobId
  Response: { jobId, status, currentStage, stagesCompleted, totalStages, resourceId?, error? }
```

---

## Fase 7: Frontend

### 7.1 Componente GenericActivate

**Archivo nuevo**: `src/components/generic-activate.tsx`

Componente ACTIVATE basado en datos de `resources.activate_data` (JSONB).
Renderiza: hero + secciones numeradas + conceptos clave + insight.
Reutiliza estilos de los componentes TSX existentes (ej. `kz2h-micrograd.tsx`).

### 7.2 Modificar Learn Page

**Modificar**: `src/app/learn/[resourceId]/page.tsx`

Línea 232: `activateComponent={renderContent?.()}` → si no hay TSX custom pero hay `resource.activate_data`, usar `<GenericActivate data={resource.activate_data} />`.

Línea 86-87: Remover `AVAILABLE_RESOURCES` gate — ya no es necesario porque el flujo soporta cualquier recurso con sections.

### 7.3 UI para crear curso

**Modificar**: Agregar botón/modal en Library para "Crear curso desde YouTube URL"
- Input: URL + título opcional
- POST a /api/pipeline
- Polling cada 3s al GET endpoint
- Mostrar progreso (stage actual, barra)
- Al completar: redirect a /learn/[resourceId]

### 7.4 Sección "Mis Cursos" en Library

**Modificar**: `src/app/library/page.tsx` y `library-content.tsx`

Agregar sección que muestra recursos con `created_by = user.id`, separada de las fases del curriculum.

---

## Archivos a Crear (resumen)

| Archivo | Propósito |
|---|---|
| `supabase/migrations/YYYYMMDD_pipeline.sql` | Tabla pipeline_jobs + columnas en resources |
| `src/lib/pipeline/types.ts` | Tipos TypeScript del pipeline |
| `src/lib/pipeline/schemas.ts` | Schemas Zod para validar outputs LLM |
| `src/lib/pipeline/orchestrator.ts` | Orquestador principal |
| `src/lib/pipeline/stages/resolve-youtube.ts` | Etapa 1: extrae transcript + chapters + metadata |
| `src/lib/pipeline/stages/segment-content.ts` | Etapa 2: segmenta en secciones (LLM) |
| `src/lib/pipeline/stages/generate-sections.ts` | Etapa 3: genera contenido markdown (LLM) |
| `src/lib/pipeline/stages/translate-content.ts` | Etapa 3b: traduce si idioma ≠ target |
| `src/lib/pipeline/stages/generate-quizzes.ts` | Etapa 4: genera inline quizzes (LLM) |
| `src/lib/pipeline/stages/map-video-segments.ts` | Etapa 5: mapea timestamps → headings |
| `src/lib/pipeline/stages/link-concepts.ts` | Etapa 6: extrae/enlaza conceptos |
| `src/lib/pipeline/stages/write-to-db.ts` | Etapa 7: escribe todo a Supabase |
| `src/app/api/pipeline/route.ts` | POST — inicia pipeline |
| `src/app/api/pipeline/[jobId]/route.ts` | GET — consulta estado |
| `src/components/generic-activate.tsx` | Componente ACTIVATE genérico |

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/lib/db/tables.ts` | Agregar `pipelineJobs` |
| `src/lib/constants.ts` | Agregar token budgets del pipeline |
| `src/app/learn/[resourceId]/page.tsx` | Soportar GenericActivate, remover AVAILABLE_RESOURCES gate |
| `src/app/library/page.tsx` | Fetch cursos del usuario (created_by) |
| `src/app/library/library-content.tsx` | Sección "Mis Cursos" + botón crear |

---

## Orden de Implementación

1. **Migración DB + tipos + schemas** (base)
2. **Resolver YouTube extendido** (transcript con timestamps)
3. **Segmentador LLM** (dividir en secciones)
4. **Generador de contenido** (markdown enriquecido) + traducción condicional
5. **Generador de quizzes** (inline quizzes posicionados)
6. **Video mapper** (determinista)
7. **Concept linker + DB writer**
8. **Orquestador + API routes**
9. **GenericActivate + modificar learn page**
10. **UI en Library** (botón crear + sección "Mis Cursos")
11. **Test e2e** con 2-3 videos reales

---

## Verificación

1. Pegar URL de YouTube de un video de ~30 min
2. Pipeline completa sin errores en ~2-3 minutos
3. Ir a /learn/[resourceId]:
   - ACTIVATE muestra GenericActivate con resumen + secciones
   - LEARN muestra secciones con markdown, quizzes inline, video segments
   - EVALUATE funciona (genera preguntas con DeepSeek)
4. Los quizzes se posicionan correctamente bajo los headings
5. Los video segments embeben los clips correctos del YouTube original
6. El recurso aparece en "Mis Cursos" en la Library
7. TypeScript compila sin errores (`npx tsc --noEmit`)
