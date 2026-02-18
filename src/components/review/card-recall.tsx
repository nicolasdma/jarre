'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFlip } from './card-flip';
import { FSRSRatingBar } from './fsrs-rating-bar';

// ============================================================================
// Types
// ============================================================================

interface CardRecallProps {
  content: { prompt: string };
  back: {
    definition: string;
    keyPoints?: string[];
    whyItMatters?: string;
  };
  intervals: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onRate: (rating: 'wrong' | 'hard' | 'good' | 'easy') => void;
  conceptName: string;
  isSubmitting: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Recall card: shows a prompt, the user thinks, flips to reveal the answer,
 * then self-rates using FSRS.
 */
export function CardRecall({
  content,
  back,
  intervals,
  onRate,
  conceptName,
  isSubmitting,
}: CardRecallProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const frontFace = (
    <div className="border border-j-border bg-j-bg-alt p-6 min-h-[200px] flex flex-col justify-between">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
          {conceptName}
        </p>
        <p className="text-sm text-j-text leading-relaxed">
          {content.prompt}
        </p>
      </div>
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-6 text-center">
        Tap to reveal
      </p>
    </div>
  );

  const backFace = (
    <div className="border border-j-accent bg-j-bg-alt p-6 min-h-[200px]">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-4">
        {conceptName}
      </p>

      <p className="text-sm text-j-text leading-relaxed mb-4">
        {back.definition}
      </p>

      {back.keyPoints && back.keyPoints.length > 0 && (
        <div className="mb-4">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
            Key points
          </p>
          <ul className="space-y-1">
            {back.keyPoints.map((point, i) => (
              <li key={i} className="text-xs text-j-text-secondary leading-relaxed flex gap-2">
                <span className="text-j-accent mt-0.5">-</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {back.whyItMatters && (
        <div className="border-t border-j-border pt-3 mt-3">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
            Why it matters
          </p>
          <p className="text-xs text-j-text-secondary leading-relaxed">
            {back.whyItMatters}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <CardFlip
        front={frontFace}
        back={backFace}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(true)}
      />

      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2 text-center">
              How well did you know this?
            </p>
            <FSRSRatingBar
              intervals={intervals}
              onRate={onRate}
              disabled={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
