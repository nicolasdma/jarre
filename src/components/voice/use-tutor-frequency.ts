'use client';

/**
 * Jarre - Tutor Frequency Bands Hook
 *
 * Reads frequency data from a playback AnalyserNode and groups
 * 128 bins into 8 normalized bands (0-1) with per-band smoothing.
 * Used to drive VoiceAura equalizer visualization.
 */

import { useRef, useEffect, useCallback } from 'react';

const NUM_BANDS = 8;
const ATTACK_RATE = 0.4;
const RELEASE_RATE = 0.05;

const ZERO_BANDS = new Float32Array(NUM_BANDS);

export function useTutorFrequency(analyser: AnalyserNode | null): Float32Array {
  const bandsRef = useRef(new Float32Array(NUM_BANDS));
  const smoothedRef = useRef(new Float32Array(NUM_BANDS));
  const rafRef = useRef<number>(0);
  const analyserRef = useRef(analyser);
  analyserRef.current = analyser;

  const tick = useCallback(() => {
    const node = analyserRef.current;
    if (!node) {
      // Zero out when no analyser
      smoothedRef.current.fill(0);
      bandsRef.current.fill(0);
      return;
    }

    const bufferLength = node.frequencyBinCount; // fftSize/2 = 128
    const dataArray = new Uint8Array(bufferLength);
    node.getByteFrequencyData(dataArray);

    // Group bins into NUM_BANDS bands
    const binsPerBand = Math.floor(bufferLength / NUM_BANDS);
    const bands = bandsRef.current;
    const smoothed = smoothedRef.current;

    for (let b = 0; b < NUM_BANDS; b++) {
      let sum = 0;
      const start = b * binsPerBand;
      const end = start + binsPerBand;
      for (let i = start; i < end; i++) {
        sum += dataArray[i];
      }
      const raw = sum / (binsPerBand * 255); // normalize 0-1

      // Per-band smoothing: fast attack, slow release
      const rate = raw > smoothed[b] ? ATTACK_RATE : RELEASE_RATE;
      smoothed[b] = smoothed[b] + rate * (raw - smoothed[b]);
      bands[b] = smoothed[b];
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!analyser) {
      smoothedRef.current.fill(0);
      bandsRef.current.fill(0);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, tick]);

  return analyser ? bandsRef.current : ZERO_BANDS;
}
