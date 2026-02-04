# Jarre - Backlog

> Last updated: 2026-02-04 (session-01, updated)

## Priority Legend
- `[P0]` Critical - blocking progress
- `[P1]` High - needed for MVP
- `[P2]` Medium - nice to have
- `[P3]` Low - future consideration

---

## In Progress

- [ ] `[P1]` Test evaluation flow with real DeepSeek API key

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

### Robustness (from failure analysis)
- [ ] `[P2]` Handle incomplete evaluations (resume or discard)
- [ ] `[P2]` Rate limiting for evaluations (max 10/day)
- [ ] `[P2]` Token usage display in UI
- [ ] `[P2]` DAG validation for concept prerequisites
- [ ] `[P2]` Admin/debug route for reviewing evaluations

### Features
- [ ] `[P2]` Notes system - take notes while reading
- [ ] `[P2]` Spaced repetition for weak concepts
- [ ] `[P2]` Export progress report
- [ ] `[P3]` Dark mode
- [ ] `[P3]` Mobile PWA

### Integrations
- [ ] `[P3]` PDF viewer for papers
- [ ] `[P3]` YouTube embed for videos
- [ ] `[P3]` Notion import

---

## Ideas / Someday

- [ ] AI tutor mode (conversational learning)
- [ ] Community challenges
- [ ] Share progress publicly
- [ ] Integration with Readwise

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
- [x] `[P1]` Seed data: 50 concepts, 41 resources, 6 projects - 2026-02-04
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
