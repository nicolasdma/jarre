'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ENTITY_STATES,
  FRAME_INTERVAL,
  LERP_SPEED,
  HOVER_LERP_SPEED,
  type EntityStateParams,
} from './entity-constants';
import { lerp, lerpColor, computeEntityFrame, paintEntityFrame } from './entity-renderer';
import { setAudioBands, setVoiceActive, setWaveMicLevel } from './geometries';
import { entityShouldAnimate, SETTLE_MS } from './entity-loop';
import { useTutorFrequency } from '../voice/use-tutor-frequency';
import { useAudioLevelRef } from '../voice/use-audio-level';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import type { TutorState } from '../voice/use-voice-session';

interface TutorEntityProps {
  onStartVoice: () => void;
  /** AnalyserNode from Gemini playback audio — drives frequency visualization */
  playbackAnalyser?: AnalyserNode | null;
  /** Mic MediaStream — drives reactivity to user's voice */
  micStream?: MediaStream | null;
  /** Current tutor state from voice session — overrides idle/hover targeting */
  voiceState?: TutorState;
}

function lerpParams(
  a: EntityStateParams,
  b: EntityStateParams,
  t: number,
): EntityStateParams {
  return {
    majorRadius: lerp(a.majorRadius, b.majorRadius, t),
    minorRadius: lerp(a.minorRadius, b.minorRadius, t),
    rotSpeedA: lerp(a.rotSpeedA, b.rotSpeedA, t),
    rotSpeedB: lerp(a.rotSpeedB, b.rotSpeedB, t),
    thetaStep: lerp(a.thetaStep, b.thetaStep, t),
    phiStep: lerp(a.phiStep, b.phiStep, t),
    charOpacity: lerp(a.charOpacity, b.charOpacity, t),
    glowOpacity: lerp(a.glowOpacity, b.glowOpacity, t),
    color: lerpColor(a.color, b.color, t),
    accentColor: lerpColor(a.accentColor, b.accentColor, t),
    fontSize: a.fontSize,
    colorCycleSpeed: lerp(a.colorCycleSpeed, b.colorCycleSpeed, t),
    colorCycleIntensity: lerp(a.colorCycleIntensity, b.colorCycleIntensity, t),
    sparkleProb: lerp(a.sparkleProb, b.sparkleProb, t),
    glowBlur: lerp(a.glowBlur, b.glowBlur, t),
  };
}

/** Map TutorState to an entity visual state key */
function voiceStateToEntityState(ts: TutorState): keyof typeof ENTITY_STATES {
  switch (ts) {
    case 'speaking': return 'speaking';
    case 'listening': return 'listening';
    case 'thinking': return 'thinking';
    case 'idle':
    default: return 'idle';
  }
}

/** Breathing pulse for thinking state — sinusoidal radius oscillation */
const BREATH_SPEED = 1.8;     // cycles per second
const BREATH_RADIUS_AMP = 0.015; // how much major radius oscillates
const BREATH_OPACITY_AMP = 0.08; // how much opacity oscillates

const WARM_PEAK: [number, number, number] = [255, 190, 90];

/**
 * The glow layer is blurred by CSS, so its pixels are never seen sharp: it is
 * drawn at 1x even on a 2x screen (a quarter of the pixels to fill and blur).
 */
const GLOW_DPR = 1;

/**
 * The tutor in the sidebar: an ASCII torus that is the button to start a
 * voice session. At rest it is one still frame; it draws frames only while
 * the pointer is on it, a voice session drives it, or it eases back after
 * either (entity-loop.ts). Reduced motion: still frames only, one per change.
 */
export function TutorEntity({
  onStartVoice,
  playbackAnalyser,
  micStream,
  voiceState,
}: TutorEntityProps) {
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const sharpCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const hoveredRef = useRef(false);
  const settleUntilRef = useRef(0);
  const glowBlurRef = useRef(-1);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const currentParamsRef = useRef<EntityStateParams>({ ...ENTITY_STATES.idle });

  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Keep voiceState in a ref so the frame callback always reads the latest
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  // Frequency bands from Gemini playback audio (a buffer updated in place)
  const frequencyBands = useTutorFrequency(playbackAnalyser ?? null);
  const frequencyBandsRef = useRef(frequencyBands);
  frequencyBandsRef.current = frequencyBands;

  // Mic audio level — user's voice, read by the frame without re-rendering
  const micLevelRef = useAudioLevelRef(micStream ?? null);

  const isVoiceActive = voiceState !== undefined;

  /** Draw one frame advanced by dt seconds (0: a still frame of the current state). */
  const drawFrame = useCallback((dt: number) => {
    const glowCanvas = glowCanvasRef.current;
    const sharpCanvas = sharpCanvasRef.current;
    const glowCtx = glowCanvas?.getContext('2d');
    const sharpCtx = sharpCanvas?.getContext('2d');
    if (!glowCanvas || !glowCtx || !sharpCtx) return;

    timeRef.current += dt;
    const voice = voiceStateRef.current;
    const target = voice
      ? ENTITY_STATES[voiceStateToEntityState(voice)]
      : hoveredRef.current ? ENTITY_STATES.hover : ENTITY_STATES.idle;
    const speed = !voice && hoveredRef.current ? HOVER_LERP_SPEED : LERP_SPEED;
    // Reduced motion (or a still frame): jump to the state instead of easing.
    const lerpT = reducedMotionRef.current || dt === 0 ? 1 : Math.min(1, speed * dt);
    let params = lerpParams(currentParamsRef.current, target, lerpT);
    currentParamsRef.current = params;

    // Thinking state: breathing pulse — sinusoidal modulation of radius and opacity
    if (voice === 'thinking') {
      const breath = Math.sin(timeRef.current * BREATH_SPEED * Math.PI * 2);
      params = {
        ...params,
        majorRadius: params.majorRadius + breath * BREATH_RADIUS_AMP,
        minorRadius: params.minorRadius + breath * BREATH_RADIUS_AMP * 0.5,
        charOpacity: params.charOpacity + breath * BREATH_OPACITY_AMP,
        glowOpacity: params.glowOpacity + breath * BREATH_OPACITY_AMP * 0.6,
      };
    }

    // Listening state: pulse radius with mic level for "absorbing" feel
    const micLevel = micLevelRef.current;
    if (voice === 'listening' && micLevel > 0.01) {
      params = {
        ...params,
        majorRadius: params.majorRadius + micLevel * 0.03,
        charOpacity: Math.min(0.85, params.charOpacity + micLevel * 0.2),
      };
    }

    // Color cycling: gentle oscillation toward warm bright orange
    if (params.colorCycleSpeed > 0 && params.colorCycleIntensity > 0) {
      const wave1 = Math.sin(timeRef.current * params.colorCycleSpeed * Math.PI * 2);
      const wave2 = Math.sin(timeRef.current * params.colorCycleSpeed * Math.PI * 2 * 1.7 + 1.2);
      const blend = ((wave1 * 0.7 + wave2 * 0.3) * 0.5 + 0.5) * params.colorCycleIntensity;
      params = {
        ...params,
        color: lerpColor(params.color, WARM_PEAK, blend),
        accentColor: lerpColor(params.accentColor, WARM_PEAK, blend * 0.6),
        charOpacity: Math.min(1.0, params.charOpacity + blend * 0.05),
        glowOpacity: Math.min(1.0, params.glowOpacity + blend * 0.08),
      };
    }

    // The glow blur is a style write: only when its rounded value changes.
    const blur = Math.round(params.glowBlur);
    if (blur !== glowBlurRef.current) {
      glowBlurRef.current = blur;
      glowCanvas.style.filter = `blur(${blur}px)`;
    }

    const { w, h } = sizeRef.current;
    const focal = mouseRef.current;
    const bands = voice ? frequencyBandsRef.current : null;
    setAudioBands(bands, dt);
    const mic = voice === 'listening' ? micLevel : 0;
    setWaveMicLevel(mic);
    // Compute geometry once, paint it to both canvases.
    computeEntityFrame(w, h, params, timeRef.current, focal, bands, mic);
    paintEntityFrame(glowCtx, w, h, params, focal, timeRef.current);
    paintEntityFrame(sharpCtx, w, h, params, focal, timeRef.current);
  }, [micLevelRef]);

  const shouldAnimate = useCallback((now: number) => entityShouldAnimate({
    voiceActive: voiceStateRef.current !== undefined,
    hovered: hoveredRef.current,
    settleUntil: settleUntilRef.current,
    now,
    reducedMotion: reducedMotionRef.current,
    visible: isDrawable(sizeRef.current),
  }), []);

  const frame = useCallback(function step() {
    rafRef.current = 0;
    const now = performance.now();
    const elapsed = now - lastFrameRef.current;
    if (elapsed >= FRAME_INTERVAL) {
      lastFrameRef.current = now - (elapsed % FRAME_INTERVAL);
      drawFrame(Math.min(elapsed / 1000, 0.1));
    }
    if (shouldAnimate(now)) rafRef.current = requestAnimationFrame(step);
  }, [drawFrame, shouldAnimate]);

  /** Something changed: run the loop if there is motion to show, else draw one still frame. */
  const wake = useCallback(() => {
    const now = performance.now();
    if (shouldAnimate(now)) {
      if (!rafRef.current) {
        lastFrameRef.current = now - FRAME_INTERVAL;
        rafRef.current = requestAnimationFrame(frame);
      }
    } else if (isDrawable(sizeRef.current)) {
      drawFrame(0);
    }
  }, [drawFrame, frame, shouldAnimate]);

  // Activate/deactivate waveform morph on voice state change
  useEffect(() => {
    setVoiceActive(isVoiceActive);
    return () => setVoiceActive(false);
  }, [isVoiceActive]);

  // A voice state change is something to show; the end of a session eases back to rest.
  const hadVoiceRef = useRef(false);
  useEffect(() => {
    if (hadVoiceRef.current && voiceState === undefined) settleUntilRef.current = performance.now() + SETTLE_MS;
    hadVoiceRef.current = voiceState !== undefined;
    wake();
  }, [voiceState, reducedMotion, wake]);

  useEffect(() => {
    const container = containerRef.current;
    const glowCanvas = glowCanvasRef.current;
    const sharpCanvas = sharpCanvasRef.current;
    if (!container || !glowCanvas || !sharpCanvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio || 1;
      for (const [canvas, scale] of [[glowCanvas, Math.min(GLOW_DPR, dpr)], [sharpCanvas, dpr]] as const) {
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.getContext('2d')?.setTransform(scale, 0, 0, scale, 0, 0);
      }
      sizeRef.current = { w: width, h: height };
      // Resizing clears the canvases: redraw (or resume) right away.
      wake();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [wake]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else {
        wake();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [wake]);

  const handleClick = () => {
    if (!isVoiceActive) onStartVoice();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isVoiceActive) {
      e.preventDefault();
      onStartVoice();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${isVoiceActive ? 'cursor-default' : 'cursor-pointer'}`}
      onMouseEnter={() => {
        hoveredRef.current = true;
        wake();
      }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        mouseRef.current = null;
        settleUntilRef.current = performance.now() + SETTLE_MS;
        wake();
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={isVoiceActive ? 'Voice session active' : 'Open voice tutor session'}
    >
      <canvas
        ref={glowCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(6px)' }}
      />
      <canvas
        ref={sharpCanvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

/** The page is visible and the canvas has a size (it is display:none below lg). */
function isDrawable(size: { w: number; h: number }): boolean {
  return !document.hidden && size.w >= 10 && size.h >= 10;
}
