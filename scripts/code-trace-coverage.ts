/**
 * Which coding problems of a lesson have a step-by-step trace ("Ver paso a paso").
 *
 *   npx tsx scripts/code-trace-coverage.ts <lesson.json> [<lesson.json> …]
 *
 * For each problem in interview.coding.problems: traced (the registry has a
 * generator for this exact solution code), drift (a generator with this id
 * exists but the lesson's code changed, so the button stays hidden), or none.
 * Also prints the fingerprint each generator file should have in the registry.
 * Exit code 1 when any traced id drifted.
 */

import { readFileSync } from 'node:fs';
import { TRACE_INDEX, findTrace } from '../src/lib/code-trace/registry';
import { codeFingerprint } from '../src/lib/code-trace/fingerprint';

interface LessonProblem {
  id: string;
  pattern: string;
  solution: { code: string };
}

async function main(): Promise<void> {
  const files = process.argv.slice(2);
  let drift = 0;

  for (const entry of TRACE_INDEX) {
    const def = (await entry.load()).default;
    const fp = codeFingerprint(def.code);
    if (fp !== entry.fp) console.log(`registry: ${entry.id} fp should be '${fp}' (is '${entry.fp}')`);
  }

  for (const file of files) {
    const lesson = JSON.parse(readFileSync(file, 'utf8')) as { id: string; interview?: { coding?: { problems?: LessonProblem[] } } };
    const problems = lesson.interview?.coding?.problems ?? [];
    const ids = new Set(TRACE_INDEX.map((e) => e.id));
    const patterns = new Map<string, { traced: number; total: number }>();
    let traced = 0;
    console.log(`\n${lesson.id}: ${problems.length} problems`);
    for (const p of problems) {
      const hit = findTrace(p.solution.code);
      const state = hit ? 'traced' : ids.has(p.id) ? 'DRIFT' : 'none';
      if (hit) traced++;
      if (state === 'DRIFT') drift++;
      const pat = patterns.get(p.pattern) ?? { traced: 0, total: 0 };
      pat.total++;
      if (hit) pat.traced++;
      patterns.set(p.pattern, pat);
      console.log(`  ${state.padEnd(6)} ${p.id}  (${p.pattern})`);
    }
    const coveredPatterns = [...patterns.values()].filter((v) => v.traced > 0).length;
    console.log(`  → ${traced}/${problems.length} problems, ${coveredPatterns}/${patterns.size} patterns`);
  }
  if (drift) process.exitCode = 1;
}

void main();
