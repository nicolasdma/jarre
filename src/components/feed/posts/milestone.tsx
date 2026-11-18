'use client';

/**
 * A small, honest progress card: a ring with the concepts the feed has
 * covered, and one line. Deliberately compact (a short card among the big
 * ones, like a suggestion row in a feed). Never a stop, never a streak, never
 * fake social proof (owner, 2026-11-18): one learner, real numbers.
 */

import type { FeedPost } from '@/lib/feed/feed-post';
import { CardFrame, Media } from './card-frame';

export interface FeedStats {
  /** Distinct concepts the feed has introduced so far. */
  covered: number;
  /** Total concepts in the lesson. */
  total: number;
  /** Concepts with a review due (FSRS), to re-surface. */
  due: number;
}

function Ring({ value, total }: { value: number; total: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <svg viewBox="0 0 72 72" className="h-[76px] w-[76px] shrink-0 -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="color-mix(in srgb, var(--fp-ink) 16%, transparent)" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--fp-accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} />
    </svg>
  );
}

export function Milestone({
  post,
  stats,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  stats: FeedStats;
  active: boolean;
  reducedMotion: boolean;
}) {
  const line =
    post.milestone === 'covered'
      ? { head: `${stats.covered} de ${stats.total} temas`, sub: 'ya pasaron por tu feed. Seguís cuando tengas ganas, sin apuro.' }
      : post.milestone === 'resurfacing'
        ? { head: stats.due > 0 ? `${stats.due} para repasar` : 'Vas al día', sub: 'Lo flojo vuelve solo, espaciado, mientras scrolleás.' }
        : { head: 'Lo real, repetido', sub: 'Sin rachas ni me-gusta: tu material, otra vez, de otra forma.' };

  const media = (
    <Media post={post} className="flex items-center gap-4 px-5 py-5">
      <div className="relative">
        <Ring value={stats.covered} total={stats.total} />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[15px] font-bold" style={{ color: 'var(--fp-ink)' }}>
          {stats.covered}/{stats.total}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--fp-ink)' }}>{line.head}</p>
        <p className="mt-1 text-[14px] leading-snug" lang="es" style={{ color: 'var(--fp-soft)' }}>{line.sub}</p>
      </div>
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label="Tu progreso"
      kindLabel="Tu progreso"
      media={media}
      actions={{}}
      compact
    />
  );
}
