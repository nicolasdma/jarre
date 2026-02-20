'use client';

/**
 * Jarre - Audio Level Hook
 *
 * Reads audio level from a MediaStream (mic or playback) using Web Audio API.
 * Returns a smoothed 0-1 value focused on voice frequencies.
 */

import { useState, useEffect, useRef } from 'react';

const SMOOTHING = 0.12;

export function useAudioLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);
  const animFrameRef = useRef<number>(0);
  const prevLevelRef = useRef(0);

  useEffect(() => {
    if (!stream) {
      setLevel(0);
      prevLevelRef.current = 0;
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

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
      const smoothed = prevLevelRef.current + SMOOTHING * (raw - prevLevelRef.current);
      prevLevelRef.current = smoothed;
      setLevel(smoothed);

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      audioContext.close().catch(() => {});
    };
  }, [stream]);

  return level;
}
