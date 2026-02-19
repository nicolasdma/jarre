import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { extractConceptData } from '@/lib/db/helpers';
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
import { scoreToRating, deriveFromRubric } from '@/lib/review-scoring';
import { applyScheduleAndMastery } from '@/lib/review/apply-schedule';
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
        itemType: 'question',
        itemId: questionId,
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
      itemType: 'question',
      itemId: questionId,
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
  const scheduleResult = await applyScheduleAndMastery({
    supabase,
    userId,
    itemType: 'card',
    itemId: cardId,
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

