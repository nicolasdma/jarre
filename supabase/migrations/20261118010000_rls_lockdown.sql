-- ============================================================================
-- RLS lockdown (security audit 2026-11-18, CRITICO-2)
-- ============================================================================
-- State read on production (kkbzuzfdcowdjhqrvvea) on 2026-11-18, read-only:
-- * 75 tables in public. 11 without RLS (resources, concepts, concept_cards,
--   question_bank, concept_prerequisites, resource_concepts, projects,
--   project_concepts, curriculum_phase_metadata, processed_stripe_events,
--   processed_lemonsqueezy_events), and `anon` held SELECT, INSERT, UPDATE and
--   DELETE on every table: anyone with the publishable key (shipped in the JS
--   bundle) could read, rewrite or delete all lesson content.
-- * section_, resource_ and quiz_translations: a "Service write" policy
--   `FOR ALL USING (true)` for every role. Only the admin client writes them
--   (src/lib/translation/translate-service.ts), and it bypasses RLS.
-- * SECURITY DEFINER functions executable by anon: debit_credits,
--   refund_credits, award_xp, update_section_progress.
--
-- Who reads what (checked against every query path in src/ and scripts/):
-- * The browser's Supabase client only does auth (login, signup, reset).
-- * Server components and API routes use the user's session (`authenticated`):
--   every page and route that reads content requires a signed-in user.
-- * Writes to content tables, translations, token_usage and webhook ledgers go
--   through the admin client (service_role), which bypasses RLS. So do all the
--   scripts (seed-lesson, audit-curriculum, ...).
-- So: `anon` needs nothing in public; `authenticated` needs SELECT on content
-- and its existing own-row policies; nothing user-facing writes content.
--
-- One statement batch, no explicit BEGIN/COMMIT: `supabase db push` and the
-- SQL editor each run it as a single transaction. Idempotent: safe to run twice. Read-only check before and after:
-- supabase/checks/rls_audit.sql.
-- ============================================================================


-- 1. RLS on every table in public, including any created by hand.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- 2. anon: no privilege on any table, sequence or function in public, now or
--    for objects created later by this role.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, PUBLIC;

-- Functions keep explicit grants for who calls them. Trigger functions
-- (handle_new_user, update_updated_at, set_resource_curriculum_source) need no
-- EXECUTE grant to fire.
DO $$
BEGIN
  IF to_regprocedure('public.award_xp(uuid, integer, text, text)') IS NOT NULL THEN
    -- Called with the user's session (src/lib/xp.ts).
    GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, text) TO authenticated, service_role;
  END IF;
  -- Not called by the app: service role only.
  IF to_regprocedure('public.debit_credits(uuid, integer, uuid, text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.debit_credits(uuid, integer, uuid, text) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.debit_credits(uuid, integer, uuid, text) TO service_role;
  END IF;
  IF to_regprocedure('public.refund_credits(uuid, integer, uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, integer, uuid) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, integer, uuid) TO service_role;
  END IF;
  IF to_regprocedure('public.update_section_progress(uuid, text, text, text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.update_section_progress(uuid, text, text, text) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.update_section_progress(uuid, text, text, text) TO service_role;
  END IF;
END $$;

-- 3. authenticated never needs TRUNCATE, REFERENCES or TRIGGER.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- 4. Content tables: signed-in read, no user write. User-created resources
--    (created_by set) are visible to their creator only.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'concepts', 'concept_cards', 'question_bank', 'concept_prerequisites',
    'resource_concepts', 'projects', 'project_concepts', 'curriculum_phase_metadata'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated', t);
      EXECUTE format('DROP POLICY IF EXISTS "Authenticated read" ON public.%I', t);
      EXECUTE format('CREATE POLICY "Authenticated read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    END IF;
  END LOOP;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.resources FROM authenticated;
DROP POLICY IF EXISTS "Authenticated read core or own" ON public.resources;
CREATE POLICY "Authenticated read core or own" ON public.resources
  FOR SELECT TO authenticated
  USING (created_by IS NULL OR created_by = auth.uid());

-- 5. Webhook ledgers: service role only (no policy = no access under RLS).
REVOKE ALL ON public.processed_stripe_events FROM authenticated;
REVOKE ALL ON public.processed_lemonsqueezy_events FROM authenticated;

-- 6. Translations: no more write-for-everyone; read for signed-in users.
DROP POLICY IF EXISTS "Service write section_translations" ON public.section_translations;
DROP POLICY IF EXISTS "Service write resource_translations" ON public.resource_translations;
DROP POLICY IF EXISTS "Service write quiz_translations" ON public.quiz_translations;
DROP POLICY IF EXISTS "Public read section_translations" ON public.section_translations;
DROP POLICY IF EXISTS "Public read resource_translations" ON public.resource_translations;
DROP POLICY IF EXISTS "Public read quiz_translations" ON public.quiz_translations;
DROP POLICY IF EXISTS "Authenticated read section_translations" ON public.section_translations;
DROP POLICY IF EXISTS "Authenticated read resource_translations" ON public.resource_translations;
DROP POLICY IF EXISTS "Authenticated read quiz_translations" ON public.quiz_translations;
CREATE POLICY "Authenticated read section_translations" ON public.section_translations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read resource_translations" ON public.resource_translations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read quiz_translations" ON public.quiz_translations
  FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.section_translations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.resource_translations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_translations FROM authenticated;

-- 7. token_usage feeds the spend caps (src/lib/api/rate-limit.ts). Only the
--    server writes it (admin client, src/lib/db/token-usage.ts): users may read
--    their rows but not insert, so they cannot pad or zero the sums. NOT VALID:
--    new rows are checked, existing ones are not re-read (none were negative on
--    2026-11-18, but a row written before this runs must not block it).
DROP POLICY IF EXISTS "Users insert own token usage" ON public.token_usage;
REVOKE INSERT, UPDATE, DELETE ON public.token_usage FROM authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'token_usage_tokens_nonnegative'
  ) THEN
    ALTER TABLE public.token_usage
      ADD CONSTRAINT token_usage_tokens_nonnegative CHECK (tokens >= 0) NOT VALID;
  END IF;
END $$;

