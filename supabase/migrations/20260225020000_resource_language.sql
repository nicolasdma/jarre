-- Add language column to resources
-- Stores the original language of the content (e.g., 'en' for English YouTube videos)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS language TEXT;
-- Backfill: existing resources → language from the pipeline_job that created them
UPDATE resources r
SET language = COALESCE(
  (SELECT pj.language FROM pipeline_jobs pj
   WHERE pj.resource_id = r.id
   ORDER BY pj.created_at DESC LIMIT 1),
  'es'
)
WHERE language IS NULL;
