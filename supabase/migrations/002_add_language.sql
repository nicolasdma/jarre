-- Add language preference to user_profiles
ALTER TABLE user_profiles
ADD COLUMN language TEXT NOT NULL DEFAULT 'es';

-- Add check constraint for valid languages
ALTER TABLE user_profiles
ADD CONSTRAINT valid_language CHECK (language IN ('es', 'en'));

COMMENT ON COLUMN user_profiles.language IS 'User language preference: es (Spanish) or en (English)';
