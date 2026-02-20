'use client';

/**
 * VoiceAuraOverlay — Single overlay component for voice sessions.
 *
 * Full-viewport overlay with the sound wave aura at the bottom
 * and content rendered on top. Use this as the root wrapper for
 * any voice session screen.
 */

import type { ReactNode } from 'react';
import { VoiceAura } from './VoiceAura';
import type { TutorState } from '../use-voice-session';

export interface VoiceAuraOverlayProps {
  state: TutorState;
  audioLevel?: number;
  active?: boolean;
  children: ReactNode;
  className?: string;
  /** 8 frequency bands (0-1) from tutor playback audio */
  frequencyBands?: Float32Array;
}

export function VoiceAuraOverlay({
  state,
  audioLevel = 0,
  active = true,
  children,
  className = '',
  frequencyBands,
}: VoiceAuraOverlayProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sound wave aurora — behind content */}
      <VoiceAura state={state} audioLevel={audioLevel} active={active} frequencyBands={frequencyBands} />

      {/* Content — on top of the aura */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
