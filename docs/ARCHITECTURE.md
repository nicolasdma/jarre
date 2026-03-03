# Architecture Overview

## High-Level Components

- Next.js application (`src/app`, `src/components`, `src/lib`)
- Supabase backend (Auth, Postgres, RLS, migrations)
- AI services (DeepSeek for scoring/generation, Gemini for voice)
- Optional billing adapters (Stripe, LemonSqueezy)
- Local storage-engine playground (`engine/`)

## Request Flow (Typical)

1. User interacts with App Router page/component.
2. Server route handlers in `src/app/api` enforce auth/context.
3. Business logic in `src/lib` orchestrates DB + AI calls.
4. Supabase persists learner state, progress, and generated artifacts.
5. UI updates via server responses and client state.

## Data and Schema

- Schema evolution is migration-first in `supabase/migrations`.
- Old migrations are immutable; new changes must be additive migrations.

## AI Integration Boundaries

- Prompt and schema contracts live in `src/lib/llm`.
- API wrappers and retries are centralized in client modules.
- Route handlers should validate and sanitize AI outputs before persistence.

## Reliability Notes

- CI runs lint, tests, type checks, and production build.
- Dependency review and Dependabot reduce supply-chain risk.
- Security disclosures follow `SECURITY.md`.
