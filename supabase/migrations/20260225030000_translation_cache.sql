-- Translation cache tables for on-demand content translation
-- Content is stored in original language; translations are cached per target language.
-- Drop pre-existing tables with wrong schema (empty, created during development)

DROP TABLE IF EXISTS quiz_translations CASCADE;
DROP TABLE IF EXISTS resource_translations CASCADE;
DROP TABLE IF EXISTS section_translations CASCADE;
-- Cache: translated section content
CREATE TABLE section_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  section_title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, language)
);
CREATE INDEX idx_section_translations_lookup
  ON section_translations(section_id, language);
ALTER TABLE section_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read section_translations" ON section_translations FOR SELECT USING (true);
CREATE POLICY "Service write section_translations" ON section_translations FOR ALL USING (true);
-- Cache: translated activate_data (summary, descriptions, etc.)
CREATE TABLE resource_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  activate_data JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_id, language)
);
ALTER TABLE resource_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read resource_translations" ON resource_translations FOR SELECT USING (true);
CREATE POLICY "Service write resource_translations" ON resource_translations FOR ALL USING (true);
-- Cache: translated quiz content
CREATE TABLE quiz_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES inline_quizzes(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  explanation TEXT NOT NULL,
  justification_hint TEXT,
  content_hash TEXT NOT NULL,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, language)
);
ALTER TABLE quiz_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quiz_translations" ON quiz_translations FOR SELECT USING (true);
CREATE POLICY "Service write quiz_translations" ON quiz_translations FOR ALL USING (true);
