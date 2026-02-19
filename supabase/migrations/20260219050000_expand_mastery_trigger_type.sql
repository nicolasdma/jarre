-- Expand mastery_trigger_type enum to match TypeScript MasteryTriggerType
-- DB had 4 values (evaluation, project, manual, decay), TS has 7.
-- Without this, inserting micro_test/voice_evaluation/teach_session causes constraint violation.

ALTER TYPE mastery_trigger_type ADD VALUE IF NOT EXISTS 'micro_test';
ALTER TYPE mastery_trigger_type ADD VALUE IF NOT EXISTS 'voice_evaluation';
ALTER TYPE mastery_trigger_type ADD VALUE IF NOT EXISTS 'teach_session';
