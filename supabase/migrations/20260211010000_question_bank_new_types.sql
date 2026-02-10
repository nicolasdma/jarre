-- Add higher-order question types to question_bank (Bloom 4-5)
-- Backwards-compatible: existing 231 questions untouched.

ALTER TYPE question_bank_type ADD VALUE 'scenario';
ALTER TYPE question_bank_type ADD VALUE 'limitation';
ALTER TYPE question_bank_type ADD VALUE 'error_spot';
