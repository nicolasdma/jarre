'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SectionContent } from './section-content';
import { t, type Language } from '@/lib/translations';
import type { ReviewSubmitResponse, InlineQuiz } from '@/types';
import type { FigureRegistry } from '@/lib/figure-registry';
import type { SectionState } from '@/lib/learn-progress';

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
  initialState?: SectionState;
  onStateChange?: (state: SectionState) => void;
  figureRegistry?: FigureRegistry;
  inlineQuizzes?: InlineQuiz[];
}

type Phase = 'pre-question' | 'content' | 'post-test' | 'completed';

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
  initialState,
  onStateChange,
  figureRegistry,
  inlineQuizzes,
}: ConceptSectionProps) {
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
      ? { score: initialState.postScore, isCorrect: initialState.postIsCorrect ?? false, feedback: '', expectedAnswer: '', rating: 'easy', nextReviewAt: '', intervalDays: 0 }
      : null
  );
  const [postError, setPostError] = useState<string | null>(null);

  // Restore completed sections on mount: if saved as 'completed', notify parent
  const restoredRef = useRef(false);
  useEffect(() => {
    if (initialState?.phase === 'completed' && !restoredRef.current) {
      restoredRef.current = true;
      onComplete();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch a question for the concept
  const fetchQuestion = useCallback(
    async (exclude?: string): Promise<QuestionData | null> => {
      const params = new URLSearchParams();
      params.set('concepts', section.conceptId);
      if (exclude) params.set('exclude', exclude);

      const res = await fetch(`/api/review/random?${params.toString()}`);
      if (!res.ok) return null;
      return res.json();
    },
    [section.conceptId]
  );

  // Load pre-question on first render (if active)
  const loadPreQuestion = useCallback(async () => {
    if (preQuestion || preLoading) return;
    setPreLoading(true);
    const q = await fetchQuestion();
    setPreQuestion(q);
    setPreLoading(false);
  }, [preQuestion, preLoading, fetchQuestion]);

  // Start loading when this section becomes active
  if (isActive && !preQuestion && !preLoading && !preAttempted) {
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

  // Move to post-test
  const handleContentDone = useCallback(async () => {
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
      });
    } catch (err) {
      setPostError((err as Error).message);
      setPostLoading(null);
    }
  }, [postAnswer, postQuestion, onStateChange, preAnswer, preAttempted]);

  // Complete section
  const handleComplete = () => {
    setPhase('completed');
    onStateChange?.({
      phase: 'completed',
      preAnswer,
      preAttempted,
      postScore: postResult?.score,
      postIsCorrect: postResult?.isCorrect,
    });
    onComplete();
  };

  if (!isActive && phase !== 'completed') {
    // Collapsed view
    return (
      <div className="border-l-2 border-[#e8e6e0] pl-6 py-4 opacity-50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
            {String(section.sortOrder + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-[#7a7a6e]">{section.sectionTitle}</span>
        </div>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="border-l-2 border-[#4a5d4a] pl-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#4a5d4a] uppercase">
            ✓ {section.sectionTitle}
          </span>
          {postResult && (
            <span
              className={`font-mono text-[10px] ${postResult.isCorrect ? 'text-[#4a5d4a]' : 'text-[#9c9a8e]'}`}
            >
              {postResult.score}%
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-[#4a5d4a] pl-6 py-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[#4a5d4a] uppercase font-medium">
          {String(section.sortOrder + 1).padStart(2, '0')}
        </span>
        <span className="text-sm font-medium text-[#2c2c2c]">
          {section.sectionTitle}
        </span>
      </div>

      {/* Phase: Pre-question (productive failure) */}
      {phase === 'pre-question' && (
        <div className="bg-[#f5f4f0] border border-[#e8e6e0] p-6 mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-3">
            {t('learn.preQuestion.title', language)}
          </p>
          <p className="text-xs text-[#9c9a8e] mb-4">
            {t('learn.preQuestion.instruction', language)}
          </p>

          {preLoading && (
            <p className="text-sm text-[#9c9a8e]">{t('common.loading', language)}</p>
          )}

          {preQuestion && (
            <div className="space-y-3">
              <p className="text-sm text-[#2c2c2c] leading-relaxed">
                {preQuestion.questionText}
              </p>

              <textarea
                value={preAnswer}
                onChange={(e) => setPreAnswer(e.target.value)}
                placeholder={t('review.answerPlaceholder', language)}
                rows={3}
                className="w-full border border-[#d4d0c8] bg-white p-3 text-sm text-[#2c2c2c] placeholder-[#9c9a8e] focus:outline-none focus:border-[#4a5d4a] resize-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handlePreSubmit();
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={handlePreSubmit}
                  disabled={!preAnswer.trim()}
                  className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
                >
                  {t('learn.preQuestion.submit', language)}
                </button>
                <button
                  onClick={skipToContent}
                  className="font-mono text-[10px] tracking-[0.15em] border border-[#d4d0c8] text-[#7a7a6e] px-3 py-2 uppercase hover:border-[#4a5d4a] transition-colors"
                >
                  {t('learn.preQuestion.skip', language)}
                </button>
              </div>
            </div>
          )}

          {!preLoading && !preQuestion && (
            <div>
              <p className="text-xs text-[#9c9a8e] mb-3">
                No hay preguntas disponibles para este concepto.
              </p>
              <button
                onClick={skipToContent}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('learn.preQuestion.skip', language)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase: Content (reading) */}
      {(phase === 'content' || phase === 'post-test') && (
        <div className="mb-6">
          {preAttempted && preAnswer.trim() && (
            <div className="bg-[#f5f4f0] border border-[#e8e6e0] p-3 mb-6 text-xs text-[#9c9a8e]">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#c4a07a]">
                {t('learn.preQuestion.attempted', language)}
              </span>
              <span className="ml-2">— lee la sección y compara con tu respuesta.</span>
            </div>
          )}

          <SectionContent
            markdown={section.contentMarkdown}
            conceptId={section.conceptId}
            sectionIndex={section.sortOrder}
            figures={figureRegistry}
            inlineQuizzes={inlineQuizzes}
          />

          {phase === 'content' && (
            <div className="mt-8 pt-6 border-t border-[#e8e6e0]">
              <button
                onClick={handleContentDone}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-5 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('learn.postTest.title', language)} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase: Post-test (retrieval practice) */}
      {phase === 'post-test' && (
        <div className="bg-[#f5f4f0] border border-[#e8e6e0] p-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#4a5d4a] uppercase mb-4">
            {t('learn.postTest.title', language)}
          </p>

          {postLoading === 'fetching' && (
            <p className="text-sm text-[#9c9a8e]">{t('common.loading', language)}</p>
          )}

          {postQuestion && !postResult && (
            <div className="space-y-3">
              <p className="text-sm text-[#2c2c2c] leading-relaxed">
                {postQuestion.questionText}
              </p>

              <textarea
                value={postAnswer}
                onChange={(e) => setPostAnswer(e.target.value)}
                placeholder={t('review.answerPlaceholder', language)}
                rows={3}
                className="w-full border border-[#d4d0c8] bg-white p-3 text-sm text-[#2c2c2c] placeholder-[#9c9a8e] focus:outline-none focus:border-[#4a5d4a] resize-none"
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
                  className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
                >
                  {postLoading === 'evaluating'
                    ? t('review.evaluating', language)
                    : t('review.verify', language)}
                </button>
                <button
                  onClick={handleComplete}
                  className="font-mono text-[10px] tracking-[0.15em] border border-[#d4d0c8] text-[#7a7a6e] px-3 py-2 uppercase hover:border-[#4a5d4a] transition-colors"
                >
                  {language === 'es' ? 'Saltar' : 'Skip'}
                </button>
              </div>

              {postError && <p className="text-xs text-[#7d6b6b]">{postError}</p>}
            </div>
          )}

          {!postLoading && !postQuestion && (
            <div>
              <p className="text-xs text-[#9c9a8e] mb-3">
                No hay preguntas disponibles para este concepto.
              </p>
              <button
                onClick={handleComplete}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('learn.section.next', language)} →
              </button>
            </div>
          )}

          {/* Post-test result */}
          {postResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-2xl font-light ${postResult.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'}`}
                >
                  {postResult.score}%
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.15em] uppercase ${postResult.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'}`}
                >
                  {postResult.isCorrect
                    ? t('review.correct', language)
                    : t('review.incorrect', language)}
                </span>
              </div>

              <p className="text-sm text-[#7a7a6e] leading-relaxed">
                {postResult.feedback}
              </p>

              {!postResult.isCorrect && (
                <div className="border border-[#e8e6e0] p-3 bg-white">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-1">
                    {t('review.expectedAnswer', language)}
                  </p>
                  <p className="text-sm text-[#2c2c2c]">
                    {postResult.expectedAnswer}
                  </p>
                </div>
              )}

              <button
                onClick={handleComplete}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-5 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
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
