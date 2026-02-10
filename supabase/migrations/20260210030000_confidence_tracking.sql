-- Add confidence tracking to review_schedule
-- Stores self-reported confidence level (1-3) per question attempt
-- NULL for existing records (backward compatible)
ALTER TABLE review_schedule ADD COLUMN confidence_level smallint;
