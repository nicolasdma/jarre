'use client';

import { useState } from 'react';
import { Mic, Swords } from 'lucide-react';
import { VoiceSessionOverlay } from './VoiceSessionOverlay';
import type { Language } from '@/lib/translations';

interface VoiceModeLauncherProps {
  language: Language;
  showFreeform?: boolean;
  showDebate?: boolean;
  debateConceptIds?: string[];
  debateDefaultTopic?: string;
  debateDefaultPosition?: string;
  freeformLabel?: string;
  debateLabel?: string;
  variant?: 'default' | 'compact';
}

export function VoiceModeLauncher({
  language,
  showFreeform = true,
  showDebate = false,
  debateConceptIds = [],
  debateDefaultTopic,
  debateDefaultPosition,
  freeformLabel,
  debateLabel,
  variant = 'default',
}: VoiceModeLauncherProps) {
  const [overlayMode, setOverlayMode] = useState<'freeform' | 'debate' | null>(null);
  const [debateTopic, setDebateTopic] = useState<{ topic: string; position: string; conceptIds: string[] } | null>(null);
  const isEs = language === 'es';

  const openFreeform = () => {
    setOverlayMode('freeform');
  };

  const openDebate = (topic?: string, position?: string, conceptIds?: string[]) => {
    setDebateTopic({
      topic: topic || debateDefaultTopic || '',
      position: position || debateDefaultPosition || '',
      conceptIds: conceptIds || debateConceptIds,
    });
    setOverlayMode('debate');
  };

  const close = () => {
    setOverlayMode(null);
    setDebateTopic(null);
  };

  const isCompact = variant === 'compact';
  const btnBase = isCompact
    ? 'inline-flex items-center gap-2 px-3 py-2.5 text-xs font-mono rounded border transition-colors min-h-[44px]'
    : 'inline-flex items-center gap-2 px-4 py-3 text-sm font-mono rounded border transition-colors min-h-[44px]';

  return (
    <>
      <div className={`flex ${isCompact ? 'gap-2' : 'gap-3'} flex-wrap`}>
        {showFreeform && (
          <button
            onClick={openFreeform}
            className={`${btnBase} border-j-border text-j-text-secondary hover:border-j-accent hover:text-j-accent`}
          >
            <Mic size={isCompact ? 14 : 16} />
            {freeformLabel || (isEs ? 'Charla libre' : 'Freeform chat')}
          </button>
        )}
        {showDebate && (
          <button
            onClick={() => openDebate()}
            className={`${btnBase} border-j-border text-j-text-secondary hover:border-j-error hover:text-j-error`}
          >
            <Swords size={isCompact ? 14 : 16} />
            {debateLabel || (isEs ? 'Debate' : 'Debate')}
          </button>
        )}
      </div>

      {overlayMode && (
        <VoiceSessionOverlay
          mode={overlayMode}
          onClose={close}
          language={language}
          debateTopic={overlayMode === 'debate' ? debateTopic || undefined : undefined}
        />
      )}
    </>
  );
}
