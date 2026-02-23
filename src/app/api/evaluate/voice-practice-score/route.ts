/**
 * POST /api/evaluate/voice-practice-score
 *
 * Scores a voice practice session by analyzing transcripts with DeepSeek.
 * Body: { voiceSessionId: string }
 *
 * Unlike voice-score, this does NOT save to evaluations or update mastery.
 * It only returns scores to determine if the student passes the gate (>=70%).
 * Now also returns consolidation content and updates learner memory.
 *
 * Flow:
 * 1. Fetch transcripts from voice_transcripts
 * 2. Fetch concepts from the linked resource
 * 3. Validate minimum conversation (>=3 user turns, >=2 min — less strict than eval)
 * 4. Call DeepSeek with practice scoring prompt
 * 5. Generate consolidation content
 * 6. Update learner concept memory
 * 7. Return: { responses, overallScore, summary, passedGate, consolidation }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { VoicePracticeScoringResponseSchema, ConsolidationResponseSchema } from '@/lib/llm/schemas';
import { buildVoicePracticeScoringPrompt } from '@/lib/llm/voice-practice-prompts';
import { buildConsolidationPrompt } from '@/lib/llm/consolidation-prompts';
import { updateLearnerConceptMemory } from '@/lib/learner-memory';
import { logTokenUsage } from '@/lib/db/token-usage';
import { TOKEN_BUDGETS } from '@/lib/constants';

const log = createLogger('Evaluate/VoicePracticeScore');

const MIN_USER_TURNS = 3;
const MIN_DURATION_SECONDS = 120; // 2 minutes
const PRACTICE_GATE_SCORE = 70;

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

    if (session.session_type !== 'practice') {
      throw badRequest('Voice session is not a practice session');
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

    // 3. Validate minimum conversation quality (less strict than eval)
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
    const scoringPrompt = buildVoicePracticeScoringPrompt({
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
      maxTokens: TOKEN_BUDGETS.VOICE_SCORING,
      responseFormat: 'json',
    });

    const parsed = parseJsonResponse(content, VoicePracticeScoringResponseSchema);
    const overallScore = Math.round(parsed.overallScore);
    const passedGate = overallScore >= PRACTICE_GATE_SCORE;

    logTokenUsage({ userId: user.id, category: 'voice_practice_score', tokens: tokensUsed });

    // 7. Update learner concept memory (parallel with consolidation)
    const memoryPromises = parsed.responses.map((r, i) => {
      const concept = concepts[i];
      if (!concept) return Promise.resolve();
      return updateLearnerConceptMemory(supabase, user.id, concept.id, {
        misconceptions: r.misconceptions || [],
        strengths: r.strengths || [],
      });
    });

    // 8. Generate simplified consolidation for practice
    const transcriptText = transcripts
      .map((t: { role: string; text: string }) =>
        `[${t.role === 'user' ? 'STUDENT' : 'MENTOR'}]: ${t.text}`
      )
      .join('\n');

    const consolidationPromise = callDeepSeek({
      messages: [{
        role: 'user',
        content: buildConsolidationPrompt({
          transcript: transcriptText,
          conceptScores: parsed.responses.map((r, i) => ({
            conceptName: concepts[i]?.name || `Concept ${i}`,
            conceptDefinition: concepts[i]?.definition || '',
            score: r.score,
            feedback: r.feedback,
            misconceptions: r.misconceptions || [],
          })),
          language,
        }),
      }],
      temperature: 0.3,
      maxTokens: TOKEN_BUDGETS.VOICE_CONSOLIDATION,
      responseFormat: 'json',
    }).then(({ content: consolContent, tokensUsed: consolTokens }) => {
      logTokenUsage({ userId: user.id, category: 'voice_practice_consolidation', tokens: consolTokens });
      return parseJsonResponse(consolContent, ConsolidationResponseSchema);
    }).catch((err) => {
      log.error('Failed to generate practice consolidation:', err);
      return null;
    });

    const [, consolidationResult] = await Promise.all([
      Promise.all(memoryPromises),
      consolidationPromise,
    ]);

    // Persist full practice result as JSONB snapshot (fire-and-forget)
    const practiceResultPayload = {
      responses: parsed.responses,
      overallScore,
      summary: parsed.summary,
      passedGate,
      consolidation: consolidationResult?.consolidation || [],
    };

    supabase
      .from(TABLES.voiceSessions)
      .update({ practice_result: practiceResultPayload })
      .eq('id', voiceSessionId)
      .eq('user_id', user.id)
      .then(({ error: updateErr }) => {
        if (updateErr) log.error(`Failed to persist practice_result for session ${voiceSessionId}:`, updateErr.message);
      });

    log.info(
      `Voice practice scored for session ${voiceSessionId}, ` +
      `score: ${overallScore}, passedGate: ${passedGate}, concepts: ${concepts.length}, tokens: ${tokensUsed}`
    );

    return jsonOk({
      responses: parsed.responses,
      overallScore,
      summary: parsed.summary,
      passedGate,
      tokensUsed,
      consolidation: consolidationResult?.consolidation || [],
    });
  } catch (error) {
    log.error('Error scoring voice practice:', error);
    return errorResponse(error);
  }
});
