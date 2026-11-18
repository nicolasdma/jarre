/**
 * TypeScript → plain JavaScript for *reading*, by stripping types only.
 *
 * The owner reads plain JS fastest to understand a concept; TypeScript is one
 * click away for the interview. So every code snippet in a lesson can show two
 * tabs, JS and TS, and the JS must be GENERATED from the TS (never hand-written)
 * so the two never drift. The TS is the single source of truth.
 *
 * We use Sucrase's `typescript` transform: a surgical, token-level strip (no
 * type checking, no AST re-print), which keeps the logic and the formatting
 * intact — `const`/`let`, arrow functions, `Map`/`Set`, blank lines and
 * comments all survive; only the types leave:
 *   - annotations on params, returns and variables (`: Type`)
 *   - generics (`new Map<string, string[]>()` → `new Map()`)
 *   - `as` casts, `satisfies`, non-null `!`
 *   - `interface` / `type` declarations
 *
 * `disableESTransforms` keeps `import`/`export` as-is (no CommonJS rewrite):
 * `export function groupAnagrams(...)` stays `export function groupAnagrams(...)`.
 *
 * The same contract is exercised by src/lib/coding/to-js.test.ts.
 */

import { transform } from 'sucrase';

/** Generated JS is cached by exact source string: the snippets are static, so this never grows unbounded in practice and renders stay free. */
const cache = new Map<string, string>();

/**
 * Light cosmetic tidy after a strip: removing an `interface`/`type` line or an
 * `as` cast leaves a blank line or a stray space (Sucrase preserves line
 * numbers for source maps). We only touch whitespace, never tokens, so the
 * logic is untouched and the result still reads as "the TS with types removed".
 */
function tidy(js: string): string {
  return js
    .replace(/[ \t]+$/gm, '') // trailing whitespace on a line
    .replace(/\n{3,}/g, '\n\n') // at most one blank line in a row
    .replace(/^\s*\n/, '') // a leading blank line (left by a stripped top declaration)
    .replace(/\s+$/, '\n'); // a single trailing newline
}

/**
 * Strip the types from a TypeScript snippet and return readable JavaScript.
 * Returns `null` when the snippet is not valid TypeScript (the caller then
 * shows the original with no tabs rather than crashing).
 */
export function tsToJs(ts: string): string | null {
  const hit = cache.get(ts);
  if (hit !== undefined) return hit;
  try {
    const { code } = transform(ts, {
      transforms: ['typescript'],
      disableESTransforms: true,
      preserveDynamicImport: true,
    });
    const js = tidy(code);
    cache.set(ts, js);
    return js;
  } catch {
    return null;
  }
}

/** Exported for tests: clear the memo between cases. */
export function _clearToJsCache(): void {
  cache.clear();
}
