/**
 * A short, stable fingerprint of a solution's source, so a code block in a
 * lesson finds its trace by what it says. A trace is offered only when the code
 * on screen is byte-for-byte (modulo trailing spaces) the code the generator
 * was written and tested against: if the lesson edits the solution, the button
 * disappears instead of showing a trace of other code.
 *
 * Pure and dependency-free: the lesson imports it on every code block.
 */

/** Normalise line endings, trailing spaces and outer blank lines. */
export function normalizeCode(code: string): string {
  return code
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

/** FNV-1a 32-bit over the normalised code, as 8 hex chars, plus the length (cheap collision guard). */
export function codeFingerprint(code: string): string {
  const s = normalizeCode(code);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(16).padStart(8, '0')}-${s.length}`;
}
