'use client';

/**
 * Jarre - Audio Level Hook
 *
 * Reads audio level from a MediaStream (mic or playback) using Web Audio API.
 * Returns a smoothed 0-1 value focused on voice frequencies.
 */

import { useState, useEffect, useRef, type RefObject } from 'react';

const SMOOTHING = 0.12;
/** The level re-renders its component only when it moves at least this much (silence: never). */
const LEVEL_STEP = 0.01;

/**
 * Follow a stream's voice level on every animation frame, calling `onLevel`
 * with the smoothed value. Stops (and closes its AudioContext) when the
 * stream goes away or the component unmounts.
 */
function useLevelLoop(stream: MediaStream | null, onLevel: (level: number) => void): void {
  const onLevelRef = useRef(onLevel);
  useEffect(() => {
    onLevelRef.current = onLevel;
  });

  useEffect(() => {
    if (!stream) {
      onLevelRef.current(0);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let prev = 0;
    let frame = 0;

    function tick() {
      analyser.getByteFrequencyData(dataArray);

      // Focus on voice frequencies: bins 10-40 (~625Hz - 2500Hz at 16kHz sample rate)
      let sum = 0;
      const start = 10;
      const end = Math.min(40, dataArray.length);
      for (let i = start; i < end; i++) {
        sum += dataArray[i];
      }
      const raw = sum / ((end - start) * 255); // normalize to 0-1

      // Lerp smoothing
      prev = prev + SMOOTHING * (raw - prev);
      onLevelRef.current(prev);

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      audioContext.close().catch(() => {});
      onLevelRef.current(0);
    };
  }, [stream]);
}

/** The voice level as state, for components that draw it with React. */
export function useAudioLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);
  useLevelLoop(stream, (next) => {
    // Re-render only on a visible change, not on every frame.
    setLevel((prev) => (next === 0 || Math.abs(next - prev) >= LEVEL_STEP ? next : prev));
  });
  return level;
}

/** The voice level in a ref, for a canvas loop that reads it each frame without re-rendering. */
export function useAudioLevelRef(stream: MediaStream | null): RefObject<number> {
  const ref = useRef(0);
  useLevelLoop(stream, (next) => {
    ref.current = next;
  });
  return ref;
}
