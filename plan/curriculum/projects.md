# Jarre — Phase Projects Reference

Each phase (except Phase 0) has a milestone project that advances concepts to mastery level 2 (Applied).

---

## Phase 1: Distributed Key-Value Store
**ID:** `project-kv-store`

Build a simple distributed KV store with replication. Simulate network partitions and observe behavior.

**Deliverables:**
- Leader-based replication working
- Handles leader failure gracefully
- Can demonstrate split-brain scenario
- Written explanation of consistency trade-offs observed

**Concepts:** `replication`, `partitioning`, `distributed-failures`, `consistency-models`, `consensus`

---

## Phase 2: ML Training Pipeline
**ID:** `project-ml-pipeline`

Build a data pipeline that prepares training data, tracks experiments, and serves a model. Integrate distributed training concepts.

**Deliverables:**
- Data pipeline with versioning
- Experiment tracking with metrics comparison
- Model serving endpoint with monitoring
- Written analysis of GPU utilization and bottlenecks

**Concepts:** `gpu-compute-fundamentals`, `data-parallelism`, `distributed-training`, `ml-data-pipelines`, `experiment-tracking`

---

## Phase 3: Transformer from Scratch
**ID:** `project-transformer`

Implement a small Transformer model from scratch. Train it on a text dataset and analyze attention patterns.

**Deliverables:**
- Working multi-head attention implementation
- Positional encoding (sinusoidal and RoPE)
- Training loop with loss tracking
- Attention visualization and analysis

**Concepts:** `attention-mechanism`, `transformer-architecture`, `query-key-value`, `positional-encoding`, `scaling-laws`

---

## Phase 4: Self-Improving Coding Agent
**ID:** `project-react-agent`

Build an autonomous coding agent that follows the plan-execute-test-reflect loop. The agent receives a coding task, plans an approach, writes code in a sandboxed environment, runs tests, and reflects on failures to improve. Must implement memory hierarchy and structured output for all tool interactions. No LangChain or similar frameworks allowed.

**Deliverables:**
- Agentic loop: plan -> code -> test -> reflect cycle with observable iteration history
- Sandboxed code execution (Docker or subprocess) with timeout and resource limits
- Two-level memory: session scratchpad + persistent reflection store of past failures
- Structured JSON output validated with schema for 4+ tools (code_execute, file_read, file_write, test_run)
- Traceability dashboard: visible log of each loop step with reasoning, action, and observed result
- Reflection mechanism: on test failure, agent generates written error analysis and uses it in next attempt
- Written doc: architecture diagram + analysis of 3+ observed failures and how the agent handled them

**Concepts:** `react-pattern`, `reflexion`, `tool-use`, `plan-and-execute`, `structured-output`, `agent-reliability`

---

## Phase 5: Personal Knowledge Agent with Memory
**ID:** `project-rag-system`

Build a knowledge management system that ingests documents (PDF, markdown, web pages), builds a knowledge graph alongside vector embeddings, and provides Q&A with memory consolidation. Must demonstrate multiple retrieval strategies, memory lifecycle management, and RAG evaluation metrics.

**Deliverables:**
- Ingestion pipeline for 3+ formats with 3 chunking strategies implemented and compared
- Dual retrieval: vector search (embeddings + cosine) + knowledge graph (entities and relations)
- Hybrid search: dense (vector) + sparse (BM25) with score normalization and fusion
- Memory lifecycle: storage -> retrieval -> consolidation -> decay, with metrics per stage
- Quantitative evaluation with RAGAS: faithfulness > 0.7, context precision > 0.6, on 20+ test queries
- Query decomposition: complex queries automatically split into sub-queries with logged reasoning
- Reranking: cross-encoder reranker stage after initial retrieval with measured improvement
- Written analysis: RAG vs long-context comparison for 5 representative queries with cost and quality metrics

**Concepts:** `embeddings`, `vector-search`, `rag-basics`, `chunking-strategies`, `hybrid-search`, `external-memory`, `memory-management`, `graph-rag`, `reranking`, `query-decomposition`, `rag-evaluation`

---

## Phase 6: Multimodal RAG System
**ID:** `project-multimodal-rag`

Build a RAG system that handles text, images, and tables. Cross-modal retrieval and generation.

**Deliverables:**
- Image + text retrieval working
- Table extraction and querying
- Cross-modal search (text query -> image results)
- Performance comparison: multimodal vs text-only RAG

**Concepts:** `multimodal-embeddings`, `vision-language-models`, `multimodal-rag`, `knowledge-distillation`

---

## Phase 7: LLM Output Validators
**ID:** `project-validators`

Build a validation layer for LLM outputs. Include guardrails pipeline, evaluation harness, and content moderation.

**Deliverables:**
- JSON schema validator with error recovery
- Multi-layer guardrails pipeline (NeMo or Instructor)
- Evaluation harness with LLM-as-judge
- Content moderation filters
- Metrics: false positive/negative rates

**Concepts:** `output-validation`, `prompt-injection`, `llm-security-owasp`, `guardrails-libraries`, `content-moderation`, `eval-harnesses`

---

## Phase 8: Intelligent Model Router with Edge Optimization
**ID:** `project-router`

Build a model routing system that classifies requests by complexity and routes to the optimal model considering cost, quality, and latency. Include edge optimization: quantize a small model for local inference and compare with cloud APIs. Implement observability, semantic caching, and cost tracking.

**Deliverables:**
- Query complexity classifier (feature-based, not LLM-based) with 3+ tiers: trivial, medium, complex
- Routing to 3 tiers: quantized local model (INT4/INT8), cloud economic model, cloud premium model
- Quantized SLM (< 3B params) with measured quality degradation vs original on 50+ query benchmark
- Semantic caching: cache responses by embedding similarity with configurable threshold and hit rate metrics
- Observability dashboard: latency per tier (p50, p95, p99), cumulative cost, tokens consumed, cache hit rate
- Cost-quality-latency analysis: comparative table of 3 tiers across 100+ test queries
- Rate limiting and backpressure: graceful degradation when premium tier is saturated
- Decision log: documented analysis of 10+ routing decisions explaining why each query went to each tier

**Concepts:** `quantization`, `kv-cache`, `batching-inference`, `token-economics`, `model-routing`, `semantic-caching`, `llm-observability`, `rate-limiting`, `compound-ai-systems`

---

## Phase 9: Enterprise Workflow Orchestrator
**ID:** `project-system-design`

Design and build a multi-agent workflow orchestration system for a concrete scenario (e.g., automated incident response or document processing pipeline). Must demonstrate production-grade patterns: supervisor-worker agents, audit trail, observability, guardrails, cost tracking, and graceful degradation. This is the capstone that integrates ALL prior phases.

**Deliverables:**
- Multi-agent architecture: supervisor delegates to 3+ specialized worker agents with defined protocol
- Complete audit trail: every decision, tool call, and result logged with timestamp, agent, I/O, tokens
- Guardrails pipeline: input validation (prompt injection defense) + output validation (schema + safety)
- End-to-end observability: distributed tracing across agents with per-component latency and cost
- Graceful degradation: fallback to smaller model or HITL checkpoint on agent failure
- Cost-quality-latency analysis: 3 configurations (quality-optimized, balanced, cost-optimized) measured on 20+ workflows
- Framework comparison: implement without LangChain/LlamaIndex, then analyze what those frameworks solve and what they don't
- Architecture document: C4 diagram, decision log of every trade-off, comparison with real systems (Cursor, Perplexity)

**Concepts:** `system-design-patterns`, `production-architectures`, `cost-quality-latency`, `compound-ai-systems`, `multi-agent-systems`, `minimal-implementations`, `framework-tradeoffs`, `llm-observability`

---

## Phase 10: AI Strategy & Implementation Proposal
**ID:** `project-ai-strategy`

Develop a complete AI strategy and implementation proposal for a real or simulated organization. Covers the full consulting arc: assess AI maturity, discover use cases, analyze build vs buy, design governance, plan MLOps architecture, project costs, and drive adoption.

**Deliverables:**
- AI Maturity Assessment using Gartner/McKinsey framework with current-state analysis and target-state roadmap
- Use Case Discovery: 5+ candidates scored with Impact/Effort matrix, top 3 selected with justification
- Build vs Buy analysis for top 3 use cases with cost estimates (API vs fine-tune vs train)
- Governance framework aligned with NIST AI RMF: risk tiers, approval process, audit trail design
- MLOps architecture design: CI/CD pipeline, model versioning, monitoring, drift detection
- Cost projection at 12 months with optimization strategies (caching, routing, quantization)
- Change management plan with stakeholder mapping and adoption metrics
- Executive presentation: 15 slides covering strategy, use cases, architecture, costs, and roadmap

**Concepts:** `ai-strategy-roi`, `ai-maturity-models`, `ai-use-case-discovery`, `data-readiness-assessment`, `build-vs-buy-ai`, `ai-governance-frameworks`, `mlops-production`, `inference-economics`, `ai-change-management`, `ai-consulting-practice`

---

## Phase 11: High-Performance LLM Serving System
**ID:** `project-llm-serving`

Build a high-performance LLM inference server that demonstrates mastery of GPU systems, memory management, quantization, and serving optimization. Implement or integrate key techniques: continuous batching, PagedAttention, quantized inference, and distributed serving.

**Deliverables:**
- Custom inference server with continuous batching: dynamic request scheduling, no padding waste
- PagedAttention implementation or measured integration: KV cache memory utilization > 90%
- Quantized model benchmark: INT4/INT8 vs FP16 on 50+ queries with latency, throughput, and quality metrics
- Distributed serving with tensor parallelism on 2+ GPUs (or simulated with process-based parallelism)
- Profiling report: GPU utilization, memory bandwidth, compute vs memory bound analysis with NSight or torch.profiler
- Written analysis: FlashAttention vs standard attention with own measurements on varying sequence lengths

**Concepts:** `cuda-gpu-programming`, `gpu-memory-hierarchy`, `flash-attention`, `quantization-impl`, `serving-systems`, `kernel-optimization`, `distributed-training-impl`, `model-parallelism-impl`
