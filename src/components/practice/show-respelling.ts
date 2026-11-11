'use client';

/**
 * "Mostrar pronunciación": respellings under the key terms of every drill.
 * One switch for the whole practice, kept per device.
 */

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'jarre:practice:show-respelling';
const listeners = new Set<() => void>();
/** The value set on this page, so the switch works even when storage is blocked. */
let current: boolean | null = null;

function read(): boolean {
  if (current !== null) return current;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useShowRespelling(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => false);
  const set = useCallback((next: boolean) => {
    current = next;
    try {
      window.localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Private mode or storage full: the switch still works for this page.
    }
    listeners.forEach((l) => l());
  }, []);
  return [on, set];
}
