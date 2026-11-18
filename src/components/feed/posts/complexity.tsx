'use client';

/**
 * Big-O fragment: read the code, predict its time complexity (tap an option),
 * then see time and space with their reasons and the sentence to say on the
 * call. A projection of interview.coding.complexity_drill. Optional.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { ParticipationPill, PostShell, TapButton } from './post-shell';

export function Complexity({
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
  const item = post.complexityId ? graph.complexity[post.complexityId] : undefined;
  const [picked, setPicked] = useState<string | null>(null);
  if (!item) return null;
  const revealed = picked !== null;

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${item.title}: Big-O`}
      eyebrow={<>
        <span>Big-O · {item.title}</span>
        <ParticipationPill post={post} />
      </>}
      hint={revealed ? undefined : 'Decí (o tocá) el tiempo · o seguí scrolleando'}
    >
      <pre
        className="overflow-x-auto rounded-xl px-4 py-3 text-[13px] leading-relaxed"
        style={{ background: 'var(--fp-surface)', color: 'var(--fp-ink)', border: '1px solid color-mix(in srgb, var(--fp-soft) 30%, transparent)' }}
      >
        <code lang="en">{item.code}</code>
      </pre>

      <p className="text-sm font-medium" style={{ color: 'var(--fp-soft)' }}>¿Qué tiempo es?</p>
      <div className="flex flex-wrap gap-2">
        {item.timeOptions.map((opt) => {
          const isCorrect = opt === item.timeAnswer;
          const isPicked = picked === opt;
          const show = revealed && (isCorrect || isPicked);
          return (
            <TapButton
              key={opt}
              onClick={() => !revealed && setPicked(opt)}
              selected={show && isCorrect}
              className={cn('font-mono text-sm', isPicked && !isCorrect && 'line-through opacity-80')}
            >
              {opt}
            </TapButton>
          );
        })}
      </div>

      {revealed && (
        <div className="space-y-2 rounded-xl border px-4 py-4" style={{ background: 'var(--fp-surface)', borderColor: 'color-mix(in srgb, var(--fp-accent) 35%, transparent)' }}>
          <p style={{ color: 'var(--fp-ink)' }}><span className="font-mono font-semibold">Time {item.timeAnswer}</span> · <span lang="es" style={{ color: 'var(--fp-soft)' }}>{item.timeWhy}</span></p>
          <p style={{ color: 'var(--fp-ink)' }}><span className="font-mono font-semibold">Space {item.spaceAnswer}</span> · <span lang="es" style={{ color: 'var(--fp-soft)' }}>{item.spaceWhy}</span></p>
          <p className="border-l-2 pl-3 text-sm leading-relaxed" lang="en" style={{ color: 'var(--fp-ink)', borderColor: 'color-mix(in srgb, var(--fp-accent) 50%, transparent)' }}>
            {item.say.replace(/\s*\/\s*/g, ' ')}
          </p>
        </div>
      )}
    </PostShell>
  );
}
