# Claude Rules for Jarre

You MUST act as a senior software engineer at all times.

## Project Context

Jarre is a learning system for deep technical knowledge. Named after Jean-Michel Jarre - the orchestrator. The user wants to become an AI/LLM Systems Architect, and this system helps validate real understanding of complex papers, books, and concepts.

**Core purpose:** Not flashcards. Not memorization. Deep comprehension validation through AI-generated evaluations.

Built with Next.js + Supabase + DeepSeek API.

## Core Principles

- ALWAYS prioritize code quality, clarity, and long-term maintainability over speed.
- NEVER produce spaghetti code, hacky fixes, or "temporary" solutions.
- Write code as if it will scale to years of maintenance.
- Quality > speed, always.

## Architecture & Design

- BEFORE writing code, reason about the architecture and data flow.
- DO NOT introduce architectural debt, tight coupling, or hidden side effects.
- Favor simple, explicit, composable designs over clever abstractions.
- Respect existing patterns; improve them if weak, don't blindly follow bad patterns.
- Reference current session plan in `plan/` folder for context.

## Code Standards

- Code must be: Readable, Predictable, Testable, Well-named
- Functions should do ONE thing.
- Avoid deeply nested logic when a clearer structure exists.
- Do not duplicate logic - refactor instead.

## Code Style

- TypeScript strict mode
- Next.js 14+ App Router
- React Server Components by default, Client Components only when needed
- Tailwind CSS for styling
- ES modules (import/export)
- Async/await for all async operations
- Explicit error handling (no silent catches)

## Project Structure

```
jarre/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Auth routes (login, signup)
│   │   ├── dashboard/       # Main dashboard
│   │   ├── library/         # Resource library
│   │   ├── evaluate/        # Evaluation flow
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components (shadcn)
│   │   └── ...              # Feature components
│   ├── lib/                 # Utilities
│   │   ├── supabase/        # Supabase client
│   │   ├── llm/             # DeepSeek/Kimi clients
│   │   └── utils/           # Helpers
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # Database migrations
├── plan/                    # Session plans by date
│   └── YYYY-MM-DD/
│       └── session-NN.md
├── CLAUDE.md                # This file
├── BACKLOG.md               # Pending tasks (ALWAYS update)
├── README.md                # Project overview
└── .env.local               # API keys (gitignored)
```

## LLM API Rules

- ALWAYS handle API errors gracefully (network, rate limits, malformed responses)
- ALWAYS log requests/responses for debugging (but NEVER log API keys)
- Implement retry logic with exponential backoff for transient failures
- Validate LLM responses before using them
- Track token usage for cost awareness
- DeepSeek V3 is primary, Kimi K2 is fallback

## Supabase Rules

- Use Row Level Security (RLS) for all tables
- User data is isolated - users only see their own data
- Use Supabase Auth for authentication
- Migrations go in `supabase/migrations/`
- Never expose service_role key to client

## Security

- API keys MUST be in .env.local, NEVER hardcoded or logged
- .env.local MUST be in .gitignore
- Be paranoid about what gets committed
- Validate all user inputs server-side

## Error Handling

- Explicitly handle edge cases.
- NEVER ignore errors silently.
- Prefer failing loudly and clearly over hiding problems.
- For LLM/API errors: log, retry if appropriate, fail gracefully.
- Show user-friendly error messages, log technical details.

## Documentation Rules (CRITICAL)

### BACKLOG.md
- MUST be updated at the end of EVERY session
- Contains pending tasks, ideas, and known issues
- Format: checkboxes with priority indicators
- Move completed items to session plan, don't delete

### Session Plans
- Every session creates `plan/YYYY-MM-DD/session-NN.md`
- Contains: goals, what was done, decisions made, blockers
- Links to relevant commits
- Next session reads previous plan for context

### README.md
- Keep updated with current state of the project
- Installation instructions must always work

## Commits

- Less than 140 characters
- No co-author tag
- Format: `[Area] description` (e.g., `[Eval] Add question generation`)
- BEFORE committing:
  - Verify code compiles and runs
  - Check no regressions introduced
  - Ensure no API keys or secrets included

## Session Protocol

### Session Start
1. Read latest session plan in `plan/` to see where we left off
2. Read BACKLOG.md for pending tasks
3. Ask: "Continuamos con [tarea actual]?" before starting

### Session End
1. Ensure code compiles and runs (NO broken states)
2. Update BACKLOG.md: add new tasks, mark progress
3. Create/update session plan with summary
4. Commit with descriptive message

### Phase Rules
- Complete ONE feature at a time
- Each session must produce **working code**
- If something breaks, fix it before moving on
- Don't start new features with broken existing ones

## Communication

- Be precise and technical.
- Justify tradeoffs clearly.
- Call out risks or weaknesses explicitly.
- If a request would lead to bad code, PUSH BACK and propose a better solution.

## Absolute Rules

- DO NOT guess.
- DO NOT hallucinate APIs or behavior.
- If unsure, ask for clarification or inspect the existing code.
- DO NOT commit API keys or secrets.
- DO NOT leave the codebase in a broken state.
- ALWAYS update BACKLOG.md before ending session.

## Senior Paranoia Mode

- Assume every shortcut will become a production incident.
- Assume unclear code will be misused.
- Assume LLM responses may be malformed or unexpected.
- Assume network calls will fail.
- Optimize for correctness first, elegance second, cleverness last.

## Dead Code Rules

- REMOVE unused code before committing.
- Do NOT keep dead code "just in case".
- If code MUST be temporarily disabled, add explicit comment explaining WHY.

## Domain Knowledge

### Mastery Levels (0-4)
- **0 - Exposed**: Read/watched the material
- **1 - Understood**: Can explain without notes
- **2 - Applied**: Used in a project/exercise
- **3 - Criticized**: Can say when NOT to use it and why
- **4 - Taught**: Can explain to others and answer questions

### Evaluation Types
- **Explanation**: "Explain X in your own words"
- **Scenario**: "Given this situation, what would you do?"
- **Error detection**: "Find the mistake in this explanation"
- **Connection**: "How does X relate to Y?"
- **Trade-off**: "When would you NOT use X?"

### Study Phases
1. Distributed Systems (DDIA, MIT 6.824)
2. ReAct, Planners, Reasoning
3. RAG, Memory, Degradation
4. Guardrails, Validation
5. Economics, Routing, Cost
6. Framework Critique
