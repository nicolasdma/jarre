'use client';

import { useState, useMemo, useCallback, useEffect, memo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { InterviewMode } from '@/components/practice/interview-mode';
import { CodingProvider, useCoding } from '@/components/coding/coding-context';
import { CodingMock } from '@/components/coding/coding-mock';
import { SectionExercises } from '@/components/coding/section-exercises';
import { CodeTabsProvider } from '@/components/coding/code-tabs-context';
import { parseCodingConfig } from '@/lib/coding/format';
import { lessonHasCodeTabs } from '@/lib/lessons/code-tabs';
import {
  LessonPracticeProvider,
  PracticeNav,
  PracticeStep,
  SectionDrills,
  useLessonPractice,
  usePracticeProgress,
} from '@/components/practice/lesson-practice';
import { drillModeFromParam, type PracticeDrill } from '@/components/practice/types';
import { keyTermsFromInterview } from '@/lib/practice/key-terms';
import { drillAsksFromInterview } from '@/lib/practice/recall';
import { EvaluationFlow } from '@/app/evaluate/[resourceId]/evaluation-flow';
import { VoiceEvaluationFlow } from '@/components/voice/voice-evaluation-flow';
import { VoicePracticeFlow } from '@/components/voice/voice-practice-flow';
import type { PracticeResult } from '@/components/voice/use-unified-voice-session';
import { ConceptSection } from './concept-section';
import { SectionLabel } from '@/components/ui/section-label';
import { ScrollProgress } from './scroll-progress';
import type { ActivateSummary } from '@/lib/lessons/activate-summary';
import { Hint } from '@/components/help/first-time';
import { IntroCard } from '@/components/onboarding/intro-card';
import { LearnTOC } from './learn-toc';
import { t, type Language } from '@/lib/translations';
import type { ReadingQuestion } from '@/app/learn/[resourceId]/reading-questions';
import { PracticeEvalStep } from './practice-eval-step';
import { saveLearnProgress, type LearnProgress, type SectionState, type PracticeEvalState } from '@/lib/learn-progress';
import { WhisperProvider } from '@/lib/whisper/whisper-context';
import { useTutorContext } from '@/lib/tutor-context';
import type { VoiceMode } from '@/lib/llm/voice-unified-prompt';
import { createLogger } from '@/lib/logger';
import { WhisperToggle } from './whisper-toggle';
import { extractYoutubeId } from '@/lib/utils/youtube';

const log = createLogger('LearnFlow');
import type { FigureRegistry } from '@/lib/figure-registry';
import type { InlineQuiz, VideoSegment, Exercise } from '@/types';
import { getExercisesForConcept } from '@/lib/exercises/registry';
import { StickyVideoPlayer } from './sticky-video-player';
import { VideoSeekProvider } from '@/lib/video-seek-context';

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

type Step = 'activate' | 'learn' | 'practice-eval' | 'apply' | 'evaluate' | 'interview' | 'coding';

const STEP_TO_TUTOR_MODE: Record<Step, VoiceMode> = {
  activate: 'freeform',
  learn: 'learning',
  apply: 'learning',
  'practice-eval': 'practice',
  evaluate: 'eval',
  // The interview runs its own voice session in the step itself.
  interview: 'freeform',
  coding: 'freeform',
};

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
  resourceUrl?: string | null;
  sections: Section[];
  activateComponent: React.ReactNode;
  /**
   * The lesson's own overview (resources.activate_data, lesson JSON `activate`):
   * what a lesson without a hand-made chapter shows on its first screen.
   */
  activateSummary?: ActivateSummary | null;
  playgroundHref?: string;
  playgroundLabel?: string;
  /**
   * Lessons with spoken-English drills: drills under each section, a Practice
   * step (APPLY) with every drill and mode, and the interview mock as the last
   * step, all in this view.
   */
  practice?: { drills: PracticeDrill[]; interviewConfig: unknown };
  concepts: EvalConcept[];
  userId: string;
  guidedQuestions?: ReadingQuestion[];
  initialProgress?: LearnProgress;
  figureRegistry?: FigureRegistry;
  quizzesBySectionId?: Record<string, InlineQuiz[]>;
  videoSegmentsBySectionId?: Record<string, VideoSegment[]>;
}

// ============================================================================
// Step indicator labels
// ============================================================================

/**
 * A lesson is three stops: Entender ('learn'), Decirlo ('apply': the phrases,
 * or the playground in a lesson without them) and Ensayar ('practice-eval').
 * The cover ('activate') opens a new lesson and comes back from its title.
 * Ensayar holds the ways to rehearse, each still its own step (so saved
 * progress and links keep working): the voice tutor ('practice-eval', first),
 * the mock ('interview', 'coding') and the voice evaluation ('evaluate').
 */
const REHEARSE_STEPS: readonly Step[] = ['practice-eval', 'interview', 'coding', 'evaluate'];

/** The stop a step belongs to, for the navigation. */
function stopOf(step: Step): Step {
  return REHEARSE_STEPS.includes(step) ? 'practice-eval' : step;
}

const STEP_LABELS: Record<Step, { key: Parameters<typeof t>[0] }> = {
  activate: { key: 'learn.step.activate' },
  learn: { key: 'learn.step.learn' },
  'practice-eval': { key: 'learn.step.practiceEval' },
  apply: { key: 'learn.step.apply' },
  evaluate: { key: 'learn.step.evaluate' },
  interview: { key: 'learn.step.interview' },
  coding: { key: 'learn.step.coding' },
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
// ConceptSection wrapper — stabilizes callbacks to prevent re-renders
// ============================================================================

interface ConceptSectionWrapperProps {
  section: Section;
  index: number;
  language: Language;
  activeSection: number;
  onComplete: (index: number) => void;
  onActivate: (index: number) => void;
  initialState?: SectionState;
  onStateChange: (conceptId: string, state: SectionState) => void;
  figureRegistry?: FigureRegistry;
  quizzesBySectionId?: Record<string, InlineQuiz[]>;
  videoSegmentsBySectionId?: Record<string, VideoSegment[]>;
  exercises?: Exercise[];
}

const ConceptSectionWrapper = memo(function ConceptSectionWrapper({
  section,
  index,
  language,
  activeSection,
  onComplete,
  onActivate,
  initialState,
  onStateChange,
  figureRegistry,
  quizzesBySectionId,
  videoSegmentsBySectionId,
  exercises,
}: ConceptSectionWrapperProps) {
  const handleComplete = useCallback(() => onComplete(index), [onComplete, index]);
  // Stable per concept, so the memoized section does not re-render on practice clicks.
  const drills = useMemo(
    () => (
      <>
        <SectionDrills conceptId={section.conceptId} />
        <SectionExercises conceptId={section.conceptId} />
      </>
    ),
    [section.conceptId],
  );
  const handleActivate = useCallback(() => onActivate(index), [onActivate, index]);
  const handleStateChange = useCallback(
    (state: SectionState) => onStateChange(section.id, state),
    [onStateChange, section.id]
  );

  return (
    <ConceptSection
      section={section}
      language={language}
      isActive={index === activeSection}
      onComplete={handleComplete}
      onActivate={handleActivate}
      initialState={initialState}
      onStateChange={handleStateChange}
      figureRegistry={figureRegistry}
      inlineQuizzes={quizzesBySectionId?.[section.id]}
      videoSegments={videoSegmentsBySectionId?.[section.id]}
      exercises={exercises}
      afterContent={drills}
      number={index + 1}
    />
  );
});

ConceptSectionWrapper.displayName = 'ConceptSectionWrapper';

// ============================================================================
// Sticky header — owns scroll state to avoid re-rendering siblings
// ============================================================================

interface StickyHeaderProps {
  language: Language;
  resourceId: string;
  currentStep: Step;
  resourceTitle: string;
  activeSection: number;
  sectionsCount: number;
  steps: Step[];
  stepLabels?: Partial<Record<Step, string>>;
  onStepChange: (step: Step) => void;
  onTocOpen: () => void;
  onCover: () => void;
}

function StickyHeader({
  language,
  resourceId,
  currentStep,
  resourceTitle,
  activeSection,
  sectionsCount,
  steps,
  stepLabels,
  onStepChange,
  onTocOpen,
  onCover,
}: StickyHeaderProps) {
  const [scrolledPast200, setScrolledPast200] = useState(false);

  useEffect(() => {
    if (currentStep !== 'learn') {
      setScrolledPast200(false);
      return;
    }
    const handleScroll = () => {
      setScrolledPast200(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentStep]);

  const isFocusMode = currentStep === 'learn' && scrolledPast200;
  const label = (step: Step) => stepLabels?.[step] ?? t(STEP_LABELS[step].key, language);
  const stepNumber = steps.indexOf(currentStep) + 1;
  const stepPosition = [
    stepNumber > 0 ? (language === 'es' ? `Paso ${stepNumber} de ${steps.length}` : `Step ${stepNumber} of ${steps.length}`) : null,
    label(currentStep),
    currentStep === 'learn' && sectionsCount > 0
      ? language === 'es' ? `parte ${activeSection + 1} de ${sectionsCount}` : `part ${activeSection + 1} of ${sectionsCount}`
      : null,
  ].filter(Boolean).join(' · ');

  return (
    // Solid, not a 90% wash with backdrop blur: the blur was re-filtered on every scroll frame.
    <div className={`sticky top-0 z-50 border-b border-j-border bg-j-bg transition-all duration-300 ${
      isFocusMode ? 'py-0' : ''
    }`}>
      <div className={`mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8 transition-all duration-300 ${
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

        {/* Step indicators: visible sm-lg only */}
        <div className="hidden sm:flex lg:hidden items-center gap-1">
          {steps.map((step, i) => {
            const isActive = step === currentStep;
            const isPast =
              steps.indexOf(step) < steps.indexOf(currentStep);

            return (
              <div key={step} className="flex items-center">
                {i > 0 && (
                  <span className="text-j-border-dot mx-1.5">·</span>
                )}
                <button
                  onClick={() => onStepChange(step)}
                  className={`font-mono text-[10px] tracking-[0.15em] uppercase transition-colors cursor-pointer ${
                    isActive
                      ? 'text-j-text font-medium'
                      : isPast
                        ? 'text-j-accent hover:text-j-text'
                        : 'text-j-text-tertiary hover:text-j-text-secondary'
                  }`}
                >
                  {label(step)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Whisper toggle — disabled, feature toggled off */}
        {/* <WhisperToggle language={language} /> */}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Resource title + step info on desktop (lg+) */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={onCover}
              title={language === 'es' ? 'Ver la portada de la lección' : 'See the lesson cover'}
              className="font-mono text-[10px] text-j-text-tertiary truncate max-w-[300px] hover:text-j-text transition-colors"
            >
              {resourceTitle}
            </button>
            <span className="text-j-border">·</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              {label(currentStep)}
            </span>
            {currentStep === 'learn' && (
              <span className="font-mono text-[10px] text-j-text-tertiary">
                {language === 'es' ? `parte ${activeSection + 1} de ${sectionsCount}` : `part ${activeSection + 1} of ${sectionsCount}`}
              </span>
            )}
          </div>
          {/* The feed: the same lesson as a relaxed scroll of cards, on every screen. */}
          <Link
            href={`/learn/${encodeURIComponent(resourceId)}/feed`}
            className="flex min-h-[32px] items-center border border-j-border px-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-secondary transition-colors hover:border-j-text hover:text-j-text"
          >
            {t('learn.feedMode', language)}
          </Link>
          <button
            type="button"
            onClick={onTocOpen}
            className="lg:hidden flex min-h-[44px] items-center px-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-secondary transition-colors hover:text-j-text"
            aria-label={language === 'es' ? 'Abrir el índice' : 'Open the contents'}
          >
            {language === 'es' ? 'Índice' : 'Contents'}
          </button>
        </div>
      </div>

      {/* Below lg: the lesson and where you are in it (on lg the sidebar and the line above say it). */}
      {!isFocusMode && (
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-8 lg:hidden" data-testid="learn-position">
          <button
            type="button"
            onClick={onCover}
            className="block w-full truncate text-left text-sm font-medium text-j-text hover:text-j-accent"
          >
            {resourceTitle}
          </button>
          <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">
            {stepPosition}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Lesson summary — the first screen of a lesson without a hand-made chapter
// ============================================================================

/** "Empezar: Entender, parte 1", or "Seguir: …" back in a lesson already started. */
function startLabel(language: Language, resuming: boolean, part: number): string {
  const step = t('learn.step.learn', language);
  if (language === 'es') return `${resuming ? 'Seguir' : 'Empezar'}: ${step}, parte ${part}`;
  return `${resuming ? 'Continue' : 'Start'}: ${step}, part ${part}`;
}

/**
 * Ensayar: the ways to rehearse, as options with one line each, the voice
 * tutor first and marked as the one to start with. In a lesson with phrases
 * the voice evaluation goes under "Más".
 */
function RehearseChooser({
  language,
  current,
  options,
  presentation,
  onPick,
}: {
  language: Language;
  current: Step;
  options: Step[];
  presentation: boolean;
  onPick: (step: Step) => void;
}) {
  const es = language === 'es';
  const withMock = options.includes('interview');
  const copy: Partial<Record<Step, { title: string; line: string }>> = {
    'practice-eval': {
      title: es ? 'Con el tutor' : 'With the tutor',
      line: es ? 'Te pregunta, te ayuda si te trabás y te corrige en el momento. Unos 7 minutos.' : 'Asks you, helps when you get stuck and corrects you right away. About 7 minutes.',
    },
    interview: {
      title: presentation ? (es ? 'Simulacro de la presentación' : 'Rehearse the talk') : es ? 'Simulacro de la entrevista' : 'Mock interview',
      line: presentation
        ? es ? 'La presentás de corrido y después te hacen preguntas. Sin ayuda; al final, un informe escrito.' : 'You give it straight through, then questions. No help; a written report at the end.'
        : es ? 'Preguntas que no preparaste, como en la llamada real. Sin ayuda; al final, un informe escrito.' : 'Questions you did not prepare, like the real call. No help; a written report at the end.',
    },
    coding: {
      title: es ? 'Simulacro con código' : 'Live coding mock',
      line: es ? 'La ronda entera: un problema, vos codeás y explicás, y el informe al final.' : 'The whole round: a problem, you code and explain, and the report at the end.',
    },
    evaluate: {
      title: es ? 'Evaluación por voz' : 'Voice evaluation',
      line: es ? 'Una charla corta para medir qué te quedó. Queda guardada. Unos 10 minutos.' : 'A short talk to measure what stayed with you. It is saved. About 10 minutes.',
    },
  };
  // With phrases the evaluation is the extra; without them it is one of the two options.
  const main = options.filter((o) => !(withMock && o === 'evaluate'));
  const more = options.filter((o) => withMock && o === 'evaluate');

  return (
    <section aria-label={es ? 'Ensayar' : 'Rehearse'} data-testid="rehearse-chooser">
      <SectionLabel className="mb-4">{es ? 'Ensayar' : 'Rehearse'}</SectionLabel>
      <Hint id="ensayar" className="mb-4">
        {withMock
          ? es
            ? 'Empezá con el tutor: te ayuda mientras hablás. El simulacro es como el día real, sin ayuda. Podés hacer los dos, las veces que quieras.'
            : 'Start with the tutor: it helps while you talk. The mock is like the real day, with no help. Do both, as many times as you like.'
          : es
            ? 'Empezá con el tutor: te ayuda mientras hablás. La evaluación mide qué te quedó y queda guardada.'
            : 'Start with the tutor: it helps while you talk. The evaluation measures what stayed with you and is saved.'}
      </Hint>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={es ? 'Cómo ensayar' : 'How to rehearse'}>
        {main.map((step, i) => {
          const c = copy[step];
          if (!c) return null;
          const on = current === step;
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(step)}
              className={`min-h-[72px] border px-4 py-3 text-left transition-colors ${
                on ? 'border-j-accent bg-j-accent-light' : 'border-j-border-input hover:border-j-accent'
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-j-text">{c.title}</span>
                {i === 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-j-warm">{es ? 'recomendado' : 'recommended'}</span>
                )}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-j-text-secondary">{c.line}</span>
            </button>
          );
        })}
      </div>
      {more.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-j-text-tertiary">
          <span>{es ? 'Más:' : 'More:'}</span>
          {more.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onPick(step)}
              aria-current={current === step ? 'true' : undefined}
              className={`min-h-[44px] underline underline-offset-4 ${current === step ? 'text-j-accent' : 'text-j-text-secondary hover:text-j-text'}`}
            >
              {copy[step]?.title}
            </button>
          ))}
        </p>
      )}
    </section>
  );
}

function LessonSummary({ title, summary, language }: { title: string; summary: ActivateSummary | null; language: Language }) {
  const parts = summary?.sections ?? [];
  return (
    <section className="py-12 sm:py-16" data-testid="lesson-summary">
      <SectionLabel className="mb-4">{t('learn.step.activate', language)}</SectionLabel>
      <h1 className="mb-6 text-2xl font-bold leading-tight text-j-text sm:text-3xl">{title}</h1>
      <div className="space-y-4 text-base leading-relaxed text-j-text-body">
        {(summary?.summary ?? '').split(/\n{2,}/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      {parts.length > 0 && (
        <div className="mt-10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-j-text-tertiary">
            {language === 'es' ? `La lección, en ${parts.length} partes` : `The lesson, in ${parts.length} parts`}
          </p>
          <ol className="space-y-2">
            {parts.map((part) => (
              <li key={part.number} className="flex gap-3" title={part.description || undefined}>
                <span className="font-mono text-[11px] tabular-nums text-j-warm">{String(part.number).padStart(2, '0')}</span>
                <span className="min-w-0 text-sm text-j-text">{part.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Component
// ============================================================================

/** Steps a deep link can open: `?step=interview`, `?step=practice&drill=<slug>&mode=<mode>`. */
function stepFromParam(value: string | null): Step | null {
  if (value === 'practice' || value === 'drills') return 'apply';
  return value === 'activate' || value === 'learn' || value === 'apply' || value === 'practice-eval' || value === 'evaluate' || value === 'interview' || value === 'coding'
    ? value
    : null;
}

export function LearnFlow(props: LearnFlowProps) {
  const params = useSearchParams();
  const linkedStep = stepFromParam(params.get('step'));
  const linkedMode = params.get('mode');
  const interviewConfig = props.practice?.interviewConfig;
  const keyTerms = useMemo(() => keyTermsFromInterview(interviewConfig), [interviewConfig]);
  const asks = useMemo(() => drillAsksFromInterview(interviewConfig), [interviewConfig]);
  const coding = useMemo(() => parseCodingConfig(interviewConfig), [interviewConfig]);
  const codingDrills = useMemo(
    () => (props.practice?.drills ?? []).map((d) => ({ slug: d.slug, title: d.title, textEn: d.textEn })),
    [props.practice],
  );
  const flow = (
    <CodeTabsProvider enabled={lessonHasCodeTabs(props.resourceId)}>
      <LearnFlowInner {...props} linkedStep={linkedStep} />
    </CodeTabsProvider>
  );
  if (!props.practice?.drills.length) return flow;
  const withCoding = coding ? (
    <CodingProvider resourceId={props.resourceId} config={coding} drills={codingDrills}>
      {flow}
    </CodingProvider>
  ) : (
    flow
  );
  return (
    <LessonPracticeProvider
      resourceId={props.resourceId}
      drills={props.practice.drills}
      keyTerms={keyTerms}
      asks={asks}
      sections={props.sections.map((s) => ({ conceptId: s.conceptId, title: s.sectionTitle }))}
      initialSlug={params.get('drill')}
      initialMode={drillModeFromParam(linkedMode)}
    >
      {withCoding}
    </LessonPracticeProvider>
  );
}

function LearnFlowInner({
  language,
  resourceId,
  resourceTitle,
  resourceType,
  resourceUrl,
  sections,
  activateComponent,
  activateSummary,
  playgroundHref,
  playgroundLabel,
  practice: practiceData,
  linkedStep,
  concepts,
  userId,
  guidedQuestions,
  initialProgress,
  figureRegistry,
  quizzesBySectionId,
  videoSegmentsBySectionId,
}: LearnFlowProps & { linkedStep: Step | null }) {
  const practice = useLessonPractice();
  const practiceProgress = usePracticeProgress();
  const hasPractice = !!practice;
  const hasCoding = !!useCoding();
  // The stops in the navigation; a lesson without phrases has Decirlo only when it has a playground.
  const steps: Step[] = hasPractice || playgroundHref ? ['learn', 'apply', 'practice-eval'] : ['learn', 'practice-eval'];
  // The ways to rehearse this lesson: the mock only with phrases, the coding round only with code.
  const rehearseSteps: Step[] = hasPractice
    ? ['practice-eval', 'interview', ...(hasCoding ? (['coding'] as Step[]) : []), 'evaluate']
    : ['practice-eval', 'evaluate'];
  const isLessonStep = (step: Step) => step !== 'activate' && (steps.includes(step) || rehearseSteps.includes(step));
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    if (linkedStep && (linkedStep === 'activate' || isLessonStep(linkedStep))) return linkedStep;
    const saved = (initialProgress?.currentStep as Step) ?? 'activate';
    return saved === 'activate' || isLessonStep(saved) ? saved : 'practice-eval';
  });
  // Where "Seguir" on the cover goes: the last step worked on, none in a new lesson.
  const [lastStep, setLastStep] = useState<Step | null>(() => {
    const saved = initialProgress?.currentStep as Step | undefined;
    return saved && isLessonStep(saved) ? saved : null;
  });
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
  const [tocOpen, setTocOpen] = useState(false);

  // Sticky video player: extract videoId from first available segment
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubeVideoId = useMemo(() => {
    if (!videoSegmentsBySectionId) return null;
    for (const segments of Object.values(videoSegmentsBySectionId)) {
      if (segments.length > 0) return segments[0].youtubeVideoId;
    }
    return extractYoutubeId(resourceUrl ?? null);
  }, [videoSegmentsBySectionId, resourceUrl]);
  const allVideoSegments = useMemo(() => {
    if (!videoSegmentsBySectionId) return [];
    return Object.values(videoSegmentsBySectionId).flat();
  }, [videoSegmentsBySectionId]);

  // Announce tutor context for sidebar voice session
  const { setOverride } = useTutorContext();
  useEffect(() => {
    const tutorMode = STEP_TO_TUTOR_MODE[currentStep];
    log.info(`[TutorOverride] Setting override: mode=${tutorMode}, step=${currentStep}, resourceId=${resourceId}, concepts=${concepts.length}, title=${resourceTitle}`);
    setOverride({
      mode: tutorMode,
      resourceId,
      concepts: concepts.map((c) => ({
        id: c.id,
        name: c.name,
        definition: c.canonical_definition,
      })),
      resourceTitle,
      sectionId: sections[activeSection]?.id,
      sectionContent: sections[activeSection]?.contentMarkdown,
      sectionTitle: sections[activeSection]?.sectionTitle,
      lessonSections: sections.map((s) => ({ title: s.sectionTitle, content: s.contentMarkdown })),
    });
  }, [resourceId, concepts, resourceTitle, setOverride, currentStep, sections, activeSection]);

  // Clear override on unmount (separate effect to avoid re-running cleanup on step change)
  useEffect(() => {
    return () => {
      log.info('[TutorOverride] Clearing override (unmount)');
      setOverride(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Evaluation mode: voice (default) or text fallback
  const [evalMode, setEvalMode] = useState<'voice' | 'text'>('voice');

  // Practice mode: voice (default) or text fallback
  const [practiceMode, setPracticeMode] = useState<'voice' | 'text'>('voice');

  // Last persisted practice result
  const [lastPracticeResult, setLastPracticeResult] = useState<PracticeResult | null>(null);
  const [lastPracticeDate, setLastPracticeDate] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep !== 'practice-eval') return;
    fetch(`/api/voice/practice-result?resourceId=${resourceId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.practiceResult) {
          setLastPracticeResult(data.practiceResult);
          setLastPracticeDate(data.completedAt ?? null);
        }
      })
      .catch(() => {});
  }, [currentStep, resourceId]);

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
      if (step !== 'activate') setLastStep(step);
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

  // "Decirlo →" under a section's reading (and a coding exercise's "practice it") open that drill here.
  const setStepNavigator = practice?.setStepNavigator;
  useEffect(() => {
    if (!setStepNavigator) return;
    setStepNavigator(() => changeStep('apply'));
    return () => setStepNavigator(null);
  }, [setStepNavigator, changeStep]);

  // Keep the place in the URL, so a reload or a shared link opens the same step
  // (and, in Practice, the same drill and mode).
  const selectedDrill = practice?.selectedSlug ?? null;
  const drillMode = practice?.mode ?? null;
  useEffect(() => {
    if (!hasPractice) return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', currentStep === 'apply' ? 'practice' : currentStep);
    if (currentStep === 'apply' && selectedDrill && drillMode) {
      url.searchParams.set('drill', selectedDrill);
      url.searchParams.set('mode', drillMode);
    } else {
      url.searchParams.delete('drill');
      url.searchParams.delete('mode');
    }
    window.history.replaceState(null, '', url);
  }, [hasPractice, currentStep, selectedDrill, drillMode]);

  const interviewLesson = useMemo(
    () => ({
      title: resourceTitle,
      sections: sections.map((s) => ({ title: s.sectionTitle, content: s.contentMarkdown })),
      drills: (practiceData?.drills ?? []).map((d) => ({ slug: d.slug, title: d.title, text_en: d.textEn })),
    }),
    [resourceTitle, sections, practiceData],
  );
  // A presentation lesson (interview `mode: 'presentation'`) rehearses a talk, not a call.
  const isPresentation = (practiceData?.interviewConfig as { mode?: unknown } | null | undefined)?.mode === 'presentation';
  const stepLabels = useMemo<Partial<Record<Step, string>> | undefined>(
    () =>
      hasPractice
        ? {
            apply: t('learn.step.drills', language),
            ...(isPresentation ? { interview: language === 'es' ? 'Simulacro' : 'Rehearsal' } : {}),
          }
        : undefined,
    [hasPractice, language, isPresentation],
  );
  // After the tutor: the mock in a lesson with phrases, the voice evaluation otherwise.
  const afterTutor: Step = hasPractice ? 'interview' : 'evaluate';
  const afterTutorLabel =
    language === 'es'
      ? `Siguiente: ${hasPractice ? 'simulacro' : 'evaluación por voz'}`
      : `Next: ${hasPractice ? 'mock' : 'voice evaluation'}`;

  /** One line per step on the cover: how big it is and how far along. */
  const stepMeta = (step: Step): string => {
    const es = language === 'es';
    switch (step) {
      case 'learn': {
        const read = completedSections.size;
        const parts = es ? `${sections.length} ${sections.length === 1 ? 'parte' : 'partes'}` : `${sections.length} parts`;
        return read > 0 ? `${parts} · ${es ? `${read} leídas` : `${read} read`}` : parts;
      }
      case 'apply':
        if (!practiceProgress) return es ? 'Probalo en el playground' : 'Try it in the playground';
        return es
          ? `${practiceProgress.total} frases · ${practiceProgress.done} hechas`
          : `${practiceProgress.total} phrases · ${practiceProgress.done} done`;
      case 'practice-eval':
        return hasPractice
          ? es ? 'Con el tutor de voz, o un simulacro' : 'With the voice tutor, or a mock'
          : es ? 'Con el tutor de voz, o una evaluación' : 'With the voice tutor, or an evaluation';
      case 'evaluate':
        return es ? 'Una charla corta para medir · unos 10 min' : 'A short talk to measure · about 10 min';
      case 'interview':
        return es ? 'De corrido, sin ayuda, en inglés' : 'Straight through, no help, in English';
      case 'coding':
        return es ? 'La ronda entera, con código' : 'The whole round, with code';
      default:
        return '';
    }
  };
  const coverActionLabel = (() => {
    if (!lastStep) return startLabel(language, false, 1);
    if (lastStep === 'learn') return startLabel(language, true, activeSection + 1);
    const label = stepLabels?.[lastStep] ?? t(STEP_LABELS[lastStep].key, language);
    if (lastStep === 'apply' && practice && practiceProgress) {
      const order = practice.groups.flatMap((g) => g.drills);
      const at = Math.max(0, order.findIndex((d) => d.slug === practice.selectedSlug)) + 1;
      return language === 'es' ? `Seguir: ${label}, frase ${at} de ${order.length}` : `Continue: ${label}, phrase ${at} of ${order.length}`;
    }
    return `${language === 'es' ? 'Seguir' : 'Continue'}: ${label}`;
  })();
  const stepNotes = practiceProgress
    ? { apply: language === 'es' ? `${practiceProgress.done} de ${practiceProgress.total}` : `${practiceProgress.done} of ${practiceProgress.total}` }
    : undefined;

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

  const handleSectionComplete = useCallback(
    (index: number) => {
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
    },
    [sections.length, activeSection, resourceId, buildProgress]
  );

  return (
    <WhisperProvider activeStep={currentStep}>
    <div className="min-h-screen bg-j-bg">
      <ScrollProgress />

      {/* Sticky step navigator — owns its own scroll state */}
      <StickyHeader
        language={language}
        resourceId={resourceId}
        currentStep={stopOf(currentStep)}
        resourceTitle={resourceTitle}
        activeSection={activeSection}
        sectionsCount={sections.length}
        steps={steps}
        stepLabels={stepLabels}
        onStepChange={changeStep}
        onTocOpen={() => setTocOpen(true)}
        onCover={() => changeStep('activate')}
      />

      {/* TOC sidebar (fixed, doesn't affect content flow) */}
      <LearnTOC
          language={language}
          title={resourceTitle}
          sections={sections}
          activeSection={activeSection}
          completedSections={completedSections}
          currentStep={stopOf(currentStep)}
          visitedSteps={new Set([...visitedSteps].map(stopOf))}
          steps={steps}
          stepLabels={stepLabels}
          stepNotes={stepNotes}
          practiceNav={hasPractice ? <PracticeNav onPick={(slug) => practice?.select(slug)} /> : undefined}
          onSectionClick={navigateToSection}
          onStepClick={(step) => changeStep(step)}
          mobileOpen={tocOpen}
          onMobileOpenChange={setTocOpen}
        />

      {/* STEP 3: PLAYGROUND — Full-width, no padding (lessons with drills practice inline below) */}
      {currentStep === 'apply' && !hasPractice && (
        <div className="lg:ml-[220px]">
          {playgroundHref ? (
            <iframe
              src={`${playgroundHref}?embed=1`}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 57px)' }}
              title={playgroundLabel || 'Playground'}
              allow="microphone; autoplay"
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

      {/* ENSAYAR — the ways to rehearse, the tutor first; each opens below */}
      {rehearseSteps.includes(currentStep) && (
        <div className="max-w-3xl px-4 pt-12 sm:px-8 mx-auto lg:ml-[calc(50vw-274px)]">
          <RehearseChooser
            language={language}
            current={currentStep}
            options={rehearseSteps}
            presentation={isPresentation}
            onPick={changeStep}
          />
        </div>
      )}

      {/* LIVE CODING — the timed mock with the voice interviewer; wide: editor, problem and guide side by side */}
      {currentStep === 'coding' && hasCoding && (
        <div className="px-4 sm:px-8 lg:pl-[220px] lg:pr-0">
          <CodingMock
            resourceTitle={resourceTitle}
            onPracticeDrill={(slug) => {
              practice?.select(slug, 'repeat');
              changeStep('apply');
            }}
          />
        </div>
      )}

      {/* Step content — centered in the band to the right of the 220px fixed TOC (the right tutor panel was removed) */}
      <div className={`max-w-3xl px-4 sm:px-8 mx-auto lg:ml-[calc(50vw-274px)] ${currentStep === 'apply' && !hasPractice ? 'hidden' : ''}`}>
        {/* STEP 3 with drills: PRACTICE — every answer of the call, every mode */}
        {currentStep === 'apply' && hasPractice && (
          <PracticeStep presentation={isPresentation} onNext={() => changeStep('practice-eval')} />
        )}

        {/* STEP 6: INTERVIEW — the mock call, last: everything learned, out loud, in English */}
        {currentStep === 'interview' && hasPractice && (
          <div className="pt-10 pb-16">
            <InterviewMode
              resourceId={resourceId}
              resourceTitle={resourceTitle}
              lesson={interviewLesson}
              interviewConfig={practiceData?.interviewConfig ?? null}
              onPracticeDrill={(slug) => {
                practice?.select(slug, 'repeat');
                changeStep('apply');
              }}
            />
          </div>
        )}

        {/* STEP 1: ACTIVATE — Advance organizer */}
        {/* THE COVER — what the lesson is, its plan, and one button to start or go on */}
        {currentStep === 'activate' && (
          <div data-testid="lesson-cover">
            {activateComponent ?? (
              <LessonSummary title={resourceTitle} summary={activateSummary ?? null} language={language} />
            )}

            <div className="pb-16">
              <div className="border-t border-j-border pt-10">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-j-text-tertiary">
                  {language === 'es' ? 'Cómo sigue' : 'How it goes'}
                </p>
                <ol className="mb-10 divide-y divide-j-border border-y border-j-border" data-testid="lesson-plan">
                  {steps.map((step, i) => (
                    <li key={step}>
                      <button
                        type="button"
                        onClick={() => changeStep(step)}
                        className="flex min-h-[52px] w-full items-baseline gap-3 px-1 py-3 text-left transition-colors hover:bg-j-bg-alt"
                      >
                        <span className="font-mono text-[11px] tabular-nums text-j-warm">{i + 1}</span>
                        <span className="text-sm font-medium text-j-text">{stepLabels?.[step] ?? t(STEP_LABELS[step].key, language)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-j-text-secondary">{stepMeta(step)}</span>
                        <span aria-hidden className="text-j-text-tertiary">→</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => changeStep(lastStep ?? 'learn')}
                    className="min-h-[44px] font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
                    data-testid="cover-start"
                  >
                    {coverActionLabel} →
                  </button>
                  <p className="mt-6">
                    <Link
                      href={`/learn/${encodeURIComponent(resourceId)}/feed`}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary underline underline-offset-4 hover:text-j-text"
                    >
                      {language === 'es' ? 'O repasar scrolleando' : 'Or review by scrolling'}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LEARN — Concept sections with pre-q + content + post-test */}
        {currentStep === 'learn' && (
          <VideoSeekProvider iframeRef={iframeRef} videoSegments={allVideoSegments}>
          <div className="py-16">
            <header className="mb-12 px-4 sm:px-0 lg:hidden">
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
                    aria-label={language === 'es' ? 'Sección anterior' : 'Previous section'}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-sm text-j-text-tertiary hover:text-j-text transition-colors disabled:opacity-30 disabled:cursor-default"
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
                    aria-label={language === 'es' ? 'Sección siguiente' : 'Next section'}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-sm text-j-text-tertiary hover:text-j-text transition-colors disabled:opacity-30 disabled:cursor-default"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Section progress */}
              <div className="flex items-center gap-2">
                {sections.map((section, i) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigateToSection(i)}
                    aria-label={`${i + 1}. ${section.sectionTitle}`}
                    aria-current={i === activeSection ? 'step' : undefined}
                    className="flex-1 py-2.5 cursor-pointer hover:opacity-80"
                  >
                    {/* A 4px bar inside a 24px target. */}
                    <span
                      aria-hidden
                      className={`block h-1 w-full transition-colors ${
                        completedSections.has(i)
                          ? 'bg-j-accent'
                          : i === activeSection
                            ? 'bg-j-warm'
                            : 'bg-j-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </header>

            {/* The voice intro: how Jarre works, adapted to how new this learner is */}
            <IntroCard
              resourceId={resourceId}
              language={language}
              hasProgress={Boolean(initialProgress && ((initialProgress.completedSections?.length ?? 0) > 0 || (initialProgress.currentStep && initialProgress.currentStep !== 'activate' && initialProgress.currentStep !== 'learn')))}
            />

            {/* Video player — inline at the top when video exists */}
            {youtubeVideoId && (
              <StickyVideoPlayer ref={iframeRef} youtubeVideoId={youtubeVideoId} />
            )}

            {/* Concept sections */}
            <div className="space-y-4">
              {sections.map((section, i) => (
                <ConceptSectionWrapper
                  key={section.id}
                  section={section}
                  index={i}
                  language={language}
                  activeSection={activeSection}
                  onComplete={handleSectionComplete}
                  onActivate={navigateToSection}
                  initialState={sectionState[section.id]}
                  onStateChange={handleSectionStateChange}
                  figureRegistry={figureRegistry}
                  quizzesBySectionId={quizzesBySectionId}
                  videoSegmentsBySectionId={videoSegmentsBySectionId}
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
                  {hasPractice
                    ? language === 'es'
                      ? 'Terminaste de leer. Ahora, a decirlo en voz alta.'
                      : 'You finished reading. Now, say it out loud.'
                    : language === 'es'
                      ? 'Terminaste de leer todas las partes.'
                      : 'You finished reading every part.'}
                </p>
                <button
                  type="button"
                  onClick={() => changeStep('apply')}
                  className="min-h-[44px] font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
                >
                  {hasPractice ? `${language === 'es' ? 'Siguiente' : 'Next'}: ${t('learn.step.drills', language)}` : t('learn.continueToApply', language)} →
                </button>
              </div>
            )}
          </div>
          </VideoSeekProvider>
        )}

        {/* STEP 4: PRACTICE EVAL — Voice guided practice (default) or text fallback */}
        {currentStep === 'practice-eval' && (
          <div className="pt-10 pb-16">
            {practiceMode === 'voice' ? (
              <VoicePracticeFlow
                language={language}
                resourceId={resourceId}
                concepts={concepts}
                onComplete={() => changeStep(afterTutor)}
                nextLabel={afterTutorLabel}
                onSwitchToText={() => setPracticeMode('text')}
                onReviewMaterial={() => changeStep('learn')}
                lastPracticeResult={lastPracticeResult}
                lastPracticeDate={lastPracticeDate}
              />
            ) : (
              <>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setPracticeMode('voice')}
                    className="font-mono text-[10px] text-j-text-tertiary hover:text-j-warm transition-colors underline underline-offset-2"
                  >
                    ← {language === 'es' ? 'Volver a ensayar con la voz' : 'Back to voice rehearsal'}
                  </button>
                </div>
                <PracticeEvalStep
                  language={language}
                  resourceId={resourceId}
                  conceptIds={sections.map((s) => s.conceptId)}
                  initialState={practiceEvalState}
                  onStateChange={(next) => {
                    setPracticeEvalState(next);
                    saveLearnProgress(resourceId, buildProgress({ practiceEval: next }));
                  }}
                  onComplete={() => changeStep(afterTutor)}
                />
              </>
            )}
          </div>
        )}

        {/* STEP 5: EVALUATE — Voice evaluation (default) or text fallback */}
        {currentStep === 'evaluate' && (
          <div className="pt-10 pb-16">
            {evalMode === 'voice' ? (
              <VoiceEvaluationFlow
                resource={{ id: resourceId, title: resourceTitle, type: resourceType }}
                concepts={concepts}
                userId={userId}
                language={language}
                onCancel={() => changeStep('practice-eval')}
                onSwitchToText={() => setEvalMode('text')}
              />
            ) : (
              <EvaluationFlow
                resource={{ id: resourceId, title: resourceTitle, type: resourceType }}
                concepts={concepts}
                userId={userId}
                language={language}
                onCancel={() => changeStep('practice-eval')}
              />
            )}
          </div>
        )}
      </div>
    </div>

    </WhisperProvider>
  );
}
