-- Add canvas data and split position columns for split-view study interface
ALTER TABLE resource_notes
ADD COLUMN canvas_data JSONB,
ADD COLUMN split_position INTEGER DEFAULT 50;

-- Add comment explaining the new columns
COMMENT ON COLUMN resource_notes.canvas_data IS 'tldraw canvas snapshot data for free-form notes';
COMMENT ON COLUMN resource_notes.split_position IS 'Split pane position (0-100) for PDF/canvas split view';
