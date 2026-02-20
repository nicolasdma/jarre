/**
 * Learn flow persistence — types and client-side save utility.
 *
 * SectionState captures per-concept phase + answers so users can resume
 * where they left off across devices.
 */

// ============================================================================
// Types
// ============================================================================

export interface SectionState {
  phase: 'pre-question' | 'content' | 'exercise' | 'post-test' | 'completed';
  preAnswer?: string;
  preAttempted: boolean;
  postScore?: number;
  postIsCorrect?: boolean;
  // v2: full post-test result for display on refresh
  postFeedback?: string;
  postExpectedAnswer?: string;
  postDimensionScores?: Record<string, number>;
  postReasoning?: string;
  // v3: confidence-based assessment
  postConfidence?: 1 | 2 | 3;
  // v4: self-explanation (pure text, no LLM)
  selfExplanation?: string;
  // v5: voice tutor completion gate
  voiceCompleted?: boolean;
}

export interface ReviewStepState {
  inlineAnswers: Record<string, { selectedOption: string; isCorrect: boolean; justification?: string }>;
  bankAnswers: Record<string, {
    userAnswer: string;
    score?: number;
    isCorrect?: boolean;
    feedback?: string;
    dimensionScores?: Record<string, number>;
  }>;
}

export interface PracticeEvalAnswer {
  questionId: string;
  userAnswer: string;
  score?: number;
  isCorrect?: boolean;
  feedback?: string;
  dimensionScores?: Record<string, number>;
  scaffoldLevel: 1 | 2 | 3;
}

export interface PracticeEvalState {
  answers: Record<string, PracticeEvalAnswer>;
  currentScaffoldLevel: 1 | 2 | 3;
}

export interface LearnProgress {
  currentStep: 'activate' | 'learn' | 'practice-eval' | 'apply' | 'evaluate';
  activeSection: number;
  completedSections: number[];
  /** Steps the user has visited at least once — persists even when navigating back */
  visitedSteps?: string[];
  /** Keyed by section UUID (resource_sections.id) */
  sectionState: Record<string, SectionState>;
  reviewState?: ReviewStepState;
  practiceEvalState?: PracticeEvalState;
}

// ============================================================================
// Client-side save (fire-and-forget)
// ============================================================================

/**
 * Persists learn progress to the server. Debounced (1s) fire-and-forget:
 * rapid state changes coalesce into a single POST.
 */
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveLearnProgress(
  resourceId: string,
  progress: LearnProgress
): void {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, ...progress }),
    }).catch((err) => {
      console.error('[Learn/Progress] Failed to save:', err);
    });
  }, 1000);
}
