# Pipeline: Soporte para PDF como fuente de cursos

**Status:** PLANNED — no implementado
**Created:** 2026-02-24

## Context

El pipeline actual solo acepta URLs de YouTube. El objetivo es poder subir PDFs (papers, libros) y convertirlos en cursos con el mismo flujo: secciones enriquecidas, quizzes, conceptos vinculados. Primera iteración — solo PDF, otros formatos después.

**Hallazgo clave:** Solo 3 de los 6 stages son YouTube-específicos en algún grado:
- Stage 1 (`resolve-youtube.ts`) — 100% YouTube
- Stage 4 (`map-video-segments.ts`) — mapea timestamps a video
- Stage 6 (`write-to-db.ts`) — usa `yt-{videoId}` como ID

Stages 2 (segment), 3 (content), 5 (concepts) y quizzes son **completamente agnósticos**.

## Diseño

### Discriminated union para `ResolveOutput`

Generalizar con un union type en vez de campos opcionales:

```typescript
type SourceType = 'youtube' | 'pdf';

// Base compartida
interface ResolveBase {
  sourceType: SourceType;
  title: string;
  language: string;
  fullTranscript: string;
  structureHints: { title: string; position: number }[];
}

// YouTube: snippets + chapters + videoId
interface YouTubeResolveOutput extends ResolveBase { ... }

// PDF: fileHash + pageCount + pageBreaks
interface PdfResolveOutput extends ResolveBase { ... }

type ResolveOutput = YouTubeResolveOutput | PdfResolveOutput;
```

`structureHints` reemplaza `chapters` como concepto genérico — para YouTube son chapters, para PDF son headings/TOC del documento.

### Resource ID

- YouTube: `yt-{videoId}` (sin cambios)
- PDF: `pdf-{first8CharsOfSHA256}` — idempotente, el mismo PDF siempre produce el mismo ID

### Timestamps en SegmentSection

Mantener `startSeconds`/`endSeconds` por backward compatibility (jobs existentes en DB). Para PDFs: `startSeconds: 0, endSeconds: 0`. Agregar `pageRange?: [number, number]` opcional.

### Extracción de texto

`pdfjs-dist` ya está en package.json. Soporta:
- `getTextContent()` por página
- Outline/bookmarks como structure hints
- Server-side con Node.js

**No hace OCR** — PDFs escaneados como imagen fallan con error claro.

---

## Implementación (12 pasos)

### Fase 1: Infraestructura

**1. Migración: Supabase Storage bucket**
- Crear: `supabase/migrations/XXXXXX_pdf_storage.sql`
- Bucket `pdf-uploads`, RLS: usuarios autenticados pueden subir a `{user_id}/`
- Límite: 50MB

**2. Migración: pipeline_jobs + resource_type**
- Crear: `supabase/migrations/XXXXXX_pipeline_pdf_support.sql`
- `ALTER TABLE pipeline_jobs ADD COLUMN source_type TEXT DEFAULT 'youtube'`
- `ALTER TABLE pipeline_jobs ADD COLUMN storage_path TEXT`
- `ALTER TABLE pipeline_jobs ADD COLUMN file_hash TEXT`
- Backfill: `UPDATE pipeline_jobs SET source_type = 'youtube' WHERE source_type IS NULL`

**3. Constantes**
- Modificar: `src/lib/constants.ts`
- Agregar: `PDF_MAX_SIZE_BYTES`, `PDF_MAX_PAGES`, `PDF_MIN_TEXT_LENGTH`
- Agregar: `PIPELINE_TOTAL_STAGES_PDF = 5` (sin video_map)

### Fase 2: Tipos y resolve

**4. Tipos generalizados**
- Modificar: `src/lib/pipeline/types.ts`
- `SourceType` discriminated union para `ResolveOutput`
- `PipelineConfig`: agregar `sourceType`, `storagePath?`, `fileHash?`
- `SegmentSection`: agregar `pageRange?: [number, number]`
- `PipelineData.videoMap` → opcional

**5. Extraer `detectLanguage` a utility**
- Crear: `src/lib/pipeline/utils/detect-language.ts`
- Mover de `resolve-youtube.ts`, importar en ambos resolvers

**6. Resolve PDF (nuevo stage)**
- Crear: `src/lib/pipeline/stages/resolve-pdf.ts`
- Descarga PDF de Supabase Storage
- Extrae texto página por página con `pdfjs-dist`
- Extrae outline/bookmarks como `structureHints[]`
- Detecta idioma
- Valida texto mínimo (falla si PDF es imagen escaneada)
- Retorna `PdfResolveOutput`

### Fase 3: Adaptar stages

**7. Segment content**
- Modificar: `src/lib/pipeline/stages/segment-content.ts`
- Si `sourceType === 'pdf'`: prompt pide `startPage`/`endPage` en vez de `startSeconds`/`endSeconds`
- Usa `structureHints` (TOC) como guía en vez de `chapters`
- Post-proceso: asigna `transcriptText` por rango de páginas, `pageRange` en output

**8. Generate sections — cambios mínimos**
- Modificar: `src/lib/pipeline/stages/generate-sections.ts`
- Parametrizar prompt: "Video" → "Resource" cuando no es YouTube
- `generateActivateData`: mismo cambio cosmético

**9. Write to DB**
- Modificar: `src/lib/pipeline/stages/write-to-db.ts`
- Resource ID: dispatch por `sourceType` (`yt-{videoId}` vs `pdf-{hash8}`)
- Resource type: `'lecture'` para YouTube, `'paper'` para PDF
- URL: YouTube URL o `null` para PDF
- Video segments: solo insertar si `videoMap` presente

### Fase 4: Orchestrator

**10. Orchestrator**
- Modificar: `src/lib/pipeline/orchestrator.ts`
- Stage 1: dispatch a `resolveYouTube()` o `resolvePdf()` según `sourceType`
- Stages 4-5: skip `video_map` para PDF, solo ejecutar `concepts`
- `total_stages` dinámico: 6 para YouTube, 5 para PDF
- `startPipeline`: guardar `source_type`, `storage_path`, `file_hash` en job

### Fase 5: API y UI

**11. API endpoints**
- Crear: `src/app/api/pipeline/upload/route.ts`
  - POST multipart/form-data
  - Valida MIME type, tamaño, extensión
  - Sube a Supabase Storage `{userId}/{hash}.pdf`
  - Retorna `{ storagePath, fileHash, pageCount, title }`
- Modificar: `src/app/api/pipeline/route.ts`
  - Aceptar `{ storagePath, fileHash, title? }` además de `{ url }`
  - Dedup check: `pdf-{hash8}` ya existe como resource?

**12. UI: CreateCourseModal**
- Modificar: `src/components/create-course-modal.tsx`
- Tabs: "YouTube" | "PDF"
- Tab PDF: file input (accept=".pdf"), upload progress
- Flujo: upload → pipeline start → progress polling
- Stage labels diferenciados para PDF

---

## Archivos clave

| Archivo | Acción |
|---------|--------|
| `src/lib/pipeline/types.ts` | Discriminated union, SourceType, PipelineConfig |
| `src/lib/pipeline/stages/resolve-pdf.ts` | **Nuevo** — extracción de texto PDF |
| `src/lib/pipeline/utils/detect-language.ts` | **Nuevo** — extraído de resolve-youtube |
| `src/lib/pipeline/stages/segment-content.ts` | Adaptar prompt para PDF (páginas vs timestamps) |
| `src/lib/pipeline/stages/generate-sections.ts` | Parametrizar "Video" → "Resource" |
| `src/lib/pipeline/stages/write-to-db.ts` | Resource ID y tipo generalizados |
| `src/lib/pipeline/orchestrator.ts` | Dispatch resolve, skip video_map |
| `src/lib/constants.ts` | Constantes PDF |
| `src/app/api/pipeline/upload/route.ts` | **Nuevo** — endpoint de upload |
| `src/app/api/pipeline/route.ts` | Aceptar PDF source |
| `src/components/create-course-modal.tsx` | Tabs YouTube/PDF |
| `supabase/migrations/` | Storage bucket, pipeline_jobs columns |

## Verificación

1. Subir un PDF (ej. un paper de arXiv) vía el modal
2. Verificar que el pipeline progresa por los 5 stages
3. Verificar que el recurso aparece en el dashboard con tipo correcto
4. Abrir el recurso: activate data, secciones con markdown, quizzes — todo funcional
5. Re-subir el mismo PDF → debe detectar duplicado y skip
6. Verificar que el pipeline de YouTube sigue funcionando sin cambios
