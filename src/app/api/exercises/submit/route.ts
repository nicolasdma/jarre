import { withAuth } from '@/lib/api/middleware';
import { jsonOk, badRequest } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Exercises/Submit');

/**
 * POST /api/exercises/submit
 * Records an exercise result.
 */
export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json();
  const { exerciseId, exerciseType, conceptId, sectionId, score, isCorrect, details, timeSpentSeconds } = body;

  if (!exerciseId || !exerciseType || score == null) {
    throw badRequest('Missing required fields');
  }

  // Get current attempt number
  const { count } = await supabase
    .from(TABLES.exerciseResults)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId);

  const attemptNumber = (count ?? 0) + 1;

  const { error } = await supabase.from(TABLES.exerciseResults).insert({
    user_id: user.id,
    exercise_id: exerciseId,
    section_id: sectionId ?? null,
    concept_id: conceptId ?? null,
    exercise_type: exerciseType,
    score,
    is_correct: isCorrect,
    details: details ?? {},
    attempt_number: attemptNumber,
    time_spent_seconds: timeSpentSeconds ?? null,
  });

  if (error) {
    log.error('Failed to save exercise result:', error);
    return jsonOk({ ok: false, error: error.message }, 500);
  }

  log.info(`Exercise ${exerciseId}: score=${score}, attempt=${attemptNumber}, time=${timeSpentSeconds}s`);
  return jsonOk({ ok: true, attemptNumber });
});
