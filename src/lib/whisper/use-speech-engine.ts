'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SpeechEngine {
  speak: (text: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isReady: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

// ============================================================================
// Voice scoring
// ============================================================================

// macOS novelty/character voices — low quality, should never be selected
const NOVELTY_VOICES = new Set([
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
  'good news', 'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'zarvox',
]);

/**
 * Minimum score to consider a voice usable.
 * A Spanish voice scores >= 100, non-Spanish scores 0.
 * Threshold of 50 ensures only Spanish voices are selected.
 */
const MIN_VOICE_SCORE = 50;

/**
 * Scores a voice for quality. Higher = better.
 * Prefers: Premium/Enhanced Spanish > standard Spanish > any Spanish.
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  if (voice.lang.startsWith('es')) score += 100;

  const name = voice.name.toLowerCase();

  // Penalize novelty voices heavily — extract first word for matching
  const baseName = name.split('(')[0].trim().split(' ')[0];
  if (NOVELTY_VOICES.has(baseName)) score -= 200;

  // Quality indicators in voice name
  if (name.includes('premium')) score += 50;
  if (name.includes('enhanced')) score += 40;

  // Local (downloaded) voices are higher quality than network voices
  if (voice.localService) score += 10;

  // Regional preference
  if (voice.lang === 'es-AR') score += 5;
  if (voice.lang === 'es-ES') score += 3;
  if (voice.lang === 'es-MX') score += 2;

  return score;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Low-level hook encapsulating Web Speech API.
 *
 * Hardened against known browser issues:
 * - F1: Chunks text at ~60 words to avoid Chrome's ~15s utterance timeout
 * - F2: Resume uses cancel + re-speak (Chrome's native resume is unreliable)
 * - F3: Generation counter invalidates stale utterance callbacks
 * - F5: Requires a Spanish voice (MIN_VOICE_SCORE) — won't activate otherwise
 * - Rate 0.92 for natural cadence
 */
export function useSpeechEngine(): SpeechEngine {
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<string[]>([]);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);
  const genRef = useRef(0);
  const currentChunkRef = useRef('');
  const charIndexRef = useRef(0);

  // ---- Voice selection ----

  const selectVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const scored = voices
      .map((v) => ({ voice: v, score: scoreVoice(v) }))
      .sort((a, b) => b.score - a.score);

    if (scored[0].score < MIN_VOICE_SCORE) {
      voiceRef.current = null;
      return;
    }

    voiceRef.current = scored[0].voice;
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    selectVoice();
    speechSynthesis.addEventListener('voiceschanged', selectVoice);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', selectVoice);
      speechSynthesis.cancel();
    };
  }, [selectVoice]);

  // ---- Chunk-level speech with generation guard ----

  const speakChunk = useCallback(
    (text: string, onChunkEnd: () => void) => {
      const gen = genRef.current;
      currentChunkRef.current = text;
      charIndexRef.current = 0;

      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current?.lang ?? 'es';
      utterance.rate = 1.04;

      // Track word-level position for sub-chunk resume
      utterance.onboundary = (e) => {
        if (gen !== genRef.current) return;
        charIndexRef.current = e.charIndex;
      };

      utterance.onend = () => {
        if (gen !== genRef.current) return;
        onChunkEnd();
      };
      utterance.onerror = (e) => {
        if (gen !== genRef.current) return;
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[Whisper] Speech error:', e.error);
        }
        onChunkEnd();
      };

      speechSynthesis.speak(utterance);
    },
    []
  );

  // ---- Queue processing ----

  const processQueue = useCallback(() => {
    if (cancelledRef.current) {
      queueRef.current = [];
      currentChunkRef.current = '';
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      setIsPaused(false);
      currentChunkRef.current = '';
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb?.();
      return;
    }

    const next = queueRef.current.shift()!;
    speakChunk(next, processQueue);
  }, [speakChunk]);

  // ---- Text chunking ----

  /**
   * Splits text into chunks of ~50 words at sentence boundaries.
   * Chrome silently kills utterances after ~15 seconds. At rate 0.92,
   * 60 words takes ~12s — safe margin below the timeout.
   * Threshold lowered from 150 to 60 words (F1).
   */
  const chunkText = useCallback((text: string): string[] => {
    const words = text.split(/\s+/);
    if (words.length <= 60) return [text];

    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences) return [text];

    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      const combined = current ? `${current} ${sentence.trim()}` : sentence.trim();
      if (combined.split(/\s+/).length > 50 && current) {
        chunks.push(current);
        current = sentence.trim();
      } else {
        current = combined;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }, []);

  // ---- Public API ----

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isReady) return;

      genRef.current++;
      speechSynthesis.cancel();
      cancelledRef.current = false;
      onEndCallbackRef.current = onEnd ?? null;

      queueRef.current = chunkText(text);
      setIsSpeaking(true);
      setIsPaused(false);
      processQueue();
    },
    [isReady, chunkText, processQueue]
  );

  const pause = useCallback(() => {
    if (!isSpeaking || isPaused) return;
    speechSynthesis.pause();
    setIsPaused(true);
  }, [isSpeaking, isPaused]);

  /**
   * Chrome's speechSynthesis.resume() is unreliable — it silently fails,
   * leaving the engine in a zombie state. Instead of native resume, we
   * cancel and re-speak from the last known word boundary (charIndexRef).
   * If onboundary never fired, falls back to full chunk replay.
   */
  const resume = useCallback(() => {
    if (!isPaused) return;

    genRef.current++;
    speechSynthesis.cancel();
    cancelledRef.current = false;
    setIsPaused(false);

    const chunk = currentChunkRef.current;
    if (!chunk) {
      processQueue();
      return;
    }

    // Slice from last known word boundary for sub-chunk resume
    const remaining = charIndexRef.current > 0
      ? chunk.slice(charIndexRef.current).trimStart()
      : chunk;

    if (remaining) {
      speakChunk(remaining, processQueue);
    } else {
      processQueue();
    }
  }, [isPaused, speakChunk, processQueue]);

  const cancel = useCallback(() => {
    genRef.current++;
    cancelledRef.current = true;
    speechSynthesis.cancel();
    queueRef.current = [];
    currentChunkRef.current = '';
    charIndexRef.current = 0;
    onEndCallbackRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  return { speak, pause, resume, cancel, isReady, isSpeaking, isPaused };
}
