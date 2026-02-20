import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div className={cn('flex items-center gap-2.5 mb-4', className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-j-accent" />
      <span className="font-mono text-[10px] tracking-[0.25em] text-j-text-tertiary uppercase">
        {children}
      </span>
    </div>
  );
}
