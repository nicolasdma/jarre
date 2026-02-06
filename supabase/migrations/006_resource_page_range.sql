-- Add page range columns for PDF chapter extraction
ALTER TABLE resources
ADD COLUMN start_page INTEGER,
ADD COLUMN end_page INTEGER;

COMMENT ON COLUMN resources.start_page IS 'First page of this resource in the source PDF';
COMMENT ON COLUMN resources.end_page IS 'Last page of this resource in the source PDF';
