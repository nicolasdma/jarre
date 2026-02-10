-- Add mc2 (two-tier MC) format to inline_quizzes.
-- mc2 = choose option + write justification (ICAP Constructive).

-- Drop and recreate the format check to include mc2
ALTER TABLE inline_quizzes DROP CONSTRAINT inline_quizzes_format_check;
ALTER TABLE inline_quizzes ADD CONSTRAINT inline_quizzes_format_check
  CHECK (format IN ('mc', 'tf', 'mc2'));

-- Optional hint shown after justification for self-comparison
ALTER TABLE inline_quizzes ADD COLUMN justification_hint TEXT;
