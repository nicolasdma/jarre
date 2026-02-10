-- Add review_state column to learn_progress for REPASAR step persistence.
-- current_step is TEXT, so 'review' works without altering the type.
ALTER TABLE learn_progress ADD COLUMN review_state JSONB DEFAULT NULL;
