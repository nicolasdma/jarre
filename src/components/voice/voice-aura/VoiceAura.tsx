'use client';

/**
 * VoiceAura — Soft neon aura with ASCII art elements.
 *
 * Organic wave shapes rendered as heavily diffused neon lines with
 * floating ASCII characters, Matrix-style character rain, and subtle
 * glitch effects. The heavy blur gives everything a warm, dreamy glow
 * while the ASCII elements add a digital/cyberpunk layer.
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
  MAX_ASCII_RAIN,
  MAX_ASCII_FIELD,
  RAIN_CHARS,
  FIELD_CHARS,
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

function colHash(col: number, seed: number): number {
  const n = col * 137.5 + seed * 311.7;
  return ((Math.sin(n) * 43758.5453) % 1 + 1) % 1;
}

function pickChar(chars: string): string {
  return chars[Math.floor(Math.random() * chars.length)];
}

// ============================================================================
// ASCII Rain particle
// ============================================================================

interface AsciiRainDrop {
  x: number;        // 0-1 normalized
  y: number;        // progress 0-1 (0 = start, 1 = landed)
  speed: number;
  opacity: number;
  char: string;
  size: number;      // font size in px
  alive: boolean;
}

function createRainPool(): AsciiRainDrop[] {
  return Array.from({ length: MAX_ASCII_RAIN }, () => ({
    x: 0, y: 0, speed: 0, opacity: 0, char: '0', size: 10, alive: false,
  }));
}

// ============================================================================
// Floating ASCII field character
// ============================================================================

interface AsciiFieldChar {
  x: number;         // 0-1 normalized
  yOffset: number;   // 0-1 position within wave height
  driftX: number;    // slow horizontal drift speed
  driftPhase: number;
  opacity: number;
  char: string;
  size: number;
  alive: boolean;
}

function createFieldPool(): AsciiFieldChar[] {
  return Array.from({ length: MAX_ASCII_FIELD }, () => ({
    x: 0, yOffset: 0, driftX: 0, driftPhase: 0, opacity: 0,
    char: '·', size: 10, alive: false,
  }));
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
  const rainRef = useRef<AsciiRainDrop[]>(createRainPool());
  const fieldRef = useRef<AsciiFieldChar[]>(createFieldPool());

  const curRef = useRef({
    opacity: 0.25,
    amplitude: 8,
    pulseSpeed: 0.3,
    glowBlur: 18,
    lineThickness: 2,
    freqSens: 0,
    breathePhase: 0,
    scanlineY: 0,
    time: 0,
    r: 160, g: 80, b: 10,
    ar: 255, ag: 140, ab: 20,
  });

  const glitchOffsetsRef = useRef(new Float32Array(LINE_COLUMNS));
  const glitchTimersRef = useRef(new Float32Array(LINE_COLUMNS));

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

    // ---- Smooth audio ----
    const atkRate = rawAudio > smoothAudioRef.current ? 0.4 : 0.04;
    smoothAudioRef.current = lerp(smoothAudioRef.current, rawAudio, atkRate);
    const audio = smoothAudioRef.current;

    // ---- Lerp params (slow, smooth) ----
    cur.opacity = lerp(cur.opacity, params.baseOpacity + params.audioOpacityGain * audio, t);
    cur.amplitude = lerp(cur.amplitude, params.baseAmplitude + params.audioAmplitudeGain * audio, t);
    cur.pulseSpeed = lerp(cur.pulseSpeed, params.pulseSpeed + params.audioPulseGain * audio, t);
    cur.glowBlur = lerp(cur.glowBlur, params.glowBlur, t);
    cur.lineThickness = lerp(cur.lineThickness, params.lineThickness, t);
    cur.freqSens = lerp(cur.freqSens, params.frequencySensitivity, t);

    cur.r = lerp(cur.r, params.color[0], t);
    cur.g = lerp(cur.g, params.color[1], t);
    cur.b = lerp(cur.b, params.color[2], t);
    cur.ar = lerp(cur.ar, params.accentColor[0], t);
    cur.ag = lerp(cur.ag, params.accentColor[1], t);
    cur.ab = lerp(cur.ab, params.accentColor[2], t);

    let breatheOffset = 0;
    if (params.breatheSpeed > 0) {
      cur.breathePhase += delta * params.breatheSpeed * Math.PI * 2;
      breatheOffset = Math.sin(cur.breathePhase) * params.breatheAmp;
    }

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

    const baseY = h;
    const ampPx = (h * (cur.amplitude + breatheOffset)) / 100;
    const bands = freqBandsRef.current;

    const cr = Math.round(cur.r);
    const cg = Math.round(cur.g);
    const cb = Math.round(cur.b);
    const ar = Math.round(cur.ar);
    const ag = Math.round(cur.ag);
    const ab = Math.round(cur.ab);

    // ---- Glitch state ----
    const glitchOff = glitchOffsetsRef.current;
    const glitchTmr = glitchTimersRef.current;

    for (let col = 0; col < LINE_COLUMNS; col++) {
      glitchTmr[col] -= delta;
      if (glitchTmr[col] <= 0) glitchOff[col] *= 0.9;
      if (Math.random() < params.glitchProb * delta * 60) {
        glitchOff[col] = (Math.random() - 0.5) * 15 * dpr;
        glitchTmr[col] = 0.04 + Math.random() * 0.08;
      }
    }

    // ---- Compute wave envelope per column ----
    const colWidth = w / LINE_COLUMNS;
    const waveHeights = new Float32Array(LINE_COLUMNS);

    for (let col = 0; col < LINE_COLUMNS; col++) {
      const xNorm = col / LINE_COLUMNS;

      let freqMod = 0;
      if (bands && cur.freqSens > 0) {
        const bandPos = xNorm * (NUM_BANDS - 1);
        const bandIdx = Math.floor(bandPos);
        const bandFrac = bandPos - bandIdx;
        const b0 = bands[Math.min(bandIdx, NUM_BANDS - 1)];
        const b1 = bands[Math.min(bandIdx + 1, NUM_BANDS - 1)];
        freqMod = (b0 + bandFrac * (b1 - b0)) * cur.freqSens;
      }

      let maxH = 0;
      for (let li = 0; li < WAVE_LAYERS.length; li++) {
        const layer = WAVE_LAYERS[li];
        const waveAmp = ampPx * layer.ampMult;
        const shape = Math.sin(xNorm * Math.PI * 2 * layer.freq + layer.phase)
                    + Math.sin(xNorm * Math.PI * 2 * layer.freq * 1.6 + layer.phase * 2) * 0.35;
        const pulse = Math.sin(timeVal + layer.pulsePhase)
                    + Math.sin(timeVal * 1.7 + layer.pulsePhase + xNorm * 2) * 0.3;
        const audioSpike = Math.sin(timeVal * 4 + xNorm * Math.PI * 8) * audio * 0.6;
        const waveH = waveAmp * (0.4 + (shape * 0.3 + 0.3) * (0.5 + pulse * 0.5))
                    + audioSpike * ampPx
                    + freqMod * ampPx * 1.5;
        if (waveH > maxH) maxH = waveH;
      }
      waveHeights[col] = Math.max(0, maxH);
    }

    // ============================================================
    // LAYER 1: Soft diffused neon lines (heavy glow)
    // ============================================================

    ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.5)`;
    ctx.shadowBlur = cur.glowBlur * dpr;

    // Draw every other column for the "thick glow" pass
    for (let col = 0; col < LINE_COLUMNS; col += 2) {
      const waveH = waveHeights[col];
      if (waveH < 2) continue;

      const xBase = col * colWidth + colWidth * 0.5;
      const x = xBase + glitchOff[col];
      const jitter = colHash(col, 1) * 0.1 - 0.05;
      const lineH = waveH * (1 + jitter);
      const topY = baseY - lineH;
      const intensity = Math.min(1, lineH / (ampPx * 0.7 + 1));

      // Thick soft glow line
      ctx.globalAlpha = cur.opacity * (0.15 + intensity * 0.25);
      ctx.strokeStyle = `rgb(${cr}, ${cg}, ${cb})`;
      ctx.lineWidth = cur.lineThickness * dpr * 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, topY);
      ctx.stroke();
    }

    // ============================================================
    // LAYER 2: Sharp inner lines (crisp core inside the glow)
    // ============================================================

    ctx.shadowBlur = cur.glowBlur * dpr * 0.4;

    for (let col = 0; col < LINE_COLUMNS; col++) {
      const waveH = waveHeights[col];
      if (waveH < 1) continue;

      const xBase = col * colWidth + colWidth * 0.5;
      const x = xBase + glitchOff[col];
      const isGlitching = glitchTmr[col] > 0;
      const jitter = colHash(col, 1) * 0.1 - 0.05;
      const lineH = waveH * (1 + jitter);
      const topY = baseY - lineH;
      const intensity = Math.min(1, lineH / (ampPx * 0.7 + 1));

      const useAccent = isGlitching && Math.random() > 0.4;
      const lr = useAccent ? ar : cr;
      const lg = useAccent ? ag : cg;
      const lb = useAccent ? ab : cb;

      // Thin core line
      ctx.globalAlpha = cur.opacity * (0.2 + intensity * 0.5);
      ctx.strokeStyle = `rgb(${lr}, ${lg}, ${lb})`;
      ctx.lineWidth = (cur.lineThickness * 0.5 + (isGlitching ? 1 : 0)) * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, topY);
      ctx.stroke();

      // Bright neon tip
      if (intensity > 0.25) {
        ctx.globalAlpha = cur.opacity * intensity * 0.7;
        ctx.shadowBlur = cur.glowBlur * dpr * 0.8;
        ctx.fillStyle = `rgb(${Math.min(255, lr + 50)}, ${Math.min(255, lg + 40)}, ${Math.min(255, lb + 30)})`;
        const tipR = (1.5 + intensity * 2) * dpr;
        ctx.beginPath();
        ctx.arc(x, topY, tipR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = cur.glowBlur * dpr * 0.4;
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // ============================================================
    // LAYER 3: Floating ASCII field characters (inside the wave)
    // ============================================================

    const field = fieldRef.current;
    let fieldAlive = 0;
    for (let i = 0; i < field.length; i++) {
      if (field[i].alive) fieldAlive++;
    }

    const targetField = params.asciiFieldCount;
    const toSpawnField = Math.min(2, targetField - fieldAlive);
    for (let s = 0; s < toSpawnField; s++) {
      for (let i = 0; i < field.length; i++) {
        if (!field[i].alive) {
          const fc = field[i];
          fc.x = Math.random();
          fc.yOffset = 0.1 + Math.random() * 0.8;
          fc.driftX = (Math.random() - 0.5) * 0.02;
          fc.driftPhase = Math.random() * Math.PI * 2;
          fc.opacity = 0.1 + Math.random() * 0.3;
          fc.char = pickChar(FIELD_CHARS);
          fc.size = 8 + Math.random() * 6;
          fc.alive = true;
          break;
        }
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < field.length; i++) {
      const fc = field[i];
      if (!fc.alive) continue;

      fc.driftPhase += delta * 0.5;
      fc.x += fc.driftX * delta;

      // Wrap or kill if out of bounds
      if (fc.x < -0.05 || fc.x > 1.05) {
        fc.alive = false;
        continue;
      }

      const col = Math.floor(fc.x * LINE_COLUMNS);
      const waveH = waveHeights[Math.min(Math.max(0, col), LINE_COLUMNS - 1)] || 0;

      if (waveH < 5) {
        // Kill chars in columns with no wave
        fc.opacity -= delta * 2;
        if (fc.opacity <= 0) { fc.alive = false; continue; }
      }

      const absX = fc.x * w;
      const absY = baseY - waveH * fc.yOffset + Math.sin(fc.driftPhase) * 5 * dpr;
      const fontSize = fc.size * dpr;

      ctx.globalAlpha = fc.opacity * cur.opacity * 0.6;
      ctx.font = `${fontSize}px monospace`;
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.4)`;
      ctx.shadowBlur = 8 * dpr;
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
      ctx.fillText(fc.char, absX, absY);

      // Occasionally swap character
      if (Math.random() < 0.005) {
        fc.char = pickChar(FIELD_CHARS);
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // ============================================================
    // LAYER 4: ASCII rain (falling characters above the wave)
    // ============================================================

    const rain = rainRef.current;
    let rainAlive = 0;
    for (let i = 0; i < rain.length; i++) {
      if (rain[i].alive) rainAlive++;
    }

    const targetRain = params.asciiRainCount;
    const toSpawnRain = Math.min(3, targetRain - rainAlive);
    for (let s = 0; s < toSpawnRain; s++) {
      for (let i = 0; i < rain.length; i++) {
        if (!rain[i].alive) {
          const rd = rain[i];
          rd.x = Math.random();
          rd.y = 0;
          rd.speed = (0.2 + Math.random() * 0.5) * params.rainSpeed;
          rd.opacity = 0.1 + Math.random() * 0.3;
          rd.char = pickChar(RAIN_CHARS);
          rd.size = 7 + Math.random() * 5;
          rd.alive = true;
          break;
        }
      }
    }

    for (let i = 0; i < rain.length; i++) {
      const rd = rain[i];
      if (!rd.alive) continue;

      rd.y += rd.speed * delta;

      if (rd.y > 1) {
        rd.alive = false;
        continue;
      }

      const col = Math.floor(rd.x * LINE_COLUMNS);
      const waveH = waveHeights[Math.min(Math.max(0, col), LINE_COLUMNS - 1)] || 0;
      const waveTop = baseY - waveH;
      const rainZone = ampPx * 1.8;
      const absY = waveTop - rainZone * (1 - rd.y);
      const absX = rd.x * w;

      // Fade in at start, fade out as it approaches wave
      const fadeIn = Math.min(1, rd.y * 5);
      const fadeOut = 1 - rd.y * 0.4;
      const alpha = rd.opacity * cur.opacity * fadeIn * fadeOut;

      const fontSize = rd.size * dpr;
      ctx.globalAlpha = alpha;
      ctx.font = `${fontSize}px monospace`;
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.3)`;
      ctx.shadowBlur = 6 * dpr;
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
      ctx.fillText(rd.char, absX, absY);

      // Swap character occasionally (Matrix-style flicker)
      if (Math.random() < 0.03) {
        rd.char = pickChar(RAIN_CHARS);
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // ============================================================
    // LAYER 5: Horizontal glitch bars (subtle)
    // ============================================================

    if (params.glitchProb > 0.003) {
      const barCount = Math.floor(params.glitchProb * 80);
      for (let i = 0; i < barCount; i++) {
        if (Math.random() > 0.25) continue;
        const barY = baseY - Math.random() * ampPx * 1.5;
        const barW = (30 + Math.random() * 80) * dpr;
        const barX = Math.random() * w;
        ctx.globalAlpha = 0.03 + Math.random() * 0.05;
        ctx.fillStyle = `rgb(${ar}, ${ag}, ${ab})`;
        ctx.fillRect(barX, barY, barW, dpr * (1 + Math.random()));
      }
    }

    // ============================================================
    // LAYER 6: Scanline sweep (thinking state)
    // ============================================================

    if (params.scanlineSpeed > 0) {
      const scanAbsY = baseY - cur.scanlineY * ampPx * 2;
      // Soft halo
      const grad = ctx.createLinearGradient(0, scanAbsY - 20 * dpr, 0, scanAbsY + 20 * dpr);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.4, `rgba(${ar}, ${ag}, ${ab}, 0.06)`);
      grad.addColorStop(0.5, `rgba(${ar}, ${ag}, ${ab}, 0.12)`);
      grad.addColorStop(0.6, `rgba(${ar}, ${ag}, ${ab}, 0.06)`);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanAbsY - 20 * dpr, w, 40 * dpr);
    }

    // ============================================================
    // LAYER 7: Soft base glow at bottom edge
    // ============================================================

    const baseGrad = ctx.createLinearGradient(0, baseY - 30 * dpr, 0, baseY);
    baseGrad.addColorStop(0, 'transparent');
    baseGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, ${cur.opacity * 0.15})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, baseY - 30 * dpr, w, 30 * dpr);

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
