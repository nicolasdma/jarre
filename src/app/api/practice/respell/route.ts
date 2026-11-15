/**
 * GET /api/practice/respell?w=word1,word2
 *
 * Spanish-ear respellings and IPA from the CMU Pronouncing Dictionary
 * (CMUdict, ~4.7 MB) for the drill words the lesson's key terms and COMMON
 * do not cover. The dictionary only loads here, on the server: the practice
 * page fetches what it needs (src/components/practice/use-dictionary-respellings.ts).
 *
 * Response: { words: { [word as sent]: { say, ipa } } }; a word CMU does not
 * have is left out (nothing is guessed). Public, static data: no auth, cached.
 */

import { NextResponse } from 'next/server';
import { dictionary } from 'cmu-pronouncing-dictionary';
import { respellFromDictionary, type Respelling } from '@/lib/practice/arpabet-respell';

/** Words per request: a whole drill fits (the longest is ~350 words, sent in chunks by the client). */
const MAX_WORDS = 120;
const MAX_WORD_LENGTH = 40;

export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('w') ?? '';
  const asked = [...new Set(raw.split(',').map((w) => w.trim()).filter((w) => w && w.length <= MAX_WORD_LENGTH))];
  if (asked.length > MAX_WORDS) {
    return NextResponse.json({ error: `At most ${MAX_WORDS} words per request` }, { status: 400 });
  }
  const words: Record<string, Respelling> = {};
  for (const w of asked) {
    const r = respellFromDictionary(w, dictionary);
    if (r) words[w] = r;
  }
  return NextResponse.json(
    { words },
    { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800' } },
  );
}
