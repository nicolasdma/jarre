'use client';

import { useState } from 'react';
import { t, type Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface SelfExplanationProps {
  language: Language;
  conceptName: string;
  initialValue?: string;
  onSave: (explanation: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Self-explanation prompt — appears after post-test in concept sections.
 * Purely client-side, no LLM call. The learning value comes from the act
 * of explaining, not from evaluating the explanation (Chi & Wylie 2014).
 */
export function SelfExplanation({
  language,
  conceptName,
  initialValue = '',
  onSave,
}: SelfExplanationProps) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(!!initialValue);

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    setSaved(true);
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-5">
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-2">
        {t('selfExplanation.title', language)}
      </p>
      <p className="text-xs text-j-text-secondary leading-relaxed mb-3">
        {language === 'es'
          ? `Explicá con tus propias palabras: ¿cuál es la idea central de "${conceptName}" y por qué importa?`
          : `Explain in your own words: what is the core idea of "${conceptName}" and why does it matter?`}
      </p>

      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (saved) setSaved(false);
        }}
        placeholder={
          language === 'es'
            ? 'Escribe tu explicación...'
            : 'Write your explanation...'
        }
        rows={3}
        disabled={saved}
        className="w-full border border-j-border-input bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none disabled:opacity-60"
      />

      {!saved ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={!value.trim()}
          className="mt-2 font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-1.5 uppercase hover:border-j-accent transition-colors disabled:opacity-40"
        >
          {t('selfExplanation.save', language)}
        </button>
      ) : (
        <p className="mt-2 font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase">
          {t('selfExplanation.saved', language)}
        </p>
      )}
    </div>
  );
}
