'use client';

/**
 * Code post: a coding problem's reference solution as a code screenshot on a
 * color backdrop (the editor window floats on the palette, like a shared
 * snippet), and under it the cost in big numbers: brute force → optimal when
 * the problem's approach names the brute force, else time · space. Passive: a
 * calm read. The caption is the problem in one line.
 *
 * In a lesson with JS | TS tabs (lessonHasCodeTabs, the same gate as the lesson
 * view) the editor window carries two file tabs, JS open by default and the
 * reader's session choice shared with the lesson.
 */

import { useState } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';
import { lessonHasCodeTabs } from '@/lib/lessons/code-tabs';
import { readCodeVariantPref, writeCodeVariantPref, type CodeVariant } from '@/lib/coding/code-tabs-pref';
import { bigOParts, firstSentence } from '@/lib/feed/feed-identity';
import { useFeedContext } from '../feed-context';
import { CardFrame, Caption, Media, lessonHrefFor } from './card-frame';
import { CodeImage, type CodeImageTabs } from './code-image';
import { useCodeVariants } from '../use-code-variants';

function fileName(id: string, ext: CodeVariant = 'ts'): string {
  return `${id}.${ext}`;
}

export function CodeSnippet({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts } = useFeedContext();
  const problem = post.codeId ? graph.code[post.codeId] : undefined;
  const variants = useCodeVariants(problem?.code ?? '', !!problem && lessonHasCodeTabs(graph.resourceId));
  // Cards only ever render on the client (the feed builds its posts after
  // mount), so the session's choice can seed the state directly. JS otherwise.
  const [variant, setVariant] = useState<CodeVariant>(readCodeVariantPref);
  if (!problem) return null;
  const account = post.conceptId ? accounts[post.conceptId] : undefined;
  const time = problem.time ? bigOParts(problem.time).big : null;
  const space = problem.space ? bigOParts(problem.space).big : null;
  const brute = problem.brute && problem.brute !== time ? problem.brute : null;
  const paper = post.profile.visual === 'raw';
  const tabs: CodeImageTabs | undefined = variants
    ? {
        label: 'Variante del código',
        items: [
          { id: 'js', filename: fileName(problem.id, 'js') },
          { id: 'ts', filename: fileName(problem.id, 'ts') },
        ],
        active: variant,
        onSelect: (id) => {
          const v: CodeVariant = id === 'ts' ? 'ts' : 'js';
          setVariant(v);
          writeCodeVariantPref(v);
        },
      }
    : undefined;
  const shownCode = variants ? variants[variant] : problem.code;

  const media = (
    <Media post={post} className="px-4 pb-5 pt-5 sm:px-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}>
          {problem.pattern}
        </span>
        <span className="text-[13px] font-bold" style={{ color: 'var(--fp-ink)' }}>{problem.title}</span>
      </div>
      <CodeImage code={shownCode} filename={fileName(problem.id)} tabs={tabs} theme={paper ? 'paper' : 'dark'} maxLines={13} />
      {(time || brute) && (
        <div className="mt-4 flex items-end justify-between gap-3 px-1">
          {brute ? (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--fp-soft)' }}>fuerza bruta</p>
                <p className="font-mono text-[30px] font-bold leading-none line-through decoration-2" style={{ color: 'var(--fp-soft)' }}>{brute}</p>
              </div>
              <span aria-hidden className="pb-1 text-[26px] font-light" style={{ color: 'var(--fp-soft)' }}>→</span>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--fp-accent)' }}>óptimo</p>
                <p className="font-mono text-[42px] font-black leading-none" style={{ color: 'var(--fp-ink)' }}>{time}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--fp-soft)' }}>tiempo</p>
                <p className="font-mono text-[40px] font-black leading-none" style={{ color: 'var(--fp-ink)' }}>{time}</p>
              </div>
              {space && (
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--fp-soft)' }}>espacio</p>
                  <p className="font-mono text-[28px] font-bold leading-none" style={{ color: 'var(--fp-soft)' }}>{space}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${problem.title}: código`}
      kindLabel="Código · solución"
      media={media}
      actions={{ lessonHref: lessonHrefFor(graph.resourceId, post) }}
      caption={
        <Caption handle={account?.handle} lang="en">
          {firstSentence(problem.statement)}
        </Caption>
      }
    />
  );
}
