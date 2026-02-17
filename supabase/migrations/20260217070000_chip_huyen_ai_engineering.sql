-- Chip Huyen: AI Engineering — resource for Phase 10
-- Maps to existing Phase 10 concepts.

INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES (
  'p10-chip-huyen-ai-eng', 'AI Engineering: Building Applications with Foundation Models', 'book',
  'https://www.oreilly.com/library/view/ai-engineering/9781098166298/',
  'Chip Huyen',
  '10'::study_phase,
  'Comprehensive guide to building production AI applications: prompt engineering, RAG, fine-tuning, agents, evaluation, and deployment. Covers the full stack from model selection to production monitoring. Essential reference for AI engineers building with foundation models.',
  20
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p10-chip-huyen-ai-eng', 'llm-application-patterns', FALSE),
  ('p10-chip-huyen-ai-eng', 'build-vs-buy-ai', FALSE),
  ('p10-chip-huyen-ai-eng', 'inference-economics', FALSE),
  ('p10-chip-huyen-ai-eng', 'mlops-production', FALSE)
ON CONFLICT DO NOTHING;
