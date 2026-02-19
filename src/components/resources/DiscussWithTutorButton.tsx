'use client';

import { useState } from 'react';
import { Mic, MicOff, Loader2, Clock, RefreshCw } from 'lucide-react';
import { useVoiceExplorationSession } from '@/components/voice/use-voice-exploration-session';
import type { Language } from '@/lib/translations';

interface DiscussWithTutorButtonProps {
  userResourceId: string;
  resourceStatus: string;
  language: Language;
}

export function DiscussWithTutorButton({
  userResourceId,
  resourceStatus,
  language,
}: DiscussWithTutorButtonProps) {
  const isEs = language === 'es';
  const [showResult, setShowResult] = useState(false);

  const exploration = useVoiceExplorationSession({
    userResourceId,
    language,
    onComplete: () => setShowResult(true),
  });

  const isDisabled = resourceStatus !== 'completed';
  const isActive = exploration.state === 'exploring' || exploration.state === 'connecting';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (exploration.state === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-j-error">{exploration.error}</p>
        <p className="text-xs text-j-text-tertiary">
          {isEs
            ? 'La conversación está guardada. Podemos reintentar el resumen.'
            : 'The conversation is saved. We can retry the summary.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={exploration.retrySummary}
            className="flex items-center gap-2 px-4 py-2 border border-j-accent text-j-accent rounded font-mono text-sm hover:bg-j-accent/10 transition-colors"
          >
            <RefreshCw size={14} />
            {isEs ? 'Reintentar resumen' : 'Retry summary'}
          </button>
        </div>
      </div>
    );
  }

  if (exploration.state === 'summarizing') {
    return (
      <div className="flex items-center gap-3 px-6 py-3 border border-j-accent/30 rounded">
        <Loader2 size={16} className="animate-spin text-j-accent" />
        <span className="font-mono text-sm text-j-text-secondary">
          {isEs ? 'Generando resumen...' : 'Generating summary...'}
        </span>
      </div>
    );
  }

  if (exploration.state === 'done' && showResult && exploration.result) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-j-accent/30 rounded-lg">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            {isEs ? 'Resumen de la sesión' : 'Session Summary'}
          </p>
          <p className="text-sm text-j-text-secondary leading-relaxed">
            {exploration.result.summary}
          </p>
          {exploration.result.discoveredConnections > 0 && (
            <p className="text-xs text-j-accent mt-2">
              {isEs
                ? `${exploration.result.discoveredConnections} nuevas conexiones descubiertas`
                : `${exploration.result.discoveredConnections} new connections discovered`}
            </p>
          )}
          {exploration.result.openQuestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-j-text-tertiary mb-1">
                {isEs ? 'Preguntas abiertas:' : 'Open questions:'}
              </p>
              <ul className="text-xs text-j-text-secondary space-y-1">
                {exploration.result.openQuestions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={() => { setShowResult(false); }}
          className="text-xs font-mono text-j-text-tertiary hover:text-j-text transition-colors"
        >
          {isEs ? 'Cerrar resumen' : 'Close summary'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => {
          if (isActive) {
            exploration.stop();
          } else {
            exploration.start();
          }
        }}
        disabled={isDisabled || exploration.state === 'loading'}
        className={`flex items-center gap-2 px-6 py-3 border rounded font-mono text-sm transition-colors ${
          isActive
            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
            : isDisabled
              ? 'border-j-border text-j-text-tertiary cursor-not-allowed opacity-50'
              : 'border-j-accent text-j-accent hover:bg-j-accent/10'
        }`}
      >
        {exploration.state === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {isEs ? 'Preparando...' : 'Preparing...'}
          </>
        ) : isActive ? (
          <>
            <MicOff size={16} />
            {isEs ? 'Terminar sesión' : 'End session'}
          </>
        ) : (
          <>
            <Mic size={16} />
            {isEs ? 'Discutir con tutor' : 'Discuss with tutor'}
          </>
        )}
      </button>

      {isActive && (
        <div className="flex items-center gap-2 text-sm text-j-text-secondary">
          <Clock size={14} />
          <span className="font-mono">{formatTime(exploration.elapsed)}</span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      )}

      {exploration.error && (
        <p className="text-xs text-j-error">{exploration.error}</p>
      )}
    </div>
  );
}
