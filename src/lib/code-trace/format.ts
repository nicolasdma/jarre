/**
 * How values read inside captions and boxes: the way a person would write them
 * on a whiteboard, in Rioplatense Spanish (a real minus sign, "vacío", "∞").
 */

import type { Cell } from './types';

/** One value, short. Strings in quotes only when they could be confused (empty, spaces). */
export function fmt(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'number') {
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '−∞';
    return v < 0 ? `−${-v}` : String(v);
  }
  if (typeof v === 'string') return v === '' || /\s/.test(v) ? `"${v}"` : v;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `[${v.map(fmt).join(', ')}]`;
  return JSON.stringify(v);
}

/** A string value always quoted, for captions that talk about strings. */
export function q(s: string): string {
  return `"${s}"`;
}

/** A box's text: same as fmt, but strings stay bare (the box is the quote). */
export function cellText(v: Cell | Cell[] | undefined): string {
  if (Array.isArray(v)) return `[${v.map((x) => cellText(x)).join(', ')}]`;
  if (typeof v === 'string') return v === '' ? '""' : v;
  return fmt(v);
}

/** a − b written with a real minus sign and negatives in parentheses. */
export function minus(a: number, b: number): string {
  return `${fmt(a)} − ${b < 0 ? `(${fmt(b)})` : fmt(b)}`;
}

/** a + b, with negatives in parentheses. */
export function plus(a: number, b: number): string {
  return `${fmt(a)} + ${b < 0 ? `(${fmt(b)})` : fmt(b)}`;
}
