-- Expand study_phase enum to include Phase 11 (LLM Systems Engineering)
-- Must be in separate migration from any INSERT that uses '11'.
ALTER TYPE study_phase ADD VALUE IF NOT EXISTS '11';
