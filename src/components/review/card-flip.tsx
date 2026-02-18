'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface CardFlipProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  onFlip: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * CSS 3D flip card animation powered by framer-motion.
 * Front and back faces are absolutely positioned; click anywhere to flip.
 */
export function CardFlip({ front, back, isFlipped, onFlip }: CardFlipProps) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ perspective: 1200 }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front face */}
        <div
          className="w-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 w-full"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}
