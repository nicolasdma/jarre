/**
 * POST /api/evaluate/voice-teach-score
 *
 * Scores a teach-the-tutor voice session.
 * The student taught a concept to a confused AI junior.
 * Score >= 80 advances mastery from Level 3 → 4.
 *
 * Body: { voiceSessionId: string, conceptId: string }
 * Response: Same shape as voice-score
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { VoiceEvalScoringResponseSchema } from '@/lib/llm/schemas';
import { buildVoiceTeachScoringPrompt } from '@/lib/llm/voice-eval-prompts';
import { computeNewLevelFromTeaching, buildMasteryHistoryRecord } from '@/lib/mastery';
import { awardXP } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import { logTokenUsage } from '@/lib/db/token-usage';

const log = createLogger('Evaluate/VoiceTeachScore');

const MIN_USER_TURNS = 3;
const TEACH_PROMPT_VERSION = 'teach-v1.0.0';

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { voiceSessionId, conceptId } = body;

    if (!voiceSessionId || typeof voiceSessionId !== 'string') {
      throw badRequest('voiceSessionId is required');
    }
    if (!conceptId || typeof conceptId !== 'string') {
      throw badRequest('conceptId is required');
    }

    // 1. Fetch the voice session
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.voiceSessions)
      .select('id, session_type, user_id')
      .eq('id', voiceSessionId)
      .single();

    if (sessionError || !session) {
      throw badRequest('Voice session not found');
    }
    if (session.user_id !== user.id) {
      throw badRequest('Voice session does not belong to this user');
    }

    // 2. Fetch concept
    const { data: concept, error: conceptError } = await supabase
      .from(TABLES.concepts)
      .select('id, name, canonical_definition')
      .eq('id', conceptId)
      .single();

    if (conceptError || !concept) {
      throw badRequest('Concept not found');
    }

    // 3. Fetch transcripts
    const { data: transcripts, error: transcriptError } = await supabase
      .from(TABLES.voiceTranscripts)
      .select('role, text, timestamp')
      .eq('session_id', voiceSessionId)
      .order('timestamp', { ascending: true });

    if (transcriptError || !transcripts) {
      throw badRequest('Failed to fetch transcripts');
    }

    // 4. Validate minimum conversation
    const userTurns = transcripts.filter((t: { role: string }) => t.role === 'user').length;
    if (userTurns < MIN_USER_TURNS) {
      throw badRequest(
        `Insufficient conversation: ${userTurns} user turns (minimum ${MIN_USER_TURNS}).`
      );
    }

    // 5. Get language and score
    const language = await getUserLanguage(supabase, user.id);

    const scoringPrompt = buildVoiceTeachScoringPrompt({
      transcripts: transcripts.map((t: { role: 'user' | 'model'; text: string }) => ({
        role: t.role,
        text: t.text,
      })),
      concepts: [{
        name: concept.name,
        definition: concept.canonical_definition,
      }],
      language,
    });

    const { content, tokensUsed } = await callDeepSeek({
      messages: [{ role: 'user', content: scoringPrompt }],
      temperature: 0.1,
      maxTokens: 2000,
      responseFormat: 'json',
    });

    const parsed = parseJsonResponse(content, VoiceEvalScoringResponseSchema);
    const score = Math.round(parsed.overallScore);

    // 6. Check mastery advancement 3 → 4
    const { data: existingProgress } = await supabase
      .from(TABLES.conceptProgress)
      .select('level')
      .eq('user_id', user.id)
      .eq('concept_id', conceptId)
      .single();

    const currentLevel = parseMasteryLevel(existingProgress?.level);
    const newLevel = computeNewLevelFromTeaching(currentLevel, score);
    let masteryAdvanced = false;

    if (newLevel > currentLevel) {
      masteryAdvanced = true;

      await supabase.from(TABLES.conceptProgress).upsert(
        {
          user_id: user.id,
          concept_id: conceptId,
          level: serializeMasteryLevel(newLevel),
          last_evaluated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' }
      );

      await supabase.from(TABLES.masteryHistory).insert(
        buildMasteryHistoryRecord({
          userId: user.id,
          conceptId,
          oldLevel: currentLevel,
          newLevel,
          triggerType: 'teach_session',
          triggerId: voiceSessionId,
        })
      );

      // Award mastery advance XP
      await awardXP(supabase, user.id, XP_REWARDS.MASTERY_ADVANCE, 'mastery_advance', conceptId);
    }

    // Award XP for completing teach session
    const xpResult = await awardXP(supabase, user.id, XP_REWARDS.VOICE_EVAL_COMPLETE, 'teach_session_complete', voiceSessionId);

    logTokenUsage({ userId: user.id, category: 'voice_teach_score', tokens: tokensUsed });

    log.info(
      `Teach session scored: concept=${concept.name}, score=${score}, ` +
      `level ${currentLevel}→${newLevel}, tokens=${tokensUsed}`
    );

    return jsonOk({
      responses: parsed.responses,
      overallScore: score,
      summary: parsed.summary,
      tokensUsed,
      masteryAdvanced,
      previousLevel: currentLevel,
      newLevel,
      xp: xpResult,
    });
  } catch (error) {
    log.error('Error scoring teach session:', error);
    return errorResponse(error);
  }
});
