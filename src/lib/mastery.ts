/**
 * Jarre - Mastery Level Logic
 *
 * Central module for mastery level management.
 *
 * Levels:
 * 0 - Exposed:    Concept exists in concept_progress (created on resource open)
 * 1 - Understood: Score >= 60% on deep eval question for this concept
 * 2 - Applied:    Completed a project that maps to this concept
 * 3 - Criticized: Score >= 80% on tradeoff/error_detection question for this concept
 * 4 - Taught:     Manual (future: teach-the-tutor session)
 *
 * Levels are progressive: you need level N to reach level N+1.
 */

import type { MasteryLevel, EvaluationType, MasteryTriggerType } from '@/types';

// ============================================================================
// THRESHOLDS
// ============================================================================

export const MASTERY_THRESHOLDS = {
  LEVEL_1_SCORE: 60,
  LEVEL_3_SCORE: 80,
} as const;

/** Evaluation types that qualify for level 3 advancement */
export const LEVEL_3_QUESTION_TYPES: EvaluationType[] = ['tradeoff', 'error_detection'];

// ============================================================================
// LEVEL TRANSITION LOGIC
// ============================================================================

/**
 * Check if a concept can advance to level 1 based on an evaluation score.
 * Requires: current level is 0, score >= 60%.
 */
export function canAdvanceToLevel1(currentLevel: number, score: number): boolean {
  return currentLevel < 1 && score >= MASTERY_THRESHOLDS.LEVEL_1_SCORE;
}

/**
 * Check if a concept can advance to level 2 based on project completion.
 * Requires: current level is 1 (understood).
 */
export function canAdvanceToLevel2(currentLevel: number): boolean {
  return currentLevel === 1;
}

/**
 * Check if a concept can advance to level 3 based on a tradeoff/error_detection score.
 * Requires: current level is 2 (applied), question type is tradeoff or error_detection,
 * score >= 80%.
 */
export function canAdvanceToLevel3(
  currentLevel: number,
  questionType: EvaluationType,
  score: number
): boolean {
  return (
    currentLevel === 2 &&
    LEVEL_3_QUESTION_TYPES.includes(questionType) &&
    score >= MASTERY_THRESHOLDS.LEVEL_3_SCORE
  );
}

/**
 * Determine the new mastery level after an evaluation response.
 * Returns the new level if advancement is possible, or the current level.
 */
export function computeNewLevelFromEvaluation(
  currentLevel: number,
  questionType: EvaluationType,
  score: number
): MasteryLevel {
  if (canAdvanceToLevel1(currentLevel, score)) {
    return 1;
  }
  if (canAdvanceToLevel3(currentLevel, questionType, score)) {
    return 3;
  }
  return currentLevel as MasteryLevel;
}

/**
 * Determine the new mastery level after project completion.
 * Returns the new level if advancement is possible, or the current level.
 */
export function computeNewLevelFromProject(currentLevel: number): MasteryLevel {
  if (canAdvanceToLevel2(currentLevel)) {
    return 2;
  }
  return currentLevel as MasteryLevel;
}

// ============================================================================
// MASTERY HISTORY HELPERS
// ============================================================================

/**
 * Build a mastery history record for database insertion.
 */
export function buildMasteryHistoryRecord(params: {
  userId: string;
  conceptId: string;
  oldLevel: number;
  newLevel: number;
  triggerType: MasteryTriggerType;
  triggerId?: string;
}) {
  return {
    user_id: params.userId,
    concept_id: params.conceptId,
    old_level: params.oldLevel.toString(),
    new_level: params.newLevel.toString(),
    trigger_type: params.triggerType,
    trigger_id: params.triggerId || null,
  };
}
