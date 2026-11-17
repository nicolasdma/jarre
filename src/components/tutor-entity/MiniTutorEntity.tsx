'use client';

import { useEffect, useRef } from 'react';
import { ENTITY_STATES, MINI_SIZE } from './entity-constants';
import { renderMiniFrame } from './entity-renderer';

interface MiniTutorEntityProps {
  onStartVoice: () => void;
}

/** A still moment of the torus: a slight tilt reads as 3D without spinning. */
const STILL_TIME = 6;

/**
 * The phone's tutor button: one still frame of the torus. It used to spin at
 * 30 fps forever, also on desktop where it is display:none (the loop ran on
 * every page with the shell).
 */
export function MiniTutorEntity({ onStartVoice }: MiniTutorEntityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINI_SIZE * dpr;
    canvas.height = MINI_SIZE * dpr;
    canvas.style.width = `${MINI_SIZE}px`;
    canvas.style.height = `${MINI_SIZE}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { color, charOpacity } = ENTITY_STATES.idle;
    renderMiniFrame(ctx, MINI_SIZE, STILL_TIME, color, charOpacity);
  }, []);

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
