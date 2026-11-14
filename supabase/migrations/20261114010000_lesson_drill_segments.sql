-- ============================================================================
-- Lesson drills: where each phrase sits in the recording
-- ----------------------------------------------------------------------------
-- A drill marks its phrases with " / ". Frase por frase plays one phrase,
-- stops and listens to that phrase only, so it needs each phrase's start and
-- end in the audio: a JSON array of {"start": s, "end": s} in seconds, one per
-- phrase, in order. Written by scripts/seed-lesson.ts from the drill's
-- `segments` (or the `<audio>.segments.json` that
-- scripts/align-drill-segments.ts writes next to the audio). NULL: no timings,
-- the player cuts at the pauses it finds and says the cuts are approximate.
--
-- Additive only: a nullable column, no existing row changes meaning.
-- ============================================================================

BEGIN;

ALTER TABLE lesson_drills
  ADD COLUMN IF NOT EXISTS segments JSONB;

COMMIT;
