-- Token Usage Tracking
-- Tracks DeepSeek API token consumption per user per call.
-- Gemini Live (voice) does NOT expose token usage, so only DeepSeek is tracked.

CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own token usage" ON token_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_token_usage_user ON token_usage(user_id, created_at);
