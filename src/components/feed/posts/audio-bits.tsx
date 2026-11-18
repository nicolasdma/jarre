'use client';

/**
 * Audio pieces for the cards, over the single feed controller.
 *
 * - VoiceStrip: the bottom of a media block that has a recording, like a
 *   voice note: a play/pause disc, a waveform that fills with the playhead,
 *   and the phrase being said as a subtitle. Reads the time store, so only the
 *   strip re-renders per tick, never the feed.
 * - KaraokeCaption: the full spoken text in the caption, always on (WCAG
 *   1.2.2), the current phrase lit when there are phrase timings.
 * - Waveform: deterministic bars from the text (a picture of a voice note,
 *   not a measurement), filled up to `progress`.
 */

import { useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import { phrasesOf } from '@/lib/feed/feed-identity';
import type { PhraseSegment } from '@/lib/practice/phrase-segments';
import type { FeedAudioController } from '../feed-audio';
import { useFeedAudioStatus, useFeedAudioTime } from '../use-feed-audio';
import { waveformBars } from '../waveform';

export function Waveform({ seed, progress, count = 36, height = 28 }: { seed: string; progress: number; count?: number; height?: number }) {
  const bars = useMemo(() => waveformBars(seed, count), [seed, count]);
  return (
    <span aria-hidden className="flex flex-1 items-center gap-[3px]" style={{ height }}>
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-[3px] flex-1 rounded-full"
          style={{
            height: `${Math.round(b * 100)}%`,
            background: i / count < progress ? 'var(--fp-accent)' : 'color-mix(in srgb, var(--fp-ink) 28%, transparent)',
          }}
        />
      ))}
    </span>
  );
}

/** Which phrase the clock is in, or -1. */
function litPhrase(time: number, segments: PhraseSegment[] | null, phrases: number): number {
  if (!segments || segments.length !== phrases) return -1;
  for (let i = 0; i < segments.length; i++) if (time >= segments[i].start && time < segments[i].end) return i;
  return -1;
}

export function VoiceStrip({
  postKey,
  src,
  text,
  segments,
  controller,
}: {
  postKey: string;
  src: string;
  text: string;
  segments: PhraseSegment[] | null;
  controller: FeedAudioController | null;
}) {
  const status = useFeedAudioStatus(controller);
  const mine = status.activeKey === postKey;
  const time = useFeedAudioTime(mine ? controller : null);
  const phrases = useMemo(() => phrasesOf(text), [text]);
  const playing = mine && status.playing;
  const progress = mine && status.duration > 0 ? Math.min(1, time / status.duration) : 0;
  const lit = mine ? litPhrase(time, segments, phrases.length) : -1;
  const subtitle = phrases[lit >= 0 ? lit : 0] ?? '';

  const onClick = () => {
    if (!controller) return;
    controller.prime();
    if (!mine) {
      controller.setActive(postKey, src);
      controller.play();
    } else {
      controller.toggle();
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--fp-bg) 94%, transparent) 60%, transparent)' }}>
      <p lang="en" aria-hidden className="mb-2.5 line-clamp-2 min-h-[2.6em] text-[15px] font-medium leading-snug" style={{ color: 'var(--fp-ink)' }}>
        {subtitle}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClick}
          aria-label={!status.unlocked ? 'Activar sonido y reproducir' : playing ? 'Pausar' : 'Reproducir'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        <Waveform seed={postKey + text} progress={progress} />
        <span className="w-9 text-right font-mono text-[11px] tabular-nums" style={{ color: 'var(--fp-soft)' }}>
          {mine && status.duration > 0 ? formatSeconds(playing || time > 0 ? time : status.duration) : 'voz'}
        </span>
      </div>
    </div>
  );
}

export function formatSeconds(s: number): string {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** The spoken text in the caption, current phrase lit. Neutral chrome colors. */
export function KaraokeCaption({
  postKey,
  text,
  segments,
  controller,
}: {
  postKey: string;
  text: string;
  segments: PhraseSegment[] | null;
  controller: FeedAudioController | null;
}) {
  const status = useFeedAudioStatus(controller);
  const mine = status.activeKey === postKey;
  const time = useFeedAudioTime(mine ? controller : null);
  const phrases = useMemo(() => phrasesOf(text), [text]);
  // Lit only while it is actually being heard (not at 0:00 before play).
  const lit = mine && (status.playing || time > 0) ? litPhrase(time, segments, phrases.length) : -1;
  return (
    <>
      {phrases.map((phrase, i) => (
        <span key={i} className={i === lit ? 'rounded-[3px] bg-amber-200/70 text-neutral-900 dark:bg-amber-300/30 dark:text-neutral-50' : undefined}>
          {phrase}
          {i < phrases.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}
