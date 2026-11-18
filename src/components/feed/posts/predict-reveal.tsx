'use client';

/**
 * Predict then reveal: a recall card's prompt, with the answer hidden behind a
 * tap (predict-before-reveal). Optional: think it, tap it, or just scroll. The
 * answer is a projection of the concept_card's back content.
 */

import { useState } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { ParticipationPill, PostShell } from './post-shell';

export function PredictReveal({
  post,
  graph,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  graph: FeedGraph;
  active: boolean;
  reducedMotion: boolean;
}) {
  const card = post.cardId ? graph.cards[post.cardId] : undefined;
  const concept = graph.concepts.find((c) => c.id === post.conceptId);
  const [revealed, setRevealed] = useState(false);
  if (!card) return null;

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${concept?.name ?? 'Tarjeta'}: predecí la respuesta`}
      eyebrow={<>
        <span>Acordate{concept ? ` · ${concept.name}` : ''}</span>
        <ParticipationPill post={post} />
      </>}
      hint={revealed ? undefined : 'Pensá la respuesta, después tocá · o seguí'}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--fp-soft)' }}>
        Antes de ver, respondete
      </p>
      <h2 className="text-2xl font-semibold leading-snug sm:text-3xl" style={{ color: 'var(--fp-ink)' }}>
        {card.prompt}
      </h2>

      {revealed ? (
        <div className="rounded-xl border px-4 py-4" style={{ background: 'var(--fp-surface)', borderColor: 'color-mix(in srgb, var(--fp-accent) 35%, transparent)' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--fp-accent)' }}>La respuesta</p>
          <p className="mt-1 text-lg leading-relaxed" style={{ color: 'var(--fp-ink)' }}>{card.answer}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="self-start rounded-xl px-5 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}
        >
          Ver la respuesta
        </button>
      )}
    </PostShell>
  );
}
