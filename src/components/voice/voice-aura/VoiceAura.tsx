'use client';

/**
 * VoiceAura — Digital grid equalizer overlay.
 *
 * A grid of dots at the bottom of the viewport that react to audio.
 * Columns light up like a VU meter driven by frequency bands (speaking)
 * or mic level (listening). Glitch effects, scanlines, and subtle
 * animations give it a cyberpunk/Matrix feel.
 *
 * position: fixed, covers everything, pointer-events: none.
 */

import { useRef, useEffect, useCallback } from 'react';
import type { TutorState } from '../use-voice-session';
import {
  AURA_STATES,
  LERP_SPEED,
  GRID_COLS,
  GRID_ROWS,
  DOT_RADIUS,
  GRID_HEIGHT_PCT,
  GRID_PADDING_X_PCT,
} from './aura-constants';

export interface VoiceAuraProps {
  state: TutorState;
  audioLevel?: number;
  active?: boolean;
  /** 8 frequency bands (0-1) from tutor playback audio */
  frequencyBands?: Float32Array;
}

const NUM_BANDS = 8;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Deterministic pseudo-random per grid cell (stable across frames)
function cellHash(col: number, row: number): number {
  const n = col * 137 + row * 311;
  return ((Math.sin(n) * 43758.5453) % 1 + 1) % 1;
}

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

  // Smoothed state params for lerping between states
  const curRef = useRef({
    opacity: 0.15,
    activation: 0.08,
    glowRadius: 2,
    scanlineY: 0,
    breathePhase: 0,
    time: 0,
    freqSensitivity: 0,
    // Smoothed color channels
    r: 200, g: 100, b: 10,
    ar: 255, ag: 140, ab: 20,
  });

  // Per-column glitch state
  const glitchRef = useRef<Float32Array>(new Float32Array(GRID_COLS));
  const glitchDecayRef = useRef<Float32Array>(new Float32Array(GRID_COLS));

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
    const cur = curRef.current;
    const t = Math.min(1, delta * LERP_SPEED);

    // Smooth audio: fast attack, slow release
    const attackRate = rawAudio > smoothAudioRef.current ? 0.5 : 0.06;
    smoothAudioRef.current = lerp(smoothAudioRef.current, rawAudio, attackRate);
    const audio = smoothAudioRef.current;

    // Lerp state params
    const targetOpacity = params.baseOpacity + params.audioOpacityGain * audio;
    const targetActivation = params.baseActivation + params.audioActivationGain * audio;
    cur.opacity = lerp(cur.opacity, targetOpacity, t);
    cur.activation = lerp(cur.activation, targetActivation, t);
    cur.glowRadius = lerp(cur.glowRadius, params.glowRadius, t);
    cur.freqSensitivity = lerp(cur.freqSensitivity, params.frequencySensitivity, t);

    // Lerp colors
    cur.r = lerp(cur.r, params.color[0], t);
    cur.g = lerp(cur.g, params.color[1], t);
    cur.b = lerp(cur.b, params.color[2], t);
    cur.ar = lerp(cur.ar, params.accentColor[0], t);
    cur.ag = lerp(cur.ag, params.accentColor[1], t);
    cur.ab = lerp(cur.ab, params.accentColor[2], t);

    // Breathe
    if (params.breatheSpeed > 0) {
      cur.breathePhase += delta * params.breatheSpeed * Math.PI * 2;
      cur.activation += Math.sin(cur.breathePhase) * params.breatheAmp;
    }

    // Scanline
    if (params.scanlineSpeed > 0) {
      cur.scanlineY = (cur.scanlineY + delta * params.scanlineSpeed) % 1;
    }

    cur.time += delta;

    // --- Canvas setup ---
    const dpr = Math.min(window.devicePixelRatio, 2);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.round(vw * dpr);
    const h = Math.round(vh * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // --- Grid geometry ---
    const gridH = vh * GRID_HEIGHT_PCT * dpr;
    const gridTop = h - gridH;
    const padX = vw * GRID_PADDING_X_PCT * dpr;
    const gridW = w - padX * 2;

    const cellW = gridW / GRID_COLS;
    const cellH = gridH / GRID_ROWS;
    const dotR = DOT_RADIUS * dpr;

    // --- Frequency → column heights ---
    const bands = freqBandsRef.current;
    const colHeights = new Float32Array(GRID_COLS);

    for (let col = 0; col < GRID_COLS; col++) {
      let colActivation = cur.activation;

      // Map column to frequency band (interpolated)
      if (bands && cur.freqSensitivity > 0) {
        const bandPos = (col / (GRID_COLS - 1)) * (NUM_BANDS - 1);
        const bandIdx = Math.floor(bandPos);
        const bandFrac = bandPos - bandIdx;
        const b0 = bands[Math.min(bandIdx, NUM_BANDS - 1)];
        const b1 = bands[Math.min(bandIdx + 1, NUM_BANDS - 1)];
        const bandVal = b0 + bandFrac * (b1 - b0);
        colActivation += bandVal * cur.freqSensitivity;
      }

      // Add audio-level driven variation per column
      const colPhase = cellHash(col, 0) * Math.PI * 2;
      const colWave = Math.sin(cur.time * 2 + colPhase) * 0.05;
      colActivation += colWave * audio;

      colHeights[col] = Math.min(1, Math.max(0, colActivation));
    }

    // --- Glitch: random column spikes ---
    const glitch = glitchRef.current;
    const glitchDecay = glitchDecayRef.current;

    for (let col = 0; col < GRID_COLS; col++) {
      // Decay existing glitches
      glitch[col] *= 0.92;
      glitchDecay[col] *= 0.95;

      // Trigger new glitch
      if (Math.random() < params.glitchProb) {
        glitch[col] = 0.3 + Math.random() * 0.7;
        glitchDecay[col] = 1;
      }
    }

    // --- Draw dots ---
    const baseR = Math.round(cur.r);
    const baseG = Math.round(cur.g);
    const baseB = Math.round(cur.b);
    const accR = Math.round(cur.ar);
    const accG = Math.round(cur.ag);
    const accB = Math.round(cur.ab);

    for (let col = 0; col < GRID_COLS; col++) {
      const cx = padX + col * cellW + cellW / 2;
      const activeRows = colHeights[col] * GRID_ROWS;
      const glitchExtra = glitch[col] * GRID_ROWS * 0.5;
      const totalActive = Math.min(GRID_ROWS, activeRows + glitchExtra);
      const isGlitching = glitchDecay[col] > 0.1;

      for (let row = 0; row < GRID_ROWS; row++) {
        const rowFromBottom = GRID_ROWS - 1 - row;
        const cy = gridTop + row * cellH + cellH / 2;

        // Is this dot "active" (lit up)?
        const isActive = rowFromBottom < totalActive;

        // Scanline highlight
        const scanDist = params.scanlineSpeed > 0
          ? Math.abs((row / GRID_ROWS) - cur.scanlineY)
          : 1;
        const scanHighlight = scanDist < 0.08 ? (1 - scanDist / 0.08) * 0.6 : 0;

        if (isActive) {
          // Intensity fades as we go higher
          const intensity = 1 - (rowFromBottom / Math.max(1, totalActive)) * 0.5;
          const alpha = cur.opacity * intensity;

          // Glitch dots use accent color
          const r = isGlitching && rowFromBottom > activeRows ? accR : baseR;
          const g = isGlitching && rowFromBottom > activeRows ? accG : baseG;
          const b = isGlitching && rowFromBottom > activeRows ? accB : baseB;

          // Glow effect: larger, blurred circle behind
          if (cur.glowRadius > 2) {
            const glowR = dotR + cur.glowRadius * dpr * intensity * 0.5;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Dot
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(cx, cy, dotR * (1 + intensity * 0.5), 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Inactive dot: very faint grid
          const dimAlpha = 0.06 + scanHighlight;
          ctx.globalAlpha = dimAlpha;
          ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
          ctx.beginPath();
          ctx.arc(cx, cy, dotR * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- Scanline bar ---
    if (params.scanlineSpeed > 0) {
      const scanY = gridTop + cur.scanlineY * gridH;
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = `rgb(${accR}, ${accG}, ${accB})`;
      ctx.fillRect(padX, scanY - dpr, gridW, 2 * dpr);
    }

    // --- Faint vertical connection lines between active dots ---
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.lineWidth = dpr * 0.5;

    for (let col = 0; col < GRID_COLS; col++) {
      const activeRows = colHeights[col] * GRID_ROWS + glitch[col] * GRID_ROWS * 0.5;
      if (activeRows < 1) continue;

      const cx = padX + col * cellW + cellW / 2;
      const bottomY = gridTop + (GRID_ROWS - 1) * cellH + cellH / 2;
      const topRow = GRID_ROWS - Math.min(GRID_ROWS, Math.ceil(activeRows));
      const topY = gridTop + topRow * cellH + cellH / 2;

      ctx.beginPath();
      ctx.moveTo(cx, bottomY);
      ctx.lineTo(cx, topY);
      ctx.stroke();
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
      }}
      aria-hidden="true"
    />
  );
}
