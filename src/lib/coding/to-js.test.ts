import { describe, it, expect, beforeEach } from 'vitest';
import { tsToJs, _clearToJsCache } from './to-js';
import { codeTabsModel } from './code-tabs-model';
import { langFromClassName, isTsDisplayLang } from './code-lang';

beforeEach(() => _clearToJsCache());

// The owner's example: generics and annotations gone, everything else intact.
const GROUP_ANAGRAMS_TS = `export function groupAnagrams(strs: string[]): string[][] {
  const groupByKey = new Map<string, string[]>();
  for (const s of strs) {
    const key = [...s].sort().join('');
    const bucket = groupByKey.get(key) ?? [];
    bucket.push(s);
    groupByKey.set(key, bucket);
  }
  return [...groupByKey.values()];
}`;

const GROUP_ANAGRAMS_JS = `export function groupAnagrams(strs) {
  const groupByKey = new Map();
  for (const s of strs) {
    const key = [...s].sort().join('');
    const bucket = groupByKey.get(key) ?? [];
    bucket.push(s);
    groupByKey.set(key, bucket);
  }
  return [...groupByKey.values()];
}`;

describe('tsToJs — strip types only', () => {
  it('turns the groupAnagrams TS into exactly the TS with its types removed', () => {
    const js = tsToJs(GROUP_ANAGRAMS_TS);
    expect(js).not.toBeNull();
    expect(js!.trim()).toBe(GROUP_ANAGRAMS_JS);
    // the owner's headline case: the generic collapses to a bare constructor
    expect(js).toContain('new Map()');
    expect(js).not.toContain('<string');
    // and the ESM export is kept verbatim (no CommonJS rewrite)
    expect(js).toContain('export function groupAnagrams(strs) {');
  });

  it('keeps const/let, arrow functions and Set intact while dropping generics', () => {
    const ts = `export const firstId = <T extends { id: number }>(items: T[]): number | undefined => {
  const seen = new Set<number>();
  for (const it of items) {
    if (!seen.has(it.id)) { seen.add(it.id); return it.id; }
  }
  return undefined;
};`;
    const js = tsToJs(ts)!;
    expect(js).toContain('export const firstId = (items) => {');
    expect(js).toContain('const seen = new Set();');
    expect(js).toContain('seen.add(it.id)');
    expect(js).not.toContain('<T');
    expect(js).not.toContain(': T[]');
  });

  it('removes interface/type declarations and `as` casts without leaving a big gap', () => {
    const ts = `interface Account { id: string; balance: number }
type Money = number;

export function topUp(acc: Account, amount: Money): Account {
  const next = { ...acc, balance: acc.balance + amount } as Account;
  return next;
}`;
    const js = tsToJs(ts)!;
    expect(js).toContain('export function topUp(acc, amount) {');
    expect(js).toContain('const next = { ...acc, balance: acc.balance + amount }');
    expect(js).not.toContain('interface');
    expect(js).not.toMatch(/\btype Money\b/);
    expect(js).not.toContain(' as Account');
    expect(js).not.toContain(': Account');
    // the stripped top declarations must not leave a run of blank lines
    expect(js).not.toMatch(/\n\n\n/);
    expect(js.startsWith('\n')).toBe(false);
  });

  it('produces valid, equivalent JS: stripping again is a no-op (idempotent → parses)', () => {
    const js = tsToJs(GROUP_ANAGRAMS_TS)!;
    expect(tsToJs(js)!.trim()).toBe(js.trim());
  });

  it('returns null for code that is not valid TypeScript', () => {
    expect(tsToJs('function (')).toBeNull();
  });
});

describe('codeTabsModel — when to show tabs', () => {
  it('TypeScript with types → two tabs, JS generated and different from TS', () => {
    const m = codeTabsModel(GROUP_ANAGRAMS_TS, 'ts');
    expect(m.tabs).toBe(true);
    expect(m.js).toContain('new Map()');
    expect(m.ts).toContain('new Map<string, string[]>()');
    expect(m.js).not.toBe(m.ts);
  });

  it('TypeScript that is already plain JS (nothing to strip) → single block, no tabs', () => {
    const m = codeTabsModel('export const add = (a, b) => a + b;', 'ts');
    expect(m.tabs).toBe(false);
  });

  it('a non-TypeScript language → single block, no generated JS', () => {
    const bash = codeTabsModel('npm run build', 'bash');
    expect(bash.tabs).toBe(false);
    expect(bash.js).toBeNull();
    const none = codeTabsModel(GROUP_ANAGRAMS_TS, undefined);
    expect(none.tabs).toBe(false);
  });
});

describe('language detection', () => {
  it('reads the language from a markdown code className', () => {
    expect(langFromClassName('language-ts')).toBe('ts');
    expect(langFromClassName('hljs language-typescript')).toBe('typescript');
    expect(langFromClassName(undefined)).toBeUndefined();
  });

  it('treats only ts/typescript as tabbed', () => {
    expect(isTsDisplayLang('ts')).toBe(true);
    expect(isTsDisplayLang('TypeScript')).toBe(true);
    expect(isTsDisplayLang('js')).toBe(false);
    expect(isTsDisplayLang('bash')).toBe(false);
    expect(isTsDisplayLang(undefined)).toBe(false);
  });
});
