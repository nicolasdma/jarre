-- ============================================================================
-- Interactive Exercises: results tracking
-- ============================================================================

CREATE TABLE exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  section_id UUID REFERENCES resource_sections(id) ON DELETE SET NULL,
  concept_id TEXT REFERENCES concepts(id) ON DELETE SET NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('sequence', 'label', 'connect')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  is_correct BOOLEAN NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_results_user ON exercise_results(user_id, created_at DESC);
CREATE INDEX idx_exercise_results_exercise ON exercise_results(exercise_id, user_id);

-- RLS: users read/insert own
ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own exercise_results"
  ON exercise_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own exercise_results"
  ON exercise_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
