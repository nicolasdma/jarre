-- Add mixed-format support (MC/TF) to question_bank for interleaved review sessions.
-- Existing 231 questions remain as format='open' (default).

ALTER TABLE question_bank ADD COLUMN format TEXT NOT NULL DEFAULT 'open'
  CHECK (format IN ('open', 'mc', 'tf'));

ALTER TABLE question_bank ADD COLUMN options JSONB;

ALTER TABLE question_bank ADD COLUMN correct_answer TEXT;

ALTER TABLE question_bank ADD COLUMN explanation TEXT;

-- Allow NULL expected_answer for MC/TF questions (answer is in correct_answer instead)
ALTER TABLE question_bank ALTER COLUMN expected_answer DROP NOT NULL;
