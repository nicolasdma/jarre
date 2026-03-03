-- Voice transcript hardening:
-- - Add client-side idempotency key per transcript turn
-- - Add optional monotonic sequence for stable ordering/debugging

ALTER TABLE voice_transcripts
  ADD COLUMN IF NOT EXISTS client_turn_id TEXT;

ALTER TABLE voice_transcripts
  ADD COLUMN IF NOT EXISTS client_seq BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_transcripts_session_turn_id
  ON voice_transcripts (session_id, client_turn_id)
  WHERE client_turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session_seq
  ON voice_transcripts (session_id, client_seq)
  WHERE client_seq IS NOT NULL;
