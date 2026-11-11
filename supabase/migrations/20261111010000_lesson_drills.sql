-- ============================================================================
-- Lesson drills: spoken-English practice items attached to a resource
-- ----------------------------------------------------------------------------
-- Each drill is a short text the learner listens to, copies, takes as dictation,
-- repeats and shadows (see /resource/[resourceId]/practice). Rows are written by
-- scripts/seed-lesson.ts with the service role; learners only read them.
--
-- Audio lives in the private Storage bucket `lesson-audio`, at
-- `<resource_id>/<slug>.m4a`. The practice page signs short-lived URLs with the
-- learner's own session, so the read policy below is what lets it do that.
--
-- Additive only: no existing table is altered.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS lesson_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_es TEXT,
  audio_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lesson_drills_resource
  ON lesson_drills (resource_id, priority);

ALTER TABLE lesson_drills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read" ON lesson_drills;
CREATE POLICY "Authenticated read" ON lesson_drills
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for drill audio
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lesson-audio', 'lesson-audio', FALSE, 10485760, ARRAY['audio/mp4', 'audio/x-m4a', 'audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "lesson_audio_authenticated_read" ON storage.objects;
CREATE POLICY "lesson_audio_authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-audio');

COMMIT;
