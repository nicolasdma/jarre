'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnnotatedContent } from './annotated-content';
import { ConfidenceIndicator, type ConfidenceLevel } from './confidence-indicator';
import { SelfExplanation } from './self-explanation';
import { t, type Language } from '@/lib/translations';
import type { ReviewSubmitResponse, InlineQuiz, Exercise, ExerciseResult } from '@/types';
import type { FigureRegistry } from '@/lib/figure-registry';
import { useWhisper } from '@/lib/whisper/whisper-context';
import type { SectionState } from '@/lib/learn-progress';
import { ExerciseShell } from '@/components/exercises/exercise-shell';
import { VoicePanel } from '@/components/voice/voice-panel';

// ============================================================================
// Types
// ============================================================================

interface Section {
  id: string;
  conceptId: string;
  sectionTitle: string;
  contentMarkdown: string;
  sortOrder: number;
}

interface ConceptSectionProps {
  section: Section;
  language: Language;
  isActive: boolean;
  onComplete: () => void;
  onActivate?: () => void;
  initialState?: SectionState;
  onStateChange?: (state: SectionState) => void;
  figureRegistry?: FigureRegistry;
  inlineQuizzes?: InlineQuiz[];
  exercises?: Exercise[];
}

type Phase = 'pre-question' | 'content' | 'exercise' | 'post-test' | 'completed';

interface QuestionData {
  questionId: string;
  conceptName: string;
  questionText: string;
  expectedAnswer: string;
  difficulty: number;
}

// ============================================================================
// Component
// ============================================================================

export function ConceptSection({
  section,
  language,
  isActive,
  onComplete,
  onActivate,
  initialState,
  onStateChange,
  figureRegistry,
  inlineQuizzes,
  exercises,
}: ConceptSectionProps) {
  const hasExercises = exercises && exercises.length > 0;
  const [phase, setPhase] = useState<Phase>(initialState?.phase ?? 'pre-question');
  const [preQuestion, setPreQuestion] = useState<QuestionData | null>(null);
  const [preAnswer, setPreAnswer] = useState(initialState?.preAnswer ?? '');
  const [preLoading, setPreLoading] = useState(false);
  const [preAttempted, setPreAttempted] = useState(initialState?.preAttempted ?? false);

  const [postQuestion, setPostQuestion] = useState<QuestionData | null>(null);
  const [postAnswer, setPostAnswer] = useState('');
  const [postLoading, setPostLoading] = useState<'fetching' | 'evaluating' | null>(null);
  const [postResult, setPostResult] = useState<ReviewSubmitResponse | null>(
    initialState?.postScore != null
      ? {
          score: initialState.postScore,
          isCorrect: initialState.postIsCorrect ?? false,
          feedback: initialState.postFeedback ?? '',
          expectedAnswer: initialState.postExpectedAnswer ?? '',
          rating: 'easy',
          nextReviewAt: '',
          intervalDays: 0,
          dimensionScores: initialState.postDimensionScores,
          reasoning: initialState.postReasoning,
        }
      : null
  );
  const [postError, setPostError] = useState<string | null>(null);
  const [postConfidence, setPostConfidence] = useState<ConfidenceLevel | null>(
    (initialState?.postConfidence as ConfidenceLevel) ?? null
  );
  const [selfExplanation, setSelfExplanation] = useState(initialState?.selfExplanation ?? '');
  const [selfExplanationValid, setSelfExplanationValid] = useState(
    !!(initialState?.selfExplanation && initialState.selfExplanation.length >= 30)
  );

  const [preFetchFailed, setPreFetchFailed] = useState(false);
  const [voiceCompleted, setVoiceCompleted] = useState(initialState?.voiceCompleted ?? false);

  const { cancel: cancelWhisper } = useWhisper();

  // Restore completed sections on mount: if saved as 'completed', notify parent
  const restoredRef = useRef(false);
  useEffect(() => {
    if (initialState?.phase === 'completed' && !restoredRef.current) {
      restoredRef.current = true;
      onComplete();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch a question scoped to this section (falls back to concept-level)
  const fetchQuestion = useCallback(
    async (exclude?: string): Promise<QuestionData | null> => {
      const params = new URLSearchParams();
      params.set('concepts', section.conceptId);
      params.set('sectionId', section.id);
      if (exclude) params.set('exclude', exclude);

      const res = await fetch(`/api/review/random?${params.toString()}`);
      if (!res.ok) return null;
      return res.json();
    },
    [section.conceptId, section.id]
  );

  // Load pre-question on first render (if active)
  const loadPreQuestion = useCallback(async () => {
    if (preQuestion || preLoading || preFetchFailed) return;
    setPreLoading(true);
    const q = await fetchQuestion();
    setPreQuestion(q);
    if (!q) setPreFetchFailed(true);
    setPreLoading(false);
  }, [preQuestion, preLoading, preFetchFailed, fetchQuestion]);

  // Start loading when this section becomes active
  if (isActive && !preQuestion && !preLoading && !preAttempted && !preFetchFailed) {
    loadPreQuestion();
  }

  // Submit pre-question attempt (just record, don't evaluate via LLM)
  const handlePreSubmit = () => {
    setPreAttempted(true);
    setPhase('content');
    onStateChange?.({ phase: 'content', preAnswer, preAttempted: true });
  };

  const skipToContent = () => {
    setPreAttempted(true);
    setPhase('content');
    onStateChange?.({ phase: 'content', preAnswer: '', preAttempted: true });
  };

  // Move to exercise or post-test
  const handleContentDone = useCallback(async () => {
    cancelWhisper();
    if (hasExercises) {
      setPhase('exercise');
      onStateChange?.({ phase: 'exercise', preAnswer, preAttempted });
    } else {
      setPhase('post-test');
      onStateChange?.({ phase: 'post-test', preAnswer, preAttempted });
      setPostLoading('fetching');
      const q = await fetchQuestion(preQuestion?.questionId);
      setPostQuestion(q);
      setPostLoading(null);
    }
  }, [fetchQuestion, preQuestion?.questionId, onStateChange, preAnswer, preAttempted, cancelWhisper, hasExercises]);

  // Move from exercise to post-test
  const handleExercisesDone = useCallback(async () => {
    setPhase('post-test');
    onStateChange?.({ phase: 'post-test', preAnswer, preAttempted });
    setPostLoading('fetching');
    const q = await fetchQuestion(preQuestion?.questionId);
    setPostQuestion(q);
    setPostLoading(null);
  }, [fetchQuestion, preQuestion?.questionId, onStateChange, preAnswer, preAttempted]);

  // Submit post-test answer (evaluated via DeepSeek)
  const handlePostSubmit = useCallback(async () => {
    if (!postAnswer.trim() || !postQuestion) return;

    setPostLoading('evaluating');
    setPostError(null);

    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: postQuestion.questionId,
          userAnswer: postAnswer.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate');
      const data: ReviewSubmitResponse = await res.json();
      setPostResult(data);
      setPostLoading(null);
      onStateChange?.({
        phase: 'post-test',
        preAnswer,
        preAttempted,
        postScore: data.score,
        postIsCorrect: data.isCorrect,
        postFeedback: data.feedback,
        postExpectedAnswer: data.expectedAnswer,
        postDimensionScores: data.dimensionScores,
        postReasoning: data.reasoning,
      });
    } catch (err) {
      setPostError((err as Error).message);
      setPostLoading(null);
    }
  }, [postAnswer, postQuestion, onStateChange, preAnswer, preAttempted]);

  // Handle confidence selection
  const handleConfidence = useCallback(
    (level: ConfidenceLevel) => {
      setPostConfidence(level);
      // Send confidence to backend (fire-and-forget)
      if (postQuestion) {
        fetch('/api/review/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: postQuestion.questionId,
            userAnswer: postAnswer.trim(),
            confidence: level,
          }),
        }).catch(() => {});
      }
      onStateChange?.({
        phase: 'post-test',
        preAnswer,
        preAttempted,
        postScore: postResult?.score,
        postIsCorrect: postResult?.isCorrect,
        postFeedback: postResult?.feedback,
        postExpectedAnswer: postResult?.expectedAnswer,
        postDimensionScores: postResult?.dimensionScores,
        postReasoning: postResult?.reasoning,
        postConfidence: level,
      });
    },
    [postQuestion, postAnswer, postResult, onStateChange, preAnswer, preAttempted]
  );

  // Handle self-explanation save
  const handleSelfExplanation = useCallback(
    (text: string) => {
      setSelfExplanation(text);
      onStateChange?.({
        phase: 'post-test',
        preAnswer,
        preAttempted,
        postScore: postResult?.score,
        postIsCorrect: postResult?.isCorrect,
        postFeedback: postResult?.feedback,
        postExpectedAnswer: postResult?.expectedAnswer,
        postDimensionScores: postResult?.dimensionScores,
        postReasoning: postResult?.reasoning,
        postConfidence: postConfidence ?? undefined,
        selfExplanation: text,
      });
    },
    [postResult, postConfidence, onStateChange, preAnswer, preAttempted]
  );

  // Complete section
  const handleComplete = () => {
    setPhase('completed');
    onStateChange?.({
      phase: 'completed',
      preAnswer,
      preAttempted,
      postScore: postResult?.score,
      postIsCorrect: postResult?.isCorrect,
      postFeedback: postResult?.feedback,
      postExpectedAnswer: postResult?.expectedAnswer,
      postDimensionScores: postResult?.dimensionScores,
      postReasoning: postResult?.reasoning,
      postConfidence: postConfidence ?? undefined,
      selfExplanation: selfExplanation || undefined,
    });
    onComplete();
  };

  if (!isActive && phase !== 'completed') {
    // Collapsed view — clickable to navigate
    return (
      <button
        type="button"
        onClick={onActivate}
        className="w-full text-left border-l-2 border-j-border pl-6 py-4 opacity-50 hover:opacity-80 hover:border-j-warm transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            {String(section.sortOrder + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-j-text-secondary">{section.sectionTitle}</span>
        </div>
      </button>
    );
  }

  if (phase === 'completed' && !isActive) {
    return (
      <button
        type="button"
        onClick={onActivate}
        className="w-full text-left border-l-2 border-j-accent pl-6 py-4 hover:bg-j-bg-alt transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase">
            ✓ {section.sectionTitle}
          </span>
          {postResult && (
            <span
              className={`font-mono text-[10px] ${postResult.isCorrect ? 'text-j-accent' : 'text-j-text-tertiary'}`}
            >
              {postResult.score}%
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="border-l-2 border-j-accent pl-6 py-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase font-medium">
          {String(section.sortOrder + 1).padStart(2, '0')}
        </span>
        <span className="text-sm font-medium text-j-text">
          {section.sectionTitle}
        </span>
      </div>

      {/* Phase: Pre-question (productive failure) */}
      {phase === 'pre-question' && (
        <div className="bg-j-bg-alt border border-j-border p-6 mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">
            {t('learn.preQuestion.title', language)}
          </p>
          <p className="text-xs text-j-text-tertiary mb-4">
            {t('learn.preQuestion.instruction', language)}
          </p>

          {preLoading && (
            <p className="text-sm text-j-text-tertiary">{t('common.loading', language)}</p>
          )}

          {preQuestion && (
            <div className="space-y-3">
              <p className="text-sm text-j-text leading-relaxed">
                {preQuestion.questionText}
              </p>

              <textarea
                value={preAnswer}
                onChange={(e) => setPreAnswer(e.target.value)}
                placeholder={t('review.answerPlaceholder', language)}
                rows={3}
                className="w-full border border-j-border-input bg-j-bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handlePreSubmit();
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={handlePreSubmit}
                  disabled={!preAnswer.trim()}
                  className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
                >
                  {t('learn.preQuestion.submit', language)}
                </button>
                <button
                  onClick={skipToContent}
                  className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 uppercase hover:border-j-accent transition-colors"
                >
                  {t('learn.preQuestion.skip', language)}
                </button>
              </div>
            </div>
          )}

          {!preLoading && !preQuestion && (
            <div>
              <p className="text-xs text-j-text-tertiary mb-3">
                No hay preguntas disponibles para este concepto.
              </p>
              <button
                onClick={skipToContent}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('learn.preQuestion.skip', language)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase: Content (reading) — also shown in review mode for completed sections */}
      {(phase === 'content' || phase === 'exercise' || phase === 'post-test' || phase === 'completed') && (
        <div className="mb-6">
          {preAttempted && preAnswer.trim() && (
            <div className="bg-j-bg-alt border border-j-border p-3 mb-6 text-xs text-j-text-tertiary">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-warm">
                {t('learn.preQuestion.attempted', language)}
              </span>
              <span className="ml-2">— lee la sección y compara con tu respuesta.</span>
            </div>
          )}

          <AnnotatedContent
            sectionId={section.id}
            markdown={section.contentMarkdown}
            conceptId={section.conceptId}
            sectionIndex={section.sortOrder}
            figures={figureRegistry}
            inlineQuizzes={inlineQuizzes}
          />

          {phase === 'content' && (
            <div className="mt-8 pt-6 border-t border-j-border">
              {!voiceCompleted ? (
                <VoicePanel
                  sectionId={section.id}
                  sectionContent={section.contentMarkdown}
                  sectionTitle={section.sectionTitle}
                  language={language}
                  onSessionComplete={() => {
                    setVoiceCompleted(true);
                    onStateChange?.({
                      ...initialState,
                      phase: 'content',
                      preAnswer: preAnswer,
                      preAttempted,
                      voiceCompleted: true,
                    });
                  }}
                />
              ) : (
                <div className="flex flex-col items-center py-8">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-j-accent mb-3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-1">
                    {language === 'es' ? 'Sesión completada' : 'Session complete'}
                  </p>
                  <p className="text-sm text-j-text-secondary mb-6">
                    {language === 'es'
                      ? 'Ahora comprobá lo que aprendiste.'
                      : 'Now test what you learned.'}
                  </p>
                  <button
                    onClick={handleContentDone}
                    className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-8 py-3 uppercase hover:bg-j-accent-hover transition-colors"
                  >
                    {t('learn.postTest.title', language)} →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Phase: Exercise (interactive, optional) */}
      {phase === 'exercise' && hasExercises && (
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
            {language === 'es' ? 'Ejercicio interactivo' : 'Interactive exercise'}
          </p>
          <ExerciseShell
            exercises={exercises!}
            language={language}
            onAllComplete={() => handleExercisesDone()}
          />
        </div>
      )}

      {/* Phase: Post-test (retrieval practice) */}
      {phase === 'post-test' && (
        <div className="bg-j-bg-alt border border-j-border p-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-4">
            {t('learn.postTest.title', language)}
          </p>

          {postLoading === 'fetching' && (
            <p className="text-sm text-j-text-tertiary">{t('common.loading', language)}</p>
          )}

          {postQuestion && !postResult && (
            <div className="space-y-3">
              <p className="text-sm text-j-text leading-relaxed">
                {postQuestion.questionText}
              </p>

              <textarea
                value={postAnswer}
                onChange={(e) => setPostAnswer(e.target.value)}
                placeholder={t('review.answerPlaceholder', language)}
                rows={3}
                className="w-full border border-j-border-input bg-j-bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey && postAnswer.trim()) {
                    handlePostSubmit();
                  }
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={handlePostSubmit}
                  disabled={!postAnswer.trim() || postLoading === 'evaluating'}
                  className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
                >
                  {postLoading === 'evaluating'
                    ? t('review.evaluating', language)
                    : t('review.verify', language)}
                </button>
                <button
                  onClick={handleComplete}
                  className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 uppercase hover:border-j-accent transition-colors"
                >
                  {language === 'es' ? 'Saltar' : 'Skip'}
                </button>
              </div>

              {postError && <p className="text-xs text-j-error">{postError}</p>}
            </div>
          )}

          {!postLoading && !postQuestion && (
            <div>
              <p className="text-xs text-j-text-tertiary mb-3">
                No hay preguntas disponibles para este concepto.
              </p>
              <button
                onClick={handleComplete}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('learn.section.next', language)} →
              </button>
            </div>
          )}

          {/* Post-test result */}
          {postResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {postResult.dimensionScores ? (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {Object.entries(postResult.dimensionScores).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-j-text-tertiary uppercase">{key}</span>
                          <span className="text-[10px]">
                            {[0, 1].map((dotIndex) => (
                              <span
                                key={dotIndex}
                                className={dotIndex < value ? 'text-j-accent' : 'text-j-border-input'}
                              >
                                {dotIndex < value ? '●' : '○'}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span
                      className={`font-mono text-[10px] tracking-[0.15em] uppercase ${postResult.isCorrect ? 'text-j-accent' : 'text-j-error'}`}
                    >
                      {postResult.score}% · {postResult.isCorrect
                        ? t('review.correct', language)
                        : t('review.incorrect', language)}
                    </span>
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-2xl font-light ${postResult.isCorrect ? 'text-j-accent' : 'text-j-error'}`}
                    >
                      {postResult.score}%
                    </span>
                    <span
                      className={`font-mono text-[10px] tracking-[0.15em] uppercase ${postResult.isCorrect ? 'text-j-accent' : 'text-j-error'}`}
                    >
                      {postResult.isCorrect
                        ? t('review.correct', language)
                        : t('review.incorrect', language)}
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm text-j-text-secondary leading-relaxed">
                {postResult.feedback}
              </p>

              {!postResult.isCorrect && (
                <div className="border border-j-border p-3 bg-j-bg-white">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                    {t('review.expectedAnswer', language)}
                  </p>
                  <p className="text-sm text-j-text">
                    {postResult.expectedAnswer}
                  </p>
                </div>
              )}

              {/* TODO: Confidence + SelfExplanation disabled — users skip them
              <ConfidenceIndicator
                language={language}
                onSelect={handleConfidence}
                selected={postConfidence}
              />
              <SelfExplanation
                language={language}
                conceptName={section.sectionTitle}
                initialValue={selfExplanation}
                onSave={handleSelfExplanation}
                required
                minLength={postResult && postResult.score < 80 ? 50 : 30}
                onValidChange={setSelfExplanationValid}
                postTestScore={postResult?.score}
                postTestCorrect={postResult?.isCorrect}
              />
              */}

              <button
                onClick={handleComplete}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-5 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('learn.section.next', language)} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
