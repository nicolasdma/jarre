/**
 * POST /api/resources/exploration-summary
 *
 * Analyzes a voice exploration session transcript and generates:
 * - Session summary
 * - Discovered connections (new links to curriculum)
 * - Open questions
 * - Per-concept learner memory updates
 *
 * Body: { sessionId: string, userResourceId: string }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { ExplorationSummaryResponseSchema } from '@/lib/llm/schemas';
import { updateLearnerConceptMemory } from '@/lib/learner-memory';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS } from '@/lib/constants';

const log = createLogger('ExplorationSummary');

export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;
  const userResourceId = body?.userResourceId;

  if (!sessionId || typeof sessionId !== 'string') {
    throw badRequest('sessionId is required');
  }
  if (!userResourceId || typeof userResourceId !== 'string') {
    throw badRequest('userResourceId is required');
  }

  const admin = createAdminClient();

  // Fetch transcripts
  const { data: transcripts, error: txError } = await admin
    .from(TABLES.voiceTranscripts)
    .select('role, text, timestamp')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (txError || !transcripts || transcripts.length === 0) {
    log.info(`No transcripts for session ${sessionId}`);
    return jsonOk({ summary: null });
  }

  // Fetch resource info
  const { data: resource } = await supabase
    .from(TABLES.userResources)
    .select('title, type, summary')
    .eq('id', userResourceId)
    .single();

  // Fetch existing concept links
  const { data: existingLinks } = await supabase
    .from(TABLES.userResourceConcepts)
    .select('extracted_concept_name, concept_id')
    .eq('user_resource_id', userResourceId);

  // Fetch all curriculum concepts for linking
  const { data: allConcepts } = await admin
    .from(TABLES.concepts)
    .select('id, name, definition')
    .order('name');

  const conceptList = (allConcepts || [])
    .map((c) => `${c.id} | ${c.name} | ${c.definition || ''}`)
    .join('\n');

  // Build transcript text
  const transcriptText = transcripts
    .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
    .join('\n');

  // Call DeepSeek for analysis
  const { content: responseText, tokensUsed } = await callDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You analyze voice exploration session transcripts between a student and a tutor discussing an external resource.

Resource: "${resource?.title || 'Unknown'}" (${resource?.type || 'unknown'})
Resource summary: ${resource?.summary || 'N/A'}

Your task:
1. Write a concise summary of what was discussed (3-5 sentences).
2. Identify NEW connections discovered during the conversation that weren't in the original resource analysis. For each, specify which curriculum concept it connects to using the curriculum list below.
3. List open questions that emerged but weren't fully answered.
4. For each curriculum concept discussed, extract any misconceptions, strengths, analogies, personal examples, or connections the student made.

Curriculum concepts (id | name | definition):
${conceptList}

Return valid JSON matching the schema.`,
      },
      {
        role: 'user',
        content: `Transcript:\n${transcriptText}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.EXPLORATION_SUMMARY,
    responseFormat: 'json',
    timeoutMs: 60000,
  });

  const parsed = parseJsonResponse(responseText, ExplorationSummaryResponseSchema);

  // Log token usage
  logTokenUsage({ userId: user.id, category: 'exploration_summary', tokens: tokensUsed }).catch(() => {});

  // Save discovered connections as new edges
  if (parsed.discoveredConnections.length > 0) {
    const validIds = new Set((allConcepts || []).map((c) => c.id));
    const conceptNameToId = (allConcepts || []).reduce((acc, c) => {
      acc[c.name.toLowerCase()] = c.id;
      return acc;
    }, {} as Record<string, string>);

    for (const conn of parsed.discoveredConnections) {
      const conceptId = conceptNameToId[conn.curriculumConceptName.toLowerCase()];
      if (!conceptId || !validIds.has(conceptId)) continue;

      // Check if this link already exists
      const exists = (existingLinks || []).some(
        (l) => l.concept_id === conceptId && l.extracted_concept_name === conn.extractedConceptName
      );
      if (exists) continue;

      await supabase
        .from(TABLES.userResourceConcepts)
        .insert({
          user_resource_id: userResourceId,
          concept_id: conceptId,
          relationship: conn.relationship,
          relevance_score: 0.7,
          extracted_concept_name: conn.extractedConceptName,
          explanation: conn.explanation,
          source: 'voice_discovery',
        })
        .then(({ error }) => {
          if (error) log.warn('Failed to insert discovered connection:', error.message);
        });
    }
  }

  // Update learner memory per concept
  if (parsed.perConcept && parsed.perConcept.length > 0) {
    const conceptNameToId = (allConcepts || []).reduce((acc, c) => {
      acc[c.name.toLowerCase()] = c.id;
      return acc;
    }, {} as Record<string, string>);

    for (const pc of parsed.perConcept) {
      const conceptId = conceptNameToId[pc.conceptName.toLowerCase()];
      if (!conceptId) continue;

      await updateLearnerConceptMemory(supabase, user.id, conceptId, {
        misconceptions: pc.misconceptions,
        strengths: pc.strengths,
        analogies: pc.analogies,
        personalExamples: pc.personalExamples,
        connectionsMade: pc.connectionsMade,
      });
    }
  }

  // Log to consumption_log
  await supabase
    .from(TABLES.consumptionLog)
    .insert({
      user_id: user.id,
      user_resource_id: userResourceId,
      event_type: 'discussed',
      metadata: {
        sessionId,
        discoveredConnections: parsed.discoveredConnections.length,
        openQuestions: parsed.openQuestions.length,
      },
    });

  // Update voice session cached_summary
  await admin
    .from(TABLES.voiceSessions)
    .update({ cached_summary: parsed.summary })
    .eq('id', sessionId);

  log.info(`Exploration summary for session ${sessionId}: ${parsed.discoveredConnections.length} new connections, ${parsed.openQuestions.length} open questions`);

  return jsonOk({
    summary: parsed.summary,
    discoveredConnections: parsed.discoveredConnections,
    openQuestions: parsed.openQuestions,
  });
});
