import { describe, expect, it, vi } from 'vitest';
import { createFeedAudio, type AudioElementLike } from '../feed-audio';

/** A fake HTMLAudioElement: counts calls and lets the test fire media events. */
class FakeAudio implements AudioElementLike {
  src = '';
  currentTime = 0;
  duration = NaN;
  paused = true;
  muted = false;
  preload = '';
  loop = false;
  playCalls = 0;
  pauseCalls = 0;
  loadCalls = 0;
  private handlers = new Map<string, Set<() => void>>();

  play() {
    this.playCalls++;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.pauseCalls++;
    this.paused = true;
  }
  load() {
    this.loadCalls++;
  }
  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }
  addEventListener(type: string, fn: () => void) {
    const set = this.handlers.get(type) ?? new Set();
    set.add(fn);
    this.handlers.set(type, set);
  }
  removeEventListener(type: string, fn: () => void) {
    this.handlers.get(type)?.delete(fn);
  }
  emit(type: string) {
    for (const fn of this.handlers.get(type) ?? []) fn();
  }
  tickTo(t: number) {
    this.currentTime = t;
    this.emit('timeupdate');
  }
}

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe('feed audio: one element, only the active post sounds', () => {
  it('re-points the single element and resets the clock on switch, pausing the previous', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime(); // unlock so switches may play
    audio.setActive('postA', 'https://cdn/a.m4a');
    expect(el.src).toBe('https://cdn/a.m4a');
    expect(audio.getStatus().activeKey).toBe('postA');
    expect(audio.getStatus().hasAudio).toBe(true);

    const pausesBefore = el.pauseCalls;
    audio.setActive('postB', 'https://cdn/b.m4a');
    expect(el.src).toBe('https://cdn/b.m4a'); // same element, new src
    expect(el.pauseCalls).toBeGreaterThan(pausesBefore); // the previous was paused first
    expect(audio.time.get()).toBe(0); // clock reset for the new post
  });

  it('does not sound before the unlock gesture', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.setActive('postA', 'https://cdn/a.m4a');
    expect(el.playCalls).toBe(0); // no autoplay until primed
    expect(audio.getStatus().unlocked).toBe(false);
  });

  it('unlocks on prime and then plays the active post', async () => {
    const el = new FakeAudio();
    el.muted = false;
    const audio = createFeedAudio({ element: el });
    audio.setActive('postA', 'https://cdn/a.m4a');
    audio.prime();
    expect(audio.getStatus().unlocked).toBe(true);
    expect(el.playCalls).toBeGreaterThan(0);
    await flush();
    expect(el.muted).toBe(false); // prime restored the mute state
  });

  it('the first gesture makes the visible post actually sound (not paused by the unlock)', async () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.setActive('postA', 'https://cdn/a.m4a');
    audio.prime();
    await flush();
    await flush();
    expect(el.paused).toBe(false);
    expect(el.muted).toBe(false);
    expect(el.src).toBe('https://cdn/a.m4a');
  });

  it('a play asked right after an unlock with nothing active is not undone by the unlock', async () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime(); // muted warm-up, nothing active yet
    audio.setActive('postB', 'https://cdn/b.m4a');
    audio.play();
    await flush();
    await flush();
    expect(el.paused).toBe(false);
    expect(el.muted).toBe(false);
  });

  it('an unlock with nothing to play rewinds and unmutes its warm-up', async () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime();
    await flush();
    expect(el.paused).toBe(true);
    expect(el.muted).toBe(false);
  });

  it('a text-only post (no recording) clears the source and never plays', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime();
    const afterPrime = el.playCalls;
    audio.setActive('postText', null);
    expect(audio.getStatus().hasAudio).toBe(false);
    expect(el.src).toBe('');
    expect(el.playCalls).toBe(afterPrime); // a text-only post never plays
    expect(audio.time.get()).toBe(0);
  });
});

describe('feed audio: scrolling/time does not re-render the feed', () => {
  it('time ticks notify the clock store only, never the status store', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime();
    audio.setActive('postA', 'https://cdn/a.m4a');

    const statusListener = vi.fn();
    const timeListener = vi.fn();
    audio.subscribe(statusListener);
    audio.time.subscribe(timeListener);

    el.tickTo(1);
    el.tickTo(2);
    el.tickTo(3);

    expect(timeListener).toHaveBeenCalledTimes(3); // only the active post's bar reads this
    expect(statusListener).not.toHaveBeenCalled(); // the feed container never re-renders per tick
  });

  it('publishes a stable status snapshot (same reference until something changes)', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    const first = audio.getStatus();
    expect(audio.getStatus()).toBe(first); // stable for useSyncExternalStore
    audio.prime();
    expect(audio.getStatus()).not.toBe(first); // a real change swaps the snapshot
  });

  it('reports ready and duration from loadedmetadata', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.setActive('postA', 'https://cdn/a.m4a');
    el.duration = 12.5;
    el.emit('loadedmetadata');
    expect(audio.getStatus().ready).toBe(true);
    expect(audio.getStatus().duration).toBe(12.5);
  });
});

describe('feed audio: reduced motion / controls', () => {
  it('with autoplay off, audio waits for a tap even when active and unlocked', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el, autoplay: false });
    audio.prime();
    const afterPrime = el.playCalls;
    audio.setActive('postA', 'https://cdn/a.m4a');
    expect(el.playCalls).toBe(afterPrime); // no autoplay
    audio.toggle(); // a tap plays it
    expect(el.playCalls).toBeGreaterThan(afterPrime);
  });

  it('toggle and pause control playback', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.prime();
    audio.setActive('postA', 'https://cdn/a.m4a');
    const plays = el.playCalls;
    el.paused = true;
    audio.toggle();
    expect(el.playCalls).toBe(plays + 1);
    audio.pause();
    expect(el.paused).toBe(true);
  });

  it('dispose detaches listeners and silences the element', () => {
    const el = new FakeAudio();
    const audio = createFeedAudio({ element: el });
    audio.setActive('postA', 'https://cdn/a.m4a');
    audio.dispose();
    expect(el.src).toBe('');
    const listener = vi.fn();
    audio.subscribe(listener);
    el.emit('loadedmetadata'); // detached: no publish
    expect(listener).not.toHaveBeenCalled();
  });
});
