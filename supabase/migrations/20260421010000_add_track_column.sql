-- ============================================================================
-- Add curriculum `track` column
-- ----------------------------------------------------------------------------
-- Introduces a classification dimension so multiple curricula (e.g. 'ai',
-- 'travel') can coexist without forking the schema. Every existing row
-- becomes `track = 'ai'` so the default curriculum keeps working unchanged.
--
-- Scope
--   - concepts, resources, projects, curriculum_phase_metadata get a NOT NULL
--     track column with CHECK (track IN ('ai','travel')) and DEFAULT 'ai'.
--   - curriculum_phase_metadata PK becomes (track, phase) so both tracks can
--     own their own 11 phases. sort_order uniqueness becomes per-track.
--   - uq_resources_core_phase_url becomes per-track so distinct tracks can
--     reuse the same URL inside the same phase number.
--   - Helper indexes on (track, phase) for library filtering.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) concepts.track
-- ---------------------------------------------------------------------------
ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'ai';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concepts_track_check'
  ) THEN
    ALTER TABLE concepts
      ADD CONSTRAINT concepts_track_check
      CHECK (track IN ('ai', 'travel'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_concepts_track_phase ON concepts(track, phase);

-- ---------------------------------------------------------------------------
-- 2) resources.track
-- ---------------------------------------------------------------------------
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'ai';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resources_track_check'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT resources_track_check
      CHECK (track IN ('ai', 'travel'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resources_track_phase
  ON resources(track, phase, sort_order);

-- Recreate canonical-URL uniqueness scoped per track (distinct tracks may share URLs).
DROP INDEX IF EXISTS uq_resources_core_phase_url;

CREATE UNIQUE INDEX IF NOT EXISTS uq_resources_core_track_phase_url
  ON resources (track, phase, lower(url))
  WHERE curriculum_source = 'core'
    AND is_archived = FALSE
    AND url IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) projects.track
-- ---------------------------------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'ai';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_track_check'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_track_check
      CHECK (track IN ('ai', 'travel'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_track_phase ON projects(track, phase);

-- ---------------------------------------------------------------------------
-- 4) curriculum_phase_metadata.track (compound PK refactor)
-- ---------------------------------------------------------------------------
ALTER TABLE curriculum_phase_metadata
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'ai';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_phase_metadata_track_check'
  ) THEN
    ALTER TABLE curriculum_phase_metadata
      ADD CONSTRAINT curriculum_phase_metadata_track_check
      CHECK (track IN ('ai', 'travel'));
  END IF;
END $$;

-- Swap PK from (phase) to (track, phase) so both tracks can own phase '1'..'11'.
ALTER TABLE curriculum_phase_metadata
  DROP CONSTRAINT IF EXISTS curriculum_phase_metadata_pkey;

ALTER TABLE curriculum_phase_metadata
  ADD CONSTRAINT curriculum_phase_metadata_pkey PRIMARY KEY (track, phase);

-- sort_order was globally UNIQUE; scope it per-track instead.
ALTER TABLE curriculum_phase_metadata
  DROP CONSTRAINT IF EXISTS curriculum_phase_metadata_sort_order_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'curriculum_phase_metadata_track_sort_order_key'
  ) THEN
    ALTER TABLE curriculum_phase_metadata
      ADD CONSTRAINT curriculum_phase_metadata_track_sort_order_key
      UNIQUE (track, sort_order);
  END IF;
END $$;

COMMIT;
