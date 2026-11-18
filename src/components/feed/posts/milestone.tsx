'use client';

/**
 * A calm, honest progress reminder. It celebrates what is covered and names
 * what will come back to re-surface. It is NEVER a stop, never a streak, never
 * fake social proof (owner, 2026-11-18): the feed keeps scrolling right past
 * it. One user, real numbers, no crowd.
 */

import type { FeedPost } from '@/lib/feed/feed-post';
import { PostShell } from './post-shell';

export interface FeedStats {
  /** Distinct concepts the feed has introduced so far. */
  covered: number;
  /** Total concepts in the lesson. */
  total: number;
  /** Concepts with a review due (FSRS), to re-surface. */
  due: number;
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
      ? { head: `${stats.covered} de ${stats.total} conceptos`, sub: 'Ya pasaron por tu feed. Seguís cuando tengas ganas, sin apuro.' }
      : post.milestone === 'resurfacing'
        ? { head: stats.due > 0 ? `${stats.due} para repasar` : 'Vas al día', sub: 'Lo flojo vuelve solo, espaciado, mientras scrolleás.' }
        : { head: 'Lo real, repetido', sub: 'No hay rachas ni me-gusta: solo tu material, otra vez, de otra forma.' };

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label="Progreso"
      eyebrow={<span>Dónde vas</span>}
    >
      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: 'var(--fp-ink)' }}>
        {line.head}
      </h2>
      <p className="text-base leading-relaxed sm:text-lg" lang="es" style={{ color: 'var(--fp-soft)' }}>
        {line.sub}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--fp-soft)' }}>
        Para practicar en serio: Escuchar · Repetir · Pregunta → respuesta
      </p>
    </PostShell>
  );
}
