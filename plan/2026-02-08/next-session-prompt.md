# Prompt para Session 10

## Contexto

Lee estos archivos para contexto completo:
- `plan/2026-02-08/session-09-pdf-pipeline-design.md` — Diseño completo del pipeline PDF + micro-tests
- `BACKLOG.md` — Estado del proyecto
- `plan/2026-02-07/session-08.md` — Sesión anterior

## Resumen de donde quedamos

Investigamos exhaustivamente (con papers de Harvard, UCLA Bjork Lab, Washington University, etc.) cómo aplicar learning science a Jarre. Conclusión: testear después de cada concepto funciona (2x retención, papers en el plan doc). Diseñamos un pipeline completo: PDF → extract → segment by concept → translate → embed micro-tests.

## La pregunta abierta que quedó pendiente

El usuario quiere explorar esta idea concreta ANTES de tomar decisiones de implementación:

**¿Es posible NO mostrar el PDF como PDF, sino extraer el texto y renderizarlo como contenido nativo dentro de Jarre?** El usuario quiere:

1. El usuario tiene/compra el PDF de DDIA (ejemplo: Designing Data-Intensive Applications by Kleppmann)
2. El PDF entra al sistema (upload o link)
3. El texto se extrae, traduce, y se renderiza como **contenido embebido nativo** (Markdown → React components), NO como un visor PDF
4. Entre las secciones de cada concepto, aparecen los micro-tests inline
5. La experiencia de lectura es fluida: leer concepto → test → leer siguiente concepto → test

**Esto es diferente al plan original que contemplaba un PDF viewer.** El usuario quiere rendered content, no un PDF embed.

## Lo que hay que hacer en esta sesión

1. **Proof of concept con DDIA Chapter 1**: Tomar el PDF, extraer Chapter 1, segmentar por conceptos (reliability, scalability, maintainability), traducir una sección, y mostrar cómo quedaría como contenido embebido con micro-tests
2. **Decidir las 5 preguntas pendientes** del plan doc (translation model, scope, Python vs TS, etc.)
3. **Evaluar feasibility**: ¿Marker + traducción produce output lo suficientemente limpio para renderizar como contenido nativo? ¿O necesita post-procesado manual?

## Arquitectura relevante actual

- Question bank: 231 preguntas en `scripts/seed-question-bank.ts` (ya seeded en Supabase)
- QuickQuiz component: `src/components/quick-quiz.tsx` (panel flotante, reutilizable)
- Review APIs: `/api/review/random` (acepta `?concepts=id1,id2`), `/api/review/submit` (DeepSeek evalúa + SM-2)
- Learn page: `src/app/learn/[resourceId]/page.tsx` con step navigation
- 7 chapter components hand-written en `src/app/learn/components/`
- `resource_sections` table: NO EXISTE AÚN (propuesta en el plan doc)
- Columns `start_page`/`end_page` en `resources` table: existen pero sin datos

## Stack técnico para el pipeline

- **Marker** (Python): mejor extractor PDF→Markdown para libros técnicos
- **DeepL Pro** ($15/libro) o **DeepSeek V3** ($0.50/libro): traducción
- **Zod + DeepSeek V3**: concept segmentation con structured output
- Todo el pipeline es one-time batch processing, no real-time

## Concepto clave del usuario

El usuario NO quiere un PDF viewer. Quiere que el contenido del libro se convierta en contenido nativo de la app, como si fuera un artículo web bien formateado, con micro-tests embebidos entre secciones. Similar al "mnemonic medium" de Matuschak (Quantum Country) pero con contenido de libros existentes traducido.
