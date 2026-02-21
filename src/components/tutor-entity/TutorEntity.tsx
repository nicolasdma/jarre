'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ENTITY_STATES,
  FRAME_INTERVAL,
  LERP_SPEED,
  INTRO_LERP_SPEED,
  HOVER_LERP_SPEED,
  INTRO_HOLD_DURATION,
  type EntityStateParams,
} from './entity-constants';
import { lerp, lerpColor, computeEntityFrame, paintEntityFrame } from './entity-renderer';
import { getCurrentGeometryName } from './geometries';
import { useTutorFrequency } from '../voice/use-tutor-frequency';
import type { TutorState } from '../voice/use-voice-session';

interface TutorEntityProps {
  onStartVoice: () => void;
  /** AnalyserNode from Gemini playback audio — drives frequency visualization */
  playbackAnalyser?: AnalyserNode | null;
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

export function TutorEntity({
  onStartVoice,
  playbackAnalyser,
  voiceState,
}: TutorEntityProps) {
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const sharpCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(false);
  const [debugName, setDebugName] = useState('');
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const introPhaseRef = useRef(true);
  const currentParamsRef = useRef<EntityStateParams>({ ...ENTITY_STATES.intro });

  // Keep voiceState in a ref so the animate callback always reads the latest
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  // Frequency bands from Gemini playback audio
  const frequencyBands = useTutorFrequency(playbackAnalyser ?? null);
  const frequencyBandsRef = useRef(frequencyBands);
  frequencyBandsRef.current = frequencyBands;

  const isVoiceActive = voiceState !== undefined;

  const animate = useCallback(() => {
    const glowCanvas = glowCanvasRef.current;
    const sharpCanvas = sharpCanvasRef.current;
    if (!glowCanvas || !sharpCanvas) return;
    const glowCtx = glowCanvas.getContext('2d');
    const sharpCtx = sharpCanvas.getContext('2d');
    if (!glowCtx || !sharpCtx) return;

    const now = performance.now();
    const elapsed = now - lastFrameRef.current;

    if (elapsed < FRAME_INTERVAL) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    lastFrameRef.current = now - (elapsed % FRAME_INTERVAL);
    const dt = Math.min(elapsed / 1000, 0.1);
    timeRef.current += dt;

    // Determine target state and lerp speed
    let target: EntityStateParams;
    let speed: number;

    if (introPhaseRef.current) {
      if (timeRef.current < INTRO_HOLD_DURATION) {
        target = ENTITY_STATES.intro;
        speed = LERP_SPEED;
      } else {
        target = ENTITY_STATES.idle;
        speed = INTRO_LERP_SPEED;

        const radiusDiff = Math.abs(
          currentParamsRef.current.majorRadius - ENTITY_STATES.idle.majorRadius,
        );
        if (radiusDiff < 0.005) {
          introPhaseRef.current = false;
        }
      }
    } else if (voiceStateRef.current) {
      // Voice session active — target driven by tutor state
      const stateKey = voiceStateToEntityState(voiceStateRef.current);
      target = ENTITY_STATES[stateKey];
      speed = LERP_SPEED;
    } else {
      target = hovered ? ENTITY_STATES.hover : ENTITY_STATES.idle;
      // Gentle transition into hover, normal speed out
      speed = hovered ? HOVER_LERP_SPEED : LERP_SPEED;
    }

    const lerpT = Math.min(1, speed * dt);
    currentParamsRef.current = lerpParams(currentParamsRef.current, target, lerpT);

    const { w, h } = sizeRef.current;

    // Compute geometry ONCE, paint to BOTH canvases
    const focal = mouseRef.current;
    const bands = voiceStateRef.current ? frequencyBandsRef.current : null;
    computeEntityFrame(w, h, currentParamsRef.current, timeRef.current, focal, bands);
    paintEntityFrame(glowCtx, w, h, currentParamsRef.current, focal);
    paintEntityFrame(sharpCtx, w, h, currentParamsRef.current, focal);

    // Debug: update geometry name label
    setDebugName(getCurrentGeometryName());

    rafRef.current = requestAnimationFrame(animate);
  }, [hovered]);

  useEffect(() => {
    const container = containerRef.current;
    const glowCanvas = glowCanvasRef.current;
    const sharpCanvas = sharpCanvasRef.current;
    if (!container || !glowCanvas || !sharpCanvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio || 1;

      for (const canvas of [glowCanvas, sharpCanvas]) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }

      sizeRef.current = { w: width, h: height };
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        lastFrameRef.current = performance.now();
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [animate]);

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
      className={`relative w-full h-full transition-opacity duration-500 ${
        isVoiceActive ? 'cursor-default' : 'cursor-pointer'
      }`}
      onMouseEnter={() => { setHovered(true); }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }}
      onMouseLeave={() => { setHovered(false); mouseRef.current = null; }}
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
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 text-orange-400 text-xs font-mono rounded pointer-events-none z-10">
        {debugName}
      </div>
    </div>
  );
}
