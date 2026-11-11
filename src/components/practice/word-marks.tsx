import { cn } from '@/lib/utils';
import type { WordMark } from '@/lib/practice/scoring';

const WORD_CLASS: Record<WordMark['state'], string> = {
  said: 'text-j-success',
  missed: 'text-j-error underline decoration-dotted',
  extra: 'text-j-text-tertiary line-through',
};

/** Target words green when said, red when missed; extra words grey. */
export function WordMarks({ marks }: { marks: WordMark[] }) {
  return (
    <div className="space-y-2">
      <p className="text-lg leading-relaxed" lang="en" data-testid="word-marks">
        {marks.map((m, i) => (
          <span key={i} data-word-state={m.state} className={cn(WORD_CLASS[m.state])}>
            {m.word}{' '}
          </span>
        ))}
      </p>
      <p className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        <span className="text-j-success">● dicho</span>
        <span className="text-j-error">● faltó</span>
        <span>● de más</span>
      </p>
    </div>
  );
}
