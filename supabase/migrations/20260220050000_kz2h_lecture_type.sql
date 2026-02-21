-- ============================================================================
-- Add 'lecture' resource type and update kz2h-* resources
-- Lectures are structured video content that belongs in the main library view,
-- unlike supplementary 'video' resources which are hidden by default.
-- ============================================================================

BEGIN;

-- Add 'lecture' to the resource_type enum
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'lecture';

COMMIT;

-- Must be in a separate transaction after ALTER TYPE
BEGIN;

-- Update kz2h-* videos to 'lecture' type
UPDATE resources SET type = 'lecture'
WHERE id LIKE 'kz2h-%';

COMMIT;
