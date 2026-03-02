-- Translation cache tables for on-demand content translation

CREATE TABLE IF NOT EXISTS section_translations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id       UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  language         TEXT NOT NULL,
  section_title    TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  content_hash     TEXT NOT NULL,
  translated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, language)
);

CREATE TABLE IF NOT EXISTS resource_translations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  language      TEXT NOT NULL,
  activate_data JSONB NOT NULL,
  content_hash  TEXT NOT NULL,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_id, language)
);

CREATE TABLE IF NOT EXISTS quiz_translations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id            UUID NOT NULL REFERENCES inline_quizzes(id) ON DELETE CASCADE,
  language           TEXT NOT NULL,
  question_text      TEXT NOT NULL,
  options            JSONB,
  explanation        TEXT,
  content_hash       TEXT NOT NULL,
  translated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_section_translations_lookup
  ON section_translations(section_id, language);

-- RLS: public read, service write
ALTER TABLE section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_translations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- section_translations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'section_translations' AND policyname = 'Public read section_translations') THEN
    CREATE POLICY "Public read section_translations" ON section_translations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'section_translations' AND policyname = 'Service write section_translations') THEN
    CREATE POLICY "Service write section_translations" ON section_translations FOR ALL USING (true);
  END IF;

  -- resource_translations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resource_translations' AND policyname = 'Public read resource_translations') THEN
    CREATE POLICY "Public read resource_translations" ON resource_translations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resource_translations' AND policyname = 'Service write resource_translations') THEN
    CREATE POLICY "Service write resource_translations" ON resource_translations FOR ALL USING (true);
  END IF;

  -- quiz_translations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_translations' AND policyname = 'Public read quiz_translations') THEN
    CREATE POLICY "Public read quiz_translations" ON quiz_translations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_translations' AND policyname = 'Service write quiz_translations') THEN
    CREATE POLICY "Service write quiz_translations" ON quiz_translations FOR ALL USING (true);
  END IF;
END $$;
