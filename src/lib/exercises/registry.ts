/**
 * Exercise registry — maps sectionId or conceptId to available exercises.
 *
 * Same pattern as concept-visuals/index.tsx and ddia-figures.json.
 */

import type { Exercise } from '@/types';
import { ch5Exercises } from '@/data/exercises/ddia-ch5-exercises';
import { ch6Exercises } from '@/data/exercises/ddia-ch6-exercises';
import { ch9Exercises } from '@/data/exercises/ddia-ch9-exercises';
import { agentSandboxPatternsExercises } from '@/data/exercises/agent-sandbox-patterns-exercises';
import { clawvaultExercises } from '@/data/exercises/clawvault-agent-memory-exercises';
import { tailAtScaleExercises } from '@/data/exercises/tail-at-scale-paper-exercises';

/** All registered exercises */
const ALL_EXERCISES: Exercise[] = [
  ...ch5Exercises,
  ...ch6Exercises,
  ...ch9Exercises,
  ...agentSandboxPatternsExercises,
  ...clawvaultExercises,
  ...tailAtScaleExercises,
];

/** Index by concept ID */
const byConceptId = new Map<string, Exercise[]>();
for (const ex of ALL_EXERCISES) {
  const existing = byConceptId.get(ex.conceptId) ?? [];
  existing.push(ex);
  byConceptId.set(ex.conceptId, existing);
}

/**
 * Get exercises for a given concept ID.
 */
export function getExercisesForConcept(conceptId: string): Exercise[] {
  return byConceptId.get(conceptId) ?? [];
}

