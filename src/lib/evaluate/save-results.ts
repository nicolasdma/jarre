/**
 * Jarre - Shared Evaluation Results Saving
 *
 * Extracted from /api/evaluate/submit to be reusable by both
 * text-based and voice-based evaluation flows.
 *
 * Handles: evaluation record, questions, responses, mastery updates,
 * review schedule, user stats, and XP awards.
 */

import { TABLES } from '@/lib/db/tables';
import { parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { computeNewLevelFromEvaluation, buildMasteryHistoryRecord } from '@/lib/mastery';
import { awardXP } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';
import type { EvaluationType, MasteryTriggerType } from '@/types';
import type { EvaluateAnswersResponse } from '@/lib/llm/schemas';
import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const log = createLogger('Evaluate/SaveResults');

// ============================================================================
// Types
// ============================================================================

interface QuestionInput {
  conceptId?: string;
  conceptName?: string;
  type: string;
  question: string;
  userAnswer: string;
}

interface SaveEvaluationParams {
  supabase: SupabaseClient;
  userId: string;
  resourceId: string;
  parsed: EvaluateAnswersResponse;
  questions: QuestionInput[];
  predictedScore?: number | null;
  promptVersion: string;
  evalMethod: 'text' | 'voice';
  voiceSessionId?: string | null;
  triggerType?: MasteryTriggerType;
}

interface SaveEvaluationResult {
  evaluationId: string | null;
  saved: boolean;
  xp: Awaited<ReturnType<typeof awardXP>>;
}

// ============================================================================
// Main Function
// ============================================================================

export async function saveEvaluationResults({
  supabase,
  userId,
  resourceId,
  parsed,
  questions,
  predictedScore,
  promptVersion,
  evalMethod,
  voiceSessionId,
  triggerType = 'evaluation',
}: SaveEvaluationParams): Promise<SaveEvaluationResult> {
  // 1. Insert evaluation record
  const { data: evaluation, error: evalError } = await supabase
    .from(TABLES.evaluations)
    .insert({
      user_id: userId,
      resource_id: resourceId,
      status: 'completed',
      overall_score: Math.round(parsed.overallScore),
      predicted_score: predictedScore ?? null,
      prompt_version: promptVersion,
      completed_at: new Date().toISOString(),
      eval_method: evalMethod,
      voice_session_id: voiceSessionId ?? null,
    })
    .select()
    .single();

  if (evalError) {
    log.error('Error saving evaluation:', evalError);
  }

  // 2. Save questions, responses, and update mastery
  if (evaluation) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const r = parsed.responses.find((res) => res.questionIndex === i) || parsed.responses[i];

      // Insert question
      const { data: savedQuestion } = await supabase
        .from(TABLES.evaluationQuestions)
        .insert({
          evaluation_id: evaluation.id,
          concept_id: q.conceptId || null,
          type: q.type,
          question: q.question,
        })
        .select()
        .single();

      // Insert response
      if (savedQuestion && r) {
        await supabase.from(TABLES.evaluationResponses).insert({
          question_id: savedQuestion.id,
          user_answer: q.userAnswer,
          is_correct: r.isCorrect,
          score: r.score,
          feedback: r.feedback,
        });
      }

      // Update concept progress with mastery logic
      if (r && q.conceptName) {
        await updateConceptMastery({
          supabase,
          userId,
          conceptName: q.conceptName,
          questionType: q.type as EvaluationType,
          score: r.score,
          evaluationId: evaluation.id,
          triggerType,
        });
      }
    }

    // Update user profile stats
    await supabase
      .from(TABLES.userProfiles)
      .update({
        total_evaluations: (await supabase
          .from(TABLES.evaluations)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)).count || 0,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  // 3. Award XP
  const xpReward = evalMethod === 'voice' ? XP_REWARDS.VOICE_EVAL_COMPLETE : XP_REWARDS.EVALUATION_COMPLETE;
  const xpResult = await awardXP(supabase, userId, xpReward, 'evaluation_complete', evaluation?.id);
  if (Math.round(parsed.overallScore) >= 80) {
    await awardXP(supabase, userId, XP_REWARDS.EVALUATION_HIGH_SCORE, 'evaluation_high_score', evaluation?.id);
  }

  // 4. Log to consumption_log (fire-and-forget)
  supabase
    .from(TABLES.consumptionLog)
    .insert({
      user_id: userId,
      resource_id: resourceId,
      event_type: 'evaluated',
      metadata: {
        score: Math.round(parsed.overallScore),
        evalMethod,
        evaluationId: evaluation?.id,
      },
    })
    .then(({ error: logError }: { error: any }) => {
      if (logError) console.error('[Evaluate/SaveResults] Failed to log consumption:', logError.message);
    });

  return {
    evaluationId: evaluation?.id ?? null,
    saved: !evalError,
    xp: xpResult,
  };
}

// ============================================================================
// Helpers
// ============================================================================

async function updateConceptMastery({
  supabase,
  userId,
  conceptName,
  questionType,
  score,
  evaluationId,
  triggerType,
}: {
  supabase: SupabaseClient;
  userId: string;
  conceptName: string;
  questionType: EvaluationType;
  score: number;
  evaluationId: string;
  triggerType: MasteryTriggerType;
}) {
  const { data: concept } = await supabase
    .from(TABLES.concepts)
    .select('id')
    .eq('name', conceptName)
    .single();

  if (!concept) return;

  const { data: existingProgress } = await supabase
    .from(TABLES.conceptProgress)
    .select('level')
    .eq('user_id', userId)
    .eq('concept_id', concept.id)
    .single();

  const currentLevel = parseMasteryLevel(existingProgress?.level);
  const newLevel = computeNewLevelFromEvaluation(currentLevel, questionType, score);

  if (newLevel > currentLevel) {
    const updateFields: Record<string, unknown> = {
      user_id: userId,
      concept_id: concept.id,
      level: serializeMasteryLevel(newLevel),
      last_evaluated_at: new Date().toISOString(),
    };

    if (newLevel === 1) {
      updateFields.level_1_score = score;
    } else if (newLevel === 3) {
      updateFields.level_3_score = score;
    }

    await supabase.from(TABLES.conceptProgress).upsert(
      updateFields,
      { onConflict: 'user_id,concept_id' }
    );

    // Log mastery history
    await supabase.from(TABLES.masteryHistory).insert(
      buildMasteryHistoryRecord({
        userId,
        conceptId: concept.id,
        oldLevel: currentLevel,
        newLevel,
        triggerType,
        triggerId: evaluationId,
      })
    );

    // When advancing to level 1, create review_schedule entries
    if (newLevel >= 1 && currentLevel < 1) {
      const { data: bankQuestions } = await supabase
        .from(TABLES.questionBank)
        .select('id')
        .eq('concept_id', concept.id)
        .eq('is_active', true);

      if (bankQuestions && bankQuestions.length > 0) {
        const scheduleEntries = bankQuestions.map((bq: { id: string }) => ({
          user_id: userId,
          question_id: bq.id,
          next_review_at: new Date().toISOString(),
        }));

        const { error: schedError } = await supabase
          .from(TABLES.reviewSchedule)
          .upsert(scheduleEntries, { onConflict: 'user_id,question_id' });

        if (schedError) {
          log.error('Error creating review schedule:', schedError);
        } else {
          log.info(`Created ${scheduleEntries.length} review cards for concept ${concept.id}`);
        }
      }
    }
  } else if (currentLevel === 0 && score < 60) {
    // Even if not advancing, ensure concept_progress exists at level 0
    await supabase.from(TABLES.conceptProgress).upsert(
      {
        user_id: userId,
        concept_id: concept.id,
        level: serializeMasteryLevel(0),
        last_evaluated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,concept_id' }
    );
  }
}
