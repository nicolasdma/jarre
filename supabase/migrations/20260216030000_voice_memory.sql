-- Voice Memory: session tracking + transcript storage per section
-- Enables cross-session memory for the voice tutor

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  turn_count INTEGER DEFAULT 0
);

CREATE TABLE voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_voice_sessions_user_section
  ON voice_sessions (user_id, section_id, started_at DESC);

CREATE INDEX idx_voice_transcripts_session
  ON voice_transcripts (session_id, timestamp ASC);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;

-- voice_sessions: users can only access their own sessions
CREATE POLICY "voice_sessions_select" ON voice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "voice_sessions_insert" ON voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "voice_sessions_update" ON voice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- voice_transcripts: access via join to voice_sessions (owner only)
CREATE POLICY "voice_transcripts_select" ON voice_transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voice_sessions
      WHERE voice_sessions.id = voice_transcripts.session_id
        AND voice_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "voice_transcripts_insert" ON voice_transcripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_sessions
      WHERE voice_sessions.id = voice_transcripts.session_id
        AND voice_sessions.user_id = auth.uid()
    )
  );
