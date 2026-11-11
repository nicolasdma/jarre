'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { splitSentences } from '@/lib/practice/scoring';

export type PlaybackRate = 0.75 | 1;

/** A stretch of the drill, as fractions of its length plus its text. */
export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface DrillAudio {
  /** `file`: the drill's recording. `speech`: the browser's voice (no recording yet). */
  kind: 'file' | 'speech' | 'none';
  available: boolean;
  playing: boolean;
  ready: boolean;
  /** Seconds. Estimated from the text for `speech`. */
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
  /** Play one segment; resolves true when it ends, false when interrupted. */
  playSegment: (segment: AudioSegment) => Promise<boolean>;
}

type Engine = Omit<DrillAudio, 'kind' | 'rate' | 'loop' | 'setRate' | 'setLoop'>;

const IDLE = { playing: false, ready: false, duration: 0, time: 0 };
const noSubscribe = () => () => {};

// ---------------------------------------------------------------------------
// Recording (HTMLAudioElement)
// ---------------------------------------------------------------------------

interface ElementState {
  src: string | null;
  playing: boolean;
  ready: boolean;
  duration: number;
  time: number;
}

function useFileAudio(src: string | null, rate: PlaybackRate, loop: boolean): Engine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentRef = useRef<{ end: number; resolve: (done: boolean) => void } | null>(null);
  const frameRef = useRef<number | null>(null);
  // State is tagged with its src, so a new drill reads as fresh without resetting in an effect.
  const [el, setEl] = useState<ElementState>({ src: null, ...IDLE });
  const patch = useCallback((forSrc: string, next: Partial<Omit<ElementState, 'src'>>) => {
    setEl((prev) => ({ ...(prev.src === forSrc ? prev : { ...IDLE }), ...next, src: forSrc }));
  }, []);
  const { playing, ready, duration, time } = el.src === src ? el : IDLE;
  const rateRef = useRef(rate);
  const loopRef = useRef(loop);

  useEffect(() => {
    rateRef.current = rate;
    loopRef.current = loop;
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      if (!segmentRef.current) audioRef.current.loop = loop;
    }
  }, [rate, loop]);

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
    const onPause = () => patch(src, { playing: false, time: audio.currentTime });
    const onEnded = () => {
      patch(src, { playing: false });
      settleSegment(true);
    };
    const onMeta = () => patch(src, { duration: Number.isFinite(audio.duration) ? audio.duration : 0, ready: true });
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
    audio.loop = loopRef.current;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [settleSegment]);

  const playSegment = useCallback(({ start, end }: AudioSegment) => {
    const audio = audioRef.current;
    if (!audio || !(audio.duration > 0)) return Promise.resolve(false);
    settleSegment(false);
    return new Promise<boolean>((resolve) => {
      segmentRef.current = { end: end * audio.duration, resolve };
      audio.loop = false;
      audio.currentTime = start * audio.duration;
      audio.play().catch(() => settleSegment(false));
    });
  }, [settleSegment]);

  return { available: Boolean(src), playing, ready, duration, time, toggle, play, pause, restart, playSegment };
}

// ---------------------------------------------------------------------------
// Browser voice (speechSynthesis), for drills with no recording yet
// ---------------------------------------------------------------------------

/** Rough speaking speed at rate 1, for progress and pauses: no timing comes back from the engine. */
const SPEECH_CHARS_PER_SECOND = 14;
const PREFERRED_VOICES = [/Google US English/i, /Samantha/i, /Microsoft (Aria|Jenny|Guy)/i];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith('en-US'));
  for (const re of PREFERRED_VOICES) {
    const hit = voices.find((v) => re.test(v.name));
    if (hit) return hit;
  }
  return voices.find((v) => v.localService) ?? voices[0] ?? null;
}

function useSpeechAudio(text: string, enabled: boolean, rate: PlaybackRate, loop: boolean): Engine {
  const supported = useSyncExternalStore(noSubscribe, () => 'speechSynthesis' in window, () => false);
  const active = enabled && supported;
  const [state, setState] = useState({ text: '', playing: false, time: 0 });
  const { playing, time } = state.text === text ? state : { playing: false, time: 0 };
  const duration = text.length / SPEECH_CHARS_PER_SECOND;
  const runRef = useRef(0);
  const rateRef = useRef(rate);
  const loopRef = useRef(loop);

  useEffect(() => {
    rateRef.current = rate;
    loopRef.current = loop;
  }, [rate, loop]);

  // Stop speaking when the drill changes or the page goes away.
  useEffect(() => {
    if (!active) return;
    return () => {
      runRef.current++;
      window.speechSynthesis.cancel();
    };
  }, [active, text]);

  /** Speak one piece; resolves false if cancelled. Progress maps onto [from, to] of the drill. */
  const speak = useCallback((piece: string, from: number, to: number) => new Promise<boolean>((resolve) => {
    const u = new SpeechSynthesisUtterance(piece);
    u.lang = 'en-US';
    u.rate = rateRef.current;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    const at = (frac: number) => setState({ text, playing: true, time: (from + frac * (to - from)) * duration });
    at(0);
    u.onboundary = (e) => at(piece.length ? e.charIndex / piece.length : 0);
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  }), [text, duration]);

  const stop = useCallback(() => {
    runRef.current++;
    window.speechSynthesis.cancel();
    setState((s) => ({ text, playing: false, time: s.text === text ? s.time : 0 }));
  }, [text]);

  // Sentence by sentence: Chrome cuts single utterances off after ~15 s.
  const play = useCallback(() => {
    if (!active) return;
    stop();
    const run = runRef.current;
    const sentences = splitSentences(text);
    void (async () => {
      do {
        for (const s of sentences) {
          const ok = await speak(s.text, s.start, s.end);
          if (!ok || runRef.current !== run) return;
        }
      } while (loopRef.current && runRef.current === run);
      setState({ text, playing: false, time: duration });
    })();
  }, [active, stop, text, speak, duration]);

  const toggle = useCallback(() => (playing ? stop() : play()), [playing, stop, play]);

  const playSegment = useCallback(async (seg: AudioSegment) => {
    if (!active) return false;
    stop();
    const run = runRef.current;
    const ok = await speak(seg.text, seg.start, seg.end);
    if (runRef.current === run) setState((s) => ({ ...s, playing: false }));
    return ok && runRef.current === run;
  }, [active, stop, speak]);

  return {
    available: active, playing, ready: active, duration: active ? duration : 0, time,
    toggle, play, pause: stop, restart: play, playSegment,
  };
}

// ---------------------------------------------------------------------------

/**
 * Audio for one drill: its recording when there is one, else the browser's
 * en-US voice. Rate and loop survive drill changes.
 */
export function useDrillAudio(src: string | null, text: string): DrillAudio {
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [loop, setLoop] = useState(false);
  const file = useFileAudio(src, rate, loop);
  const speech = useSpeechAudio(text, !src, rate, loop);
  const engine = src ? file : speech;
  const kind = src ? 'file' : speech.available ? 'speech' : 'none';
  return { ...engine, kind, rate, loop, setRate, setLoop };
}
