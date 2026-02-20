'use client';

import { useState } from 'react';
import { Mic, MicOff, Loader2, Clock, RefreshCw } from 'lucide-react';
import { useUnifiedVoiceSession, type ExplorationResult } from '@/components/voice/use-unified-voice-session';
import { useAudioLevel } from '@/components/voice/use-audio-level';
import { useTutorFrequency } from '@/components/voice/use-tutor-frequency';
import { VoiceAuraOverlay } from '@/components/voice/voice-aura';
import { TranscriptLine } from '@/components/voice/transcript-line';
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

  const session = useUnifiedVoiceSession({
    mode: 'exploration',
    language,
    userResourceId,
    onExplorationComplete: () => setShowResult(true),
  });

  const audioLevel = useAudioLevel(session.stream);
  const frequencyBands = useTutorFrequency(session.playbackAnalyser);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const isDisabled = resourceStatus !== 'completed';
  const isActive = session.state === 'active' || session.state === 'connecting';

  const explorationResult = session.result?.mode === 'exploration'
    ? session.result.explorationResult
    : null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (session.state === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-j-error">{session.error}</p>
        <p className="text-xs text-j-text-tertiary">
          {isEs
            ? 'La conversación está guardada. Podemos reintentar el resumen.'
            : 'The conversation is saved. We can retry the summary.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={session.retryPostProcess}
            className="flex items-center gap-2 px-4 py-2 border border-j-accent text-j-accent rounded font-mono text-sm hover:bg-j-accent/10 transition-colors"
          >
            <RefreshCw size={14} />
            {isEs ? 'Reintentar resumen' : 'Retry summary'}
          </button>
        </div>
      </div>
    );
  }

  if (session.state === 'summarizing') {
    return (
      <div className="flex items-center gap-3 px-6 py-3 border border-j-accent/30 rounded">
        <Loader2 size={16} className="animate-spin text-j-accent" />
        <span className="font-mono text-sm text-j-text-secondary">
          {isEs ? 'Generando resumen...' : 'Generating summary...'}
        </span>
      </div>
    );
  }

  if (session.state === 'done' && showResult && explorationResult) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-j-accent/30 rounded-lg">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            {isEs ? 'Resumen de la sesión' : 'Session Summary'}
          </p>
          <p className="text-sm text-j-text-secondary leading-relaxed">
            {explorationResult.summary}
          </p>
          {explorationResult.discoveredConnections > 0 && (
            <p className="text-xs text-j-accent mt-2">
              {isEs
                ? `${explorationResult.discoveredConnections} nuevas conexiones descubiertas`
                : `${explorationResult.discoveredConnections} new connections discovered`}
            </p>
          )}
          {explorationResult.openQuestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-j-text-tertiary mb-1">
                {isEs ? 'Preguntas abiertas:' : 'Open questions:'}
              </p>
              <ul className="text-xs text-j-text-secondary space-y-1">
                {explorationResult.openQuestions.map((q, i) => (
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

  const tutorStateForAura = session.state === 'active' ? (session.tutorState ?? 'idle') : 'thinking';

  return (
    <VoiceAuraOverlay
      state={tutorStateForAura}
      audioLevel={audioLevel}
      frequencyBands={frequencyBands}
      active={isActive}
      className="flex flex-wrap items-center gap-4"
    >
      <button
        onClick={() => {
          if (isActive) {
            session.stop();
          } else {
            session.start();
          }
        }}
        disabled={isDisabled || session.state === 'loading'}
        className={`flex items-center gap-2 px-6 py-3 border rounded font-mono text-sm transition-colors ${
          isActive
            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
            : isDisabled
              ? 'border-j-border text-j-text-tertiary cursor-not-allowed opacity-50'
              : 'border-j-accent text-j-accent hover:bg-j-accent/10'
        }`}
      >
        {session.state === 'loading' ? (
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
          <span className="font-mono">{formatTime(session.elapsed)}</span>
        </div>
      )}

      {session.error && (
        <p className="text-xs text-j-error">{session.error}</p>
      )}

      {/* Transcript line when active */}
      {session.state === 'active' && session.transcript.length > 0 && (
        <div className="w-full mt-3">
          <TranscriptLine
            lastLine={session.transcript[session.transcript.length - 1]}
            fullTranscript={session.transcript}
            expanded={transcriptExpanded}
            onToggle={() => setTranscriptExpanded(prev => !prev)}
          />
        </div>
      )}
    </VoiceAuraOverlay>
  );
}
