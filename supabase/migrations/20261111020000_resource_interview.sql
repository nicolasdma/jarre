-- ============================================================================
-- Interview mock configuration per resource
-- ----------------------------------------------------------------------------
-- `interview` holds the lesson's interview block (see docs/lesson-format.md):
-- the situation being rehearsed and the lesson's own interviewer personas,
-- validated by src/lib/interview/personas.ts. NULL means "defaults only".
-- Written by scripts/seed-lesson.ts; read by the practice page.
--
-- Additive only: one nullable column.
-- ============================================================================

ALTER TABLE resources ADD COLUMN IF NOT EXISTS interview JSONB;

COMMENT ON COLUMN resources.interview IS
  'Interview mock config for the lesson: { context, default_persona, personas[] }. NULL = default personas.';
