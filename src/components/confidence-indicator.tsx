'use client';

import { useState } from 'react';
import { t, type Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

export type ConfidenceLevel = 1 | 2 | 3;

interface ConfidenceIndicatorProps {
  language: Language;
  onSelect: (level: ConfidenceLevel) => void;
  disabled?: boolean;
  selected?: ConfidenceLevel | null;
}

// ============================================================================
// Component
// ============================================================================

const LEVELS: { level: ConfidenceLevel; key: Parameters<typeof t>[0] }[] = [
  { level: 1, key: 'confidence.low' },
  { level: 2, key: 'confidence.medium' },
  { level: 3, key: 'confidence.high' },
];

export function ConfidenceIndicator({
  language,
  onSelect,
  disabled = false,
  selected = null,
}: ConfidenceIndicatorProps) {
  const [localSelected, setLocalSelected] = useState<ConfidenceLevel | null>(selected);
  const isLocked = localSelected !== null || disabled;

  const handleSelect = (level: ConfidenceLevel) => {
    if (isLocked) return;
    setLocalSelected(level);
    onSelect(level);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
        {t('confidence.prompt', language)}
      </p>
      <div className="flex gap-2">
        {LEVELS.map(({ level, key }) => {
          const isActive = localSelected === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelect(level)}
              disabled={isLocked && !isActive}
              className={`flex-1 font-mono text-[10px] tracking-[0.1em] py-2 px-3 border transition-all duration-200 uppercase ${
                isActive
                  ? 'border-j-accent bg-j-accent-light text-j-accent'
                  : isLocked
                    ? 'border-j-border bg-j-bg-alt text-j-text-tertiary opacity-40'
                    : 'border-j-border-input bg-white text-j-text-secondary hover:border-j-accent cursor-pointer'
              }`}
            >
              {t(key, language)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
