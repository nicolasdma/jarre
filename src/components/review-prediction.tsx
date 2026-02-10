'use client';

import { useState } from 'react';
import { t, type Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface ReviewPredictionProps {
  language: Language;
  totalQuestions: number;
  onPredict: (predicted: number) => void;
  /** Set after session to show comparison */
  actualCorrect?: number;
  initialPrediction?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Review prediction — metacognitive prompt before/after review sessions.
 * Asks "How many do you think you'll get right?" before starting.
 * After the session, compares prediction vs reality.
 * Purely UI, no backend — stored in component state and passed up.
 */
export function ReviewPrediction({
  language,
  totalQuestions,
  onPredict,
  actualCorrect,
  initialPrediction,
}: ReviewPredictionProps) {
  const [prediction, setPrediction] = useState<number | null>(initialPrediction ?? null);
  const [locked, setLocked] = useState(initialPrediction != null);
  const showComparison = actualCorrect != null && prediction != null;

  const handleConfirm = () => {
    if (prediction == null) return;
    setLocked(true);
    onPredict(prediction);
  };

  // Post-session comparison view
  if (showComparison) {
    const diff = actualCorrect - prediction;
    const calibrationLabel =
      diff === 0
        ? (language === 'es' ? 'Calibración perfecta' : 'Perfect calibration')
        : diff > 0
          ? (language === 'es' ? 'Mejor de lo esperado' : 'Better than expected')
          : (language === 'es' ? 'Hay margen de mejora' : 'Room for improvement');

    return (
      <div className="border border-j-border bg-j-bg-alt p-5 text-center">
        <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-4">
          {t('prediction.comparison', language)}
        </p>
        <div className="flex items-center justify-center gap-8 mb-4">
          <div>
            <p className="text-2xl font-light text-j-text-secondary">{prediction}</p>
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {t('prediction.predicted', language)}
            </p>
          </div>
          <span className="text-j-border-dot text-lg">→</span>
          <div>
            <p className={`text-2xl font-light ${diff >= 0 ? 'text-j-accent' : 'text-j-error'}`}>
              {actualCorrect}
            </p>
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {t('prediction.actual', language)}
            </p>
          </div>
        </div>
        <p className="text-xs text-j-text-secondary">{calibrationLabel}</p>
      </div>
    );
  }

  // Pre-session prediction input
  return (
    <div className="border border-j-border bg-j-bg-alt p-5 text-center">
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-3">
        {t('prediction.title', language)}
      </p>
      <p className="text-sm text-j-text-secondary mb-4">
        {language === 'es'
          ? `De ${totalQuestions} preguntas, ¿cuántas crees que responderás correctamente?`
          : `Out of ${totalQuestions} questions, how many do you think you'll get right?`}
      </p>

      {!locked ? (
        <div className="flex items-center justify-center gap-4">
          <input
            type="range"
            min={0}
            max={totalQuestions}
            value={prediction ?? Math.round(totalQuestions / 2)}
            onChange={(e) => setPrediction(parseInt(e.target.value, 10))}
            className="w-48 accent-[var(--j-accent)]"
          />
          <span className="font-mono text-lg text-j-text min-w-[2ch] text-center">
            {prediction ?? Math.round(totalQuestions / 2)}
          </span>
          <button
            type="button"
            onClick={() => {
              if (prediction == null) setPrediction(Math.round(totalQuestions / 2));
              handleConfirm();
            }}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {t('prediction.confirm', language)}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-light text-j-accent mb-1">{prediction}</p>
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">
            {t('prediction.yourPrediction', language)}
          </p>
        </div>
      )}
    </div>
  );
}
