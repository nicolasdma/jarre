'use client';

/**
 * What every card needs from the feed, without threading it through each
 * post: the graph, the topic accounts, the one audio controller and the saved
 * store. Provided once by <Feed>; stable for the feed's life, so reading it
 * never re-renders a card.
 */

import { createContext, useContext } from 'react';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import type { FeedAccount } from '@/lib/feed/feed-identity';
import type { FeedAudioController } from './feed-audio';
import type { SavedStore } from './feed-saved';

export interface FeedContextValue {
  graph: FeedGraph;
  accounts: Record<string, FeedAccount>;
  controller: FeedAudioController | null;
  saved: SavedStore | null;
  /**
   * A drill's playable recording URL: the one signed at page load, or a
   * re-signed one in a long session (feed.tsx, POST /api/feed/sign-audio).
   */
  audioUrl: (slug: string | undefined) => string | null;
}

export const FeedContext = createContext<FeedContextValue | null>(null);

export function useFeedContext(): FeedContextValue {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeedContext outside <Feed>');
  return ctx;
}
