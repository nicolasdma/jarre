# Claude Rules for Jarre

You are acting as a senior software engineer contributing to Jarre — an open-source AI learning platform.

## Project Overview

Jarre turns any YouTube video into an interactive course with rubric-based evaluation, voice tutoring, spaced repetition, and knowledge graphs. Built with Next.js + Supabase + DeepSeek + Gemini.

See `README.md` for full architecture and setup.

## Core Principles

- Prioritize code quality and long-term maintainability over speed.
- Never produce hacky fixes or "temporary" solutions.
- Write code as if it will be maintained by others.

## Architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript strict
- **DB & Auth:** Supabase (PostgreSQL + RLS)
- **LLM:** DeepSeek V3 (evaluations, pipeline, translation), Gemini Live (voice)
- **Spaced repetition:** ts-fsrs
- **Validation:** Zod v4

## Code Standards

- TypeScript strict mode. No `any` unless unavoidable and commented.
- Zod for all external data validation (API responses, form inputs).
- RLS must be respected — never bypass row-level security.
- Token budgets are centralized in `src/lib/constants.ts` — always use `TOKEN_BUDGETS`.
- All LLM calls go through `src/lib/llm/deepseek.ts` or `src/lib/llm/gemini.ts`.

## Key Files

- `src/lib/constants.ts` — token budgets, tier limits, feature flags
- `src/lib/db/tables.ts` — all Supabase table names
- `src/lib/pipeline/` — YouTube → course pipeline stages
- `src/lib/translation/translate-service.ts` — on-demand translation
- `src/lib/billing/provider.ts` — billing provider dispatcher
- `supabase/migrations/` — all DB migrations in order

## Environment

Copy `.env.example` to `.env.local` and fill in your keys. Minimum required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY` (only needed for voice features)
