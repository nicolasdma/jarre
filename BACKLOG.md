# Jarre - Backlog

> Last updated: 2026-02-20

## Priority Legend
- `[P0]` Critical - blocking progress
- `[P1]` High - needed for MVP
- `[P2]` Medium - nice to have
- `[P3]` Low - future consideration

---

## In Progress

- [ ] `[P1]` Test evaluation flow with real DeepSeek API key
- [ ] `[P1]` Re-seed database with new YouTube resources (57 total)
- [x] `[P1]` Run PDF pipeline on DDIA Ch1 (extract → translate → deduplicate → seed) - 2026-02-08
- [ ] `[P1]` Test learn flow end-to-end (login → library → learn/ddia-ch1 → complete sections)
- [x] `[P1]` Run PDF pipeline on remaining DDIA chapters (Ch2, Ch3, Ch5, Ch6, Ch8, Ch9, Ch11) - 2026-02-09
- [x] `[P1]` Seed all 8 DDIA chapters to Supabase (11 concept sections) - 2026-02-09
- [ ] `[P0]` Run 3 new migrations against Supabase (question_bank_new_types, mc2_format, predicted_score)
- [ ] `[P0]` Run `npx tsx scripts/seed-high-order-questions.ts` to seed ~35 Bloom 4-5 questions
- [ ] `[P1]` Seed mc2 inline quizzes for Ch5 (convert some existing MC to mc2)
- [ ] `[P1]` End-to-end test new learn flow (activate → learn → apply → review → practice-eval → evaluate)
- [ ] `[P0]` Run 4 new Reactive Knowledge System migrations against Supabase

---

## Pending - MVP

### Infrastructure
- [ ] `[P1]` Auth flow (login/signup)
- [ ] `[P1]` DeepSeek API integration (client done, needs API route)

### Core Features
- [ ] `[P1]` Resource detail page - concepts, prerequisites
- [ ] `[P1]` Evaluation flow - generate questions
- [ ] `[P1]` Evaluation flow - submit answers
- [ ] `[P1]` Evaluation flow - AI feedback
- [ ] `[P1]` Evaluation flow - "Report bad question" button
- [ ] `[P1]` Evaluation flow - "I disagree" button (flags for review)
- [ ] `[P1]` Dashboard - progress overview
- [ ] `[P1]` Concept detail page - mastery level

### Data
- [ ] `[P1]` Seed study plan (Phase 1-6 resources)
- [ ] `[P1]` Define concepts for each resource
- [ ] `[P1]` Define prerequisites graph

### Projects (Practical)
- [ ] `[P2]` Project page - list projects by phase
- [ ] `[P2]` Project detail - deliverables, status

---

## Pending - Post-MVP

### Evaluation History - Phase 2
- [ ] `[P2]` Re-evaluation of failed questions (parent_evaluation_id)
- [ ] `[P2]` Progress tracking: "Attempt 1: 60% → Attempt 2: 85%"
- [ ] `[P2]` Dashboard section: "Recent Evaluations" with last 5

### Robustness (from failure analysis)
- [ ] `[P2]` Handle incomplete evaluations (resume or discard)
- [ ] `[P2]` Rate limiting for evaluations (max 10/day)
- [ ] `[P2]` Token usage display in UI
- [ ] `[P2]` DAG validation for concept prerequisites
- [ ] `[P2]` Admin/debug route for reviewing evaluations

### Features
- [x] `[P2]` Spaced repetition for weak concepts - 2026-02-08
- [ ] `[P2]` Export progress report
- [x] `[P3]` Dark mode - 2026-02-10
- [ ] `[P3]` Mobile PWA

### Integrations
- [ ] `[P3]` PDF viewer for papers
- [ ] `[P3]` YouTube embed for videos
- [ ] `[P3]` Notion import

---

## Storage Engine (Learn by Doing - DDIA Ch3)

- [x] `[P1]` Session 1: RESP protocol + Append-Only Log backend - 2026-02-05
- [x] `[P1]` Session 2: Hash Index + Web UI shell - 2026-02-05
- [x] `[P1]` Session 3: WAL + Crash Recovery - 2026-02-05
- [x] `[P1]` Session 4: Memtable + SSTable + LSM-Tree - 2026-02-05
- [x] `[P2]` Session 5: Bloom Filters + Compaction - 2026-02-05
- [x] `[P2]` Session 6: B-Tree - 2026-02-06
- [ ] `[P3]` Session 7: Benchmarks + Comparison

---

## Phase 1 Playgrounds (DDIA Chapters)

- [x] `[P1]` Latency Simulator (Ch1) — percentiles, SLOs, tail latency amplification - 2026-02-06
- [x] `[P1]` Replication Lab (Ch5) — leader-based replication, failover, consistency violations - 2026-02-06
- [x] `[P1]` Partition Visualizer (Ch6) — hash/consistent/range partitioning, hotspots - 2026-02-06
- [x] `[P1]` Consensus Stepper (Ch8-9) — Raft protocol, election, log replication - 2026-02-06
- [x] `[P1]` Routing integration — Library → Learn → Playground navigation - 2026-02-06
- [ ] `[P2]` Visual polish pass — review all 4 playgrounds for UI consistency
- [ ] `[P2]` Edge case testing — kill all nodes, rate=0, empty states
- [ ] `[P3]` Mobile/responsive layout for playgrounds

---

## AI Tutor — Embodied Orchestrator (Next up)

- [x] `[P1]` Socratic chat panel in all 4 playgrounds (streaming, proactive questions) - 2026-02-07
- [ ] `[P1]` Add Gemini 2.0 Flash client (`src/lib/llm/gemini.ts`)
- [ ] `[P1]` TutorOrchestrator React Context (validates + dispatches visual actions)
- [ ] `[P1]` `useTutorOverlay(elementId)` hook for playground components
- [ ] `[P1]` CSS effects: glow, dim, annotate, trace, shake, pulse, spotlight
- [ ] `[P1]` SVG trace overlay layer for animated paths
- [ ] `[P1]` Structured JSON response parsing (speech + actions)
- [ ] `[P2]` Integrate with consensus playground (first)
- [ ] `[P2]` Integrate with remaining 3 playgrounds
- [ ] `[P2]` "Alive" presence effects (breathing dot, passive notice, natural typing)
- See: `plan/2026-02-07/tutor-orchestrator-design.md`

---

## Learn Flow — ACTIVATE → LEARN → APPLY → EVALUATE

- [x] `[P1]` Migration 008: resource_sections table - 2026-02-08
- [x] `[P1]` PDF pipeline scripts (extract, segment, translate) - 2026-02-08
- [x] `[P1]` Seed DDIA Ch1 sections (faithful translation, ~7600 words ES) - 2026-02-08
- [x] `[P1]` LearnFlow + ConceptSection + SectionContent components - 2026-02-08
- [x] `[P1]` Micro-test mastery integration (0→1 via 3+ correct) - 2026-02-08
- [x] `[P1]` Run full pipeline on DDIA PDF (all 8 chapters) - 2026-02-09
- [x] `[P1]` Build arXiv paper ingestion script (`scripts/ingest-arxiv.py`) - 2026-02-09
- [x] `[P1]` Build YouTube transcript ingestion script (`scripts/ingest-youtube.py`) - 2026-02-09
- [x] `[P1]` Create glossary system (`scripts/glossaries/`) + refactor translate-chapter.py - 2026-02-09
- [ ] `[P1]` Translate and seed first arXiv paper (RAG: 2005.11401)
- [ ] `[P1]` Translate and seed first YouTube transcript
- [x] `[P1]` Learn progress persistence in Supabase (cross-device) - 2026-02-09
- [x] `[P1]` ConceptVisual system: registry + 5 Framer Motion visuals - 2026-02-09
- [x] `[P1]` Re-segment DDIA Ch5 into 5 sub-sections (was 16K words single blob) - 2026-02-09
- [x] `[P1]` Extract DDIA figures from PDF (67 figures, 4.4 MB, all 8 chapters) - 2026-02-09
- [x] `[P1]` Figure injection at render time (registry + injector + img/figcaption components) - 2026-02-09
- [x] `[P1]` Inline micro-quizzes: MC/TF after sub-headings (migration + component + 22 Ch5 quizzes seeded) - 2026-02-09
- [ ] `[P1]` Seed inline quizzes for remaining DDIA chapters (Ch1, Ch2, Ch3, Ch6, Ch8, Ch9, Ch11)
- [ ] `[P2]` Pre-question evaluation via DeepSeek (currently just records attempt)
- [ ] `[P2]` Re-segment remaining long chapters (Ch2: 12K, Ch3: 13K, Ch8: 17K, Ch9: 23K, Ch11: 19K)
- [ ] `[P2]` Create ConceptVisuals for other chapters (partitioning, consistency, consensus)
- [ ] `[P3]` Auto advance organizer for chapters without hand-written component
- See: `plan/2026-02-08/session-10-learn-flow.md`

---

## Scaffolding Cognitivo — Bloom Gap Bridge

- [x] `[P0]` FASE 1: New question types (scenario/limitation/error_spot) in question_bank - 2026-02-10
- [x] `[P0]` FASE 2: MC Two-Tier (mc2) — MC + justification format - 2026-02-10
- [x] `[P0]` FASE 3: Obligatory self-explanation as gate to advance - 2026-02-10
- [x] `[P1]` FASE 4: Practice evaluation step with progressive scaffolding - 2026-02-10
- [x] `[P2]` FASE 5: Confidence calibration (predicted_score in evaluations) - 2026-02-10
- [x] `[P2]` FASE 6: Review interleaved (flat shuffled, no consecutive same-concept) - 2026-02-10
- See: `plan/2026-02-10/session-15-scaffolding-cognitivo.md`

---

## Competitive Analysis — Actionable Improvements

> Source: `plan/2026-02-16/competitive-analysis.md`
> Benchmarked against: Boot.dev, Coursera, Educative.io, LeetCode/AlgoExpert, fast.ai

### Mastery Level Gaps (P1)
- [ ] `[P1]` **LLM-as-peer-reviewer** — Generate "student responses" with deliberate errors; user evaluates with rubric (mastery 3: Criticized). Inspired by Coursera peer review.
- [x] `[P1]` **Teach-the-LLM mode** — User explains concept; LLM asks follow-up questions as confused student (mastery 4: Taught). Validates ability to teach. - 2026-02-16
- [x] `[P1]` **Voice evaluation (Socratic)** — Replace textarea evaluations with oral Socratic assessment via Gemini Live. DeepSeek scores transcripts. - 2026-02-16
- [ ] `[P1]` **Mini-projects after playgrounds** — Guided design exercises post-playground (e.g., "design replication schema for these constraints"). Validates mastery 2: Applied. Inspired by Boot.dev interleaved projects.
- [ ] `[P1]` **Grokking template for resources** — Standardize structure: Requirements → Architecture → Deep Dive → Tradeoffs. Apply to all new resources and PDF-to-Course pipeline. Inspired by Educative.io.

### Engagement & Gamification (P2)
- [ ] `[P2]` **Gem economy for scaffolding** — Earned through reviews/evaluations, spent on hints in practice-eval level 3. Aligns incentives (help available but costly). Inspired by Boot.dev.
- [ ] `[P2]` **Ambitious ACTIVATE step** — Show full system working (e.g., live RAG pipeline demo) before deconstructing. Top-down "whole game" approach. Inspired by fast.ai.
- [ ] `[P2]` **Content curation policy** — Define max ~20-30 curated resources per phase. Resist volume when PDF-to-Course scales. Inspired by AlgoExpert's 160-problem curation.

### Future Consideration (P3)
- [ ] `[P3]` **Portable skill badges/certificates** — Exportable proof of mastery per phase/concept
- [ ] `[P3]` **Community forum / study groups** — Peer interaction for mastery 3-4 with real humans

---

## Phase 2 — Karpathy Zero to Hero + Papers

> Phase 2 restructured: 11 resources total (8 kz2h-* videos + 3 papers)
> Migration: `20260220040000_phase2_karpathy_restructure.sql` (applied)
> See: `plan/2026-02-20/session-01-phase2-karpathy.md`

### Content Pipeline Progress

| Resource | Transcript | Translate | Resegment | TSX | Questions | Quizzes | Exercises |
|----------|-----------|-----------|-----------|-----|-----------|---------|-----------|
| kz2h-micrograd | x | running | - | x | x | - | - |
| kz2h-makemore-bigram | - | - | - | - | - | - | - |
| p2-bengio-lm-paper | - | - | - | - | - | - | - |
| kz2h-makemore-mlp | - | - | - | - | - | - | - |
| kz2h-activations-batchnorm | - | - | - | - | - | - | - |
| kz2h-backprop-ninja | - | - | - | - | - | - | - |
| p2-resnet-paper | - | - | - | - | - | - | - |
| kz2h-wavenet | - | - | - | - | - | - | - |
| kz2h-building-gpt | - | - | - | - | - | - | - |
| attention-paper | EXISTING | EXISTING | EXISTING | EXISTING | EXISTING | CHECK | CHECK |
| kz2h-tokenizers | - | - | - | - | - | - | - |

### Pending Tasks
- [ ] `[P1]` Complete kz2h-micrograd: resegment translated transcript, seed sections, create inline quizzes + exercises
- [ ] `[P1]` Pipeline remaining 7 kz2h-* videos (transcript → translate → resegment → artefacts)
- [ ] `[P1]` Pipeline p2-bengio-lm-paper (PDF extract → generate 5 sections → artefacts)
- [ ] `[P1]` Pipeline p2-resnet-paper (PDF extract → generate 5 sections → artefacts)
- [ ] `[P2]` Verify attention-paper has exercises (may need creation)
- [ ] `[P2]` Create playground for micrograd (/playground/micrograd)

---

## Content Pipeline — Nuevos Recursos

### "Build a Large Language Model (From Scratch)" — Sebastian Raschka (Nueva Phase 3)
> Libro principal + playlist YouTube como complemento. Mismo pipeline que DDIA.
> Manning 2024, ISBN 978-1633437166 | [GitHub](https://github.com/rasbt/LLMs-from-scratch)
> Playlist: https://www.youtube.com/playlist?list=PLTKMiZHVd_2IIEsoJrWACkIxLRdfMlw11

#### Paso 1: Reestructuración de fases (cascade)
> Raschka pasa a ser Phase 3 ("Build an LLM"). Current Phase 3 (papers/Karpathy) pasa a Phase 4 ("Transformer Deep Dive").
> Cascade: Phase 4→5, 5→6, 6→7, 7→8, 8→9, 9→10, 10→11, 11→12.
- [ ] `[P2]` Migración: expandir enum `study_phase` a `'12'`
- [ ] `[P2]` Migración: cascade renumeración (Phase 11→12, 10→11, 9→10, 8→9, 7→8, 6→7, 5→6, 4→5, 3→4) — orden inverso para evitar colisiones
- [ ] `[P2]` Migración: insertar nueva Phase 3 con recurso `raschka-llm-from-scratch` (type: book, ~25h)
- [ ] `[P2]` Actualizar `src/` phase labels/traducciones si los hay hardcodeados
- [ ] `[P2]` Verificar que no haya cascade bugs (lección de `fix_curriculum_cascade.sql`)

#### Paso 2: Content pipeline (mismo que DDIA)
- [ ] `[P2]` Conseguir PDF del libro (Manning / O'Reilly)
- [ ] `[P2]` Mapear capítulos → páginas → conceptos (tokenization, self-attention, transformer-architecture, etc.)
- [ ] `[P2]` Extraer capítulos con `extract-chapter.py` (agregar rangos de páginas)
- [ ] `[P2]` Traducir con `translate-chapter.py` + glosario `ml-ai.json` (~$2 DeepSeek V3)
- [ ] `[P2]` Seed secciones a Supabase con `seed-sections.ts`

#### Paso 3: Complementos
- [ ] `[P2]` Crear migración: recurso `raschka-llm-videos` (type: video, phase: 3, ~15h) — 7 videos YouTube
- [ ] `[P3]` Seed inline quizzes por capítulo
- [ ] `[P3]` Extraer figuras del PDF (si las tiene)

---

## Reactive Knowledge System — IMPLEMENTED 2026-02-19

> Plan completo: `plan/reactive-knowledge-system.md`
> Feature: Usuario agrega recursos externos → LLM extrae conceptos → linking orgánico al currículo → conversación de voz exploratoria → bitácora unificada → insight engine proactivo

### Etapa 1: Fundamentos — Data Model + Pipeline ✅
- [x] `[P1]` Migración: `user_resources`, `user_resource_concepts`, `consumption_log` tables (con RLS) - 2026-02-19
- [x] `[P1]` Types: `src/lib/ingest/types.ts` + tipos en `src/types/index.ts` - 2026-02-19
- [x] `[P1]` Content resolver: YouTube transcript + fallback a notas - 2026-02-19
- [x] `[P1]` Concept extractor: DeepSeek + Zod schema - 2026-02-19
- [x] `[P1]` Curriculum linker: DeepSeek + Zod schema (~150 conceptos en contexto) - 2026-02-19
- [x] `[P1]` API route: `POST /api/resources/ingest` - 2026-02-19
- [x] `[P1]` `AddResourceModal` component + integración Library - 2026-02-19

### Etapa 2: Bitácora + Vista de Recurso ✅
- [x] `[P1]` API route: `GET/DELETE /api/resources/[id]` - 2026-02-19
- [x] `[P1]` Página `/resources/[id]` (vista recurso externo con links al currículo) - 2026-02-19
- [x] `[P1]` Página `/journal` (timeline cronológico inverso) - 2026-02-19
- [x] `[P1]` Auto-logging: `saveEvaluationResults` → `consumption_log` - 2026-02-19

### Etapa 3: Voice Exploration ✅
- [x] `[P1]` Migración: `voice_sessions` con 'exploration' type + `user_resource_id` - 2026-02-19
- [x] `[P1]` `buildVoiceExplorationInstruction` — system prompt peer-to-peer - 2026-02-19
- [x] `[P1]` `useVoiceExplorationSession` hook - 2026-02-19
- [x] `[P1]` `ExplorationSummaryResponseSchema` + API route - 2026-02-19
- [x] `[P1]` Extended voice session routes (start/end/context) - 2026-02-19
- [x] `[P1]` `DiscussWithTutorButton` component en vista recurso - 2026-02-19

### Etapa 4: Enriched Learner Memory ✅
- [x] `[P1]` Migración: analogies, open_questions, personal_examples, connections_made - 2026-02-19
- [x] `[P1]` Updated `updateLearnerConceptMemory` + `formatMemoryForPrompt` - 2026-02-19
- [x] `[P1]` Updated `LearnerConceptMemory` interface - 2026-02-19

### Etapa 5: Freeform + Debate ✅
- [x] `[P1]` Migración: freeform + debate session types - 2026-02-19
- [x] `[P1]` `buildVoiceFreeformInstruction` — system prompt - 2026-02-19
- [x] `[P1]` `buildVoiceDebateInstruction` — system prompt - 2026-02-19
- [x] `[P1]` `useVoiceFreeformSession` + `useVoiceDebateSession` hooks - 2026-02-19
- [x] `[P1]` `GET /api/voice/freeform/context` — full concept graph + activity + memory - 2026-02-19

### Etapa 6: Insight Engine ✅
- [x] `[P1]` Migración: `insight_suggestions` table (con RLS) - 2026-02-19
- [x] `[P1]` Mastery catalyst: suggest exploration when external resource links to low-mastery concepts - 2026-02-19
- [x] `[P1]` Gap detection: stale concepts, unresolved misconceptions, open questions - 2026-02-19
- [x] `[P1]` Debate topic generation via DeepSeek - 2026-02-19
- [x] `[P1]` `GET/POST/PATCH /api/insights` — fetch, generate, manage suggestions - 2026-02-19
- [x] `[P1]` Auto-trigger insights after resource ingestion - 2026-02-19

### Pending Polish
- [ ] `[P2]` Backfill retroactivo de `consumption_log` desde datos históricos
- [ ] `[P2]` Insights dashboard widget (mostrar sugerencias proactivas en dashboard)
- [ ] `[P2]` Consolidation insight (DeepSeek analiza actividad reciente, sugiere sesión de síntesis)
- [ ] `[P3]` Vista de grafo mental (d3-force o react-flow: conceptos como nodos, recursos como satélites)
- [ ] `[P3]` Auto-logging en learn flow + voice session end
- [ ] `[P3]` Concept definitions API for debate context

---

## Ideas / Someday

- [ ] Community challenges
- [ ] Share progress publicly
- [ ] Integration with Readwise

---

## Practical Track — Cursos (cursos/practical-track/)

> Cada side project completado genera un curso documentado en `cursos/practical-track/`.

- [x] `s01-clima-cli.md` — HTTP, APIs, JSON, argparse, .env, manejo de errores, ANSI colors - 2026-02-07

---

## Side Projects — Aprender CLIs, Cookies, Bots, APIs, MCP

> Inspirados por el stack de steipete (CodexBar, Spogo, SweetCookie, macOS Automator MCP, etc.)
> Ordenados de fácil a complejo. Cada uno enseña una técnica nueva.

### Nivel 1 — CLIs básicos
- [x] `[S1]` **clima-cli** — El clima en tu terminal (API REST pública, JSON parsing, API keys) - 2026-02-07
- [ ] `[S2]` **misgastos** — Gastos desde un CSV (File I/O, parsing, colores ANSI)
- [ ] `[S3]` **quehay** — Próximos eventos del día vía AppleScript/JXA (osascript, subprocess)

### Nivel 2 — Cookies y scraping
- [ ] `[S4]` **cookiejar** — Extractor de cookies de Chrome (SQLite, Keychain, AES, base de SweetCookie)
- [ ] `[S5]` **misubs** — Suscripciones de YouTube con cookies (session cookies, headers, user-agent)
- [ ] `[S6]` **redditrss** — Feed personalizado de Reddit en terminal (API pública vs endpoints internos)

### Nivel 3 — Automatización macOS
- [ ] `[S7]` **darkswitch** — Toggle modo oscuro + wallpaper (AppleScript, `defaults write`)
- [ ] `[S8]` **appspy** — Qué apps tienes abiertas y cuánto tiempo (Accessibility APIs, polling)
- [ ] `[S9]` **notifyme** — Notificaciones nativas desde CLI (osascript, UNUserNotification)

### Nivel 4 — Menu bar apps
- [ ] `[S10]` **gitbar** — Estado de repos en barra de menú (SwiftUI menu bar, GitHub API, polling)
- [ ] `[S11]` **preciodolar** — Precio del dólar en menu bar (URLSession, SwiftUI, API pública)

### Nivel 5 — Servidores MCP
- [ ] `[S12]` **mcp-notas** — Tu primer servidor MCP (protocolo MCP, JSON-RPC, stdin/stdout)
- [ ] `[S13]` **mcp-spotify** — Controla Spotify desde Claude (MCP + OAuth + API real)
- [ ] `[S14]` **mcp-casa** — Smart home desde Claude (MCP + IoT, discovery de red)

### Nivel 6 — Bots y mensajería
- [ ] `[S15]` **telebot** — Bot de Telegram que ejecuta comandos (Bot API, webhooks, seguridad)
- [ ] `[S16]` **wanotify** — Alertas WhatsApp post-deploy (WhatsApp Business API/Twilio, CI)

### Nivel 7 — Browser automation
- [ ] `[S17]` **autofill** — Llena formularios web automáticamente (Playwright/Puppeteer, selectores CSS)
- [ ] `[S18]` **pricewatcher** — Monitorea precios y avisa si bajan (scraping periódico, cron, persistencia)

### Nivel 8 — Proyectos integradores
- [ ] `[S19]` **agente-freelance** — Asistente de Upwork en terminal (cookies + scraping + CLI + notificaciones)
- [ ] `[S20]` **mi-codex** — Tu propio "agente de agentes" (MCP + browser automation + cookies + APIs)

---

## Known Issues

- [ ] `[P2]` Evaluación LLM no 100% determinística — temperature=0 mejora pero no elimina varianza. Probar `seed` param (hash de questionId+userAnswer) para forzar determinismo en misma pregunta+respuesta. Ver: DeepSeek API `seed` es "best effort".

---

## Completed

- [x] `[P0]` Project scaffold (Next.js + Tailwind + shadcn) - 2026-02-04
- [x] `[P1]` TypeScript types for all entities - 2026-02-04
- [x] `[P1]` Zod schemas for LLM responses - 2026-02-04
- [x] `[P1]` Versioned prompts (lib/llm/prompts.ts) - 2026-02-04
- [x] `[P1]` DeepSeek client with retry logic - 2026-02-04
- [x] `[P1]` Supabase client stubs (browser + server) - 2026-02-04
- [x] `[P1]` Seed data: 50 concepts, 57 resources, 6 projects - 2026-02-04 (updated with YouTube curriculum)
- [x] `[P1]` Supabase project setup - 2026-02-04
- [x] `[P1]` Database schema + migrations (14 tables with RLS) - 2026-02-04
- [x] `[P1]` Seed database with study content - 2026-02-04
- [x] `[P1]` Library page - list resources by phase - 2026-02-04
- [x] `[P1]` Auth flow (login/signup/logout) - 2026-02-04
- [x] `[P1]` Dashboard page with progress stats - 2026-02-04
- [x] `[P1]` Protected routes middleware - 2026-02-04
- [x] `[P1]` Library with unlock status based on prerequisites - 2026-02-04
- [x] `[P1]` Evaluation flow (generate questions + evaluate) - 2026-02-04
- [x] `[P1]` DeepSeek API integration - 2026-02-04
- [x] `[P2]` Notes system - take structured notes while reading - 2026-02-04
- [x] `[P1]` Evaluation history - view past evaluations with detail - 2026-02-04
- [x] `[P1]` Storage engine Session 1: RESP protocol + Append-Only Log - 2026-02-05
- [x] `[P1]` Storage engine Session 2: Hash Index + Web UI - 2026-02-05
- [x] `[P1]` Routing integration: Library → /learn → playground redirect - 2026-02-05
- [x] `[P1]` RAM vs SSD visualization in state inspector - 2026-02-05
- [x] `[P1]` Storage engine Session 3: WAL + CRC32 + crash recovery - 2026-02-05
- [x] `[P1]` Storage engine Session 4: Memtable + SSTable + LSM-Tree - 2026-02-05
- [x] `[P1]` Per-backend WAL isolation (separate WAL files) - 2026-02-05
- [x] `[P2]` Storage engine Session 5: Bloom Filters + SSTable v2 + Compaction - 2026-02-05
- [x] `[P2]` Storage engine Session 6: B-Tree backend + visualization + lessons 14-18 - 2026-02-06
- [x] `[P1]` Latency Simulator playground (DDIA Ch1) — 5 files, 1639 lines - 2026-02-06
- [x] `[P1]` Replication Lab playground (DDIA Ch5) — 5 files, 1923 lines - 2026-02-06
- [x] `[P1]` Partition Visualizer playground (DDIA Ch6) — 5 files, 1615 lines - 2026-02-06
- [x] `[P1]` Consensus Stepper playground (DDIA Ch8-9) — 7 files, 2061 lines - 2026-02-06
- [x] `[P1]` Phase 1 routing integration (resource-card, learn page, questions page) - 2026-02-06
- [x] `[P1]` Socratic AI tutor chat in all 4 playgrounds (streaming + proactive) - 2026-02-07
- [x] `[P1]` LLM cost analysis for orchestrator (Gemini Flash selected) - 2026-02-07
- [x] `[P1]` Embodied tutor orchestrator architecture design doc - 2026-02-07
- [x] `[S1]` clima-cli — CLI + curso práctico (HTTP, APIs, JSON, argparse, .env) - 2026-02-07
- [x] `[P1]` Translate all 8 DDIA chapters (120K+ EN words → 130K+ ES words) - 2026-02-09
- [x] `[P1]` Build multi-source ingestion pipeline (arXiv + YouTube + glossaries) - 2026-02-09
- [x] `[P1]` Learn progress persistence (learn_progress table + API + save on transitions) - 2026-02-09
- [x] `[P1]` ConceptVisual system (registry, 5 animated visuals, section-level lookup) - 2026-02-09
- [x] `[P1]` Re-segment DDIA Ch5 into 5 digestible sections (16,598 words preserved) - 2026-02-09
- [x] `[P1]` DDIA figure extraction pipeline (67 PNGs from PDF, JSON registry) - 2026-02-09
- [x] `[P1]` Figure injection system (render-time injection at caption positions) - 2026-02-09
- [x] `[P1]` Inline micro-quizzes (MC/TF, client-side grading, interleaved in content) - 2026-02-09
- [x] `[P1]` Migration 009: inline_quizzes table + RLS + index - 2026-02-09
- [x] `[P1]` Seed 22 inline quizzes for DDIA Ch5 (5 sections, MC+TF mix) - 2026-02-09
- [x] `[P1]` UI/UX redesign: design tokens, TOC sidebar, confidence, dark mode, growth vocabulary - 2026-02-10
- [x] `[P0]` Scaffolding cognitivo: 6 phases bridging Bloom 2→5 gap (new qtypes, mc2, self-explanation, practice-eval, calibration, interleaving) - 2026-02-10
- [x] `[P2]` Whisper TTS read-along mode in learn flow (Web Speech API, hold Space to read, auto-advance) - 2026-02-10
- [x] `[P0]` Hardening: localStorage drafts, saved flag, LLM timeout, canvas error UI - 2026-02-14
- [x] `[P0]` Hardening: Vitest + 45 unit tests (spaced-repetition, mastery, grading) - 2026-02-14
- [x] `[P1]` Hardening: 404 page, dashboard try/catch, review empty states, aria-current, mobile hamburger - 2026-02-14
- [x] `[P1]` Voice evaluation (Socratic): Gemini Live oral assessment → DeepSeek transcript scoring → same mastery/XP outputs - 2026-02-16
- [x] `[P1]` Teach-the-Tutor (Level 4): student teaches confused AI junior, score >= 80 advances 3→4 - 2026-02-16
- [x] `[P1]` Refactor: extract save-results.ts shared between text/voice eval endpoints - 2026-02-16
- [x] `[P1]` Tutor model overhaul: AutoTutor escalation, Productive Failure, anti-sycophancy, mastery-adaptive prompts - 2026-02-17
- [x] `[P1]` Post-evaluation consolidation: ideal answers, divergence analysis, review suggestions per concept - 2026-02-17
- [x] `[P1]` Learner concept memory: misconceptions/strengths DB table, accumulation across sessions, prompt injection - 2026-02-17
- [x] `[P1]` Reactive Knowledge System: complete 6-stage implementation (resources, journal, voice exploration, enriched memory, freeform/debate, insight engine) - 2026-02-19
