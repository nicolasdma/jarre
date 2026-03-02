-- Pipeline jobs table for YouTube ingestion tracking
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  url              TEXT NOT NULL,
  video_id         TEXT,
  title            TEXT,
  language         TEXT DEFAULT 'es',
  status           TEXT NOT NULL DEFAULT 'queued',
  current_stage    TEXT,
  stages_completed INTEGER DEFAULT 0,
  total_stages     INTEGER DEFAULT 7,
  resource_id      TEXT,
  error            TEXT,
  failed_stage     TEXT,
  stage_outputs    JSONB DEFAULT '{}',
  tokens_used      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_user
  ON pipeline_jobs(user_id, created_at DESC);

-- RLS
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_jobs' AND policyname = 'Users see own jobs'
  ) THEN
    CREATE POLICY "Users see own jobs" ON pipeline_jobs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
