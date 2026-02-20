-- Voice tool calls: logs each function call made by the tutor during a session
CREATE TABLE voice_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  error TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_tool_calls_session ON voice_tool_calls(session_id, created_at);

ALTER TABLE voice_tool_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tool calls" ON voice_tool_calls
  FOR ALL USING (
    session_id IN (SELECT id FROM voice_sessions WHERE user_id = auth.uid())
  );
