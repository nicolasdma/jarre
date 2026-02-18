/**
 * POST /api/evaluate/voice-score
 *
 * Scores a voice evaluation session by analyzing transcripts with DeepSeek.
 * Body: { voiceSessionId: string }
 * Response: Same shape as /api/evaluate/submit + consolidation + misconceptions
 *
 * Flow:
 * 1. Fetch transcripts from voice_transcripts
 * 2. Fetch concepts from the linked resource
 * 3. Validate minimum conversation (≥4 user turns, ≥3 min)
 * 4. Call DeepSeek with scoring prompt
 * 5. Save results via shared saveEvaluationResults
 * 6. Generate consolidation content (post-scoring)
 * 7. Update learner concept memory with misconceptions/strengths
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { VoiceEvalScoringResponseSchema, ConsolidationResponseSchema } from '@/lib/llm/schemas';
import { buildVoiceScoringPrompt } from '@/lib/llm/voice-eval-prompts';
import { buildConsolidationPrompt } from '@/lib/llm/consolidation-prompts';
import { saveEvaluationResults } from '@/lib/evaluate/save-results';
import { updateLearnerConceptMemory } from '@/lib/learner-memory';
import { logTokenUsage } from '@/lib/db/token-usage';

const log = createLogger('Evaluate/VoiceScore');

const MIN_USER_TURNS = 4;
const MIN_DURATION_SECONDS = 180; // 3 minutes
const VOICE_EVAL_PROMPT_VERSION = 'voice-v2.0.0';

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { voiceSessionId } = body;

    if (!voiceSessionId || typeof voiceSessionId !== 'string') {
      throw badRequest('voiceSessionId is required');
    }

    // 1. Fetch the voice session
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.voiceSessions)
      .select('id, resource_id, session_type, duration_seconds, user_id')
      .eq('id', voiceSessionId)
      .single();

    if (sessionError || !session) {
      throw badRequest('Voice session not found');
    }

    if (session.user_id !== user.id) {
      throw badRequest('Voice session does not belong to this user');
    }

    if (session.session_type !== 'evaluation') {
      throw badRequest('Voice session is not an evaluation session');
    }

    if (!session.resource_id) {
      throw badRequest('Voice session has no linked resource');
    }

    // 2. Fetch transcripts ordered by timestamp
    const { data: transcripts, error: transcriptError } = await supabase
      .from(TABLES.voiceTranscripts)
      .select('role, text, timestamp')
      .eq('session_id', voiceSessionId)
      .order('timestamp', { ascending: true });

    if (transcriptError || !transcripts) {
      throw badRequest('Failed to fetch transcripts');
    }

    // 3. Validate minimum conversation quality
    const userTurns = transcripts.filter((t: { role: string }) => t.role === 'user').length;
    if (userTurns < MIN_USER_TURNS) {
      throw badRequest(
        `Insufficient conversation: ${userTurns} user turns (minimum ${MIN_USER_TURNS}). The conversation needs to be longer for accurate scoring.`
      );
    }

    if (session.duration_seconds && session.duration_seconds < MIN_DURATION_SECONDS) {
      throw badRequest(
        `Session too short: ${session.duration_seconds}s (minimum ${MIN_DURATION_SECONDS}s). A longer conversation produces more accurate results.`
      );
    }

    // 4. Fetch concepts for the resource
    const { data: resourceConcepts, error: conceptsError } = await supabase
      .from(TABLES.resourceConcepts)
      .select(`
        concept_id,
        concepts:concept_id (id, name, canonical_definition)
      `)
      .eq('resource_id', session.resource_id)
      .eq('is_prerequisite', false);

    if (conceptsError || !resourceConcepts?.length) {
      throw badRequest('No concepts found for this resource');
    }

    const concepts = resourceConcepts.map((rc: any) => ({
      id: rc.concepts.id,
      name: rc.concepts.name,
      definition: rc.concepts.canonical_definition,
    }));

    // 5. Get user language
    const language = await getUserLanguage(supabase, user.id);

    // 6. Call DeepSeek for scoring
    const scoringPrompt = buildVoiceScoringPrompt({
      transcripts: transcripts.map((t: { role: 'user' | 'model'; text: string }) => ({
        role: t.role,
        text: t.text,
      })),
      concepts: concepts.map((c: { name: string; definition: string }) => ({
        name: c.name,
        definition: c.definition,
      })),
      language,
    });

    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'user', content: scoringPrompt },
      ],
      temperature: 0.1,
      maxTokens: 4000,
      responseFormat: 'json',
    });

    const parsed = parseJsonResponse(content, VoiceEvalScoringResponseSchema);

    // 7. Build question inputs for save-results (one per concept)
    const questions = concepts.map((concept: { id: string; name: string }, i: number) => {
      const modelTurns = transcripts.filter((t: { role: string }) => t.role === 'model');
      const relevantQuestion = modelTurns[Math.min(i, modelTurns.length - 1)]?.text || 'Oral evaluation question';

      const userResponses = transcripts
        .filter((t: { role: string }) => t.role === 'user')
        .map((t: { text: string }) => t.text);
      const relevantAnswer = userResponses.slice(
        Math.floor(i * userResponses.length / concepts.length),
        Math.floor((i + 1) * userResponses.length / concepts.length)
      ).join(' ') || 'No direct response captured';

      return {
        conceptId: concept.id,
        conceptName: concept.name,
        type: 'explanation' as const,
        question: relevantQuestion,
        userAnswer: relevantAnswer,
      };
    });

    // 8. Save results using shared logic
    const { evaluationId, saved, xp } = await saveEvaluationResults({
      supabase,
      userId: user.id,
      resourceId: session.resource_id,
      parsed,
      questions,
      promptVersion: VOICE_EVAL_PROMPT_VERSION,
      evalMethod: 'voice',
      voiceSessionId,
      triggerType: 'voice_evaluation',
    });

    logTokenUsage({ userId: user.id, category: 'voice_score', tokens: tokensUsed });

    // 9. Update learner concept memory (fire-and-forget, don't block response)
    const memoryPromises = parsed.responses.map((r, i) => {
      const concept = concepts[i];
      if (!concept) return Promise.resolve();
      return updateLearnerConceptMemory(supabase, user.id, concept.id, {
        misconceptions: r.misconceptions || [],
        strengths: r.strengths || [],
      });
    });

    // 10. Generate consolidation content (parallel with memory updates)
    const transcriptText = transcripts
      .map((t: { role: string; text: string }) =>
        `[${t.role === 'user' ? 'STUDENT' : 'EVALUATOR'}]: ${t.text}`
      )
      .join('\n');

    const consolidationPrompt = buildConsolidationPrompt({
      transcript: transcriptText,
      conceptScores: parsed.responses.map((r, i) => ({
        conceptName: concepts[i]?.name || `Concept ${i}`,
        conceptDefinition: concepts[i]?.definition || '',
        score: r.score,
        feedback: r.feedback,
        misconceptions: r.misconceptions || [],
      })),
      language,
    });

    const consolidationPromise = callDeepSeek({
      messages: [{ role: 'user', content: consolidationPrompt }],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: 'json',
    }).then(({ content: consolContent, tokensUsed: consolTokens }) => {
      logTokenUsage({ userId: user.id, category: 'voice_consolidation', tokens: consolTokens });
      return parseJsonResponse(consolContent, ConsolidationResponseSchema);
    }).catch((err) => {
      log.error('Failed to generate consolidation:', err);
      return null;
    });

    // Wait for both memory updates and consolidation
    const [, consolidationResult] = await Promise.all([
      Promise.all(memoryPromises),
      consolidationPromise,
    ]);

    log.info(
      `Voice evaluation scored for session ${voiceSessionId}, ` +
      `score: ${parsed.overallScore}, concepts: ${concepts.length}, tokens: ${tokensUsed}`
    );

    return jsonOk({
      responses: parsed.responses,
      overallScore: Math.round(parsed.overallScore),
      summary: parsed.summary,
      evaluationId,
      saved,
      tokensUsed,
      xp,
      consolidation: consolidationResult?.consolidation || [],
    });
  } catch (error) {
    log.error('Error scoring voice evaluation:', error);
    return errorResponse(error);
  }
});
