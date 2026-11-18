'use client';

/**
 * "Save for later": a real action, not a like. The saved items of a lesson
 * live on this device (localStorage), keyed by what the post shows (its asset
 * id), so the same quiz saved on Monday is still saved when it comes back.
 * A tiny external store: toggling re-renders only the cards that read it.
 */

import { useSyncExternalStore } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';

const PREFIX = 'jarre-feed-saved:';

/** What a post is about, independent of when it shows up in the stream. */
export function savedId(post: FeedPost): string {
  const asset = post.quizId ?? post.cardId ?? post.complexityId ?? post.codeId ?? post.drillSlug ?? '';
  return `${post.kind}:${post.conceptId}:${asset}`;
}

export interface SavedStore {
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  count: () => number;
  subscribe: (onChange: () => void) => () => void;
  /** A version number that changes on every toggle (the snapshot). */
  version: () => number;
}

export function createSavedStore(resourceId: string): SavedStore {
  const key = PREFIX + resourceId;
  let items = new Set<string>();
  let v = 0;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (raw) items = new Set(JSON.parse(raw) as string[]);
  } catch {
    // No storage: saving still works for this visit.
  }
  const listeners = new Set<() => void>();
  return {
    has: (id) => items.has(id),
    count: () => items.size,
    version: () => v,
    toggle(id) {
      items = new Set(items);
      if (items.has(id)) items.delete(id);
      else items.add(id);
      v++;
      try {
        window.localStorage.setItem(key, JSON.stringify([...items]));
      } catch {
        // Ignore: kept in memory.
      }
      for (const l of listeners) l();
    },
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
  };
}

const noop = () => () => {};

/** Re-render when the saved set changes; returns the store's version. */
export function useSavedVersion(store: SavedStore | null): number {
  return useSyncExternalStore(store ? store.subscribe : noop, store ? store.version : () => 0, () => 0);
}
