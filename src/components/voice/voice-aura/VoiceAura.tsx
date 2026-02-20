'use client';

/**
 * VoiceAura — Soft neon aura with ASCII art elements.
 *
 * PERFORMANCE-OPTIMIZED: Two-canvas architecture.
 *  - Glow canvas: rendered at half DPR, CSS `filter: blur()` (GPU-accelerated)
 *  - Main canvas: crisp details at full DPR, zero shadowBlur
 *
 * All shadowBlur calls eliminated. Lines batched into single stroke paths.
 * Float32Array buffers pre-allocated. Color strings cached per frame.
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
  x: number;
  y: number;
  speed: number;
  opacity: number;
  char: string;
  size: number;
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
  x: number;
  yOffset: number;
  driftX: number;
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
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(0);
  const audioRef = useRef(0);
  const stateRef = useRef<TutorState>(state);
  const smoothAudioRef = useRef(0);
  const freqBandsRef = useRef<Float32Array | undefined>(undefined);
  const rainRef = useRef<AsciiRainDrop[]>(createRainPool());
  const fieldRef = useRef<AsciiFieldChar[]>(createFieldPool());

  // Pre-allocated buffer — reused every frame, never re-created
  const waveHeightsRef = useRef(new Float32Array(LINE_COLUMNS));

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
    const glowCanvas = glowCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!glowCanvas || !mainCanvas) return;
    const gCtx = glowCanvas.getContext('2d');
    const mCtx = mainCanvas.getContext('2d');
    if (!gCtx || !mCtx) return;

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

    // ---- Lerp params ----
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

    // ---- Canvas sizing ----
    const fullDpr = Math.min(window.devicePixelRatio, 2);
    const glowDpr = fullDpr * 0.5; // Half resolution for glow — CSS blur hides it
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mW = Math.round(vw * fullDpr);
    const mH = Math.round(vh * fullDpr);
    const gW = Math.round(vw * glowDpr);
    const gH = Math.round(vh * glowDpr);

    if (mainCanvas.width !== mW || mainCanvas.height !== mH) {
      mainCanvas.width = mW;
      mainCanvas.height = mH;
    }
    if (glowCanvas.width !== gW || glowCanvas.height !== gH) {
      glowCanvas.width = gW;
      glowCanvas.height = gH;
    }

    mCtx.clearRect(0, 0, mW, mH);
    gCtx.clearRect(0, 0, gW, gH);

    // Update CSS blur dynamically (cheap DOM style update)
    glowCanvas.style.filter = `blur(${Math.round(cur.glowBlur)}px)`;

    // ---- Shared values ----
    const baseYMain = mH;
    const baseYGlow = gH;
    const ampPxMain = (mH * (cur.amplitude + breatheOffset)) / 100;
    const ampPxGlow = (gH * (cur.amplitude + breatheOffset)) / 100;
    const bands = freqBandsRef.current;

    // Cache color strings — computed ONCE per frame
    const cr = Math.round(cur.r);
    const cg = Math.round(cur.g);
    const cb = Math.round(cur.b);
    const ar = Math.round(cur.ar);
    const ag = Math.round(cur.ag);
    const ab = Math.round(cur.ab);
    const colorStr = `rgb(${cr},${cg},${cb})`;
    const accentStr = `rgb(${ar},${ag},${ab})`;
    const tipStr = `rgb(${Math.min(255, cr + 50)},${Math.min(255, cg + 40)},${Math.min(255, cb + 30)})`;

    // ---- Glitch state ----
    const glitchOff = glitchOffsetsRef.current;
    const glitchTmr = glitchTimersRef.current;

    for (let col = 0; col < LINE_COLUMNS; col++) {
      glitchTmr[col] -= delta;
      if (glitchTmr[col] <= 0) glitchOff[col] *= 0.9;
      if (Math.random() < params.glitchProb * delta * 60) {
        glitchOff[col] = (Math.random() - 0.5) * 15;
        glitchTmr[col] = 0.04 + Math.random() * 0.08;
      }
    }

    // ---- Compute wave envelope (reuse pre-allocated buffer) ----
    const colWidthMain = mW / LINE_COLUMNS;
    const colWidthGlow = gW / LINE_COLUMNS;
    const waveHeights = waveHeightsRef.current;

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
        const waveAmp = 1 * layer.ampMult; // Normalized 0-1, scale later per canvas
        const shape = Math.sin(xNorm * Math.PI * 2 * layer.freq + layer.phase)
                    + Math.sin(xNorm * Math.PI * 2 * layer.freq * 1.6 + layer.phase * 2) * 0.35;
        const pulse = Math.sin(timeVal + layer.pulsePhase)
                    + Math.sin(timeVal * 1.7 + layer.pulsePhase + xNorm * 2) * 0.3;
        const audioSpike = Math.sin(timeVal * 4 + xNorm * Math.PI * 8) * audio * 0.6;
        const waveH = waveAmp * (0.4 + (shape * 0.3 + 0.3) * (0.5 + pulse * 0.5))
                    + audioSpike
                    + freqMod * 1.5;
        if (waveH > maxH) maxH = waveH;
      }
      waveHeights[col] = Math.max(0, maxH);
    }

    // ============================================================
    // GLOW CANVAS — thick lines, no shadowBlur, CSS blur handles glow
    // ============================================================

    gCtx.strokeStyle = colorStr;
    gCtx.lineWidth = cur.lineThickness * glowDpr * 3;
    gCtx.lineCap = 'round';
    gCtx.globalAlpha = cur.opacity * 0.4;

    // Batch ALL glow lines into a single path
    gCtx.beginPath();
    for (let col = 0; col < LINE_COLUMNS; col += 2) {
      const waveH = waveHeights[col] * ampPxGlow;
      if (waveH < 2) continue;

      const xBase = col * colWidthGlow + colWidthGlow * 0.5;
      const x = xBase + glitchOff[col] * glowDpr;
      const jitter = colHash(col, 1) * 0.1 - 0.05;
      const lineH = waveH * (1 + jitter);

      gCtx.moveTo(x, baseYGlow);
      gCtx.lineTo(x, baseYGlow - lineH);
    }
    gCtx.stroke();

    // ASCII on glow canvas (simpler — just colored text, blur handles the glow)
    const field = fieldRef.current;
    let fieldAlive = 0;
    for (let i = 0; i < field.length; i++) {
      if (field[i].alive) fieldAlive++;
    }
    const toSpawnField = Math.min(2, params.asciiFieldCount - fieldAlive);
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

    // Draw field chars on glow canvas (no shadowBlur, CSS blur handles it)
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillStyle = colorStr;

    // Group by approximate font size to reduce ctx.font calls
    const fontSizeGroups: Map<number, number[]> = new Map();
    for (let i = 0; i < field.length; i++) {
      const fc = field[i];
      if (!fc.alive) continue;

      fc.driftPhase += delta * 0.5;
      fc.x += fc.driftX * delta;

      if (fc.x < -0.05 || fc.x > 1.05) {
        fc.alive = false;
        continue;
      }

      const col = Math.floor(fc.x * LINE_COLUMNS);
      const waveH = waveHeights[Math.min(Math.max(0, col), LINE_COLUMNS - 1)] * ampPxGlow;
      if (waveH < 5) {
        fc.opacity -= delta * 2;
        if (fc.opacity <= 0) { fc.alive = false; continue; }
      }

      // Round font size to nearest 2px to reduce unique sizes
      const roundedSize = Math.round(fc.size * glowDpr * 0.5) * 2;
      let group = fontSizeGroups.get(roundedSize);
      if (!group) {
        group = [];
        fontSizeGroups.set(roundedSize, group);
      }
      group.push(i);

      if (Math.random() < 0.005) fc.char = pickChar(FIELD_CHARS);
    }

    for (const [fontSize, indices] of fontSizeGroups) {
      gCtx.font = `${fontSize}px monospace`;
      for (const i of indices) {
        const fc = field[i];
        const col = Math.floor(fc.x * LINE_COLUMNS);
        const waveH = waveHeights[Math.min(Math.max(0, col), LINE_COLUMNS - 1)] * ampPxGlow;
        const absX = fc.x * gW;
        const absY = baseYGlow - waveH * fc.yOffset + Math.sin(fc.driftPhase) * 5 * glowDpr;
        gCtx.globalAlpha = fc.opacity * cur.opacity * 0.6;
        gCtx.fillText(fc.char, absX, absY);
      }
    }

    // ============================================================
    // MAIN CANVAS — crisp details, zero blur
    // ============================================================

    // ---- Layer 2: Sharp inner lines (individual draws, zero shadowBlur) ----
    const normalLineWidth = cur.lineThickness * 0.5 * fullDpr;
    const glitchLineWidth = (cur.lineThickness * 0.5 + 1) * fullDpr;
    mCtx.lineCap = 'round';

    for (let col = 0; col < LINE_COLUMNS; col++) {
      const waveH = waveHeights[col] * ampPxMain;
      if (waveH < 1) continue;

      const xBase = col * colWidthMain + colWidthMain * 0.5;
      const x = xBase + glitchOff[col] * fullDpr;
      const isGlitching = glitchTmr[col] > 0;
      const jitter = colHash(col, 1) * 0.1 - 0.05;
      const lineH = waveH * (1 + jitter);
      const topY = baseYMain - lineH;
      const intensity = Math.min(1, lineH / (ampPxMain * 0.7 + 1));

      const useAccent = isGlitching && Math.random() > 0.4;

      mCtx.globalAlpha = cur.opacity * (0.2 + intensity * 0.5);
      mCtx.strokeStyle = useAccent ? accentStr : colorStr;
      mCtx.lineWidth = isGlitching ? glitchLineWidth : normalLineWidth;
      mCtx.beginPath();
      mCtx.moveTo(x, baseYMain);
      mCtx.lineTo(x, topY);
      mCtx.stroke();

      // Bright neon tip (simple filled circle, no blur)
      if (intensity > 0.25) {
        mCtx.globalAlpha = cur.opacity * intensity * 0.7;
        mCtx.fillStyle = tipStr;
        const tipR = (1.5 + intensity * 2) * fullDpr;
        mCtx.beginPath();
        mCtx.arc(x, topY, tipR, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    // ---- Layer 4: ASCII rain on main canvas ----
    const rain = rainRef.current;
    let rainAlive = 0;
    for (let i = 0; i < rain.length; i++) {
      if (rain[i].alive) rainAlive++;
    }

    const toSpawnRain = Math.min(3, params.asciiRainCount - rainAlive);
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

    // Group rain by font size too
    const rainFontGroups: Map<number, number[]> = new Map();
    for (let i = 0; i < rain.length; i++) {
      const rd = rain[i];
      if (!rd.alive) continue;

      rd.y += rd.speed * delta;
      if (rd.y > 1) { rd.alive = false; continue; }
      if (Math.random() < 0.03) rd.char = pickChar(RAIN_CHARS);

      const roundedSize = Math.round(rd.size * fullDpr * 0.5) * 2;
      let group = rainFontGroups.get(roundedSize);
      if (!group) {
        group = [];
        rainFontGroups.set(roundedSize, group);
      }
      group.push(i);
    }

    mCtx.textAlign = 'center';
    mCtx.textBaseline = 'middle';
    mCtx.fillStyle = colorStr;

    for (const [fontSize, indices] of rainFontGroups) {
      mCtx.font = `${fontSize}px monospace`;
      for (const i of indices) {
        const rd = rain[i];
        const col = Math.floor(rd.x * LINE_COLUMNS);
        const waveH = waveHeights[Math.min(Math.max(0, col), LINE_COLUMNS - 1)] * ampPxMain;
        const waveTop = baseYMain - waveH;
        const rainZone = ampPxMain * 1.8;
        const absY = waveTop - rainZone * (1 - rd.y);
        const absX = rd.x * mW;

        const fadeIn = Math.min(1, rd.y * 5);
        const fadeOut = 1 - rd.y * 0.4;
        mCtx.globalAlpha = rd.opacity * cur.opacity * fadeIn * fadeOut;
        mCtx.fillText(rd.char, absX, absY);
      }
    }

    // ---- Layer 5: Horizontal glitch bars ----
    if (params.glitchProb > 0.003) {
      const barCount = Math.floor(params.glitchProb * 80);
      mCtx.fillStyle = accentStr;
      for (let i = 0; i < barCount; i++) {
        if (Math.random() > 0.25) continue;
        const barY = baseYMain - Math.random() * ampPxMain * 1.5;
        const barW = (30 + Math.random() * 80) * fullDpr;
        const barX = Math.random() * mW;
        mCtx.globalAlpha = 0.03 + Math.random() * 0.05;
        mCtx.fillRect(barX, barY, barW, fullDpr * (1 + Math.random()));
      }
    }

    // ---- Layer 6: Scanline sweep ----
    if (params.scanlineSpeed > 0) {
      const scanAbsY = baseYMain - cur.scanlineY * ampPxMain * 2;
      const grad = mCtx.createLinearGradient(0, scanAbsY - 20 * fullDpr, 0, scanAbsY + 20 * fullDpr);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.4, `rgba(${ar},${ag},${ab},0.06)`);
      grad.addColorStop(0.5, `rgba(${ar},${ag},${ab},0.12)`);
      grad.addColorStop(0.6, `rgba(${ar},${ag},${ab},0.06)`);
      grad.addColorStop(1, 'transparent');
      mCtx.globalAlpha = 1;
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, scanAbsY - 20 * fullDpr, mW, 40 * fullDpr);
    }

    // ---- Layer 7: Soft base glow at bottom ----
    const baseGrad = mCtx.createLinearGradient(0, baseYMain - 30 * fullDpr, 0, baseYMain);
    baseGrad.addColorStop(0, 'transparent');
    baseGrad.addColorStop(1, `rgba(${cr},${cg},${cb},${cur.opacity * 0.15})`);
    mCtx.globalAlpha = 1;
    mCtx.fillStyle = baseGrad;
    mCtx.fillRect(0, baseYMain - 30 * fullDpr, mW, 30 * fullDpr);

    mCtx.globalAlpha = 1;
    gCtx.globalAlpha = 1;
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
    <div
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
    >
      {/* Glow layer — half-res canvas, CSS blur updated dynamically in rAF */}
      <canvas
        ref={glowCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: `blur(${Math.round(curRef.current.glowBlur)}px)`,
        }}
      />
      {/* Crisp detail layer — full-res, no blur */}
      <canvas
        ref={mainCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
