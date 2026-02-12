/**
 * Jarre - Centralized Constants
 *
 * All pedagogical thresholds, limits, and system configuration.
 * Single source of truth — no magic numbers in route handlers.
 */

// ============================================================================
// MASTERY & PEDAGOGY
// ============================================================================

/** Score threshold for mastery level 0 → 1 advancement */
export const LEVEL_1_SCORE = 60;

/** Score threshold for mastery level 2 → 3 advancement */
export const LEVEL_3_SCORE = 80;

/** Minimum correct micro-test answers to advance 0 → 1 */
export const MICRO_TEST_THRESHOLD = 3;

/** Confidence scale levels */
export const CONFIDENCE_LEVELS = [1, 2, 3] as const;

// ============================================================================
// SM-2 SPACED REPETITION
// ============================================================================

/** Minimum ease factor (floor) */
export const SM2_MIN_EASE = 1.3;

/** Maximum ease factor (ceiling) */
export const SM2_MAX_EASE = 2.5;

/** Maximum interval between reviews (days) */
export const SM2_MAX_INTERVAL_DAYS = 180;

/** Default initial ease factor for new cards */
export const SM2_DEFAULT_EASE = 2.5;

/** Ease factor adjustments per rating */
export const SM2_EASE_DELTAS = {
  wrong: -0.2,
  hard: -0.15,
  easy: 0.1,
} as const;

/** Score boundaries for rating derivation */
export const SCORE_RATING_BOUNDARIES = {
  easy: 80,
  hard: 50,
} as const;

/** Rubric total boundaries for rating derivation (0-6 scale) */
export const RUBRIC_RATING_BOUNDARIES = {
  easy: 5,
  hard: 3,
} as const;

/** Floor percentage for rubric normalization */
export const RUBRIC_FLOOR_PERCENT = 20;

/** Max rubric score (3 dimensions × 2 max each) */
export const RUBRIC_MAX_TOTAL = 6;

// ============================================================================
// REVIEW SESSION
// ============================================================================

/** Maximum cards per daily review session */
export const REVIEW_SESSION_CAP = 12;

/** Maximum open-ended questions per session (rest filled with MC/TF) */
export const REVIEW_MAX_OPEN = 3;

// ============================================================================
// EVALUATION
// ============================================================================

/** Default number of generated questions per evaluation */
export const EVAL_DEFAULT_QUESTION_COUNT = 5;

/** Max evaluations per page in history */
export const EVAL_HISTORY_PAGE_SIZE = 50;

// ============================================================================
// TEXT ANCHORING
// ============================================================================

/** Characters of context for highlight disambiguation */
export const ANCHOR_CONTEXT_LENGTH = 50;

// ============================================================================
// NOTES & CANVAS
// ============================================================================

/** Maximum canvas data size (bytes) */
export const MAX_CANVAS_SIZE = 10 * 1024 * 1024; // 10MB

/** Annotation save debounce (ms) */
export const ANNOTATION_DEBOUNCE_MS = 500;

// ============================================================================
// SELF-EXPLANATION
// ============================================================================

/** Minimum character length for self-explanation validation */
export const SELF_EXPLANATION_MIN_LENGTH = 30;

/** Length above which self-explanation is auto-considered genuine */
export const SELF_EXPLANATION_AUTO_GENUINE_LENGTH = 120;

// ============================================================================
// PDF PROXY
// ============================================================================

/** PDF cache time-to-live (ms) */
export const PDF_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// ENGINE / PLAYGROUND
// ============================================================================

/** TCP command timeout (ms) */
export const ENGINE_COMMAND_TIMEOUT_MS = 5000;

/** Debug server timeout (ms) */
export const ENGINE_DEBUG_TIMEOUT_MS = 3000;

// ============================================================================
// TTS
// ============================================================================

/** Word boundary sizes for TTS chunking */
export const TTS_CHUNK_WORDS = { large: 60, small: 50 } as const;

// ============================================================================
// XP SYSTEM
// ============================================================================

/** XP rewards per action */
export const XP_REWARDS = {
  REVIEW_CORRECT: 10,
  REVIEW_CORRECT_OPEN: 15,
  REVIEW_STREAK_BONUS: 5,     // every 3-streak on a card
  EVALUATION_COMPLETE: 25,
  EVALUATION_HIGH_SCORE: 15,  // score >= 80%
  SECTION_COMPLETE: 10,
  MASTERY_ADVANCE: 20,
  DAILY_GOAL_BONUS: 10,       // awarded by DB function
} as const;

/** Default daily XP target for new users */
export const DEFAULT_DAILY_XP_TARGET = 50;

// ============================================================================
// EXERCISES
// ============================================================================

/** Minimum score to consider an exercise "correct" */
export const EXERCISE_PASS_SCORE = 70;
