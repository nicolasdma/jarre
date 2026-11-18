'use client';

/**
 * The voice intro at the top of a lesson's Entender screen (src/lib/onboarding/intro.ts
 * picks the variant). Nothing plays by itself: a play button, "Saltar", and the
 * text a tap away. Without a clip (none generated yet, or it fails to load) the
 * text shows with "Entendido". Heard to the end, skipped or dismissed, the
 * variant is kept on this device and not offered again.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Language } from '@/lib/translations';
import {
  introClip,
  parseIntroState,
  pickIntroVariant,
  withHeard,
  withLessonOpened,
  type IntroState,
  type IntroVariant,
} from '@/lib/onboarding/intro';

const STORAGE_KEY = 'jarre-intro';

function load(): IntroState {
  try {
    return parseIntroState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return parseIntroState(null);
  }
}

function save(state: IntroState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not kept on this device: the intro may show again, nothing else breaks.
  }
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function IntroCard({ resourceId, language, hasProgress }: { resourceId: string; language: Language; hasProgress: boolean }) {
  // Decided once per visit, on the client (it reads this device's history).
  const [variant, setVariant] = useState<IntroVariant | null>(null);
  const [done, setDone] = useState(false);
  const [showText, setShowText] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [time, setTime] = useState({ at: 0, duration: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const state = withLessonOpened(load(), resourceId);
    save(state);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads this device's storage once, after hydration
    setVariant(pickIntroVariant({ heard: state.heard, lessonsOpened: state.lessons.length, hasProgress }));
    // Once per lesson visit: a later progress change does not swap the intro under the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const markHeard = useCallback(() => {
    if (!variant) return;
    save(withHeard(load(), variant, new Date().toISOString()));
  }, [variant]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    markHeard();
    setDone(true);
  }, [markHeard]);

  if (!variant || done) return null;
  const clip = introClip(variant, language);
  const hasAudio = Boolean(clip.audio) && !audioFailed;
  const es = language === 'es';

  // The tip: one line, no audio.
  if (variant === 'tip' || !clip.audio) {
    return (
      <aside className="mb-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-j-warm pl-3" data-testid="intro-card" data-variant={variant}>
        <p className="text-sm text-j-text-secondary">{clip.text}</p>
        <button
          type="button"
          onClick={close}
          className="min-h-[32px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary underline underline-offset-4 hover:text-j-text"
        >
          {es ? 'Entendido' : 'Got it'}
        </button>
      </aside>
    );
  }

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setAudioFailed(true));
    else el.pause();
  };

  return (
    <aside className="mb-10 border border-j-border bg-j-bg-alt px-4 py-4 sm:px-5" aria-label={clip.title} data-testid="intro-card" data-variant={variant}>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">{clip.title}</p>

      {hasAudio ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? (es ? 'Pausar' : 'Pause') : es ? 'Escuchar' : 'Listen'}
            className="flex h-11 w-11 items-center justify-center bg-j-accent text-j-text-on-accent transition-colors hover:bg-j-accent-hover"
            data-testid="intro-play"
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="text-sm text-j-text-secondary">
            {playing || time.at > 0
              ? `${formatTime(time.at)} / ${formatTime(time.duration)}`
              : es
                ? `Escuchá cómo funciona${time.duration ? ` · ${formatTime(time.duration)}` : ''}`
                : `Hear how it works${time.duration ? ` · ${formatTime(time.duration)}` : ''}`}
          </span>
          <audio
            ref={audioRef}
            src={clip.audio ?? undefined}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(e) => setTime({ at: 0, duration: e.currentTarget.duration })}
            onTimeUpdate={(e) => setTime({ at: e.currentTarget.currentTime, duration: e.currentTarget.duration })}
            onEnded={() => {
              setPlaying(false);
              markHeard();
            }}
            onError={() => setAudioFailed(true)}
          />
        </div>
      ) : null}

      {(showText || !hasAudio) && (
        <p className="mt-3 text-sm leading-relaxed text-j-text-body" data-testid="intro-text">
          {clip.text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4">
        {hasAudio && (
          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            aria-expanded={showText}
            className="min-h-[44px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary underline underline-offset-4 hover:text-j-text"
          >
            {showText ? (es ? 'Ocultar el texto' : 'Hide the text') : es ? 'Ver el texto' : 'Show the text'}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="min-h-[44px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary underline underline-offset-4 hover:text-j-text"
          data-testid="intro-skip"
        >
          {hasAudio ? (es ? 'Saltar' : 'Skip') : es ? 'Entendido' : 'Got it'}
        </button>
      </div>
    </aside>
  );
}
