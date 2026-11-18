'use client';

/**
 * "What's the time and space complexity?" as a step: after a code exercise
 * passes, and for each fragment of the Big-O drill. The learner picks time and
 * space (and the brute force's time, when it costs something else), or says
 * it aloud and the recognizer pre-selects the chips (src/lib/coding/big-o.ts);
 * "Ver respuesta" marks each part, gives the reason in one line, and shows the
 * sentence to say on the call, with its recording when the lesson has one (the
 * drill opens inline in "Decilo en inglés", in Repetir).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { BigOAnswer, ComplexityCheck as Check } from '@/lib/coding/format';
import { readSpokenBigO, sameBigO, type BigOKind } from '@/lib/coding/big-o';
import { recognitionError, useRecognitionCtor, type Recognition } from '@/components/practice/recognition';
import { useLessonPractice } from '@/components/practice/lesson-practice';
import { useDrillAudio } from '@/components/practice/use-drill-audio';
import { drillPhraseList } from './coding-context';
import { loadComplexity, saveComplexity, type ComplexityResult } from './coding-store';

const KIND_LABEL: Record<BigOKind, string> = { time: 'Tiempo', space: 'Espacio', brute: 'Fuerza bruta (tiempo)' };

interface ComplexityCheckProps {
  resourceId: string;
  /** Where the answer is kept: the exercise or the drill item id. */
  checkId: string;
  check: Check;
  /** The question line above the chips. */
  prompt?: string;
  onAnswered?: (result: ComplexityResult) => void;
}

function Chips({
  kind,
  answer,
  picked,
  revealed,
  onPick,
}: {
  kind: BigOKind;
  answer: BigOAnswer;
  picked: string | undefined;
  revealed: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label={KIND_LABEL[kind]}>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{KIND_LABEL[kind]}</p>
      <div className="flex flex-wrap gap-1.5">
        {answer.options.map((o) => {
          const isPicked = picked === o;
          const isAnswer = sameBigO(o, answer.answer);
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={revealed}
              onClick={() => onPick(o)}
              className={cn(
                'min-h-[40px] border px-3 font-mono text-xs transition-colors',
                !revealed && (isPicked ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border-input text-j-text hover:border-j-accent'),
                revealed && isAnswer && 'border-j-success bg-j-success-bg text-j-success',
                revealed && isPicked && !isAnswer && 'border-j-error text-j-error line-through',
                revealed && !isPicked && !isAnswer && 'border-j-border text-j-text-tertiary',
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Verdict({ kind, answer, picked }: { kind: BigOKind; answer: BigOAnswer; picked: string | undefined }) {
  const right = picked !== undefined && sameBigO(picked, answer.answer);
  return (
    <li className="text-sm leading-relaxed">
      <span className={cn('mr-1.5 font-mono text-xs', right ? 'text-j-success' : 'text-j-error')}>{right ? '✓' : '✗'}</span>
      <span className="font-medium text-j-text">
        {KIND_LABEL[kind]}: <span className="font-mono">{answer.answer}</span>
      </span>
      {!right && picked && <span className="text-j-text-tertiary"> (elegiste {picked})</span>}
      <span className="text-j-text-secondary">. {answer.why}</span>
    </li>
  );
}

/** The sentence to say, with the drill's recording or the browser's voice. */
function SayIt({ check }: { check: Check }) {
  const practice = useLessonPractice();
  const drill = check.drill ? practice?.drills.find((d) => d.slug === check.drill) : undefined;
  const text = drillPhraseList(check.say).join(' ');
  const audio = useDrillAudio(drill?.audioUrl ?? null, text);

  const practiceIt = () => {
    if (!practice || !drill) return;
    practice.goToDrill(drill.slug, 'repeat');
  };

  return (
    <div className="space-y-2 border-l-2 border-j-warm pl-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-warm">Decilo así, en voz alta</p>
      <p className="text-sm leading-relaxed text-j-text" lang="en">
        “{text}”
      </p>
      <div className="flex flex-wrap gap-2">
        {audio.available && (
          <button
            type="button"
            onClick={audio.toggle}
            className="min-h-[40px] border border-j-border-input px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text hover:border-j-accent"
          >
            {audio.playing ? 'Pausa' : audio.kind === 'file' ? 'Escuchar ★' : 'Escuchar'}
          </button>
        )}
        {drill && (
          <button
            type="button"
            onClick={practiceIt}
            className="min-h-[40px] border border-j-border-input px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text hover:border-j-accent"
          >
            Repetirla con el micrófono
          </button>
        )}
      </div>
    </div>
  );
}

export function ComplexityCheck({ resourceId, checkId, check, prompt, onAnswered }: ComplexityCheckProps) {
  const [picked, setPicked] = useState<Partial<Record<BigOKind, string>>>({});
  const [revealed, setRevealed] = useState(false);
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Ctor = useRecognitionCtor();
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    const stored = loadComplexity(resourceId)[checkId];
    if (stored) {
      setPicked(stored.picked);
      setRevealed(true);
    }
  }, [resourceId, checkId]);

  useEffect(() => () => recRef.current?.abort(), []);

  const kinds: BigOKind[] = check.brute ? ['time', 'space', 'brute'] : ['time', 'space'];
  const answerOf = (k: BigOKind): BigOAnswer => (k === 'brute' ? check.brute!.time : check[k]);
  const ready = kinds.every((k) => picked[k]);

  const reveal = useCallback(() => {
    const right = {
      time: Boolean(picked.time && sameBigO(picked.time, check.time.answer)),
      space: Boolean(picked.space && sameBigO(picked.space, check.space.answer)),
      ...(check.brute ? { brute: Boolean(picked.brute && sameBigO(picked.brute, check.brute.time.answer)) } : {}),
    };
    const result: ComplexityResult = { picked, right, at: new Date().toISOString() };
    saveComplexity(resourceId, checkId, result);
    setRevealed(true);
    onAnswered?.(result);
  }, [picked, check, resourceId, checkId, onAnswered]);

  const listen = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    if (!Ctor) return;
    setError(null);
    setHeard('');
    finalRef.current = '';
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current = `${finalRef.current} ${r[0].transcript}`.trim();
        else interim += ` ${r[0].transcript}`;
      }
      setHeard(`${finalRef.current}${interim}`.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(recognitionError(e.error));
    };
    rec.onend = () => {
      setListening(false);
      const said = finalRef.current;
      if (!said) return;
      const read = readSpokenBigO(said, {
        time: check.time.options,
        space: check.space.options,
        brute: check.brute?.time.options,
      });
      setPicked((p) => ({ ...p, ...read }));
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('No pude iniciar el reconocimiento de voz.');
    }
  };

  return (
    <div className="space-y-4 border border-j-border bg-j-bg-alt p-3" data-testid="complexity-check">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">Complejidad</p>
        <p className="text-sm text-j-text">
          {prompt ?? (
            <>
              Sam te pregunta: <span lang="en">“What&apos;s the time and space complexity?”</span> Elegí, o decilo en voz alta en inglés.
            </>
          )}
        </p>
      </div>

      {kinds.map((k) => (
        <Chips key={k} kind={k} answer={answerOf(k)} picked={picked[k]} revealed={revealed} onPick={(v) => setPicked((p) => ({ ...p, [k]: v }))} />
      ))}

      {!revealed && (
        <div className="flex flex-wrap items-center gap-2">
          {Ctor && (
            <button
              type="button"
              onClick={listen}
              className={cn(
                'min-h-[44px] border px-4 font-mono text-[11px] uppercase tracking-[0.15em]',
                listening ? 'border-j-error text-j-error' : 'border-j-border-input text-j-text hover:border-j-accent',
              )}
            >
              {listening ? '● Ya está' : 'Decilo en voz alta'}
            </button>
          )}
          <button
            type="button"
            onClick={reveal}
            disabled={!ready}
            title={ready ? undefined : 'Elegí cada parte primero'}
            className="min-h-[44px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent disabled:opacity-50"
          >
            Ver respuesta
          </button>
        </div>
      )}
      {(heard || listening) && (
        <p className="text-xs text-j-text-secondary" lang="en" aria-live="polite">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Te escuché: </span>
          {heard || '…'}
        </p>
      )}
      {error && <p className="text-xs text-j-error">{error}</p>}

      {revealed && (
        <div className="space-y-3">
          <ul className="space-y-1">
            <Verdict kind="time" answer={check.time} picked={picked.time} />
            <Verdict kind="space" answer={check.space} picked={picked.space} />
            {check.brute && <Verdict kind="brute" answer={check.brute.time} picked={picked.brute} />}
          </ul>
          {check.brute && (
            <p className="text-sm leading-relaxed text-j-text-secondary">
              <span className="font-medium text-j-text">La fuerza bruta</span>: <span className="font-mono">{check.brute.time.answer}</span> de tiempo y{' '}
              <span className="font-mono">{check.brute.space}</span> de espacio. {check.brute.why}
            </p>
          )}
          <SayIt check={check} />
          <button
            type="button"
            onClick={() => {
              setPicked({});
              setRevealed(false);
              setHeard('');
            }}
            className="min-h-[40px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary hover:text-j-text"
          >
            Otra vez
          </button>
        </div>
      )}
    </div>
  );
}
