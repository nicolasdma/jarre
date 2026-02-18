/**
 * Jarre - Type Definitions
 *
 * Core types for the learning system.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;
// 0 - Exposed: Read/watched the material
// 1 - Understood: Can explain without notes
// 2 - Applied: Used in a project/exercise
// 3 - Criticized: Can say when NOT to use it and why
// 4 - Taught: Can explain to others and answer questions

export type EvaluationType =
  | 'explanation'    // Explain in own words
  | 'scenario'       // Apply to situation
  | 'error_detection' // Find the mistake
  | 'connection'     // Relate concepts
  | 'tradeoff'       // When NOT to use
  | 'design';        // Propose architecture integrating multiple concepts

export type QuestionBankType =
  | 'definition'
  | 'fact'
  | 'property'
  | 'guarantee'
  | 'complexity'
  | 'comparison'
  | 'scenario'
  | 'limitation'
  | 'error_spot';

export type ReviewRating = 'wrong' | 'hard' | 'easy';

export type QuestionFormat = 'open' | 'mc' | 'tf';

export type MasteryTriggerType = 'evaluation' | 'project' | 'manual' | 'decay' | 'micro_test' | 'voice_evaluation' | 'teach_session';

// ============================================================================
// INLINE QUIZZES
// ============================================================================

export type InlineQuizFormat = 'mc' | 'tf' | 'mc2';

export interface InlineQuiz {
  id: string;
  sectionId: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: InlineQuizFormat;
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

// ============================================================================
// REVIEW API TYPES
// ============================================================================

/**
 * A review card returned by the due endpoint
 */
export interface ReviewCard {
  questionId: string;
  conceptId: string;
  conceptName: string;
  questionText: string;
  type: QuestionBankType;
  format: QuestionFormat;
  difficulty: 1 | 2 | 3;
  streak: number;
  repetitionCount: number;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
}

/**
 * Response from the review submit endpoint
 */
export interface ReviewSubmitResponse {
  score: number;            // 0-100 (backward compat, derived from dimensions in v2)
  feedback: string;
  isCorrect: boolean;
  expectedAnswer: string;
  rating: ReviewRating;
  nextReviewAt: string;
  intervalDays: number;
  masteryAdvanced?: boolean;
  // v2: rubric evaluation
  dimensionScores?: Record<string, number>;  // e.g. {precision: 2, completeness: 1, depth: 2}
  reasoning?: string;                         // CoT from evaluator
  // v3: XP result (if awarded)
  xp?: XPResult | null;
}

// ============================================================================
// ANNOTATIONS
// ============================================================================

export interface Annotation {
  id: string;
  userId: string;
  sectionId: string;
  selectedText: string;
  prefix: string;
  suffix: string;
  segmentIndex: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HighlightAnchor {
  selectedText: string;
  prefix: string;
  suffix: string;
  segmentIndex: number;
}

// ============================================================================
// ENGAGEMENT / XP
// ============================================================================

export interface EngagementStatus {
  totalXp: number;
  xpLevel: number;
  dailyXp: number;
  dailyTarget: number;
  dailyGoalComplete: boolean;
  streakDays: number;
  longestStreak: number;
  streakAlive: boolean;
}

export interface XPResult {
  totalXp: number;
  xpLevel: number;
  dailyXp: number;
  dailyTarget: number;
  dailyGoalHit: boolean;
  streakDays: number;
  longestStreak: number;
  levelUp: boolean;
  streakMilestone: number;
  xpAwarded: number;
}

// ============================================================================
// INTERACTIVE EXERCISES
// ============================================================================

export interface SequenceExercise {
  id: string;
  type: 'sequence';
  title: string;
  instructions: string;
  conceptId: string;
  sectionId?: string;
  steps: { id: string; text: string }[];
  correctOrder: string[];
}

export interface LabelZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  correctLabel: string;
}

export interface LabelExercise {
  id: string;
  type: 'label';
  title: string;
  instructions: string;
  conceptId: string;
  sectionId?: string;
  svgViewBox: string;
  svgElements: string;
  zones: LabelZone[];
  labels: string[];
}

export interface ConnectNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface ConnectExercise {
  id: string;
  type: 'connect';
  title: string;
  instructions: string;
  conceptId: string;
  sectionId?: string;
  svgViewBox: string;
  nodes: ConnectNode[];
  correctConnections: [string, string][];
}

export type Exercise = SequenceExercise | LabelExercise | ConnectExercise;

export interface ExerciseResult {
  exerciseId: string;
  score: number;
  isCorrect: boolean;
  details: Record<string, unknown>;
}
