'use client';

/**
 * React access to the feed's single audio controller (feed-audio.ts).
 *
 * The controller is created on the client only (new Audio() has no server
 * equivalent) and disposed with the feed. Two reader hooks keep the feed
 * quiet:
 * - useFeedAudioStatus: the active-post chrome re-renders when play/active
 *   state changes, which is rare.
 * - useFeedAudioTime: the active post's caption/progress re-renders per tick;
 *   nothing else does (the store is outside React, time-store.ts).
 *
 * The feed container passes the controller down by prop, so a scroll (a time
 * tick) never re-renders the container or the off-screen posts.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createFeedAudio, FEED_AUDIO_IDLE, type FeedAudioController, type FeedAudioStatus } from './feed-audio';

const noop = () => () => {};

/** Create the one controller for this feed, pausing on tab-hide and disposing on unmount. */
export function useFeedAudio(autoplay: boolean): FeedAudioController | null {
  const [controller, setController] = useState<FeedAudioController | null>(null);

  useEffect(() => {
    const c = createFeedAudio({ autoplay });
    setController(c);
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.hidden) c.suspend();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      c.dispose();
    };
    // Created once; autoplay changes flow through setAutoplay below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller?.setAutoplay(autoplay);
  }, [controller, autoplay]);

  return controller;
}

export function useFeedAudioStatus(controller: FeedAudioController | null): FeedAudioStatus {
  return useSyncExternalStore(
    controller ? controller.subscribe : noop,
    controller ? controller.getStatus : () => FEED_AUDIO_IDLE,
    () => FEED_AUDIO_IDLE,
  );
}

export function useFeedAudioTime(controller: FeedAudioController | null): number {
  return useSyncExternalStore(
    controller ? controller.time.subscribe : noop,
    controller ? controller.time.get : () => 0,
    () => 0,
  );
}
