/**
 * The languages of the coding pad, as on CoderPad: TypeScript, JavaScript and
 * Python, one picker over the same problem. The lesson writes each problem
 * once, in TypeScript (starter, tests, solution); the other languages are
 * derived from it so they never drift:
 *
 * - JavaScript: the starter with its types stripped (./to-js.ts). It runs in
 *   the same worker as TypeScript (Sucrase accepts plain JS).
 * - Python: a stub generated from the starter's signature (`def twoSum(nums:
 *   list[int], target: int) -> tuple[int, int]:`), or the lesson's own
 *   `starters.python`. It runs on Pyodide (./run-python.ts) against the same
 *   TypeScript tests (./python-run.ts bridges the values). A starter that is
 *   more than a signature (a debugging exercise, say) has no generated stub:
 *   that problem is TypeScript and JavaScript only, unless the lesson writes one.
 *
 * This module is the names only (cheap to import anywhere); the starters
 * are ./starters.ts, which pulls in the type stripper.
 */

export const CODE_LANGUAGES = ['typescript', 'javascript', 'python'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python 3',
};

export function isCodeLanguage(v: unknown): v is CodeLanguage {
  return typeof v === 'string' && (CODE_LANGUAGES as readonly string[]).includes(v);
}

