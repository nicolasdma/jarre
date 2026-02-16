-- OpenClaw Case Study: 5 new Phase 9 concepts
-- Architecture analysis of a production AI agent system

INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('agent-protocol-design', 'Agent Protocol Design', 'agent-protocol-design',
   'Designing communication protocols for AI agents: session management, command translation, streaming, and lifecycle control. Patterns: request-response, NDJSON streams, gateway abstraction. Trade-offs between simplicity and expressiveness.',
   '9'::study_phase),
  ('plugin-channel-architecture', 'Plugin & Channel Architecture', 'plugin-channel-architecture',
   'Extensible plugin architectures for multi-channel agent systems. Standardized interfaces (docks) abstract platform differences. Concerns: message normalization, security policies, onboarding flows, runtime monitoring.',
   '9'::study_phase),
  ('agent-skill-orchestration', 'Agent Skill Orchestration', 'agent-skill-orchestration',
   'How agents discover, authenticate, and invoke external tools at scale. Skill metadata, CLI tool integration, permission models, and execution sandboxing. The boundary between agent autonomy and safety controls.',
   '9'::study_phase),
  ('agent-memory-persistence', 'Agent Memory Persistence', 'agent-memory-persistence',
   'Practical implementations of persistent memory for stateful agents: file-backed short-term memory, vector search with LanceDB for long-term recall, autoCapture/autoRecall hooks. Trade-offs between retrieval accuracy, latency, and storage cost.',
   '9'::study_phase),
  ('agent-ui-generation', 'Agent UI Generation (A2UI)', 'agent-ui-generation',
   'Declarative frameworks for agents to generate rich, updateable UIs. JSON-based component catalogs, security-first rendering (no executable code from agents), framework-agnostic portability. The separation of UI intent from implementation.',
   '9'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('agent-protocol-design', 'system-design-patterns'),
  ('agent-protocol-design', 'react-pattern'),
  ('plugin-channel-architecture', 'system-design-patterns'),
  ('plugin-channel-architecture', 'framework-tradeoffs'),
  ('agent-skill-orchestration', 'tool-use'),
  ('agent-skill-orchestration', 'agent-reliability'),
  ('agent-memory-persistence', 'external-memory'),
  ('agent-memory-persistence', 'vector-search'),
  ('agent-ui-generation', 'structured-output'),
  ('agent-ui-generation', 'production-architectures')
ON CONFLICT DO NOTHING;
