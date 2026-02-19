/**
 * Jarre - Insight Generation Engine
 *
 * Analyzes the user's learning state and generates proactive suggestions:
 * 1. Mastery Catalyst: when an external resource can boost mastery of a concept
 * 2. Consolidation: when recent activities overlap on the same concepts
 * 3. Gap Detection: stale concepts, unresolved misconceptions, accumulated questions
 * 4. Debate Topics: for concepts at mastery >= 2
 */

import { TABLES } from '@/lib/db/tables';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = createLogger('InsightEngine');

// ============================================================================
// Types
// ============================================================================

interface InsightSuggestion {
  type: 'mastery_catalyst' | 'consolidation' | 'gap_detection' | 'debate_topic';
  title: string;
  description: string;
  actionType: 'evaluate' | 'explore' | 'freeform' | 'debate' | 'review';
  actionData: Record<string, unknown>;
  conceptIds: string[];
  priority: number;
}

// ============================================================================
// 1. Mastery Catalyst
// ============================================================================

/**
 * When a new external resource links to concepts with mastery < 3,
 * suggest using it as a catalyst for advancement.
 */
export async function generateMasteryCatalystInsights(
  supabase: SupabaseClient,
  userId: string,
  userResourceId: string,
): Promise<InsightSuggestion[]> {
  const suggestions: InsightSuggestion[] = [];

  // Fetch resource info + links
  const { data: resource } = await supabase
    .from(TABLES.userResources)
    .select('title, type')
    .eq('id', userResourceId)
    .single();

  if (!resource) return [];

  const { data: links } = await supabase
    .from(TABLES.userResourceConcepts)
    .select('concept_id, relationship, extracted_concept_name')
    .eq('user_resource_id', userResourceId);

  if (!links || links.length === 0) return [];

  // Fetch concept progress for linked concepts
  const conceptIds = links.map((l: any) => l.concept_id);
  const { data: progress } = await supabase
    .from(TABLES.conceptProgress)
    .select('concept_id, level')
    .eq('user_id', userId)
    .in('concept_id', conceptIds);

  const progressMap = (progress || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.concept_id] = parseInt(p.level) || 0;
    return acc;
  }, {});

  // Fetch concept names
  const { data: concepts } = await supabase
    .from(TABLES.concepts)
    .select('id, name')
    .in('id', conceptIds);

  const nameMap = (concepts || []).reduce((acc: Record<string, string>, c: any) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  // Find concepts at mastery 1-2 with extends/contrasts relationships
  for (const link of links) {
    const level = progressMap[link.concept_id] || 0;
    const relationship = link.relationship as string;

    if (level >= 1 && level <= 2 && ['extends', 'contrasts', 'applies'].includes(relationship)) {
      const conceptName = nameMap[link.concept_id] || 'Unknown';

      suggestions.push({
        type: 'mastery_catalyst',
        title: `${resource.title} → ${conceptName}`,
        description: `"${resource.title}" ofrece una perspectiva sobre ${conceptName} (Level ${level}). Podés usarlo para avanzar tu dominio.`,
        actionType: 'explore',
        actionData: { userResourceId, conceptId: link.concept_id },
        conceptIds: [link.concept_id],
        priority: level === 1 ? 0.7 : 0.8, // Higher priority for level 2
      });
    }
  }

  return suggestions;
}

// ============================================================================
// 2. Gap Detection
// ============================================================================

/**
 * Find concepts that need attention:
 * - Not evaluated in > 14 days
 * - Unresolved misconceptions (3+ sessions)
 * - Accumulated open questions
 */
export async function generateGapDetectionInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<InsightSuggestion[]> {
  const suggestions: InsightSuggestion[] = [];
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Find stale concepts (level > 0, not evaluated recently)
  const { data: staleProgress } = await supabase
    .from(TABLES.conceptProgress)
    .select('concept_id, level, last_evaluated_at')
    .eq('user_id', userId)
    .gt('level', 0)
    .lt('last_evaluated_at', twoWeeksAgo);

  const { data: concepts } = await supabase
    .from(TABLES.concepts)
    .select('id, name');

  const nameMap = (concepts || []).reduce((acc: Record<string, string>, c: any) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  // Stale concepts
  if (staleProgress && staleProgress.length > 0) {
    const staleNames = staleProgress
      .slice(0, 5)
      .map((p: any) => nameMap[p.concept_id] || 'Unknown');

    suggestions.push({
      type: 'gap_detection',
      title: staleNames.length === 1
        ? `${staleNames[0]} needs attention`
        : `${staleNames.length} concepts need attention`,
      description: `${staleNames.join(', ')} — no evaluados en más de 2 semanas.`,
      actionType: 'review',
      actionData: { conceptIds: staleProgress.map((p: any) => p.concept_id) },
      conceptIds: staleProgress.map((p: any) => p.concept_id),
      priority: 0.6,
    });
  }

  // Concepts with accumulated open questions
  const { data: memoryWithQuestions } = await supabase
    .from(TABLES.learnerConceptMemory)
    .select('concept_id, open_questions, misconceptions')
    .eq('user_id', userId);

  const withQuestions = (memoryWithQuestions || []).filter((m: any) =>
    Array.isArray(m.open_questions) && m.open_questions.length >= 2
  );

  if (withQuestions.length > 0) {
    const totalQuestions = withQuestions.reduce((sum: number, m: any) => sum + m.open_questions.length, 0);
    const cIds = withQuestions.map((m: any) => m.concept_id);
    const cNames = cIds.map((id: string) => nameMap[id] || 'Unknown').slice(0, 3);

    suggestions.push({
      type: 'gap_detection',
      title: `${totalQuestions} open questions`,
      description: `Tenés preguntas abiertas sobre ${cNames.join(', ')}. ¿Querés una sesión freeform para explorarlas?`,
      actionType: 'freeform',
      actionData: { conceptIds: cIds },
      conceptIds: cIds,
      priority: 0.7,
    });
  }

  // Concepts with unresolved misconceptions
  const withMisconceptions = (memoryWithQuestions || []).filter((m: any) =>
    Array.isArray(m.misconceptions) && m.misconceptions.length >= 2
  );

  if (withMisconceptions.length > 0) {
    const cIds = withMisconceptions.map((m: any) => m.concept_id);
    const cNames = cIds.map((id: string) => nameMap[id] || 'Unknown').slice(0, 3);
    const totalMisconceptions = withMisconceptions.reduce((sum: number, m: any) => sum + m.misconceptions.length, 0);

    suggestions.push({
      type: 'gap_detection',
      title: `${totalMisconceptions} unresolved misconceptions`,
      description: `Hay misconceptions persistentes sobre ${cNames.join(', ')}. Un debate podría ayudar a atacarlas.`,
      actionType: 'debate',
      actionData: { conceptIds: cIds },
      conceptIds: cIds,
      priority: 0.8,
    });
  }

  return suggestions;
}

// ============================================================================
// 3. Debate Topic Generation
// ============================================================================

const DebateTopicSchema = z.object({
  topics: z.array(z.object({
    topic: z.string().min(5),
    position: z.string().min(10),
    conceptIds: z.array(z.string()),
  })).min(1).max(3),
});

/**
 * Generate debate topics for concepts at mastery >= 2.
 */
export async function generateDebateTopicInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<InsightSuggestion[]> {
  // Find concepts at mastery >= 2
  const { data: advancedProgress } = await supabase
    .from(TABLES.conceptProgress)
    .select('concept_id, level')
    .eq('user_id', userId)
    .gte('level', 2);

  if (!advancedProgress || advancedProgress.length < 2) return [];

  const conceptIds = advancedProgress.map((p: any) => p.concept_id);
  const { data: concepts } = await supabase
    .from(TABLES.concepts)
    .select('id, name, definition')
    .in('id', conceptIds);

  if (!concepts || concepts.length < 2) return [];

  const conceptList = concepts
    .map((c: any) => `- ${c.id}: ${c.name} (${c.definition || 'no def'})`)
    .join('\n');

  try {
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: `Generate 1-2 provocative but defensible debate topics based on these technical concepts.
Each topic should be a specific technical claim that could be argued for or against.
The position should be deliberately controversial but grounded in real trade-offs.

Concepts (id: name):
${conceptList}

Return JSON with array of topics. Each topic has: topic (short title), position (the provocative claim to defend), conceptIds (array of relevant concept IDs from the list).`,
        },
        {
          role: 'user',
          content: 'Generate debate topics.',
        },
      ],
      temperature: 0.5,
      maxTokens: 1000,
      responseFormat: 'json',
    });

    const parsed = parseJsonResponse(content, DebateTopicSchema);

    logTokenUsage({ userId, category: 'insight_debate_topics', tokens: tokensUsed }).catch(() => {});

    return parsed.topics.map((t) => ({
      type: 'debate_topic' as const,
      title: t.topic,
      description: t.position,
      actionType: 'debate' as const,
      actionData: { topic: t.topic, position: t.position, conceptIds: t.conceptIds },
      conceptIds: t.conceptIds,
      priority: 0.5,
    }));
  } catch (err) {
    log.error('Failed to generate debate topics:', err);
    return [];
  }
}

// ============================================================================
// 4. Save Suggestions
// ============================================================================

/**
 * Save generated suggestions to the database.
 * Deduplicates by checking for existing pending suggestions of the same type/title.
 */
export async function saveInsightSuggestions(
  supabase: SupabaseClient,
  userId: string,
  suggestions: InsightSuggestion[],
): Promise<number> {
  if (suggestions.length === 0) return 0;

  let saved = 0;

  for (const s of suggestions) {
    // Check for duplicates
    const { data: existing } = await supabase
      .from(TABLES.insightSuggestions)
      .select('id')
      .eq('user_id', userId)
      .eq('type', s.type)
      .eq('title', s.title)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabase
      .from(TABLES.insightSuggestions)
      .insert({
        user_id: userId,
        type: s.type,
        title: s.title,
        description: s.description,
        action_type: s.actionType,
        action_data: s.actionData,
        concept_ids: s.conceptIds,
        priority: s.priority,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    if (!error) saved++;
  }

  log.info(`Saved ${saved}/${suggestions.length} insight suggestions for user ${userId}`);
  return saved;
}
