/**
 * Small pure helpers for a card's chrome: its honest participation hint and
 * where it lives in the lesson (deep links the learn view understands).
 */

import type { FeedPost } from './feed-post';

/** The participation hint for the header: honest, never a demand. */
export function participationHint(post: FeedPost): string | undefined {
  if (post.profile.participation === 'active-optional') return 'decilo si querés';
  if (post.profile.participation === 'optional-tap') return 'tocá si querés';
  return undefined;
}

/** Where a post lives in the lesson (deep links the learn view understands). */
export function lessonHrefFor(resourceId: string, post: FeedPost): string {
  const base = `/learn/${encodeURIComponent(resourceId)}`;
  if (post.drillSlug) return `${base}?step=practice&drill=${encodeURIComponent(post.drillSlug)}&mode=listen`;
  if (post.codeId) return `${base}?step=coding`;
  if (post.complexityId) return `${base}?step=coding`;
  return `${base}?step=learn`;
}
