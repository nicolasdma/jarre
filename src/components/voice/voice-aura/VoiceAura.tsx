'use client';

/**
 * VoiceAura — Full-viewport equalizer wave overlay.
 *
 * Waves pulse UP and DOWN like a sound equalizer — not sideways.
 * Audio level drives the vertical amplitude. Different wave segments
 * react at different rates creating an organic, living feel.
 *
 * position: fixed, covers everything, pointer-events: none.
 */

import { useRef, useEffect, useCallback } from 'react';
import type { TutorState } from '../use-voice-session';
import { AURA_STATES, LERP_SPEED, WAVE_CONFIGS } from './aura-constants';

export interface VoiceAuraProps {
  state: TutorState;
  audioLevel?: number;
  active?: boolean;
  /** 8 frequency bands (0-1) from tutor playback audio */
  frequencyBands?: Float32Array;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const NUM_BANDS = 8;

export function VoiceAura({
  state,
  audioLevel = 0,
  active = true,
  frequencyBands,
}: VoiceAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(0);
  const audioRef = useRef(0);
  const stateRef = useRef<TutorState>(state);
  const smoothAudioRef = useRef(0);
  const freqBandsRef = useRef<Float32Array | undefined>(undefined);

  const currentRef = useRef({
    opacity: 0.4,
    amplitude: 6,
    pulseSpeed: 0.8,
    blurRadius: 35,
    breathePhase: 0,
    time: 0,
  });

  useEffect(() => { audioRef.current = audioLevel; }, [audioLevel]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { freqBandsRef.current = frequencyBands; }, [frequencyBands]);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const delta = prevTimeRef.current ? (time - prevTimeRef.current) / 1000 : 0.016;
    prevTimeRef.current = time;

    const params = AURA_STATES[stateRef.current];
    const rawAudio = audioRef.current;
    const cur = currentRef.current;
    const t = Math.min(1, delta * LERP_SPEED);

    // Smooth audio: fast attack, slow release
    const attackRate = rawAudio > smoothAudioRef.current ? 0.5 : 0.06;
    smoothAudioRef.current = lerp(smoothAudioRef.current, rawAudio, attackRate);
    const audio = smoothAudioRef.current;

    // Interpolate params
    cur.opacity = lerp(cur.opacity, params.baseOpacity + params.audioOpacityGain * audio, t);
    cur.amplitude = lerp(cur.amplitude, params.baseAmplitude + params.audioAmplitudeGain * audio, t);
    cur.pulseSpeed = lerp(cur.pulseSpeed, params.pulseSpeed + params.audioPulseGain * audio, t);
    cur.blurRadius = lerp(cur.blurRadius, params.blurRadius, t);

    // Breathe
    if (params.breatheSpeed > 0) {
      cur.breathePhase += delta * params.breatheSpeed * Math.PI * 2;
      cur.opacity += Math.sin(cur.breathePhase) * params.breatheAmp;
    }

    // Advance time (drives vertical pulsing)
    cur.time += delta * cur.pulseSpeed;

    const opacity = Math.max(0, Math.min(1, cur.opacity));
    const ampPct = cur.amplitude / 100;

    // Size canvas to full viewport
    const dpr = Math.min(window.devicePixelRatio, 2);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.round(vw * dpr);
    const h = Math.round(vh * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    canvas.style.filter = `blur(${Math.round(cur.blurRadius)}px)`;

    ctx.clearRect(0, 0, w, h);

    const baseY = h;
    const ampPx = h * ampPct;
    const timeVal = cur.time;

    // Draw each wave layer
    for (let i = 0; i < WAVE_CONFIGS.length; i++) {
      const cfg = WAVE_CONFIGS[i];
      const color = params.colors[i] ?? params.colors[0];
      const waveAmp = ampPx * cfg.ampMult;
      const yOff = (cfg.yOffset / 100) * h;

      ctx.globalAlpha = opacity * (1 - i * 0.05);

      ctx.beginPath();
      ctx.moveTo(0, baseY);

      const segments = Math.max(80, Math.round(w / 6));
      const bands = freqBandsRef.current;
      const freqSens = params.frequencySensitivity;

      for (let s = 0; s <= segments; s++) {
        const xNorm = s / segments;
        const x = xNorm * w;

        // The wave SHAPE is fixed horizontally (like equalizer bars, but smooth).
        // The AMPLITUDE pulses up/down over time.

        // Spatial shape: determines the "equalizer bar" pattern across width
        const shape = Math.sin(xNorm * Math.PI * 2 * cfg.freq + cfg.phase)
                    + Math.sin(xNorm * Math.PI * 2 * cfg.freq * 1.6 + cfg.phase * 2) * 0.35;

        // Vertical pulse: oscillates the amplitude over time (up and down)
        const pulse = Math.sin(timeVal + cfg.pulsePhase)
                    + Math.sin(timeVal * 1.7 + cfg.pulsePhase + xNorm * 2) * 0.3;

        // Frequency band modulation: map horizontal position to band index
        // Bands 0 (bass/left) → 7 (treble/right)
        let freqMod = 0;
        if (bands && freqSens > 0) {
          const bandPos = xNorm * (NUM_BANDS - 1);
          const bandIdx = Math.floor(bandPos);
          const bandFrac = bandPos - bandIdx;
          const b0 = bands[Math.min(bandIdx, NUM_BANDS - 1)];
          const b1 = bands[Math.min(bandIdx + 1, NUM_BANDS - 1)];
          freqMod = (b0 + bandFrac * (b1 - b0)) * freqSens;
        }

        // Audio reactivity: high-frequency vertical spikes tied to audio
        const audioSpike = Math.sin(timeVal * 4 + xNorm * Math.PI * 8) * audio * 0.8;

        // Combine: shape * pulsing amplitude + audio spikes + frequency modulation
        const waveHeight = waveAmp * (0.4 + (shape * 0.3 + 0.3) * (0.5 + pulse * 0.5))
                         + audioSpike * ampPx
                         + freqMod * ampPx * 1.5;
        const y = baseY - yOff - Math.max(0, waveHeight);

        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, baseY);
      ctx.closePath();

      // Gradient: holds color, slow fade
      const gradient = ctx.createLinearGradient(0, baseY - yOff - waveAmp * 1.5, 0, baseY);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(0.8, color.replace(/[\d.]+\)$/, `${parseFloat(color.match(/[\d.]+\)$/)?.[0] ?? '0.5') * 0.5})`));
      gradient.addColorStop(1, color.replace(/[\d.]+\)$/, `${parseFloat(color.match(/[\d.]+\)$/)?.[0] ?? '0.5') * 0.2})`));

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!active) return;

    prevTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
        filter: 'blur(35px)',
      }}
      aria-hidden="true"
    />
  );
}
