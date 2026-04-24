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

## Curriculum Resource Sourcing

When adding, replacing, or auditing curriculum resources (seed SQL, `resources` table rows, migrations that insert URLs), the following rules are non-negotiable. Full protocol in `QUALITY.md` at the repo root — read it before touching any `seed_*` migration or proposing a resource URL.

- **Verify with HTTP, always.** Every URL must return 200 via `curl -L -H "User-Agent: Mozilla/5.0 ..."` (or `WebFetch`) before being written to any file or DB. WebSearch saying a page "exists" is not evidence.
- **YouTube needs captions.** The pipeline requires them. If `yt-dlp --list-subs` returns nothing, the video is not a valid resource — pick another, or flag it for ASR fallback if and only if that path is explicitly wired up.
- **Never invent URLs by pattern.** If `site.com/articles/X` exists, that says nothing about `site.com/articles/Y`. Each URL is verified individually.
- **Triangulate.** Every resource should be supported by at least one independent corroborating source (cited in the `description` or an adjacent recurso). Single-source claims are suspect.
- **Author and institution must be justifiable.** A recurso whose `author` field you could not defend to a domain expert does not belong in the curriculum.
- **Primary sources beat secondary.** If a UNESCO listing, an ICANH publication, a peer-reviewed paper, or the author's own institutional repository is available and stable, use that over a news article or blog summary.
- **Pipeline only ingests PDF and YouTube.** Any other URL (HTML articles, landing pages, CONTENTdm viewers, journal HTML pages) resolves to `pipeline_support = 'unsupported'` and the learner sees *"El link no parece válido"*. Propose **only** direct PDF (`application/pdf`) or YouTube URLs unless the user explicitly opts into an HTML resource as reference-only. When a source has both HTML landing and a PDF download, link the PDF. See `docs/pipeline-sources.md` for the full diagnosis and planned solutions.

If in doubt: stop, read `QUALITY.md`, ask the user. Do not ship unverified recursos.

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
