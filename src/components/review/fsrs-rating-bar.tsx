'use client';

import { motion } from 'framer-motion';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface FSRSRatingBarProps {
  intervals: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onRate: (rating: 'wrong' | 'hard' | 'good' | 'easy') => void;
  disabled?: boolean;
  language?: Language;
}

export type SelfRating = 'wrong' | 'hard' | 'good' | 'easy';

/**
 * What each self-rating means, in plain words. Anki's manual defines "Again"
 * as "you couldn't recall it"; the four stay the scheduler's four.
 */
export const SELF_RATING_LABELS: Record<SelfRating, Record<Language, string>> = {
  wrong: { es: 'No me acordé', en: 'Forgot' },
  hard: { es: 'Me costó', en: 'Hard' },
  good: { es: 'Bien', en: 'Good' },
  easy: { es: 'Fácil', en: 'Easy' },
};

// ============================================================================
// Helpers
// ============================================================================

/** When the card comes back: "en 3 días", "in 2 months". */
export function formatInterval(days: number, language: Language = 'es'): string {
  const es = language === 'es';
  if (days < 1) return es ? 'hoy' : 'today';
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (days < 30) {
    const n = Math.round(days);
    return es ? `en ${plural(n, 'día', 'días')}` : `in ${plural(n, 'day', 'days')}`;
  }
  if (days < 365) {
    const n = Math.round(days / 30);
    return es ? `en ${plural(n, 'mes', 'meses')}` : `in ${plural(n, 'month', 'months')}`;
  }
  const years = (days / 365).toFixed(1);
  return es ? `en ${years.replace('.', ',')} años` : `in ${years} years`;
}

// ============================================================================
// Rating button config
// ============================================================================

interface RatingConfig {
  key: 'again' | 'hard' | 'good' | 'easy';
  rating: SelfRating;
  baseClass: string;
  hoverClass: string;
}

const RATING_CONFIGS: RatingConfig[] = [
  {
    key: 'again',
    rating: 'wrong',
    baseClass: 'border-j-error text-j-error',
    hoverClass: 'hover:bg-j-error-bg',
  },
  {
    key: 'hard',
    rating: 'hard',
    baseClass: 'border-j-warm text-j-warm',
    hoverClass: 'hover:bg-j-warm-light',
  },
  {
    key: 'good',
    rating: 'good',
    baseClass: 'border-j-accent text-j-accent',
    hoverClass: 'hover:bg-j-accent-light',
  },
  {
    key: 'easy',
    rating: 'easy',
    baseClass: 'border-j-success text-j-success',
    hoverClass: 'hover:bg-j-success-bg',
  },
];

// ============================================================================
// Component
// ============================================================================

/**
 * Self-rating bar for the spaced review: 4 buttons (forgot, hard, good, easy).
 * Each shows when the card comes back below its label.
 */
export function FSRSRatingBar({ intervals, onRate, disabled = false, language = 'es' }: FSRSRatingBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {RATING_CONFIGS.map((config) => (
        <motion.button
          key={config.key}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRate(config.rating);
          }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex flex-col items-center gap-1 border py-3 px-2
            font-mono text-[10px] tracking-[0.15em] uppercase
            transition-colors duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${config.baseClass}
            ${disabled ? '' : config.hoverClass}
          `}
        >
          <span>{SELF_RATING_LABELS[config.rating][language]}</span>
          <span className="text-[9px] tracking-normal normal-case opacity-70">
            {formatInterval(intervals[config.key], language)}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
