-- Expand study_phase enum to include Phase 0 (Math Foundations)
-- Must be in separate migration from any INSERT that uses '0'.
ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '0';
