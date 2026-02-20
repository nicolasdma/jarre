'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ENTITY_STATES,
  FRAME_INTERVAL,
  LERP_SPEED,
  type EntityStateParams,
} from './entity-constants';
import { lerp, lerpColor, renderEntityFrame } from './entity-renderer';

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
    rotSpeedA: lerp(a.rotSpeedA, b.rotSpeedA, t),
    rotSpeedB: lerp(a.rotSpeedB, b.rotSpeedB, t),
    rotSpeedC: lerp(a.rotSpeedC, b.rotSpeedC, t),
    pulseAmp: lerp(a.pulseAmp, b.pulseAmp, t),
    pulseSpeed: lerp(a.pulseSpeed, b.pulseSpeed, t),
    charOpacity: lerp(a.charOpacity, b.charOpacity, t),
    glowOpacity: lerp(a.glowOpacity, b.glowOpacity, t),
    color: lerpColor(a.color, b.color, t),
    accentColor: lerpColor(a.accentColor, b.accentColor, t),
    fontSize: a.fontSize,
    noiseIntensity: lerp(a.noiseIntensity, b.noiseIntensity, t),
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
  const currentParamsRef = useRef<EntityStateParams>({ ...ENTITY_STATES.idle });

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

    const target = hovered ? ENTITY_STATES.hover : ENTITY_STATES.idle;
    const lerpT = Math.min(1, LERP_SPEED * dt);
    currentParamsRef.current = lerpParams(currentParamsRef.current, target, lerpT);

    const { w, h } = sizeRef.current;

    renderEntityFrame(glowCtx, w, h, currentParamsRef.current, timeRef.current);
    renderEntityFrame(sharpCtx, w, h, currentParamsRef.current, timeRef.current);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
    </div>
  );
}
