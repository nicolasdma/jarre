# e2e: the local audit harness

A fully local copy of Jarre (its own Supabase in Docker, its own test user,
the real lessons) and a Playwright walk that clicks every screen and button
of the main flows, measuring each step. It exists so the "audit → fix →
verify" loop can test the logged-in app without touching production.

## Run it

```sh
npm run e2e:up      # local Supabase + migrations + test user + lessons (idempotent)
npm run e2e:local   # build the working tree, serve it on :3117, walk it (desktop, then phone)
npm run e2e:down    # stop the app server and the local Supabase stack (data stays in its Docker volume)
```

- `npm run e2e:local -- --reuse-server --keep-server` keeps a running app
  between rounds (no rebuild); `--viewports desktop` runs one viewport;
  `--round 3` writes screenshots to `round-3/`; anything after a second `--`
  goes to Playwright (`-- -g "feed"` runs one flow).
- `npm run e2e:server` (re)builds and serves the app alone; `-- --stop` stops it.
- `supabase stop --no-backup --workdir e2e` throws the local database away;
  the next `e2e:up` rebuilds it from scratch (about 2 minutes, plus image pulls
  the first time).

Output:

- `e2e/report/latest.json`: one record per step (`steps`) and the ranked
  problems (`problems`: broken steps, buttons that errored, console errors,
  failed requests, slowest interactions, heaviest pages, LCP, layout shift,
  long tasks, server calls the mocks answered). Also copied next to the
  screenshots as `report.json`.
- Screenshots: `~/Desktop/_revisar/jarre-loop/round-<N>/<project>--<flow>--<step>.png`
  (1440x900 and 390x844).
- `e2e/report/migrations.json`: which migrations did not replay cleanly (below).
- `e2e/report/artifacts/`: Playwright traces of failed tests (`npx playwright show-trace …`).

## What is isolated, and how

| Risk | Guard |
| --- | --- |
| Writing to the hosted Supabase (shared by local dev and production) | `.env.e2e.local` is written from `supabase status` of the local stack; `e2e/lib/env.mjs` refuses any Supabase URL that is not loopback. The app is built and served from a copy of the working tree in `~/.cache/jarre-e2e/app` that never receives a `.env*` file, and every secret the real `.env.local` sets is overridden in the process env. |
| Server-side calls to DeepSeek, Gemini, DeepL, YouTube | `e2e/server/net-guard.mjs` is preloaded into the seed tool, `next build` and `next start`: loopback passes, DeepSeek / the Gemini Live token / DeepL get canned answers (`e2e/mocks/`), YouTube thumbnails a placeholder PNG, Google Fonts pass (build time), anything else throws. Every non-loopback call goes to `~/.cache/jarre-e2e/net-guard.log`. |
| Browser calls to Gemini Live, YouTube, CDNs | Chrome runs with `--host-resolver-rules` that resolve only loopback. The Gemini Live socket is answered by `routeWebSocket` (setup completes, nothing is said). Web Speech is a fake recognizer. Blocked requests are listed per step as `blockedExternal`, not as failures. |
| The owner's dev server, other harnesses | The harness uses port 3117 and refuses 3005 (the owner's `next dev`). Not 3107: `scripts/perf/measure-learn.mjs` serves there, and a run on 2026-11-18 lost its server mid-walk while sharing it. It never builds in the repo's `.next`. |
| Other local Supabase stacks | Ports 55420-55429 (`e2e/supabase/config.toml`), project id `jarre-e2e`. The workdir is `e2e/`, so the CLI never sees the link to the hosted project in `supabase/.temp`. |

The test user (random email and password) exists only in the local auth
database. Its credentials live in `.env.e2e.local` (git-ignored, mode 600) and
are never printed. `ALLOWED_USER_IDS` for the local app is that user only.

## The local database

`supabase start` runs with CLI migrations off; `e2e/scripts/migrate.mjs`
applies `supabase/migrations` one file at a time. The migrations do not replay
from an empty database: since 2026-02-15 some insert curriculum rows that
reference concepts only the hosted project has. A file that fails in one
transaction is re-run statement by statement (its own BEGIN/COMMIT dropped),
and what failed is recorded in `e2e/report/migrations.json`. On 2026-11-18:
98 clean, 12 partial, all of them data (FK violations on curriculum inserts,
and `legacy_curricula` that never existed); every schema change, the RLS
lockdown included, applied.

Lessons: `scripts/seed-lesson.ts` (the repo's own tool) with `--user <test
user>`, run with a cwd whose only `.env.local` points at the local stack.
Defaults: `3y-health-tecnica-v2`, `3y-health-tecnica-repaso` and the older
`3y-health`, read from `~/Desktop/demaria/50-aprender/entrevistas/`. Every
drill audio file the lessons have on disk is uploaded to the local
`lesson-audio` bucket (about 40 MB; drills without a file have no audio, as in
production). `npm run e2e:up -- --lessons a.json,b.json` seeds others;
`--no-seed` skips seeding.

## Mocks

- DeepSeek: `e2e/mocks/deepseek.mjs`, one rule per prompt (matched on the
  system prompt). An unmatched call answers `{}` and is listed in
  `problems.serverCalls` with rule `default`: add a rule when a flow needs a
  real-looking answer.
- Gemini Live: the token route mints nothing (the guard answers the token
  request); the browser socket is mocked in `e2e/tests/harness.ts`.
- Speech recognition: `installFakeRecognizer` in `e2e/tests/harness.ts`
  "hears" `window.__e2eHeard` (or a default line) word by word.

## State between runs

`e2e:local` wipes the test user's learner state (step progress, answered
quizzes and before-reading questions, evaluations, voice sessions, XP; list
in `e2e/scripts/run.mjs`) before each viewport, so both start from the same
place. Enrolled cards and concept progress come from the seed: re-run
`npm run e2e:up` to restore them. `--keep-state` skips the wipe.

The walk tests the working tree as it is, other people's uncommitted work
included (`report.meta.dirtyFiles` lists it). When a control changes shape the
walk prefers stable contracts (deep links like `?step=practice&mode=recall`,
accessible names, `data-testid`) and records a `note` instead of failing when
an optional control is simply gone.

## Adding to the walk

`e2e/tests/walk.spec.ts`. Wrap each action in `walk.step(name, fn)`; click
through `walk.tap(locator, label)` so the click is timed; use
`walk.sweep(region)` to click every button of a region once. A failing step
does not stop the flow; the test fails at the end listing the broken steps.
Never sweep data-destroying controls: `SWEEP_DENY` in `harness.ts` lists what
a sweep never clicks.
