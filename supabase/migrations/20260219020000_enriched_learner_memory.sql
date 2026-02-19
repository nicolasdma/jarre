-- Enriched Learner Memory
-- Adds columns to capture how the student thinks: analogies, open questions,
-- personal examples, and connections made during sessions.

ALTER TABLE learner_concept_memory
  ADD COLUMN IF NOT EXISTS analogies JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS open_questions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS personal_examples JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS connections_made JSONB DEFAULT '[]';

COMMENT ON COLUMN learner_concept_memory.analogies IS 'Analogies the student used that worked well';
COMMENT ON COLUMN learner_concept_memory.open_questions IS 'Questions the student asked that were not fully answered';
COMMENT ON COLUMN learner_concept_memory.personal_examples IS 'Examples from student experience mentioned in sessions';
COMMENT ON COLUMN learner_concept_memory.connections_made IS 'Cross-concept connections the student discovered';
