-- Add freeform and debate session types to voice_sessions
-- Freeform: open conversation about any topic in the student's knowledge graph
-- Debate: adversarial discussion where the tutor defends a position

ALTER TABLE voice_sessions DROP CONSTRAINT IF EXISTS voice_sessions_session_type_check;
ALTER TABLE voice_sessions ADD CONSTRAINT voice_sessions_session_type_check
  CHECK (session_type IN ('teaching', 'evaluation', 'practice', 'exploration', 'freeform', 'debate'));
