/**
 * A number that changes often (an audio clock) kept outside React state:
 * subscribers are told only when it changes, and only the components that
 * read it with useSyncExternalStore re-render. Before, the drill's clock was
 * state of the whole trainer and re-rendered it on every animation frame
 * while the audio played.
 */
export interface TimeStore {
  get: () => number;
  set: (seconds: number) => void;
  subscribe: (onChange: () => void) => () => void;
}

export function createTimeStore(initial = 0): TimeStore {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (seconds) => {
      if (seconds === value) return;
      value = seconds;
      for (const l of listeners) l();
    },
    subscribe: (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
  };
}
