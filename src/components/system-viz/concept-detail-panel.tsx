'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PositionedNode } from './layout-engine';
import { VoiceTeachFlow } from '@/components/voice/voice-teach-flow';

interface ConceptDetailPanelProps {
  node: PositionedNode | null;
  definition?: string;
  onClose: () => void;
  language: 'es' | 'en';
}

const LEVEL_LABELS_ES = ['Expuesto', 'Entendido', 'Aplicado', 'Criticado', 'Ensenado'];
const LEVEL_LABELS_EN = ['Exposed', 'Understood', 'Applied', 'Criticized', 'Taught'];

export function ConceptDetailPanel({ node, definition, onClose, language }: ConceptDetailPanelProps) {
  const [showTeachFlow, setShowTeachFlow] = useState(false);

  if (!node) return null;

  const labels = language === 'es' ? LEVEL_LABELS_ES : LEVEL_LABELS_EN;
  const canTeach = node.masteryLevel === 3;

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

        {/* Teach button for Level 3 concepts */}
        {canTeach && !showTeachFlow && (
          <button
            type="button"
            onClick={() => setShowTeachFlow(true)}
            className="w-full mb-6 flex items-center gap-3 border border-j-warm/30 bg-j-warm/5 p-3 hover:border-j-warm hover:bg-j-warm/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--j-warm, #d97706)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="11" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <div className="text-left">
              <p className="font-mono text-[10px] tracking-[0.15em] text-j-warm uppercase">
                {language === 'es' ? 'Ensena este concepto' : 'Teach this concept'}
              </p>
              <p className="text-[9px] text-j-text-tertiary mt-0.5">
                {language === 'es' ? 'Avanza a Nivel 4' : 'Advance to Level 4'}
              </p>
            </div>
          </button>
        )}

        {/* Teach flow inline */}
        {canTeach && showTeachFlow && definition && (
          <div className="mb-6 -mx-6 border-t border-b border-j-border">
            <VoiceTeachFlow
              conceptId={node.id}
              conceptName={node.name}
              conceptDefinition={definition}
              language={language}
              onClose={() => setShowTeachFlow(false)}
            />
          </div>
        )}

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
