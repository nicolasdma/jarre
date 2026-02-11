-- Section annotations: text highlights + notes per user per section
CREATE TABLE section_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL,
  prefix TEXT NOT NULL DEFAULT '',
  suffix TEXT NOT NULL DEFAULT '',
  segment_index INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE section_annotations ENABLE ROW LEVEL SECURITY;

-- User isolation: users can only access their own annotations
CREATE POLICY "Users can view own annotations"
  ON section_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annotations"
  ON section_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON section_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON section_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- Composite index for fetching all annotations for a user+section
CREATE INDEX idx_section_annotations_user_section
  ON section_annotations(user_id, section_id);
