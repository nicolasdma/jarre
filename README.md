# Jarre

> Named after Jean-Michel Jarre - the orchestrator of sound.
> This system orchestrates deep learning.

A personal learning system for mastering complex technical knowledge. Not flashcards. Not memorization. **Deep comprehension validation.**

## What is this?

Jarre helps you truly understand papers, books, and courses by:

1. **Mapping knowledge** - Before reading, see what concepts you'll learn and what prerequisites you need
2. **Validating understanding** - After reading, AI generates hard questions to test real comprehension
3. **Tracking mastery** - See your progress across concepts, identify gaps, get recommendations
4. **Connecting practice** - Each phase has projects that force you to apply what you learned

## Mastery Levels

| Level | Name | Criteria |
|-------|------|----------|
| 0 | Exposed | Read/watched the material |
| 1 | Understood | Can explain without notes |
| 2 | Applied | Used in a project/exercise |
| 3 | Criticized | Can say when NOT to use it and why |
| 4 | Taught | Can explain to others and answer questions |

## Study Plan

Built around becoming an **AI/LLM Systems Architect**:

| Phase | Focus | Key Resources |
|-------|-------|---------------|
| 1 | Distributed Systems | DDIA, MIT 6.824 |
| 2 | ReAct & Reasoning | ReAct paper, Tree of Thoughts, Karpathy talks |
| 3 | RAG & Memory | RAG paper, LlamaIndex pitfalls, Pinecone talks |
| 4 | Guardrails | Constitutional AI, Self-Consistency paper |
| 5 | Economics & Routing | Scaling Laws, inference optimization |
| 6 | Framework Critique | LangChain deep dive (to know when NOT to use it) |

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Auth + DB**: Supabase (Auth + Postgres + RLS)
- **LLM**: DeepSeek V3 (primary), Kimi K2 (fallback)
- **Hosting**: Vercel

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# LLM APIs
DEEPSEEK_API_KEY=your_key
KIMI_API_KEY=your_key (optional fallback)
```

## Project Structure

```
jarre/
├── src/
│   ├── app/           # Next.js pages
│   ├── components/    # React components
│   ├── lib/           # Utilities (supabase, llm, etc.)
│   └── types/         # TypeScript types
├── supabase/
│   └── migrations/    # Database migrations
├── plan/              # Session plans by date
├── CLAUDE.md          # AI assistant rules
├── BACKLOG.md         # Pending tasks
└── README.md          # This file
```

## Documentation

- **BACKLOG.md** - All pending tasks, updated every session
- **plan/** - Session logs with decisions and progress
- **CLAUDE.md** - Rules for AI-assisted development

## License

MIT
