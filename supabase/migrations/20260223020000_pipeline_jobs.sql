-- Pipeline Jobs: tracks YouTube → Course auto-generation pipeline
-- Each job goes through 7 stages: resolve → segment → content → quizzes → video_map → concepts → write_db

CREATE TABLE pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  language TEXT DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | processing | completed | failed
  current_stage TEXT,
  stages_completed INTEGER DEFAULT 0,
  total_stages INTEGER DEFAULT 7,
  resource_id TEXT,  -- populated when pipeline completes
  error TEXT,
  failed_stage TEXT,
  stage_outputs JSONB DEFAULT '{}',  -- intermediate outputs for resume capability
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: users can only see their own jobs
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own jobs" ON pipeline_jobs FOR ALL USING (auth.uid() = user_id);
-- Index for listing user's jobs
CREATE INDEX idx_pipeline_jobs_user ON pipeline_jobs(user_id, created_at DESC);
-- Advance organizer data for generic ACTIVATE component (auto-generated resources)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS activate_data JSONB;
-- Track who created the resource (preparation for public resources)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
