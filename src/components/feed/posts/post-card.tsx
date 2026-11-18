'use client';

/** Routes a descriptor to its card. All content comes from the graph (feed context). */

import type { FeedPost } from '@/lib/feed/feed-post';
import { ConceptNugget } from './concept-nugget';
import { TapQuiz } from './tap-quiz';
import { PredictReveal } from './predict-reveal';
import { SayIt } from './say-it';
import { Complexity } from './complexity';
import { CodeSnippet } from './code-snippet';
import { VideoPost } from './video-post';

export function PostCard({
  post,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  active: boolean;
  reducedMotion: boolean;
}) {
  switch (post.kind) {
    case 'nugget':
      return <ConceptNugget post={post} active={active} reducedMotion={reducedMotion} />;
    case 'tap-quiz':
      return <TapQuiz post={post} active={active} reducedMotion={reducedMotion} />;
    case 'predict':
      return <PredictReveal post={post} active={active} reducedMotion={reducedMotion} />;
    case 'say-it':
      return <SayIt post={post} active={active} reducedMotion={reducedMotion} />;
    case 'complexity':
      return <Complexity post={post} active={active} reducedMotion={reducedMotion} />;
    case 'code':
      return <CodeSnippet post={post} active={active} reducedMotion={reducedMotion} />;
    case 'video':
      return <VideoPost post={post} active={active} reducedMotion={reducedMotion} />;
    default:
      return null;
  }
}

/** The audio the FEED autoplays for the in-view post: only the nugget's recording. Say-it plays its own on reveal. */
export function feedAudioSrc(post: FeedPost, audioUrl: (slug: string | undefined) => string | null): string | null {
  return post.kind === 'nugget' ? audioUrl(post.drillSlug) : null;
}
