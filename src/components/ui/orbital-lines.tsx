/**
 * Decorative SVG orbital/topographic lines for card backgrounds.
 * Each card gets a slightly different pattern based on its `variant` index.
 * Dark-mode only — hidden in light mode.
 */
interface OrbitalLinesProps {
  variant?: number;
  className?: string;
}

export function OrbitalLines({ variant = 0, className = '' }: OrbitalLinesProps) {
  // Deterministic variation based on index
  const seed = variant % 5;

  // Each variant shifts ellipse positions and radii for visual variety
  const configs = [
    { cx: 85, cy: 20, rx: 120, ry: 60, rot: -15 },
    { cx: 70, cy: 75, rx: 140, ry: 50, rot: 10 },
    { cx: 90, cy: 40, rx: 100, ry: 70, rot: -25 },
    { cx: 60, cy: 30, rx: 130, ry: 55, rot: 5 },
    { cx: 80, cy: 60, rx: 110, ry: 65, rot: -10 },
  ];

  const base = configs[seed];

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none hidden dark:block ${className}`}
      preserveAspectRatio="none"
      viewBox="0 0 200 100"
      fill="none"
      aria-hidden="true"
    >
      {/* Primary orbital */}
      <ellipse
        cx={base.cx}
        cy={base.cy}
        rx={base.rx}
        ry={base.ry}
        transform={`rotate(${base.rot} ${base.cx} ${base.cy})`}
        stroke="var(--j-border)"
        strokeWidth="0.4"
        opacity="0.18"
      />
      {/* Secondary orbital — offset */}
      <ellipse
        cx={base.cx + 15}
        cy={base.cy + 10}
        rx={base.rx * 0.75}
        ry={base.ry * 0.85}
        transform={`rotate(${base.rot + 20} ${base.cx + 15} ${base.cy + 10})`}
        stroke="var(--j-border)"
        strokeWidth="0.3"
        opacity="0.12"
      />
      {/* Tertiary — smaller accent ring */}
      <ellipse
        cx={base.cx - 10}
        cy={base.cy - 5}
        rx={base.rx * 0.5}
        ry={base.ry * 0.6}
        transform={`rotate(${base.rot - 10} ${base.cx - 10} ${base.cy - 5})`}
        stroke="var(--j-accent)"
        strokeWidth="0.25"
        opacity="0.08"
      />
    </svg>
  );
}
