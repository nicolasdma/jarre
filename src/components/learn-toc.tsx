'use client';

import { useState } from 'react';
import { t, type Language } from '@/lib/translations';

type Step = 'activate' | 'learn' | 'review' | 'apply' | 'evaluate';

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
}

const STEP_ORDER: Step[] = ['activate', 'learn', 'apply', 'review', 'evaluate'];

const STEP_KEYS: Record<Step, Parameters<typeof t>[0]> = {
  activate: 'learn.step.activate',
  learn: 'learn.step.learn',
  apply: 'learn.step.apply',
  review: 'learn.step.review',
  evaluate: 'learn.step.evaluate',
};

/**
 * Sidebar Table of Contents for the learn flow.
 * Desktop: sticky sidebar. Mobile: FAB + slide-over panel.
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
}: LearnTOCProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSectionClick = (index: number) => {
    onSectionClick(index);
    setMobileOpen(false);
  };

  const handleStepClick = (step: Step) => {
    onStepClick(step);
    setMobileOpen(false);
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
                <li key={i}>
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

      {/* Mobile FAB */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-4 z-50 w-12 h-12 bg-j-accent text-j-text-on-accent rounded-full shadow-lg flex items-center justify-center font-mono text-sm hover:bg-j-accent-hover transition-colors"
        aria-label="Table of contents"
      >
        &#9776;
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[70] bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed right-0 top-0 bottom-0 z-[80] w-[280px] bg-j-bg border-l border-j-border overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-j-border">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {language === 'es' ? 'Contenido' : 'Contents'}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-j-text-tertiary hover:text-j-text text-lg"
              >
                &#10005;
              </button>
            </div>
            {content}
          </div>
        </>
      )}
    </>
  );
}
