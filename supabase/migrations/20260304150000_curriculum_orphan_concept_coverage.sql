-- Close remaining concept coverage gaps in core curriculum.
-- Goal: every core concept should be taught by at least one active core resource.

BEGIN;

-- 1) Restore DDIA Ch11 as active core resource to teach stream-specific concepts.
UPDATE resources
SET
  is_archived = FALSE,
  created_by = NULL,
  curriculum_source = 'core'
WHERE id = 'ddia-ch11';

-- 2) Restore one math foundation resource for linear algebra + dimensionality reduction.
INSERT INTO resources (
  id,
  title,
  type,
  url,
  author,
  phase,
  description,
  estimated_hours,
  sort_order,
  created_by,
  curriculum_source,
  is_archived
)
VALUES (
  'p0-3b1b-linear-algebra',
  '3Blue1Brown: Essence of Linear Algebra',
  'video',
  'https://www.3blue1brown.com/topics/linear-algebra',
  'Grant Sanderson',
  '0'::study_phase,
  'Visual intuition for vectors, matrices, eigenvectors, and geometric transformations applied to ML.',
  6,
  100,
  NULL,
  'core',
  FALSE
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  author = EXCLUDED.author,
  phase = EXCLUDED.phase,
  description = EXCLUDED.description,
  estimated_hours = EXCLUDED.estimated_hours,
  sort_order = EXCLUDED.sort_order,
  created_by = NULL,
  curriculum_source = 'core',
  is_archived = FALSE;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p0-3b1b-linear-algebra', 'linear-algebra-ml', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p0-3b1b-linear-algebra')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'linear-algebra-ml')
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = FALSE;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p0-3b1b-linear-algebra', 'dimensionality-reduction', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p0-3b1b-linear-algebra')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'dimensionality-reduction')
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = FALSE;

-- 3) Recover broken MLOps mappings after resource-id refactors.
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'hidden-tech-debt-paper', 'ml-technical-debt', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'hidden-tech-debt-paper')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'ml-technical-debt')
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = FALSE;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'made-with-ml', 'model-containerization', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'made-with-ml')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'model-containerization')
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = FALSE;

COMMIT;
