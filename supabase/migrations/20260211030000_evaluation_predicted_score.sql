-- Add predicted_score column for confidence calibration.
-- Users predict their score before seeing results.
-- Comparison between predicted vs actual builds metacognitive awareness.

ALTER TABLE evaluations ADD COLUMN predicted_score INTEGER
  CHECK (predicted_score >= 0 AND predicted_score <= 100);
