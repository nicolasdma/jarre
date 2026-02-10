/**
 * Jarre Design Tokens — TypeScript constants for programmatic use.
 *
 * Use these when you need color values in JavaScript/TypeScript (e.g., inline
 * styles, canvas rendering, SVG attributes). For Tailwind classes, use the
 * `j-*` utility classes defined in globals.css instead.
 *
 * These reference CSS custom properties so they automatically adapt to
 * light/dark mode.
 */

export const tokens = {
  bg: 'var(--j-bg)',
  bgAlt: 'var(--j-bg-alt)',
  bgHover: 'var(--j-bg-hover)',
  bgWhite: 'var(--j-bg-white)',

  text: 'var(--j-text)',
  textSecondary: 'var(--j-text-secondary)',
  textTertiary: 'var(--j-text-tertiary)',
  textBody: 'var(--j-text-body)',
  textEm: 'var(--j-text-em)',
  textOnAccent: 'var(--j-text-on-accent)',

  accent: 'var(--j-accent)',
  accentHover: 'var(--j-accent-hover)',
  accentLight: 'var(--j-accent-light)',
  accentMuted: 'var(--j-accent-muted)',

  warm: 'var(--j-warm)',
  warmLight: 'var(--j-warm-light)',
  warmDark: 'var(--j-warm-dark)',
  warmMuted: 'var(--j-warm-muted)',

  border: 'var(--j-border)',
  borderInput: 'var(--j-border-input)',
  borderLight: 'var(--j-border-light)',
  borderDot: 'var(--j-border-dot)',

  success: 'var(--j-success)',
  successBg: 'var(--j-success-bg)',
  error: 'var(--j-error)',
  errorBg: 'var(--j-error-bg)',
  info: 'var(--j-info)',
  infoBg: 'var(--j-info-bg)',
} as const;

export type DesignToken = keyof typeof tokens;
