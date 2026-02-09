-- ============================================================================
-- JARRE - Initial Database Schema
-- ============================================================================
-- This migration creates all tables for the learning system.
-- Run with: supabase db push (or via Supabase dashboard)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE resource_type AS ENUM ('paper', 'book', 'video', 'course', 'article');
CREATE TYPE study_phase AS ENUM ('1', '2', '3', '4', '5', '6');
CREATE TYPE mastery_level AS ENUM ('0', '1', '2', '3', '4');
CREATE TYPE evaluation_type AS ENUM ('explanation', 'scenario', 'error_detection', 'connection', 'tradeoff');
CREATE TYPE evaluation_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'completed');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Concepts: atomic units of knowledge
CREATE TABLE concepts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    canonical_definition TEXT NOT NULL,
    phase study_phase NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Concept prerequisites (DAG)
CREATE TABLE concept_prerequisites (
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    prerequisite_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    PRIMARY KEY (concept_id, prerequisite_id),
    CHECK (concept_id != prerequisite_id)
);

-- Resources: papers, books, videos, courses, articles
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type resource_type NOT NULL,
    url TEXT,
    author TEXT,
    phase study_phase NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(4,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resource-Concept mapping (what concepts a resource teaches)
CREATE TABLE resource_concepts (
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    is_prerequisite BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (resource_id, concept_id)
);

-- Projects: practical exercises per phase
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    phase study_phase NOT NULL,
    description TEXT NOT NULL,
    deliverables TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USER TABLES (with RLS)
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    current_phase study_phase NOT NULL DEFAULT '1',
    total_evaluations INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User progress on concepts
CREATE TABLE concept_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    level mastery_level NOT NULL DEFAULT '0',
    last_evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concept_id)
);

-- User progress on projects
CREATE TABLE project_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status project_status NOT NULL DEFAULT 'not_started',
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, project_id)
);

-- Evaluations: sessions where user is tested
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    status evaluation_status NOT NULL DEFAULT 'in_progress',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    prompt_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Evaluation questions
CREATE TABLE evaluation_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    type evaluation_type NOT NULL,
    question TEXT NOT NULL,
    incorrect_statement TEXT, -- for error_detection type
    related_concept_id TEXT REFERENCES concepts(id), -- for connection type
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation responses (user answers + AI feedback)
CREATE TABLE evaluation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User notes on resources
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flagged questions (user reports bad question)
CREATE TABLE flagged_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE CASCADE,
    reason TEXT NOT NULL, -- 'bad_question', 'wrong_answer', 'unclear', 'other'
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_concepts_phase ON concepts(phase);
CREATE INDEX idx_resources_phase ON resources(phase);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_concept_progress_user ON concept_progress(user_id);
CREATE INDEX idx_concept_progress_level ON concept_progress(level);
CREATE INDEX idx_evaluations_user ON evaluations(user_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluation_questions_evaluation ON evaluation_questions(evaluation_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_questions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policies for concept_progress
CREATE POLICY "Users can view own progress"
    ON concept_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON concept_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON concept_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for project_progress
CREATE POLICY "Users can view own project progress"
    ON project_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project progress"
    ON project_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project progress"
    ON project_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for evaluations
CREATE POLICY "Users can view own evaluations"
    ON evaluations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations"
    ON evaluations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations"
    ON evaluations FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for evaluation_questions (through evaluation ownership)
CREATE POLICY "Users can view questions from own evaluations"
    ON evaluation_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evaluations
            WHERE evaluations.id = evaluation_questions.evaluation_id
            AND evaluations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions to own evaluations"
    ON evaluation_questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluations
            WHERE evaluations.id = evaluation_questions.evaluation_id
            AND evaluations.user_id = auth.uid()
        )
    );

-- Policies for evaluation_responses (through question → evaluation ownership)
CREATE POLICY "Users can view responses from own evaluations"
    ON evaluation_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evaluation_questions eq
            JOIN evaluations e ON e.id = eq.evaluation_id
            WHERE eq.id = evaluation_responses.question_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert responses to own evaluations"
    ON evaluation_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluation_questions eq
            JOIN evaluations e ON e.id = eq.evaluation_id
            WHERE eq.id = evaluation_responses.question_id
            AND e.user_id = auth.uid()
        )
    );

-- Policies for user_notes
CREATE POLICY "Users can view own notes"
    ON user_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON user_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON user_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON user_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for flagged_questions
CREATE POLICY "Users can view own flags"
    ON flagged_questions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert flags"
    ON flagged_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PUBLIC READ ACCESS (for content tables)
-- ============================================================================

-- Content tables are readable by everyone (no RLS needed for SELECT)
-- But only admins can modify (handled by not granting INSERT/UPDATE/DELETE)

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_concepts_updated_at
    BEFORE UPDATE ON concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_concept_progress_updated_at
    BEFORE UPDATE ON concept_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_progress_updated_at
    BEFORE UPDATE ON project_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON user_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, current_phase)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
        '1'::study_phase
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Could not create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
