import { describe, expect, it } from 'vitest';
import { createTimeStore } from '../time-store';

describe('drill audio clock', () => {
  it('tells subscribers only when the time changes', () => {
    const store = createTimeStore();
    const seen: number[] = [];
    const off = store.subscribe(() => seen.push(store.get()));
    store.set(0);
    store.set(1.25);
    store.set(1.25);
    store.set(2.5);
    expect(seen).toEqual([1.25, 2.5]);
    off();
    store.set(3);
    expect(seen).toEqual([1.25, 2.5]);
    expect(store.get()).toBe(3);
  });
});
