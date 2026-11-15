'use client';

/**
 * CMUdict respellings for the words of a drill, fetched from
 * /api/practice/respell (the dictionary never ships to the browser). One
 * request per text, only for the words key terms and COMMON do not cover;
 * answers are kept for the page's life, misses too, so a word is asked once.
 */

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { cleanWord, dictionaryKey, needsDictionary, type DictionaryRespellings } from '@/lib/practice/pronunciation';
import type { TargetWord } from '@/lib/practice/scoring';

/** Per request: the route's own cap. */
const CHUNK = 120;

/** Word as written (cleaned) → its respelling, or null when CMU has none. Asked words only. */
const answers = new Map<string, { say: string; ipa: string } | null>();
const inFlight = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: DictionaryRespellings = new Map();

function publish() {
  const next = new Map<string, { say: string; ipa: string }>();
  for (const [word, r] of answers) if (r) next.set(dictionaryKey(word), r);
  snapshot = next;
  listeners.forEach((l) => l());
}

async function ask(words: string[]) {
  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK);
    chunk.forEach((w) => inFlight.add(w));
    try {
      const res = await fetch(`/api/practice/respell?w=${encodeURIComponent(chunk.join(','))}`);
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { words?: Record<string, { say: string; ipa: string }> };
      for (const w of chunk) answers.set(w, body.words?.[w] ?? null);
    } catch {
      // Offline or the route failed: no respelling this time, asked again on the next text.
    } finally {
      chunk.forEach((w) => inFlight.delete(w));
    }
  }
  publish();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const read = () => snapshot;
const EMPTY: DictionaryRespellings = new Map();

/** The CMUdict respellings known so far for `words` (and any other word already asked). */
export function useDictionaryRespellings(words: readonly TargetWord[], terms: readonly KeyTerm[]): DictionaryRespellings {
  const wanted = useMemo(() => {
    const out = new Set<string>();
    for (const w of words) {
      const term = w.term !== null ? terms[w.term] ?? null : null;
      // A key term is asked by its name, once (its other words are part of it).
      const text = term ? term.term : cleanWord(w.word);
      // Commas are the request's separator; such a word has no dictionary entry anyway.
      if (text && !text.includes(',') && needsDictionary(text, term)) out.add(text);
    }
    return [...out];
  }, [words, terms]);
  const key = wanted.join(',');

  useEffect(() => {
    const missing = key ? key.split(',').filter((w) => !answers.has(w) && !inFlight.has(w)) : [];
    if (missing.length) void ask(missing);
  }, [key]);

  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** For tests: forget everything asked. */
export function resetDictionaryRespellings() {
  answers.clear();
  inFlight.clear();
  snapshot = new Map();
}
