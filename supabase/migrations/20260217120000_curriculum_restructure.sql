-- ============================================================================
-- Curriculum Restructure: 12-month executable curriculum
-- ============================================================================
-- Problem: The expand_phases_and_types migration (20260216010000) expanded the
-- enum from 6→9+ phases, but the data re-mapping NEVER executed. Resources and
-- concepts in old phases 2-6 still have their OLD phase numbers.
--
-- This migration performs:
-- 1. Phase remapping for resources and concepts
-- 2. Deletion of cut resources
-- 3. Insertion of new resources for Phase 2 (ML Infrastructure Bridge)
-- 4. Insertion of new resources for other phases
-- 5. Cross-phase moves (Phase 11→2, Phase 10→8, Phase 6→redistribute)
-- 6. Phase 0 integration into Phase 3
--
-- Old→New phase mapping:
--   Phase 0 (Math) → INTEGRATE into Phase 3
--   Phase 1 (Distributed) → Phase 1 (keep)
--   Phase 2 (old: Transformers+Agents) → SPLIT: Phase 3 + Phase 4
--   Phase 3 (old: RAG) → Phase 5
--   Phase 4 (old: Safety) → Phase 7
--   Phase 5 (old: Inference) → Phase 8
--   Phase 6 (old: Framework Critique) → Phase 9, then redistribute/delete
--   Phase 10 (AI Enterprise) → Phase 10 (hide in UI, keep in DB)
--   Phase 11 (LLM Systems) → Phase 11 (keep aspirational)
-- ============================================================================

-- ============================================================================
-- STEP 1: REMAP RESOURCES — Old Phase 2 → Phase 3 (Transformer Foundations)
-- ============================================================================
UPDATE resources SET phase = '3' WHERE id IN (
  'attention-paper',
  'scaling-laws-paper',
  'chinchilla-paper',
  'lora-paper',
  'karpathy-nn-zero-to-hero',
  'karpathy-build-gpt',
  'karpathy-intro-llms',
  'karpathy-llm-os',
  -- These may or may not exist in DB; UPDATE is safe either way
  'dpo-paper',
  'yarn-paper',
  'gpt3-paper'
);

-- ============================================================================
-- STEP 2: REMAP RESOURCES — Old Phase 2 → Phase 4 (Agents & Reasoning)
-- ============================================================================
UPDATE resources SET phase = '4' WHERE id IN (
  'react-paper',
  'reflexion-paper',
  'lilian-weng-agents',
  'stanford-cs25',
  'react-prompting-videos',
  'cot-prompting-videos',
  -- Resources that may exist from original seed
  'openai-o1-blog',
  'deepseek-r1-paper',
  's1-test-time-scaling',
  'agent-sandbox-patterns',
  'autogen-paper',
  'anthropic-effective-agents'
);

-- ============================================================================
-- STEP 3: REMAP RESOURCES — Old Phase 0 → Phase 3 (integrate math)
-- ============================================================================
UPDATE resources SET phase = '3' WHERE id IN (
  'p0-3b1b-linear-algebra',
  'p0-3b1b-neural-networks',
  'p0-cs229-probability',
  'p0-statquest',
  'p0-linear-algebra',
  'p0-calculus-optimization',
  'p0-probability'
);

-- ============================================================================
-- STEP 4: REMAP RESOURCES — Old Phase 3 → Phase 5 (RAG, Memory & Context)
-- ============================================================================
UPDATE resources SET phase = '5' WHERE id IN (
  'rag-paper',
  'lost-in-middle-paper',
  'long-context-paper',
  'memgpt-paper',
  'llamaindex-rag-pitfalls',
  'pinecone-rag-production',
  -- May exist from original seed
  'generative-agents-paper',
  'graphrag-paper',
  'ragas-docs',
  'hyde-paper',
  'colbertv2-paper',
  'self-rag-paper',
  'needle-in-haystack',
  'clawvault-agent-memory'
);

-- ============================================================================
-- STEP 5: REMAP RESOURCES — Old Phase 4 → Phase 7 (Safety, Guardrails & Eval)
-- ============================================================================
UPDATE resources SET phase = '7' WHERE id IN (
  'constitutional-ai-paper',
  'red-teaming-paper',
  'helm-paper',
  'ml-testing-practices',
  'anthropic-safety-talks',
  'deeplearning-ai-llm-evals',
  'harvard-ai-ethics',
  'stanford-hai-talks',
  -- May exist from original seed
  'self-consistency-paper',
  'ml-testing-survey',
  'owasp-llm-top10',
  'prompt-injection-guide',
  'nemo-guardrails-docs',
  'instructor-docs',
  'promptfoo-docs',
  'llm-as-judge-paper',
  'anthropic-alignment-paper'
);

-- ============================================================================
-- STEP 6: REMAP RESOURCES — Old Phase 5 → Phase 8 (Inference & Economics)
-- ============================================================================
UPDATE resources SET phase = '8' WHERE id IN (
  'vllm-paper',
  'speculative-decoding-paper',
  'gptcache-paper',
  'openai-pricing-docs',
  'anthropic-pricing-docs',
  'prompt-caching-docs',
  'llm-observability-guide',
  'langfuse-observability',
  'modal-vercel-infrastructure',
  -- May exist from original seed
  'compound-ai-systems-blog',
  'compound-ai-survey',
  'switch-transformers-paper',
  'openai-research-talks',
  'deepmind-systems-talks'
);

-- ============================================================================
-- STEP 7: REMAP RESOURCES — Old Phase 6 → redistribute
-- ============================================================================
-- Framework critique resources → redistribute to appropriate phases
UPDATE resources SET phase = '5' WHERE id IN (
  'rag-from-scratch',
  'rag-without-frameworks'
);

UPDATE resources SET phase = '4' WHERE id IN (
  'minimal-agent-loop',
  'openclaw-casestudy'
);

-- Remaining Phase 6 resources that aren't redistributed → Phase 9
UPDATE resources SET phase = '9' WHERE id IN (
  'dspy-paper',
  'dspy-docs',
  'applied-llms-blog'
);

-- ============================================================================
-- STEP 8: CATCH-ALL — Any remaining resources in old phases
-- ============================================================================
-- Safety net: if any resources were missed in the specific remaps above,
-- move them to the correct new phase based on old phase number.
UPDATE resources SET phase = '5' WHERE phase = '3' AND id NOT LIKE 'p%';
UPDATE resources SET phase = '7' WHERE phase = '4' AND id NOT LIKE 'p%';
UPDATE resources SET phase = '8' WHERE phase = '5' AND id NOT LIKE 'p%';
UPDATE resources SET phase = '9' WHERE phase = '6';

-- ============================================================================
-- STEP 9: REMAP CONCEPTS — Same pattern as resources
-- ============================================================================

-- Old Phase 2 → Phase 3 (Transformer concepts)
UPDATE concepts SET phase = '3' WHERE id IN (
  'attention-mechanism',
  'transformer-architecture',
  'query-key-value',
  'positional-encoding',
  'scaling-laws',
  'compute-optimal-training',
  'foundation-models',
  'fine-tuning-efficiency',
  'dpo',
  'context-extension',
  'multi-head-attention',
  'power-law-loss'
);

-- Old Phase 2 → Phase 4 (Agent concepts)
UPDATE concepts SET phase = '4' WHERE id IN (
  'chain-of-thought',
  'react-pattern',
  'tree-of-thoughts',
  'reflexion',
  'tool-use',
  'plan-and-execute',
  'prompt-engineering',
  'structured-output',
  'test-time-compute',
  'reasoning-models',
  'multi-agent-systems',
  'agent-reliability'
);

-- Phase 0 → Phase 3 (math concepts integrated)
UPDATE concepts SET phase = '3' WHERE id IN (
  'linear-algebra-ml',
  'probability-statistics',
  'information-theory',
  'optimization-ml',
  'calculus-backprop',
  'dimensionality-reduction'
);

-- Old Phase 3 → Phase 5 (RAG concepts)
UPDATE concepts SET phase = '5' WHERE id IN (
  'embeddings',
  'vector-search',
  'rag-basics',
  'chunking-strategies',
  'hybrid-search',
  'lost-in-middle',
  'context-window-limits',
  'external-memory',
  'memory-management',
  'reranking',
  'query-decomposition',
  'agentic-rag',
  'graph-rag',
  'rag-evaluation',
  'rag-vs-long-context'
);

-- Old Phase 4 → Phase 7 (Safety concepts)
UPDATE concepts SET phase = '7' WHERE id IN (
  'constitutional-ai',
  'self-consistency',
  'offline-evaluation',
  'online-evaluation',
  'red-teaming',
  'output-validation',
  'prompt-injection',
  'llm-security-owasp',
  'guardrails-libraries',
  'content-moderation',
  'eval-harnesses'
);

-- Old Phase 5 → Phase 8 (Inference concepts)
UPDATE concepts SET phase = '8' WHERE id IN (
  'kv-cache',
  'batching-inference',
  'paged-attention',
  'speculative-decoding',
  'quantization',
  'token-economics',
  'model-routing',
  'semantic-caching',
  'prompt-caching',
  'llm-observability',
  'rate-limiting',
  'compound-ai-systems',
  'mixture-of-experts'
);

-- Old Phase 6 → Phase 9 (System Design concepts)
UPDATE concepts SET phase = '9' WHERE id IN (
  'langchain-architecture',
  'llamaindex-architecture',
  'framework-tradeoffs',
  'minimal-implementations',
  'dspy-programming',
  'system-design-patterns',
  'cost-quality-latency',
  'production-architectures',
  'agent-protocol-design',
  'plugin-channel-architecture',
  'agent-skill-orchestration',
  'agent-memory-persistence',
  'agent-ui-generation'
);

-- Catch-all for concepts
UPDATE concepts SET phase = '5' WHERE phase = '3';
UPDATE concepts SET phase = '7' WHERE phase = '4';
UPDATE concepts SET phase = '8' WHERE phase = '5';
UPDATE concepts SET phase = '9' WHERE phase = '6';

-- ============================================================================
-- STEP 10: DELETE CUT RESOURCES
-- ============================================================================
-- First remove resource_concepts mappings, then resources

-- Phase 3 cuts
DELETE FROM resource_concepts WHERE resource_id IN (
  'foundation-models-paper'
);
DELETE FROM resources WHERE id IN (
  'foundation-models-paper'
);

-- Phase 4 cuts
DELETE FROM resource_concepts WHERE resource_id IN (
  'tree-of-thoughts-paper',
  'toolformer-paper',
  'prompt-report-paper',
  'gorilla-paper'
);
DELETE FROM resources WHERE id IN (
  'tree-of-thoughts-paper',
  'toolformer-paper',
  'prompt-report-paper',
  'gorilla-paper'
);

-- Phase 5 cuts
DELETE FROM resource_concepts WHERE resource_id IN (
  'generative-agents-paper'
);
DELETE FROM resources WHERE id IN (
  'generative-agents-paper'
);

-- Phase 7 cuts
DELETE FROM resource_concepts WHERE resource_id IN (
  'self-consistency-paper',
  'ml-testing-survey'
);
DELETE FROM resources WHERE id IN (
  'self-consistency-paper',
  'ml-testing-survey'
);

-- Phase 8 cuts
DELETE FROM resource_concepts WHERE resource_id IN (
  'openai-research-talks',
  'deepmind-systems-talks'
);
DELETE FROM resources WHERE id IN (
  'openai-research-talks',
  'deepmind-systems-talks'
);

-- Phase 9 (old Phase 6) framework docs/videos — DELETE
DELETE FROM resource_concepts WHERE resource_id IN (
  'langchain-docs',
  'llamaindex-docs',
  'langchain-videos',
  'autogen-videos'
);
DELETE FROM resources WHERE id IN (
  'langchain-docs',
  'llamaindex-docs',
  'langchain-videos',
  'autogen-videos'
);

-- ============================================================================
-- STEP 11: CROSS-PHASE MOVES
-- ============================================================================

-- Move Megatron-LM from Phase 11 → Phase 2 (ML Infrastructure Bridge)
UPDATE resources SET phase = '2' WHERE id = 'p11-megatron-lm';

-- Move Chip Huyen AI Engineering from Phase 10 → Phase 8
UPDATE resources SET phase = '8' WHERE id = 'p10-chip-huyen-ai-eng';

-- ============================================================================
-- STEP 12: INSERT NEW PHASE 2 RESOURCES (ML Infrastructure Bridge)
-- ============================================================================

INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p2-zero-paper', 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', 'paper',
   'https://arxiv.org/abs/1910.02054',
   'Rajbhandari et al. (Microsoft)',
   '2'::study_phase,
   'ZeRO (Zero Redundancy Optimizer) partitions optimizer states, gradients, and parameters across data-parallel processes. Three stages of increasing memory savings. Foundation for DeepSpeed and large-scale training.',
   6),

  ('p2-mixed-precision-paper', 'Mixed Precision Training', 'paper',
   'https://arxiv.org/abs/1710.03740',
   'Micikevicius et al. (NVIDIA/Baidu)',
   '2'::study_phase,
   'Training neural networks with FP16 arithmetic while maintaining FP32 master weights. Loss scaling to prevent gradient underflow. 2x memory reduction and faster compute on Tensor Cores. Standard practice for all modern LLM training.',
   4),

  ('p2-hidden-tech-debt-paper', 'Hidden Technical Debt in Machine Learning Systems', 'paper',
   'https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html',
   'Sculley et al. (Google)',
   '2'::study_phase,
   'Seminal paper on ML-specific technical debt: entanglement, hidden feedback loops, undeclared consumers, data dependencies, configuration debt. Only a small fraction of real-world ML systems is the ML code itself.',
   4),

  ('p2-docker-bentoml-tutorial', 'ML Model Serving with Docker & BentoML', 'article',
   'https://docs.bentoml.com/en/latest/',
   'BentoML / Docker',
   '2'::study_phase,
   'Practical guide to containerizing and serving ML models. Docker fundamentals for ML workflows. BentoML for building production-ready model serving endpoints. Bridge between model development and deployment.',
   6)

ON CONFLICT (id) DO NOTHING;

-- Phase 2 concepts (for new resources)
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('zero-optimizer', 'ZeRO Optimizer',
   'zero-optimizer',
   'Zero Redundancy Optimizer that partitions optimizer states (stage 1), gradients (stage 2), and parameters (stage 3) across data-parallel GPUs. Each stage reduces memory per GPU while maintaining data parallelism semantics. Foundation for DeepSpeed.',
   '2'::study_phase),

  ('mixed-precision-training', 'Mixed Precision Training',
   'mixed-precision-training',
   'Training with FP16 compute and FP32 master weights. Loss scaling prevents gradient underflow in FP16. Tensor Cores provide 2-8x speedup for FP16 matmuls. Standard practice since 2018 for all large model training.',
   '2'::study_phase),

  ('ml-technical-debt', 'ML Technical Debt',
   'ml-technical-debt',
   'ML-specific forms of technical debt beyond traditional software: data dependency debt, model entanglement, hidden feedback loops, undeclared consumers, pipeline jungles, dead experimental codepaths. The ML code is often <5% of the total system.',
   '2'::study_phase),

  ('model-containerization', 'Model Containerization & Serving',
   'model-containerization',
   'Packaging ML models with their dependencies into containers for reproducible deployment. Tools: Docker, BentoML, Triton. Covers dependency management, GPU passthrough, health checks, and scaling strategies.',
   '2'::study_phase)

ON CONFLICT (id) DO NOTHING;

-- Resource-concept mappings for new Phase 2 resources
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p2-zero-paper', 'zero-optimizer', FALSE),
  ('p2-zero-paper', 'distributed-training', TRUE),
  ('p2-zero-paper', 'data-parallelism', TRUE),

  ('p2-mixed-precision-paper', 'mixed-precision-training', FALSE),
  ('p2-mixed-precision-paper', 'gpu-compute-fundamentals', TRUE),

  ('p2-hidden-tech-debt-paper', 'ml-technical-debt', FALSE),
  ('p2-hidden-tech-debt-paper', 'ml-data-pipelines', TRUE),

  ('p2-docker-bentoml-tutorial', 'model-containerization', FALSE),
  ('p2-docker-bentoml-tutorial', 'model-serving-infra', TRUE),

  -- Megatron-LM (moved from Phase 11) already has mappings
  ('p11-megatron-lm', 'distributed-training', TRUE)

ON CONFLICT DO NOTHING;

-- Concept prerequisites for new Phase 2 concepts
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('zero-optimizer', 'data-parallelism'),
  ('mixed-precision-training', 'gpu-compute-fundamentals'),
  ('ml-technical-debt', 'ml-data-pipelines'),
  ('model-containerization', 'model-serving-infra')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 13: INSERT NEW PHASE 7 RESOURCE (NIST AI RMF)
-- ============================================================================

INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p7-nist-ai-rmf', 'NIST AI Risk Management Framework', 'article',
   'https://www.nist.gov/itl/ai-risk-management-framework',
   'NIST',
   '7'::study_phase,
   'Federal framework for managing AI risks. Four core functions: Govern, Map, Measure, Manage. Defines risk tiers and organizational practices for responsible AI deployment. Increasingly referenced in enterprise AI governance.',
   6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p7-nist-ai-rmf', 'red-teaming', FALSE),
  ('p7-nist-ai-rmf', 'eval-harnesses', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 14: INSERT NEW PHASE 8 RESOURCES
-- ============================================================================

INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p8-a16z-inference-economics', 'The Economics of AI Inference', 'article',
   'https://a16z.com/llmflation-llm-inference-cost/',
   'a16z',
   '8'::study_phase,
   'Analysis of inference cost trends: 10x cost reduction per year, GPU utilization economics, build vs buy for inference, cost optimization strategies (quantization, caching, routing). Essential for production AI economics.',
   4),

  ('p8-eugene-yan-applied-llms', 'Applied LLMs: What We''ve Learned From a Year of Building', 'article',
   'https://applied-llms.org/',
   'Eugene Yan et al.',
   '8'::study_phase,
   'Practitioner-focused guide covering prompting, RAG, evaluation, guardrails, and operational concerns for LLM applications. Distilled from a year of production experience across multiple teams.',
   6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p8-a16z-inference-economics', 'token-economics', FALSE),
  ('p8-a16z-inference-economics', 'model-routing', FALSE),

  ('p8-eugene-yan-applied-llms', 'compound-ai-systems', FALSE),
  ('p8-eugene-yan-applied-llms', 'llm-observability', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 15: UPDATE PROJECTS — Phase remapping
-- ============================================================================

-- Projects also reference phases and need remapping
-- Phase 6 project (multimodal) → delete (no phase 6 content)
DELETE FROM project_concepts WHERE project_id = 'project-multimodal-rag';
DELETE FROM project_progress WHERE project_id = 'project-multimodal-rag';
DELETE FROM projects WHERE id = 'project-multimodal-rag';

-- Phase 10 project stays (alternate track)
-- Phase 11 project stays (aspirational)

-- ============================================================================
-- DONE
-- ============================================================================
