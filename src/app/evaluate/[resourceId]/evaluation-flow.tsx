'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Language = 'es' | 'en';

const translations = {
  'eval.testUnderstanding': { es: 'Evalúa tu comprensión de este', en: 'Test your understanding of this' },
  'eval.conceptsToEvaluate': { es: 'Conceptos a evaluar', en: 'Concepts to evaluate' },
  'eval.aiWillGenerate': {
    es: 'La IA generará 5 preguntas para evaluar tu comprensión. Respondé honestamente — esto ayuda a identificar vacíos en tu conocimiento.',
    en: 'AI will generate 5 questions to test your understanding. Answer honestly — this helps identify gaps in your knowledge.'
  },
  'eval.start': { es: 'Comenzar Evaluación', en: 'Start Evaluation' },
  'eval.generating': { es: 'Generando preguntas...', en: 'Generating questions...' },
  'eval.mayTakeSeconds': { es: 'Esto puede tomar unos segundos', en: 'This may take a few seconds' },
  'eval.answerAll': { es: 'Respondé todas las preguntas para completar la evaluación', en: 'Answer all questions to complete the evaluation' },
  'eval.question': { es: 'Pregunta', en: 'Question' },
  'eval.of': { es: 'de', en: 'of' },
  'eval.concept': { es: 'Concepto', en: 'Concept' },
  'eval.placeholder': { es: 'Escribí tu respuesta aquí...', en: 'Type your answer here...' },
  'eval.cancel': { es: 'Cancelar', en: 'Cancel' },
  'eval.submit': { es: 'Enviar Respuestas', en: 'Submit Answers' },
  'eval.answerAllCount': { es: 'Respondé todas las preguntas', en: 'Answer all questions' },
  'eval.evaluating': { es: 'Evaluando tus respuestas...', en: 'Evaluating your answers...' },
  'eval.aiReviewing': { es: 'La IA está revisando tus respuestas', en: 'AI is reviewing your responses' },
  'eval.complete': { es: 'Evaluación Completada', en: 'Evaluation Complete' },
  'eval.overallScore': { es: 'Puntuación General', en: 'Overall Score' },
  'eval.yourAnswer': { es: 'Tu respuesta', en: 'Your answer' },
  'eval.feedback': { es: 'Retroalimentación', en: 'Feedback' },
  'eval.backToLibrary': { es: 'Volver a la Biblioteca', en: 'Back to Library' },
  'eval.backToChapter': { es: 'Volver al capítulo', en: 'Back to chapter' },
} as const;

function t(key: keyof typeof translations, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}

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
}

type Phase = 'intro' | 'loading' | 'questions' | 'submitting' | 'results';

export function EvaluationFlow({ resource, concepts, userId, language }: Props) {
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

  const handleStartEvaluation = async () => {
    setPhase('loading');
    setError(null);

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
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setPhase('questions');
    } catch (err) {
      setError((err as Error).message);
      setPhase('intro');
    }
  };

  const handleSubmitAnswers = async () => {
    setPhase('submitting');
    setError(null);

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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to evaluate answers');
      }

      const data = await response.json();
      setResults(data);
      setPhase('results');
    } catch (err) {
      setError((err as Error).message);
      setPhase('questions');
    }
  };

  const allAnswered = questions.every((_, i) => answers[i.toString()]?.trim());

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-px bg-j-accent" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {language === 'es' ? 'Evaluar' : 'Evaluate'}
          </span>
        </div>

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
          <p className="text-sm text-j-error mb-4">{error}</p>
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
      <div className="py-16 text-center">
        <p className="text-sm text-j-text-secondary">{t('eval.generating', language)}</p>
        <p className="mt-2 text-xs text-j-text-tertiary">{t('eval.mayTakeSeconds', language)}</p>
      </div>
    );
  }

  // QUESTIONS PHASE
  if (phase === 'questions') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-px bg-j-accent" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {language === 'es' ? 'Evaluar' : 'Evaluate'}
          </span>
        </div>

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
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-j-error mt-4">{error}</p>}

        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          <button
            onClick={() => router.push(`/learn/${resource.id}`)}
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
      <div className="py-16 text-center">
        <p className="text-sm text-j-text-secondary">{t('eval.evaluating', language)}</p>
        <p className="mt-2 text-xs text-j-text-tertiary">{t('eval.aiReviewing', language)}</p>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === 'results' && results) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-px bg-j-accent" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {t('eval.complete', language)}
          </span>
        </div>

        {/* Score summary */}
        <div className="border border-j-border p-8 mb-10">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className={`text-4xl font-light ${
                results.overallScore >= 60 ? 'text-j-accent' : 'text-j-error'
              }`}>
                {results.overallScore}%
              </p>
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                {t('eval.overallScore', language)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-j-text-secondary leading-relaxed">{results.summary}</p>
            </div>
          </div>
        </div>

        {/* Individual results */}
        <div className="space-y-6">
          {results.responses.map((result, index) => {
            const question = questions[index];
            return (
              <div
                key={index}
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
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          <button
            onClick={() => router.push(`/learn/${resource.id}`)}
            className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {t('eval.backToChapter', language)}
          </button>
          <button
            onClick={() => router.push('/library')}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {t('eval.backToLibrary', language)}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
