/**
 * Jarre - The lesson map the section tutor always carries
 *
 * The section tutor (VoicePanel) used to see one section only: "¿y LRU?" got
 * nothing, and "eso lo viste en la 2" was impossible. The whole lesson does
 * not belong in the system instruction either: the Live API re-reads and
 * bills every token of the context on every turn and 3.8 has no caching
 * (docs/tutor/02-arquitectura.md §3.2: 37k tokens a turn with the lesson,
 * ~7.4k with a map). So the instruction carries a map of every section
 * (number, short name, what it covers) plus the focus section in full, and
 * the other sections come on demand (phase 3).
 *
 * The map is derived from the markdown, deterministically, no LLM: the
 * lessons are written with bold one-line headings ("**El truco: contar en tu
 * propio código**"), which name exactly what each section covers. Same input,
 * same map: it is computed when the panel opens, in microseconds.
 */

export interface LessonSectionInput {
  id?: string;
  conceptId?: string;
  title: string;
  content: string;
}

export interface LessonMapEntry {
  /** 1-based, as the learner sees it ("la 3"). */
  n: number;
  id?: string;
  conceptId?: string;
  title: string;
  /** The name to say out loud: the title without its qualifiers ("Two Sum"). */
  short: string;
  /** What the section covers that no other section does, from its headings. */
  topics: string[];
  /** Its central idea, one sentence of its own text. */
  idea: string;
}

const MAX_TOPICS = 8;
const MAX_TOPIC_CHARS = 64;
const MAX_IDEA_CHARS = 220;
/** A heading in this many sections is the lesson's template ("El código"), not a topic. */
const TEMPLATE_HEADING_MIN_SECTIONS = 3;
/** Where a problem section states its central move. */
const IDEA_HEADING = /optimizaci|trade-off|\bidea\b|\bclaves?\b|truco|qué es\b|para qué sirve/i;

/** "Two Sum (calentamiento, fácil) · núcleo" → "Two Sum". */
export function shortTitle(title: string): string {
  return title.split(/\s+[(·—-]/)[0]?.trim() || title.trim();
}

function headingOf(line: string): string | null {
  const m = line.trim().match(/^(?:#{2,4}\s+(.+)|\*\*([^*]+)\*\*:?)$/);
  if (!m) return null;
  return (m[1] ?? m[2] ?? '').replace(/\*\*/g, '').replace(/[.:]$/, '').trim() || null;
}

/** "Aclarar (minuto 0 a 2)" and "Aclarar (minuto 0 a 3)" are the same template heading. */
function headingKey(heading: string): string {
  return normalizeForMatch(heading.replace(/\(minuto[^)]*\)/i, ''));
}

/** One-line headings of a section, in order: "**Qué es n**" → "Qué es n". */
export function sectionTopics(markdown: string): string[] {
  const topics: string[] = [];
  for (const line of markdown.split('\n')) {
    const raw = headingOf(line);
    if (!raw) continue;
    const topic = raw.length > MAX_TOPIC_CHARS ? `${raw.slice(0, MAX_TOPIC_CHARS - 1).trim()}…` : raw;
    if (!topics.includes(topic)) topics.push(topic);
  }
  return topics;
}

function firstSentence(text: string): string {
  const flat = text.replace(/\*\*|`|^>\s*/gm, '').replace(/\s+/g, ' ').trim();
  const m = flat.match(/^(.+?[.!?])(\s|$)/);
  const sentence = (m ? m[1] : flat).trim();
  return sentence.length > MAX_IDEA_CHARS ? `${sentence.slice(0, MAX_IDEA_CHARS - 1).trim()}…` : sentence;
}

/** The section's central idea: the first sentence under its "optimization/key idea" heading, or its first sentence. */
export function sectionIdea(markdown: string): string {
  const blocks = markdown.split(/\n\s*\n/);
  let fallback = '';
  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split('\n');
    const heading = headingOf(lines[0] ?? '');
    const rest = (heading ? lines.slice(1) : lines).join(' ').trim();
    const body = rest || (heading ? (blocks[i + 1] ?? '') : '');
    if (heading && IDEA_HEADING.test(heading) && body && !headingOf(body.split('\n')[0])) return firstSentence(body);
    if (!fallback && !heading && !/^[|`>-]/.test(rest)) fallback = firstSentence(rest);
  }
  return fallback;
}

export function buildLessonMap(sections: LessonSectionInput[]): LessonMapEntry[] {
  const all = sections.map((s) => sectionTopics(s.content));
  const seenIn = new Map<string, number>();
  for (const topics of all) for (const key of new Set(topics.map(headingKey))) seenIn.set(key, (seenIn.get(key) ?? 0) + 1);
  const distinctive = (t: string) => sections.length < TEMPLATE_HEADING_MIN_SECTIONS + 1 || (seenIn.get(headingKey(t)) ?? 0) < TEMPLATE_HEADING_MIN_SECTIONS;
  return sections.map((s, i) => ({
    n: i + 1,
    id: s.id,
    conceptId: s.conceptId,
    title: s.title,
    short: shortTitle(s.title),
    topics: all[i].filter(distinctive).slice(0, MAX_TOPICS),
    idea: sectionIdea(s.content),
  }));
}

/** The map as the instruction carries it. */
export function renderLessonMap(map: LessonMapEntry[], focusIndex: number): string {
  return map
    .map((e, i) => {
      const head = `${e.n}. ${e.title}${i === focusIndex ? '  ← THE SECTION BEING STUDIED NOW (full text below)' : ''}`;
      const lines = [head];
      if (i !== focusIndex && e.idea) lines.push(`   Key idea: ${e.idea}`);
      if (e.topics.length) lines.push(`   Also covers: ${e.topics.join(' · ')}`);
      return lines.join('\n');
    })
    .join('\n');
}

/** Rough token count for budgets: Gemini's tokenizer gives ~3.4 to 4.3 chars per token on these lessons. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.4);
}

// ---------------------------------------------------------------------------
// Which section the learner names (phase 3: notes on demand)
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18,
  diecinueve: 19, veinte: 20, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
};

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/**
 * The sections a line names, by number ("la sección cinco", "section 13") or
 * by short name ("LRU", "Group Anagrams", "Big-O"). A bare number or "o de n"
 * is not a section: only "sección/section N" counts as a number.
 */
export function sectionsNamedIn(text: string, map: LessonMapEntry[]): number[] {
  const norm = ` ${normalizeForMatch(text)} `;
  const found = new Set<number>();
  for (const m of norm.matchAll(/\b(?:seccion|section|parte)\s+(?:numero\s+)?([a-z]+|\d{1,2})\b/g)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]];
    if (n && n >= 1 && n <= map.length) found.add(n);
  }
  for (const e of map) {
    for (const name of namesOf(e)) {
      if (name.length >= 3 && norm.includes(` ${name} `)) found.add(e.n);
    }
  }
  return [...found].sort((a, b) => a - b);
}

/** Spoken names of a section: its short title, and its first word when that is a name of its own ("LRU", "Big-O"). */
function namesOf(e: LessonMapEntry): string[] {
  const names = [normalizeForMatch(e.short)];
  const first = e.short.split(/\s+/)[0] ?? '';
  if (e.short.includes(' ') && first.length >= 3 && (/^[A-Z0-9]+$/.test(first) || first.includes('-'))) {
    names.push(normalizeForMatch(first));
  }
  return names;
}
