'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ENTITY_STATES, FRAME_INTERVAL, MINI_SIZE } from './entity-constants';
import { renderMiniFrame } from './entity-renderer';

interface MiniTutorEntityProps {
  onStartVoice: () => void;
}

export function MiniTutorEntity({ onStartVoice }: MiniTutorEntityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const elapsed = now - lastFrameRef.current;

    if (elapsed < FRAME_INTERVAL) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    lastFrameRef.current = now - (elapsed % FRAME_INTERVAL);
    const dt = Math.min(elapsed / 1000, 0.1);
    timeRef.current += dt;

    const { color, charOpacity } = ENTITY_STATES.idle;
    renderMiniFrame(ctx, MINI_SIZE, timeRef.current, color, charOpacity);

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINI_SIZE * dpr;
    canvas.height = MINI_SIZE * dpr;
    canvas.style.width = `${MINI_SIZE}px`;
    canvas.style.height = `${MINI_SIZE}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

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
    <button
      onClick={onStartVoice}
      className="relative flex items-center justify-center lg:hidden"
      style={{ width: MINI_SIZE, height: MINI_SIZE }}
      aria-label="Open voice tutor session"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </button>
  );
}
