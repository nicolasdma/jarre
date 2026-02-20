'use client';

import { useState, useEffect } from 'react';
import { DeckCard } from '@/components/review/deck-card';
import type { Language } from '@/lib/translations';

interface DeckConcept {
  conceptId: string;
  conceptName: string;
  phase: number;
  masteryLevel: number;
  isUnlocked: boolean;
  totalCards: number;
  dueCards: number;
  nextDueAt: string | null;
}

interface DeckStats {
  totalUnlocked: number;
  totalDue: number;
  totalCards: number;
  totalConcepts: number;
}

export function DeckOverview({ language }: { language: Language }) {
  const [deck, setDeck] = useState<DeckConcept[]>([]);
  const [stats, setStats] = useState<DeckStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeck() {
      try {
        const res = await fetch('/api/review/deck');
        if (!res.ok) throw new Error('Failed to fetch deck');
        const data = await res.json();
        setDeck(data.deck);
        setStats(data.stats);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeck();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-j-text-secondary animate-pulse">
          {language === 'es' ? 'Cargando deck...' : 'Loading deck...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-j-error">{error}</p>
      </div>
    );
  }

  // Group by phase
  const phases = new Map<number, DeckConcept[]>();
  for (const concept of deck) {
    const phase = concept.phase;
    if (!phases.has(phase)) phases.set(phase, []);
    phases.get(phase)!.push(concept);
  }

  const sortedPhases = [...phases.entries()].sort(([a], [b]) => a - b);

  return (
    <div>
      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl font-light text-j-accent">{stats.totalUnlocked}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {language === 'es' ? 'Desbloqueados' : 'Unlocked'}
            </p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl font-light text-j-text">{stats.totalConcepts}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {language === 'es' ? 'Total conceptos' : 'Total concepts'}
            </p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl font-light text-j-warm">{stats.totalDue}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {language === 'es' ? 'Pendientes hoy' : 'Due today'}
            </p>
          </div>
          <div className="text-center p-4 border border-j-border">
            <p className="text-3xl font-light text-j-text-secondary">{stats.totalCards}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {language === 'es' ? 'Tarjetas totales' : 'Total cards'}
            </p>
          </div>
        </div>
      )}

      {/* Phase groups */}
      {sortedPhases.map(([phase, concepts]) => (
        <div key={phase} className="mb-10">
          <h2 className="font-mono text-[11px] tracking-[0.15em] text-j-text-tertiary uppercase mb-4">
            Phase {phase}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {concepts.map(concept => (
              <DeckCard
                key={concept.conceptId}
                {...concept}
                language={language}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
