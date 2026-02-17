/**
 * Jarre - Type Definitions
 *
 * Core types for the learning system.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ResourceType = 'paper' | 'book' | 'video' | 'course' | 'article';

export type StudyPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

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

export type EvaluationStatus = 'in_progress' | 'completed' | 'abandoned';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

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
// CORE ENTITIES
// ============================================================================

/**
 * A learning resource (paper, book, video, etc.)
 */
export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  author?: string;
  phase: StudyPhase;
  description?: string;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An atomic concept to be learned
 */
export interface Concept {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  canonicalDefinition: string;
  phase: StudyPhase;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Many-to-many: which concepts a resource teaches
 */
export interface ResourceConcept {
  resourceId: string;
  conceptId: string;
  isPrerequisite: boolean; // true = you need this before, false = you learn this
}

/**
 * Many-to-many: concept prerequisites (DAG)
 */
export interface ConceptPrerequisite {
  conceptId: string;
  prerequisiteId: string;
}

/**
 * User's progress on a concept
 */
export interface ConceptProgress {
  id: string;
  userId: string;
  conceptId: string;
  level: MasteryLevel;
  lastEvaluatedAt?: Date;
  level1Score?: number;
  level2ProjectId?: string;
  level3Score?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A practical project linked to a phase
 */
export interface Project {
  id: string;
  title: string;
  phase: StudyPhase;
  description: string;
  deliverables: string[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// QUESTION BANK & SPACED REPETITION
// ============================================================================

/**
 * A pre-generated factual question in the question bank
 */
export interface QuestionBankItem {
  id: string;
  conceptId: string;
  type: QuestionBankType;
  format: QuestionFormat;
  questionText: string;
  expectedAnswer?: string;
  difficulty: 1 | 2 | 3;
  relatedConceptId?: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SM-2 spaced repetition state for a user/question pair
 */
export interface ReviewSchedule {
  id: string;
  userId: string;
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date;
  lastRating?: ReviewRating;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audit trail entry for mastery level changes
 */
export interface MasteryHistory {
  id: string;
  userId: string;
  conceptId: string;
  oldLevel: MasteryLevel;
  newLevel: MasteryLevel;
  triggerType: MasteryTriggerType;
  triggerId?: string;
  createdAt: Date;
}

/**
 * Maps a project to concepts it advances to level 2
 */
export interface ProjectConcept {
  projectId: string;
  conceptId: string;
}

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
// EVALUATION
// ============================================================================

/**
 * A single question in an evaluation
 */
export interface EvaluationQuestion {
  id: string;
  type: EvaluationType;
  question: string;
  conceptId: string;
  // For error_detection type
  incorrectStatement?: string;
  // For connection type
  relatedConceptId?: string;
}

/**
 * User's response to a question
 */
export interface EvaluationResponse {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  feedback?: string;
  score?: number; // 0-100
}

/**
 * A complete evaluation session
 */
export interface Evaluation {
  id: string;
  userId: string;
  resourceId: string;
  status: EvaluationStatus;
  questions: EvaluationQuestion[];
  responses: EvaluationResponse[];
  overallScore?: number;
  conceptsEvaluated: string[]; // concept IDs
  promptVersion: string; // for tracking which prompts generated this
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// USER
// ============================================================================

/**
 * User profile (extends Supabase auth.users)
 */
export interface UserProfile {
  id: string; // matches auth.users.id
  displayName?: string;
  currentPhase: StudyPhase;
  totalEvaluations: number;
  streakDays: number;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request to generate evaluation questions
 */
export interface GenerateEvaluationRequest {
  resourceId: string;
  conceptIds: string[];
  questionCount?: number; // default 5
}

/**
 * Response from LLM with generated questions
 */
export interface GenerateEvaluationResponse {
  questions: EvaluationQuestion[];
  promptVersion: string;
  tokensUsed: number;
}

/**
 * Request to evaluate user's answers
 */
export interface EvaluateAnswersRequest {
  evaluationId: string;
  responses: Array<{
    questionId: string;
    userAnswer: string;
  }>;
}

/**
 * Response from LLM with feedback
 */
export interface EvaluateAnswersResponse {
  responses: EvaluationResponse[];
  overallScore: number;
  conceptScores: Record<string, number>; // conceptId -> score
  tokensUsed: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface DashboardStats {
  totalConcepts: number;
  conceptsByLevel: Record<MasteryLevel, number>;
  totalEvaluations: number;
  averageScore: number;
  streakDays: number;
  currentPhase: StudyPhase;
}

export interface ResourceWithProgress extends Resource {
  concepts: Array<Concept & { progress?: ConceptProgress }>;
  prerequisites: Array<Concept & { progress?: ConceptProgress }>;
  completionPercentage: number;
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
 * Request to submit a review answer
 */
export interface ReviewSubmitRequest {
  questionId: string;
  userAnswer?: string;
  selectedAnswer?: string;
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

/**
 * Stats for the review dashboard
 */
export interface ReviewStats {
  totalDue: number;
  completedToday: number;
  currentStreak: number;
  totalCards: number;
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

export type ExerciseType = 'sequence' | 'label' | 'connect';

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
