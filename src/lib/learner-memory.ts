/**
 * Jarre - Learner Concept Memory
 *
 * Stores and retrieves misconceptions/strengths detected in evaluations.
 * Used to personalize future tutoring, practice, and evaluation sessions.
 */

import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = createLogger('LearnerMemory');

// ============================================================================
// Types
// ============================================================================

export interface LearnerConceptMemory {
  conceptId: string;
  misconceptions: string[];
  strengths: string[];
  escalationLevel: string;
}

interface UpdateMemoryParams {
  misconceptions?: string[];
  strengths?: string[];
  escalationLevel?: string;
}

// ============================================================================
// Read
// ============================================================================

/**
 * Fetch learner memory for a set of concepts.
 * Returns empty array if no memory exists (graceful degradation).
 */
export async function getLearnerConceptMemory(
  supabase: SupabaseClient,
  userId: string,
  conceptIds: string[],
): Promise<LearnerConceptMemory[]> {
  if (conceptIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from(TABLES.learnerConceptMemory)
      .select('concept_id, misconceptions, strengths, escalation_level')
      .eq('user_id', userId)
      .in('concept_id', conceptIds);

    if (error) {
      log.error('Failed to fetch learner memory:', error.message);
      return [];
    }

    return (data || []).map((row: {
      concept_id: string;
      misconceptions: string[];
      strengths: string[];
      escalation_level: string;
    }) => ({
      conceptId: row.concept_id,
      misconceptions: Array.isArray(row.misconceptions) ? row.misconceptions : [],
      strengths: Array.isArray(row.strengths) ? row.strengths : [],
      escalationLevel: row.escalation_level || 'pump',
    }));
  } catch (err) {
    log.error('Unexpected error fetching learner memory:', err);
    return [];
  }
}

// ============================================================================
// Write
// ============================================================================

/**
 * Update learner memory for a concept after scoring.
 * Misconceptions and strengths ACCUMULATE (deduplicated), not replace.
 */
export async function updateLearnerConceptMemory(
  supabase: SupabaseClient,
  userId: string,
  conceptId: string,
  updates: UpdateMemoryParams,
): Promise<void> {
  try {
    // Fetch existing memory for this concept
    const { data: existing } = await supabase
      .from(TABLES.learnerConceptMemory)
      .select('misconceptions, strengths')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    const existingMisconceptions: string[] = Array.isArray(existing?.misconceptions)
      ? existing.misconceptions
      : [];
    const existingStrengths: string[] = Array.isArray(existing?.strengths)
      ? existing.strengths
      : [];

    // Accumulate and deduplicate
    const mergedMisconceptions = deduplicate([
      ...existingMisconceptions,
      ...(updates.misconceptions || []),
    ]);
    const mergedStrengths = deduplicate([
      ...existingStrengths,
      ...(updates.strengths || []),
    ]);

    const { error } = await supabase
      .from(TABLES.learnerConceptMemory)
      .upsert(
        {
          user_id: userId,
          concept_id: conceptId,
          misconceptions: mergedMisconceptions,
          strengths: mergedStrengths,
          escalation_level: updates.escalationLevel || 'pump',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' },
      );

    if (error) {
      log.error(`Failed to update learner memory for concept ${conceptId}:`, error.message);
    } else {
      log.info(
        `Updated memory for concept ${conceptId}: ` +
        `${mergedMisconceptions.length} misconceptions, ${mergedStrengths.length} strengths`,
      );
    }
  } catch (err) {
    log.error('Unexpected error updating learner memory:', err);
  }
}

// ============================================================================
// Format for Prompt Injection
// ============================================================================

/**
 * Convert learner memory into text suitable for system prompt injection.
 * Returns null if no meaningful memory exists.
 */
export function formatMemoryForPrompt(
  memory: LearnerConceptMemory[],
  language: 'en' | 'es' = 'en',
): string | null {
  const withContent = memory.filter(
    (m) => m.misconceptions.length > 0 || m.strengths.length > 0,
  );

  if (withContent.length === 0) return null;

  if (language === 'es') {
    let text = 'CONOCIMIENTO PREVIO DEL ESTUDIANTE:\n';

    for (const m of withContent) {
      text += `\nConcepto: ${m.conceptId}\n`;
      if (m.misconceptions.length > 0) {
        text += `Misconceptions detectadas previamente:\n`;
        text += m.misconceptions.map((mc) => `- ${mc}`).join('\n') + '\n';
      }
      if (m.strengths.length > 0) {
        text += `Fortalezas demostradas:\n`;
        text += m.strengths.map((s) => `- ${s}`).join('\n') + '\n';
      }
    }

    text += '\nUsá esta información para adaptar tu approach. Probá específicamente las misconceptions conocidas para ver si fueron superadas.';
    return text;
  }

  let text = 'PRIOR KNOWLEDGE ABOUT THE STUDENT:\n';

  for (const m of withContent) {
    text += `\nConcept: ${m.conceptId}\n`;
    if (m.misconceptions.length > 0) {
      text += `Previously detected misconceptions:\n`;
      text += m.misconceptions.map((mc) => `- ${mc}`).join('\n') + '\n';
    }
    if (m.strengths.length > 0) {
      text += `Demonstrated strengths:\n`;
      text += m.strengths.map((s) => `- ${s}`).join('\n') + '\n';
    }
  }

  text += '\nUse this information to adapt your approach. Specifically probe known misconceptions to see if they have been overcome.';
  return text;
}

// ============================================================================
// Helpers
// ============================================================================

function deduplicate(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
