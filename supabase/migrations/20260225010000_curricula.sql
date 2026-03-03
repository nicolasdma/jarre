-- Curricula: AI-generated study plans with phases and resources
-- Resources are placeholders until materialized via the YouTube pipeline

-- Rename old tables to preserve data (from hardcoded curriculum system)
ALTER TABLE IF EXISTS curriculum_phases RENAME TO legacy_curriculum_phases;
ALTER TABLE IF EXISTS curricula RENAME TO legacy_curricula;
-- Drop old policies/indexes that reference old names (safe: IF EXISTS)
DROP POLICY IF EXISTS "Users see own curricula" ON legacy_curricula;
DROP POLICY IF EXISTS "Users see own phases" ON legacy_curriculum_phases;
CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  goal TEXT,
  current_level TEXT,           -- 'beginner' | 'intermediate' | 'advanced'
  hours_per_week DECIMAL(3,1),
  llm_response JSONB,           -- raw LLM output for debugging
  tokens_used INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',  -- active | archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own curricula" ON curricula
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_curricula_user ON curricula(user_id, created_at DESC);
CREATE TABLE curriculum_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_weeks DECIMAL(3,1),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(curriculum_id, phase_number)
);
ALTER TABLE curriculum_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own phases" ON curriculum_phases
  FOR ALL USING (curriculum_id IN (SELECT id FROM curricula WHERE user_id = auth.uid()));
CREATE INDEX idx_curriculum_phases_curriculum ON curriculum_phases(curriculum_id, sort_order);
CREATE TABLE curriculum_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES curriculum_phases(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'lecture',
  expected_channel TEXT,         -- "MIT OpenCourseWare", "3Blue1Brown"
  search_query TEXT NOT NULL,    -- query to find the resource
  estimated_hours DECIMAL(4,1),
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Materialization
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | materialized | failed
  resource_id TEXT REFERENCES resources(id),    -- FK after pipeline completes
  pipeline_job_id UUID REFERENCES pipeline_jobs(id),
  youtube_url TEXT,              -- populated when user provides URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE curriculum_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own curriculum resources" ON curriculum_resources
  FOR ALL USING (curriculum_id IN (SELECT id FROM curricula WHERE user_id = auth.uid()));
CREATE INDEX idx_curriculum_resources_phase ON curriculum_resources(phase_id, sort_order);
-- Track which curriculum resource triggered a pipeline job
ALTER TABLE pipeline_jobs ADD COLUMN IF NOT EXISTS curriculum_resource_id UUID REFERENCES curriculum_resources(id);
