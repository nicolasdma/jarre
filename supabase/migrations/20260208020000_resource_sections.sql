-- Migration 008: resource_sections table
-- Breaks resources into concept-level sections for the LEARN step
-- Each section contains translated content from the source material

CREATE TABLE resource_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT REFERENCES resources(id) NOT NULL,
  concept_id TEXT REFERENCES concepts(id) NOT NULL,
  section_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  content_original TEXT,
  start_page INTEGER,
  end_page INTEGER,
  paragraph_range INTEGER[],
  segmentation_confidence REAL,
  manually_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_id, concept_id, sort_order)
);

-- RLS: content is public read
ALTER TABLE resource_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON resource_sections FOR SELECT USING (true);

-- Index for learn page queries (fetch all sections for a resource, ordered)
CREATE INDEX idx_resource_sections_resource
  ON resource_sections(resource_id, sort_order);

-- Index for concept-based lookups
CREATE INDEX idx_resource_sections_concept
  ON resource_sections(concept_id);
