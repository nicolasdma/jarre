CREATE TABLE inline_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  position_after_heading TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL CHECK (format IN ('mc', 'tf')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  academic_reference TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inline_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON inline_quizzes FOR SELECT USING (true);
CREATE INDEX idx_inline_quizzes_section ON inline_quizzes(section_id, sort_order);
