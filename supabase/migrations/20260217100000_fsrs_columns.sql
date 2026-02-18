-- ============================================================================
-- JARRE - Migration: FSRS columns on review_schedule
-- ============================================================================
-- Adds FSRS state columns alongside existing SM-2 columns.
-- Coexistence during lazy migration: fsrs_stability IS NULL = not yet migrated.
-- Also adds 'good' to review_rating enum.
-- ============================================================================

-- Add 'good' to review_rating enum (before 'easy')
ALTER TYPE review_rating ADD VALUE 'good' BEFORE 'easy';

-- FSRS state columns
ALTER TABLE review_schedule ADD COLUMN fsrs_stability REAL;
ALTER TABLE review_schedule ADD COLUMN fsrs_difficulty REAL;
ALTER TABLE review_schedule ADD COLUMN fsrs_state SMALLINT DEFAULT 0;
ALTER TABLE review_schedule ADD COLUMN fsrs_reps INTEGER DEFAULT 0;
ALTER TABLE review_schedule ADD COLUMN fsrs_lapses INTEGER DEFAULT 0;
ALTER TABLE review_schedule ADD COLUMN fsrs_last_review TIMESTAMPTZ;
