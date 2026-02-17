-- Section notes: free-form scratchpad per user per section
CREATE TABLE section_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

ALTER TABLE section_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON section_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON section_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON section_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON section_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_section_notes_user_section
  ON section_notes(user_id, section_id);
