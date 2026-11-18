#!/usr/bin/env node
/**
 * npm run e2e:up — the local, isolated stack the e2e suite runs against.
 *
 *   1. `supabase start --workdir e2e`: Docker stack on ports 554xx; then
 *      e2e/scripts/migrate.mjs applies supabase/migrations one by one (RLS
 *      lockdown included) and records what does not replay.
 *   2. One test user, created through the LOCAL admin API only. Email and a
 *      random password are generated once and kept in `.env.e2e.local`
 *      (git-ignored, mode 600); they are never printed.
 *   3. The lessons the owner studies, loaded with the repo's own seed tool
 *      (scripts/seed-lesson.ts) pointed at the local stack, drill audio
 *      uploaded to the local `lesson-audio` bucket.
 *
 * Safe by construction: every URL goes through assertLocalSupabase, and the
 * seed runs with e2e/server/net-guard.mjs preloaded, which refuses any
 * non-loopback request (the hosted project included) even if a stray env
 * file were read.
 *
 * Flags: --no-seed, --lessons <a.json,b.json>
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { E2E_DIR, E2E_HOME, ENV_FILE, NET_GUARD, REPO, APP_PORT, assertLocalSupabase, childEnv, parseEnvFile, writeEnvFile } from '../lib/env.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const LESSON_ROOT = join(os.homedir(), 'Desktop', 'demaria', '50-aprender', 'entrevistas');
/** The two lessons the owner uses now and one older one (different shape: no code tabs). */
export const DEFAULT_LESSONS = [
  join(LESSON_ROOT, '2026-11-3y-health-tecnica', 'leccion-3y-health-tecnica-v2.json'),
  join(LESSON_ROOT, '2026-11-3y-health-tecnica', 'repaso', 'leccion-3y-health-tecnica-repaso.json'),
  join(LESSON_ROOT, '2026-11-3y-health', 'leccion-3y-health.json'),
];

function supabase(args, opts = {}) {
  return execFileSync('supabase', [...args, '--workdir', E2E_DIR], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function step(msg) {
  console.log(`\n▸ ${msg}`);
}

// 1. Stack -------------------------------------------------------------------
step('Local Supabase (supabase start --workdir e2e)');
const start = spawnSync('supabase', ['start', '--workdir', E2E_DIR], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
if (start.status !== 0 && !/already running/i.test(start.stderr + start.stdout)) {
  console.error(start.stdout.slice(-4000), start.stderr.slice(-4000));
  process.exit(start.status ?? 1);
}
step('Migrations (e2e/scripts/migrate.mjs)');
const migrate = spawnSync(process.execPath, [join(E2E_DIR, 'scripts', 'migrate.mjs')], { cwd: REPO, stdio: 'inherit' });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

const status = Object.fromEntries(
  supabase(['status', '-o', 'env'])
    .split('\n')
    .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const url = status.API_URL;
assertLocalSupabase(url);
const publishable = status.PUBLISHABLE_KEY || status.ANON_KEY;
const secret = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
if (!publishable || !secret) throw new Error('supabase status gave no keys');
console.log(`  API ${url}`);

// 2. Test user ---------------------------------------------------------------
step('Test user (local admin API)');
const previous = parseEnvFile(ENV_FILE);
const email = previous.E2E_USER_EMAIL || `e2e-${randomBytes(4).toString('hex')}@jarre.test`;
const password = previous.E2E_USER_PASSWORD || randomBytes(18).toString('base64url');

async function admin(path, init = {}) {
  assertLocalSupabase(url);
  const res = await fetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`admin ${path}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

const listed = await admin('/users?per_page=200');
let user = (listed.users ?? []).find((u) => u.email === email);
if (user) {
  await admin(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ password, email_confirm: true }) });
  console.log('  existing test user, password reset to the stored one');
} else {
  user = await admin('/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: 'E2E Test' } }),
  });
  console.log('  test user created');
}

writeEnvFile(
  ENV_FILE,
  {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    SUPABASE_SECRET_KEY: secret,
    E2E_USER_EMAIL: email,
    E2E_USER_PASSWORD: password,
    E2E_USER_ID: user.id,
    ALLOWED_USER_IDS: user.id,
    E2E_APP_PORT: String(APP_PORT),
  },
  '# Written by `npm run e2e:up`. LOCAL Supabase stack only (e2e/supabase/config.toml). Git-ignored. Never commit, never paste.',
);
console.log(`  credentials stored in ${ENV_FILE} (not printed)`);

// 3. Lessons -----------------------------------------------------------------
if (!flag('--no-seed')) {
  const lessons = opt('--lessons')?.split(',') ?? DEFAULT_LESSONS;
  const env = parseEnvFile(ENV_FILE);
  // seed-lesson.ts reads `.env.local` from its cwd (override): give it a cwd
  // whose only `.env.local` is the local one.
  const seedCwd = join(E2E_HOME, 'seed-cwd');
  mkdirSync(seedCwd, { recursive: true });
  // The coding verifier's worker preloads `tsx/cjs`, resolved from the cwd.
  if (!existsSync(join(seedCwd, 'node_modules'))) symlinkSync(join(REPO, 'node_modules'), join(seedCwd, 'node_modules'));
  writeFileSync(
    join(seedCwd, '.env.local'),
    `# e2e seed cwd: LOCAL stack only\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishable}\nSUPABASE_SECRET_KEY=${secret}\n`,
    { mode: 0o600 },
  );
  const tsx = join(REPO, 'node_modules', '.bin', 'tsx');
  for (const lesson of lessons) {
    step(`Seed ${lesson.split('/').pop()}`);
    if (!existsSync(lesson)) {
      console.warn(`  missing, skipped: ${lesson}`);
      continue;
    }
    const run = spawnSync(tsx, ['--tsconfig', join(REPO, 'tsconfig.json'), '--import', NET_GUARD, join(REPO, 'scripts', 'seed-lesson.ts'), lesson, '--user', user.id], {
      cwd: seedCwd,
      env: childEnv(env, { NODE_OPTIONS: process.env.NODE_OPTIONS ?? '' }),
      stdio: 'inherit',
    });
    if (run.status !== 0) {
      console.error(`  seed failed (${run.status}) for ${lesson}`);
      process.exit(run.status ?? 1);
    }
  }
}

console.log('\nReady. Next: `npm run e2e:local` (builds and serves the app on :' + APP_PORT + ', runs the suite). Stop everything: `npm run e2e:down`.');
