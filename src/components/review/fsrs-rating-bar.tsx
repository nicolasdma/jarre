'use client';

import { motion } from 'framer-motion';

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
}

// ============================================================================
// Helpers
// ============================================================================

/** Format interval days into human-readable string */
function formatInterval(days: number): string {
  if (days < 1) return '< 1d';
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

// ============================================================================
// Rating button config
// ============================================================================

interface RatingConfig {
  key: 'again' | 'hard' | 'good' | 'easy';
  rating: 'wrong' | 'hard' | 'good' | 'easy';
  label: string;
  baseClass: string;
  hoverClass: string;
}

const RATING_CONFIGS: RatingConfig[] = [
  {
    key: 'again',
    rating: 'wrong',
    label: 'Again',
    baseClass: 'border-j-error text-j-error',
    hoverClass: 'hover:bg-j-error-bg',
  },
  {
    key: 'hard',
    rating: 'hard',
    label: 'Hard',
    baseClass: 'border-j-warm text-j-warm',
    hoverClass: 'hover:bg-j-warm-light',
  },
  {
    key: 'good',
    rating: 'good',
    label: 'Good',
    baseClass: 'border-j-accent text-j-accent',
    hoverClass: 'hover:bg-j-accent-light',
  },
  {
    key: 'easy',
    rating: 'easy',
    label: 'Easy',
    baseClass: 'border-j-success text-j-success',
    hoverClass: 'hover:bg-j-success-bg',
  },
];

// ============================================================================
// Component
// ============================================================================

/**
 * FSRS self-rating bar: 4 buttons (Again, Hard, Good, Easy).
 * Each shows the predicted interval below its label.
 */
export function FSRSRatingBar({ intervals, onRate, disabled = false }: FSRSRatingBarProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
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
          <span>{config.label}</span>
          <span className="text-[9px] tracking-normal normal-case opacity-70">
            {formatInterval(intervals[config.key])}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
