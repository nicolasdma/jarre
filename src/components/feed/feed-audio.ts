/**
 * ONE audio element and ONE clock for the whole feed.
 *
 * The feed is, for audio, a vertical video feed: only the post in view may
 * sound, never two at once, and never without a gesture first. Making an
 * <audio> per post (as useDrillAudio does, one per src) would mean a long list
 * of decoders on mobile, which is exactly what overheats the owner's machine.
 * So the whole feed shares one HTMLAudioElement: when the active post changes,
 * the controller re-points `src` to that drill's signed URL and plays it.
 *
 * Two stores keep React quiet:
 * - `time` (TimeStore, reused from practice): the playhead. Only the component
 *   that reads it with useSyncExternalStore (the active post's caption/bar)
 *   re-renders as it moves. The feed container and the other posts do NOT.
 * - a status snapshot (active key, playing, unlocked, ready, duration), also
 *   read with useSyncExternalStore, so scrolling never re-renders the feed.
 *
 * `prime()` is the iOS unlock: a muted play inside the first gesture, after
 * which the element may play on its own (the same trick as
 * use-drill-audio.ts:201). Reused, not reinvented.
 *
 * The element is injected so this is testable without a DOM
 * (__tests__/feed-audio.test.ts passes a fake); in the browser it defaults to
 * `new Audio()`.
 */

import { createTimeStore, type TimeStore } from '@/components/practice/time-store';

/** The slice of HTMLAudioElement the controller uses. */
export interface AudioElementLike {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  preload: string;
  loop: boolean;
  play: () => Promise<void> | void;
  pause: () => void;
  load: () => void;
  removeAttribute: (name: string) => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

export interface FeedAudioStatus {
  /** Key of the post whose audio is loaded, or null. */
  activeKey: string | null;
  playing: boolean;
  /** The one gesture to let audio play on its own has happened. */
  unlocked: boolean;
  ready: boolean;
  /** Seconds, 0 until known. */
  duration: number;
  /** The active post has a recording to play (vs text-only). */
  hasAudio: boolean;
}

export interface FeedAudioController {
  time: TimeStore;
  getStatus: () => FeedAudioStatus;
  subscribe: (onChange: () => void) => () => void;
  /**
   * Make this post the one that sounds. Pauses the previous, re-points src,
   * and plays from the start when unlocked and it has audio. `null` src is a
   * text-only post: nothing plays, the clock resets.
   */
  setActive: (key: string, src: string | null) => void;
  /** Unlock audio inside a user gesture (iOS). Idempotent. */
  prime: () => void;
  /** Play or pause the active post. A no-op for a text-only post. */
  toggle: () => void;
  play: () => void;
  pause: () => void;
  /** Pause without changing which post is active (e.g. tab hidden, reduced motion). */
  suspend: () => void;
  /** Turn autoplay-on-active on or off at runtime (reduced motion toggled). */
  setAutoplay: (on: boolean) => void;
  dispose: () => void;
}

export const FEED_AUDIO_IDLE: FeedAudioStatus = { activeKey: null, playing: false, unlocked: false, ready: false, duration: 0, hasAudio: false };
const IDLE = FEED_AUDIO_IDLE;

export interface FeedAudioOptions {
  element?: AudioElementLike;
  /** Autoplay the active post once unlocked. Off (reduced motion) → audio waits for a tap. */
  autoplay?: boolean;
}

function defaultElement(): AudioElementLike {
  // new Audio() only exists in the browser; the controller is created client-side.
  return new Audio() as unknown as AudioElementLike;
}

export function createFeedAudio(options: FeedAudioOptions = {}): FeedAudioController {
  const el = options.element ?? defaultElement();
  el.preload = 'auto';
  el.loop = false;
  let autoplay = options.autoplay ?? true;

  const time = createTimeStore();
  let status: FeedAudioStatus = IDLE;
  const listeners = new Set<() => void>();
  let currentSrc: string | null = null;

  function publish(next: Partial<FeedAudioStatus>): void {
    const merged = { ...status, ...next };
    if (
      merged.activeKey === status.activeKey &&
      merged.playing === status.playing &&
      merged.unlocked === status.unlocked &&
      merged.ready === status.ready &&
      merged.duration === status.duration &&
      merged.hasAudio === status.hasAudio
    ) {
      return;
    }
    status = merged;
    for (const l of listeners) l();
  }

  const onTime = () => time.set(el.currentTime);
  const onPlay = () => publish({ playing: true });
  const onPause = () => publish({ playing: false });
  const onEnded = () => {
    publish({ playing: false });
    time.set(el.currentTime);
  };
  const onMeta = () => publish({ ready: true, duration: Number.isFinite(el.duration) ? el.duration : 0 });

  el.addEventListener('timeupdate', onTime);
  el.addEventListener('seeked', onTime);
  el.addEventListener('play', onPlay);
  el.addEventListener('pause', onPause);
  el.addEventListener('ended', onEnded);
  el.addEventListener('loadedmetadata', onMeta);

  function startActive(): void {
    if (!currentSrc) return;
    if (!status.unlocked || !autoplay) return;
    if (el.currentTime !== 0) el.currentTime = 0;
    void Promise.resolve(el.play()).catch(() => undefined);
  }

  return {
    time,
    getStatus: () => status,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },

    setActive(key, src) {
      if (key === status.activeKey && src === currentSrc) return;
      // Stop whatever was sounding before anything else: only one plays.
      el.pause();
      currentSrc = src;
      time.set(0);
      if (src) {
        el.src = src;
        el.load();
        publish({ activeKey: key, playing: false, ready: false, duration: 0, hasAudio: true });
        startActive();
      } else {
        el.removeAttribute('src');
        el.load();
        publish({ activeKey: key, playing: false, ready: false, duration: 0, hasAudio: false });
      }
    },

    prime() {
      if (status.unlocked) return;
      const wasMuted = el.muted;
      el.muted = true;
      const restore = () => {
        el.pause();
        el.currentTime = 0;
        el.muted = wasMuted;
      };
      Promise.resolve(el.play()).then(restore, restore);
      publish({ unlocked: true });
      // If a post is already active, let it sound now that we are unlocked.
      startActive();
    },

    toggle() {
      if (!currentSrc) return;
      if (el.paused) this.play();
      else this.pause();
    },

    play() {
      if (!currentSrc) return;
      void Promise.resolve(el.play()).catch(() => undefined);
    },

    pause() {
      el.pause();
    },

    suspend() {
      el.pause();
    },

    setAutoplay(on) {
      autoplay = on;
    },

    dispose() {
      el.pause();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeked', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeAttribute('src');
      el.load();
      listeners.clear();
    },
  };
}
