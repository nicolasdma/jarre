'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GraphNode, ConceptNodeData, ResourceNodeData } from './graph-types';
import { VoiceTeachFlow } from '@/components/voice/voice-teach-flow';

interface ConceptDetailPanelProps {
  node: GraphNode | null;
  definition?: string;
  onClose: () => void;
  language: 'es' | 'en';
}

const LEVEL_LABELS_ES = ['Expuesto', 'Entendido', 'Aplicado', 'Criticado', 'Ensenado'];
const LEVEL_LABELS_EN = ['Exposed', 'Understood', 'Applied', 'Criticized', 'Taught'];

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  article: 'Article',
  paper: 'Paper',
  book: 'Book',
  podcast: 'Podcast',
  other: 'Other',
};

export function ConceptDetailPanel({ node, definition, onClose, language }: ConceptDetailPanelProps) {
  const [showTeachFlow, setShowTeachFlow] = useState(false);

  if (!node) return null;

  const isConcept = node.data.type === 'concept';

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

        {isConcept ? (
          <ConceptView
            data={node.data as ConceptNodeData}
            definition={definition}
            language={language}
            showTeachFlow={showTeachFlow}
            setShowTeachFlow={setShowTeachFlow}
          />
        ) : (
          <ResourceView data={node.data as ResourceNodeData} language={language} />
        )}
      </div>
    </div>
  );
}

function ConceptView({
  data,
  definition,
  language,
  showTeachFlow,
  setShowTeachFlow,
}: {
  data: ConceptNodeData;
  definition?: string;
  language: 'es' | 'en';
  showTeachFlow: boolean;
  setShowTeachFlow: (v: boolean) => void;
}) {
  const labels = language === 'es' ? LEVEL_LABELS_ES : LEVEL_LABELS_EN;
  const canTeach = data.masteryLevel === 3;

  return (
    <>
      {/* Phase */}
      <h3 className="font-mono text-[11px] tracking-[0.15em] text-j-accent uppercase mb-2">
        {language === 'es' ? 'Fase' : 'Phase'} {data.phase}
      </h3>
      <h2 className="text-lg font-medium text-j-text mb-4">{data.name}</h2>

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
                level <= data.masteryLevel ? 'bg-j-accent' : 'bg-j-border'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-j-text-secondary mt-1">
          {data.masteryLevel}/4 — {labels[data.masteryLevel]}
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
            conceptId={data.id}
            conceptName={data.name}
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
          <p className="text-sm text-j-text-body leading-relaxed">{definition}</p>
        </div>
      )}

      {/* Prerequisites */}
      {data.prerequisites.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
            {language === 'es' ? 'Prerequisitos' : 'Prerequisites'}
          </p>
          <div className="flex flex-wrap gap-1">
            {data.prerequisites.map((p) => (
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
    </>
  );
}

function ResourceView({
  data,
  language,
}: {
  data: ResourceNodeData;
  language: 'es' | 'en';
}) {
  return (
    <>
      {/* Type badge */}
      <h3 className="font-mono text-[11px] tracking-[0.15em] text-j-info uppercase mb-2">
        {RESOURCE_TYPE_LABELS[data.resourceType] ?? data.resourceType}
      </h3>
      <h2 className="text-lg font-medium text-j-text mb-4">{data.title}</h2>

      {/* Link */}
      {data.url && (
        <div className="mb-6">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.15em] text-j-info uppercase hover:text-j-accent transition-colors"
          >
            {language === 'es' ? 'Abrir recurso →' : 'Open resource →'}
          </a>
        </div>
      )}

      <p className="text-xs text-j-text-tertiary">
        {language === 'es'
          ? 'Este recurso esta conectado a conceptos de tu sistema.'
          : 'This resource is connected to concepts in your system.'}
      </p>
    </>
  );
}
