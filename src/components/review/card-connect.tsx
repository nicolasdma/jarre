'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFlip } from './card-flip';
import { FSRSRatingBar } from './fsrs-rating-bar';

// ============================================================================
// Types
// ============================================================================

interface CardConnectProps {
  content: {
    conceptA: string;
    conceptB: string;
    prompt: string;
  };
  back: {
    connection: string;
  };
  intervals: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onRate: (rating: 'wrong' | 'hard' | 'good' | 'easy') => void;
  isSubmitting: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Connection card: shows two concepts with a "?" between them.
 * User thinks about the relationship, flips to see the connection,
 * then self-rates via FSRS.
 */
export function CardConnect({
  content,
  back,
  intervals,
  onRate,
  isSubmitting,
}: CardConnectProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const frontFace = (
    <div className="border border-j-border bg-j-bg-alt p-6 min-h-[200px] flex flex-col">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-6">
        Connect
      </p>

      {/* Two concept boxes with a "?" connector */}
      <div className="flex items-center justify-center gap-4 mb-6 flex-1">
        <div className="border border-j-accent bg-j-accent-light px-4 py-3 text-center flex-1 max-w-[180px]">
          <p className="text-sm font-mono text-j-accent">{content.conceptA}</p>
        </div>

        <span className="text-2xl font-light text-j-text-tertiary">?</span>

        <div className="border border-j-accent bg-j-accent-light px-4 py-3 text-center flex-1 max-w-[180px]">
          <p className="text-sm font-mono text-j-accent">{content.conceptB}</p>
        </div>
      </div>

      {/* Prompt */}
      <p className="text-sm text-j-text-secondary leading-relaxed text-center mb-4">
        {content.prompt}
      </p>

      <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase text-center">
        Tap to reveal connection
      </p>
    </div>
  );

  const backFace = (
    <div className="border border-j-accent bg-j-bg-alt p-6 min-h-[200px]">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-4">
        Connection
      </p>

      {/* Concept labels */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] text-j-accent">{content.conceptA}</span>
        <span className="text-j-text-tertiary">&harr;</span>
        <span className="font-mono text-[10px] text-j-accent">{content.conceptB}</span>
      </div>

      <p className="text-sm text-j-text leading-relaxed">
        {back.connection}
      </p>
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
