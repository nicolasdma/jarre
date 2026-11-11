-- ============================================================================
-- Lesson drills: which concept a drill practices
-- ----------------------------------------------------------------------------
-- The learn view shows each section's drills right under it, so a drill says
-- which concept (section) it belongs to. NULL means the drill is not tied to
-- one concept (the milestones by heart, useful phrases): the learn view groups
-- those as "De memoria". Written by scripts/seed-lesson.ts from the drill's
-- `concept` in the lesson JSON.
--
-- Additive only: a nullable column, no existing row changes meaning.
-- ============================================================================

BEGIN;

ALTER TABLE lesson_drills
  ADD COLUMN IF NOT EXISTS concept_id TEXT REFERENCES concepts(id) ON DELETE SET NULL;

COMMIT;
