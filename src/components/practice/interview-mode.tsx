'use client';

/**
 * Interview mock: a voice session where the tutor plays an interviewer from
 * the lesson (persona + depth), asks one question at a time in English, and
 * after each answer gives short feedback (what worked, what was technically
 * off against the lesson, the 1-3 English corrections that matter).
 *
 * Personas are data (src/lib/interview/personas.ts + the lesson's
 * `interview` block); the prompt is buildInterviewSession.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUnifiedVoiceSession } from '@/components/voice/use-unified-voice-session';
import { INTERVIEW_DEPTHS, resolveInterviewSetup, type InterviewDepth } from '@/lib/interview/personas';
import { hasAnswers } from '@/lib/interview/report';
import type { TutorLesson } from '@/lib/llm/voice-tutor-session';
import { InterviewReport } from './interview-report';

interface InterviewModeProps {
  resourceId: string;
  resourceTitle: string;
  lesson: TutorLesson;
  /** `resources.interview` as stored; null or invalid → default personas. */
  interviewConfig: unknown;
  /** Open a drill the report suggests. */
  onPracticeDrill: (slug: string) => void;
}

const DEPTHS: InterviewDepth[] = [1, 2, 3];

const TUTOR_STATE_LABEL: Record<string, string> = {
  idle: '',
  listening: 'Te escucha: respondé en inglés, tomate tu tiempo',
  thinking: 'Pensando…',
  speaking: 'Hablando…',
};

export function InterviewMode({ resourceId, resourceTitle, lesson, interviewConfig, onPracticeDrill }: InterviewModeProps) {
  const initial = useMemo(() => resolveInterviewSetup(interviewConfig), [interviewConfig]);
  const [personaId, setPersonaId] = useState(initial.persona.id);
  const [depth, setDepth] = useState<InterviewDepth>(initial.depth);
  const setup = useMemo(
    () => resolveInterviewSetup(interviewConfig, { personaId, depth }),
    [interviewConfig, personaId, depth],
  );
  const interview = useMemo(() => ({ lesson, setup }), [lesson, setup]);

  const session = useUnifiedVoiceSession({
    mode: 'interview',
    language: 'en',
    resourceId,
    resourceTitle,
    interview,
  });

  const drillTitles = useMemo(
    () => new Map((lesson.drills ?? []).filter((d) => d.slug).map((d) => [d.slug as string, d.title])),
    [lesson.drills],
  );
  /** Bumped on every start, so each interview gets its own report. */
  const [round, setRound] = useState(0);
  const showReport = session.state === 'done' && hasAnswers(session.transcript);

  const live = session.state === 'loading' || session.state === 'connecting' || session.state === 'active';
  const transcriptEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [session.transcript]);

  return (
    <div className="space-y-6" data-testid="interview-mode">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-j-text">Simulacro de entrevista</h1>
        <p className="text-sm text-j-text-secondary">
          Te entrevistan en inglés sobre esta lección y te tiran preguntas que no preparaste. Después de cada respuesta,
          el feedback va en orden: lo que no cierra técnicamente, lo que te faltó decir, un nombre que no se entendió y
          una o dos correcciones de inglés. Si querés el feedback en castellano, pedilo.
        </p>
      </div>

      <fieldset disabled={live} className="space-y-2 disabled:opacity-60">
        <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Quién te entrevista</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Entrevistador">
          {setup.personas.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === setup.persona.id}
              onClick={() => setPersonaId(p.id)}
              className={cn(
                'min-h-[56px] border px-3 py-2 text-left transition-colors',
                p.id === setup.persona.id ? 'border-j-accent bg-j-accent/10' : 'border-j-border-input hover:border-j-accent',
              )}
            >
              <span className="block text-sm font-medium text-j-text">{p.label}</span>
              <span className="block text-xs text-j-text-secondary">{p.blurb}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={live} className="space-y-2 disabled:opacity-60">
        <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Profundidad</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Profundidad">
          {DEPTHS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={d === depth}
              onClick={() => setDepth(d)}
              className={cn(
                'min-h-[44px] flex-1 border px-2 py-1 text-left transition-colors',
                d === depth ? 'border-j-accent bg-j-accent/10' : 'border-j-border-input hover:border-j-accent',
              )}
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-j-text">{INTERVIEW_DEPTHS[d].label}</span>
              <span className="block text-xs text-j-text-secondary">{INTERVIEW_DEPTHS[d].blurb}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        {live ? (
          <button
            type="button"
            onClick={() => session.stop()}
            className="min-h-[44px] border border-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-accent hover:bg-j-accent/10"
          >
            Terminar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRound((n) => n + 1);
              void session.start();
            }}
            className="min-h-[44px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent"
          >
            {session.state === 'done' ? 'Otra entrevista' : 'Empezar entrevista'}
          </button>
        )}
        <span className="text-sm text-j-text-secondary" aria-live="polite">
          {session.state === 'loading' || session.state === 'connecting'
            ? 'Conectando…'
            : session.state === 'active'
              ? TUTOR_STATE_LABEL[session.tutorState]
              : ''}
        </span>
      </div>

      {session.error && <p className="text-sm text-red-600">{session.error}</p>}

      {showReport && (
        <InterviewReport
          key={round}
          resourceId={resourceId}
          personaId={setup.persona.id}
          depth={setup.depth}
          transcript={session.transcript}
          drillTitles={drillTitles}
          onPracticeDrill={onPracticeDrill}
        />
      )}

      {session.transcript.length > 0 && (
        <div className="max-h-[50vh] space-y-3 overflow-y-auto border-t border-j-border pt-4" aria-label="Transcripción">
          {session.transcript.map((line, i) => (
            <p key={i} className={cn('text-sm leading-relaxed', line.role === 'user' ? 'text-j-text-secondary' : 'text-j-text')}>
              <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">
                {line.role === 'user' ? 'Vos' : setup.persona.name}
              </span>
              {line.text}
            </p>
          ))}
          <div ref={transcriptEnd} />
        </div>
      )}
    </div>
  );
}
