-- Track resource ownership for user-generated pipeline content
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by);
