-- Add 'practice' to voice_sessions.session_type allowed values
ALTER TABLE voice_sessions DROP CONSTRAINT voice_sessions_session_type_check;
ALTER TABLE voice_sessions ADD CONSTRAINT voice_sessions_session_type_check
  CHECK (session_type IN ('teaching', 'evaluation', 'practice'));
