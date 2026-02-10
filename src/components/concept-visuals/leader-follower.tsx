'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FOLLOWERS = ['F1', 'F2', 'F3'] as const;
const CYCLE_MS = 2500;

export function LeaderFollowerVisual() {
  const [writeId, setWriteId] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'sending' | 'received'>('idle');
  const [receivedSet, setReceivedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setWriteId((prev) => prev + 1);
      setPhase('sending');
      setReceivedSet(new Set());

      // Followers receive at staggered times
      FOLLOWERS.forEach((_, i) => {
        setTimeout(() => {
          setReceivedSet((prev) => new Set([...prev, i]));
        }, 400 + i * 300);
      });

      // Reset to idle before next cycle
      setTimeout(() => setPhase('idle'), 2000);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-12">
        {/* Leader */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px]"
            style={{ borderColor: '#4a5d4a', color: '#4a5d4a', backgroundColor: '#faf9f6' }}
            animate={{ scale: phase === 'sending' ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            L
          </motion.div>
          <span className="font-mono text-[10px] text-[#9c9a8e]">lider</span>
        </div>

        {/* Connection lines + followers */}
        <div className="flex flex-col gap-3">
          {FOLLOWERS.map((label, i) => {
            const received = receivedSet.has(i);
            return (
              <div key={label} className="flex items-center gap-3">
                {/* Animated write dot */}
                <div className="relative w-16 h-px bg-[#e8e6e0]">
                  <AnimatePresence>
                    {phase === 'sending' && !received && (
                      <motion.div
                        key={`${writeId}-${i}`}
                        className="absolute top-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#c4a07a', y: '-50%' }}
                        initial={{ left: 0, opacity: 1 }}
                        animate={{ left: 56 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.3 }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Follower node */}
                <motion.div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px]"
                  animate={{
                    borderColor: received ? '#4a5d4a' : '#e8e6e0',
                    color: received ? '#4a5d4a' : '#9c9a8e',
                    backgroundColor: received ? 'rgba(74, 93, 74, 0.08)' : '#faf9f6',
                  }}
                  transition={{ duration: 0.25 }}
                >
                  {label}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9c9a8e]">
        replicacion basada en lider
      </span>
    </div>
  );
}
