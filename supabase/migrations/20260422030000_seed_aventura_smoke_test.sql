-- ============================================================================
-- Smoke test: one aventura concept + one aventura resource in phase '1'
-- ----------------------------------------------------------------------------
-- Verifies end-to-end that the `track` column round-trips through the library
-- view with ?track=aventura after extending the CHECK enum. Replaced by
-- curated Phase 1 content (9 concepts / 9 resources from phase-1-brief.md)
-- in a follow-up migration. Same pattern as
-- 20260421030000_seed_travel_smoke_test.sql.
-- ============================================================================

BEGIN;

INSERT INTO concepts (id, name, slug, canonical_definition, phase, track)
VALUES (
  'aventura-smoke-darien-intro',
  'Tapón del Darién (smoke test placeholder)',
  'tapon-darien-smoke',
  'Placeholder smoke-test concept for the aventura track. Replaced in a follow-up migration with the curated 9-concept Phase 1 content (crossing the Darién by kayak).',
  '1',
  'aventura'
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
  'aventura-smoke-darien-wiki',
  'Tapón del Darién — Wikipedia (smoke test placeholder)',
  'article',
  'https://es.wikipedia.org/wiki/Tap%C3%B3n_del_Dari%C3%A9n',
  NULL,
  '1',
  'Placeholder resource for the aventura track smoke test. Wikipedia article on the Darién Gap in Spanish — not the final curated source; replaced by the curated Phase 1 resources (primary sources: Smithsonian STRI, INVEMAR, Congreso General Guna, InSight Crime, etc.) in a follow-up migration.',
  0.25,
  'core',
  FALSE,
  NULL,
  'aventura'
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
VALUES ('aventura-smoke-darien-wiki', 'aventura-smoke-darien-intro', FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
