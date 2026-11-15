'use client';

/**
 * After an attempt below the bar, the words missed in it are written as they
 * sound in the target text for the next try (owner, 2026-11-15: "la segunda
 * vez hay que reescribir en modo fonético las palabras que estuvieron mal"),
 * until a try passes. One implementation for Frase por frase and Repetir.
 *
 * Which words: wordsToPractice's `missed` items of the last attempt (function
 * words left out; key terms the recognizer took as a sound-alike were said, so
 * they stay). How each one sounds: key term → COMMON → CMUdict; a word with
 * none (a name CMU does not know) stays as written.
 */

import { useCallback, useMemo, useState } from 'react';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { resolvePronunciation, wordsToPractice, type DictionaryRespellings } from '@/lib/practice/pronunciation';
import { alignWords, type TargetWord } from '@/lib/practice/scoring';
import { useDictionaryRespellings } from './use-dictionary-respellings';

/** The words to write as they sound: first word index → respelling. Pure, for the tests. */
export function missedRespellings(
  text: string,
  heard: string,
  terms: readonly KeyTerm[],
  fromDictionary: DictionaryRespellings,
): Map<number, string> {
  const alignment = alignWords(text, heard, { terms });
  const out = new Map<number, string>();
  for (const item of wordsToPractice(alignment, terms)) {
    if (item.kind !== 'missed') continue;
    const w = alignment.words[item.wordIndex];
    const term = item.term !== null ? terms[item.term] ?? null : null;
    const p = resolvePronunciation(w.word, term, fromDictionary);
    if (p) out.set(item.wordIndex, p.say);
  }
  return out;
}

const NONE: ReadonlyMap<number, string> = new Map();

/**
 * `words`: the target's words (any alignment of `text`), to fetch their
 * dictionary respellings ahead. `noteAttempt` after each scored try; `clear`
 * when the learner moves to another text.
 */
export function useMissedRespellings(text: string, words: readonly TargetWord[], terms: readonly KeyTerm[]) {
  const fromDictionary = useDictionaryRespellings(words, terms);
  const [last, setLast] = useState<{ text: string; heard: string } | null>(null);
  const replaced = useMemo(
    () => (last && last.text === text ? missedRespellings(text, last.heard, terms, fromDictionary) : NONE),
    [last, text, terms, fromDictionary],
  );
  // A try with nothing heard keeps the last words up: it says nothing about them.
  const noteAttempt = useCallback(
    (heard: string, passed: boolean) => setLast((prev) => (passed ? null : heard.trim() ? { text, heard } : prev)),
    [text],
  );
  const clear = useCallback(() => setLast(null), []);
  return { replaced, noteAttempt, clear };
}
