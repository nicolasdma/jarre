/**
 * The e2e harness environment: one git-ignored file, `.env.e2e.local`, written
 * by `npm run e2e:up` from the LOCAL Supabase stack (e2e/supabase/config.toml).
 *
 * Every script that talks to a database goes through `loadE2eEnv()`, which
 * refuses to return anything whose Supabase URL is not a loopback address.
 * The hosted Jarre project is shared by local dev and production: nothing in
 * this harness may ever reach it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const E2E_DIR = join(REPO, 'e2e');
export const ENV_FILE = join(REPO, '.env.e2e.local');
/** Where the app copy, the seed cwd and the server log live (outside the repo: no tsconfig/turbopack overlap). */
export const E2E_HOME = process.env.JARRE_E2E_HOME ?? join(os.homedir(), '.cache', 'jarre-e2e');
export const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3117);
export const SUPABASE_API_PORT = 55421;
/** Ports the harness never binds. */
export const RESERVED_PORTS = new Set([3005, 3107]); // owner's dev server; scripts/perf/measure-learn.mjs

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export function isLoopbackUrl(value) {
  try {
    return LOOPBACK.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function assertLocalSupabase(url) {
  if (!url || !isLoopbackUrl(url)) {
    throw new Error(`e2e guard: refusing Supabase URL ${JSON.stringify(url)}: the harness only talks to a local stack (127.0.0.1/localhost).`);
  }
  if (/supabase\.co|supabase\.in/i.test(url)) throw new Error(`e2e guard: hosted Supabase URL refused: ${url}`);
}

/** @returns {Record<string, string>} */
export function parseEnvFile(path) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

export function writeEnvFile(path, values, header) {
  const lines = [header, ...Object.entries(values).map(([k, v]) => `${k}=${v}`), ''];
  writeFileSync(path, lines.join('\n'), { mode: 0o600 });
}

/**
 * The harness env, guarded. Throws if `.env.e2e.local` is missing or not local.
 * @returns {Record<string, string>}
 */
export function loadE2eEnv() {
  if (!existsSync(ENV_FILE)) throw new Error(`${ENV_FILE} is missing: run \`npm run e2e:up\` first.`);
  const env = parseEnvFile(ENV_FILE);
  assertLocalSupabase(env.NEXT_PUBLIC_SUPABASE_URL);
  for (const key of ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'E2E_USER_EMAIL', 'E2E_USER_PASSWORD', 'E2E_USER_ID']) {
    if (!env[key]) throw new Error(`${ENV_FILE}: ${key} is missing: run \`npm run e2e:up\`.`);
  }
  return env;
}

/**
 * Variables the owner's `.env.local` sets. The app server gets every one of
 * them explicitly (process env wins over Next's .env loading), so nothing from
 * the real file can leak into a harness process even if it is read.
 */
export const SECRET_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_DB_PASSWORD',
  'DEEPSEEK_API_KEY',
  'KIMI_API_KEY',
  'GEMINI_API_KEY',
  'DEEPL_API_KEY',
  'YOUTUBE_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'VOICE_SESSION_TOKEN_SECRET',
];

export const NET_GUARD = join(E2E_DIR, 'server', 'net-guard.mjs');

/**
 * Process env for any harness child (seed, app server): local Supabase, fake model keys, net guard preloaded.
 */
export function childEnv(env, extra = {}) {
  // `extra.NODE_OPTIONS = ''` opts out of the preload through NODE_OPTIONS (the
  // caller then passes `--import NET_GUARD` itself): NODE_OPTIONS reaches
  // worker threads too, and an --import there makes Node load a `.ts` worker
  // entry as ESM (the seed's coding verifier breaks).
  const out = { ...process.env };
  for (const key of SECRET_VARS) out[key] = '';
  Object.assign(out, {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
    // Fake keys: every call is answered by e2e/server/net-guard.mjs, never by a provider.
    DEEPSEEK_API_KEY: 'e2e-fake-deepseek',
    GEMINI_API_KEY: 'e2e-fake-gemini',
    DEEPL_API_KEY: 'e2e-fake-deepl:fx',
    VOICE_SESSION_TOKEN_SECRET: 'e2e-voice-session-secret-0123456789abcdef',
    ALLOWED_USER_IDS: env.ALLOWED_USER_IDS ?? env.E2E_USER_ID,
    NEXT_TELEMETRY_DISABLED: '1',
    JARRE_E2E: '1',
    E2E_NET_LOG: join(E2E_HOME, 'net-guard.log'),
    NODE_OPTIONS: [process.env.NODE_OPTIONS ?? '', `--import=${NET_GUARD}`].join(' ').trim(),
    ...extra,
  });
  assertLocalSupabase(out.NEXT_PUBLIC_SUPABASE_URL);
  return out;
}
