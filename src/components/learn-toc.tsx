'use client';

import { t, type Language } from '@/lib/translations';

type Step = 'activate' | 'learn' | 'practice-eval' | 'apply' | 'evaluate';

interface Section {
  sectionTitle: string;
}

interface LearnTOCProps {
  language: Language;
  sections: Section[];
  activeSection: number;
  completedSections: Set<number>;
  currentStep: Step;
  visitedSteps: Set<Step>;
  onSectionClick: (index: number) => void;
  onStepClick: (step: Step) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const STEP_ORDER: Step[] = ['activate', 'learn', 'apply', 'practice-eval', 'evaluate'];

const STEP_KEYS: Record<Step, Parameters<typeof t>[0]> = {
  activate: 'learn.step.activate',
  learn: 'learn.step.learn',
  apply: 'learn.step.apply',
  'practice-eval': 'learn.step.practiceEval',
  evaluate: 'learn.step.evaluate',
};

/**
 * Sidebar Table of Contents for the learn flow.
 * Desktop: sticky sidebar. Mobile: slide-over panel (trigger in StickyHeader).
 */
export function LearnTOC({
  language,
  sections,
  activeSection,
  completedSections,
  currentStep,
  visitedSteps,
  onSectionClick,
  onStepClick,
  mobileOpen,
  onMobileOpenChange,
}: LearnTOCProps) {

  const handleSectionClick = (index: number) => {
    onSectionClick(index);
    onMobileOpenChange(false);
  };

  const handleStepClick = (step: Step) => {
    onStepClick(step);
    onMobileOpenChange(false);
  };

  const content = (
    <nav className="py-4">
      {/* Steps */}
      <div className="mb-6">
        <p className="font-mono text-[9px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2 px-4">
          {language === 'es' ? 'Pasos' : 'Steps'}
        </p>
        <ul className="space-y-0.5">
          {STEP_ORDER.map((step) => {
            const isActive = step === currentStep;
            const isVisited = !isActive && visitedSteps.has(step);

            return (
              <li key={step}>
                <button
                  onClick={() => handleStepClick(step)}
                  className={`w-full text-left px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors cursor-pointer ${
                    isActive
                      ? 'text-j-accent font-medium bg-j-accent-light'
                      : isVisited
                        ? 'text-j-text-secondary hover:text-j-text'
                        : 'text-j-text-tertiary hover:text-j-text-secondary'
                  }`}
                >
                  {isVisited && <span className="mr-1.5">&#10003;</span>}
                  {t(STEP_KEYS[step], language)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sections (only visible during LEARN step) */}
      {currentStep === 'learn' && sections.length > 0 && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2 px-4">
            {language === 'es' ? 'Secciones' : 'Sections'}
          </p>
          <ul className="space-y-0.5">
            {sections.map((section, i) => {
              const isActive = i === activeSection;
              const isComplete = completedSections.has(i);

              return (
                <li key={section.sectionTitle}>
                  <button
                    onClick={() => handleSectionClick(i)}
                    title={section.sectionTitle}
                    className={`w-full text-left px-4 py-1.5 text-[12px] leading-snug transition-colors truncate ${
                      isActive
                        ? 'text-j-accent font-medium border-l-2 border-j-accent'
                        : isComplete
                          ? 'text-j-text-secondary hover:text-j-text cursor-pointer'
                          : 'text-j-text-tertiary hover:text-j-text-secondary cursor-pointer'
                    }`}
                  >
                    <span className="font-mono text-[10px] mr-1.5">
                      {isComplete ? '\u2713' : `${String(i + 1).padStart(2, '0')}`}
                    </span>
                    {section.sectionTitle}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — fixed so it doesn't push content off-center */}
      <aside className="hidden lg:block fixed left-0 top-[60px] w-[220px] max-h-[calc(100vh-60px)] overflow-y-auto border-r border-j-border bg-j-bg z-40">
        {content}
      </aside>

      {/* Mobile slide-over — matches MobileNav overlay style */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-40"
            onClick={() => onMobileOpenChange(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed right-0 top-0 bottom-0 z-50 w-[280px] max-w-[85vw] bg-j-bg/95 backdrop-blur-lg border-l border-j-border overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-j-border">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {language === 'es' ? 'Contenido' : 'Contents'}
              </span>
              <button
                onClick={() => onMobileOpenChange(false)}
                className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 min-h-[44px]"
                aria-label="Close menu"
              >
                <span className="block w-5 h-px bg-j-text rotate-45 translate-y-[3.5px] transition-all duration-200" />
                <span className="block w-5 h-px bg-j-text opacity-0 transition-all duration-200" />
                <span className="block w-5 h-px bg-j-text -rotate-45 -translate-y-[3.5px] transition-all duration-200" />
              </button>
            </div>
            {content}
          </div>
        </>
      )}
    </>
  );
}
