'use client';

import { useState, useEffect, useRef } from 'react';
import { t, type Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface SelfExplanationProps {
  language: Language;
  conceptName: string;
  initialValue?: string;
  onSave: (explanation: string) => void;
  /** When true, parent cannot advance until valid */
  required?: boolean;
  /** Minimum character length to be considered valid */
  minLength?: number;
  /** Called when validity changes (for parent gating) */
  onValidChange?: (valid: boolean) => void;
  /** Post-test score — used for contextual prompts */
  postTestScore?: number;
  /** Whether the post-test was correct */
  postTestCorrect?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Self-explanation prompt — appears after post-test in concept sections.
 *
 * When `required=true`, acts as a gate: the parent must check validity
 * via `onValidChange` before allowing navigation.
 *
 * Research base: Chi & Wylie 2014 — self-explanation is the highest-impact
 * individual learning intervention. The value comes from the act of explaining.
 */
export function SelfExplanation({
  language,
  conceptName,
  initialValue = '',
  onSave,
  required = false,
  minLength = 50,
  onValidChange,
  postTestScore,
  postTestCorrect,
}: SelfExplanationProps) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(!!initialValue);
  const [showNudge, setShowNudge] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = value.trim().length >= minLength;

  // Notify parent of validity changes
  useEffect(() => {
    onValidChange?.(saved && isValid);
  }, [saved, isValid, onValidChange]);

  // Nudge timer: if required and >60s without typing, show gentle nudge
  useEffect(() => {
    if (!required || saved) return;

    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = setTimeout(() => {
      if (!saved && value.trim().length < minLength) {
        setShowNudge(true);
      }
    }, 60_000);

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [value, saved, required, minLength]);

  // showNudge is gated in JSX by value length — no sync effect needed
  const effectiveShowNudge = showNudge && value.trim().length < minLength;

  const handleSave = () => {
    if (!isValid) return;
    onSave(value.trim());
    setSaved(true);

    // Fire-and-forget LLM validation (non-blocking)
    if (required) {
      validateExplanation(value.trim());
    }
  };

  // Lightweight LLM validation — fire-and-forget, doesn't block advance
  const validateExplanation = async (text: string) => {
    setValidating(true);
    try {
      const res = await fetch('/api/self-explanation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explanation: text, conceptName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isGenuine === false) {
          setValidationHint(
            language === 'es'
              ? 'Tu explicación podría ser más detallada. Intenta incluir el mecanismo o el porqué.'
              : 'Your explanation could be more detailed. Try including the mechanism or the why.'
          );
        }
      }
    } catch {
      // Validation is optional — don't block on errors
    } finally {
      setValidating(false);
    }
  };

  // Contextual prompt based on post-test result
  const getPrompt = (): string => {
    if (postTestCorrect === false) {
      return language === 'es'
        ? `Tu respuesta al post-test no fue completa. Explicá: ¿qué te falló y por qué la respuesta esperada tiene sentido?`
        : `Your post-test answer wasn't complete. Explain: what did you miss and why does the expected answer make sense?`;
    }
    if (postTestCorrect === true && (postTestScore ?? 0) >= 80) {
      return language === 'es'
        ? `Explicaste bien. Ahora, con tus propias palabras: ¿por qué funciona así "${conceptName}"?`
        : `You explained well. Now, in your own words: why does "${conceptName}" work this way?`;
    }
    return language === 'es'
      ? `Explicá con tus propias palabras: ¿cuál es la idea central de "${conceptName}" y por qué importa?`
      : `Explain in your own words: what is the core idea of "${conceptName}" and why does it matter?`;
  };

  return (
    <div className={`border p-5 ${required ? 'border-j-warm bg-j-bg-alt' : 'border-j-border bg-j-bg-alt'}`}>
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-2">
        {t('selfExplanation.title', language)}
        {required && (
          <span className="ml-2 text-j-error">*</span>
        )}
      </p>

      <p className="text-xs text-j-text-secondary leading-relaxed mb-3">
        {getPrompt()}
      </p>

      {required && !saved && (
        <p className="text-[10px] text-j-text-tertiary mb-2 italic">
          {language === 'es'
            ? 'Tomarte un momento para explicar con tus palabras consolida lo aprendido.'
            : 'Taking a moment to explain in your own words consolidates what you learned.'}
        </p>
      )}

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
        className="w-full border border-j-border-input bg-j-bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none disabled:opacity-60"
      />

      {/* Character counter (when required) */}
      {required && !saved && (
        <div className="flex items-center justify-between mt-1">
          <span className={`font-mono text-[10px] ${isValid ? 'text-j-accent' : 'text-j-text-tertiary'}`}>
            {value.trim().length}/{minLength} {language === 'es' ? 'caracteres mínimos' : 'min characters'}
          </span>
          {effectiveShowNudge && (
            <span className="text-[10px] text-j-warm animate-pulse">
              {language === 'es' ? 'Intenta explicar lo que entendiste...' : 'Try explaining what you understood...'}
            </span>
          )}
        </div>
      )}

      {/* Validation hint (from LLM, non-blocking) */}
      {validationHint && saved && (
        <p className="mt-2 text-[10px] text-j-warm leading-relaxed">
          {validationHint}
        </p>
      )}

      {!saved ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="mt-2 font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-1.5 uppercase hover:border-j-accent transition-colors disabled:opacity-40"
        >
          {validating
            ? (language === 'es' ? 'Guardando...' : 'Saving...')
            : t('selfExplanation.save', language)}
        </button>
      ) : (
        <p className="mt-2 font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase">
          {t('selfExplanation.saved', language)}
        </p>
      )}
    </div>
  );
}
