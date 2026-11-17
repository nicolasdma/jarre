#!/usr/bin/env tsx
/**
 * Verify a lesson's coding round before seeding it:
 *
 *   npx tsx scripts/verify-coding.ts <lesson.json> [--only <problem-id>]
 *
 * Every reference solution must pass its example and hidden tests, and the
 * mock's starter and every exercise starter must compile and fail at least
 * one test. Runs each check in a worker thread with a timeout. Exit code 1 on
 * any problem. See src/lib/coding/verify.ts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LessonSchema } from '../src/lib/lessons/lesson-format';
import { verifyProblem } from '../src/lib/coding/verify';
import { runInThread } from './lib/coding-runner';

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npx tsx scripts/verify-coding.ts <lesson.json> [--only <problem-id>]');
  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx > 0 ? process.argv[onlyIdx + 1] : null;
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(resolve(file), 'utf8')));
  const coding = lesson.interview?.coding;
  if (!coding) {
    console.log('No coding round in this lesson.');
    return;
  }
  let failures = 0;
  for (const p of coding.problems) {
    if (only && p.id !== only) continue;
    const r = await verifyProblem(p, (req) => runInThread(req));
    const mark = r.problems.length ? 'FAIL' : 'ok  ';
    console.log(`${mark} ${p.id.padEnd(28)} solution ${r.solution.passed}/${r.solution.total} tests · ${p.exercises.length} exercises`);
    for (const issue of r.problems) console.log(`     - ${issue}`);
    if (r.problems.length) failures++;
  }
  if (failures) {
    console.error(`\n${failures} problem(s) failed verification.`);
    process.exit(1);
  }
  console.log('\nEvery coding problem verified.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
