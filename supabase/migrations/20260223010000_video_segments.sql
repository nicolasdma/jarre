-- Video segments: embed YouTube clips positioned after bold headings in section content
-- Follows the same pattern as inline_quizzes (position_after_heading + sort_order)

CREATE TABLE video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  position_after_heading TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  youtube_video_id TEXT NOT NULL,
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;

-- Public read — content is not user-specific
CREATE POLICY "Public read" ON video_segments FOR SELECT USING (true);

CREATE INDEX idx_video_segments_section ON video_segments(section_id, sort_order);
