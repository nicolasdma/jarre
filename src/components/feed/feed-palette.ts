/**
 * The feed's color palettes: the encoding variety that makes a re-surfaced
 * concept feel new (the generator rotates paletteIndex on every return). Muted
 * and warm, in Jarre's paper aesthetic (globals.css), so variety never turns
 * into noise (Mayer coherence). Applied as CSS custom properties on each post,
 * so no per-tick style work and no Tailwind class explosion.
 */

export interface FeedPalette {
  /** Full-bleed post background. */
  bg: string;
  /** A raised surface (card) on the background. */
  surface: string;
  /** Primary ink. */
  ink: string;
  /** Secondary ink. */
  soft: string;
  /** Accent (keyword, bar, highlight). */
  accent: string;
  /** Ink on the accent. */
  onAccent: string;
}

export const FEED_PALETTES: FeedPalette[] = [
  { bg: '#faf9f6', surface: '#ffffff', ink: '#1E293B', soft: '#64748B', accent: '#4a5d4a', onAccent: '#f5f4f0' },
  { bg: '#f1efe8', surface: '#faf9f6', ink: '#2b2b28', soft: '#6b6b62', accent: '#8b7355', onAccent: '#faf9f6' },
  { bg: '#eef2ee', surface: '#ffffff', ink: '#273529', soft: '#5c6b5c', accent: '#4a5d4a', onAccent: '#f5f4f0' },
  { bg: '#f6efe6', surface: '#fffdf9', ink: '#3a2f22', soft: '#8b7355', accent: '#c4752a', onAccent: '#fffdf9' },
  { bg: '#1E293B', surface: '#273449', ink: '#f1efe8', soft: '#b9c2d0', accent: '#c4a07a', onAccent: '#1E293B' },
  { bg: '#efeaf2', surface: '#fbf9fc', ink: '#2e2838', soft: '#6b6478', accent: '#6b5a8b', onAccent: '#fbf9fc' },
];

export function feedPalette(index: number): FeedPalette {
  return FEED_PALETTES[((index % FEED_PALETTES.length) + FEED_PALETTES.length) % FEED_PALETTES.length];
}

/** CSS custom properties for a palette, spread onto a post's style. */
export function paletteVars(index: number): React.CSSProperties {
  const p = feedPalette(index);
  const vars: Record<string, string> = {
    '--fp-bg': p.bg,
    '--fp-surface': p.surface,
    '--fp-ink': p.ink,
    '--fp-soft': p.soft,
    '--fp-accent': p.accent,
    '--fp-on-accent': p.onAccent,
  };
  return vars as React.CSSProperties;
}

/** Whether this palette is dark (to flip chrome that needs contrast). */
export function isDarkPalette(index: number): boolean {
  return feedPalette(index).bg.startsWith('#1') || feedPalette(index).bg.startsWith('#2');
}
