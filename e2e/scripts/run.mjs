#!/usr/bin/env node
/**
 * npm run e2e:local -- [--reuse-server] [--keep-server] [--keep-state] [--viewports desktop,mobile] [--round N] [-- <playwright args>]
 *
 * 1. Checks the local Supabase stack (`npm run e2e:up` first).
 * 2. Copies the working tree, rebuilds if anything changed, serves it on :3117.
 * 3. Resets the test user's learner state (local DB), then runs the walk once per viewport (desktop-1440, then mobile-390), each in
 *    its own Playwright invocation: logout revokes every session of the user.
 * 4. Writes e2e/report/latest.json (+ screenshots in
 *    ~/Desktop/_revisar/jarre-loop/round-<N>/) and stops the app server.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { E2E_DIR, REPO, loadE2eEnv } from '../lib/env.mjs';
import { APP_DIR, BASE_URL, buildApp, isUp, startServer, stopServer, syncApp } from '../lib/server.mjs';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const own = sep >= 0 ? argv.slice(0, sep) : argv;
const passthrough = sep >= 0 ? argv.slice(sep + 1) : [];
const has = (f) => own.includes(f);
const opt = (f, d) => {
  const i = own.indexOf(f);
  return i >= 0 ? own[i + 1] : d;
};

const env = loadE2eEnv();
const health = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } }).catch(() => null);
if (!health?.ok) {
  console.error(`Local Supabase is not answering at ${env.NEXT_PUBLIC_SUPABASE_URL}: run \`npm run e2e:up\`.`);
  process.exit(1);
}

console.log(`load average: ${os.loadavg().map((n) => n.toFixed(1)).join(' ')} (${os.cpus().length} cpus)`);
if (!(has('--reuse-server') && (await isUp()))) {
  await stopServer();
  const changed = syncApp();
  const built = existsSync(join(APP_DIR, '.e2e-built-at'));
  if (changed > 0 || !built || has('--build')) {
    console.log(`building the app copy (${changed} paths changed)…`);
    const ms = buildApp();
    console.log(`built in ${(ms / 1000).toFixed(0)} s`);
  }
  await startServer();
}
console.log(`app: ${BASE_URL}`);

// Every run starts from the same learner state: what a previous run answered
// (quizzes, before-reading questions, step progress, evaluations, voice
// sessions, XP) is wiped for the test user, in the LOCAL database only.
// Enrolled cards and concept progress come from the seed (`npm run e2e:up`).
const RUN_STATE_TABLES = [
  'learn_progress', 'evaluations', 'exercise_results', 'voice_sessions', 'xp_events', 'token_usage', 'consumption_log',
  'mastery_history', 'section_annotations', 'section_notes', 'user_notes', 'resource_notes', 'flagged_questions',
  'insight_suggestions', 'learner_concept_memory',
];
function resetLearnerState() {
  if (has('--keep-state')) return;
  if (!/^[0-9a-f-]{36}$/.test(env.E2E_USER_ID)) throw new Error('E2E_USER_ID is not a uuid');
  const sql = RUN_STATE_TABLES.map((t) => `DELETE FROM public.${t} WHERE user_id = '${env.E2E_USER_ID}';`).join('\n');
  const r = spawnSync('docker', ['exec', '-i', 'supabase_db_jarre-e2e', 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-v', 'ON_ERROR_STOP=0'], { input: sql, encoding: 'utf8' });
  console.log(`learner state reset for the test user${r.stderr.trim() ? ` (${r.stderr.trim().split('\n').length} warnings)` : ''}`);
}

const reportDir = join(E2E_DIR, 'report');
rmSync(join(reportDir, 'raw'), { recursive: true, force: true });
rmSync(join(reportDir, 'run-meta.json'), { force: true });

const projects = { desktop: 'desktop-1440', mobile: 'mobile-390' };
const viewports = opt('--viewports', 'desktop,mobile').split(',');
let worst = 0;
for (const [i, v] of viewports.entries()) {
  const project = projects[v] ?? v;
  console.log(`\n▸ ${project}`);
  resetLearnerState(); // each viewport starts from the same state
  if (!(await isUp())) {
    console.log('app server was down: starting it again');
    await startServer();
  }
  const r = spawnSync(join(REPO, 'node_modules', '.bin', 'playwright'), ['test', '-c', join(E2E_DIR, 'playwright.config.ts'), `--project=${project}`, ...passthrough], {
    cwd: REPO,
    stdio: 'inherit',
    env: { ...process.env, E2E_ROUND: opt('--round', process.env.E2E_ROUND ?? '0'), E2E_KEEP_META: i > 0 ? '1' : '0' },
  });
  worst = Math.max(worst, r.status ?? 1);
}

if (!has('--keep-server')) {
  await stopServer();
  console.log('app server stopped (local Supabase stays up: `npm run e2e:down` stops it)');
}
const latest = join(reportDir, 'latest.json');
if (existsSync(latest)) {
  const { totals } = JSON.parse(readFileSync(latest, 'utf8'));
  console.log(`\nreport: ${latest}\n${JSON.stringify(totals)}`);
}
process.exit(worst);
