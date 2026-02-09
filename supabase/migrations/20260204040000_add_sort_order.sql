-- ============================================================================
-- Add sort_order column to resources table
-- ============================================================================
-- This allows explicit ordering of resources within each phase,
-- instead of relying on alphabetical ordering by title.

ALTER TABLE resources
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX idx_resources_sort_order ON resources(phase, sort_order);

-- Update comment
COMMENT ON COLUMN resources.sort_order IS 'Order within phase. Lower numbers appear first.';
