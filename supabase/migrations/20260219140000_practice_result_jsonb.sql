-- Add practice_result JSONB column to voice_sessions
-- Stores the full scoring result from voice practice sessions (~2-5KB snapshot).
-- Read-only after write; no normalization needed.
ALTER TABLE voice_sessions ADD COLUMN practice_result JSONB;
