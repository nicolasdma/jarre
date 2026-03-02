# Contributing to Jarre

Thanks for contributing.

## Ground Rules

- Keep pull requests focused and small.
- Prefer clear, incremental changes over broad refactors.
- Do not commit secrets, tokens, or `.env.local`.
- Update docs when behavior or setup changes.

## Development Setup

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

## Quality Checks

Run before opening a PR:

```bash
npm run check
```

This runs:

- `npm run lint`
- `npm run test`
- `npm run build`

## Pull Request Expectations

- Describe what changed and why.
- Link related issues.
- Include screenshots for UI changes.
- Mention any migrations, env var additions, or breaking changes.

## Commit Style

No strict convention is required, but use clear imperative subjects, for example:

- `Fix review deck due-date badge logic`
- `Add onboarding hint for resources tab`
- `Refactor voice context route typing`

## Areas with Known Debt

- Lint warnings exist in older modules.
- Some content-heavy pages intentionally relax strict JSX text rules.

Contributions that reduce this debt without breaking behavior are welcome.
