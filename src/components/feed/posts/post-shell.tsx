'use client';

/**
 * The frame every feed post shares: one viewport tall (100svh, stable on
 * mobile), scroll-snapped, painted only when near the viewport
 * (content-visibility), its palette applied as CSS vars, and announced to
 * assistive tech as a group. The matrix profile is written to data-* so the
 * feed is inspectable and testable.
 *
 * Nothing here blocks the scroll: the frame is just a surface, the (always
 * optional) interaction lives in the children.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import { isDarkPalette, paletteVars } from '../feed-palette';

export function PostShell({
  post,
  label,
  eyebrow,
  children,
  hint,
  reducedMotion,
  active,
}: {
  post: FeedPost;
  /** aria-label for the group. */
  label: string;
  /** Small kicker line (concept name, or the kind). */
  eyebrow?: ReactNode;
  children: ReactNode;
  /** The optional-participation affordance line at the foot. */
  hint?: ReactNode;
  reducedMotion: boolean;
  active: boolean;
}) {
  const dark = isDarkPalette(post.paletteIndex);
  return (
    <section
      role="group"
      aria-label={label}
      tabIndex={-1}
      data-feed-post
      data-kind={post.kind}
      data-participation={post.profile.participation}
      data-energy={post.profile.energy}
      data-visual={post.profile.visual}
      data-density={post.profile.density}
      data-novelty={post.profile.novelty}
      data-pass={post.pass}
      data-active={active ? 'true' : 'false'}
      style={{
        ...paletteVars(post.paletteIndex),
        background: 'var(--fp-bg)',
        color: 'var(--fp-ink)',
        // Keep off-screen posts cheap to lay out and paint.
        contentVisibility: 'auto',
        containIntrinsicSize: '100svh',
      }}
      className={cn(
        'relative flex h-[100svh] snap-start snap-always flex-col justify-center overflow-hidden px-5 py-16 sm:px-8',
        !reducedMotion && active && 'motion-safe:animate-[feedpost-in_320ms_ease-out]',
      )}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {eyebrow && (
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--fp-soft)' }}>
            {eyebrow}
          </div>
        )}
        {children}
      </div>
      {hint && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-5 font-mono text-[10px] uppercase tracking-[0.15em]"
          style={{ color: dark ? 'rgba(241,239,232,0.55)' : 'var(--fp-soft)' }}
        >
          {hint}
        </div>
      )}
    </section>
  );
}

/** A profile pill: shows the (honest) participation vibe. Never a demand. */
export function ParticipationPill({ post }: { post: FeedPost }) {
  const label =
    post.profile.participation === 'active-optional'
      ? 'decilo si querés'
      : post.profile.participation === 'optional-tap'
        ? 'tocá si querés'
        : post.profile.novelty === 'new'
          ? 'nuevo'
          : 'repaso';
  return (
    <span
      className="rounded-full px-2 py-0.5"
      style={{ background: 'color-mix(in srgb, var(--fp-accent) 16%, transparent)', color: 'var(--fp-accent)' }}
    >
      {label}
    </span>
  );
}

/** A tappable surface in the post's palette. Optional by design: skippable. */
export function TapButton({
  children,
  onClick,
  selected,
  tone = 'surface',
  className,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  tone?: 'surface' | 'accent';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'min-h-[48px] rounded-xl border px-4 py-3 text-left text-base transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
      style={
        tone === 'accent' || selected
          ? { background: 'var(--fp-accent)', color: 'var(--fp-on-accent)', borderColor: 'var(--fp-accent)' }
          : { background: 'var(--fp-surface)', color: 'var(--fp-ink)', borderColor: 'color-mix(in srgb, var(--fp-soft) 40%, transparent)' }
      }
      {...rest}
    >
      {children}
    </button>
  );
}
