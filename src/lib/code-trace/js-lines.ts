/**
 * The JS | TS views of a traced solution, with a map from each TypeScript line
 * to the line it becomes in the JavaScript view, so the highlighted line is
 * the same statement whichever tab is open.
 *
 * Sucrase's TypeScript transform strips types token by token and keeps line
 * numbers (it is built for source maps). Lines that were only types (an
 * `interface`, a `type` alias) come out blank; we drop exactly those, so the JS
 * reads like src/lib/coding/to-js.ts's output, and remap the rest.
 */

import { transform } from 'sucrase';

export interface CodeViews {
  ts: string[];
  /** null when the code could not be transformed: the trace shows TS only. */
  js: string[] | null;
  /** tsLine (1-based) → jsLine (1-based); a dropped line maps to the next kept one. */
  tsToJs: (line: number) => number;
}

export function codeViews(ts: string): CodeViews {
  const tsLines = ts.split('\n');
  let raw: string[];
  try {
    raw = transform(ts, { transforms: ['typescript'], disableESTransforms: true }).code.split('\n');
  } catch {
    return { ts: tsLines, js: null, tsToJs: (l) => l };
  }
  if (raw.length < tsLines.length) return { ts: tsLines, js: null, tsToJs: (l) => l };

  const js: string[] = [];
  const map: number[] = []; // index: ts line - 1 → js line (1-based), 0 = dropped
  tsLines.forEach((tsLine, i) => {
    const out = (raw[i] ?? '').replace(/\s+$/, '');
    const dropped = out.trim() === '' && tsLine.trim() !== '';
    const leadingBlank = out.trim() === '' && js.length === 0;
    if (dropped || leadingBlank) {
      map.push(0);
      return;
    }
    js.push(out);
    map.push(js.length);
  });
  const same = js.length === tsLines.length && js.every((l, i) => l === tsLines[i].replace(/\s+$/, ''));
  const tsToJs = (line: number): number => {
    for (let i = line - 1; i < map.length; i++) if (map[i] > 0) return map[i];
    return js.length;
  };
  return { ts: tsLines, js: same ? null : js, tsToJs };
}
