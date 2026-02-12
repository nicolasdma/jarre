'use client';

interface StreakBadgeProps {
  days: number;
  alive: boolean;
}

export function StreakBadge({ days, alive }: StreakBadgeProps) {
  if (days === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${alive ? '' : 'opacity-50'}`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className={alive ? 'text-j-warm animate-pulse' : 'text-j-text-tertiary'}
      >
        <path
          d="M12 2C12 2 4 8 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 8 12 2 12 2Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M12 10C12 10 8 13 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 13 12 10 12 10Z"
          fill="var(--j-warm-light)"
          opacity="0.7"
        />
      </svg>
      <span className="font-mono text-[11px] tracking-[0.1em] text-j-text font-medium">
        {days}
      </span>
    </div>
  );
}
