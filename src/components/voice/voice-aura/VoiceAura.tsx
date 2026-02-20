'use client';

/**
 * VoiceAura — Neon digital aura with organic wave shapes.
 *
 * Hundreds of vertical pixel-lines trace organic sine-wave envelopes,
 * creating a dense equalizer that feels alive. Glitch bars, falling
 * rain particles, and scanlines add the Matrix/cyberpunk layer.
 *
 * The wave SHAPES are organic (layered sines). The RENDERING is digital
 * (pixel lines, particles, neon glow, glitch artifacts).
 *
 * position: fixed, covers entire viewport, pointer-events: none.
 */

import { useRef, useEffect, useCallback } from 'react';
import type { TutorState } from '../use-voice-session';
import {
  AURA_STATES,
  LERP_SPEED,
  WAVE_LAYERS,
  LINE_COLUMNS,
  MAX_RAIN_PARTICLES,
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

// Stable pseudo-random per column (no flicker between frames)
function colHash(col: number, seed: number): number {
  const n = col * 137.5 + seed * 311.7;
  return ((Math.sin(n) * 43758.5453) % 1 + 1) % 1;
}

// ============================================================================
// Rain particle pool
// ============================================================================

interface RainParticle {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 (0 = top of wave, 1 = far above)
  speed: number;   // fall speed
  opacity: number;
  length: number;  // line length in px
  alive: boolean;
}

function createParticlePool(): RainParticle[] {
  const pool: RainParticle[] = [];
  for (let i = 0; i < MAX_RAIN_PARTICLES; i++) {
    pool.push({ x: 0, y: 0, speed: 0, opacity: 0, length: 0, alive: false });
  }
  return pool;
}

// ============================================================================
// Component
// ============================================================================

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
  const rainRef = useRef<RainParticle[]>(createParticlePool());

  // Smoothed rendering state
  const curRef = useRef({
    opacity: 0.35,
    amplitude: 8,
    pulseSpeed: 0.6,
    glowBlur: 4,
    freqSens: 0,
    breathePhase: 0,
    scanlineY: 0,
    time: 0,
    // Smoothed colors
    r: 180, g: 80, b: 5,
    ar: 255, ag: 140, ab: 20,
  });

  // Per-column glitch displacement (persistent across frames)
  const glitchOffsetsRef = useRef(new Float32Array(LINE_COLUMNS));
  const glitchTimersRef = useRef(new Float32Array(LINE_COLUMNS));

  useEffect(() => { audioRef.current = audioLevel; }, [audioLevel]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { freqBandsRef.current = frequencyBands; }, [frequencyBands]);

  // ---- Main render loop ----

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

    // ---- Smooth audio ----
    const atkRate = rawAudio > smoothAudioRef.current ? 0.5 : 0.06;
    smoothAudioRef.current = lerp(smoothAudioRef.current, rawAudio, atkRate);
    const audio = smoothAudioRef.current;

    // ---- Lerp params ----
    cur.opacity = lerp(cur.opacity, params.baseOpacity + params.audioOpacityGain * audio, t);
    cur.amplitude = lerp(cur.amplitude, params.baseAmplitude + params.audioAmplitudeGain * audio, t);
    cur.pulseSpeed = lerp(cur.pulseSpeed, params.pulseSpeed + params.audioPulseGain * audio, t);
    cur.glowBlur = lerp(cur.glowBlur, params.glowBlur, t);
    cur.freqSens = lerp(cur.freqSens, params.frequencySensitivity, t);

    // Colors
    cur.r = lerp(cur.r, params.color[0], t);
    cur.g = lerp(cur.g, params.color[1], t);
    cur.b = lerp(cur.b, params.color[2], t);
    cur.ar = lerp(cur.ar, params.accentColor[0], t);
    cur.ag = lerp(cur.ag, params.accentColor[1], t);
    cur.ab = lerp(cur.ab, params.accentColor[2], t);

    // Breathe
    let breatheOffset = 0;
    if (params.breatheSpeed > 0) {
      cur.breathePhase += delta * params.breatheSpeed * Math.PI * 2;
      breatheOffset = Math.sin(cur.breathePhase) * params.breatheAmp;
    }

    // Scanline
    if (params.scanlineSpeed > 0) {
      cur.scanlineY = (cur.scanlineY + delta * params.scanlineSpeed) % 1;
    }

    cur.time += delta * cur.pulseSpeed;
    const timeVal = cur.time;

    // ---- Canvas setup ----
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

    const baseY = h; // Bottom of canvas
    const ampPx = (h * (cur.amplitude + breatheOffset)) / 100;
    const bands = freqBandsRef.current;

    const cr = Math.round(cur.r);
    const cg = Math.round(cur.g);
    const cb = Math.round(cur.b);
    const ar = Math.round(cur.ar);
    const ag = Math.round(cur.ag);
    const ab = Math.round(cur.ab);

    // ---- Update glitch state ----
    const glitchOff = glitchOffsetsRef.current;
    const glitchTmr = glitchTimersRef.current;

    for (let col = 0; col < LINE_COLUMNS; col++) {
      glitchTmr[col] -= delta;
      if (glitchTmr[col] <= 0) {
        glitchOff[col] *= 0.85; // decay
      }
      if (Math.random() < params.glitchProb * delta * 60) {
        // New glitch: horizontal displacement + timer
        glitchOff[col] = (Math.random() - 0.5) * 20 * dpr;
        glitchTmr[col] = 0.05 + Math.random() * 0.1;
      }
    }

    // ---- Compute wave envelope per column ----
    // We compute the MAX wave height across all layers for each column

    const colWidth = w / LINE_COLUMNS;

    // Pre-compute per-column wave heights (composite of all layers)
    const waveHeights = new Float32Array(LINE_COLUMNS);

    for (let col = 0; col < LINE_COLUMNS; col++) {
      const xNorm = col / LINE_COLUMNS;

      // Frequency band modulation for this column
      let freqMod = 0;
      if (bands && cur.freqSens > 0) {
        const bandPos = xNorm * (NUM_BANDS - 1);
        const bandIdx = Math.floor(bandPos);
        const bandFrac = bandPos - bandIdx;
        const b0 = bands[Math.min(bandIdx, NUM_BANDS - 1)];
        const b1 = bands[Math.min(bandIdx + 1, NUM_BANDS - 1)];
        freqMod = (b0 + bandFrac * (b1 - b0)) * cur.freqSens;
      }

      // Composite wave height from all layers
      let maxH = 0;
      for (let li = 0; li < WAVE_LAYERS.length; li++) {
        const layer = WAVE_LAYERS[li];
        const waveAmp = ampPx * layer.ampMult;

        const shape = Math.sin(xNorm * Math.PI * 2 * layer.freq + layer.phase)
                    + Math.sin(xNorm * Math.PI * 2 * layer.freq * 1.6 + layer.phase * 2) * 0.35;

        const pulse = Math.sin(timeVal + layer.pulsePhase)
                    + Math.sin(timeVal * 1.7 + layer.pulsePhase + xNorm * 2) * 0.3;

        const audioSpike = Math.sin(timeVal * 4 + xNorm * Math.PI * 8) * audio * 0.8;

        const waveH = waveAmp * (0.4 + (shape * 0.3 + 0.3) * (0.5 + pulse * 0.5))
                    + audioSpike * ampPx
                    + freqMod * ampPx * 1.5;

        if (waveH > maxH) maxH = waveH;
      }

      waveHeights[col] = Math.max(0, maxH);
    }

    // ---- Draw: vertical neon lines (the dense field) ----

    // Glow layer (thicker, lower opacity, blurred via shadow)
    ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.6)`;
    ctx.shadowBlur = cur.glowBlur * dpr;

    for (let col = 0; col < LINE_COLUMNS; col++) {
      const waveH = waveHeights[col];
      if (waveH < 1) continue;

      const xBase = col * colWidth + colWidth * 0.5;
      const x = xBase + glitchOff[col];
      const isGlitching = glitchTmr[col] > 0;

      // Per-column variation: jitter height slightly for organic feel
      const jitter = colHash(col, 1) * 0.15 - 0.075;
      const lineH = waveH * (1 + jitter);
      const topY = baseY - lineH;

      // Intensity: columns near wave peaks glow brighter
      const intensity = Math.min(1, lineH / (ampPx * 0.8 + 1));

      // Pick color: glitching columns flash accent
      const useAccent = isGlitching && Math.random() > 0.3;
      const lr = useAccent ? ar : cr;
      const lg = useAccent ? ag : cg;
      const lb = useAccent ? ab : cb;

      // Main line
      const alpha = cur.opacity * (0.3 + intensity * 0.7);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${lr}, ${lg}, ${lb})`;
      ctx.lineWidth = (isGlitching ? 2 : 1) * dpr;

      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, topY);
      ctx.stroke();

      // Bright tip (neon hotspot at top of line)
      if (intensity > 0.3) {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = `rgb(${Math.min(255, lr + 60)}, ${Math.min(255, lg + 40)}, ${Math.min(255, lb + 20)})`;
        const tipR = (1 + intensity * 1.5) * dpr;
        ctx.beginPath();
        ctx.arc(x, topY, tipR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scattered interior particles along the line (adds density)
      if (intensity > 0.2) {
        const particleCount = Math.floor(intensity * 4);
        for (let p = 0; p < particleCount; p++) {
          const py = topY + colHash(col, p + 10) * lineH;
          const pAlpha = colHash(col, p + 50) * alpha * 0.6;
          ctx.globalAlpha = pAlpha;
          ctx.fillStyle = `rgb(${lr}, ${lg}, ${lb})`;
          ctx.fillRect(x - dpr * 0.5, py, dpr, dpr * (1 + colHash(col, p + 30) * 2));
        }
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // ---- Horizontal glitch bars ----
    if (params.glitchProb > 0.005) {
      const barCount = Math.floor(params.glitchProb * 150);
      for (let i = 0; i < barCount; i++) {
        if (Math.random() > 0.3) continue;
        const barY = baseY - Math.random() * ampPx * 1.5;
        const barW = (20 + Math.random() * 100) * dpr;
        const barX = Math.random() * w;
        ctx.globalAlpha = 0.06 + Math.random() * 0.08;
        ctx.fillStyle = `rgb(${ar}, ${ag}, ${ab})`;
        ctx.fillRect(barX, barY, barW, dpr * (1 + Math.random()));
      }
    }

    // ---- Scanline sweep ----
    if (params.scanlineSpeed > 0) {
      const scanAbsY = baseY - cur.scanlineY * ampPx * 2;
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = `rgb(${ar}, ${ag}, ${ab})`;
      ctx.fillRect(0, scanAbsY - dpr, w, 2 * dpr);
      // Subtle halo around scanline
      const grad = ctx.createLinearGradient(0, scanAbsY - 15 * dpr, 0, scanAbsY + 15 * dpr);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `rgba(${ar}, ${ag}, ${ab}, 0.04)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanAbsY - 15 * dpr, w, 30 * dpr);
    }

    // ---- Rain particles (falling dots above the wave) ----
    const rain = rainRef.current;
    const targetRain = params.rainCount;

    // Spawn new particles
    let aliveCount = 0;
    for (let i = 0; i < rain.length; i++) {
      if (rain[i].alive) aliveCount++;
    }
    const toSpawn = Math.min(3, targetRain - aliveCount);
    for (let s = 0; s < toSpawn; s++) {
      for (let i = 0; i < rain.length; i++) {
        if (!rain[i].alive) {
          const p = rain[i];
          p.x = Math.random();
          p.y = 0;
          p.speed = (0.3 + Math.random() * 0.7) * params.rainSpeed;
          p.opacity = 0.15 + Math.random() * 0.35;
          p.length = (3 + Math.random() * 8) * dpr;
          p.alive = true;
          break;
        }
      }
    }

    // Update and draw rain
    ctx.lineWidth = dpr * 0.75;
    for (let i = 0; i < rain.length; i++) {
      const p = rain[i];
      if (!p.alive) continue;

      p.y += p.speed * delta;

      // Rain falls from above the wave envelope down to it
      const col = Math.floor(p.x * LINE_COLUMNS);
      const waveH = waveHeights[Math.min(col, LINE_COLUMNS - 1)] || 0;
      const waveTop = baseY - waveH;
      const rainZoneH = ampPx * 1.5;
      const absY = waveTop - rainZoneH * (1 - p.y);

      if (p.y > 1) {
        p.alive = false;
        continue;
      }

      const absX = p.x * w;
      ctx.globalAlpha = p.opacity * cur.opacity * (1 - p.y * 0.5);
      ctx.strokeStyle = `rgb(${cr}, ${cg}, ${cb})`;
      ctx.beginPath();
      ctx.moveTo(absX, absY);
      ctx.lineTo(absX, absY + p.length);
      ctx.stroke();
    }

    // ---- Faint base line at the very bottom ----
    ctx.globalAlpha = cur.opacity * 0.2;
    ctx.strokeStyle = `rgb(${cr}, ${cg}, ${cb})`;
    ctx.lineWidth = dpr;
    ctx.beginPath();
    ctx.moveTo(0, baseY - 1);
    ctx.lineTo(w, baseY - 1);
    ctx.stroke();

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ---- Lifecycle ----

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
