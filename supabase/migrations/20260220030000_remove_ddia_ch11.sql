-- Archive DDIA Chapter 11 (Stream Processing) — hide from library without losing content
-- Rationale: Stream processing is tangential to AI/LLM Systems Architect path.
-- Core distributed systems knowledge is covered by Ch1-9.
-- All translated content, quizzes, and sections are preserved for potential reactivation.

BEGIN;

-- 1. Add is_archived column to resources (soft-delete pattern)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Archive ddia-ch11
UPDATE resources SET is_archived = TRUE WHERE id = 'ddia-ch11';

COMMIT;
