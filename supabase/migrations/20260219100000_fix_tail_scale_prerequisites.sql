-- Fix: tail-at-scale-paper had stale prerequisite links to non-existent concepts
-- (slos-slis, monitoring) that were manually inserted before the migration system.
-- Remove ALL prerequisites for this paper — the content is self-contained.
DELETE FROM resource_concepts
WHERE resource_id = 'tail-at-scale-paper'
  AND is_prerequisite = true;
