-- ============================================================================
-- JARRE - Migration: Concept Cards table
-- ============================================================================
-- Rich memorization cards per concept, beyond question_bank.
-- Types: recall, fill_blank, true_false, connect, scenario_micro
-- Public read (content table), no RLS needed.
-- ============================================================================

CREATE TABLE concept_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN (
    'recall', 'fill_blank', 'true_false', 'connect', 'scenario_micro'
  )),
  front_content JSONB NOT NULL,
  back_content JSONB NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  related_concept_id TEXT REFERENCES concepts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_concept_cards_concept ON concept_cards(concept_id);
CREATE INDEX idx_concept_cards_active ON concept_cards(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_concept_cards_type ON concept_cards(card_type);

-- Expand review_schedule to support concept_cards
ALTER TABLE review_schedule ADD COLUMN card_id UUID REFERENCES concept_cards(id);
ALTER TABLE review_schedule ALTER COLUMN question_id DROP NOT NULL;

-- Constraint: one source must exist
ALTER TABLE review_schedule ADD CONSTRAINT review_schedule_has_source
  CHECK (question_id IS NOT NULL OR card_id IS NOT NULL);

-- Unique constraint for card-based reviews
CREATE UNIQUE INDEX idx_review_schedule_user_card
  ON review_schedule(user_id, card_id) WHERE card_id IS NOT NULL;
