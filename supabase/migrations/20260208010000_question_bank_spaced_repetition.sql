-- ============================================================================
-- JARRE - Migration 007: Question Bank + Spaced Repetition + Mastery Model
-- ============================================================================
-- Adds:
--   - question_bank: pre-generated factual questions per concept
--   - review_schedule: SM-2 spaced repetition state per user/question
--   - mastery_history: audit trail of mastery level changes
--   - project_concepts: maps projects to concepts (for level 2 advancement)
--   - New columns on concept_progress for level tracking
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE question_bank_type AS ENUM (
    'definition',
    'fact',
    'property',
    'guarantee',
    'complexity',
    'comparison'
);

CREATE TYPE review_rating AS ENUM ('wrong', 'hard', 'easy');

CREATE TYPE mastery_trigger_type AS ENUM ('evaluation', 'project', 'manual', 'decay');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Question Bank: pre-generated factual questions (content table, no RLS)
CREATE TABLE question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    type question_bank_type NOT NULL,
    question_text TEXT NOT NULL,
    expected_answer TEXT NOT NULL,
    difficulty SMALLINT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 3),
    related_concept_id TEXT REFERENCES concepts(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Schedule: SM-2 state per user/question (user table, with RLS)
CREATE TABLE review_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    last_rating review_rating,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, question_id)
);

-- Mastery History: audit trail of level changes (user table, with RLS)
CREATE TABLE mastery_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    old_level mastery_level NOT NULL,
    new_level mastery_level NOT NULL,
    trigger_type mastery_trigger_type NOT NULL,
    trigger_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Concepts: maps projects to concepts for level 2 advancement
CREATE TABLE project_concepts (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, concept_id)
);

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

ALTER TABLE concept_progress ADD COLUMN level_1_score INTEGER;
ALTER TABLE concept_progress ADD COLUMN level_2_project_id TEXT REFERENCES projects(id);
ALTER TABLE concept_progress ADD COLUMN level_3_score INTEGER;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_question_bank_concept ON question_bank(concept_id);
CREATE INDEX idx_question_bank_active ON question_bank(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_review_schedule_user_next ON review_schedule(user_id, next_review_at);
CREATE INDEX idx_mastery_history_user ON mastery_history(user_id);
CREATE INDEX idx_mastery_history_concept ON mastery_history(user_id, concept_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- question_bank: public read (content table), no RLS needed
-- review_schedule: user-scoped
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own review schedule"
    ON review_schedule FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review schedule"
    ON review_schedule FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review schedule"
    ON review_schedule FOR UPDATE
    USING (auth.uid() = user_id);

-- mastery_history: user-scoped
ALTER TABLE mastery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mastery history"
    ON mastery_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mastery history"
    ON mastery_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- project_concepts: public read (content table), no RLS needed

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_question_bank_updated_at
    BEFORE UPDATE ON question_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_review_schedule_updated_at
    BEFORE UPDATE ON review_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
