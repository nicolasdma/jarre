'use client';

import Link from 'next/link';
import type { PositionedNode } from './layout-engine';

interface ConceptDetailPanelProps {
  node: PositionedNode | null;
  definition?: string;
  onClose: () => void;
  language: 'es' | 'en';
}

const LEVEL_LABELS_ES = ['Expuesto', 'Entendido', 'Aplicado', 'Criticado', 'Ensenado'];
const LEVEL_LABELS_EN = ['Exposed', 'Understood', 'Applied', 'Criticized', 'Taught'];

export function ConceptDetailPanel({ node, definition, onClose, language }: ConceptDetailPanelProps) {
  if (!node) return null;

  const labels = language === 'es' ? LEVEL_LABELS_ES : LEVEL_LABELS_EN;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-j-bg border-l border-j-border shadow-lg z-40 overflow-y-auto">
      <div className="p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-j-text-tertiary hover:text-j-text transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Concept name */}
        <h3 className="font-mono text-[11px] tracking-[0.15em] text-j-accent uppercase mb-2">
          {language === 'es' ? 'Fase' : 'Phase'} {node.phase}
        </h3>
        <h2 className="text-lg font-medium text-j-text mb-4">{node.name}</h2>

        {/* Mastery level */}
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            {language === 'es' ? 'Nivel de maestria' : 'Mastery Level'}
          </p>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`flex-1 h-2 ${
                  level <= node.masteryLevel ? 'bg-j-accent' : 'bg-j-border'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-j-text-secondary mt-1">
            {node.masteryLevel}/4 — {labels[node.masteryLevel]}
          </p>
        </div>

        {/* Definition */}
        {definition && (
          <div className="mb-6">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
              {language === 'es' ? 'Definicion' : 'Definition'}
            </p>
            <p className="text-sm text-j-text-body leading-relaxed">
              {definition}
            </p>
          </div>
        )}

        {/* Prerequisites */}
        {node.prerequisites.length > 0 && (
          <div className="mb-6">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
              {language === 'es' ? 'Prerequisitos' : 'Prerequisites'}
            </p>
            <div className="flex flex-wrap gap-1">
              {node.prerequisites.map((p) => (
                <span key={p} className="font-mono text-[10px] bg-j-bg-alt border border-j-border px-2 py-1 text-j-text-secondary">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action link */}
        <Link
          href="/library"
          className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase hover:text-j-accent-hover transition-colors"
        >
          {language === 'es' ? 'Ver recursos →' : 'View resources →'}
        </Link>
      </div>
    </div>
  );
}
