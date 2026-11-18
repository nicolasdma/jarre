#!/usr/bin/env node
/**
 * Applies supabase/migrations to the LOCAL e2e database, one file at a time.
 *
 * The migrations do not replay on an empty database: since 2026-02-15 some
 * insert curriculum rows that reference concepts only the hosted project has
 * (e.g. 20260215010000_paper_concepts.sql → concept_prerequisites →
 * 'tail-latency'). So each file runs in one transaction first; if that
 * fails it runs again statement by statement (psql ON_ERROR_STOP=0, the
 * file's own BEGIN/COMMIT removed), keeping
 * every statement that works, and the failures are written to
 * e2e/report/migrations.json. A DDL failure there is a real schema gap; an
 * FK/unique violation on an INSERT is missing curriculum data the e2e lessons
 * do not need.
 *
 * Runs psql inside the stack's own db container; never takes a URL.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../lib/env.mjs';

const CONTAINER = 'supabase_db_jarre-e2e';
const DIR = join(REPO, 'supabase', 'migrations');

function psql(sql, { singleTransaction }) {
  const args = ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-v', `ON_ERROR_STOP=${singleTransaction ? 1 : 0}`];
  if (singleTransaction) args.push('--single-transaction');
  return spawnSync('docker', args, { input: sql, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const quote = (s) => `'${String(s).replace(/'/g, "''")}'`;

const running = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' });
if (!running.split('\n').includes(CONTAINER)) throw new Error(`${CONTAINER} is not running: start the stack first (npm run e2e:up)`);

// Track what ran, like the CLI does, so a second e2e:up skips applied files.
psql(
  'CREATE SCHEMA IF NOT EXISTS e2e; CREATE TABLE IF NOT EXISTS e2e.applied_migrations (name text PRIMARY KEY, partial boolean NOT NULL, errors jsonb NOT NULL DEFAULT \'[]\', applied_at timestamptz NOT NULL DEFAULT now());',
  { singleTransaction: true },
);
const done = new Set(
  psql('COPY (SELECT name FROM e2e.applied_migrations) TO STDOUT;', { singleTransaction: true })
    .stdout.split('\n')
    .filter(Boolean),
);

const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const report = { at: new Date().toISOString(), total: files.length, clean: 0, partial: [], skipped: done.size };
for (const file of files) {
  if (done.has(file)) continue;
  const sql = readFileSync(join(DIR, file), 'utf8');
  const first = psql(sql, { singleTransaction: true });
  if (first.status === 0) {
    report.clean++;
    psql(`INSERT INTO e2e.applied_migrations (name, partial) VALUES (${quote(file)}, false);`, { singleTransaction: true });
    continue;
  }
  // Second pass: statement by statement. A file's own BEGIN/COMMIT would make
  // one failed INSERT abort the DDL around it (and cascade into every later
  // migration), so they are dropped for this pass.
  const second = psql(sql.replace(/^\s*(BEGIN|COMMIT)\s*;\s*$/gim, ''), { singleTransaction: false });
  const errors = (second.stderr || '')
    .split('\n')
    .filter((l) => /ERROR:/.test(l))
    .map((l) => l.replace(/^psql:[^:]*:\d+:\s*/, '').trim());
  report.partial.push({ file, errors });
  console.log(`  partial  ${file}: ${errors.length} statement(s) failed; first: ${errors[0] ?? '(none reported)'}`);
  psql(`INSERT INTO e2e.applied_migrations (name, partial, errors) VALUES (${quote(file)}, true, ${quote(JSON.stringify(errors))}::jsonb);`, {
    singleTransaction: true,
  });
}
// PostgREST caches the schema it saw at boot: make it read the migrated one.
psql("NOTIFY pgrst, 'reload schema';", { singleTransaction: true });

// The report always lists every partial file, also the ones a previous run applied.
const rows = psql("COPY (SELECT name, errors::text FROM e2e.applied_migrations WHERE partial ORDER BY name) TO STDOUT WITH (FORMAT csv);", { singleTransaction: true });
report.partialAll = rows.stdout
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const comma = line.indexOf(',');
    const raw = line.slice(comma + 1).replace(/^"|"$/g, '').replace(/""/g, '"');
    return { file: line.slice(0, comma), errors: JSON.parse(raw) };
  });

const outDir = join(REPO, 'e2e', 'report');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'migrations.json'), JSON.stringify(report, null, 2));
console.log(
  `  migrations: ${report.clean} clean, ${report.partial.length} partial, ${report.skipped} already applied; ${report.partialAll.length} partial in total (e2e/report/migrations.json)`,
);
