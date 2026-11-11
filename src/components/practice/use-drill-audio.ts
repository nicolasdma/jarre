'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackRate = 0.75 | 1;

export interface DrillAudio {
  available: boolean;
  playing: boolean;
  ready: boolean;
  duration: number;
  time: number;
  rate: PlaybackRate;
  loop: boolean;
  setRate: (rate: PlaybackRate) => void;
  setLoop: (loop: boolean) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  /**
   * Play [startSec, endSec) and resolve when it ends (or is interrupted, with false).
   * Checked every animation frame, so the stop lands within ~16 ms.
   */
  playSegment: (startSec: number, endSec: number) => Promise<boolean>;
}

interface ElementState {
  src: string | null;
  playing: boolean;
  ready: boolean;
  duration: number;
  time: number;
}

const IDLE = { playing: false, ready: false, duration: 0, time: 0 };

/** One HTMLAudioElement per drill; rate and loop survive drill changes. */
export function useDrillAudio(src: string | null): DrillAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentRef = useRef<{ end: number; resolve: (done: boolean) => void } | null>(null);
  const frameRef = useRef<number | null>(null);
  // Element state is tagged with its src, so a new drill reads as fresh without resetting in an effect.
  const [el, setEl] = useState<ElementState>({ src: null, ...IDLE });
  const patch = useCallback((forSrc: string, next: Partial<Omit<ElementState, 'src'>>) => {
    setEl((prev) => ({ ...(prev.src === forSrc ? prev : { ...IDLE }), ...next, src: forSrc }));
  }, []);
  const { playing, ready, duration, time } = el.src === src ? el : IDLE;
  const [rate, setRateState] = useState<PlaybackRate>(1);
  const [loop, setLoopState] = useState(false);
  const rateRef = useRef(rate);
  const loopRef = useRef(loop);

  const settleSegment = useCallback((done: boolean) => {
    const seg = segmentRef.current;
    segmentRef.current = null;
    seg?.resolve(done);
  }, []);

  useEffect(() => {
    if (!src) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;
    audio.playbackRate = rateRef.current;
    audio.loop = loopRef.current;
    audioRef.current = audio;

    const tick = () => {
      patch(src, { time: audio.currentTime });
      const seg = segmentRef.current;
      if (seg && audio.currentTime >= seg.end) {
        audio.pause();
        settleSegment(true);
      }
      if (!audio.paused) frameRef.current = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      patch(src, { playing: true });
      frameRef.current = requestAnimationFrame(tick);
    };
    const onPause = () => {
      patch(src, { playing: false, time: audio.currentTime });
    };
    const onEnded = () => {
      patch(src, { playing: false });
      settleSegment(true);
    };
    const onMeta = () => {
      patch(src, { duration: Number.isFinite(audio.duration) ? audio.duration : 0, ready: true });
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onMeta);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      settleSegment(false);
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeAttribute('src');
      audio.load();
    };
  }, [src, settleSegment, patch]);

  const setRate = useCallback((next: PlaybackRate) => {
    rateRef.current = next;
    setRateState(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  const setLoop = useCallback((next: boolean) => {
    loopRef.current = next;
    setLoopState(next);
    if (audioRef.current) audioRef.current.loop = next;
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    settleSegment(false);
    audio.loop = loopRef.current;
    if (audio.ended) audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [settleSegment]);

  const pause = useCallback(() => {
    settleSegment(false);
    audioRef.current?.pause();
  }, [settleSegment]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }, [play, pause]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    settleSegment(false);
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [settleSegment]);

  const playSegment = useCallback((startSec: number, endSec: number) => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve(false);
    settleSegment(false);
    return new Promise<boolean>((resolve) => {
      segmentRef.current = { end: endSec, resolve };
      audio.loop = false;
      audio.currentTime = startSec;
      audio.play().catch(() => settleSegment(false));
    });
  }, [settleSegment]);

  return {
    available: Boolean(src),
    playing, ready, duration, time, rate, loop,
    setRate, setLoop, toggle, play, pause, restart, playSegment,
  };
}
