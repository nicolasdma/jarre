'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechEngine {
  speak: (text: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isReady: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

/**
 * Scores a voice for quality. Higher = better.
 * Prefers: Premium/Enhanced Spanish > standard Spanish > any voice.
 */
// macOS novelty/character voices — low quality, should never be selected
const NOVELTY_VOICES = new Set([
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
  'good news', 'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'zarvox',
]);

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

/**
 * Low-level hook encapsulating Web Speech API.
 *
 * - Selects highest-quality Spanish voice (Premium > Enhanced > standard)
 * - Falls back to any voice if no Spanish available
 * - Chunks long text into sentences to avoid Chrome's ~15s timeout
 * - Rate 0.92 for more natural cadence
 * - Cleanup on unmount
 */
export function useSpeechEngine(): SpeechEngine {
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<string[]>([]);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const selectVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const scored = voices
      .map((v) => ({ voice: v, score: scoreVoice(v) }))
      .sort((a, b) => b.score - a.score);

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

  const speakChunk = useCallback(
    (text: string, onChunkEnd: () => void) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current?.lang ?? 'es';
      utterance.rate = 0.92;

      utterance.onend = () => onChunkEnd();
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[Whisper] Speech error:', e.error);
        }
        onChunkEnd();
      };

      speechSynthesis.speak(utterance);
    },
    []
  );

  const processQueue = useCallback(() => {
    if (cancelledRef.current) {
      queueRef.current = [];
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      setIsPaused(false);
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb?.();
      return;
    }

    const next = queueRef.current.shift()!;
    speakChunk(next, processQueue);
  }, [speakChunk]);

  const chunkText = useCallback((text: string): string[] => {
    const words = text.split(/\s+/);
    if (words.length <= 150) return [text];

    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences) return [text];

    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      const combined = current ? `${current} ${sentence.trim()}` : sentence.trim();
      if (combined.split(/\s+/).length > 80 && current) {
        chunks.push(current);
        current = sentence.trim();
      } else {
        current = combined;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isReady) return;

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

  const resume = useCallback(() => {
    if (!isPaused) return;
    speechSynthesis.resume();
    setIsPaused(false);
  }, [isPaused]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    speechSynthesis.cancel();
    queueRef.current = [];
    onEndCallbackRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  return { speak, pause, resume, cancel, isReady, isSpeaking, isPaused };
}
