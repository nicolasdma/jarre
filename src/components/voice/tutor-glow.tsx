'use client';

/**
 * Jarre - Tutor Glow Component
 *
 * CSS-pure ambient glow that represents the tutor's presence.
 * Amber/gold (#d97706) — intensity modulates state, NOT color.
 *
 * States:
 * - idle: faint glow, slow breathe (4s)
 * - listening: intensifies, breathes with user's voice (audio-reactive)
 * - thinking: slow focused pulse (2s)
 * - speaking: expands with tutor's audio (audio-reactive)
 * - error: red tint, static
 */

import type { TutorState } from './use-voice-session';

interface TutorGlowProps {
  state: TutorState;
  audioLevel?: number; // 0-1
  className?: string;
}

export function TutorGlow({ state, audioLevel = 0, className = '' }: TutorGlowProps) {
  const opacity = (() => {
    switch (state) {
      case 'idle': return 0.15;
      case 'listening': return 0.3 + audioLevel * 0.4;
      case 'thinking': return 0.3;
      case 'speaking': return 0.4 + audioLevel * 0.4;
      default: return 0.15;
    }
  })();

  const animation = (() => {
    switch (state) {
      case 'idle': return 'animate-glow-breathe';
      case 'thinking': return 'animate-glow-pulse';
      default: return '';
    }
  })();

  return (
    <div
      className={`fixed bottom-0 inset-x-0 h-32 pointer-events-none z-40 ${className}`}
      style={{ opacity }}
    >
      <div
        className={`
          w-full h-full
          bg-gradient-radial from-amber-600/40 via-amber-700/20 to-transparent
          blur-3xl
          transition-opacity duration-300
          ${animation}
        `}
      />
    </div>
  );
}
