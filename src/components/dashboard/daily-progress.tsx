'use client';

import { useEffect, useState } from 'react';

interface DailyProgressProps {
  earned: number;
  target: number;
}

export function DailyProgress({ earned, target }: DailyProgressProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const pct = Math.min(100, Math.round((earned / target) * 100));
  const complete = earned >= target;

  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => setAnimatedWidth(pct), 50);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-j-bg-alt border border-j-border overflow-hidden" style={{ maxWidth: 120 }}>
        <div
          className={`h-full transition-all duration-700 ease-out ${
            complete ? 'bg-j-accent' : 'bg-j-warm'
          }`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
      <span className={`font-mono text-[10px] tracking-[0.1em] ${complete ? 'text-j-accent' : 'text-j-text-tertiary'}`}>
        {earned}/{target} XP
      </span>
    </div>
  );
}
