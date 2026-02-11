'use client';

import { useState, useEffect } from 'react';
import { useWhisper } from '@/lib/whisper/whisper-context';
import { t, type Language } from '@/lib/translations';

interface WhisperToggleProps {
  language: Language;
}

export function WhisperToggle({ language }: WhisperToggleProps) {
  const { isEnabled, isReady, isPlaying, toggle } = useWhisper();
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If voices take too long (>3s), show help panel automatically
  useEffect(() => {
    if (isReady) {
      setShowHelp(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!isReady) setShowHelp(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isReady]);


  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const label = !isReady
    ? t('whisper.loading', language)
    : isEnabled
      ? t('whisper.disable', language)
      : t('whisper.enable', language);

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          toggle();
          // Blur so Space doesn't re-trigger the button click
          (e.currentTarget as HTMLElement).blur();
        }}
        disabled={!isReady}
        aria-label={label}
        title={label}
        className={`w-8 h-8 flex items-center justify-center border transition-colors ${
          isEnabled
            ? 'border-j-accent text-j-accent hover:text-j-accent-hover hover:border-j-accent-hover'
            : 'border-j-border-input text-j-text-secondary hover:text-j-text hover:border-j-accent'
        } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {!isReady ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
        ) : isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-pulse" style={{ animationDelay: '150ms' }} />
          </svg>
        ) : isEnabled ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>

      {isEnabled && !isPlaying && (
        <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase whitespace-nowrap">
          {t('whisper.hint', language)}
        </span>
      )}

      {showHelp && !isReady && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-j-bg-white border border-j-border shadow-lg p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-warm uppercase">
              {t('whisper.setup.title', language)}
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-j-text-tertiary hover:text-j-text text-sm leading-none cursor-pointer"
              aria-label="Close"
            >
              x
            </button>
          </div>
          <p className="text-xs text-j-text-secondary leading-relaxed mb-3">
            {t('whisper.setup.description', language)}
          </p>
          <ol className="list-decimal ml-4 space-y-1 text-xs text-j-text-body">
            <li>{t('whisper.setup.step1', language)}</li>
            <li>{t('whisper.setup.step2', language)}</li>
            <li>{t('whisper.setup.step3', language)}</li>
          </ol>
        </div>
      )}
    </div>
  );
}
