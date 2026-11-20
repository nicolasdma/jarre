'use client';

/**
 * The timed live-coding mock, the lesson's last step: a voice interviewer
 * (Gemini Live, the same session as the interview mock) presents a problem,
 * answers clarifications, watches the code and keeps time, while the
 * candidate codes in the editor and thinks aloud. No feedback during it; at
 * the end the final code runs against every test and the written scorecard
 * appears (CodingReportView). Each attempt (transcript, final code, facts,
 * report) is kept in this browser.
 *
 * What the interviewer is told, and when, is src/lib/coding/mock-runtime.ts;
 * the prompt is src/lib/coding/mock-session.ts.
 */

import { appScroller } from '@/lib/learn/app-scroller';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUnifiedVoiceSession } from '@/components/voice/use-unified-voice-session';
import { allTestsOf, findProblem } from '@/lib/coding/format';
import { buildCodingMockSession } from '@/lib/coding/mock-session';
import {
  dueCue,
  editorNote,
  formatClock,
  hintNote,
  HARD_STOP_AFTER_MS,
  isHintRequest,
  phaseIndexAt,
  quietToSend,
  runNote,
  shouldSnapshot,
  type CueId,
  type SnapshotReason,
} from '@/lib/coding/mock-runtime';
import type { RunResult } from '@/lib/coding/harness';
import { runInLanguage } from '@/lib/coding/run-code';
import { pythonRunner, type PythonStatus } from '@/lib/coding/run-python';
import { CODE_LANGUAGES, LANGUAGE_LABEL, type CodeLanguage } from '@/lib/coding/languages';
import { starterFor } from '@/lib/coding/starters';
import { hasCandidateSpeech, type CodingReport, type CodingSessionFacts } from '@/lib/coding/report';
import { CodeEditor } from './code-editor';
import { RunOutput, summarizeRun } from './run-output';
import { ProblemStatement } from './problem-statement';
import { SolutionPanel } from './code-exercise';
import { CodingReportView } from './coding-report';
import { drillPhraseList, useCoding } from './coding-context';
import { loadAttempts, loadPadPrefs, saveAttempt, savePadPrefs, type MockAttempt, type PadPrefs } from './coding-store';

interface CodingMockProps {
  resourceTitle: string;
  onPracticeDrill: (slug: string) => void;
}

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 } as const;
const DIFFICULTY_LABEL = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' } as const;
const TIER_LABEL = { core: 'Núcleo', safety_net: 'Red de seguridad' } as const;
/** Core problems first, then by difficulty; the input order breaks ties. */
const TIER_ORDER = { core: 0, safety_net: 1 } as const;

const STATE_LABEL: Record<string, string> = {
  idle: '',
  listening: 'Te escucha',
  thinking: 'Pensando…',
  speaking: 'Hablando…',
};

/** The microphone is not doing its job: said on screen, never left for the interviewer to read as silence. */
const MIC_WARNING = {
  'no-signal': 'No te escucho: el micrófono no entrega audio. Revisá que no esté silenciado o tomado por otra app.',
  unheard: `No te escucho: tu voz llega al micrófono pero el entrevistador no la recibe. Terminá y volvé a empezar la llamada.`,
} as const;

interface Runtime {
  startedAt: number | null;
  fired: Set<CueId>;
  lastCandidateSpeechAt: number;
  lastModelSpeechAt: number;
  lastCodeChangeAt: number;
  firstEditAt: number | null;
  lastCheckInAt: number | null;
  codeChangedSinceCheckIn: boolean;
  hintsGiven: number;
  checkIns: number;
  runs: number;
  exampleRuns: number;
  lastSentCode: string | null;
  lastSentAt: number | null;
  /** Index of the transcript line already handled as a new utterance / as a hint request. */
  hintIndex: number;
  /** Context notes waiting for the interviewer to stop speaking. */
  pending: string[];
}

const freshRuntime = (): Runtime => ({
  startedAt: null,
  fired: new Set(),
  lastCandidateSpeechAt: 0,
  lastModelSpeechAt: 0,
  lastCodeChangeAt: 0,
  firstEditAt: null,
  lastCheckInAt: null,
  codeChangedSinceCheckIn: false,
  hintsGiven: 0,
  checkIns: 0,
  runs: 0,
  exampleRuns: 0,
  lastSentCode: null,
  lastSentAt: null,
  hintIndex: -1,
  pending: [],
});

export function CodingMock({ resourceTitle, onPracticeDrill }: CodingMockProps) {
  const coding = useCoding();
  if (!coding) return null;
  return <CodingMockInner resourceTitle={resourceTitle} onPracticeDrill={onPracticeDrill} />;
}

function CodingMockInner({ resourceTitle, onPracticeDrill }: CodingMockProps) {
  const coding = useCoding()!;
  const { config, resourceId } = coding;
  const problemsSorted = useMemo(
    () =>
      [...config.problems].sort(
        (a, b) =>
          TIER_ORDER[a.tier ?? 'core'] - TIER_ORDER[b.tier ?? 'core'] ||
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty],
      ),
    [config.problems],
  );
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  useEffect(() => setAttempts(loadAttempts(resourceId)), [resourceId]);

  // A core medium, like the round: never a safety-net problem the lesson says not to write from scratch.
  const [problemId, setProblemId] = useState(
    () => (problemsSorted.find((p) => p.difficulty === 'medium' && p.tier !== 'safety_net') ?? problemsSorted[0]).id,
  );
  const problem = findProblem(config, problemId) ?? problemsSorted[0];
  const [minutes, setMinutes] = useState(config.minutes);
  const durationMs = minutes * 60_000;

  const session = useMemo(() => buildCodingMockSession({ config, problem, minutes }), [config, problem, minutes]);
  const interview = useMemo(() => ({ session }), [session]);

  // The pad: language picker and autocomplete, as on CoderPad (off by default, as in the interview).
  const [pad, setPad] = useState<PadPrefs>({ language: 'typescript', autocomplete: false });
  useEffect(() => setPad(loadPadPrefs()), []);
  const offered = useMemo(
    () => CODE_LANGUAGES.filter((l) => starterFor(problem, l) !== null),
    [problem],
  );
  const language: CodeLanguage = offered.includes(pad.language) ? pad.language : 'typescript';
  const starter = starterFor(problem, language) ?? problem.starter;
  const languageRef = useRef(language);
  languageRef.current = language;
  const starterRef = useRef(starter);
  starterRef.current = starter;
  /** What was typed in each language this attempt: switching back and forth loses nothing. */
  const drafts = useRef(new Map<CodeLanguage, string>());
  const pythonStatus = usePythonStatus(language === 'python');

  const rt = useRef<Runtime>(freshRuntime());
  const codeRef = useRef(starter);
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState<{ result: RunResult; label: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [stage, setStage] = useState<'setup' | 'live' | 'closing' | 'done'>('setup');
  const [current, setCurrent] = useState<MockAttempt | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  /** Send the editor as the interviewer would see it, when it changed. */
  const snapshot = useCallback((reason: SnapshotReason, force = false): string | null => {
    const r = rt.current;
    const t = Date.now();
    const code = codeRef.current;
    if (!force && !shouldSnapshot({ code, lastSentCode: r.lastSentCode, lastSentAt: r.lastSentAt, now: t, reason })) return null;
    r.lastSentCode = code;
    r.lastSentAt = t;
    return editorNote(code, r.startedAt ? t - r.startedAt : 0, reason, LANGUAGE_LABEL[languageRef.current]);
  }, []);

  const voice = useUnifiedVoiceSession({
    mode: 'interview',
    language: 'en',
    resourceId,
    resourceTitle,
    interview,
    turnTaking: 'thinking-aloud',
    voiceName: config.interviewer.voice,
    onReconnected: () => {
      // A fresh connection lost the screen: show it again, once the interviewer
      // is done answering the reconnection (sending while it speaks could cut it).
      const note = snapshot('reconnect', true);
      if (note) rt.current.pending.push(note);
    },
  });
  // The clock reads the session through a ref, so a transcript update does not restart it.
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // The clock starts when the call does.
  useEffect(() => {
    if (stage === 'live' && voice.state === 'active' && rt.current.startedAt === null) {
      const t = Date.now();
      rt.current.startedAt = t;
      rt.current.lastCandidateSpeechAt = t;
      rt.current.lastModelSpeechAt = t;
      rt.current.lastCodeChangeAt = t;
    }
  }, [stage, voice.state]);

  // What the candidate says: a new utterance shows the interviewer the screen; asking for help gets the next hint.
  useEffect(() => {
    if (stage !== 'live') return;
    const lines = voice.transcript;
    const i = lines.length - 1;
    if (i < 0) return;
    const line = lines[i];
    const r = rt.current;
    const t = Date.now();
    if (line.role === 'model') {
      r.lastModelSpeechAt = t;
      return;
    }
    r.lastCandidateSpeechAt = t;
    // The hint waits in the outbox like every note: sent now, it would land on what they are saying.
    if (i !== r.hintIndex && isHintRequest(line.text)) {
      r.hintIndex = i;
      const { note } = hintNote(problem.hints, r.hintsGiven);
      r.hintsGiven = Math.min(problem.hints.length, r.hintsGiven + 1);
      r.pending.push(note);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript, stage]);

  useEffect(() => {
    if (voice.tutorState === 'speaking') rt.current.lastModelSpeechAt = Date.now();
  }, [voice.tutorState]);

  // The interviewer's clock: once a second, deliver what is due.
  useEffect(() => {
    if (stage !== 'live') return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const voice = voiceRef.current;
      const r = rt.current;
      if (r.startedAt === null || voice.state !== 'active') return;
      if (voice.tutorState === 'speaking') r.lastModelSpeechAt = t;
      if (t - r.startedAt > durationMs + HARD_STOP_AFTER_MS) {
        voice.stop();
        return;
      }
      // The microphone knows they are talking seconds before the transcript does.
      const voiceAt = voice.micLastVoiceAt();
      if (voiceAt !== null && voiceAt > r.lastCandidateSpeechAt) r.lastCandidateSpeechAt = voiceAt;
      // Nothing is sent over the candidate's voice or the interviewer's answer (quietToSend).
      if (
        !quietToSend({
          now: t,
          lastCandidateSpeechAt: r.lastCandidateSpeechAt,
          lastModelSpeechAt: r.lastModelSpeechAt,
          modelSpeaking: voice.tutorState === 'speaking',
        })
      ) {
        return;
      }

      if (r.pending.length) {
        const screen = snapshot('update');
        voice.sendText([...(screen ? [screen] : []), ...r.pending].join('\n\n'));
        r.pending = [];
      }

      const cue = dueCue(
        {
          startedAt: r.startedAt,
          durationMs,
          fired: r.fired,
          lastCandidateSpeechAt: r.lastCandidateSpeechAt,
          lastModelSpeechAt: r.lastModelSpeechAt,
          modelSpeaking: false,
          lastCodeChangeAt: r.lastCodeChangeAt,
          codeTouched: codeRef.current !== starterRef.current,
          lastCheckInAt: r.lastCheckInAt,
          codeChangedSinceCheckIn: r.codeChangedSinceCheckIn,
          hintsGiven: r.hintsGiven,
          hintCount: problem.hints.length,
        },
        t,
      );
      // A dead microphone is not a silent candidate: the page says so, the interviewer does not ask.
      const micDown = voice.micHealth !== 'ok' && (cue?.id === 'check-in' || cue?.id === 'stuck-hint');
      if (cue && !micDown) {
        const parts: string[] = [];
        const screen = snapshot('check-in', cue.id === 'check-in' || cue.id === 'stuck-hint');
        if (screen) parts.push(screen);
        parts.push(cue.note);
        if (cue.id === 'stuck-hint') {
          parts.push(hintNote(problem.hints, r.hintsGiven).note);
          r.hintsGiven = Math.min(problem.hints.length, r.hintsGiven + 1);
        }
        if (cue.id === 'check-in' || cue.id === 'stuck-hint') {
          r.lastCheckInAt = t;
          r.codeChangedSinceCheckIn = false;
          r.checkIns += 1;
        }
        r.fired.add(cue.id);
        r.lastModelSpeechAt = t;
        voice.sendText(parts.join('\n\n'), { respond: cue.respond });
        return;
      }

      // Keep the interviewer's view of the screen fresh.
      const note = snapshot('typing');
      if (note) voice.sendText(note);
    }, 1000);
    return () => clearInterval(id);
  }, [stage, durationMs, problem, snapshot]);

  const changeCode = useCallback(
    (next: string) => {
      codeRef.current = next;
      setCode(next);
      const r = rt.current;
      const t = Date.now();
      r.lastCodeChangeAt = t;
      r.codeChangedSinceCheckIn = true;
      if (r.firstEditAt === null && r.startedAt !== null && next !== starterRef.current) r.firstEditAt = t;
    },
    [],
  );

  // Before the mock or a new attempt: the editor opens on the picked language's starter.
  useEffect(() => {
    if (stage !== 'setup') return;
    drafts.current.clear();
    codeRef.current = starter;
    setCode(starter);
  }, [stage, starter]);

  const changePad = useCallback((next: Partial<PadPrefs>) => {
    setPad((p) => {
      const merged = { ...p, ...next };
      savePadPrefs(merged);
      return merged;
    });
  }, []);

  const pickLanguage = useCallback(
    (next: CodeLanguage) => {
      if (next === languageRef.current) return;
      drafts.current.set(languageRef.current, codeRef.current);
      const nextCode = drafts.current.get(next) ?? starterFor(problem, next) ?? problem.starter;
      languageRef.current = next;
      starterRef.current = starterFor(problem, next) ?? problem.starter;
      codeRef.current = nextCode;
      setCode(nextCode);
      setOutput(null);
      changePad({ language: next });
      if (stage !== 'live') return;
      // The interviewer sees the switch on the shared pad.
      const note = snapshot('language', true);
      if (!note) return;
      rt.current.pending.push(note);
    },
    [problem, stage, snapshot, changePad],
  );

  const run = useCallback(
    async (kind: 'run' | 'examples') => {
      setRunning(true);
      const lang = languageRef.current;
      const result = await runInLanguage(lang, {
        code: codeRef.current,
        tests: kind === 'examples' ? problem.example_tests : undefined,
        exportNames: problem.exports,
      });
      setRunning(false);
      setOutput({ result, label: kind === 'examples' ? 'Tests de los ejemplos' : 'Salida de tu código' });
      if (stage !== 'live') return;
      const r = rt.current;
      if (kind === 'run') r.runs += 1;
      else r.exampleRuns += 1;
      const { passed, total } = summarizeRun(result);
      const notes = [
        snapshot('run'),
        runNote(
          {
            kind,
            language: LANGUAGE_LABEL[lang],
            passed,
            total,
            error: result.compileError?.message ?? result.runtimeError,
            failed: result.tests.filter((x) => !x.pass && !x.own).map((x) => `${x.name}: ${x.error ?? ''}`),
            logs: result.logs,
          },
          r.startedAt ? Date.now() - r.startedAt : 0,
        ),
      ].filter((n): n is string => Boolean(n));
      r.pending.push(...notes);
    },
    [problem, stage, snapshot],
  );

  const start = useCallback(() => {
    rt.current = freshRuntime();
    drafts.current.clear();
    codeRef.current = starterRef.current;
    setCode(starterRef.current);
    setOutput(null);
    setCurrent(null);
    setStage('live');
    // The setup screen is long: the call opens on the pad's top (clock, language, editor), not where the button was.
    appScroller().scrollTo({ top: 0 });
    void voice.start();
  }, [voice]);

  // The call ended (the interviewer closed it, or Terminar): run every test on the final code and keep the attempt.
  useEffect(() => {
    if (stage !== 'live' || voice.state !== 'done') return;
    setStage('closing');
    const r = rt.current;
    const transcript = voice.transcript.map((l) => ({ role: l.role, text: l.text }));
    const finalCode = codeRef.current;
    const finalLanguage = languageRef.current;
    void runInLanguage(finalLanguage, { code: finalCode, tests: allTestsOf(problem), exportNames: problem.exports }).then((result) => {
      const { passed, total } = summarizeRun(result);
      const started = r.startedAt ?? Date.now();
      const facts: CodingSessionFacts = {
        minutes,
        elapsedSeconds: Math.round((Date.now() - started) / 1000),
        firstEditSeconds: r.firstEditAt === null ? null : Math.round((r.firstEditAt - started) / 1000),
        runs: r.runs,
        exampleRuns: r.exampleRuns,
        finalTests: {
          passed,
          total,
          failing: result.tests.filter((x) => !x.pass && !x.own).map((x) => `${x.name}: ${x.error ?? ''}`).slice(0, 20),
          ...(result.compileError || result.runtimeError ? { error: result.compileError?.message ?? result.runtimeError } : {}),
        },
        hintsGiven: r.hintsGiven,
        checkIns: r.checkIns,
        language: LANGUAGE_LABEL[finalLanguage],
      };
      const attempt: MockAttempt = {
        id: `${problem.id}-${started}`,
        problemId: problem.id,
        startedAt: new Date(started).toISOString(),
        minutes,
        transcript,
        finalCode,
        facts,
        report: null,
      };
      setOutput({ result, label: 'Tu código final contra todos los tests (ejemplos y ocultos)' });
      setAttempts(saveAttempt(resourceId, attempt));
      setCurrent(attempt);
      setStage('done');
    });
  }, [stage, voice.state, voice.transcript, problem, minutes, resourceId]);

  const storeReport = useCallback(
    (report: CodingReport) => {
      setCurrent((a) => {
        if (!a) return a;
        const next = { ...a, report };
        setAttempts(saveAttempt(resourceId, next));
        return next;
      });
    },
    [resourceId],
  );

  const elapsed = rt.current.startedAt ? Math.max(0, now - rt.current.startedAt) : 0;
  const phaseIndex = phaseIndexAt(config.phases, elapsed, durationMs);
  const drillTitles = useMemo(() => new Map([...coding.drills.values()].map((d) => [d.slug, d.title])), [coding.drills]);
  const problemTitles = useMemo(() => new Map(config.problems.map((p) => [p.id, p.title])), [config.problems]);
  const pickProblem = useCallback((id: string) => {
    setProblemId(id);
    setStage('setup');
    setCurrent(null);
    setOutput(null);
    // The page scrolls AppShell's column, not the window.
    appScroller().scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ------------------------------------------------------------------ setup
  if (stage === 'setup') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-12" data-testid="coding-mock">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-j-text">Simulacro de coding en vivo</h1>
          <p className="text-sm leading-relaxed text-j-text-secondary">
            {config.interviewer.name} te presenta el problema por voz, en inglés, y vos codeás acá mientras pensás en voz alta. Ve tu
            código mientras escribís y cada vez que corrés. Si te trabás, pedile una pista en voz alta (&quot;Can I get a hint?&quot;):
            te da una por vez, de la más chica a la más grande. Te avisa el tiempo. Durante la llamada no hay feedback; al terminar,
            tu código corre contra todos los tests y aparece el informe escrito con la vara de senior.
          </p>
          <p className="text-sm leading-relaxed text-j-text-secondary">
            El editor es como el de CoderPad: elegís el lenguaje, <strong>Correr</strong> ejecuta tu archivo y abajo sale la consola
            (tus <code>console.log</code> o <code>print</code>). El autocompletado arranca apagado, como en la entrevista real. El
            entrevistador ve el lenguaje, tu código y lo que imprime cada corrida.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Problema</legend>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Problema">
            {problemsSorted.map((p) => {
              const tries = attempts.filter((a) => a.problemId === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === problem.id}
                  onClick={() => setProblemId(p.id)}
                  className={cn(
                    'min-h-[56px] border px-3 py-2 text-left transition-colors',
                    p.id === problem.id ? 'border-j-accent bg-j-accent/10' : 'border-j-border-input hover:border-j-accent',
                  )}
                >
                  <span className="block text-sm font-medium text-j-text">{p.title}</span>
                  <span className="block text-xs text-j-text-secondary">
                    {p.tier ? `${TIER_LABEL[p.tier]} · ` : ''}
                    {DIFFICULTY_LABEL[p.difficulty]} · {p.pattern}
                    {tries ? ` · ${tries} intento${tries > 1 ? 's' : ''}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Duración</legend>
          <div className="flex gap-1" role="radiogroup" aria-label="Duración">
            {[...new Set([problem.minutes, config.minutes, 45])].sort((a, b) => a - b).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={m === minutes}
                onClick={() => setMinutes(m)}
                className={cn(
                  'min-h-[44px] flex-1 border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
                  m === minutes ? 'border-j-accent bg-j-accent/10 text-j-text' : 'border-j-border-input text-j-text-secondary hover:border-j-accent',
                )}
              >
                {m} min{m === config.minutes ? ' · como la ronda' : ''}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Lenguaje</legend>
          <LanguageChoice language={language} offered={offered} onPick={pickLanguage} pythonStatus={pythonStatus} />
        </fieldset>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={start}
            className="min-h-[44px] bg-j-accent px-5 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent"
          >
            Empezar simulacro
          </button>
          <span className="text-xs text-j-text-tertiary">Usá auriculares: el micrófono queda abierto toda la sesión.</span>
        </div>

        {attempts.length > 0 && (
          <section className="space-y-2 border-t border-j-border pt-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Intentos anteriores</h2>
            <ul className="space-y-1">
              {attempts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProblemId(a.problemId);
                      setCurrent(a);
                      setStage('done');
                    }}
                    className="flex min-h-[44px] w-full items-center gap-3 border border-j-border px-3 py-2 text-left text-sm hover:border-j-accent"
                  >
                    <span className="flex-1 text-j-text">{problemTitles.get(a.problemId) ?? a.problemId}</span>
                    <span className="font-mono text-xs text-j-text-secondary">
                      {a.facts.finalTests.passed}/{a.facts.finalTests.total} tests
                    </span>
                    <span className="font-mono text-xs text-j-text-tertiary">{new Date(a.startedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ done
  if (stage === 'done' && current) {
    const shownProblem = findProblem(config, current.problemId) ?? problem;
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-12" data-testid="coding-mock">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold text-j-text">{shownProblem.title} · cierre</h1>
          <button
            type="button"
            onClick={() => {
              setStage('setup');
              setCurrent(null);
              setOutput(null);
            }}
            className="min-h-[44px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent"
          >
            Otro simulacro
          </button>
        </div>
        <p className="font-mono text-xs text-j-text-secondary">
          {formatClock(current.facts.elapsedSeconds * 1000)} de {current.minutes}:00 · tests finales {current.facts.finalTests.passed}/
          {current.facts.finalTests.total} · pistas {current.facts.hintsGiven} · corridas {current.facts.runs + current.facts.exampleRuns}
        </p>
        {hasCandidateSpeech(current.transcript) ? (
          <CodingReportView
            key={current.id}
            resourceId={resourceId}
            problemId={current.problemId}
            transcript={current.transcript}
            finalCode={current.finalCode}
            facts={current.facts}
            stored={current.report}
            onReport={storeReport}
            drillTitles={drillTitles}
            problemTitles={problemTitles}
            onPracticeDrill={onPracticeDrill}
            onPickProblem={pickProblem}
          />
        ) : (
          <p className="border border-j-border p-4 text-sm text-j-text-secondary">
            No hubo respuestas tuyas en la transcripción, así que no hay informe. Probá de nuevo hablando en voz alta mientras codeás.
          </p>
        )}
        {output && <RunOutput result={output.result} running={false} label={output.label} language={language} />}
        <details className="border border-j-border px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
            Tu código final{current.facts.language ? ` · ${current.facts.language}` : ''}
          </summary>
          <pre className="mt-2 overflow-x-auto bg-j-bg-alt p-3 font-mono text-xs leading-relaxed text-j-text">{current.finalCode}</pre>
        </details>
        <details className="border border-j-border px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Solución de referencia</summary>
          <div className="mt-2">
            <SolutionPanel problem={shownProblem} />
          </div>
        </details>
        <details className="border border-j-border px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Transcripción</summary>
          <Transcript lines={current.transcript} interviewer={config.interviewer.name} />
        </details>
      </div>
    );
  }

  // ------------------------------------------------------------------ live
  const left = durationMs - elapsed;
  const micTalking = now - (voice.micLastVoiceAt() ?? 0) < 1500;
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6" data-testid="coding-mock">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-j-border bg-j-bg py-2">
        <span className="text-sm font-semibold text-j-text">{problem.title}</span>
        <span className={cn('font-mono text-sm tabular-nums', left < 5 * 60_000 ? 'text-j-error' : 'text-j-text')} aria-label="Tiempo">
          {formatClock(elapsed)} / {minutes}:00
        </span>
        {phaseIndex >= 0 && (
          <span className="border border-j-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-j-accent">
            {config.phases[phaseIndex].title}
          </span>
        )}
        <span className="text-sm text-j-text-secondary" aria-live="polite">
          {stage === 'closing'
            ? 'Corriendo los tests finales…'
            : voice.state === 'loading' || voice.state === 'connecting'
              ? 'Conectando…'
              : voice.state === 'active'
                ? `${config.interviewer.name}: ${STATE_LABEL[voice.tutorState]}`
                : ''}
        </span>
        {stage === 'live' && voice.state === 'active' && voice.micHealth === 'ok' && (
          <span
            className={cn('font-mono text-[10px] uppercase tracking-[0.12em]', micTalking ? 'text-j-accent' : 'text-j-text-tertiary')}
            data-testid="coding-mock-mic"
            data-talking={micTalking}
          >
            {micTalking ? '● Micrófono: te oye' : '○ Micrófono'}
          </span>
        )}
        {stage === 'live' && voice.state === 'active' && voice.micHealth !== 'ok' && (
          <span role="alert" className="border border-j-error px-2 py-1 text-sm font-semibold text-j-error" data-testid="coding-mock-mic-warning">
            {MIC_WARNING[voice.micHealth]}
          </span>
        )}
        <span className="ml-auto" />
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="min-h-[36px] px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary hover:text-j-text"
        >
          {showGuide ? 'Ocultar guía' : 'Mostrar guía'}
        </button>
        {stage === 'live' && (
          <button
            type="button"
            onClick={() => voice.stop()}
            className="min-h-[36px] border border-j-accent px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-j-accent hover:bg-j-accent/10"
          >
            Terminar
          </button>
        )}
      </div>

      {voice.error && <p className="text-sm text-j-error">{voice.error}</p>}

      {/* grid-cols-1 below lg too: an implicit track grows to the editor's longest line and pushes the page past the screen. */}
      <div className={cn('grid grid-cols-1 gap-4', showGuide && 'lg:grid-cols-[340px_minmax(0,1fr)]')}>
        {showGuide && (
          <aside className="space-y-4" aria-label="Problema y guía">
            <div className="border border-j-border p-3">
              <ProblemStatement problem={problem} showConstraints={false} />
            </div>
            <PhaseGuide phaseIndex={phaseIndex} minutes={minutes} />
          </aside>
        )}
        <div className="space-y-3">
          <PadToolbar
            language={language}
            offered={offered}
            onPick={pickLanguage}
            autocomplete={pad.autocomplete}
            onAutocomplete={(on) => changePad({ autocomplete: on })}
            pythonStatus={pythonStatus}
          />
          <CodeEditor
            value={code}
            onChange={changeCode}
            onRun={() => void run('run')}
            height="58vh"
            ariaLabel={`Tu solución en ${LANGUAGE_LABEL[language]}`}
            language={language}
            autocomplete={pad.autocomplete}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void run('run')}
              disabled={running}
              className="min-h-[40px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent disabled:opacity-60"
            >
              Correr <span className="normal-case opacity-70">(⌘↵)</span>
            </button>
            <button
              type="button"
              onClick={() => void run('examples')}
              disabled={running}
              className="min-h-[40px] border border-j-border-input px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text hover:border-j-accent disabled:opacity-60"
            >
              Probar ejemplos
            </button>
            <span className="text-xs text-j-text-tertiary">Los casos ocultos corren al final, como en la evaluación del ingeniero.</span>
          </div>
          <RunOutput result={output?.result ?? null} running={running} label={output?.label} language={language} />
          {voice.transcript.length > 0 && (
            <details className="border border-j-border px-3 py-2">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Transcripción en vivo</summary>
              <Transcript lines={voice.transcript} interviewer={config.interviewer.name} />
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function Transcript({ lines, interviewer }: { lines: { role: 'user' | 'model'; text: string }[]; interviewer: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);
  return (
    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto" lang="en">
      {lines.map((l, i) => (
        <p key={i} className={cn('text-sm leading-relaxed', l.role === 'user' ? 'text-j-text-secondary' : 'text-j-text')}>
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">{l.role === 'user' ? 'Vos' : interviewer}</span>
          {l.text}
        </p>
      ))}
      <div ref={end} />
    </div>
  );
}

/** The method on screen: the phases with their minutes, the current one open, and what to say when stuck. */
function PhaseGuide({ phaseIndex, minutes }: { phaseIndex: number; minutes: number }) {
  const coding = useCoding()!;
  const { phases, stuck_drills } = coding.config;
  const [open, setOpen] = useState<number | null>(null);
  const shown = open ?? phaseIndex;
  const phrasesOf = (slug?: string) => (slug ? drillPhraseList(coding.drills.get(slug)?.textEn ?? '') : []);
  const at = (f: number) => Math.round(f * minutes);

  return (
    <div className="space-y-3" data-testid="phase-guide">
      <ol className="space-y-1">
        {phases.map((p, i) => {
          const isOpen = i === shown;
          return (
            <li key={p.id} className={cn('border', i === phaseIndex ? 'border-j-accent' : 'border-j-border')}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex min-h-[40px] w-full items-center gap-2 px-3 py-1.5 text-left"
              >
                <span className="font-mono text-[10px] tabular-nums text-j-text-tertiary">
                  {at(p.from)}–{at(p.to)}′
                </span>
                <span className={cn('flex-1 text-sm', i === phaseIndex ? 'font-medium text-j-text' : 'text-j-text-secondary')}>{p.title}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-j-border px-3 py-2">
                  <p className="text-xs text-j-text-secondary">{p.what}</p>
                  <ul className="space-y-1" lang="en">
                    {phrasesOf(p.drill).map((ph, k) => (
                      <li key={k} className="text-xs text-j-text">
                        “{ph}”
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {stuck_drills.length > 0 && (
        <details className="border border-j-border px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-warm">Si te trabás</summary>
          <div className="mt-2 space-y-3">
            {stuck_drills.map((slug) => (
              <div key={slug}>
                <p className="text-xs font-medium text-j-text-secondary">{coding.drills.get(slug)?.title ?? slug}</p>
                <ul className="mt-1 space-y-1" lang="en">
                  {phrasesOf(slug).map((ph, k) => (
                    <li key={k} className="text-xs text-j-text">
                      “{ph}”
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/** The Python interpreter's state while Python is the pad's language: loading it starts as soon as it is picked. */
function usePythonStatus(active: boolean): PythonStatus {
  const [status, setStatus] = useState<PythonStatus>('idle');
  useEffect(() => {
    if (!active) return;
    const runner = pythonRunner();
    setStatus(runner.status);
    const off = runner.subscribe(setStatus);
    void runner.warm();
    return off;
  }, [active]);
  // Leaving the mock frees the interpreter (tens of MB).
  useEffect(() => () => pythonRunner().dispose(), []);
  return active ? status : 'idle';
}

const PYTHON_STATUS_LABEL: Record<PythonStatus, string> = {
  idle: '',
  loading: 'Cargando Python…',
  ready: 'Python listo',
  error: 'Python no cargó: revisá la conexión y corré de nuevo',
};

interface LanguageChoiceProps {
  language: CodeLanguage;
  offered: readonly CodeLanguage[];
  onPick: (l: CodeLanguage) => void;
  pythonStatus: PythonStatus;
}

/** The language picker before the mock: one button per language, the ones this problem has. */
function LanguageChoice({ language, offered, onPick, pythonStatus }: LanguageChoiceProps) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1" role="radiogroup" aria-label="Lenguaje">
        {CODE_LANGUAGES.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={l === language}
            disabled={!offered.includes(l)}
            title={offered.includes(l) ? undefined : 'Este problema es solo TypeScript y JavaScript'}
            onClick={() => onPick(l)}
            className={cn(
              'min-h-[44px] flex-1 border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-40',
              l === language ? 'border-j-accent bg-j-accent/10 text-j-text' : 'border-j-border-input text-j-text-secondary hover:border-j-accent',
            )}
          >
            {LANGUAGE_LABEL[l]}
          </button>
        ))}
      </div>
      {PYTHON_STATUS_LABEL[pythonStatus] && <p className="text-xs text-j-text-tertiary">{PYTHON_STATUS_LABEL[pythonStatus]}</p>}
    </div>
  );
}

/** The bar over the editor, as on CoderPad: the language and the autocomplete switch. */
function PadToolbar({
  language,
  offered,
  onPick,
  autocomplete,
  onAutocomplete,
  pythonStatus,
}: LanguageChoiceProps & { autocomplete: boolean; onAutocomplete: (on: boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-j-border bg-j-bg-alt px-2 py-1.5" data-testid="pad-toolbar">
      <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        Lenguaje
        <select
          value={language}
          onChange={(e) => onPick(e.target.value as CodeLanguage)}
          className="min-h-[32px] border border-j-border-input bg-j-bg px-2 font-mono text-xs normal-case tracking-normal text-j-text"
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l} disabled={!offered.includes(l)}>
              {LANGUAGE_LABEL[l]}
              {offered.includes(l) ? '' : ' (no en este problema)'}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-[32px] cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        <input type="checkbox" checked={autocomplete} onChange={(e) => onAutocomplete(e.target.checked)} className="accent-[var(--j-accent)]" />
        Autocompletar
      </label>
      {PYTHON_STATUS_LABEL[pythonStatus] && (
        <span className="text-xs text-j-text-tertiary" aria-live="polite">
          {PYTHON_STATUS_LABEL[pythonStatus]}
        </span>
      )}
    </div>
  );
}
