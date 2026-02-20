'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ENTITY_STATES,
  FRAME_INTERVAL,
  LERP_SPEED,
  INTRO_LERP_SPEED,
  INTRO_HOLD_DURATION,
  type EntityStateParams,
} from './entity-constants';
import { lerp, lerpColor, computeEntityFrame, paintEntityFrame } from './entity-renderer';
import { getCurrentGeometryName, setContemplativeMode } from './geometries';

interface TutorEntityProps {
  onStartVoice: () => void;
  hidden?: boolean;
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

export function TutorEntity({ onStartVoice, hidden }: TutorEntityProps) {
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const sharpCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [hovered, setHovered] = useState(false);
  const [debugName, setDebugName] = useState('');
  const introPhaseRef = useRef(true);
  const currentParamsRef = useRef<EntityStateParams>({ ...ENTITY_STATES.intro });

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
    } else {
      target = hovered ? ENTITY_STATES.hover : ENTITY_STATES.idle;
      // Slow transition into hover (contemplation), normal speed out
      speed = hovered ? INTRO_LERP_SPEED : LERP_SPEED;
    }

    const lerpT = Math.min(1, speed * dt);
    currentParamsRef.current = lerpParams(currentParamsRef.current, target, lerpT);

    const { w, h } = sizeRef.current;

    // Compute geometry ONCE, paint to BOTH canvases
    computeEntityFrame(w, h, currentParamsRef.current, timeRef.current);
    paintEntityFrame(glowCtx, w, h, currentParamsRef.current);
    paintEntityFrame(sharpCtx, w, h, currentParamsRef.current);

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-pointer transition-opacity duration-500 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onMouseEnter={() => { setHovered(true); setContemplativeMode(true); }}
      onMouseLeave={() => { setHovered(false); setContemplativeMode(false); }}
      onClick={onStartVoice}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onStartVoice();
        }
      }}
      aria-label="Open voice tutor session"
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
      {/* DEBUG: geometry name label — uncomment to identify shapes
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 text-orange-400 text-xs font-mono rounded pointer-events-none z-10">
        {debugName}
      </div>
      */}
    </div>
  );
}
