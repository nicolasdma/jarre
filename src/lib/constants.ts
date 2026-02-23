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

/** Score threshold for mastery level 3 → 4 advancement (teach session) */
export const LEVEL_4_SCORE = 80;

/** Minimum correct micro-test answers to advance 0 → 1 */
export const MICRO_TEST_THRESHOLD = 3;

// ============================================================================
// SM-2 SPACED REPETITION
// ============================================================================

/** Minimum ease factor (floor) */
export const SM2_MIN_EASE = 1.3;

/** Maximum ease factor (ceiling) */
export const SM2_MAX_EASE = 2.5;

/** Maximum interval between reviews (days) */
export const SM2_MAX_INTERVAL_DAYS = 180;

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
// FSRS SPACED REPETITION
// ============================================================================

/** Desired retention rate for FSRS scheduling (90% = review before 10% forgetting chance) */
export const FSRS_DESIRED_RETENTION = 0.9;

/** Score boundaries for FSRS rating derivation (from numeric scores) */
export const FSRS_SCORE_BOUNDARIES = {
  easy: 90,
  good: 70,
  hard: 50,
} as const;

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

// ============================================================================
// SELF-EXPLANATION
// ============================================================================

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
// XP SYSTEM
// ============================================================================

/** XP rewards per action */
export const XP_REWARDS = {
  REVIEW_CORRECT: 10,
  REVIEW_CORRECT_OPEN: 15,
  REVIEW_STREAK_BONUS: 5,     // every 3-streak on a card
  EVALUATION_COMPLETE: 25,
  EVALUATION_HIGH_SCORE: 15,  // score >= 80%
  VOICE_EVAL_COMPLETE: 30,    // voice evaluation (harder than text)
  SECTION_COMPLETE: 10,
  MASTERY_ADVANCE: 20,
  DAILY_GOAL_BONUS: 10,       // awarded by DB function
} as const;

// ============================================================================
// EXERCISES
// ============================================================================

/** Minimum score to consider an exercise "correct" */
export const EXERCISE_PASS_SCORE = 70;

// ============================================================================
// TOKEN BUDGETS (maxTokens for LLM calls)
// ============================================================================

/** Centralized maxTokens for all DeepSeek API calls */
export const TOKEN_BUDGETS = {
  INGEST_EXTRACT: 2000,
  INGEST_LINK: 2000,
  VOICE_MEMORY: 500,
  VOICE_COMPRESS: 400,
  VOICE_SCORING: 4000,
  VOICE_CONSOLIDATION: 2000,
  VOICE_TEACH_SCORING: 2000,
  REVIEW_EVALUATE: 500,
  REVIEW_FALLBACK: 300,
  QUIZ_JUSTIFY: 400,
  EXPLORATION_SUMMARY: 2000,
  INSIGHTS: 1000,
  EVAL_GENERATE: 2000,
  EVAL_SUBMIT: 2000,
  SELF_EXPLANATION: 5,
  PLAYGROUND_TUTOR: 300,
  PLAYGROUND_HINT: 150,
} as const;

// ============================================================================
// CONTENT TRUNCATION
// ============================================================================

/** Max chars to send to LLM for content analysis (~8K tokens) */
export const CONTENT_TRUNCATION_CHARS = 32_000;

/** Max chars for concept definitions in linking prompts */
export const DEFINITION_TRUNCATION_CHARS = 80;

// ============================================================================
// VOICE COMPRESSION
// ============================================================================

/** Transcript buffer entries before triggering compression in fallback */
export const VOICE_COMPRESS_THRESHOLD = 80;

/** Recent turns to keep uncompressed in fallback context */
export const VOICE_FALLBACK_RECENT_TURNS = 40;
