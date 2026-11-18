-- ============================================================================
-- Voice tutor reliability (docs/tutor/02-arquitectura.md §4.2, §5.1-5.3, phase 0)
-- ============================================================================
-- 1. Transcript idempotency that actually works. The partial unique index of
--    20260303150000 (WHERE client_turn_id IS NOT NULL) cannot back PostgREST's
--    ON CONFLICT (session_id, client_turn_id): Postgres only infers a partial
--    index when the statement repeats its predicate, and PostgREST cannot say
--    it. Every upsert failed with "there is no unique or exclusion constraint"
--    and fell back to a plain insert without ids: 0 rows with client_turn_id on
--    2026-11-18. A plain unique index admits the legacy NULL rows (NULLs are
--    distinct) and backs the upsert.
-- 2. Sessions that close and digest for sure: when anything happened last
--    (each transcript batch touches it), the durable digest state (`end` sets
--    it pending and runs it after the response; the next context request
--    retries what is still pending), and what the client saw (counters, a
--    timeline without conversation text, summed usageMetadata), so a session
--    like d14a09c0 (110 s, one stored line) can be explained with one query.
--
-- Additive and idempotent. The app degrades when this is not applied yet: the
-- transcript route de-duplicates by reading the ids first, `end` skips the
-- missing columns, the digest runs once without retries.
-- ============================================================================

-- 1. Transcripts --------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_voice_transcripts_session_turn_id;
CREATE UNIQUE INDEX IF NOT EXISTS voice_transcripts_session_turn_uniq
  ON public.voice_transcripts (session_id, client_turn_id);

-- 2. Sessions -----------------------------------------------------------------
ALTER TABLE public.voice_sessions
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_diag jsonb,
  ADD COLUMN IF NOT EXISTS digest_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS digest_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS digest_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voice_sessions_digest_status_check') THEN
    ALTER TABLE public.voice_sessions
      ADD CONSTRAINT voice_sessions_digest_status_check
      CHECK (digest_status IN ('none', 'pending', 'running', 'done', 'failed'));
  END IF;
END $$;

-- What the context request scans on every tutor open: the user's open sessions
-- and the digests still to run.
CREATE INDEX IF NOT EXISTS voice_sessions_user_open
  ON public.voice_sessions (user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS voice_sessions_user_digest
  ON public.voice_sessions (user_id, digest_status) WHERE digest_status IN ('pending', 'running');

-- RLS is unchanged: voice_sessions and voice_transcripts keep their owner-only
-- policies (20260216030000), anon holds nothing (20261118010000), and the new
-- columns are written by the server with the admin client.
