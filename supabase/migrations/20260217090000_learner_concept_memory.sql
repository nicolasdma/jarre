-- Learner Concept Memory
-- Stores misconceptions and strengths detected per concept per user.
-- Used to personalize future tutoring, practice, and evaluation sessions.

CREATE TABLE learner_concept_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  misconceptions JSONB NOT NULL DEFAULT '[]',
  strengths JSONB NOT NULL DEFAULT '[]',
  escalation_level TEXT DEFAULT 'pump',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

ALTER TABLE learner_concept_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own memory"
  ON learner_concept_memory FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_learner_concept_memory_user
  ON learner_concept_memory(user_id);
