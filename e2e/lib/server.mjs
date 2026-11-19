/**
 * The app the suite runs against: a production build of the CURRENT WORKING
 * TREE, copied to $JARRE_E2E_HOME/app (default ~/.cache/jarre-e2e/app) and
 * served by `next start` on E2E_APP_PORT (3117).
 *
 * Why a copy: building in the repo would share `.next` with the owner's dev
 * server (port 3005) and let Next load the real `.env.local`. The copy never
 * gets any `.env*` file; its env comes only from childEnv() (local Supabase,
 * fake model keys, net guard preloaded). node_modules is an APFS clone of the
 * repo's (copy-on-write, refreshed when package-lock.json changes).
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_PORT, E2E_HOME, REPO, RESERVED_PORTS, childEnv, loadE2eEnv } from './env.mjs';

export const APP_DIR = join(E2E_HOME, 'app');
const PID_FILE = join(E2E_HOME, 'server.pid');
export const SERVER_LOG = join(E2E_HOME, 'server.log');
export const BASE_URL = `http://127.0.0.1:${APP_PORT}`;

const RSYNC_EXCLUDES = [
  '.git', 'node_modules', '.next', '.next-*', '.env', '.env.*', '.vercel', '.claude',
  'e2e/report', 'tsconfig.tsbuildinfo', 'scripts/output', 'engine/data', 'test-results', 'playwright-report',
];

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

/** rsync the working tree into the app copy; returns the number of changed paths. */
export function syncApp() {
  if (RESERVED_PORTS.has(APP_PORT)) throw new Error(`E2E_APP_PORT ${APP_PORT} is reserved (owner's dev server)`);
  mkdirSync(APP_DIR, { recursive: true });
  const out = sh('rsync', ['-a', '--delete', '--itemize-changes', ...RSYNC_EXCLUDES.flatMap((e) => ['--exclude', e]), `${REPO}/`, `${APP_DIR}/`]);
  for (const leaked of ['.env.local', '.env', '.env.production.local']) {
    if (existsSync(join(APP_DIR, leaked))) throw new Error(`e2e guard: ${leaked} reached the app copy`);
  }
  const lockHash = createHash('sha1').update(readFileSync(join(REPO, 'package-lock.json'))).digest('hex');
  const stamp = join(APP_DIR, '.e2e-node-modules');
  if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== lockHash) {
    rmSync(join(APP_DIR, 'node_modules'), { recursive: true, force: true });
    // -c: APFS clonefile, copy-on-write (fast, no extra space until written).
    sh('cp', ['-cR', join(REPO, 'node_modules'), join(APP_DIR, 'node_modules')]);
    writeFileSync(stamp, lockHash);
  }
  return out.split('\n').filter((l) => l && !l.startsWith('.d..t')).length;
}

export function buildApp() {
  const env = loadE2eEnv();
  rmSync(join(APP_DIR, '.next'), { recursive: true, force: true });
  const t0 = Date.now();
  const r = spawnSync(join(APP_DIR, 'node_modules', '.bin', 'next'), ['build'], {
    cwd: APP_DIR,
    env: childEnv(env, { NODE_ENV: 'production' }),
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error(`next build failed (${r.status})`);
  writeFileSync(join(APP_DIR, '.e2e-built-at'), new Date().toISOString());
  return Date.now() - t0;
}

export async function isUp(url = `${BASE_URL}/login`) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    return res.status > 0;
  } catch {
    return false;
  }
}

export async function startServer() {
  if (await isUp()) return { reused: true };
  const env = loadE2eEnv();
  mkdirSync(E2E_HOME, { recursive: true });
  const logFd = openSync(SERVER_LOG, 'a');
  const child = spawn(join(APP_DIR, 'node_modules', '.bin', 'next'), ['start', '-p', String(APP_PORT), '-H', '127.0.0.1'], {
    cwd: APP_DIR,
    env: childEnv(env, { NODE_ENV: 'production' }),
    stdio: ['ignore', logFd, logFd],
    detached: true,
  });
  child.unref();
  writeFileSync(PID_FILE, String(child.pid));
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await isUp()) return { reused: false, pid: child.pid };
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`app did not come up on ${BASE_URL} (log: ${SERVER_LOG})`);
}

export async function stopServer() {
  if (existsSync(PID_FILE)) {
    const pid = Number(readFileSync(PID_FILE, 'utf8'));
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
    }
    rmSync(PID_FILE, { force: true });
  }
  // Anything else still on the harness port (never 3005).
  const r = spawnSync('lsof', ['-tiTCP:' + APP_PORT, '-sTCP:LISTEN'], { encoding: 'utf8' });
  for (const pid of r.stdout.split('\n').filter(Boolean)) {
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch {
      /* gone */
    }
  }
}
