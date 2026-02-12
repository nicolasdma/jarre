'use client';

interface XPBadgeProps {
  totalXp: number;
  level: number;
}

export function XPBadge({ totalXp, level }: XPBadgeProps) {
  const formatted = totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}k` : String(totalXp);

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[11px] tracking-[0.1em] text-j-text-secondary">
        {formatted} XP
      </span>
      <span className="font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase bg-j-accent-light px-1.5 py-0.5">
        Nv {level}
      </span>
    </div>
  );
}
