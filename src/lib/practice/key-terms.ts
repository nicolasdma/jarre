/**
 * A lesson's key terms: the names and figures the learner has to say so a
 * native listener recognizes them (Supabase, Centrobill, pg_cron, 45/55…).
 *
 * They live in the lesson JSON under `interview.key_terms` (stored in
 * `resources.interview`). An entry is either the bare term, or an object with
 * what the browser's speech recognizer writes when the term is said right
 * (Chrome's Web Speech cannot be given a vocabulary, so it turns "Supabase"
 * into "super bass"), a Spanish-ear respelling and the IPA.
 *
 * Pure module: no DOM, no React.
 */

import { z } from 'zod';

export const KeyTermEntrySchema = z.union([
  z.string().min(1),
  z.object({
    term: z.string().min(1),
    /**
     * What the recognizer writes when the term is pronounced well: sound-alikes
     * ("super bass") and number spellings ("4555", "one twenty second"). Only
     * for words the recognizer cannot know; never a real mispronunciation.
     */
    heard_as: z.array(z.string().min(1)).default([]),
    /** Spanish-ear respelling, stressed syllable in caps: "SÚ-pa-beis". */
    say: z.string().min(1).optional(),
    /** IPA, without slashes: "ˈsuːpəbeɪs". */
    ipa: z.string().min(1).optional(),
    /** What the browser voice should read, when the written form misleads it ("forty-five fifty-five" for 45/55). */
    speak: z.string().min(1).optional(),
  }),
]);

/** As written in the lesson JSON (`heard_as` may be left out). */
export type KeyTermEntry = z.input<typeof KeyTermEntrySchema>;

export interface KeyTerm {
  term: string;
  heardAs: string[];
  say: string | null;
  ipa: string | null;
  /** Text for the browser voice; the term itself unless the lesson says otherwise. */
  speak: string;
}

export function toKeyTerm(entry: KeyTermEntry): KeyTerm {
  if (typeof entry === 'string') return { term: entry, heardAs: [], say: null, ipa: null, speak: entry };
  return {
    term: entry.term,
    heardAs: entry.heard_as ?? [],
    say: entry.say ?? null,
    ipa: entry.ipa ?? null,
    speak: entry.speak ?? entry.term,
  };
}

/** The term's name, for prompts that only need the words. */
export function keyTermName(entry: KeyTermEntry): string {
  return typeof entry === 'string' ? entry : entry.term;
}

/** Key terms out of a lesson's stored `interview` block; anything invalid is skipped. */
export function keyTermsFromInterview(raw: unknown): KeyTerm[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = (raw as { key_terms?: unknown }).key_terms;
  if (!Array.isArray(list)) return [];
  const out: KeyTerm[] = [];
  for (const item of list) {
    const parsed = KeyTermEntrySchema.safeParse(item);
    if (parsed.success) out.push(toKeyTerm(parsed.data));
  }
  return out;
}
