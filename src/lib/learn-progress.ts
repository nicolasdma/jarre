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
  phase: 'pre-question' | 'content' | 'post-test' | 'completed';
  preAnswer?: string;
  preAttempted: boolean;
  postScore?: number;
  postIsCorrect?: boolean;
}

export interface LearnProgress {
  currentStep: 'activate' | 'learn' | 'apply' | 'evaluate';
  activeSection: number;
  completedSections: number[];
  /** Keyed by section UUID (resource_sections.id) */
  sectionState: Record<string, SectionState>;
}

// ============================================================================
// Client-side save (fire-and-forget)
// ============================================================================

/**
 * Persists learn progress to the server. Fire-and-forget: failures are
 * logged but don't block the UI.
 */
export function saveLearnProgress(
  resourceId: string,
  progress: LearnProgress
): void {
  fetch('/api/learn/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceId, ...progress }),
  }).catch((err) => {
    console.error('[Learn/Progress] Failed to save:', err);
  });
}
