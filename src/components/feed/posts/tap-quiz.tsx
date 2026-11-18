'use client';

/**
 * Quiz as a poll card: a "QUIZ" sticker, the question in bold, the options as
 * poll rows. Tap one and the right row fills with the accent (a ✓), yours is
 * marked if it was another. No percentages and no vote counts: there is no
 * crowd, so there is nothing to count. The why goes in the caption.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import { useFeedContext } from '../feed-context';
import { InlineText } from './inline-text';
import { CardFrame, Caption, Media, lessonHrefFor, participationHint } from './card-frame';

export function TapQuiz({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts } = useFeedContext();
  const quiz = post.quizId ? graph.quizzes[post.quizId] : undefined;
  const [picked, setPicked] = useState<string | null>(null);
  if (!quiz) return null;
  const account = post.conceptId ? accounts[post.conceptId] : undefined;

  const options: { label: string; text: string }[] =
    quiz.format === 'tf'
      ? [{ label: 'true', text: 'Verdadero' }, { label: 'false', text: 'Falso' }]
      : quiz.options ?? [];
  const revealed = picked !== null;
  const tilt = post.paletteIndex % 2 === 0 ? '-rotate-3' : 'rotate-2';

  const media = (
    <Media post={post} className="px-5 pb-6 pt-6">
      <span
        className={cn('inline-block rounded-md px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.18em]', tilt)}
        style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}
      >
        Quiz
      </span>
      <h2 className="mt-4 text-[22px] font-extrabold leading-[1.2] tracking-[-0.01em]" style={{ color: 'var(--fp-ink)' }}>
        <InlineText text={quiz.question} />
      </h2>
      <div className="mt-5 flex flex-col gap-2.5" role="group" aria-label="Opciones">
        {options.map((o, i) => {
          const isCorrect = o.label === quiz.correctAnswer;
          const isPicked = picked === o.label;
          const fill = revealed && isCorrect;
          const wrong = revealed && isPicked && !isCorrect;
          return (
            <button
              key={o.label}
              type="button"
              disabled={revealed}
              onClick={() => setPicked(o.label)}
              aria-label={`${o.text}${revealed ? (isCorrect ? ' (correcta)' : isPicked ? ' (tu elección)' : '') : ''}`}
              className={cn(
                'relative flex min-h-[48px] w-full items-center gap-3 overflow-hidden rounded-2xl border-2 px-3.5 py-2.5 text-left text-[15px] font-medium transition-opacity',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                revealed && !isCorrect && !isPicked && 'opacity-45',
              )}
              style={{ borderColor: fill ? 'var(--fp-accent)' : 'color-mix(in srgb, var(--fp-ink) 25%, transparent)', color: 'var(--fp-ink)' }}
            >
              {/* The fill: grows across the right row on reveal. */}
              <span
                aria-hidden
                className={cn('absolute inset-y-0 left-0 transition-[width] duration-700 ease-out motion-reduce:transition-none', fill ? 'w-full' : 'w-0')}
                style={{ background: 'var(--fp-accent)' }}
              />
              <span
                aria-hidden
                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={
                  fill
                    ? { background: 'var(--fp-on-accent)', color: 'var(--fp-accent)' }
                    : { background: 'color-mix(in srgb, var(--fp-ink) 12%, transparent)', color: 'var(--fp-ink)' }
                }
              >
                {fill ? '✓' : wrong ? '×' : quiz.format === 'tf' ? (i === 0 ? 'V' : 'F') : o.label}
              </span>
              <span className={cn('relative', wrong && 'line-through')} style={fill ? { color: 'var(--fp-on-accent)' } : undefined}>
                <InlineText text={o.text} />
              </span>
            </button>
          );
        })}
      </div>
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${account?.title ?? 'Quiz'}: quiz`}
      kindLabel="Quiz"
      hint={participationHint(post)}
      media={media}
      actions={{ onRepeat: revealed ? () => setPicked(null) : undefined, lessonHref: lessonHrefFor(graph.resourceId, post) }}
      caption={
        <Caption handle={account?.handle}>
          {revealed ? <InlineText text={quiz.explanation} /> : 'Elegí una, o seguí de largo. La explicación aparece acá.'}
        </Caption>
      }
    />
  );
}
