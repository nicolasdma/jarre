# Contributing to Jarre

Thanks for contributing. This guide keeps collaboration fast, reviewable, and safe for a public open source project.

## Ground Rules

- Keep pull requests focused and small.
- Prefer incremental changes over broad refactors.
- Do not commit secrets, credentials, or `.env.local`.
- Update docs when behavior, setup, or APIs change.
- Only contribute content/assets you are authorized to redistribute.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Apply Supabase migrations from [`supabase/migrations`](./supabase/migrations).

4. Run the app:

```bash
npm run dev
```

## Quality Gates

Run before opening a PR:

```bash
npm run check
```

This runs:

- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

## Pull Request Checklist

- Explain what changed and why.
- Link related issue(s).
- Include screenshots for UI changes.
- Mention migrations, env var additions, or breaking changes.
- Add or update tests when behavior changes.

## Database Changes

When changing data shape or constraints:

- Add a new migration in `supabase/migrations` (never rewrite old migrations).
- Keep migrations deterministic and re-runnable.
- Document data impact in the PR description.

## Commit Style

No strict convention is required, but use clear imperative subjects.

Examples:

- `Fix review deck due-date badge logic`
- `Add onboarding hint for resources tab`
- `Refactor voice context route typing`

## Review Expectations

Maintainers prioritize:

- correctness and regression risk
- security and data safety
- API and schema compatibility
- test coverage for critical paths

## Need Help?

See [SUPPORT.md](./SUPPORT.md).
