'use client';

/** Routes a descriptor to its post component. All content comes from the graph. */

import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import type { FeedAudioController } from '../feed-audio';
import { ConceptNugget } from './concept-nugget';
import { TapQuiz } from './tap-quiz';
import { PredictReveal } from './predict-reveal';
import { SayIt } from './say-it';
import { Complexity } from './complexity';
import { CodeSnippet } from './code-snippet';
import { Milestone, type FeedStats } from './milestone';

export function PostCard({
  post,
  graph,
  controller,
  active,
  reducedMotion,
  stats,
}: {
  post: FeedPost;
  graph: FeedGraph;
  controller: FeedAudioController | null;
  active: boolean;
  reducedMotion: boolean;
  stats: FeedStats;
}) {
  switch (post.kind) {
    case 'nugget':
      return <ConceptNugget post={post} graph={graph} controller={controller} active={active} reducedMotion={reducedMotion} />;
    case 'tap-quiz':
      return <TapQuiz post={post} graph={graph} active={active} reducedMotion={reducedMotion} />;
    case 'predict':
      return <PredictReveal post={post} graph={graph} active={active} reducedMotion={reducedMotion} />;
    case 'say-it':
      return <SayIt post={post} graph={graph} controller={controller} active={active} reducedMotion={reducedMotion} />;
    case 'complexity':
      return <Complexity post={post} graph={graph} active={active} reducedMotion={reducedMotion} />;
    case 'code':
      return <CodeSnippet post={post} graph={graph} active={active} reducedMotion={reducedMotion} />;
    case 'milestone':
      return <Milestone post={post} stats={stats} active={active} reducedMotion={reducedMotion} />;
    default:
      return null;
  }
}

/** The audio the FEED plays for a post: only the nugget's recording. Say-it plays its own on reveal. */
export function feedAudioSrc(post: FeedPost, graph: FeedGraph): string | null {
  if (post.kind === 'nugget' && post.drillSlug) return graph.drills[post.drillSlug]?.audioUrl ?? null;
  return null;
}
