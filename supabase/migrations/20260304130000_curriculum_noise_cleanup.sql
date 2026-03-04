-- ============================================================================
-- Curriculum Noise Cleanup
-- ----------------------------------------------------------------------------
-- Goals
-- 1) Remove auto-generated concept noise from the canonical concept graph.
-- 2) Fix a backward prerequisite path in the core curriculum DAG.
-- 3) Restore teaching coverage for key infrastructure concepts.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Keep transformer progression coherent
-- attention-paper should live in the transformer phase.
-- ---------------------------------------------------------------------------
UPDATE resources
SET phase = '3',
    sort_order = 190,
    updated_at = NOW()
WHERE id = 'attention-paper';

-- ---------------------------------------------------------------------------
-- 2) Recover teaching coverage for key concepts that became orphaned.
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p2-horace-he-gpu', 'mixed-precision-training', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p2-horace-he-gpu')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'mixed-precision-training')
ON CONFLICT (resource_id, concept_id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p2-lilian-weng-distributed', 'zero-optimizer', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p2-lilian-weng-distributed')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'zero-optimizer')
ON CONFLICT (resource_id, concept_id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p2-google-mlops', 'ml-technical-debt', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p2-google-mlops')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'ml-technical-debt')
ON CONFLICT (resource_id, concept_id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'p2-google-mlops', 'model-containerization', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'p2-google-mlops')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'model-containerization')
ON CONFLICT (resource_id, concept_id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
SELECT 'kz2h-micrograd', 'calculus-backprop', FALSE
WHERE EXISTS (SELECT 1 FROM resources WHERE id = 'kz2h-micrograd')
  AND EXISTS (SELECT 1 FROM concepts WHERE id = 'calculus-backprop')
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Remove auto-generated concept IDs from canonical curriculum.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE tmp_auto_curriculum_concepts ON COMMIT DROP AS
SELECT id
FROM concepts
WHERE id LIKE 'auto-%';

-- Clean non-cascading dependencies first.
DELETE FROM question_bank
WHERE resource_section_id IN (
  SELECT id
  FROM resource_sections
  WHERE concept_id IN (SELECT id FROM tmp_auto_curriculum_concepts)
);

DELETE FROM resource_sections
WHERE concept_id IN (SELECT id FROM tmp_auto_curriculum_concepts);

UPDATE evaluation_questions
SET related_concept_id = NULL
WHERE related_concept_id IN (SELECT id FROM tmp_auto_curriculum_concepts);

-- Delete noisy concepts (cascade handles concept_prerequisites, mappings, progress, etc.).
DELETE FROM concepts
WHERE id IN (SELECT id FROM tmp_auto_curriculum_concepts);

COMMIT;
