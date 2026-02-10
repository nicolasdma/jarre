-- Learn progress persistence
-- Stores user's learn flow state per resource for cross-device continuity.

CREATE TABLE learn_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  current_step TEXT NOT NULL DEFAULT 'activate',
  active_section INTEGER NOT NULL DEFAULT 0,
  completed_sections INTEGER[] NOT NULL DEFAULT '{}',
  section_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- RLS
ALTER TABLE learn_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learn progress"
  ON learn_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learn progress"
  ON learn_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learn progress"
  ON learn_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_learn_progress_user_resource
  ON learn_progress(user_id, resource_id);
