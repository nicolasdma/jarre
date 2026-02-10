'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ConceptSection } from './concept-section';
import { t, type Language } from '@/lib/translations';
import type { ReadingQuestion } from '@/app/learn/[resourceId]/reading-questions';
import { saveLearnProgress, type LearnProgress, type SectionState } from '@/lib/learn-progress';
import type { FigureRegistry } from '@/lib/figure-registry';
import type { InlineQuiz } from '@/types';

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

type Step = 'activate' | 'learn' | 'apply' | 'evaluate';

interface LearnFlowProps {
  language: Language;
  resourceId: string;
  sections: Section[];
  activateComponent: React.ReactNode;
  playgroundHref?: string;
  playgroundLabel?: string;
  evaluateHref: string;
  guidedQuestions?: ReadingQuestion[];
  initialProgress?: LearnProgress;
  figureRegistry?: FigureRegistry;
  quizzesBySectionId?: Record<string, InlineQuiz[]>;
}

// ============================================================================
// Step indicator labels
// ============================================================================

const STEP_ORDER: Step[] = ['activate', 'learn', 'apply', 'evaluate'];

const STEP_LABELS: Record<Step, { key: Parameters<typeof t>[0] }> = {
  activate: { key: 'learn.step.activate' },
  learn: { key: 'learn.step.learn' },
  apply: { key: 'learn.step.apply' },
  evaluate: { key: 'learn.step.evaluate' },
};

// Question type labels/colors (duplicated from reading-questions to avoid circular dependency)
const Q_TYPE_LABELS: Record<string, string> = {
  tradeoff: 'Trade-off',
  why: 'Por qué',
  connection: 'Conexión',
  error_detection: 'Detección de Error',
  design_decision: 'Decisión de Diseño',
};

const Q_TYPE_COLORS: Record<string, string> = {
  tradeoff: 'bg-amber-50 text-amber-700',
  why: 'bg-blue-50 text-blue-700',
  connection: 'bg-purple-50 text-purple-700',
  error_detection: 'bg-red-50 text-red-700',
  design_decision: 'bg-green-50 text-green-700',
};

// ============================================================================
// Component
// ============================================================================

export function LearnFlow({
  language,
  resourceId,
  sections,
  activateComponent,
  playgroundHref,
  playgroundLabel,
  evaluateHref,
  guidedQuestions,
  initialProgress,
  figureRegistry,
  quizzesBySectionId,
}: LearnFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    (initialProgress?.currentStep as Step) ?? 'activate'
  );
  const [activeSection, setActiveSection] = useState(
    initialProgress?.activeSection ?? 0
  );
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set(initialProgress?.completedSections ?? [])
  );
  const [sectionState, setSectionState] = useState<Record<string, SectionState>>(
    initialProgress?.sectionState ?? {}
  );

  const allSectionsComplete = useMemo(
    () => sections.every((_, i) => completedSections.has(i)),
    [completedSections, sections]
  );

  /** Build the current progress snapshot for persistence */
  const buildProgress = useCallback(
    (overrides?: Partial<{
      step: Step;
      section: number;
      completed: Set<number>;
      state: Record<string, SectionState>;
    }>): LearnProgress => ({
      currentStep: overrides?.step ?? currentStep,
      activeSection: overrides?.section ?? activeSection,
      completedSections: Array.from(overrides?.completed ?? completedSections),
      sectionState: overrides?.state ?? sectionState,
    }),
    [currentStep, activeSection, completedSections, sectionState]
  );

  /** Persist + update step */
  const changeStep = useCallback(
    (step: Step) => {
      setCurrentStep(step);
      saveLearnProgress(resourceId, buildProgress({ step }));
    },
    [resourceId, buildProgress]
  );

  /** Called by ConceptSection when its state changes */
  const handleSectionStateChange = useCallback(
    (conceptId: string, state: SectionState) => {
      setSectionState((prev) => {
        const next = { ...prev, [conceptId]: state };
        // Fire-and-forget save with the new section state
        saveLearnProgress(resourceId, buildProgress({ state: next }));
        return next;
      });
    },
    [resourceId, buildProgress]
  );

  const handleSectionComplete = (index: number) => {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      next.add(index);

      const nextActiveSection =
        index < sections.length - 1 ? index + 1 : activeSection;
      setActiveSection(nextActiveSection);

      saveLearnProgress(
        resourceId,
        buildProgress({ completed: next, section: nextActiveSection })
      );
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Sticky step navigator */}
      <div className="sticky top-0 z-50 border-b border-[#e8e6e0] bg-[#faf9f6]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link
            href="/library"
            className="text-sm text-[#9c9a8e] hover:text-[#2c2c2c] transition-colors"
          >
            ← {t('learn.backToLibrary', language)}
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEP_ORDER.map((step, i) => {
              const isActive = step === currentStep;
              const isPast =
                STEP_ORDER.indexOf(step) < STEP_ORDER.indexOf(currentStep);

              return (
                <div key={step} className="flex items-center">
                  {i > 0 && (
                    <span className="text-[#d4d2cc] mx-1.5">·</span>
                  )}
                  <button
                    onClick={() => {
                      // Only allow going back or to already-reached steps
                      if (isPast || isActive) changeStep(step);
                      // Allow jumping to apply if all learn sections done
                      if (step === 'apply' && allSectionsComplete)
                        changeStep(step);
                    }}
                    className={`font-mono text-[10px] tracking-[0.15em] uppercase transition-colors ${
                      isActive
                        ? 'text-[#2c2c2c] font-medium'
                        : isPast
                          ? 'text-[#4a5d4a] hover:text-[#2c2c2c] cursor-pointer'
                          : 'text-[#d4d2cc]'
                    }`}
                  >
                    {t(STEP_LABELS[step].key, language)}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="w-16" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-8">
        {/* STEP 1: ACTIVATE — Advance organizer */}
        {currentStep === 'activate' && (
          <div>
            {activateComponent}

            {/* CTA to start learning */}
            <div className="pb-16 text-center">
              <div className="border-t border-[#e8e6e0] pt-12">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
                  {language === 'es' ? 'Siguiente paso' : 'Next step'}
                </p>
                <button
                  onClick={() => changeStep('learn')}
                  className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
                >
                  {t('learn.step.learn', language)} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LEARN — Concept sections with pre-q + content + post-test */}
        {currentStep === 'learn' && (
          <div className="py-16">
            <header className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-[#4a5d4a]" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
                  {t('learn.step.learn', language)}
                </span>
              </div>

              {/* Section progress */}
              <div className="flex items-center gap-2 mb-4">
                {sections.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 transition-colors ${
                      completedSections.has(i)
                        ? 'bg-[#4a5d4a]'
                        : i === activeSection
                          ? 'bg-[#c4a07a]'
                          : 'bg-[#e8e6e0]'
                    }`}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] text-[#9c9a8e]">
                {completedSections.size} {t('learn.section.of', language)}{' '}
                {sections.length}
              </p>
            </header>

            {/* Concept sections */}
            <div className="space-y-4">
              {sections.map((section, i) => (
                <ConceptSection
                  key={section.id}
                  section={section}
                  language={language}
                  isActive={i === activeSection}
                  onComplete={() => handleSectionComplete(i)}
                  initialState={sectionState[section.conceptId]}
                  onStateChange={(state) =>
                    handleSectionStateChange(section.conceptId, state)
                  }
                  figureRegistry={figureRegistry}
                  inlineQuizzes={quizzesBySectionId?.[section.id]}
                />
              ))}
            </div>

            {/* CTA to Apply */}
            {allSectionsComplete && (
              <div className="mt-12 pt-12 border-t border-[#e8e6e0] text-center">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-2">
                  {t('learn.section.complete', language)}
                </p>
                <p className="text-sm text-[#7a7a6e] mb-6">
                  {language === 'es'
                    ? 'Has completado todas las secciones de este capítulo.'
                    : 'You have completed all sections in this chapter.'}
                </p>
                <button
                  onClick={() => changeStep('apply')}
                  className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
                >
                  {t('learn.continueToApply', language)} →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: APPLY — Playground + Guided Questions */}
        {currentStep === 'apply' && (
          <div className="py-16">
            <header className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-px bg-[#4a5d4a]" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
                  {t('learn.step.apply', language)}
                </span>
              </div>
            </header>

            {/* Playground link */}
            {playgroundHref && (
              <div className="border border-[#e8e6e0] p-8 mb-8 text-center">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
                  {language === 'es'
                    ? 'Experimenta con el concepto'
                    : 'Experiment with the concept'}
                </p>
                <Link
                  href={playgroundHref}
                  className="inline-block font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
                >
                  {playgroundLabel || 'Playground'} →
                </Link>
              </div>
            )}

            {/* Guided Questions */}
            {guidedQuestions && guidedQuestions.length > 0 && (
              <div>
                <h2 className="text-xl font-light text-[#2c2c2c] mb-2">
                  {t('learn.guidedQuestions', language)}
                </h2>
                <p className="text-sm text-[#7a7a6e] mb-8">
                  {t('learn.guidedQuestionsDesc', language)}
                </p>

                <div className="space-y-6">
                  {guidedQuestions.map((q, i) => (
                    <section
                      key={i}
                      className="border-l-2 border-[#e8e6e0] pl-6 py-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-mono text-xs text-[#9c9a8e]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded ${Q_TYPE_COLORS[q.type] || ''}`}
                        >
                          {Q_TYPE_LABELS[q.type] || q.type}
                        </span>
                      </div>

                      <p className="text-[#2c2c2c] leading-relaxed mb-3">
                        {q.question}
                      </p>

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-mono text-[10px] tracking-[0.1em] text-[#9c9a8e] uppercase">
                          {language === 'es' ? 'Concepto' : 'Concept'}:{' '}
                          {q.concept}
                        </span>
                        {q.hint && (
                          <span className="text-xs text-[#b0a890] italic">
                            {language === 'es' ? 'Pista' : 'Hint'}: {q.hint}
                          </span>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}

            {/* CTA to Evaluate */}
            <div className="mt-12 pt-12 border-t border-[#e8e6e0] text-center">
              <button
                onClick={() => changeStep('evaluate')}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('learn.continueToEvaluate', language)} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVALUATE — Link to full evaluation */}
        {currentStep === 'evaluate' && (
          <div className="py-16">
            <header className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-px bg-[#4a5d4a]" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
                  {t('learn.step.evaluate', language)}
                </span>
              </div>
            </header>

            <div className="border border-[#e8e6e0] p-8 text-center">
              <h2 className="text-xl font-light text-[#2c2c2c] mb-4">
                {language === 'es'
                  ? 'Evaluación Completa'
                  : 'Full Evaluation'}
              </h2>
              <p className="text-sm text-[#7a7a6e] mb-6 max-w-md mx-auto">
                {language === 'es'
                  ? 'Pon a prueba tu comprensión profunda con preguntas de transfer, trade-offs y detección de errores. Si obtienes ≥60%, avanzas al nivel 1 de dominio.'
                  : 'Test your deep understanding with transfer, trade-off, and error detection questions. Score ≥60% to advance to mastery level 1.'}
              </p>
              <Link
                href={evaluateHref}
                className="inline-block font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('learn.step.evaluate', language)} →
              </Link>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/library"
                className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] hover:text-[#2c2c2c] uppercase transition-colors"
              >
                ← {t('learn.backToLibrary', language)}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
