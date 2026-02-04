# Session 01 - 2026-02-04

## Context

First session. Project inception and planning.

## Goals

- [x] Define project purpose and scope
- [x] Choose name (Jarre - after Jean-Michel Jarre, the orchestrator)
- [x] Define tech stack
- [x] Define mastery levels (0-4)
- [x] Define evaluation types
- [x] Map study plan phases
- [x] Create project structure
- [x] Create documentation (CLAUDE.md, BACKLOG.md, README.md)
- [x] Scaffold Next.js project
- [x] Install shadcn/ui + base components
- [x] Create folder structure per CLAUDE.md
- [x] Create TypeScript types
- [x] Create Supabase client stubs
- [x] Create DeepSeek client with retry logic
- [x] Create Zod schemas for LLM responses
- [x] Create versioned prompts
- [x] Create landing page
- [x] Create seed data with full study plan (50 concepts, 41 resources, 6 projects)
- [x] Set up Supabase project (user created jarre project)
- [x] Database migrations (14 tables with RLS)
- [x] Seed database (50 concepts, 41 resources, 6 projects)
- [x] Library page - displays all resources from DB
- [x] Auth flow (login/signup/logout)
- [x] Dashboard page with progress stats
- [x] Library with unlock status based on prerequisites
- [x] Evaluation flow complete (generate + submit + feedback)
- [x] DeepSeek API integration with retry logic
- [x] Added YouTube video resources (Hussein Nasser, Karpathy full series, evaluation videos, infrastructure talks)
- [x] Notes system - structured notes with sections/subsections per resource

## Decisions Made

### 1. Project Name: Jarre
Named after Jean-Michel Jarre (Oxygène Live in Your Living Room 2020). The user wants to become an orchestrator of AI systems, and Jarre orchestrates sound. Perfect metaphor.

### 2. Tech Stack
- **Frontend**: Next.js 14+ with App Router, Tailwind, shadcn/ui
- **Backend**: Supabase (Auth + Postgres + RLS)
- **LLM**: DeepSeek V3 (cheap, capable) with Kimi K2 as fallback
- **Hosting**: Vercel (free tier)
- **Cost**: ~$5/month for LLM API, rest is free

### 3. Mastery Levels
```
0 - Exposed: Read/watched
1 - Understood: Can explain without notes
2 - Applied: Used in project
3 - Criticized: Can say when NOT to use
4 - Taught: Can explain to others
```

### 4. Evaluation Types
- Explanation (explain in own words)
- Scenario (apply to situation)
- Error detection (find the mistake)
- Connection (relate concepts)
- Trade-off (when NOT to use)

### 5. MVP Screens
1. Dashboard - progress overview
2. Library - list resources
3. Resource detail - concepts, prerequisites
4. Evaluation - questions, answers, feedback
5. Concept detail - mastery, history

### 6. Practical Projects per Phase
| Phase | Project |
|-------|---------|
| 1 | Key-value store with replication |
| 2 | ReAct agent from scratch |
| 3 | RAG system with precision/recall measurement |
| 4 | LLM-based validators |
| 5 | Local/cloud router with cost tracking |
| 6 | Reimplement LangChain feature manually |

## Background

The user has built:
- **flopiti-atlas**: Learning cards system with 9 mechanics (superficial content)
- **sidecar**: Local AI agent with memory, routing (touched RAG, economics, agents)

Both were learning experiences. Now wants to go deeper - understand papers, theory, become a real architect.

Target profile (from job posting):
- Think in Systems, Not APIs
- Understand LLM Economics
- Prioritize Restraint
- Production experience

## Study Plan (loaded from user)

### Phase 1 (0-6 months): Fundamentals
- DDIA by Martin Kleppmann (Ch 1, 5, 6, 8)
- MIT 6.824 lectures (consistency, fault tolerance, replication)
- Gaurav Sen System Design videos
- Jay Alammar Transformer articles
- "Attention Is All You Need" paper

### Phase 2 (6-12 months): Reasoning & Agents
- ReAct paper
- Tree of Thoughts paper
- Andrej Karpathy LLM talks

### Phase 3 (12-18 months): RAG & Memory
- RAG paper (original)
- LlamaIndex RAG pitfalls
- Pinecone RAG in production

### Phase 4: Guardrails
- Constitutional AI paper (Anthropic)
- Self-Consistency paper
- Anthropic safety talks

### Phase 5 (18-24 months): Economics
- OpenAI/Anthropic pricing docs
- Scaling Laws paper
- Inference optimization talks

### Phase 6: Framework Critique
- LangChain docs + critique exercise

## Seed Data Created

### Concepts (50 total)
- Phase 1 (Distributed Systems): 14 concepts
- Phase 2 (LLMs + Reasoning): 13 concepts
- Phase 3 (RAG + Memory): 8 concepts
- Phase 4 (Safety): 5 concepts
- Phase 5 (Inference): 7 concepts
- Phase 6 (Frameworks): 3 concepts

### Resources (57 total, updated with YouTube curriculum)
- Phase 1 (18): DDIA chapters, Tanenbaum, SRE Book, MIT 6.824, Hussein Nasser videos
- Phase 2 (16): Papers (Attention, Scaling Laws, Chinchilla, ReAct, ToT), Karpathy full series, Stanford CS25, agent videos
- Phase 3 (5): RAG papers, LlamaIndex, Pinecone
- Phase 4 (7): Safety papers, Anthropic talks, DeepLearning.AI evals, Harvard AI Ethics, Stanford HAI
- Phase 5 (7): vLLM paper, pricing docs, Modal/Vercel/Replicate infra, OpenAI/DeepMind talks
- Phase 6 (4): LangChain docs/videos, AutoGen videos, LlamaIndex docs

### Projects (6 total)
1. Distributed KV Store (Phase 1)
2. ReAct Agent from Scratch (Phase 2)
3. RAG System with Metrics (Phase 3)
4. LLM Output Validators (Phase 4)
5. Model Router with Cost Tracking (Phase 5)
6. Framework Feature Reimplementation (Phase 6)

## Blockers

None.

## Next Session

- [ ] Create Next.js project with App Router
- [ ] Install Tailwind + shadcn/ui
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Implement auth flow
