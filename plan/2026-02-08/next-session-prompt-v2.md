# Prompt para Session 10 (v2)

## Contexto rápido

Lee estos archivos en orden:
1. `plan/2026-02-08/learning-path-design.md` — **EL PATH DEFINITIVO** (investigación + secuencia + ejemplo DDIA Ch1)
2. `plan/2026-02-08/session-09-pdf-pipeline-design.md` — Pipeline PDF + micro-tests + data model
3. `BACKLOG.md` — Estado del proyecto

## Decisiones YA tomadas

1. **El PDF NO se muestra como PDF.** El texto se extrae, traduce, y se renderiza como contenido nativo (Markdown → React). Similar a Quantum Country.
2. **Pipeline:** PDF → Marker (Python) → Markdown → segmentar por concepto (DeepSeek V3) → traducir → `resource_sections` table → `react-markdown`
3. **Los 7 capítulos hand-written se MANTIENEN** como advance organizers (Step 1: ACTIVATE)
4. **Pre-questions desde día 1** (Kapur d=0.36-0.58, Richland 2009)
5. **Translation:** DeepSeek V3 primero ($0.50), upgrade a DeepL si falla
6. **Scope:** DDIA Chapter 1 como proof of concept, pipeline genérico
7. **Python para extracción** (Marker), TypeScript para seed
8. **El usuario NO elige el path.** Un solo camino basado en evidencia.

## LA SECUENCIA (ya diseñada, ver learning-path-design.md)

```
ACTIVATE:  Resumen visual (advance organizer, Mayer d=0.85)
    ↓
LEARN ×N:  Pre-pregunta → Contenido del libro → Post-test
    ↓      (productive failure → reading → retrieval practice)
APPLY:     Playground + Preguntas guía
    ↓      (interactive + constructive)
EVALUATE:  Assessment completo con DeepSeek
    ↓
REVIEW:    SM-2 spaced repetition (ongoing)
```

## La tarea de ESTA sesión: IMPLEMENTAR

Ahora hay que construir. Fases:

### Fase A: Database (migration 008)
- Crear `resource_sections` table (schema en session-09-pdf-pipeline-design.md)
- RLS: public read

### Fase B: PDF Pipeline (proof of concept con DDIA Ch1)
- `scripts/pdf-extract.py` — Marker PDF → Markdown
- `scripts/concept-segment.py` — segmentar Ch1 en 3 conceptos (reliability, scalability, maintainability)
- `scripts/translate-sections.py` — traducir secciones a español
- `scripts/seed-sections.ts` — insertar en `resource_sections`

### Fase C: Instalar dependencias
- `react-markdown`, `remark-gfm`, `rehype-highlight`

### Fase D: UI — Reestructurar Learn Page
- Nuevo flow en `/learn/[resourceId]`:
  - Step 1 (ACTIVATE): Mostrar el DDIAChapter{N} component existente como advance organizer
  - Step 2 (LEARN): Para cada `resource_section` del recurso:
    - `PreQuestion` component (1 pregunta difícil del question_bank)
    - `SectionContent` component (renderiza content_markdown con react-markdown)
    - `PostTest` component (1-2 preguntas, usa /api/review/random + /api/review/submit)
  - Step 3 (APPLY): Playground + preguntas guía
  - Step 4 (EVALUATE): Link a evaluación completa
- `SectionNavigator` component (progreso visual)
- Fallback: si un recurso NO tiene resource_sections, mostrar solo el chapter component original

### Fase E: Mastery integration
- Micro-tests (post-tests) alimentan SM-2 automáticamente
- Si 3+ preguntas correctas (≥60%) → mastery level 0→1

## Arquitectura actual relevante

- Learn page: `src/app/learn/[resourceId]/page.tsx` — Server Component, mapea resourceId → component
- 7 chapter components: `src/app/learn/[resourceId]/ddia-ch{1,2,3,5,6,8,9}.tsx` — puro JSX + Tailwind
- QuickQuiz: `src/components/quick-quiz.tsx` — Client Component, 5-phase state machine (reutilizable para PostTest)
- Review APIs: `/api/review/random` y `/api/review/submit` (ya funcionan)
- Question bank: 231 preguntas en Supabase
- `resource_sections` table: **NO EXISTE AÚN**
- No hay `react-markdown` instalado aún
- Playgrounds: 4 interactivos (Latency, Replication, Partition, Consensus)

## IMPORTANTE: Gestión de contexto
- Escribir a disco frecuentemente para no perder progreso
- Si el contexto se acerca al límite, parar y crear prompt para siguiente sesión
