'use client';

/**
 * Big-O stat card: a fragment of code on top, and the answer as ONE huge
 * number, "O(?)" until you tap your guess, then the real time in display type
 * with space next to it as a second stat. Your miss (if any) stays visible,
 * struck through, as the contrast. A projection of
 * interview.coding.complexity_drill. Optional: scroll past and it is just a
 * question you thought about.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import { bigOParts } from '@/lib/feed/feed-identity';
import { useFeedContext } from '../feed-context';
import { CardFrame, Caption, Media, lessonHrefFor, participationHint } from './card-frame';
import { CodeImage } from './code-image';

export function Complexity({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts } = useFeedContext();
  const item = post.complexityId ? graph.complexity[post.complexityId] : undefined;
  const [picked, setPicked] = useState<string | null>(null);
  if (!item) return null;
  const account = post.conceptId ? accounts[post.conceptId] : undefined;
  const revealed = picked !== null;
  const time = bigOParts(item.timeAnswer).big;
  const space = bigOParts(item.spaceAnswer).big;
  const missed = revealed && picked !== item.timeAnswer;
  const lines = item.code.split('\n').length;

  const media = (
    <Media post={post} className="flex flex-col">
      <div className="px-4 pt-4">
        <CodeImage
          code={item.code}
          filename={item.title}
          theme={post.profile.visual === 'raw' ? 'paper' : 'dark'}
          maxLines={9}
          fontSize={lines > 6 ? 12 : 13.5}
        />
      </div>
      <div className="px-5 pb-6 pt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--fp-soft)' }}>
            {revealed ? 'tiempo' : '¿qué tiempo es?'}
          </p>
          {revealed && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--fp-soft)' }}>espacio</p>
          )}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p
            className={cn('font-mono font-black leading-[0.9] tracking-[-0.04em]', time.length > 8 ? 'text-[56px]' : 'text-[84px]')}
            style={{ color: revealed ? 'var(--fp-ink)' : 'color-mix(in srgb, var(--fp-ink) 30%, transparent)' }}
            aria-live="polite"
          >
            {revealed ? time : 'O(?)'}
          </p>
          {revealed && (
            <p className="pb-2 font-mono text-[30px] font-bold leading-none" style={{ color: 'var(--fp-soft)' }}>{space}</p>
          )}
        </div>
        {missed && (
          <p className="mt-2 text-[13px]" style={{ color: 'var(--fp-soft)' }}>
            dijiste <span className="font-mono line-through">{picked}</span>
          </p>
        )}
        {!revealed && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Elegí el tiempo">
            {item.timeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPicked(opt)}
                className="min-h-[44px] rounded-full border-2 px-4 font-mono text-[14px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: 'color-mix(in srgb, var(--fp-ink) 35%, transparent)', color: 'var(--fp-ink)' }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${item.title}: Big-O`}
      kindLabel="Big-O · adiviná el costo"
      hint={participationHint(post)}
      media={media}
      actions={{ onRepeat: revealed ? () => setPicked(null) : undefined, lessonHref: lessonHrefFor(graph.resourceId, post) }}
      caption={
        <Caption handle={account?.handle} lang={revealed ? undefined : 'es'}>
          {revealed ? (
            <>
              <span lang="es">{item.timeWhy} {item.spaceWhy}</span>{' '}
              <span lang="en" className="italic">“{item.say.replace(/\s*\/\s*/g, ' ')}”</span>
            </>
          ) : (
            <>{item.title}. Leé el código y elegí, o seguí de largo.</>
          )}
        </Caption>
      }
    />
  );
}
