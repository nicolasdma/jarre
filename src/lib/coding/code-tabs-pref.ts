/**
 * The reader's JS | TS choice, remembered for the session so every code
 * surface (the lesson's CodeTabs, the feed's code card) opens on the same one.
 * JS is the default: the owner reads plain JS first. Kept free of the
 * transpiler so importing it costs nothing.
 */

export type CodeVariant = 'js' | 'ts';

const PREF_KEY = 'jarre.codeTabs.pref';

export function readCodeVariantPref(): CodeVariant {
  try {
    const v = sessionStorage.getItem(PREF_KEY);
    if (v === 'js' || v === 'ts') return v;
  } catch {
    /* sessionStorage can throw in private mode; default to JS */
  }
  return 'js';
}

export function writeCodeVariantPref(v: CodeVariant): void {
  try {
    sessionStorage.setItem(PREF_KEY, v);
  } catch {
    /* ignore */
  }
}
