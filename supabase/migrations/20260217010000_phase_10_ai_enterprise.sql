-- Phase 10: AI para Empresa / AI for Enterprise
-- Covers: AI strategy, discovery, build vs buy, governance, enterprise architecture,
-- change management, AI economics, and consulting/freelance positioning.

-- Note: enum expansion is in 20260217000000_expand_phase_10.sql

-- 1. Concepts
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  -- AI Strategy & Business Value
  ('ai-strategy-roi', 'AI Strategy & ROI Analysis',
   'ai-strategy-roi',
   'Framework for evaluating whether an AI initiative creates real business value. Includes identifying high-impact use cases, estimating costs (compute, data, talent), projecting revenue impact, and defining success metrics. Key insight: 70% of AI projects fail not from technical issues but from misaligned business objectives.',
   '10'::study_phase),

  ('ai-maturity-models', 'AI Maturity Models',
   'ai-maturity-models',
   'Frameworks that classify organizations by their AI adoption stage: from ad-hoc experimentation to systematic integration. Common models include Gartner''s AI Maturity Model and McKinsey''s AI adoption archetypes (Bold Innovators, Disciplined Integrators, etc.). Used to assess where a company is and what it needs to advance.',
   '10'::study_phase),

  -- AI Discovery & Scoping
  ('ai-use-case-discovery', 'AI Use Case Discovery',
   'ai-use-case-discovery',
   'Structured process for identifying which business problems are good candidates for AI solutions. Uses frameworks like Impact/Effort matrices, AI Use Case Canvas, and OpenAI''s 6 primitives. Key principle: not every problem needs AI — the best discovery process also identifies what NOT to build.',
   '10'::study_phase),

  ('data-readiness-assessment', 'Data Readiness Assessment',
   'data-readiness-assessment',
   'Evaluation of whether an organization''s data is sufficient for an AI initiative. Covers data availability, quality, volume, labeling, privacy constraints, and pipeline maturity. A common failure mode: companies invest in AI before verifying their data can support it.',
   '10'::study_phase),

  -- Build vs Buy
  ('build-vs-buy-ai', 'Build vs Buy for AI',
   'build-vs-buy-ai',
   'Decision framework for choosing between API-based solutions (OpenAI, Gemini), fine-tuning existing models, or training from scratch. Factors: cost, latency, data privacy, competitive advantage, and maintenance burden. Industry trend (2025): 72% of enterprises use APIs, fine-tuning is declining, prompt engineering dominates.',
   '10'::study_phase),

  ('llm-application-patterns', 'LLM Application Architecture Patterns',
   'llm-application-patterns',
   'Recurring architectural patterns for LLM-powered applications: RAG pipelines, agent loops, multi-model routing, guardrail chains, caching layers, and human-in-the-loop workflows. Defined by a16z''s Emerging Architectures and Chip Huyen''s AI Engineering frameworks.',
   '10'::study_phase),

  -- AI Governance & Responsible AI
  ('ai-governance-frameworks', 'AI Governance Frameworks',
   'ai-governance-frameworks',
   'Regulatory and voluntary frameworks for responsible AI deployment. Key frameworks: NIST AI Risk Management Framework (Govern, Map, Measure, Manage), EU AI Act (risk tiers: unacceptable, high, limited, minimal), and Microsoft Responsible AI Principles. Essential for enterprise adoption and compliance.',
   '10'::study_phase),

  ('ai-security-enterprise', 'AI Security in Enterprise',
   'ai-security-enterprise',
   'Security practices specific to AI systems: prompt injection defense, data poisoning prevention, model access controls, PII handling in training data, audit trails for model decisions, and data residency compliance. Goes beyond traditional AppSec to cover AI-specific attack surfaces.',
   '10'::study_phase),

  -- Enterprise Architecture for AI
  ('mlops-production', 'MLOps & Production ML',
   'mlops-production',
   'Practices for operationalizing ML models: CI/CD for models, experiment tracking, model versioning, A/B testing, monitoring for drift, and automated retraining pipelines. Key tools: SageMaker, Vertex AI, MLflow, Weights & Biases. Martin Fowler''s CD4ML defines the canonical approach.',
   '10'::study_phase),

  ('enterprise-ai-integration', 'Enterprise AI Integration',
   'enterprise-ai-integration',
   'Patterns for integrating AI into existing enterprise systems (CRMs, ERPs, data warehouses). Covers API design, event-driven architectures, data mesh principles, and the "AI mesh" concept for managing multiple models. Key challenge: AI is not a standalone system — it must fit into existing workflows.',
   '10'::study_phase),

  -- Change Management & AI Adoption
  ('ai-change-management', 'AI Change Management',
   'ai-change-management',
   'Strategies for driving organizational adoption of AI tools. 70% of AI challenges are people/process, not technology. Covers Kotter''s framework applied to AI, behavioral science for adoption, job redesign for human-AI teams, and managing resistance. Key insight from McKinsey: treat AI adoption as workflow reconfiguration, not technology deployment.',
   '10'::study_phase),

  -- AI Economics & Cost Optimization
  ('inference-economics', 'Inference Economics',
   'inference-economics',
   'Understanding and optimizing the cost of running AI in production. Covers: cost per token across providers, quantization (60-70% cost reduction), speculative decoding, caching strategies, model routing (cheap model first, expensive fallback), and the trend of costs falling 10x/year. Essential for sustainable AI deployment.',
   '10'::study_phase),

  ('ai-pricing-models', 'AI Product Pricing Models',
   'ai-pricing-models',
   'How to price AI-powered products and services. Shift from per-seat/per-token to outcome-based pricing. Covers: cost-plus pricing, value-based pricing, usage-based tiers, and the economics of AI SaaS margins (typically 50-60% vs 80% for traditional SaaS due to inference costs).',
   '10'::study_phase),

  -- Consulting & Freelance
  ('ai-consulting-practice', 'AI Consulting Practice',
   'ai-consulting-practice',
   'How to position and operate as an AI consultant. Covers: discovery workshops ($1.5-3K), implementation projects ($5-15K), retainers ($1-3K/month), value-based pricing, vertical specialization (25-40% premium), client acquisition, and proposal structure. Rates range from $150-500/hour depending on specialization and experience.',
   '10'::study_phase),

  -- AWS Certification
  ('aws-ai-services', 'AWS AI/ML Services Ecosystem',
   'aws-ai-services',
   'Overview of AWS AI/ML service portfolio: SageMaker (training, hosting, pipelines), Bedrock (foundation model APIs, RAG, agents), Comprehend, Rekognition, Textract, Polly, Lex, and Personalize. Understanding when to use managed services vs custom solutions. Foundation for AWS AI certifications.',
   '10'::study_phase)

ON CONFLICT (id) DO NOTHING;

-- 3. Concept prerequisites (Phase 10 builds on earlier phases)
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('build-vs-buy-ai', 'llm-application-patterns'),
  ('inference-economics', 'llm-application-patterns'),
  ('ai-pricing-models', 'inference-economics'),
  ('mlops-production', 'enterprise-ai-integration'),
  ('ai-consulting-practice', 'ai-strategy-roi'),
  ('ai-consulting-practice', 'ai-use-case-discovery')
ON CONFLICT DO NOTHING;

-- 4. Resources
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  -- Ch 1: AI Strategy & Business Value
  ('p10-ai-strategy', 'AI Strategy & Business Value', 'course',
   'https://www.coursera.org/learn/ai-for-everyone',
   'Andrew Ng / HBR / McKinsey',
   '10'::study_phase,
   'How to evaluate AI opportunities, calculate ROI, and align AI with business objectives. Covers Andrew Ng''s AI Transformation Playbook, McKinsey State of AI 2025, and HBR strategic frameworks.',
   8),

  -- Ch 2: AI Discovery & Scoping
  ('p10-ai-discovery', 'AI Discovery & Scoping', 'article',
   'https://pair.withgoogle.com/guidebook/',
   'Google PAIR / OpenAI / IDEO',
   '10'::study_phase,
   'Frameworks for identifying AI use cases, running discovery workshops, and assessing data readiness. Includes Google People+AI Guidebook, OpenAI''s 6 Primitives, and IDEO AI x Design Thinking.',
   6),

  -- Ch 3: Build vs Buy
  ('p10-build-vs-buy', 'Build vs Buy: APIs, Fine-tuning & Custom Models', 'article',
   'https://a16z.com/generative-ai-enterprise-2024/',
   'a16z / Chip Huyen',
   '10'::study_phase,
   'Decision frameworks for API vs fine-tuning vs training. a16z enterprise reports (2024-2025), Chip Huyen''s AI Engineering patterns, and emerging LLM application architectures.',
   10),

  -- Ch 4: AI Governance & Responsible AI
  ('p10-ai-governance', 'AI Governance & Responsible AI', 'article',
   'https://www.nist.gov/artificial-intelligence/executive-order-safe-secure-and-trustworthy-artificial-intelligence',
   'NIST / EU / Microsoft',
   '10'::study_phase,
   'Regulatory frameworks and responsible AI practices. NIST AI RMF, EU AI Act compliance, Microsoft Responsible AI principles, and enterprise security for AI systems.',
   8),

  -- Ch 5: Enterprise Architecture for AI
  ('p10-enterprise-arch', 'Enterprise Architecture for AI', 'article',
   'https://martinfowler.com/articles/engineering-practices-llm.html',
   'Martin Fowler / Thoughtworks',
   '10'::study_phase,
   'MLOps, CI/CD for ML, production deployment patterns, and integrating AI into existing enterprise systems. Martin Fowler''s CD4ML, LLM engineering practices, and cloud platform comparison.',
   10),

  -- Ch 6: Change Management & AI Adoption
  ('p10-change-management', 'Change Management & AI Adoption', 'article',
   'https://hbr.org/2025/11/overcoming-the-organizational-barriers-to-ai-adoption',
   'HBR / McKinsey',
   '10'::study_phase,
   '70% of AI challenges are people/process. Covers organizational barriers, behavioral science for adoption, job redesign for human-AI collaboration, and McKinsey''s reconfiguration framework.',
   6),

  -- Ch 7: AI Economics & Cost Optimization
  ('p10-ai-economics', 'AI Economics & Inference Costs', 'article',
   'https://a16z.com/llmflation-llm-inference-cost/',
   'a16z / Epoch AI',
   '10'::study_phase,
   'Understanding and optimizing AI costs in production. Inference economics, cost per token trends (falling 10x/year), quantization, model routing, caching, and AI product pricing models.',
   6),

  -- Ch 8: AI Consulting & Positioning
  ('p10-ai-consulting', 'AI Consulting & Professional Positioning', 'article',
   'https://stack.expert/blog/ai-consulting-proposals-that-close',
   'Stack / Various',
   '10'::study_phase,
   'How to position as an AI consultant: pricing frameworks ($150-500/hr), proposal structure, vertical specialization, client acquisition, and building a consulting practice.',
   4),

  -- Bonus: AWS Certification Prep
  ('p10-aws-ai-cert', 'AWS AI Practitioner Certification Prep', 'course',
   'https://skillbuilder.aws/exam-prep/ai-practitioner',
   'AWS Training',
   '10'::study_phase,
   'Preparation for AWS Certified AI Practitioner (AIF-C01). Covers AWS AI/ML services (SageMaker, Bedrock), responsible AI, and cloud AI architecture. $100 exam, foundational level.',
   12)

ON CONFLICT (id) DO NOTHING;

-- 5. Resource-concept mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  -- Ch 1: AI Strategy
  ('p10-ai-strategy', 'ai-strategy-roi', FALSE),
  ('p10-ai-strategy', 'ai-maturity-models', FALSE),

  -- Ch 2: Discovery & Scoping
  ('p10-ai-discovery', 'ai-use-case-discovery', FALSE),
  ('p10-ai-discovery', 'data-readiness-assessment', FALSE),

  -- Ch 3: Build vs Buy
  ('p10-build-vs-buy', 'build-vs-buy-ai', FALSE),
  ('p10-build-vs-buy', 'llm-application-patterns', FALSE),

  -- Ch 4: Governance
  ('p10-ai-governance', 'ai-governance-frameworks', FALSE),
  ('p10-ai-governance', 'ai-security-enterprise', FALSE),

  -- Ch 5: Enterprise Architecture
  ('p10-enterprise-arch', 'mlops-production', FALSE),
  ('p10-enterprise-arch', 'enterprise-ai-integration', FALSE),

  -- Ch 6: Change Management
  ('p10-change-management', 'ai-change-management', FALSE),

  -- Ch 7: AI Economics
  ('p10-ai-economics', 'inference-economics', FALSE),
  ('p10-ai-economics', 'ai-pricing-models', FALSE),

  -- Ch 8: Consulting
  ('p10-ai-consulting', 'ai-consulting-practice', FALSE),

  -- AWS Cert
  ('p10-aws-ai-cert', 'aws-ai-services', FALSE)

ON CONFLICT DO NOTHING;
