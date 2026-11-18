/**
 * Which fenced-code languages get the JS | TS tabs, and how a markdown fence
 * className ("language-ts") maps to a language name.
 *
 * Kept free of any transpiler import on purpose: the shared markdown renderer
 * imports this to decide whether a block is TypeScript, without pulling the
 * Sucrase transform (and its weight) into every lesson's bundle. The transform
 * lives in ./to-js and loads only when the tabs actually render.
 */

/** Fence languages we treat as TypeScript, i.e. the ones we can strip to JS. */
export const TS_DISPLAY_LANGS = new Set(['ts', 'typescript']);

/** Pull the language out of a markdown code className, e.g. "language-ts" → "ts". */
export function langFromClassName(className: string | undefined): string | undefined {
  if (!className) return undefined;
  const match = /language-([\w-]+)/.exec(className);
  return match ? match[1].toLowerCase() : undefined;
}

/** True when a block in this language can be shown as JS (generated) + TS. */
export function isTsDisplayLang(lang: string | undefined): boolean {
  return !!lang && TS_DISPLAY_LANGS.has(lang.toLowerCase());
}
