'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ErrorMessage } from '@/components/error-message';
import { SectionLabel } from '@/components/ui/section-label';
import { categorizeError } from '@/lib/utils/categorize-error';

type Language = 'es' | 'en';

const translations = {
  'eval.testUnderstanding': { es: 'Evalua tu comprension de este', en: 'Test your understanding of this' },
  'eval.conceptsToEvaluate': { es: 'Conceptos a evaluar', en: 'Concepts to evaluate' },
  'eval.aiWillGenerate': {
    es: 'La IA generara 5 preguntas para evaluar tu comprension. Responde honestamente — esto ayuda a identificar areas de exploracion en tu conocimiento.',
    en: 'AI will generate 5 questions to test your understanding. Answer honestly — this helps identify areas to explore in your knowledge.'
  },
  'eval.start': { es: 'Comenzar Evaluacion', en: 'Start Evaluation' },
  'eval.generating': { es: 'Generando preguntas...', en: 'Generating questions...' },
  'eval.generatingEstimate': { es: 'Esto suele tomar ~15 segundos', en: 'This usually takes ~15 seconds' },
  'eval.cancelLoading': { es: 'Cancelar', en: 'Cancel' },
  'eval.answerAll': { es: 'Responde todas las preguntas para completar la evaluacion', en: 'Answer all questions to complete the evaluation' },
  'eval.question': { es: 'Pregunta', en: 'Question' },
  'eval.of': { es: 'de', en: 'of' },
  'eval.concept': { es: 'Concepto', en: 'Concept' },
  'eval.placeholder': { es: 'Escribi tu respuesta aqui...', en: 'Type your answer here...' },
  'eval.cancel': { es: 'Cancelar', en: 'Cancel' },
  'eval.submit': { es: 'Enviar Respuestas', en: 'Submit Answers' },
  'eval.answerAllCount': { es: 'Responde todas las preguntas', en: 'Answer all questions' },
  'eval.evaluating': { es: 'Evaluando tus respuestas...', en: 'Evaluating your answers...' },
  'eval.evaluatingEstimate': { es: 'Esto suele tomar ~15 segundos', en: 'This usually takes ~15 seconds' },
  'eval.aiReviewing': { es: 'La IA esta revisando tus respuestas', en: 'AI is reviewing your responses' },
  'eval.complete': { es: 'Evaluacion Completada', en: 'Evaluation Complete' },
  'eval.overallScore': { es: 'Puntuacion General', en: 'Overall Score' },
  'eval.yourAnswer': { es: 'Tu respuesta', en: 'Your answer' },
  'eval.feedback': { es: 'Retroalimentacion', en: 'Feedback' },
  'eval.saved': { es: 'Evaluacion guardada', en: 'Evaluation saved' },
  'eval.cancelConfirm': {
    es: 'Seguro? Tu progreso se guardara como borrador.',
    en: 'Are you sure? Your progress will be saved as a draft.'
  },
  'eval.discoveryMessage': {
    es: 'Las evaluaciones son herramientas de descubrimiento, no juicios',
    en: 'Evaluations are discovery tools, not judgments'
  },
  'eval.lowScoreEncouragement': {
    es: 'Cuando te sientas listo, volve a intentarlo — cada intento es aprendizaje',
    en: 'When you feel ready, try again — each attempt is learning'
  },
  'eval.lowScoreIdentified': {
    es: 'Identificaste areas clave para profundizar',
    en: 'You identified key areas to explore further'
  },
  'eval.retryEvaluation': { es: 'Volver a intentar', en: 'Try again' },
  'eval.reviewMaterial': { es: 'Repasar material', en: 'Review material' },
  'eval.backToLibrary': { es: 'Volver a la biblioteca', en: 'Back to library' },
  'eval.hintShort': { es: '2-4 oraciones suelen ser suficientes', en: '2-4 sentences are usually enough' },
  'eval.hintLong': { es: 'Un parrafo con ejemplo concreto', en: 'A paragraph with a concrete example' },
} as const;

function t(key: keyof typeof translations, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}

// Question types that require deeper answers
const DEEP_QUESTION_TYPES = new Set(['scenario', 'tradeoff', 'trade-off', 'connection', 'error_detection']);

interface Concept {
  id: string;
  name: string;
  canonical_definition: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface Question {
  id: string;
  type: string;
  conceptName: string;
  question: string;
}

interface EvaluationResult {
  questionIndex: number;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

interface Props {
  resource: Resource;
  concepts: Concept[];
  userId: string;
  language: Language;
  /** Called when the user cancels from the evaluation (e.g. back to previous step) */
  onCancel?: () => void;
}

type Phase = 'intro' | 'loading' | 'questions' | 'submitting' | 'results';

// ============================================================================
// Spinner Component
// ============================================================================

function Spinner() {
  return (
    <div className="h-5 w-5 border-2 border-j-border border-t-j-accent rounded-full animate-spin" />
  );
}

// ============================================================================
// Rubric Dimension Display
// ============================================================================

function RubricSummary({ responses }: { responses: EvaluationResult[] }) {
  // Compute aggregate rubric dimensions from individual scores
  // We derive accuracy/completeness/depth from the score of each question
  const totalQuestions = responses.length;
  if (totalQuestions === 0) return null;

  const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / totalQuestions;

  // Map overall score to 3 dimensions on a 0-5 scale
  // Precision: how many got > 80%
  const highScoreCount = responses.filter(r => r.score >= 80).length;
  const midScoreCount = responses.filter(r => r.score >= 50 && r.score < 80).length;

  const precisionDots = Math.min(5, Math.round((highScoreCount / totalQuestions) * 5));
  const completenessDots = Math.min(5, Math.round((avgScore / 100) * 5));
  const depthDots = Math.min(5, Math.round(((highScoreCount + midScoreCount * 0.5) / totalQuestions) * 5));

  const dimensions = [
    { label: 'Precision', dots: precisionDots },
    { label: 'Completitud', dots: completenessDots },
    { label: 'Profundidad', dots: depthDots },
  ];

  return (
    <div className="flex flex-col gap-2">
      {dimensions.map(({ label, dots }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase w-24 text-right">
            {label}
          </span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={`bar-${level}`}
                className={`h-2 flex-1 w-4 transition-all duration-300 ${
                  level < dots ? 'bg-j-accent' : 'bg-j-border'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EvaluationFlow({ resource, concepts, userId, language, onCancel }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    responses: EvaluationResult[];
    overallScore: number;
    summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<'retry' | 'relogin' | 'wait' | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draftKey = `eval-draft-${resource.id}`;

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setAnswers(parsed);
        }
      }
    } catch {
      // Corrupted draft, ignore
    }
  }, [draftKey]);

  // Persist draft on change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers));
      } catch {
        // Storage full or unavailable, ignore
      }
    }
  }, [answers, draftKey]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCategorizedError = (err: unknown) => {
    const categorized = categorizeError(err);
    setError(categorized.message);
    setErrorAction(categorized.action);
  };

  const startLoadingState = () => {
    setShowCancelButton(false);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Show cancel button after 10 seconds
    cancelTimerRef.current = setTimeout(() => {
      setShowCancelButton(true);
    }, 10_000);

    return controller;
  };

  const cleanupLoadingState = () => {
    if (cancelTimerRef.current) {
      clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = null;
    }
    setShowCancelButton(false);
    abortControllerRef.current = null;
  };

  const handleCancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cleanupLoadingState();
    if (onCancel) {
      onCancel();
    } else {
      setPhase('intro');
    }
  };

  const handleStartEvaluation = async () => {
    setPhase('loading');
    setError(null);
    setErrorAction(null);

    const controller = startLoadingState();

    try {
      const response = await fetch('/api/evaluate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceType: resource.type,
          concepts: concepts.map((c) => ({
            name: c.name,
            definition: c.canonical_definition,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setPhase('questions');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled, already handled
        return;
      }
      handleCategorizedError(err);
      setPhase('intro');
    } finally {
      cleanupLoadingState();
    }
  };

  const handleCancelEvaluation = () => {
    const confirmed = window.confirm(t('eval.cancelConfirm', language));
    if (confirmed) {
      if (onCancel) {
        onCancel();
      } else {
        router.push(`/learn/${resource.id}`);
      }
    }
  };

  const handleSubmitAnswers = async () => {
    setPhase('submitting');
    setError(null);
    setErrorAction(null);

    const controller = startLoadingState();

    try {
      const response = await fetch('/api/evaluate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceTitle: resource.title,
          questions: questions.map((q, i) => ({
            ...q,
            conceptDefinition:
              concepts.find((c) => c.name === q.conceptName)?.canonical_definition || '',
            userAnswer: answers[i.toString()] || '',
          })),
          userId,
          predictedScore: null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to evaluate answers');
      }

      const data = await response.json();
      setResults(data);
      setPhase('results');
      localStorage.removeItem(draftKey);

      // Toast on successful save
      if (data.saved !== false) {
        toast.success(t('eval.saved', language));
      }

      // Check if first evaluation ever
      checkFirstEvaluation();

      // Celebration for high score
      if (data.overallScore >= 80) {
        toast.success('+ 25 XP por evaluacion completada');
      }

      if (data.saved === false) {
        setSaveError(true);
        try {
          localStorage.setItem(`eval-results-${resource.id}`, JSON.stringify(data));
        } catch {
          // Storage full or unavailable, ignore
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      handleCategorizedError(err);
      setPhase('questions');
    } finally {
      cleanupLoadingState();
    }
  };

  const checkFirstEvaluation = () => {
    try {
      const key = 'jarre-first-eval-celebrated';
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        setTimeout(() => {
          toast.success('Primera evaluacion completada!');
        }, 500);
      }
    } catch {
      // Storage unavailable
    }
  };

  const retrySave = async () => {
    if (!results) return;
    try {
      const response = await fetch('/api/evaluate/retry-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          overallScore: results.overallScore,
          predictedScore: null,
          promptVersion: 'unknown',
        }),
      });
      const data = await response.json();
      if (data.saved) {
        setSaveError(false);
        localStorage.removeItem(`eval-results-${resource.id}`);
        toast.success(t('eval.saved', language));
      }
    } catch {
      // Retry failed, keep banner visible
    }
  };

  const allAnswered = questions.every((_, i) => answers[i.toString()]?.trim());

  // Find lowest dimension for recovery guidance
  const getLowestDimension = (): string | null => {
    if (!results || results.responses.length === 0) return null;
    const totalQ = results.responses.length;
    const highCount = results.responses.filter(r => r.score >= 80).length;
    const midCount = results.responses.filter(r => r.score >= 50 && r.score < 80).length;
    const avg = results.responses.reduce((s, r) => s + r.score, 0) / totalQ;

    const precision = (highCount / totalQ) * 100;
    const completeness = avg;
    const depth = ((highCount + midCount * 0.5) / totalQ) * 100;

    const dims = [
      { label: 'precision', value: precision },
      { label: 'completitud', value: completeness },
      { label: 'profundidad', value: depth },
    ];
    dims.sort((a, b) => a.value - b.value);
    return dims[0].label;
  };

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <div>
        <SectionLabel className="mb-8">
          {language === 'es' ? 'Evaluar' : 'Evaluate'}
        </SectionLabel>

        <h2 className="text-xl font-light text-j-text mb-2">{resource.title}</h2>
        <p className="text-sm text-j-text-secondary mb-8">
          {t('eval.testUnderstanding', language)} {resource.type}
        </p>

        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
            {t('eval.conceptsToEvaluate', language)}
          </p>
          <ul className="space-y-1.5">
            {concepts.map((concept) => (
              <li key={concept.id} className="text-sm text-j-text-secondary flex items-center gap-2">
                <span className="w-1 h-1 bg-j-accent rounded-full" />
                {concept.name}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-j-text-secondary leading-relaxed mb-8">
          {t('eval.aiWillGenerate', language)}
        </p>

{error && (
          <div className="mb-4">
            <ErrorMessage
              message={error}
              variant="block"
              onRetry={errorAction === 'retry' || errorAction === 'wait' ? handleStartEvaluation : undefined}
            />
            {errorAction === 'relogin' && (
              <button
                onClick={() => router.push('/login')}
                className="mt-2 font-mono text-[10px] tracking-[0.15em] text-j-accent underline uppercase"
              >
                {language === 'es' ? 'Iniciar sesion' : 'Log in'}
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleStartEvaluation}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
        >
          {t('eval.start', language)}
        </button>
      </div>
    );
  }

  // LOADING PHASE
  if (phase === 'loading') {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-sm text-j-text-secondary">{t('eval.generating', language)}</p>
        <p className="text-xs text-j-text-tertiary">{t('eval.generatingEstimate', language)}</p>
        {showCancelButton && (
          <button
            onClick={handleCancelLoading}
            className="mt-4 font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {t('eval.cancelLoading', language)}
          </button>
        )}
      </div>
    );
  }

  // QUESTIONS PHASE
  if (phase === 'questions') {
    return (
      <div>
        <SectionLabel className="mb-8">
          {language === 'es' ? 'Evaluar' : 'Evaluate'}
        </SectionLabel>

        <h2 className="text-xl font-light text-j-text mb-2">{resource.title}</h2>
        <p className="text-sm text-j-text-secondary mb-10">
          {t('eval.answerAll', language)}
        </p>

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id || index} className="border-l-2 border-j-border pl-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  {t('eval.question', language)} {index + 1} {t('eval.of', language)} {questions.length}
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase">
                  {question.type}
                </span>
              </div>

              <p className="text-sm text-j-text leading-relaxed mb-2">
                {question.question}
              </p>

              <p className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase mb-3">
                {t('eval.concept', language)}: {question.conceptName}
              </p>

              <textarea
                className="w-full border border-j-border-input bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
                rows={4}
                placeholder={t('eval.placeholder', language)}
                value={answers[index.toString()] || ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [index.toString()]: e.target.value }))
                }
              />

              {/* Expected length hint */}
              <p className="text-[9px] text-j-text-tertiary font-mono mt-1">
                {DEEP_QUESTION_TYPES.has(question.type)
                  ? t('eval.hintLong', language)
                  : t('eval.hintShort', language)}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4">
            <ErrorMessage
              message={error}
              variant="block"
              onRetry={errorAction !== 'relogin' ? handleSubmitAnswers : undefined}
            />
          </div>
        )}

        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          <button
            onClick={handleCancelEvaluation}
            className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {t('eval.cancel', language)}
          </button>
          <button
            onClick={handleSubmitAnswers}
            disabled={!allAnswered}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
          >
            {allAnswered
              ? t('eval.submit', language)
              : `${t('eval.answerAllCount', language)} (${Object.keys(answers).length}/${questions.length})`}
          </button>
        </div>
      </div>
    );
  }

  // SUBMITTING PHASE
  if (phase === 'submitting') {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-sm text-j-text-secondary">{t('eval.evaluating', language)}</p>
        <p className="text-xs text-j-text-tertiary">{t('eval.evaluatingEstimate', language)}</p>
        {showCancelButton && (
          <button
            onClick={handleCancelLoading}
            className="mt-4 font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {t('eval.cancelLoading', language)}
          </button>
        )}
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === 'results' && results) {
    const isHighScore = results.overallScore >= 80;
    const isLowScore = results.overallScore < 60;
    const lowestDimension = isLowScore ? getLowestDimension() : null;

    return (
      <div>
        <SectionLabel className="mb-8">
          {t('eval.complete', language)}
        </SectionLabel>

        {saveError && (
          <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {language === 'es'
                ? 'Tus resultados no se pudieron guardar. Tus respuestas estan respaldadas localmente.'
                : 'Your results could not be saved. Your answers are backed up locally.'}
            </p>
            <button
              onClick={retrySave}
              className="mt-2 font-mono text-[10px] tracking-[0.15em] text-yellow-800 underline uppercase"
            >
              {language === 'es' ? 'Reintentar guardado' : 'Retry save'}
            </button>
          </div>
        )}

        {/* Rubric dimensions summary */}
        <div className="border border-j-border p-6 mb-4">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-4">
            {language === 'es' ? 'Desglose por dimension' : 'Breakdown by dimension'}
          </p>
          <RubricSummary responses={results.responses} />
        </div>

        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`border p-8 mb-4 j-glow-accent ${isHighScore ? 'border-j-accent bg-j-accent/5' : 'border-j-border'}`}
        >
          <div className="flex items-center gap-8">
            <div className="text-center">
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 120 }}
                className={`text-5xl font-light ${
                  results.overallScore >= 60 ? 'text-j-accent' : 'text-j-error'
                }`}
              >
                {results.overallScore}%
              </motion.p>
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                {t('eval.overallScore', language)}
              </p>
              {isHighScore && (
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase mt-2 animate-pulse">
                  Excelente
                </p>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {isLowScore
                  ? t('eval.lowScoreIdentified', language)
                  : results.summary}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Discovery framing message */}
        <p className="text-[10px] text-j-text-tertiary font-mono text-center mb-6">
          {t('eval.discoveryMessage', language)}
        </p>

{/* Recovery guidance for low scores */}
        {isLowScore && lowestDimension && (
          <div className="border border-j-border bg-j-bg-alt p-6 mb-6">
            <p className="text-sm text-j-text-secondary leading-relaxed mb-2">
              {language === 'es'
                ? `Recomendacion: profundizar en ${lowestDimension}`
                : `Recommendation: deepen your ${lowestDimension}`}
            </p>
            <p className="text-[10px] text-j-text-tertiary font-mono">
              {t('eval.lowScoreEncouragement', language)}
            </p>
          </div>
        )}

        {/* Individual results */}
        <div className="space-y-6">
          {results.responses.map((result, index) => {
            const question = questions[index];
            return (
              <motion.div
                key={`eval-result-${result.questionIndex}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className={`border-l-2 pl-6 ${
                  result.isCorrect ? 'border-j-accent' : 'border-j-error'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-j-text-tertiary">
                    {t('eval.question', language)} {index + 1}
                  </span>
                  <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
                    result.isCorrect ? 'text-j-accent' : 'text-j-error'
                  }`}>
                    {result.score}%
                  </span>
                </div>

                <p className="text-sm text-j-text leading-relaxed mb-3">
                  {question?.question}
                </p>

                <div className="space-y-2">
                  <div className="bg-j-bg-alt border border-j-border p-3">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {t('eval.yourAnswer', language)}
                    </p>
                    <p className="text-sm text-j-text">{answers[index.toString()]}</p>
                  </div>

                  <div className="p-3">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {t('eval.feedback', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">{result.feedback}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          {isHighScore ? (
            /* ≥80%: Mastery demonstrated — done, go back to library */
            <button
              onClick={() => router.push('/library')}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {t('eval.backToLibrary', language)}
            </button>
          ) : isLowScore ? (
            /* <60%: Needs more study — retry or go back to review */
            <>
              <button
                onClick={() => onCancel ? onCancel() : router.push(`/learn/${resource.id}`)}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
              >
                {t('eval.reviewMaterial', language)}
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setError(null);
                  setErrorAction(null);
                  setQuestions([]);
                  setAnswers({});
                  handleStartEvaluation();
                }}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('eval.retryEvaluation', language)}
              </button>
            </>
          ) : (
            /* 60-79%: Passed with gaps — review material or move on */
            <>
              <button
                onClick={() => router.push('/library')}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
              >
                {t('eval.backToLibrary', language)}
              </button>
              <button
                onClick={() => onCancel ? onCancel() : router.push(`/learn/${resource.id}`)}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('eval.reviewMaterial', language)}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
