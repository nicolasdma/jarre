'use client';

import { useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonStep {
  title: string;
  theory: string;
  observe: string;
}

export interface LessonGuideColors {
  /** Dot activo, callout border. e.g. '#1e40af' */
  accent: string;
  /** Dot visitado. e.g. '#bfdbfe' */
  visited: string;
  /** Fondo del callout. e.g. '#eff6ff' */
  calloutBg: string;
}

export interface LessonGuideShellProps {
  steps: LessonStep[];
  colors: LessonGuideColors;
  /** Render prop para la sección de acción custom */
  renderAction: (stepIndex: number) => ReactNode;
  /** Contenido extra después del callout (e.g. config summary) */
  renderExtra?: (stepIndex: number) => ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonGuideShell({
  steps,
  colors,
  renderAction,
  renderExtra,
}: LessonGuideShellProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Guia
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {/* Step title */}
        <h2 className="font-mono text-sm text-j-text font-medium mb-4">
          {step.title}
        </h2>

        {/* Theory */}
        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Action (custom per playground) */}
        {renderAction(currentStep)}

        {/* What to observe */}
        <div
          className="px-4 py-3 border-l-2 rounded-r"
          style={{
            backgroundColor: colors.calloutBg,
            borderColor: colors.accent,
          }}
        >
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            {step.observe}
          </p>
        </div>

        {/* Extra content (e.g. config summary in replication-lab) */}
        {renderExtra?.(currentStep)}
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-j-border flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i === currentStep
                    ? colors.accent
                    : i < currentStep
                      ? colors.visited
                      : '#ddd',
              }}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
          }
          disabled={currentStep === steps.length - 1}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
