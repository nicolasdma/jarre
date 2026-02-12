'use client';

import type { CelebrationEvent } from '@/hooks/use-celebrations';

interface CelebrationProps {
  event: CelebrationEvent | null;
  onDismiss: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  daily_goal: '🎯',
  streak_milestone: '🔥',
  level_up: '⬆',
  mastery_advance: '🧠',
};

const TYPE_COLORS: Record<string, string> = {
  daily_goal: 'border-j-accent',
  streak_milestone: 'border-j-warm',
  level_up: 'border-j-accent',
  mastery_advance: 'border-j-accent',
};

export function Celebration({ event, onDismiss }: CelebrationProps) {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className={`
          pointer-events-auto
          bg-j-bg border-2 ${TYPE_COLORS[event.type] ?? 'border-j-accent'}
          px-8 py-6 shadow-lg
          celebration-enter
          cursor-pointer hover:opacity-90 transition-opacity
        `}
      >
        <p className="text-2xl text-center mb-2">{TYPE_ICONS[event.type]}</p>
        <p className="font-mono text-[12px] tracking-[0.15em] text-j-text uppercase text-center font-medium">
          {event.message}
        </p>
        {event.detail && (
          <p className="text-xs text-j-text-secondary text-center mt-1">
            {event.detail}
          </p>
        )}
      </button>
    </div>
  );
}
