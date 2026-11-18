'use client';

/**
 * Shared audio affordances for the feed, over the single controller.
 *
 * - AudioToggle: play/pause the active post, or the "tap to hear" unlock when
 *   sound has not been enabled yet. Reads status only when active, so only the
 *   active post's chrome re-renders.
 * - CaptionLine: the drill text, always on (WCAG 1.2.2 / L2), karaoke-lit by
 *   the clock when there are phrase timings. Reads the time store, so only
 *   this line re-renders per tick, never the feed.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PhraseSegment } from '@/lib/practice/phrase-segments';
import type { FeedAudioController } from '../feed-audio';
import { useFeedAudioStatus, useFeedAudioTime } from '../use-feed-audio';

export function AudioToggle({
  controller,
  active,
  hasAudio,
}: {
  controller: FeedAudioController | null;
  active: boolean;
  hasAudio: boolean;
}) {
  const status = useFeedAudioStatus(controller);
  if (!hasAudio) return null;
  const isActive = active && controller;
  const playing = isActive ? status.playing : false;
  const unlocked = status.unlocked;

  const onClick = () => {
    if (!controller) return;
    if (!unlocked) {
      controller.prime();
      controller.play();
      return;
    }
    controller.toggle();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={!unlocked ? 'Activar sonido y reproducir' : playing ? 'Pausar' : 'Reproducir'}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: 'color-mix(in srgb, var(--fp-accent) 16%, transparent)', color: 'var(--fp-accent)' }}
    >
      <span aria-hidden className="text-sm leading-none">{playing ? '❚❚' : '▶'}</span>
      {!unlocked ? 'Tocá para oír' : playing ? 'Sonando' : 'Oír'}
    </button>
  );
}

/** The spoken text as captions, lit phrase by phrase when timings exist. */
export function CaptionLine({
  controller,
  active,
  text,
  segments,
  className,
}: {
  controller: FeedAudioController | null;
  active: boolean;
  text: string;
  segments: PhraseSegment[] | null;
  className?: string;
}) {
  const phrases = useMemo(() => text.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean), [text]);
  const time = useFeedAudioTime(active ? controller : null);
  const lit = useMemo(() => {
    if (!active || !segments || segments.length !== phrases.length) return -1;
    for (let i = 0; i < segments.length; i++) {
      if (time >= segments[i].start && time < segments[i].end) return i;
    }
    return -1;
  }, [active, segments, phrases.length, time]);

  return (
    <p lang="en" className={cn('text-lg leading-relaxed sm:text-xl', className)} style={{ color: 'var(--fp-ink)' }}>
      {phrases.map((phrase, i) => (
        <span
          key={i}
          style={lit === i ? { background: 'color-mix(in srgb, var(--fp-accent) 22%, transparent)', borderRadius: '2px' } : undefined}
        >
          {phrase}
          {i < phrases.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
