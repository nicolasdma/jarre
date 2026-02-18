import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { extractConceptData, parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { ReviewEvaluationSchema, RubricEvaluationSchema } from '@/lib/llm/schemas';
import {
  buildReviewEvaluationPrompt,
  getReviewSystemPrompt,
  buildRubricReviewPrompt,
  getRubricSystemPrompt,
  getDomainForPhase,
} from '@/lib/llm/review-prompts';
import { scoreToRating, deriveFromRubric } from '@/lib/spaced-repetition';
import {
  scheduleFSRS,
  createNewFSRSCard,
  migrateFromSM2,
  extractFSRSCard,
  fsrsCardToDbColumns,
  intervalDaysFromDue,
  reviewRatingToFSRSGrade,
} from '@/lib/fsrs';
import { canAdvanceFromMicroTests, MICRO_TEST_THRESHOLD, buildMasteryHistoryRecord } from '@/lib/mastery';
import { getRubricForQuestionType } from '@/lib/llm/rubrics';
import { awardXP } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import { logTokenUsage } from '@/lib/db/token-usage';
import type { QuestionBankType, ReviewRating } from '@/types';
import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const log = createLogger('Review/Submit');

/**
 * POST /api/review/submit
 * Evaluates user answer. Supports both question_bank and concept_cards.
 *
 * Body:
 *   For questions: { questionId, userAnswer?, selectedAnswer?, confidence? }
 *   For concept cards: { cardId, selfRating?, selectedAnswer?, userAnswer? }
 *
 * Returns: { score, feedback, isCorrect, expectedAnswer, rating, nextReviewAt, intervalDays,
 *            dimensionScores?, reasoning?, masteryAdvanced? }
 */
export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { questionId, cardId, userAnswer, selectedAnswer, selfRating, confidence } = body;

    if (!questionId && !cardId) {
      return NextResponse.json({ error: 'Missing questionId or cardId' }, { status: 400 });
    }

    // ========================================================================
    // CONCEPT CARD PATH: deterministic or self-rated grading
    // ========================================================================
    if (cardId) {
      return handleConceptCardSubmit({
        supabase,
        userId: user.id,
        cardId,
        selfRating,
        selectedAnswer,
        userAnswer,
      });
    }

    // Validate optional confidence (1-3)
    const confidenceLevel: number | null =
      confidence != null && [1, 2, 3].includes(confidence) ? confidence : null;

    // Fetch the question with format + grading fields
    const { data: question, error: qError } = await supabase
      .from(TABLES.questionBank)
      .select('id, question_text, expected_answer, concept_id, type, format, correct_answer, explanation, options, concepts!concept_id(name, phase)')
      .eq('id', questionId)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const conceptData = extractConceptData(question.concepts);
    const conceptName = conceptData?.name || question.concept_id;
    const conceptPhase = conceptData?.phase ?? 1;
    const questionType = question.type as QuestionBankType;
    const format = (question.format as string) || 'open';

    // ========================================================================
    // MC/TF: Deterministic grading — no DeepSeek call
    // ========================================================================
    if (format === 'mc' || format === 'tf') {
      if (!selectedAnswer) {
        return NextResponse.json({ error: 'Missing selectedAnswer for MC/TF question' }, { status: 400 });
      }

      const isCorrect = selectedAnswer === question.correct_answer;
      const rating: ReviewRating = isCorrect ? 'easy' : 'wrong';
      const score = isCorrect ? 100 : 0;
      const feedback = question.explanation || '';

      // FSRS schedule update
      const smResult = await applyScheduleAndMastery({
        supabase,
        userId: user.id,
        questionId,
        conceptId: question.concept_id,
        rating,
        isCorrect,
        confidenceLevel,
      });

      log.info(
        `MC/TF: question=${questionId}, format=${format}, correct=${isCorrect}, interval=${smResult.intervalDays}d`
      );

      // Award XP (fire-and-forget)
      let xpResult = null;
      if (isCorrect) {
        xpResult = await awardXP(supabase, user.id, XP_REWARDS.REVIEW_CORRECT, 'review_correct', questionId);
        if (smResult.masteryAdvanced) {
          await awardXP(supabase, user.id, XP_REWARDS.MASTERY_ADVANCE, 'mastery_advance', question.concept_id);
        }
      }

      return NextResponse.json({
        score,
        feedback,
        isCorrect,
        expectedAnswer: question.correct_answer,
        rating,
        nextReviewAt: smResult.nextReviewAt,
        intervalDays: smResult.intervalDays,
        masteryAdvanced: smResult.masteryAdvanced,
        xp: xpResult,
      });
    }

    // ========================================================================
    // Open: DeepSeek rubric evaluation (existing flow)
    // ========================================================================
    if (!userAnswer?.trim()) {
      return NextResponse.json({ error: 'Missing userAnswer for open question' }, { status: 400 });
    }

    // Get user language
    const language = await getUserLanguage(supabase, user.id);

    let score: number;
    let feedback: string;
    let isCorrect: boolean;
    let rating: ReviewRating;
    let dimensionScores: Record<string, number> | undefined;
    let reasoning: string | undefined;
    let tokensUsed: number;

    const rubric = getRubricForQuestionType(questionType);
    const rubricPrompt = buildRubricReviewPrompt({
      conceptName,
      questionText: question.question_text,
      expectedAnswer: question.expected_answer,
      userAnswer,
      rubric,
      language,
    });

    const { content: rubricContent, tokensUsed: rubricTokens } = await callDeepSeek({
      messages: [
        { role: 'system', content: getRubricSystemPrompt({ language, domain: getDomainForPhase(conceptPhase, language) }) },
        { role: 'user', content: rubricPrompt },
      ],
      temperature: 0,
      maxTokens: 500,
      responseFormat: 'json',
    });
    tokensUsed = rubricTokens;

    try {
      const rubricResult = parseJsonResponse(rubricContent, RubricEvaluationSchema);
      const derived = deriveFromRubric(rubricResult.scores);

      score = derived.normalizedScore;
      feedback = rubricResult.feedback;
      isCorrect = derived.isCorrect;
      rating = derived.rating;
      dimensionScores = rubricResult.scores;
      reasoning = rubricResult.reasoning;

      log.info(
        `Rubric eval: question=${questionId}, type=${questionType}, ` +
        `scores=${JSON.stringify(rubricResult.scores)}, total=${derived.total}, rating=${rating}`
      );
    } catch (rubricParseError) {
      log.warn('Rubric parse failed, falling back to legacy prompt:', rubricParseError);

      const legacyPrompt = buildReviewEvaluationPrompt({
        questionText: question.question_text,
        expectedAnswer: question.expected_answer,
        userAnswer,
        language,
      });

      const { content: legacyContent, tokensUsed: legacyTokens } = await callDeepSeek({
        messages: [
          { role: 'system', content: getReviewSystemPrompt(language) },
          { role: 'user', content: legacyPrompt },
        ],
        temperature: 0.1,
        maxTokens: 300,
        responseFormat: 'json',
      });

      const legacyResult = parseJsonResponse(legacyContent, ReviewEvaluationSchema);
      tokensUsed += legacyTokens;

      score = legacyResult.score;
      feedback = legacyResult.feedback;
      isCorrect = legacyResult.isCorrect;
      rating = scoreToRating(legacyResult.score);
    }

    // FSRS schedule update + mastery check
    const smResult = await applyScheduleAndMastery({
      supabase,
      userId: user.id,
      questionId,
      conceptId: question.concept_id,
      rating,
      isCorrect,
      confidenceLevel,
    });

    logTokenUsage({ userId: user.id, category: 'review', tokens: tokensUsed });

    log.info(
      `Open: question=${questionId}, score=${score}, rating=${rating}, interval=${smResult.intervalDays}d, tokens=${tokensUsed}`
    );

    // Award XP (fire-and-forget)
    let xpResult = null;
    if (isCorrect) {
      xpResult = await awardXP(supabase, user.id, XP_REWARDS.REVIEW_CORRECT_OPEN, 'review_correct_open', questionId);
      if (smResult.masteryAdvanced) {
        await awardXP(supabase, user.id, XP_REWARDS.MASTERY_ADVANCE, 'mastery_advance', question.concept_id);
      }
    }

    return NextResponse.json({
      score,
      feedback,
      isCorrect,
      expectedAnswer: question.expected_answer,
      rating,
      nextReviewAt: smResult.nextReviewAt,
      intervalDays: smResult.intervalDays,
      masteryAdvanced: smResult.masteryAdvanced,
      dimensionScores,
      reasoning,
      xp: xpResult,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate review answer' },
      { status: 500 }
    );
  }
});

// ============================================================================
// Shared FSRS + Mastery Logic (extracted to avoid duplication between paths)
// ============================================================================

interface ScheduleParams {
  supabase: SupabaseClient;
  userId: string;
  questionId: string;
  conceptId: string;
  rating: ReviewRating;
  isCorrect: boolean;
  confidenceLevel: number | null;
}

async function applyScheduleAndMastery({
  supabase,
  userId,
  questionId,
  conceptId,
  rating,
  isCorrect,
  confidenceLevel,
}: ScheduleParams) {
  const now = new Date();

  // Fetch existing review_schedule state (including FSRS columns)
  // Cast needed because Supabase types don't know about new FSRS columns yet
  interface ScheduleRow {
    ease_factor: number;
    interval_days: number;
    repetition_count: number;
    streak: number;
    correct_count: number;
    incorrect_count: number;
    fsrs_stability: number | null;
    fsrs_difficulty: number | null;
    fsrs_state: number | null;
    fsrs_reps: number | null;
    fsrs_lapses: number | null;
    fsrs_last_review: string | null;
    next_review_at: string;
    last_reviewed_at: string | null;
  }

  const { data: rawSchedule } = await supabase
    .from(TABLES.reviewSchedule)
    .select(
      'ease_factor, interval_days, repetition_count, streak, correct_count, incorrect_count, ' +
      'fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_last_review, ' +
      'next_review_at, last_reviewed_at'
    )
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();

  const schedule = rawSchedule as unknown as ScheduleRow | null;

  // Get or create FSRS card
  let fsrsCard = schedule ? extractFSRSCard({
    ...schedule,
    next_review_at: schedule.next_review_at ?? now.toISOString(),
  }) : null;

  // Lazy migration: if has SM-2 state but no FSRS state, migrate
  if (!fsrsCard && schedule && schedule.repetition_count > 0) {
    fsrsCard = migrateFromSM2({
      ease_factor: schedule.ease_factor,
      interval_days: schedule.interval_days,
      repetition_count: schedule.repetition_count,
      streak: schedule.streak,
      correct_count: schedule.correct_count,
      incorrect_count: schedule.incorrect_count,
      last_reviewed_at: schedule.last_reviewed_at,
    });
    log.info(`Lazy migrated SM-2 → FSRS for question=${questionId}`);
  }

  // If still no card (first ever review), create new
  if (!fsrsCard) {
    fsrsCard = createNewFSRSCard(now);
  }

  // Schedule with FSRS
  const grade = reviewRatingToFSRSGrade(rating);
  const result = scheduleFSRS(fsrsCard, grade, now);
  const newCard = result.card;
  const intervalDays = intervalDaysFromDue(newCard.due, now);

  // Update streak/counts (maintained separately from FSRS)
  const currentStreak = schedule?.streak ?? 0;
  const currentCorrect = schedule?.correct_count ?? 0;
  const currentIncorrect = schedule?.incorrect_count ?? 0;

  const newStreak = rating === 'wrong' ? 0 : currentStreak + 1;
  const newCorrect = isCorrect ? currentCorrect + 1 : currentCorrect;
  const newIncorrect = isCorrect ? currentIncorrect : currentIncorrect + 1;

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    question_id: questionId,
    // SM-2 columns (maintained for backward compat)
    ease_factor: schedule?.ease_factor ?? 2.5,
    interval_days: intervalDays,
    repetition_count: (schedule?.repetition_count ?? 0) + 1,
    streak: newStreak,
    correct_count: newCorrect,
    incorrect_count: newIncorrect,
    // FSRS columns
    ...fsrsCardToDbColumns(newCard),
    // Shared columns
    next_review_at: newCard.due.toISOString(),
    last_reviewed_at: now.toISOString(),
    last_rating: rating,
  };
  if (confidenceLevel !== null) {
    upsertData.confidence_level = confidenceLevel;
  }

  const { error: upsertError } = await supabase
    .from(TABLES.reviewSchedule)
    .upsert(upsertData, { onConflict: 'user_id,question_id' });

  if (upsertError) {
    log.error('Error upserting schedule:', upsertError);
  }

  // Check micro-test mastery advancement (0->1) if answer was correct
  let masteryAdvanced = false;
  if (isCorrect) {
    const { count: correctCount } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('correct_count', 1)
      .in(
        'question_id',
        (
          await supabase
            .from(TABLES.questionBank)
            .select('id')
            .eq('concept_id', conceptId)
        ).data?.map((q) => q.id) || []
      );

    const totalCorrect = correctCount || 0;

    const { data: progress } = await supabase
      .from(TABLES.conceptProgress)
      .select('mastery_level')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    const currentLevel = parseMasteryLevel(progress?.mastery_level);

    if (canAdvanceFromMicroTests(currentLevel, totalCorrect)) {
      const { error: advanceError } = await supabase
        .from(TABLES.conceptProgress)
        .upsert(
          {
            user_id: userId,
            concept_id: conceptId,
            mastery_level: serializeMasteryLevel(1),
          },
          { onConflict: 'user_id,concept_id' }
        );

      if (!advanceError) {
        masteryAdvanced = true;

        await supabase.from(TABLES.masteryHistory).insert(
          buildMasteryHistoryRecord({
            userId,
            conceptId,
            oldLevel: currentLevel,
            newLevel: 1,
            triggerType: 'micro_test',
            triggerId: questionId,
          })
        );

        // Auto-enroll concept cards for this concept
        await enrollConceptCards(supabase, userId, conceptId);

        log.info(
          `Mastery advanced: ${conceptId} 0->1 (${totalCorrect}/${MICRO_TEST_THRESHOLD} correct micro-tests)`
        );
      }
    }
  }

  return {
    nextReviewAt: newCard.due.toISOString(),
    intervalDays,
    masteryAdvanced,
  };
}

// ============================================================================
// Concept Card Submit Handler
// ============================================================================

interface ConceptCardSubmitParams {
  supabase: SupabaseClient;
  userId: string;
  cardId: string;
  selfRating?: string;
  selectedAnswer?: string;
  userAnswer?: string;
}

async function handleConceptCardSubmit({
  supabase,
  userId,
  cardId,
  selfRating,
  selectedAnswer,
}: ConceptCardSubmitParams) {
  // Fetch the concept card
  const { data: card, error: cardError } = await supabase
    .from(TABLES.conceptCards)
    .select('id, concept_id, card_type, front_content, back_content, difficulty')
    .eq('id', cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const cardType = card.card_type as string;
  const backContent = card.back_content as Record<string, unknown>;
  let rating: ReviewRating;
  let isCorrect: boolean;
  let score: number;
  let feedback = '';

  // Grade based on card type
  switch (cardType) {
    case 'recall':
    case 'connect': {
      // Self-rated: user rates their own recall
      if (!selfRating || !['wrong', 'hard', 'good', 'easy'].includes(selfRating)) {
        return NextResponse.json({ error: 'Missing or invalid selfRating for recall/connect card' }, { status: 400 });
      }
      rating = selfRating as ReviewRating;
      isCorrect = rating !== 'wrong';
      score = rating === 'easy' ? 100 : rating === 'good' ? 80 : rating === 'hard' ? 60 : 0;
      feedback = (backContent.connection as string) || '';
      break;
    }

    case 'true_false': {
      if (!selectedAnswer) {
        return NextResponse.json({ error: 'Missing selectedAnswer for true_false card' }, { status: 400 });
      }
      const frontContent = card.front_content as { isTrue: boolean };
      const expectedAnswer = frontContent.isTrue ? 'true' : 'false';
      isCorrect = selectedAnswer.toLowerCase() === expectedAnswer;
      rating = isCorrect ? 'good' : 'wrong';
      score = isCorrect ? 100 : 0;
      feedback = (backContent.explanation as string) || '';
      break;
    }

    case 'fill_blank': {
      if (!selectedAnswer) {
        return NextResponse.json({ error: 'Missing selectedAnswer for fill_blank card' }, { status: 400 });
      }
      const expectedBlanks = backContent.blanks as string[];
      // Simple match: check if user answer contains the key terms (case-insensitive)
      const userLower = selectedAnswer.toLowerCase();
      const matchCount = expectedBlanks.filter(
        (blank) => userLower.includes(blank.toLowerCase())
      ).length;
      isCorrect = matchCount >= Math.ceil(expectedBlanks.length / 2);
      rating = matchCount === expectedBlanks.length ? 'good' : isCorrect ? 'hard' : 'wrong';
      score = Math.round((matchCount / expectedBlanks.length) * 100);
      feedback = (backContent.explanation as string) || '';
      break;
    }

    case 'scenario_micro': {
      if (!selectedAnswer) {
        return NextResponse.json({ error: 'Missing selectedAnswer for scenario_micro card' }, { status: 400 });
      }
      const correctAnswer = backContent.correct as string;
      isCorrect = selectedAnswer === correctAnswer;
      rating = isCorrect ? 'good' : 'wrong';
      score = isCorrect ? 100 : 0;
      feedback = (backContent.explanation as string) || '';
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown card type: ${cardType}` }, { status: 400 });
  }

  // FSRS schedule update for concept card
  const scheduleResult = await applyCardScheduleAndMastery({
    supabase,
    userId,
    cardId,
    conceptId: card.concept_id,
    rating,
    isCorrect,
  });

  log.info(
    `ConceptCard: card=${cardId}, type=${cardType}, rating=${rating}, interval=${scheduleResult.intervalDays}d`
  );

  // Award XP for correct answers
  let xpResult = null;
  if (isCorrect) {
    xpResult = await awardXP(supabase, userId, XP_REWARDS.REVIEW_CORRECT, 'review_correct', cardId);
  }

  return NextResponse.json({
    score,
    feedback,
    isCorrect,
    expectedAnswer: backContent.correct || JSON.stringify(backContent.blanks) || '',
    rating,
    nextReviewAt: scheduleResult.nextReviewAt,
    intervalDays: scheduleResult.intervalDays,
    masteryAdvanced: scheduleResult.masteryAdvanced,
    xp: xpResult,
  });
}

// ============================================================================
// Card-specific FSRS scheduling (similar to question-based but uses card_id)
// ============================================================================

interface CardScheduleParams {
  supabase: SupabaseClient;
  userId: string;
  cardId: string;
  conceptId: string;
  rating: ReviewRating;
  isCorrect: boolean;
}

async function applyCardScheduleAndMastery({
  supabase,
  userId,
  cardId,
  conceptId,
  rating,
  isCorrect,
}: CardScheduleParams) {
  const now = new Date();

  interface CardScheduleRow {
    fsrs_stability: number | null;
    fsrs_difficulty: number | null;
    fsrs_state: number | null;
    fsrs_reps: number | null;
    fsrs_lapses: number | null;
    fsrs_last_review: string | null;
    next_review_at: string;
    streak: number;
    correct_count: number;
    incorrect_count: number;
    repetition_count: number;
  }

  const { data: rawSchedule } = await supabase
    .from(TABLES.reviewSchedule)
    .select(
      'fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_last_review, ' +
      'next_review_at, streak, correct_count, incorrect_count, repetition_count'
    )
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .single();

  const schedule = rawSchedule as unknown as CardScheduleRow | null;

  let fsrsCard = schedule ? extractFSRSCard({
    ...schedule,
    next_review_at: schedule.next_review_at ?? now.toISOString(),
  }) : null;

  if (!fsrsCard) {
    fsrsCard = createNewFSRSCard(now);
  }

  const grade = reviewRatingToFSRSGrade(rating);
  const result = scheduleFSRS(fsrsCard, grade, now);
  const newCard = result.card;
  const intervalDays = intervalDaysFromDue(newCard.due, now);

  const newStreak = rating === 'wrong' ? 0 : (schedule?.streak ?? 0) + 1;
  const newCorrect = isCorrect ? (schedule?.correct_count ?? 0) + 1 : (schedule?.correct_count ?? 0);
  const newIncorrect = isCorrect ? (schedule?.incorrect_count ?? 0) : (schedule?.incorrect_count ?? 0) + 1;

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    card_id: cardId,
    ease_factor: 2.5,
    interval_days: intervalDays,
    repetition_count: (schedule?.repetition_count ?? 0) + 1,
    streak: newStreak,
    correct_count: newCorrect,
    incorrect_count: newIncorrect,
    ...fsrsCardToDbColumns(newCard),
    next_review_at: newCard.due.toISOString(),
    last_reviewed_at: now.toISOString(),
    last_rating: rating,
  };

  // Use card_id unique constraint for upsert
  const { error: upsertError } = await supabase
    .from(TABLES.reviewSchedule)
    .upsert(upsertData, { onConflict: 'user_id,card_id' });

  if (upsertError) {
    log.error('Error upserting card schedule:', upsertError);
  }

  return {
    nextReviewAt: newCard.due.toISOString(),
    intervalDays,
    masteryAdvanced: false,
  };
}

// ============================================================================
// Auto-enrollment: create review_schedule entries for concept_cards
// ============================================================================

/**
 * Enroll all active concept_cards for a concept into review_schedule.
 * Called when a user reaches mastery >= 1 for a concept.
 * Skips cards that are already enrolled.
 */
async function enrollConceptCards(
  supabase: SupabaseClient,
  userId: string,
  conceptId: string
) {
  // Get all active concept cards for this concept
  const { data: cards } = await supabase
    .from(TABLES.conceptCards)
    .select('id')
    .eq('concept_id', conceptId)
    .eq('is_active', true);

  if (!cards || cards.length === 0) return;

  // Get already enrolled card IDs
  const { data: existing } = await supabase
    .from(TABLES.reviewSchedule)
    .select('card_id')
    .eq('user_id', userId)
    .in('card_id', cards.map(c => c.id));

  const enrolledIds = new Set((existing || []).map(e => e.card_id));
  const now = new Date().toISOString();

  // Create schedule entries for unenrolled cards
  const newEntries = cards
    .filter(c => !enrolledIds.has(c.id))
    .map(c => ({
      user_id: userId,
      card_id: c.id,
      ease_factor: 2.5,
      interval_days: 0,
      repetition_count: 0,
      streak: 0,
      correct_count: 0,
      incorrect_count: 0,
      next_review_at: now,
      fsrs_state: 0,
      fsrs_reps: 0,
      fsrs_lapses: 0,
    }));

  if (newEntries.length === 0) return;

  const { error } = await supabase
    .from(TABLES.reviewSchedule)
    .insert(newEntries);

  if (error) {
    log.error(`Error enrolling concept cards for ${conceptId}:`, error);
  } else {
    log.info(`Enrolled ${newEntries.length} concept cards for ${conceptId}`);
  }
}
