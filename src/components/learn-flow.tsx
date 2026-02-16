'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationFlow } from '@/app/evaluate/[resourceId]/evaluation-flow';
import { ConceptSection } from './concept-section';
import { SectionLabel } from '@/components/ui/section-label';
import { ScrollProgress } from './scroll-progress';
import { LearnTOC } from './learn-toc';
import { t, type Language } from '@/lib/translations';
import type { ReadingQuestion } from '@/app/learn/[resourceId]/reading-questions';
import { PracticeEvalStep } from './practice-eval-step';
import { saveLearnProgress, type LearnProgress, type SectionState, type PracticeEvalState } from '@/lib/learn-progress';
import { WhisperProvider } from '@/lib/whisper/whisper-context';
import { WhisperToggle } from './whisper-toggle';
import { VoiceToggle } from './voice/voice-toggle';
import { VoicePanel } from './voice/voice-panel';
import type { FigureRegistry } from '@/lib/figure-registry';
import type { InlineQuiz } from '@/types';
import { getExercisesForConcept } from '@/lib/exercises/registry';

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

type Step = 'activate' | 'learn' | 'practice-eval' | 'apply' | 'evaluate';

interface EvalConcept {
  id: string;
  name: string;
  canonical_definition: string;
}

interface LearnFlowProps {
  language: Language;
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  sections: Section[];
  activateComponent: React.ReactNode;
  playgroundHref?: string;
  playgroundLabel?: string;
  concepts: EvalConcept[];
  userId: string;
  guidedQuestions?: ReadingQuestion[];
  initialProgress?: LearnProgress;
  figureRegistry?: FigureRegistry;
  quizzesBySectionId?: Record<string, InlineQuiz[]>;
}

// ============================================================================
// Step indicator labels
// ============================================================================

const STEP_ORDER: Step[] = ['activate', 'learn', 'apply', 'practice-eval', 'evaluate'];

const STEP_LABELS: Record<Step, { key: Parameters<typeof t>[0] }> = {
  activate: { key: 'learn.step.activate' },
  learn: { key: 'learn.step.learn' },
  'practice-eval': { key: 'learn.step.practiceEval' },
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
  resourceTitle,
  resourceType,
  sections,
  activateComponent,
  playgroundHref,
  playgroundLabel,
  concepts,
  userId,
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
  const [practiceEvalState, setPracticeEvalState] = useState<PracticeEvalState>(
    initialProgress?.practiceEvalState ?? { answers: {}, currentScaffoldLevel: 1 }
  );
  const [visitedSteps, setVisitedSteps] = useState<Set<Step>>(
    new Set((initialProgress?.visitedSteps as Step[]) ?? [(initialProgress?.currentStep as Step) ?? 'activate'])
  );

  // Voice companion panel
  const [voiceActive, setVoiceActive] = useState(false);

  // Focus mode: compress header on scroll > 200px during LEARN step
  const [isFocusMode, setIsFocusMode] = useState(false);
  useEffect(() => {
    if (currentStep !== 'learn') {
      setIsFocusMode(false);
      return;
    }
    const handleScroll = () => {
      setIsFocusMode(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentStep]);

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
      practiceEval: PracticeEvalState;
      visited: Set<Step>;
    }>): LearnProgress => ({
      currentStep: overrides?.step ?? currentStep,
      activeSection: overrides?.section ?? activeSection,
      completedSections: Array.from(overrides?.completed ?? completedSections),
      visitedSteps: Array.from(overrides?.visited ?? visitedSteps),
      sectionState: overrides?.state ?? sectionState,
      practiceEvalState: overrides?.practiceEval ?? practiceEvalState,
    }),
    [currentStep, activeSection, completedSections, visitedSteps, sectionState, practiceEvalState]
  );

  /** Persist + update step, marking current step as visited */
  const changeStep = useCallback(
    (step: Step) => {
      setVisitedSteps((prev) => {
        const next = new Set(prev);
        next.add(currentStep); // mark departing step as visited
        next.add(step);        // mark arriving step as visited
        setCurrentStep(step);
        saveLearnProgress(resourceId, buildProgress({ step, visited: next }));
        return next;
      });
    },
    [resourceId, buildProgress, currentStep]
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

  const navigateToSection = useCallback(
    (index: number) => {
      setActiveSection(index);
      saveLearnProgress(resourceId, buildProgress({ section: index }));
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
    <WhisperProvider activeStep={currentStep}>
    <div className="min-h-screen bg-j-bg">
      <ScrollProgress />

      {/* Sticky step navigator — compresses in focus mode during LEARN */}
      <div className={`sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm transition-all duration-300 ${
        isFocusMode ? 'py-0' : ''
      }`}>
        <div className={`mx-auto flex max-w-6xl items-center justify-between px-8 transition-all duration-300 ${
          isFocusMode ? 'py-2' : 'py-4'
        }`}>
          <Link
            href="/library"
            className={`text-j-text-tertiary hover:text-j-text transition-all duration-300 ${
              isFocusMode ? 'text-xs' : 'text-sm'
            }`}
          >
            ← {isFocusMode ? '' : t('learn.backToLibrary', language)}
          </Link>

          {/* Step indicators: visible sm-lg only (on lg+ the sidebar handles this) */}
          <div className="hidden sm:flex lg:hidden items-center gap-1">
            {STEP_ORDER.map((step, i) => {
              const isActive = step === currentStep;
              const isPast =
                STEP_ORDER.indexOf(step) < STEP_ORDER.indexOf(currentStep);

              return (
                <div key={step} className="flex items-center">
                  {i > 0 && (
                    <span className="text-j-border-dot mx-1.5">·</span>
                  )}
                  <button
                    onClick={() => changeStep(step)}
                    className={`font-mono text-[10px] tracking-[0.15em] uppercase transition-colors cursor-pointer ${
                      isActive
                        ? 'text-j-text font-medium'
                        : isPast
                          ? 'text-j-accent hover:text-j-text'
                          : 'text-j-text-tertiary hover:text-j-text-secondary'
                    }`}
                  >
                    {t(STEP_LABELS[step].key, language)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Whisper + Voice toggles */}
          <div className="flex items-center gap-2">
            <WhisperToggle language={language} />
            {currentStep === 'learn' && (
              <VoiceToggle
                language={language}
                isActive={voiceActive}
                onToggle={() => setVoiceActive((v) => !v)}
              />
            )}
          </div>

          {/* Right side: resource title + step info on desktop (lg+) */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="font-mono text-[10px] text-j-text-tertiary truncate max-w-[300px]">
              {resourceTitle}
            </span>
            <span className="text-j-border">·</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              {t(STEP_LABELS[currentStep].key, language)}
            </span>
            {currentStep === 'learn' && (
              <span className="font-mono text-[10px] text-j-text-tertiary">
                {activeSection + 1}/{sections.length}
              </span>
            )}
          </div>
          <div className="lg:hidden w-16" />
        </div>
      </div>

      {/* TOC sidebar (fixed, doesn't affect content flow) */}
      <LearnTOC
          language={language}
          sections={sections}
          activeSection={activeSection}
          completedSections={completedSections}
          currentStep={currentStep}
          visitedSteps={visitedSteps}
          onSectionClick={navigateToSection}
          onStepClick={(step) => changeStep(step)}
        />

      {/* STEP 3: PLAYGROUND — Full-width, no padding */}
      {currentStep === 'apply' && (
        <div className="lg:ml-[220px]">
          {playgroundHref ? (
            <iframe
              src={`${playgroundHref}?embed=1`}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 57px)' }}
              title={playgroundLabel || 'Playground'}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 57px)' }}>
              <div className="text-center">
                <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                  Playground
                </p>
                <p className="text-sm text-j-text-secondary">
                  {language === 'es'
                    ? 'No hay playground disponible para este recurso.'
                    : 'No playground available for this resource.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step content — centered on viewport, offset for annotations panel on xl+ */}
      <div className={`mx-auto max-w-3xl px-8 ${currentStep === 'apply' ? 'hidden' : ''}`}>
        {/* STEP 1: ACTIVATE — Advance organizer */}
        {currentStep === 'activate' && (
          <div>
            {activateComponent}

            {/* CTA to learn */}
            <div className="pb-16 text-center">
              <div className="border-t border-j-border pt-12">
                <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
                  {language === 'es' ? 'Siguiente paso' : 'Next step'}
                </p>
                <button
                  onClick={() => changeStep('learn')}
                  className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
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
            <header className="mb-12 lg:hidden">
              {/* Step label + nav arrows — hidden on lg+ where sidebar covers this */}
              <div className="flex items-center justify-between mb-4">
                <SectionLabel className="mb-0">
                  {t('learn.step.learn', language)}
                </SectionLabel>

                {/* Section nav arrows */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToSection(activeSection - 1)}
                    disabled={activeSection === 0}
                    className="font-mono text-sm text-j-text-tertiary hover:text-j-text transition-colors disabled:opacity-30 disabled:cursor-default"
                  >
                    ←
                  </button>
                  <span className="font-mono text-[10px] text-j-text-tertiary">
                    {activeSection + 1} {t('learn.section.of', language)}{' '}
                    {sections.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateToSection(activeSection + 1)}
                    disabled={activeSection === sections.length - 1}
                    className="font-mono text-sm text-j-text-tertiary hover:text-j-text transition-colors disabled:opacity-30 disabled:cursor-default"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Section progress */}
              <div className="flex items-center gap-2">
                {sections.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigateToSection(i)}
                    className={`h-1 flex-1 transition-colors cursor-pointer hover:opacity-80 ${
                      completedSections.has(i)
                        ? 'bg-j-accent'
                        : i === activeSection
                          ? 'bg-j-warm'
                          : 'bg-j-border'
                    }`}
                  />
                ))}
              </div>
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
                  onActivate={() => navigateToSection(i)}
                  initialState={sectionState[section.id]}
                  onStateChange={(state) =>
                    handleSectionStateChange(section.id, state)
                  }
                  figureRegistry={figureRegistry}
                  inlineQuizzes={quizzesBySectionId?.[section.id]}
                  exercises={getExercisesForConcept(section.conceptId)}
                />
              ))}
            </div>

            {/* CTA to Apply */}
            {allSectionsComplete && (
              <div className="mt-12 pt-12 border-t border-j-border text-center">
                <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                  {t('learn.section.complete', language)}
                </p>
                <p className="text-sm text-j-text-secondary mb-6">
                  {language === 'es'
                    ? 'Has completado todas las secciones de este capítulo.'
                    : 'You have completed all sections in this chapter.'}
                </p>
                <button
                  onClick={() => changeStep('apply')}
                  className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
                >
                  {t('learn.continueToApply', language)} →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PRACTICE EVAL — Scaffolded evaluation preview */}
        {currentStep === 'practice-eval' && (
          <PracticeEvalStep
            language={language}
            resourceId={resourceId}
            conceptIds={sections.map((s) => s.conceptId)}
            initialState={practiceEvalState}
            onStateChange={(next) => {
              setPracticeEvalState(next);
              saveLearnProgress(resourceId, buildProgress({ practiceEval: next }));
            }}
            onComplete={() => changeStep('evaluate')}
          />
        )}

        {/* STEP 5: EVALUATE — Embedded evaluation flow */}
        {currentStep === 'evaluate' && (
          <div className="py-16">
            <EvaluationFlow
              resource={{ id: resourceId, title: resourceTitle, type: resourceType }}
              concepts={concepts}
              userId={userId}
              language={language}
              onCancel={() => changeStep('practice-eval')}
            />
          </div>
        )}
      </div>
    </div>

      {/* Voice companion panel */}
      {voiceActive && currentStep === 'learn' && sections[activeSection] && (
        <VoicePanel
          sectionContent={sections[activeSection].contentMarkdown}
          sectionTitle={sections[activeSection].sectionTitle}
          language={language}
          onClose={() => setVoiceActive(false)}
        />
      )}
    </WhisperProvider>
  );
}
