'use client';

/**
 * Predict, then flip: a recall card that is literally a card. The front is the
 * prompt over a huge "?"; tap it (after answering in your head, or not) and it
 * turns over to the answer on the inverted colors. Tap again to turn it back.
 * Reduced motion swaps the faces without the turn. A projection of the
 * concept's recall concept_cards.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import { useFeedContext } from '../feed-context';
import { InlineText } from './inline-text';
import { CardFrame, Caption, Media, lessonHrefFor, participationHint } from './card-frame';

export function PredictReveal({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts } = useFeedContext();
  const card = post.cardId ? graph.cards[post.cardId] : undefined;
  const [flipped, setFlipped] = useState(false);
  if (!card) return null;
  const account = post.conceptId ? accounts[post.conceptId] : undefined;
  const turn = !reducedMotion;

  const face = 'absolute inset-0 flex flex-col px-6 pb-6 pt-6 [backface-visibility:hidden]';

  const media = (
    <Media post={post} className="aspect-[4/5] [perspective:1400px]" style={{ background: 'var(--fp-bg)' }}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? 'Dar vuelta: ver la pregunta' : 'Dar vuelta: ver la respuesta'}
        className="absolute inset-3 rounded-[18px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          className={cn('relative block h-full w-full [transform-style:preserve-3d]', turn && 'transition-transform duration-[650ms] ease-[cubic-bezier(.2,.7,.2,1)]')}
          style={{ transform: turn && flipped ? 'rotateY(180deg)' : undefined }}
        >
          {/* Front: the prompt. */}
          <span
            className={cn(face, 'rounded-[18px] border-2', !turn && flipped && 'invisible')}
            style={{ borderColor: 'color-mix(in srgb, var(--fp-ink) 22%, transparent)', color: 'var(--fp-ink)' }}
            aria-hidden={flipped}
          >
            <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-4 select-none font-black leading-none" style={{ fontSize: 300, color: 'var(--fp-accent)', opacity: 0.16 }}>
              ?
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--fp-soft)' }}>Pensalo antes</span>
            <span className="relative mt-auto mb-auto block text-[28px] font-extrabold leading-[1.12] tracking-[-0.015em]"><InlineText text={card.prompt} /></span>
            <span
              className="relative self-start rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
              style={{ background: 'var(--fp-ink)', color: 'var(--fp-bg)' }}
            >
              Tocá para dar vuelta ↻
            </span>
          </span>
          {/* Back: the answer, on inverted colors. */}
          <span
            className={cn(face, 'rounded-[18px]', !turn && !flipped && 'invisible')}
            style={{ background: 'var(--fp-ink)', color: 'var(--fp-bg)', transform: turn ? 'rotateY(180deg)' : undefined }}
            aria-hidden={!flipped}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">La respuesta</span>
            <span lang="en" className="mt-auto mb-auto block text-[19px] font-semibold leading-[1.4]"><InlineText text={card.answer} /></span>
            <span className="text-[12px] opacity-70">{card.prompt}</span>
          </span>
        </span>
      </button>
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${account?.title ?? 'Tarjeta'}: predecí y da vuelta`}
      kindLabel="Acordate · tarjeta"
      hint={participationHint(post)}
      media={media}
      actions={{ onRepeat: flipped ? () => setFlipped(false) : undefined, lessonHref: lessonHrefFor(graph.resourceId, post) }}
      caption={
        <Caption handle={account?.handle}>
          {flipped ? `Si te salió parecido, ya está. ${account?.title ?? ''}` : 'Respondé en tu cabeza, después dala vuelta.'}
        </Caption>
      }
    />
  );
}
