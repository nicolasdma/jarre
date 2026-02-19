-- ============================================================================
-- Migration: Reactive Knowledge System
-- Date: 2026-02-19
--
-- Creates the foundational tables for the Reactive Knowledge System feature:
--   - user_resources: user-added external resources (videos, articles, papers)
--   - user_resource_concepts: links user resources to curriculum concepts
--   - consumption_log: unified timeline of all learning activities
--
-- Also extends voice_sessions with 'exploration' session type and
-- user_resource_id foreign key.
-- ============================================================================

-- ===========================================
-- 1. user_resources
-- ===========================================
CREATE TABLE user_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT NOT NULL DEFAULT 'article' CHECK (type IN ('youtube', 'article', 'paper', 'book', 'podcast', 'other')),
  raw_content TEXT,
  user_notes TEXT,
  summary TEXT,
  extracted_concepts JSONB DEFAULT '[]',
  coverage_score REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- 2. user_resource_concepts
-- ===========================================
CREATE TABLE user_resource_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_resource_id UUID NOT NULL REFERENCES user_resources(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'relates' CHECK (relationship IN ('extends', 'applies', 'contrasts', 'exemplifies', 'relates')),
  relevance_score REAL DEFAULT 0.5,
  extracted_concept_name TEXT NOT NULL,
  explanation TEXT,
  source TEXT NOT NULL DEFAULT 'ingestion' CHECK (source IN ('ingestion', 'voice_discovery', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_resource_id, concept_id, extracted_concept_name)
);

-- ===========================================
-- 3. consumption_log
-- ===========================================
CREATE TABLE consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES resources(id) ON DELETE SET NULL,
  user_resource_id UUID REFERENCES user_resources(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'completed', 'evaluated', 'discussed', 'added', 'reviewed')),
  concepts_touched TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumption_log_resource_xor CHECK (
    (resource_id IS NOT NULL AND user_resource_id IS NULL) OR
    (resource_id IS NULL AND user_resource_id IS NOT NULL) OR
    (resource_id IS NULL AND user_resource_id IS NULL)
  )
);

-- ===========================================
-- 4. Extend voice_sessions
-- ===========================================
ALTER TABLE voice_sessions DROP CONSTRAINT IF EXISTS voice_sessions_session_type_check;
ALTER TABLE voice_sessions ADD CONSTRAINT voice_sessions_session_type_check
  CHECK (session_type IN ('teaching', 'evaluation', 'practice', 'exploration'));

ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS user_resource_id UUID REFERENCES user_resources(id);

-- ===========================================
-- 5. RLS Policies
-- ===========================================

-- user_resources
ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_resources_select" ON user_resources
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_resources_insert" ON user_resources
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_resources_update" ON user_resources
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_resources_delete" ON user_resources
  FOR DELETE USING (user_id = auth.uid());

-- user_resource_concepts (ownership checked via join to user_resources)
ALTER TABLE user_resource_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_resource_concepts_select" ON user_resource_concepts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_resources
      WHERE id = user_resource_concepts.user_resource_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "user_resource_concepts_insert" ON user_resource_concepts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_resources
      WHERE id = user_resource_concepts.user_resource_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "user_resource_concepts_delete" ON user_resource_concepts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_resources
      WHERE id = user_resource_concepts.user_resource_id
        AND user_id = auth.uid()
    )
  );

-- consumption_log
ALTER TABLE consumption_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consumption_log_select" ON consumption_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "consumption_log_insert" ON consumption_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "consumption_log_update" ON consumption_log
  FOR UPDATE USING (user_id = auth.uid());

-- ===========================================
-- 6. Indexes
-- ===========================================
CREATE INDEX idx_user_resources_user_created ON user_resources (user_id, created_at DESC);

CREATE INDEX idx_user_resource_concepts_resource ON user_resource_concepts (user_resource_id);
CREATE INDEX idx_user_resource_concepts_concept ON user_resource_concepts (concept_id);

CREATE INDEX idx_consumption_log_user_created ON consumption_log (user_id, created_at DESC);
CREATE INDEX idx_consumption_log_resource ON consumption_log (resource_id);
CREATE INDEX idx_consumption_log_user_resource ON consumption_log (user_resource_id);
