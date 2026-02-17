-- Voice Evaluation: enable voice sessions for evaluation, not just teaching
-- Links voice sessions to evaluations for Socratic assessment flow

-- ============================================================================
-- VOICE SESSIONS: add session_type and optional resource_id
-- ============================================================================

-- Differentiate teaching vs evaluation sessions
ALTER TABLE voice_sessions ADD COLUMN session_type TEXT NOT NULL DEFAULT 'teaching'
  CHECK (session_type IN ('teaching', 'evaluation'));

-- For evaluation sessions, link to the resource being evaluated
-- Nullable because teaching sessions link via section_id instead
ALTER TABLE voice_sessions ADD COLUMN resource_id TEXT REFERENCES resources(id);

-- Make section_id nullable (evaluation sessions don't need a section)
ALTER TABLE voice_sessions ALTER COLUMN section_id DROP NOT NULL;

-- ============================================================================
-- EVALUATIONS: add voice_session_id and eval_method
-- ============================================================================

-- Link evaluations to voice sessions (null for text-based evaluations)
ALTER TABLE evaluations ADD COLUMN voice_session_id UUID REFERENCES voice_sessions(id);

-- Track whether evaluation was text or voice
ALTER TABLE evaluations ADD COLUMN eval_method TEXT NOT NULL DEFAULT 'text'
  CHECK (eval_method IN ('text', 'voice'));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_voice_sessions_type ON voice_sessions (session_type)
  WHERE session_type = 'evaluation';

CREATE INDEX idx_evaluations_voice ON evaluations (voice_session_id)
  WHERE voice_session_id IS NOT NULL;
