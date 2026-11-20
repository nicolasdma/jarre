/**
 * Jarre - How fast the interviewer's voice plays, and what the candidate says
 * to change it (owner, 2026-11-20, after the coding mock: "habla un poco
 * rápido, me cuesta seguirle el ritmo ... que si le pido que repita que no
 * entendí o que hable más lento, que pueda cambiar la velocidad").
 *
 * The pace is the tempo of the playback (src/lib/voice/wsola.ts: slower, same
 * pitch), one of PACE_STEPS. It changes two ways: the control on the page, and
 * the candidate's own words, read here from the input transcription: asking
 * to slow down, and also asking to repeat or saying they did not understand,
 * each lower it one step for the rest of the session. The interviewer hears
 * the same words and slows its own delivery (the prompt in
 * src/lib/coding/mock-session.ts); this is the half that does not depend on
 * the model doing it.
 *
 * The patterns are requests to the interviewer, never talk about code: in a
 * coding round "this is slower", "a faster approach" and "it's too slow" are
 * about the algorithm, so a bare "slower" or "faster" is not a request.
 */

/** Playback tempos offered, slowest first. 1 is the voice as Gemini sends it. */
export const PACE_STEPS = [0.7, 0.8, 0.9, 1] as const;
export type Pace = (typeof PACE_STEPS)[number];
/**
 * The interviewer opened at 189 words per minute without being told to speak
 * slowly and at 192 and 188 with it (scripts/probe-coding-mock-pace.ts, three
 * sessions: docs/research/voice-probe/coding-mock-pace-2026-11-20.json and
 * -2026-11-20-b.json): the prompt does not slow a first turn, the playback
 * does. 0.8 brings that to about 150, the pace the model itself took (153 and
 * 148) once asked out loud to slow down.
 */
export const DEFAULT_PACE: Pace = 0.8;

export type PaceRequestKind = 'slower' | 'repeat' | 'faster' | 'normal';

export function isPace(value: unknown): value is Pace {
  return (PACE_STEPS as readonly unknown[]).includes(value);
}

const A = "(?:'|\\s)?"; // didn't, didnt, did nt
const YOU_CAN = '(?:can|could|would|will|may|might)\\s+you';
const A_BIT = '(?:(?:just\\s+)?(?:a\\s+)?(?:little\\s+bit|little|bit|tad|lot|much)\\s+)?';

const PATTERNS: Record<PaceRequestKind, RegExp[]> = {
  slower: [
    new RegExp(`\\b(?:speak|talk|say (?:it|that)|explain (?:it|that)|repeat (?:it|that))\\s+${A_BIT}(?:more\\s+)?(?:slower|slowly|slow)\\b`),
    new RegExp(`\\b${YOU_CAN}\\b[^.?!]{0,40}?\\b(?:slower|slowly|slow down)\\b`),
    /\b(?:slower|slowly|slow down)[\s,]*please\b/,
    /\bplease\b[^.?!]{0,30}?\b(?:slower|slowly|slow down)\b/,
    // Nobody complains that an algorithm is too fast.
    /\btoo (?:fast|quick|quickly)\b/,
    /\bmas (?:lento|lenta|lentamente|despacio)\b/,
    /\b(?:muy|demasiado|tan) rapido\b/,
  ],
  faster: [
    new RegExp(`\\b(?:speak|talk)\\s+${A_BIT}(?:faster|quicker|more quickly)\\b`),
    new RegExp(`\\b${YOU_CAN}\\s+(?:please\\s+)?(?:speak|talk|go)\\b[^.?!]{0,20}?\\b(?:faster|quicker)\\b`),
    new RegExp(`\\byou${A}(?:re|are)?\\s+(?:speaking|talking)\\s+${A_BIT}(?:too|so|very|really)\\s+slow(?:ly)?\\b`),
    /\b(?:habla|hable|hablame|hablar|podes hablar|puedes hablar)\s+(?:un poco\s+)?mas rapido\b/,
    /\bmas rapido,?\s+por favor\b/,
  ],
  normal: [
    /\b(?:normal|regular|usual|original)\s+(?:speed|pace|tempo)\b/,
    /\b(?:speak|talk)\s+(?:at\s+)?normal(?:ly)?\b/,
    /\bvelocidad normal\b/,
  ],
  repeat: [
    new RegExp(`\\b${YOU_CAN}\\s+(?:please\\s+)?(?:repeat|rephrase|say\\s+(?:that|it|this)(?:\\s+one)?\\s+(?:again|once more|one more time))\\b`),
    /\b(?:repeat|rephrase)\s+(?:that|it|the question|the problem|the last|please|again|what you)\b/,
    /\bsay\s+(?:that|it)\s+(?:again|once more|one more time)\b/,
    /\b(?:one more time|once more|again),?\s+please\b/,
    /\bcome again\b/,
    new RegExp(`\\bi\\s+did(?:n${A}t|\\s+not)\\s+(?:quite\\s+|really\\s+)?(?:understand|catch (?:that|you|it|the)|hear (?:that|you|it|the)|follow (?:that|you|the)|get (?:that|what you))\\b`),
    new RegExp(`\\bi\\s+(?:do(?:n${A}t|\\s+not)|could(?:n${A}t|\\s+not)|can${A}t|cannot)\\s+(?:quite\\s+|really\\s+)?(?:understand|catch|hear|follow)\\s+(?:that|you|what you|the question|the last|your question)\\b`),
    /\bno (?:te |le |lo )?(?:entendi|entiendo)\b/,
    /\b(?:repeti|repetime|repetilo|repite|repita|repetir)\b/,
    /\botra vez\b/,
  ],
};

/** Earliest wins; at the same place, the more specific request does. */
const ORDER: PaceRequestKind[] = ['slower', 'faster', 'normal', 'repeat'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * The first request about the pace in what the candidate said, from character
 * `from` on (an utterance grows as its transcription arrives: pass the `end`
 * of the last match so one request counts once). `end` is where to look from
 * next time.
 */
export function findPaceRequest(text: string, from = 0): { kind: PaceRequestKind; end: number } | null {
  const rest = normalize(text).slice(from);
  let found: { kind: PaceRequestKind; at: number; end: number } | null = null;
  for (const kind of ORDER) {
    for (const pattern of PATTERNS[kind]) {
      const m = pattern.exec(rest);
      if (m && (found === null || m.index < found.at)) found = { kind, at: m.index, end: from + m.index + m[0].length };
    }
  }
  return found && { kind: found.kind, end: found.end };
}

/** The pace after a request: one step per request, `normal` back to the model's own speed. */
export function applyPaceRequest(pace: Pace, kind: PaceRequestKind): Pace {
  const i = PACE_STEPS.indexOf(pace);
  if (kind === 'normal') return 1;
  if (kind === 'faster') return PACE_STEPS[Math.min(PACE_STEPS.length - 1, i + 1)];
  return PACE_STEPS[Math.max(0, i - 1)];
}

/** "0.9×" */
export function paceLabel(pace: Pace): string {
  return `${pace.toFixed(1)}×`;
}
