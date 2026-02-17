-- Phase 10: Project — AI Strategy & Implementation Proposal
-- This adds the missing milestone project for Phase 10.

INSERT INTO projects (id, title, phase, description, deliverables)
VALUES (
  'project-ai-strategy',
  'AI Strategy & Implementation Proposal',
  '10'::study_phase,
  'Develop a complete AI strategy and implementation proposal for a real or simulated organization. Covers the full consulting arc: assess AI maturity, discover use cases, analyze build vs buy, design governance, plan MLOps architecture, project costs, and drive adoption. Culminates in an executive presentation.',
  ARRAY[
    'AI Maturity Assessment using Gartner/McKinsey framework with current-state analysis and target-state roadmap',
    'Use Case Discovery: 5+ candidates scored with Impact/Effort matrix, top 3 selected with justification',
    'Build vs Buy analysis for top 3 use cases with cost estimates (API vs fine-tune vs train)',
    'Governance framework aligned with NIST AI RMF: risk tiers, approval process, audit trail design',
    'MLOps architecture design: CI/CD pipeline, model versioning, monitoring, drift detection',
    'Cost projection at 12 months with optimization strategies (caching, routing, quantization)',
    'Change management plan with stakeholder mapping and adoption metrics',
    'Executive presentation: 15 slides covering strategy, use cases, architecture, costs, and roadmap'
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_concepts (project_id, concept_id)
VALUES
  ('project-ai-strategy', 'ai-strategy-roi'),
  ('project-ai-strategy', 'ai-maturity-models'),
  ('project-ai-strategy', 'ai-use-case-discovery'),
  ('project-ai-strategy', 'data-readiness-assessment'),
  ('project-ai-strategy', 'build-vs-buy-ai'),
  ('project-ai-strategy', 'ai-governance-frameworks'),
  ('project-ai-strategy', 'mlops-production'),
  ('project-ai-strategy', 'inference-economics'),
  ('project-ai-strategy', 'ai-change-management'),
  ('project-ai-strategy', 'ai-consulting-practice')
ON CONFLICT DO NOTHING;
