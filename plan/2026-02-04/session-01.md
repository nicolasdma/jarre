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
- [ ] Set up Supabase project (next session)

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

## Blockers

None.

## Next Session

- [ ] Create Next.js project with App Router
- [ ] Install Tailwind + shadcn/ui
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Implement auth flow
