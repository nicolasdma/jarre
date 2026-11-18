/**
 * The feed's media palettes: the color of a card's media block. A real feed
 * is many accounts with many looks, so the palettes are deliberately apart
 * from each other (light and dark, warm and cool), while the card chrome
 * around them (header, actions, caption) stays neutral and follows the app
 * theme, the way a feed's chrome does. The generator rotates paletteIndex and
 * never repeats it twice in a row (feed-generator.ts `vary`).
 *
 * Applied as CSS custom properties on the media block, so no per-tick style
 * work and no class explosion. Contrast: `ink` on `bg` ≥ 7:1 and `soft` on
 * `bg` ≥ 4.5:1 in every palette (feed-palette.test.ts).
 */

export interface FeedPalette {
  name: string;
  /** Media background. */
  bg: string;
  /** Primary ink on the media. */
  ink: string;
  /** Secondary ink on the media. */
  soft: string;
  /** Accent (sticker, highlight, filled bar). */
  accent: string;
  /** Ink on the accent. */
  onAccent: string;
  /** Whether bg is dark (the media flips some chrome for contrast). */
  dark: boolean;
}

export const FEED_PALETTES: FeedPalette[] = [
  { name: 'sage', bg: '#dce7d6', ink: '#14281a', soft: '#3f5c45', accent: '#2f6a3e', onAccent: '#f4f8f1', dark: false },
  { name: 'midnight', bg: '#17213a', ink: '#f3eee3', soft: '#a9b8d2', accent: '#f4b942', onAccent: '#17213a', dark: true },
  { name: 'clay', bg: '#8f3622', ink: '#fff6ec', soft: '#ffd9c7', accent: '#ffcf8b', onAccent: '#3a160c', dark: true },
  { name: 'butter', bg: '#f5e3a0', ink: '#2a230d', soft: '#5f5120', accent: '#b9420e', onAccent: '#fff8e6', dark: false },
  { name: 'lilac', bg: '#e2d9f6', ink: '#221a3b', soft: '#54477c', accent: '#6a48c9', onAccent: '#f6f2ff', dark: false },
  { name: 'plum', bg: '#3d1f47', ink: '#f8eefb', soft: '#d5b8de', accent: '#ff9ec7', onAccent: '#3d1f47', dark: true },
  { name: 'sky', bg: '#cde4f4', ink: '#0b2333', soft: '#355a71', accent: '#0a6bb0', onAccent: '#eef7ff', dark: false },
  { name: 'forest', bg: '#1f3d2e', ink: '#eef3e8', soft: '#b3cbb8', accent: '#e9c46a', onAccent: '#1f3d2e', dark: true },
];

/** Avatar colors: one per account slot (feed-identity AVATAR_COLORS), stable across posts. */
export const AVATAR_PALETTE: { bg: string; ink: string }[] = [
  { bg: '#2f6a3e', ink: '#f4f8f1' },
  { bg: '#c2410c', ink: '#fffbeb' },
  { bg: '#6a48c9', ink: '#f6f2ff' },
  { bg: '#0a6bb0', ink: '#eef7ff' },
  { bg: '#b4233b', ink: '#fff1f2' },
  { bg: '#0f766e', ink: '#f0fdfa' },
  { bg: '#1f2937', ink: '#f9fafb' },
  { bg: '#a16207', ink: '#fefce8' },
];

function wrap(index: number, n: number): number {
  return ((index % n) + n) % n;
}

export function feedPalette(index: number): FeedPalette {
  return FEED_PALETTES[wrap(index, FEED_PALETTES.length)];
}

export function avatarColors(index: number): { bg: string; ink: string } {
  return AVATAR_PALETTE[wrap(index, AVATAR_PALETTE.length)];
}

/** CSS custom properties for a palette, spread onto a media block's style. */
export function paletteVars(index: number): React.CSSProperties {
  const p = feedPalette(index);
  const vars: Record<string, string> = {
    '--fp-bg': p.bg,
    '--fp-ink': p.ink,
    '--fp-soft': p.soft,
    '--fp-accent': p.accent,
    '--fp-on-accent': p.onAccent,
  };
  return vars as React.CSSProperties;
}

/** WCAG relative-luminance contrast ratio between two #rrggbb colors. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
