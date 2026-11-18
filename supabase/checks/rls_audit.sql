-- ============================================================================
-- Read-only RLS and privilege audit for the public schema.
-- Run before and after supabase/migrations/20261118010000_rls_lockdown.sql
-- (SQL editor, or psql). Nothing here writes: it only reads the catalogs.
--
-- After the migration every row of every query should read OK.
-- ============================================================================

-- 1. Tables without RLS (expect: none).
SELECT 'rls_off' AS check, c.relname AS object
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
ORDER BY 2;

-- 2. Anything anon can touch in public (expect: none).
SELECT 'anon_table_privilege' AS check, table_name AS object, string_agg(privilege_type, ',') AS privileges
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
GROUP BY table_name ORDER BY 2;

SELECT 'anon_function_execute' AS check, p.proname AS object
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER BY 2;

-- 3. Write-capable policies that are open to everyone (expect: none).
SELECT 'open_write_policy' AS check, tablename AS object, policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  AND (coalesce(qual, '') IN ('true', '') AND coalesce(with_check, 'true') = 'true')
ORDER BY 2;

-- 4. Policies that let anon read (role public or anon; expect: none effective,
--    since anon has no table privileges after the migration).
SELECT 'policy_for_public_or_anon' AS check, tablename AS object, policyname, cmd,
       has_table_privilege('anon', format('public.%I', tablename), 'SELECT') AS anon_can_select
FROM pg_policies
WHERE schemaname = 'public' AND (roles @> '{public}' OR roles @> '{anon}') AND cmd IN ('SELECT', 'ALL')
ORDER BY 2;

-- 5. Content tables: authenticated can read, cannot write (expect: read true, write false).
SELECT 'content_access' AS check, t AS object,
       has_table_privilege('authenticated', format('public.%I', t), 'SELECT') AS auth_select,
       has_table_privilege('authenticated', format('public.%I', t), 'INSERT,UPDATE,DELETE') AS auth_write,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t AND p.cmd = 'SELECT') AS select_policies
FROM unnest(ARRAY['resources', 'concepts', 'concept_cards', 'question_bank', 'concept_prerequisites',
                  'resource_concepts', 'projects', 'project_concepts', 'curriculum_phase_metadata',
                  'section_translations', 'resource_translations', 'quiz_translations']) AS t
ORDER BY 2;

-- 6. Security definer functions and who may run them.
SELECT 'security_definer' AS check, p.proname AS object,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
ORDER BY 2;
