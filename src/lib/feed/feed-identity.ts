/**
 * Who "posts" each card, and the short text a card puts in big type.
 *
 * A real feed reads as a stream of different accounts posting different
 * things. Jarre's feed has no people, so the honest account is the TOPIC: one
 * account per lesson concept ("two-sum · hash map"), with a stable avatar
 * (icon + color) so you recognise it when it comes back, the way you
 * recognise an account you follow. Nothing here invents content: handles come
 * from the concept ids, families from the coding problem's `pattern` (or a
 * keyword in the concept name), and every headline is a slice of text the
 * lesson already has.
 *
 * Pure: no React, no DOM. Tested in __tests__/feed-identity.test.ts.
 */

import type { FeedConceptAssets, FeedGraph } from './feed-graph';

/** The icon an account wears, by concept family. Rendered by the card header. */
export type AccountIcon =
  | 'hash'
  | 'stack'
  | 'window'
  | 'grid'
  | 'split'
  | 'table'
  | 'pointers'
  | 'bars'
  | 'bug'
  | 'layers'
  | 'arrows'
  | 'curve'
  | 'clock'
  | 'spark';

export interface FeedAccount {
  conceptId: string;
  /** Short, lowercase handle: the concept id without the lesson's shared prefix. Stable key, not shown. */
  handle: string;
  /**
   * What the stories and card headers show: the concept's title when short
   * ("Two Sum"), else its family in words ("Método", with its accent), else the
   * handle in words ("Search rotated"). Never a raw slug like "metodo".
   */
  name: string;
  /** What kind of topic it is: the coding pattern, or a family from the name. */
  family: string;
  icon: AccountIcon;
  /** Stable avatar color slot (never changes between posts of the same account). */
  avatarIndex: number;
  /** The concept's display title (before any ":" subtitle). */
  title: string;
  /** The part after ":" in the concept name, if any. */
  subtitle: string | null;
}

/** How many avatar color slots the card header has. */
export const AVATAR_COLORS = 8;

const ICON_RULES: [RegExp, AccountIcon][] = [
  [/debug|bug/i, 'bug'],
  [/big[- ]?o|complej|complexity/i, 'curve'],
  [/ronda|round|m[eé]todo|method|fase|phase|minut/i, 'clock'],
  [/sliding|window|ventana/i, 'window'],
  [/bfs|dfs|grid|grilla|graph|island/i, 'grid'],
  [/binary|binaria|rotated/i, 'split'],
  [/dynamic|din[aá]mica|\bdp\b|coin/i, 'table'],
  [/two pointers|dos punteros|pointer/i, 'pointers'],
  [/prefix|suffix|prefijo|sufijo/i, 'arrows'],
  [/design|lru|cache/i, 'layers'],
  [/interval|sort|ordenar|bucket/i, 'bars'],
  [/stack|pila|parenthes/i, 'stack'],
  [/hash|map|anagram/i, 'hash'],
];

const FAMILY_RULES: [RegExp, string][] = [
  [/big[- ]?o|complej|complexity/i, 'complejidad'],
  [/ronda|round|m[eé]todo|method/i, 'método'],
  [/debug|depurar/i, 'debug'],
];

/** Longest prefix shared by every id that ends at a separator ('3yt-v2-'), or ''. */
export function sharedIdPrefix(ids: string[]): string {
  if (ids.length < 2) return '';
  let prefix = ids[0];
  for (const id of ids) {
    while (!id.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) return '';
  }
  const cut = Math.max(prefix.lastIndexOf('-'), prefix.lastIndexOf('_'), prefix.lastIndexOf('.'));
  return cut >= 0 ? prefix.slice(0, cut + 1) : '';
}

/** "Two Sum: hash map de complementos" → { title: "Two Sum", subtitle: "hash map de complementos" }. */
export function nameParts(name: string): { title: string; subtitle: string | null } {
  const i = name.indexOf(':');
  if (i <= 0) return { title: name.trim(), subtitle: null };
  const title = name.slice(0, i).trim();
  const subtitle = name.slice(i + 1).trim();
  return { title, subtitle: subtitle || null };
}

function iconFor(text: string): AccountIcon {
  for (const [re, icon] of ICON_RULES) if (re.test(text)) return icon;
  return 'spark';
}

/** Longest concept title shown as is; a longer one ("La ronda de 30 minutos…") gives way to a short label. */
export const NAME_MAX = 22;

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** The display name of an account (see FeedAccount.name). */
export function displayName(c: Pick<FeedConceptAssets, 'id' | 'name'>, title: string, handle: string): string {
  if (title && title.length <= NAME_MAX) return title;
  for (const [re, family] of FAMILY_RULES) if (re.test(c.name) || re.test(c.id)) return capitalize(family);
  return capitalize(handle.replace(/[-_.]+/g, ' ').trim());
}

function familyFor(c: FeedConceptAssets, pattern: string | null): string {
  if (pattern) return pattern.toLowerCase();
  for (const [re, family] of FAMILY_RULES) if (re.test(c.name) || re.test(c.id)) return family;
  return 'concepto';
}

/** One account per concept, keyed by concept id. Stable for a given graph. */
export function feedAccounts(graph: FeedGraph): Record<string, FeedAccount> {
  const prefix = sharedIdPrefix(graph.concepts.map((c) => c.id));
  const out: Record<string, FeedAccount> = {};
  graph.concepts.forEach((c, i) => {
    const pattern = c.codeIds.map((id) => graph.code[id]?.pattern).find(Boolean) ?? null;
    const handle = (prefix && c.id.startsWith(prefix) ? c.id.slice(prefix.length) : c.id) || c.id;
    const { title, subtitle } = nameParts(c.name);
    out[c.id] = {
      conceptId: c.id,
      handle,
      name: displayName(c, title, handle),
      family: familyFor(c, pattern),
      icon: iconFor(`${pattern ?? ''} ${c.id} ${c.name}`),
      avatarIndex: i % AVATAR_COLORS,
      title,
      subtitle,
    };
  });
  return out;
}

/** The first sentence of a text (up to . ! ? followed by space or end), trimmed. */
export function firstSentence(text: string): string {
  const m = text.match(/^[^]*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
}

/**
 * A definition's lead line without its "Name:" label: "Two Sum: one pass with
 * a map…" → "One pass with a map…". The first sentence only.
 */
export function leadLine(definition: string, title: string): string {
  let text = definition.trim();
  const label = `${title}:`;
  if (text.toLowerCase().startsWith(label.toLowerCase())) text = text.slice(label.length).trim();
  const line = firstSentence(text);
  return line ? line[0].toUpperCase() + line.slice(1) : line;
}

/** "O(1) average per get and put" → { big: "O(1)", rest: "average per get and put" }. */
export function bigOParts(value: string): { big: string; rest: string } {
  const m = value.match(/O\([^)]*\)/);
  if (!m) return { big: value.trim(), rest: '' };
  const rest = (value.slice(0, m.index) + value.slice((m.index ?? 0) + m[0].length)).replace(/\s+/g, ' ').trim();
  return { big: m[0], rest };
}

const HASHTAG_STOP = new Set([
  'para', 'desde', 'cada', 'sobre', 'entre', 'hasta', 'como', 'cuando', 'donde', 'pero', 'sino', 'tiene',
  'with', 'from', 'that', 'this', 'into', 'over', 'your', 'tuyo', 'nivel', 'estilo',
]);

/**
 * Up to `max` hashtags from a short text (a concept's subtitle): its content
 * words, 4+ letters, no stopwords, lowercase, no parentheses. "ordenar por
 * inicio y fusionar en una pasada" → ordenar, inicio, fusionar.
 */
export function hashtags(text: string, max = 3): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[\s,;:·/()]+/)) {
    const w = raw.replace(/[^\p{L}\p{N}-]/gu, '');
    if (w.length < 4 || HASHTAG_STOP.has(w) || out.includes(w)) continue;
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

/** Split a spoken drill text on its " / " phrase marks. */
export function phrasesOf(text: string): string[] {
  return text.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
}
