'use client';

/**
 * Where each phrase of a drill sits in its recording, for Frase por frase.
 *
 * Exact: the drill's stored phrase timings (lesson_drills.segments, measured
 * offline with Whisper and the audio's silences: phrase-segments.ts), used
 * when there is one per phrase. Approximate, for drills without them: the
 * audio is decoded once with Web Audio, its pauses found, and each boundary
 * snapped to a pause (sentence-timing.ts); cached per device, keyed by the
 * drill, its text and the recording's length (the signed URL changes on every
 * load and the file behind it can be re-recorded or trimmed).
 */

import { useEffect, useState } from 'react';
import type { PhraseSegment } from '@/lib/practice/phrase-segments';
import { detectPauses, placeSentences, type SentenceSpan } from '@/lib/practice/sentence-timing';
import type { AudioSegment } from './use-drill-audio';

const CACHE_PREFIX = 'jarre:sentence-spans:v1:';

interface Cached {
  duration: number;
  spans: SentenceSpan[];
  snapped: boolean;
}

/**
 * `exact`: stored phrase timings. `ready`: cut at the pauses found in the
 * audio (approximate). `error`: the audio could not be read, proportional
 * cuts. `speech`: no recording, the browser voice reads each phrase.
 */
export type SpanStatus = 'loading' | 'exact' | 'ready' | 'speech' | 'error';

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function readCache(key: string): Cached | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: Cached): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: it is recomputed next time.
  }
}

async function computeSpans(url: string, sentences: string[]): Promise<Cached> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`audio ${res.status}`);
  const buffer = await res.arrayBuffer();
  // An offline context decodes without a user gesture and plays nothing.
  const ctx = new OfflineAudioContext(1, 1, 16000);
  const decoded = await ctx.decodeAudioData(buffer);
  const pauses = detectPauses(decoded.getChannelData(0), decoded.sampleRate);
  const { spans, snapped } = placeSentences(sentences, pauses);
  return { duration: decoded.duration, spans, snapped };
}

/**
 * The segment to play for each sentence, or null while it is being worked
 * out. Without a recording (`speech`) each segment is just its text: the
 * browser voice reads one sentence at a time anyway.
 */
export function useSentenceSegments(
  audioUrl: string | null,
  slug: string,
  sentences: string[],
  /** The recording's length as the player reports it; 0 until it is known. */
  recordingSeconds: number,
  /** Stored timings in seconds, one per sentence; anything else is ignored. */
  stored: readonly PhraseSegment[] | null = null,
): { segments: AudioSegment[] | null; status: SpanStatus } {
  const tenths = Math.round(recordingSeconds * 10);
  const key = `${CACHE_PREFIX}${slug}:${hash(sentences.join('\n'))}:${tenths}`;
  const hasAudio = Boolean(audioUrl);
  const exact = Boolean(audioUrl && stored && stored.length === sentences.length);
  const [state, setState] = useState<{ key: string; value: Cached | null; failed: boolean }>({ key: '', value: null, failed: false });

  useEffect(() => {
    if (!audioUrl || tenths === 0 || exact) return;
    let cancelled = false;
    const cached = readCache(key);
    if (cached && cached.spans.length === sentences.length) {
      queueMicrotask(() => !cancelled && setState({ key, value: cached, failed: false }));
      return () => {
        cancelled = true;
      };
    }
    computeSpans(audioUrl, sentences)
      .then((value) => {
        if (cancelled) return;
        writeCache(key, value);
        setState({ key, value, failed: false });
      })
      .catch(() => !cancelled && setState({ key, value: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // The signed URL changes on every page load; the key says when the recording changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasAudio, exact]);

  if (!audioUrl) {
    return { segments: sentences.map((text, i) => ({ text, start: i / sentences.length, end: (i + 1) / sentences.length })), status: 'speech' };
  }
  if (exact && stored) {
    if (!(recordingSeconds > 0)) return { segments: null, status: 'loading' };
    const d = recordingSeconds;
    return {
      segments: stored.map((s, i) => ({ text: sentences[i], start: Math.min(1, s.start / d), end: Math.min(1, s.end / d) })),
      status: 'exact',
    };
  }
  const failed = state.key === key && state.failed;
  // Could not decode it: proportional spans, the best guess without the audio.
  const value = state.key === key ? state.value : null;
  const placed = value ?? (failed ? { duration: 1, ...placeSentences(sentences, { duration: 1, speechStart: 0, speechEnd: 1, pauses: [] }) } : null);
  if (!placed) return { segments: null, status: 'loading' };
  const d = placed.duration || 1;
  return {
    segments: placed.spans.map((s, i) => ({ text: sentences[i], start: s.start / d, end: s.end / d })),
    status: failed ? 'error' : 'ready',
  };
}

