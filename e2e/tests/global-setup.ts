import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadE2eEnv, isLoopbackUrl } from '../lib/env.mjs';
import { RAW_DIR, REPORT_DIR, ROUND, SHOTS_DIR } from './paths';

export default async function globalSetup() {
  const env = loadE2eEnv(); // throws unless .env.e2e.local points at a loopback Supabase
  const base = `http://127.0.0.1:${env.E2E_APP_PORT ?? 3107}`;
  if (!isLoopbackUrl(base)) throw new Error('e2e guard: app URL must be loopback');
  const res = await fetch(`${base}/login`, { redirect: 'manual' }).catch(() => null);
  if (!res) throw new Error(`No app on ${base}: run \`npm run e2e:server\` (or \`npm run e2e:local\`, which starts it).`);

  // report/raw is cleared by e2e/scripts/run.mjs once per run (it runs one invocation per viewport).
  mkdirSync(RAW_DIR, { recursive: true });
  mkdirSync(SHOTS_DIR, { recursive: true });
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const git = (args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  if (existsSync(join(REPORT_DIR, 'run-meta.json')) && process.env.E2E_KEEP_META === '1') return;
  writeFileSync(
    join(REPORT_DIR, 'run-meta.json'),
    JSON.stringify(
      {
        round: ROUND,
        startedAt: new Date().toISOString(),
        baseUrl: base,
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
        gitHead: git(['rev-parse', '--short', 'HEAD']),
        dirtyFiles: git(['status', '--porcelain']).split('\n').filter(Boolean),
        loadAverage: os.loadavg().map((n) => Number(n.toFixed(2))),
        cpus: os.cpus().length,
        shotsDir: SHOTS_DIR,
      },
      null,
      2,
    ),
  );
  process.env.E2E_USER_EMAIL = env.E2E_USER_EMAIL;
  process.env.E2E_USER_PASSWORD = env.E2E_USER_PASSWORD;
}
