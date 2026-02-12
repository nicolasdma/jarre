import { withAuth } from '@/lib/api/middleware';
import { ApiError, badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { EvaluateAnswersResponseSchema } from '@/lib/llm/schemas';
import { buildEvaluateAnswersPrompt, getSystemPrompt, PROMPT_VERSIONS } from '@/lib/llm/prompts';
import { computeNewLevelFromEvaluation, buildMasteryHistoryRecord } from '@/lib/mastery';
import { awardXP } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import type { EvaluationType } from '@/types';

const log = createLogger('Evaluate/Submit');

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    // Get user's language preference
    const language = await getUserLanguage(supabase, user.id);

    const body = await request.json();
    const { resourceId, resourceTitle, questions, userId, predictedScore } = body;

    if (!resourceId || !questions?.length || !userId) {
      throw badRequest('Missing required fields');
    }

    // Verify user matches
    if (user.id !== userId) {
      throw new ApiError(403, 'User mismatch');
    }

    // Build prompt
    const userPrompt = buildEvaluateAnswersPrompt({
      resourceTitle,
      questions: questions.map((q: {
        type: string;
        question: string;
        conceptName: string;
        conceptDefinition: string;
        userAnswer: string;
      }) => ({
        type: q.type,
        question: q.question,
        conceptName: q.conceptName,
        conceptDefinition: q.conceptDefinition,
        userAnswer: q.userAnswer,
      })),
      language,
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: getSystemPrompt(language) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // More deterministic for evaluation
      maxTokens: 2000,
      responseFormat: 'json',
    });

    // Parse and validate response
    const parsed = parseJsonResponse(content, EvaluateAnswersResponseSchema);

    // Save evaluation to database
    const { data: evaluation, error: evalError } = await supabase
      .from(TABLES.evaluations)
      .insert({
        user_id: user.id,
        resource_id: resourceId,
        status: 'completed',
        overall_score: Math.round(parsed.overallScore),
        predicted_score: predictedScore ?? null,
        prompt_version: PROMPT_VERSIONS.EVALUATE_ANSWERS,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (evalError) {
      log.error('Error saving evaluation:', evalError);
      // Continue anyway - user should see results
    }

    // Save questions and responses, update mastery
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

        // Update concept progress with new mastery logic
        if (r && q.conceptName) {
          const { data: concept } = await supabase
            .from(TABLES.concepts)
            .select('id')
            .eq('name', q.conceptName)
            .single();

          if (concept) {
            const { data: existingProgress } = await supabase
              .from(TABLES.conceptProgress)
              .select('level')
              .eq('user_id', user.id)
              .eq('concept_id', concept.id)
              .single();

            const currentLevel = parseMasteryLevel(existingProgress?.level);
            const questionType = q.type as EvaluationType;
            const newLevel = computeNewLevelFromEvaluation(currentLevel, questionType, r.score);

            if (newLevel > currentLevel) {
              // Build update fields based on which level we're advancing to
              const updateFields: Record<string, unknown> = {
                user_id: user.id,
                concept_id: concept.id,
                level: serializeMasteryLevel(newLevel),
                last_evaluated_at: new Date().toISOString(),
              };

              if (newLevel === 1) {
                updateFields.level_1_score = r.score;
              } else if (newLevel === 3) {
                updateFields.level_3_score = r.score;
              }

              await supabase.from(TABLES.conceptProgress).upsert(
                updateFields,
                { onConflict: 'user_id,concept_id' }
              );

              // Log mastery history
              await supabase.from(TABLES.masteryHistory).insert(
                buildMasteryHistoryRecord({
                  userId: user.id,
                  conceptId: concept.id,
                  oldLevel: currentLevel,
                  newLevel,
                  triggerType: 'evaluation',
                  triggerId: evaluation.id,
                })
              );

              // When advancing to level 1, create review_schedule entries
              // for this concept's questions in the question bank
              if (newLevel >= 1 && currentLevel < 1) {
                const { data: bankQuestions } = await supabase
                  .from(TABLES.questionBank)
                  .select('id')
                  .eq('concept_id', concept.id)
                  .eq('is_active', true);

                if (bankQuestions && bankQuestions.length > 0) {
                  const scheduleEntries = bankQuestions.map((bq) => ({
                    user_id: user.id,
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
            } else if (currentLevel === 0 && r.score < 60) {
              // Even if not advancing, ensure concept_progress exists at level 0
              await supabase.from(TABLES.conceptProgress).upsert(
                {
                  user_id: user.id,
                  concept_id: concept.id,
                  level: serializeMasteryLevel(0),
                  last_evaluated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,concept_id' }
              );
            }
          }
        }
      }

      // Update user profile stats
      await supabase
        .from(TABLES.userProfiles)
        .update({
          total_evaluations: (await supabase
            .from(TABLES.evaluations)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)).count || 0,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    log.info(`Completed evaluation for ${resourceId}, score: ${parsed.overallScore}, tokens: ${tokensUsed}`);

    // Award XP for evaluation (fire-and-forget)
    const xpResult = await awardXP(supabase, user.id, XP_REWARDS.EVALUATION_COMPLETE, 'evaluation_complete', evaluation?.id);
    if (Math.round(parsed.overallScore) >= 80) {
      await awardXP(supabase, user.id, XP_REWARDS.EVALUATION_HIGH_SCORE, 'evaluation_high_score', evaluation?.id);
    }

    return jsonOk({
      responses: parsed.responses,
      overallScore: Math.round(parsed.overallScore),
      summary: parsed.summary,
      evaluationId: evaluation?.id,
      tokensUsed,
      xp: xpResult,
    });
  } catch (error) {
    log.error('Error evaluating answers:', error);
    return errorResponse(error);
  }
});
