'use client';

import type { Language } from '@/lib/translations';

interface VoiceToggleProps {
  language: Language;
  isActive: boolean;
  onToggle: () => void;
}

export function VoiceToggle({ language, isActive, onToggle }: VoiceToggleProps) {
  const label = isActive
    ? (language === 'es' ? 'Desactivar voz' : 'Disable voice')
    : (language === 'es' ? 'Discutir con tutor' : 'Discuss with tutor');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`w-8 h-8 flex items-center justify-center border transition-colors ${
        isActive
          ? 'border-j-accent text-j-accent hover:text-j-accent-hover hover:border-j-accent-hover'
          : 'border-j-border-input text-j-text-secondary hover:text-j-text hover:border-j-accent'
      }`}
    >
      {/* Microphone icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="1" width="6" height="11" rx="3" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
