-- ============================================================================
-- Expand study_phase enum (6 → 9) and add 'design' evaluation type
-- ============================================================================
-- Curricular restructuring: 6 phases → 9 phases
-- New phase mapping:
--   Old 2 → New 3 (Transformer Foundations) & 4 (Agents & Reasoning)
--   Old 3 → New 5 (RAG, Memory & Context)
--   Old 4 → New 7 (Safety, Guardrails & Eval)
--   Old 5 → New 8 (Inference & Economics)
--   Old 6 → New 9 (System Design & Integration)
--   New 2 = ML Infrastructure Bridge (brand new)
--   New 6 = Multimodal & Emerging (brand new)
-- ============================================================================

-- Step 1: Add new enum values to study_phase
ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '7';
ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '8';
ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '9';

-- Step 2: Add 'design' to evaluation_type
ALTER TYPE evaluation_type ADD VALUE IF NOT EXISTS 'design';

-- NOTE: Phase reassignment of existing data is handled by re-running
-- the seed script (seed-database.ts) which upserts with the new phase values.
-- The enum values '1' through '6' remain valid, so existing rows won't break.
-- After re-seeding, all concepts/resources will have their correct new phases.
