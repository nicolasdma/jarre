-- ============================================================================
-- Extend curriculum `track` CHECK enum to include 'aventura'
-- ----------------------------------------------------------------------------
-- Adds 'aventura' as a third allowed value on every table that carries a
-- `track` column. The existing constraints (added in
-- 20260421010000_add_track_column.sql) hardcoded the pair ('ai','travel').
-- This migration drops each by its exact name and recreates it with the
-- three-value list ('ai','travel','aventura').
--
-- Idempotent: DROP ... IF EXISTS + ADD CONSTRAINT lets the migration run
-- multiple times without error. The ADD will only fail if the constraint
-- already exists — which it cannot, because we dropped it on the previous
-- statement of the same transaction.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) concepts.track
-- ---------------------------------------------------------------------------
ALTER TABLE concepts
  DROP CONSTRAINT IF EXISTS concepts_track_check;

ALTER TABLE concepts
  ADD CONSTRAINT concepts_track_check
  CHECK (track IN ('ai', 'travel', 'aventura'));

-- ---------------------------------------------------------------------------
-- 2) resources.track
-- ---------------------------------------------------------------------------
ALTER TABLE resources
  DROP CONSTRAINT IF EXISTS resources_track_check;

ALTER TABLE resources
  ADD CONSTRAINT resources_track_check
  CHECK (track IN ('ai', 'travel', 'aventura'));

-- ---------------------------------------------------------------------------
-- 3) projects.track
-- ---------------------------------------------------------------------------
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_track_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_track_check
  CHECK (track IN ('ai', 'travel', 'aventura'));

-- ---------------------------------------------------------------------------
-- 4) curriculum_phase_metadata.track
-- ---------------------------------------------------------------------------
ALTER TABLE curriculum_phase_metadata
  DROP CONSTRAINT IF EXISTS curriculum_phase_metadata_track_check;

ALTER TABLE curriculum_phase_metadata
  ADD CONSTRAINT curriculum_phase_metadata_track_check
  CHECK (track IN ('ai', 'travel', 'aventura'));

COMMIT;
