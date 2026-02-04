/**
 * Jarre - Type Definitions
 *
 * Core types for the learning system.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ResourceType = 'paper' | 'book' | 'video' | 'course' | 'article';

export type StudyPhase = 1 | 2 | 3 | 4 | 5 | 6;

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
  | 'tradeoff';      // When NOT to use

export type EvaluationStatus = 'in_progress' | 'completed' | 'abandoned';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

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
