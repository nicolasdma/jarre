# Jarre - Backlog

> Last updated: 2026-02-08

## Priority Legend
- `[P0]` Critical - blocking progress
- `[P1]` High - needed for MVP
- `[P2]` Medium - nice to have
- `[P3]` Low - future consideration

---

## In Progress

- [ ] `[P1]` Test evaluation flow with real DeepSeek API key
- [ ] `[P1]` Re-seed database with new YouTube resources (57 total)

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
- [ ] `[P2]` Spaced repetition for weak concepts
- [ ] `[P2]` Export progress report
- [ ] `[P3]` Dark mode
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

(none yet)

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
