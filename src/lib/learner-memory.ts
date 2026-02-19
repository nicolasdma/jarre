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
  analogies: string[];
  openQuestions: string[];
  personalExamples: string[];
  connectionsMade: string[];
}

interface UpdateMemoryParams {
  misconceptions?: string[];
  strengths?: string[];
  escalationLevel?: string;
  analogies?: string[];
  openQuestions?: string[];
  personalExamples?: string[];
  connectionsMade?: string[];
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
      .select('concept_id, misconceptions, strengths, escalation_level, analogies, open_questions, personal_examples, connections_made')
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
      analogies: string[];
      open_questions: string[];
      personal_examples: string[];
      connections_made: string[];
    }) => ({
      conceptId: row.concept_id,
      misconceptions: Array.isArray(row.misconceptions) ? row.misconceptions : [],
      strengths: Array.isArray(row.strengths) ? row.strengths : [],
      escalationLevel: row.escalation_level || 'pump',
      analogies: Array.isArray(row.analogies) ? row.analogies : [],
      openQuestions: Array.isArray(row.open_questions) ? row.open_questions : [],
      personalExamples: Array.isArray(row.personal_examples) ? row.personal_examples : [],
      connectionsMade: Array.isArray(row.connections_made) ? row.connections_made : [],
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
      .select('misconceptions, strengths, analogies, open_questions, personal_examples, connections_made')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    const existingMisconceptions: string[] = Array.isArray(existing?.misconceptions)
      ? existing.misconceptions
      : [];
    const existingStrengths: string[] = Array.isArray(existing?.strengths)
      ? existing.strengths
      : [];
    const existingAnalogies: string[] = Array.isArray(existing?.analogies)
      ? existing.analogies
      : [];
    const existingOpenQuestions: string[] = Array.isArray(existing?.open_questions)
      ? existing.open_questions
      : [];
    const existingPersonalExamples: string[] = Array.isArray(existing?.personal_examples)
      ? existing.personal_examples
      : [];
    const existingConnectionsMade: string[] = Array.isArray(existing?.connections_made)
      ? existing.connections_made
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
    const mergedAnalogies = deduplicate([
      ...existingAnalogies,
      ...(updates.analogies || []),
    ]);
    const mergedOpenQuestions = deduplicate([
      ...existingOpenQuestions,
      ...(updates.openQuestions || []),
    ]);
    const mergedPersonalExamples = deduplicate([
      ...existingPersonalExamples,
      ...(updates.personalExamples || []),
    ]);
    const mergedConnectionsMade = deduplicate([
      ...existingConnectionsMade,
      ...(updates.connectionsMade || []),
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
          analogies: mergedAnalogies,
          open_questions: mergedOpenQuestions,
          personal_examples: mergedPersonalExamples,
          connections_made: mergedConnectionsMade,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' },
      );

    if (error) {
      log.error(`Failed to update learner memory for concept ${conceptId}:`, error.message);
    } else {
      log.info(
        `Updated memory for concept ${conceptId}: ` +
        `${mergedMisconceptions.length} misconceptions, ${mergedStrengths.length} strengths, ` +
        `${mergedAnalogies.length} analogies, ${mergedOpenQuestions.length} open questions`,
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
  nameMap?: Record<string, string>,
): string | null {
  const withContent = memory.filter(
    (m) =>
      m.misconceptions.length > 0 ||
      m.strengths.length > 0 ||
      m.analogies.length > 0 ||
      m.openQuestions.length > 0 ||
      m.personalExamples.length > 0 ||
      m.connectionsMade.length > 0,
  );

  if (withContent.length === 0) return null;

  if (language === 'es') {
    let text = 'CONOCIMIENTO PREVIO DEL ESTUDIANTE:\n';

    for (const m of withContent) {
      text += `\nConcepto: ${nameMap?.[m.conceptId] ?? m.conceptId}\n`;
      if (m.misconceptions.length > 0) {
        text += `Misconceptions detectadas previamente:\n`;
        text += m.misconceptions.map((mc) => `- ${mc}`).join('\n') + '\n';
      }
      if (m.strengths.length > 0) {
        text += `Fortalezas demostradas:\n`;
        text += m.strengths.map((s) => `- ${s}`).join('\n') + '\n';
      }
      if (m.analogies.length > 0) {
        text += `Analogías que usa:\n`;
        text += m.analogies.map((a) => `- ${a}`).join('\n') + '\n';
      }
      if (m.openQuestions.length > 0) {
        text += `Preguntas abiertas:\n`;
        text += m.openQuestions.map((q) => `- ${q}`).join('\n') + '\n';
      }
      if (m.personalExamples.length > 0) {
        text += `Ejemplos personales:\n`;
        text += m.personalExamples.map((e) => `- ${e}`).join('\n') + '\n';
      }
      if (m.connectionsMade.length > 0) {
        text += `Conexiones descubiertas:\n`;
        text += m.connectionsMade.map((c) => `- ${c}`).join('\n') + '\n';
      }
    }

    text += '\nUsá esta información para adaptar tu approach. Probá específicamente las misconceptions conocidas para ver si fueron superadas.';
    return text;
  }

  let text = 'PRIOR KNOWLEDGE ABOUT THE STUDENT:\n';

  for (const m of withContent) {
    text += `\nConcept: ${nameMap?.[m.conceptId] ?? m.conceptId}\n`;
    if (m.misconceptions.length > 0) {
      text += `Previously detected misconceptions:\n`;
      text += m.misconceptions.map((mc) => `- ${mc}`).join('\n') + '\n';
    }
    if (m.strengths.length > 0) {
      text += `Demonstrated strengths:\n`;
      text += m.strengths.map((s) => `- ${s}`).join('\n') + '\n';
    }
    if (m.analogies.length > 0) {
      text += `Analogies they use:\n`;
      text += m.analogies.map((a) => `- ${a}`).join('\n') + '\n';
    }
    if (m.openQuestions.length > 0) {
      text += `Open questions:\n`;
      text += m.openQuestions.map((q) => `- ${q}`).join('\n') + '\n';
    }
    if (m.personalExamples.length > 0) {
      text += `Personal examples:\n`;
      text += m.personalExamples.map((e) => `- ${e}`).join('\n') + '\n';
    }
    if (m.connectionsMade.length > 0) {
      text += `Connections they've made:\n`;
      text += m.connectionsMade.map((c) => `- ${c}`).join('\n') + '\n';
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
