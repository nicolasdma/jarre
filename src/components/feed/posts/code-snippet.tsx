'use client';

/**
 * Code snippet: a coding problem's reference solution with its pattern and one
 * line of what it is. Passive: a calm read as you scroll. A projection of
 * interview.coding.problems.
 */

import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { PostShell } from './post-shell';

/** First sentence of the statement, as the one-liner. */
function oneLine(statement: string): string {
  const m = statement.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : statement).trim();
}

export function CodeSnippet({
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
  const problem = post.codeId ? graph.code[post.codeId] : undefined;
  if (!problem) return null;

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${problem.title}: código`}
      eyebrow={<span>{problem.pattern} · {problem.title}</span>}
      hint="Solo mirá · seguí cuando quieras"
    >
      <p className="text-base leading-relaxed" lang="en" style={{ color: 'var(--fp-soft)' }}>
        {oneLine(problem.statement)}
      </p>
      <pre
        className="max-h-[52vh] overflow-auto rounded-xl px-4 py-3 text-[12.5px] leading-relaxed"
        style={{ background: 'var(--fp-surface)', color: 'var(--fp-ink)', border: '1px solid color-mix(in srgb, var(--fp-soft) 30%, transparent)' }}
      >
        <code lang="en">{problem.code}</code>
      </pre>
    </PostShell>
  );
}
