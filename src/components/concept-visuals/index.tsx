'use client';

import type { ComponentType } from 'react';

import { LeaderFollowerVisual } from './leader-follower';
import { SyncAsyncVisual } from './sync-async';
import { QuorumVisual } from './quorum';
import { ReplicationLagVisual } from './replication-lag';
import { FailoverVisual } from './failover';

// ============================================================================
// Registry
// ============================================================================

/**
 * Maps concept IDs to their interactive visual component.
 *
 * Supports two key formats:
 *   - "conceptId"            — matches any section for that concept
 *   - "conceptId:sortOrder"  — matches a specific section (takes priority)
 *
 * This allows multiple sections under the same concept (e.g. Ch5's
 * "replication") to each show a different visual.
 */
const VISUAL_REGISTRY: Record<string, ComponentType> = {
  // Section-specific visuals for DDIA Ch5 (all concept_id = replication)
  'replication:0': LeaderFollowerVisual,   // Líderes y Seguidores
  'replication:1': ReplicationLagVisual,   // Problemas con el Retraso
  'replication:2': FailoverVisual,         // Multi-Líder
  'replication:3': QuorumVisual,           // Sin Líder
  'replication:4': SyncAsyncVisual,        // Escrituras Concurrentes

  // Concept-level fallback
  'replication': LeaderFollowerVisual,
};

/** Resolve the registry key: section-specific first, then concept-level */
function resolveKey(conceptId: string, sectionIndex?: number): string | null {
  if (sectionIndex !== undefined) {
    const sectionKey = `${conceptId}:${sectionIndex}`;
    if (sectionKey in VISUAL_REGISTRY) return sectionKey;
  }
  if (conceptId in VISUAL_REGISTRY) return conceptId;
  return null;
}

/** Check if a concept/section has an interactive visual */
export function hasConceptVisual(conceptId: string, sectionIndex?: number): boolean {
  return resolveKey(conceptId, sectionIndex) !== null;
}

// ============================================================================
// Renderer
// ============================================================================

interface ConceptVisualProps {
  conceptId: string;
  sectionIndex?: number;
}

/**
 * Renders the interactive visual for a concept/section, if one exists.
 * Wraps in Jarre's design system container.
 */
export function ConceptVisual({ conceptId, sectionIndex }: ConceptVisualProps) {
  const key = resolveKey(conceptId, sectionIndex);
  if (!key) return null;

  const Component = VISUAL_REGISTRY[key];
  return (
    <div className="my-10 flex justify-center">
      <div className="w-full max-w-xl border border-[#e8e6e0] bg-[#faf9f6] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-[#c4a07a]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase">
            Visual
          </span>
        </div>
        <Component />
      </div>
    </div>
  );
}
