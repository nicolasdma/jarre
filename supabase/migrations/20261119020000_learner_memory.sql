-- ============================================================================
-- Learner memory for the voice tutor (docs/tutor/02-arquitectura.md §3.3, §5.4-5.5, phase 2)
-- ============================================================================
-- What the learner showed, line by line, and the state per concept derived
-- from it by rules (src/lib/tutor/mastery.ts), so the tutor remembers across
-- sections and sessions of a lesson: what he said (right or wrong, corrected
-- or not), what he was already asked (d14a09c0 re-asked a question answered 7
-- minutes before), and the preferences he stated ("explicame paso a paso",
-- "qué pesado con la entrevista").
--
-- Written only by the server (the session digest, admin client). The learner
-- reads and may delete their own rows; anon holds nothing, in the line of
-- 20261118010000_rls_lockdown.sql. Without this migration the tutor works
-- without memory (the context route and the digest skip what is missing).
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learner_evidence (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.resource_sections(id) ON DELETE SET NULL,
  concept_id text REFERENCES public.concepts(id) ON DELETE SET NULL,
  -- Deleting a session deletes what was learned from it.
  session_id uuid REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  transcript_seq integer,
  source text NOT NULL CHECK (source IN ('voice', 'quiz', 'exercise', 'drill', 'eval')),
  kind text NOT NULL CHECK (kind IN ('explained', 'misconception', 'gap', 'asked_help',
                                     'tutor_question', 'preference', 'english')),
  verdict text CHECK (verdict IN ('correct', 'partial', 'wrong', 'unknown')),
  resolved boolean,
  statement text NOT NULL CHECK (char_length(statement) <= 300),
  quote text CHECK (char_length(quote) <= 200),
  at timestamptz NOT NULL,
  digest_version smallint
);

CREATE INDEX IF NOT EXISTS learner_evidence_user_resource
  ON public.learner_evidence (user_id, resource_id, at DESC);
CREATE INDEX IF NOT EXISTS learner_evidence_user_concept
  ON public.learner_evidence (user_id, concept_id, at DESC);
CREATE INDEX IF NOT EXISTS learner_evidence_user_kind
  ON public.learner_evidence (user_id, kind, at DESC);
CREATE INDEX IF NOT EXISTS learner_evidence_session
  ON public.learner_evidence (session_id);

ALTER TABLE public.learner_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learner_evidence FROM anon;
REVOKE ALL ON SEQUENCE public.learner_evidence_id_seq FROM anon;
-- The server writes (service role bypasses RLS); the learner reads and may erase.
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.learner_evidence FROM authenticated;
DROP POLICY IF EXISTS "Own evidence read" ON public.learner_evidence;
CREATE POLICY "Own evidence read" ON public.learner_evidence
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Own evidence delete" ON public.learner_evidence;
CREATE POLICY "Own evidence delete" ON public.learner_evidence
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- The existing owner of misconceptions and strengths per concept gets the
-- derived state. Its RLS ("Users manage own memory", owner only) is unchanged.
ALTER TABLE public.learner_concept_memory
  ADD COLUMN IF NOT EXISTS mastery smallint,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS asked_questions jsonb NOT NULL DEFAULT '[]';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learner_concept_memory_mastery_range') THEN
    ALTER TABLE public.learner_concept_memory
      ADD CONSTRAINT learner_concept_memory_mastery_range CHECK (mastery IS NULL OR mastery BETWEEN 0 AND 4);
  END IF;
END $$;
