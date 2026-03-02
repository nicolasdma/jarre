# Jarre

Jarre is a curriculum-first learning system for mastering technical topics with deep understanding, not shallow recall.

The app combines guided study flows, AI-based evaluation, review decks, and voice tutoring in a single workflow.

## Status

- Active development.
- Self-hosted mode is supported via Supabase + BYOK API keys.
- Interfaces and APIs may change as features are stabilized.

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

Run the SQL files in [`supabase/migrations`](./supabase/migrations) against your Supabase project.

If you use Supabase CLI:

```bash
supabase db push
```

### 4) Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` -> start development server
- `npm run build` -> production build
- `npm run start` -> serve production build
- `npm run lint` -> ESLint checks
- `npm run test` -> Vitest test suite
- `npm run check` -> lint + test + build
- `npm run engine` -> start local storage engine server

## Environment Variables

See [`.env.example`](./.env.example) for the full list and comments.

## Repository Layout

- [`src/app`](./src/app) -> routes, API endpoints, and page-level features
- [`src/components`](./src/components) -> reusable UI and interaction components
- [`src/lib`](./src/lib) -> core business logic and shared utilities
- [`supabase/migrations`](./supabase/migrations) -> schema changes
- [`engine/src`](./engine/src) -> storage engine playground backend
- [`scripts`](./scripts) -> ingestion and content-processing utilities

## Linting Note

The current lint configuration is set to keep CI/dev checks usable while legacy rule debt is being reduced.  
Warnings are expected in some areas (especially older modules and generated learning content).

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting guidance.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT. See [LICENSE](./LICENSE).
