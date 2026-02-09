-- Resource notes with structured sections
-- Allows users to take hierarchical notes (sections > subsections > markdown content)

CREATE TABLE resource_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    sections JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, resource_id)
);

-- Row Level Security (user isolation)
ALTER TABLE resource_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
    ON resource_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON resource_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON resource_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON resource_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_resource_notes_updated_at
    BEFORE UPDATE ON resource_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for efficient user queries
CREATE INDEX idx_resource_notes_user ON resource_notes(user_id);
CREATE INDEX idx_resource_notes_resource ON resource_notes(resource_id);

COMMENT ON TABLE resource_notes IS 'Structured notes for resources with sections and subsections';
COMMENT ON COLUMN resource_notes.sections IS 'JSONB array of {id, title, order, subsections: [{id, title, order, content}]}';
