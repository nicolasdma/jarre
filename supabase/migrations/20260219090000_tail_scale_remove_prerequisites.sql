-- Fix: concept_progress for DDIA ch1 concepts was never set to level >= 1
-- despite user completing evaluations. Root cause: evaluations for ch1 may have
-- been done before resource_concepts were properly linked, or LLM-generated
-- conceptNames didn't match DB concept names during resolution.
--
-- This migration:
-- 1. Sets level=1 for reliability, scalability, maintainability for users who
--    have completed at least one evaluation of ddia-ch1 with score >= 60
-- 2. Keeps the tail-at-scale-paper prerequisites (pedagogically correct)

-- For any user who evaluated ddia-ch1 successfully, ensure their ch1 concepts
-- have at least level 1
INSERT INTO concept_progress (user_id, concept_id, level, last_evaluated_at)
SELECT DISTINCT
  e.user_id,
  c.concept_id,
  '1'::mastery_level,
  e.completed_at
FROM evaluations e
CROSS JOIN (
  SELECT unnest(ARRAY['reliability', 'scalability', 'maintainability']) AS concept_id
) c
WHERE e.resource_id = 'ddia-ch1'
  AND e.status = 'completed'
  AND e.overall_score >= 60
ON CONFLICT (user_id, concept_id)
DO UPDATE SET
  level = '1'::mastery_level
WHERE concept_progress.level = '0'::mastery_level;
