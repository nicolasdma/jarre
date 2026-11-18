/**
 * The decision behind a code block: does it get JS | TS tabs, and what does
 * each tab show. Pure and transpiler-aware; the React component (code-tabs.tsx)
 * is a thin shell over this, and src/lib/coding/to-js.test.ts checks it.
 */

import { isTsDisplayLang } from './code-lang';
import { tsToJs } from './to-js';

export interface CodeTabsModel {
  /** Show two tabs (JS default, TS one click away) vs a single code block. */
  tabs: boolean;
  /** The TypeScript source, as authored. */
  ts: string;
  /** The generated JavaScript, or null when there is nothing to strip / it is not TS. */
  js: string | null;
}

/** Trim only outer blank space so a block and its generated twin compare cleanly. */
function trimEdges(code: string): string {
  return code.replace(/^\n+/, '').replace(/\s+$/, '');
}

/**
 * Decide the variants for one snippet.
 * - Not a TypeScript language → single block, no tabs.
 * - TypeScript, but nothing changed once types are stripped (already plain JS)
 *   → single block, no tabs.
 * - TypeScript with types → two tabs.
 */
export function codeTabsModel(code: string, lang?: string): CodeTabsModel {
  const ts = trimEdges(code);
  if (!isTsDisplayLang(lang)) return { tabs: false, ts, js: null };
  const generated = tsToJs(code);
  if (generated == null) return { tabs: false, ts, js: null };
  const js = trimEdges(generated);
  return { tabs: js !== ts, ts, js };
}
