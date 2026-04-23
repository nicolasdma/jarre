-- ============================================================================
-- Smoke test: one travel concept + one travel resource in phase '1'
-- ----------------------------------------------------------------------------
-- Verifies end-to-end that the `track` column round-trips through the library
-- view with ?track=travel. Replaced by curated Phase 1 content in a follow-up.
-- ============================================================================

BEGIN;

INSERT INTO concepts (id, name, slug, canonical_definition, phase, track)
VALUES (
  'travel-geo-sudamerica',
  'Geografía física sudamericana',
  'geografia-fisica-sudamericana',
  'Placeholder smoke-test concept for the travel track. Replaced in a follow-up migration with curated Phase 1 content.',
  '1',
  'travel'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  canonical_definition = EXCLUDED.canonical_definition,
  phase = EXCLUDED.phase,
  track = EXCLUDED.track,
  updated_at = NOW();

INSERT INTO resources (
  id, title, type, url, author, phase, description,
  estimated_hours, curriculum_source, is_archived,
  created_by, track
)
VALUES (
  'travel-smoke-panoramica-intro',
  'Panorámica Continental (smoke test placeholder)',
  'video',
  'about:blank',
  NULL,
  '1',
  'Placeholder resource for the travel track smoke test. Replaced by curated Phase 1 video.',
  0.1,
  'core',
  FALSE,
  NULL,
  'travel'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  phase = EXCLUDED.phase,
  description = EXCLUDED.description,
  estimated_hours = EXCLUDED.estimated_hours,
  curriculum_source = EXCLUDED.curriculum_source,
  is_archived = EXCLUDED.is_archived,
  created_by = EXCLUDED.created_by,
  track = EXCLUDED.track,
  updated_at = NOW();

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES ('travel-smoke-panoramica-intro', 'travel-geo-sudamerica', FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
