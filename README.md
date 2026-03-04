# Jarre

Jarre is a curriculum-first learning platform for mastering technical topics through guided study, applied practice, AI-based evaluation, review decks, and voice tutoring.

## Project Status

- Active development
- Self-hosted mode is supported (Supabase + BYOK API keys)
- Public APIs and UI flows can change while the platform stabilizes

## Core Features

- Curriculum phases with prerequisite-aware unlocking
- Learn -> apply -> evaluate loops for each resource
- AI-generated and AI-scored evaluations
- Review deck with mastery/progression tracking
- YouTube-to-course ingestion pipeline
- Voice tutor flows (guided, freeform, and review-oriented)

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- DeepSeek + Gemini APIs
- Optional billing providers: Stripe / LemonSqueezy

## Quickstart

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env.local
```

Fill required values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`

### 3) Apply database migrations

Run SQL files in [`supabase/migrations`](./supabase/migrations) against your Supabase project.

If you use Supabase CLI:

```bash
supabase db push
```

### 4) Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` -> start development server
- `npm run build` -> production build
- `npm run start` -> serve production build
- `npm run lint` -> ESLint checks
- `npm run test` -> Vitest test suite
- `npm run typecheck` -> TypeScript checks (`tsc --noEmit`)
- `npm run check` -> lint + test + typecheck + build
- `npm run engine` -> start local storage engine server
- `npm run curriculum:audit` -> validate curriculum integrity (duplicates, prerequisite DAG, coverage)
- `npm run curriculum:export-template` -> export reusable curriculum template JSON + audit report

## Repository Layout

- [`src/app`](./src/app) -> routes, API endpoints, and page-level features
- [`src/components`](./src/components) -> reusable UI and interaction components
- [`src/lib`](./src/lib) -> business logic and shared utilities
- [`supabase/migrations`](./supabase/migrations) -> schema changes
- [`engine/src`](./engine/src) -> storage engine playground backend
- [`scripts`](./scripts) -> ingestion and content-processing utilities
- [`docs`](./docs) -> architecture and project policies

## Open Source Standards

- License: [MIT](./LICENSE)
- Contributor guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Governance model: [GOVERNANCE.md](./GOVERNANCE.md)
- Support channels: [SUPPORT.md](./SUPPORT.md)
- Changelog format: [CHANGELOG.md](./CHANGELOG.md)
- Architecture reference: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Curriculum system reference: [docs/CURRICULUM_SYSTEM.md](./docs/CURRICULUM_SYSTEM.md)
- OSS readiness checklist: [docs/OPEN_SOURCE_CHECKLIST.md](./docs/OPEN_SOURCE_CHECKLIST.md)
- Content policy: [docs/CONTENT_POLICY.md](./docs/CONTENT_POLICY.md)

## Content and Licensing Note

Jarre includes educational integrations and references to third-party materials.
Contributors must only add content/assets they are authorized to redistribute. See [docs/CONTENT_POLICY.md](./docs/CONTENT_POLICY.md).

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.
