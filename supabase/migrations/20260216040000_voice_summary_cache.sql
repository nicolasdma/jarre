-- Add cached_summary column to voice_sessions for latency reduction.
-- Summary is generated in background when a session ends, so the next
-- session can read it from DB instead of calling DeepSeek at connect time.

ALTER TABLE voice_sessions ADD COLUMN cached_summary TEXT;
