/**
 * Jarre - Seed Data
 *
 * Complete study plan for AI/LLM Systems Architect path.
 * Run with: npx tsx scripts/seed-data.ts
 */

import type { ResourceType, StudyPhase } from '../src/types';

// ============================================================================
// TYPES FOR SEED DATA
// ============================================================================

interface SeedResource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  author?: string;
  phase: StudyPhase;
  description?: string;
  estimatedHours?: number;
  concepts: string[]; // concept IDs this resource teaches
  prerequisites?: string[]; // concept IDs needed before
}

interface SeedConcept {
  id: string;
  name: string;
  canonicalDefinition: string;
  phase: StudyPhase;
  prerequisites?: string[]; // other concept IDs
}

// ============================================================================
// CONCEPTS
// ============================================================================

export const concepts: SeedConcept[] = [
  // ---------------------------------------------------------------------------
  // PHASE 1: Distributed Systems Fundamentals
  // ---------------------------------------------------------------------------
  {
    id: 'reliability',
    name: 'Reliability',
    canonicalDefinition: 'The system continues to work correctly even when things go wrong (faults). A reliable system is fault-tolerant, not fault-free.',
    phase: 1,
  },
  {
    id: 'scalability',
    name: 'Scalability',
    canonicalDefinition: 'The ability of a system to handle increased load by adding resources. Measured in terms of load parameters (requests/sec, data volume, etc).',
    phase: 1,
  },
  {
    id: 'maintainability',
    name: 'Maintainability',
    canonicalDefinition: 'How easy it is for engineers to work on the system over time: operability, simplicity, and evolvability.',
    phase: 1,
  },
  {
    id: 'data-models',
    name: 'Data Models',
    canonicalDefinition: 'The way data is structured and related: relational, document, graph, etc. Each model makes certain operations easier and others harder.',
    phase: 1,
  },
  {
    id: 'storage-engines',
    name: 'Storage Engines',
    canonicalDefinition: 'How databases store and retrieve data on disk. Key types: log-structured (LSM trees) vs page-oriented (B-trees). Trade-offs between write and read performance.',
    phase: 1,
    prerequisites: ['data-models'],
  },
  {
    id: 'replication',
    name: 'Replication',
    canonicalDefinition: 'Keeping copies of the same data on multiple machines. Purposes: high availability, fault tolerance, latency reduction. Key models: leader-based, multi-leader, leaderless.',
    phase: 1,
    prerequisites: ['reliability'],
  },
  {
    id: 'partitioning',
    name: 'Partitioning (Sharding)',
    canonicalDefinition: 'Splitting a large dataset across multiple machines. Each partition is a mini-database. Strategies: by key range, by hash. Challenge: rebalancing, hot spots.',
    phase: 1,
    prerequisites: ['scalability', 'replication'],
  },
  {
    id: 'distributed-failures',
    name: 'Distributed System Failures',
    canonicalDefinition: 'What can go wrong in distributed systems: network partitions, node failures, clock skew, Byzantine faults. Partial failures are the norm, not the exception.',
    phase: 1,
    prerequisites: ['replication', 'partitioning'],
  },
  {
    id: 'consistency-models',
    name: 'Consistency Models',
    canonicalDefinition: 'Guarantees about what values readers will see. Spectrum from strong (linearizability) to weak (eventual). CAP theorem: can\'t have consistency, availability, and partition tolerance simultaneously.',
    phase: 1,
    prerequisites: ['distributed-failures'],
  },
  {
    id: 'consensus',
    name: 'Consensus',
    canonicalDefinition: 'Getting multiple nodes to agree on a value. Fundamental algorithms: Paxos, Raft, Zab. Used for leader election, atomic commit, total order broadcast.',
    phase: 1,
    prerequisites: ['consistency-models'],
  },
  {
    id: 'stream-processing',
    name: 'Stream Processing',
    canonicalDefinition: 'Processing data continuously as it arrives, rather than in batches. Key concepts: event time vs processing time, windowing, exactly-once semantics.',
    phase: 1,
    prerequisites: ['partitioning'],
  },
  {
    id: 'slos-slis',
    name: 'SLOs and SLIs',
    canonicalDefinition: 'Service Level Objectives (SLOs) are target values for service reliability. Service Level Indicators (SLIs) are the metrics that measure it. Error budgets allow controlled risk-taking.',
    phase: 1,
  },
  {
    id: 'monitoring',
    name: 'Monitoring Distributed Systems',
    canonicalDefinition: 'Collecting and analyzing metrics, logs, and traces to understand system health. The four golden signals: latency, traffic, errors, saturation.',
    phase: 1,
    prerequisites: ['slos-slis'],
  },
  {
    id: 'embracing-risk',
    name: 'Embracing Risk',
    canonicalDefinition: '100% reliability is impossible and prohibitively expensive. Instead, define acceptable failure rates (error budgets) and invest accordingly.',
    phase: 1,
    prerequisites: ['slos-slis'],
  },
  {
    id: 'tail-latency',
    name: 'Tail Latency',
    canonicalDefinition: 'The slowest requests (p95-p99) dominate user experience and SLOs. In distributed and LLM systems, tail latency is affected by batching, stragglers, cache misses, and long generations. Techniques: hedged requests, tied requests, canary requests.',
    phase: 1,
    prerequisites: ['slos-slis', 'monitoring'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: LLM Fundamentals + Reasoning/Agents
  // ---------------------------------------------------------------------------
  {
    id: 'attention-mechanism',
    name: 'Attention Mechanism',
    canonicalDefinition: 'A way for models to focus on relevant parts of the input when producing output. Self-attention allows each position to attend to all positions in the previous layer.',
    phase: 2,
  },
  {
    id: 'transformer-architecture',
    name: 'Transformer Architecture',
    canonicalDefinition: 'Neural network architecture based entirely on attention mechanisms, no recurrence. Key components: multi-head attention, positional encoding, feed-forward layers.',
    phase: 2,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'query-key-value',
    name: 'Query-Key-Value (QKV)',
    canonicalDefinition: 'The three projections in attention. Query: what am I looking for? Key: what do I contain? Value: what do I provide? Attention = softmax(QK^T/√d)V',
    phase: 2,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'positional-encoding',
    name: 'Positional Encoding',
    canonicalDefinition: 'Since attention has no inherent notion of position, we add positional information to embeddings. Original: sinusoidal functions. Modern: learned or rotary (RoPE).',
    phase: 2,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'scaling-laws',
    name: 'Scaling Laws',
    canonicalDefinition: 'Empirical relationships between model size, data, compute, and performance. Loss scales as power law with each factor. Guides efficient allocation of training budget.',
    phase: 2,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'compute-optimal-training',
    name: 'Compute-Optimal Training',
    canonicalDefinition: 'Chinchilla finding: models are often undertrained. Optimal: scale data and parameters equally. 70B model trained on 1.4T tokens beats 280B on 300B tokens.',
    phase: 2,
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'foundation-models',
    name: 'Foundation Models',
    canonicalDefinition: 'Large models trained on broad data that can be adapted to many downstream tasks. Emergent abilities appear at scale. Risks: homogenization, bias amplification.',
    phase: 2,
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'react-pattern',
    name: 'ReAct Pattern',
    canonicalDefinition: 'Interleaving reasoning (chain-of-thought) with acting (tool use). Model thinks step by step, takes action, observes result, repeats. Enables grounded, traceable reasoning.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'chain-of-thought',
    name: 'Chain-of-Thought',
    canonicalDefinition: 'Prompting technique where the model shows intermediate reasoning steps. Improves performance on complex tasks. Can be zero-shot ("think step by step") or few-shot.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'tree-of-thoughts',
    name: 'Tree of Thoughts',
    canonicalDefinition: 'Extension of chain-of-thought where model explores multiple reasoning paths, evaluates them, and can backtrack. Enables deliberate problem-solving.',
    phase: 2,
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'reflexion',
    name: 'Reflexion',
    canonicalDefinition: 'Agent pattern where model reflects on failures and stores verbal feedback in memory. Enables learning from mistakes without weight updates.',
    phase: 2,
    prerequisites: ['react-pattern'],
  },
  {
    id: 'tool-use',
    name: 'Tool Use',
    canonicalDefinition: 'Teaching LLMs to call external APIs, calculators, search engines. Extends capabilities beyond training data. Key challenge: knowing when to use which tool.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'plan-and-execute',
    name: 'Plan-and-Execute Agents',
    canonicalDefinition: 'Two-phase agent pattern: first create a plan (list of steps), then execute each step. Separates planning from execution, enables re-planning on failure.',
    phase: 2,
    prerequisites: ['react-pattern', 'tool-use'],
  },
  {
    id: 'prompt-engineering',
    name: 'Prompt Engineering',
    canonicalDefinition: 'The discipline of designing effective prompts for LLMs. Includes techniques like few-shot learning, role prompting, format specification, and constraint setting. Foundation for all LLM applications.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'structured-output',
    name: 'Structured Output',
    canonicalDefinition: 'Constraining LLM outputs to valid formats (JSON, XML, function calls). Techniques: JSON mode, function calling schemas, grammar-constrained decoding. Essential for reliable tool use and data extraction.',
    phase: 2,
    prerequisites: ['foundation-models', 'prompt-engineering'],
  },
  {
    id: 'fine-tuning-efficiency',
    name: 'Parameter-Efficient Fine-Tuning',
    canonicalDefinition: 'Adapting pre-trained models without updating all parameters. Key techniques: LoRA (low-rank adaptation), prefix tuning, adapters. Reduces compute/memory by 10-1000x while maintaining quality.',
    phase: 2,
    prerequisites: ['foundation-models', 'transformer-architecture'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: RAG, Memory, Context
  // ---------------------------------------------------------------------------
  {
    id: 'rag-basics',
    name: 'Retrieval-Augmented Generation',
    canonicalDefinition: 'Augmenting LLM generation with retrieved documents. Reduces hallucination, enables knowledge updates without retraining. Components: retriever, reader, generator.',
    phase: 3,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'embeddings',
    name: 'Embeddings',
    canonicalDefinition: 'Dense vector representations of text. Similar meanings → similar vectors. Enable semantic search. Models: sentence-transformers, OpenAI embeddings, etc.',
    phase: 3,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'vector-search',
    name: 'Vector Search',
    canonicalDefinition: 'Finding similar items by comparing embedding vectors. Algorithms: exact (brute force), approximate (HNSW, IVF). Trade-off: speed vs recall.',
    phase: 3,
    prerequisites: ['embeddings'],
  },
  {
    id: 'chunking-strategies',
    name: 'Chunking Strategies',
    canonicalDefinition: 'How to split documents for embedding. Options: fixed size, sentence-based, semantic, recursive. Trade-off: too small loses context, too large dilutes relevance.',
    phase: 3,
    prerequisites: ['rag-basics', 'embeddings'],
  },
  {
    id: 'lost-in-middle',
    name: 'Lost in the Middle',
    canonicalDefinition: 'LLMs pay less attention to information in the middle of long contexts. Performance is U-shaped: best for info at start or end. Implications for RAG ordering.',
    phase: 3,
    prerequisites: ['rag-basics'],
  },
  {
    id: 'context-window-limits',
    name: 'Context Window Limits',
    canonicalDefinition: 'Maximum tokens a model can process. Attention is O(n²) in context length. Longer context ≠ better understanding. Cost scales with context size.',
    phase: 3,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'external-memory',
    name: 'External Memory for LLMs',
    canonicalDefinition: 'Storing information outside the model (vector DBs, key-value stores) and retrieving as needed. Enables unbounded knowledge without context limits.',
    phase: 3,
    prerequisites: ['rag-basics', 'vector-search'],
  },
  {
    id: 'hybrid-search',
    name: 'Hybrid Search',
    canonicalDefinition: 'Combining dense (embedding) and sparse (keyword/BM25) retrieval. Often outperforms either alone. Requires score normalization and fusion strategies.',
    phase: 3,
    prerequisites: ['vector-search'],
  },
  {
    id: 'memory-management',
    name: 'LLM Memory Management',
    canonicalDefinition: 'Policies for storing, retrieving, updating, and forgetting memories. Includes recency bias, importance scoring, summarization, conflict resolution, and drift control. Without explicit management, "store everything forever" breaks systems quietly.',
    phase: 3,
    prerequisites: ['external-memory'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: Safety, Guardrails, Evaluation
  // ---------------------------------------------------------------------------
  {
    id: 'constitutional-ai',
    name: 'Constitutional AI',
    canonicalDefinition: 'Training AI to follow principles (a "constitution") through self-critique and revision. RLHF alternative that\'s more scalable and transparent.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    canonicalDefinition: 'Sampling multiple reasoning paths and taking majority vote. Improves accuracy on reasoning tasks. Trade-off: cost (multiple generations) vs reliability.',
    phase: 4,
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'offline-evaluation',
    name: 'Offline LLM Evaluation',
    canonicalDefinition: 'Benchmark-based and regression evaluation using fixed datasets (MMLU, HumanEval, custom test suites). Useful for iteration and comparison, but limited for predicting real-world behavior. Includes LLM-as-judge patterns.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'online-evaluation',
    name: 'Online LLM Evaluation',
    canonicalDefinition: 'Evaluating LLMs in production using A/B tests, shadow traffic, canary deployments, and human feedback. Captures real user behavior that offline metrics miss. Requires careful metric selection and statistical rigor.',
    phase: 4,
    prerequisites: ['slos-slis', 'foundation-models'],
  },
  {
    id: 'red-teaming',
    name: 'Red Teaming LLMs',
    canonicalDefinition: 'Adversarial testing to find failure modes: jailbreaks, harmful outputs, bias. Manual and automated approaches. Essential before deployment.',
    phase: 4,
    prerequisites: ['offline-evaluation'],
  },
  {
    id: 'output-validation',
    name: 'Output Validation',
    canonicalDefinition: 'Checking LLM outputs before using them: schema validation (JSON), fact-checking, safety filtering. Defense in depth against unreliable generations.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: Inference, Serving, Economics
  // ---------------------------------------------------------------------------
  {
    id: 'kv-cache',
    name: 'KV Cache',
    canonicalDefinition: 'Caching key-value pairs from previous tokens during generation. Avoids recomputation. Memory scales with batch size × sequence length × layers.',
    phase: 5,
    prerequisites: ['query-key-value', 'transformer-architecture'],
  },
  {
    id: 'batching-inference',
    name: 'Batching for Inference',
    canonicalDefinition: 'Processing multiple requests together to utilize GPU parallelism. Challenge: different sequence lengths. Solutions: continuous batching, iteration-level scheduling.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'paged-attention',
    name: 'PagedAttention',
    canonicalDefinition: 'Memory management technique from vLLM. Stores KV cache in non-contiguous blocks like virtual memory. Enables efficient memory sharing and larger batches.',
    phase: 5,
    prerequisites: ['kv-cache', 'batching-inference'],
  },
  {
    id: 'speculative-decoding',
    name: 'Speculative Decoding',
    canonicalDefinition: 'Using a small draft model to generate candidate tokens, then verifying with the large model in parallel. Speeds up inference without quality loss.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'quantization',
    name: 'Quantization',
    canonicalDefinition: 'Reducing precision of model weights (FP16 → INT8 → INT4). Reduces memory and speeds up inference. Trade-off: potential quality degradation.',
    phase: 5,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'token-economics',
    name: 'Token Economics',
    canonicalDefinition: 'Understanding LLM costs: input tokens vs output tokens, price per million, context length impact. Output tokens are 3-5x more expensive than input.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'model-routing',
    name: 'Model Routing',
    canonicalDefinition: 'Directing requests to different models based on complexity, cost, latency requirements. Simple queries → small/local models. Complex → large models.',
    phase: 5,
    prerequisites: ['token-economics'],
  },
  {
    id: 'semantic-caching',
    name: 'Semantic Caching',
    canonicalDefinition: 'Caching LLM responses based on semantic similarity of queries, not exact match. Uses embeddings to find similar past queries. Can reduce API costs 60-70% but requires tuning similarity thresholds to avoid returning wrong answers.',
    phase: 5,
    prerequisites: ['embeddings', 'token-economics'],
  },
  {
    id: 'prompt-caching',
    name: 'Prompt Caching (Prefix Caching)',
    canonicalDefinition: 'API-level optimization that caches KV states for prompt prefixes. Reusing cached prefixes is 75-90% cheaper. Requires structuring prompts with static content first. Different from semantic caching: exact prefix match, not semantic similarity.',
    phase: 5,
    prerequisites: ['kv-cache', 'token-economics'],
  },
  {
    id: 'llm-observability',
    name: 'LLM Observability',
    canonicalDefinition: 'Monitoring, tracing, and debugging LLM systems in production. Goes beyond traditional observability: tracking prompts, completions, token usage, latency per component, cost attribution, and detecting silent failures like hallucinations.',
    phase: 5,
    prerequisites: ['monitoring', 'token-economics'],
  },
  {
    id: 'rate-limiting',
    name: 'Rate Limiting & Backpressure',
    canonicalDefinition: 'Controlling request flow to prevent system overload. Rate limiting: proactive ceiling on requests. Backpressure: reactive signal when downstream is overwhelmed. Essential for LLM APIs with strict rate limits and expensive retries.',
    phase: 5,
    prerequisites: ['slos-slis'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 6: Frameworks as Compressed System Designs
  // The goal is to reverse-engineer abstractions, not learn frameworks.
  // ---------------------------------------------------------------------------
  {
    id: 'langchain-architecture',
    name: 'LangChain Architecture',
    canonicalDefinition: 'Framework for building LLM applications. Components: chains, agents, memory, tools. Study to understand what problems it solves, then critique: abstraction overhead, debugging difficulty, performance costs.',
    phase: 6,
    prerequisites: ['react-pattern', 'rag-basics'],
  },
  {
    id: 'llamaindex-architecture',
    name: 'LlamaIndex Architecture',
    canonicalDefinition: 'Framework focused on data ingestion and retrieval for LLMs. Indexes, query engines, data connectors. Better for RAG-specific use cases. Study the design decisions, then build your own.',
    phase: 6,
    prerequisites: ['rag-basics', 'chunking-strategies'],
  },
  {
    id: 'framework-tradeoffs',
    name: 'Framework Trade-offs',
    canonicalDefinition: 'When to use frameworks vs build from scratch. Frameworks: fast prototyping, community support. Custom: control, performance, debuggability. Production systems often need custom implementations. The best engineers understand both.',
    phase: 6,
    prerequisites: ['langchain-architecture', 'llamaindex-architecture'],
  },
  {
    id: 'minimal-implementations',
    name: 'Minimal Implementations',
    canonicalDefinition: 'Building RAG, agents, and memory from scratch in ~200 lines. Proves you understand the core mechanics. Reveals what frameworks hide. Essential before using any framework in production.',
    phase: 6,
    prerequisites: ['rag-basics', 'react-pattern', 'external-memory'],
  },
];

// ============================================================================
// RESOURCES
// ============================================================================

export const resources: SeedResource[] = [
  // ---------------------------------------------------------------------------
  // PHASE 1: BOOKS - Distributed Systems
  // ---------------------------------------------------------------------------
  {
    id: 'ddia-ch1',
    title: 'DDIA Chapter 1: Reliable, Scalable, and Maintainable Applications',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Foundation chapter. Defines the three key properties of data systems and why they matter.',
    estimatedHours: 3,
    concepts: ['reliability', 'scalability', 'maintainability'],
  },
  {
    id: 'ddia-ch2',
    title: 'DDIA Chapter 2: Data Models and Query Languages',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Relational vs document vs graph models. How data model choice affects application code.',
    estimatedHours: 4,
    concepts: ['data-models'],
  },
  {
    id: 'ddia-ch3',
    title: 'DDIA Chapter 3: Storage and Retrieval',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'How databases store data on disk. LSM trees vs B-trees. Column-oriented storage.',
    estimatedHours: 5,
    concepts: ['storage-engines'],
    prerequisites: ['data-models'],
  },
  {
    id: 'ddia-ch5',
    title: 'DDIA Chapter 5: Replication',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Leader-based, multi-leader, and leaderless replication. Handling failures and conflicts.',
    estimatedHours: 5,
    concepts: ['replication'],
    prerequisites: ['reliability'],
  },
  {
    id: 'ddia-ch6',
    title: 'DDIA Chapter 6: Partitioning',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Strategies for splitting data across nodes. Rebalancing. Secondary indexes.',
    estimatedHours: 4,
    concepts: ['partitioning'],
    prerequisites: ['scalability', 'replication'],
  },
  {
    id: 'ddia-ch8',
    title: 'DDIA Chapter 8: The Trouble with Distributed Systems',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'What can go wrong: network problems, clocks, process pauses. Why distributed systems are hard.',
    estimatedHours: 4,
    concepts: ['distributed-failures'],
    prerequisites: ['replication', 'partitioning'],
  },
  {
    id: 'ddia-ch9',
    title: 'DDIA Chapter 9: Consistency and Consensus',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Linearizability, ordering guarantees, distributed transactions, consensus algorithms.',
    estimatedHours: 6,
    concepts: ['consistency-models', 'consensus'],
    prerequisites: ['distributed-failures'],
  },
  {
    id: 'ddia-ch11',
    title: 'DDIA Chapter 11: Stream Processing',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Processing unbounded data. Event time vs processing time. Stream joins and fault tolerance.',
    estimatedHours: 5,
    concepts: ['stream-processing'],
    prerequisites: ['partitioning'],
  },
  {
    id: 'tanenbaum-ch1',
    title: 'Distributed Systems Ch 1: Introduction',
    type: 'book',
    author: 'Tanenbaum & Van Steen',
    phase: 1,
    description: 'Goals and types of distributed systems. Design challenges.',
    estimatedHours: 2,
    concepts: ['reliability', 'scalability'],
  },
  {
    id: 'tanenbaum-ch5',
    title: 'Distributed Systems Ch 5: Replication',
    type: 'book',
    author: 'Tanenbaum & Van Steen',
    phase: 1,
    description: 'Data-centric and client-centric consistency. Replica management.',
    estimatedHours: 4,
    concepts: ['replication', 'consistency-models'],
    prerequisites: ['reliability'],
  },
  {
    id: 'sre-ch3',
    title: 'SRE Book Ch 3: Embracing Risk',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'Why 100% reliability is wrong target. Error budgets. Risk tolerance.',
    estimatedHours: 2,
    concepts: ['embracing-risk', 'slos-slis'],
  },
  {
    id: 'sre-ch4',
    title: 'SRE Book Ch 4: Service Level Objectives',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'Defining and measuring SLOs. Choosing SLIs. Error budgets in practice.',
    estimatedHours: 2,
    concepts: ['slos-slis'],
  },
  {
    id: 'sre-ch6',
    title: 'SRE Book Ch 6: Monitoring Distributed Systems',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'The four golden signals. White-box vs black-box monitoring. Alert philosophy.',
    estimatedHours: 2,
    concepts: ['monitoring'],
    prerequisites: ['slos-slis'],
  },
  {
    id: 'tail-at-scale-paper',
    title: 'The Tail at Scale',
    type: 'paper',
    url: 'https://research.google/pubs/the-tail-at-scale/',
    author: 'Dean & Barroso (Google)',
    phase: 1,
    description: 'SIGOPS Hall of Fame paper. Why tail latency dominates at scale. Techniques: hedged requests, tied requests, canary requests. Essential for understanding why batching can hurt UX.',
    estimatedHours: 2,
    concepts: ['tail-latency'],
    prerequisites: ['slos-slis', 'monitoring'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 1: COURSES - Distributed Systems
  // ---------------------------------------------------------------------------
  {
    id: 'mit-6824',
    title: 'MIT 6.824: Distributed Systems',
    type: 'course',
    url: 'https://pdos.csail.mit.edu/6.824/',
    phase: 1,
    description: 'Graduate-level course covering fault tolerance, replication, consistency. Includes Raft implementation.',
    estimatedHours: 40,
    concepts: ['replication', 'consensus', 'distributed-failures', 'consistency-models'],
    prerequisites: ['reliability'],
  },
  {
    id: 'stanford-cs244b',
    title: 'Stanford CS244b: Distributed Systems',
    type: 'course',
    url: 'https://www.scs.stanford.edu/20sp-cs244b/',
    phase: 1,
    description: 'Focus on practical distributed systems. Case studies of real systems.',
    estimatedHours: 30,
    concepts: ['replication', 'partitioning', 'consensus'],
    prerequisites: ['reliability', 'scalability'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: PAPERS - LLM Fundamentals
  // ---------------------------------------------------------------------------
  {
    id: 'attention-paper',
    title: 'Attention Is All You Need',
    type: 'paper',
    url: 'https://arxiv.org/abs/1706.03762',
    author: 'Vaswani et al.',
    phase: 2,
    description: 'The original Transformer paper. Introduces self-attention, multi-head attention, positional encoding.',
    estimatedHours: 6,
    concepts: ['attention-mechanism', 'transformer-architecture', 'query-key-value', 'positional-encoding'],
  },
  {
    id: 'scaling-laws-paper',
    title: 'Scaling Laws for Neural Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2001.08361',
    author: 'Kaplan et al. (OpenAI)',
    phase: 2,
    description: 'Empirical study of how loss scales with model size, data, and compute.',
    estimatedHours: 4,
    concepts: ['scaling-laws'],
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'chinchilla-paper',
    title: 'Training Compute-Optimal Large Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2203.15556',
    author: 'Hoffmann et al. (DeepMind)',
    phase: 2,
    description: 'Chinchilla paper. Shows models are undertrained, optimal scaling requires more data.',
    estimatedHours: 3,
    concepts: ['compute-optimal-training'],
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'foundation-models-paper',
    title: 'On the Opportunities and Risks of Foundation Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2108.07258',
    author: 'Bommasani et al. (Stanford)',
    phase: 2,
    description: 'Comprehensive overview of foundation models: capabilities, risks, societal impact.',
    estimatedHours: 8,
    concepts: ['foundation-models'],
    prerequisites: ['scaling-laws'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: PAPERS - Reasoning & Agents
  // ---------------------------------------------------------------------------
  {
    id: 'react-paper',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2210.03629',
    author: 'Yao et al.',
    phase: 2,
    description: 'Interleaving reasoning traces with actions. Foundation for modern LLM agents.',
    estimatedHours: 4,
    concepts: ['react-pattern', 'chain-of-thought', 'tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'tree-of-thoughts-paper',
    title: 'Tree of Thoughts: Deliberate Problem Solving with Large Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2305.10601',
    author: 'Yao et al.',
    phase: 2,
    description: 'Exploring multiple reasoning paths with evaluation and backtracking.',
    estimatedHours: 3,
    concepts: ['tree-of-thoughts'],
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'reflexion-paper',
    title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
    type: 'paper',
    url: 'https://arxiv.org/abs/2303.11366',
    author: 'Shinn et al.',
    phase: 2,
    description: 'Agents that learn from verbal feedback stored in memory.',
    estimatedHours: 3,
    concepts: ['reflexion'],
    prerequisites: ['react-pattern'],
  },
  {
    id: 'toolformer-paper',
    title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
    type: 'paper',
    url: 'https://arxiv.org/abs/2302.04761',
    author: 'Schick et al. (Meta)',
    phase: 2,
    description: 'Self-supervised approach to teaching LLMs when and how to use tools.',
    estimatedHours: 3,
    concepts: ['tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'prompt-report-paper',
    title: 'The Prompt Report: A Systematic Survey of Prompt Engineering Techniques',
    type: 'paper',
    url: 'https://arxiv.org/abs/2406.06608',
    author: 'Schulhoff et al.',
    phase: 2,
    description: 'Most comprehensive survey on prompt engineering. Taxonomy of 58 LLM prompting techniques across 33 vocabulary terms. Essential foundation for all LLM work.',
    estimatedHours: 6,
    concepts: ['prompt-engineering', 'chain-of-thought'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'gorilla-paper',
    title: 'Gorilla: Large Language Model Connected with Massive APIs',
    type: 'paper',
    url: 'https://arxiv.org/abs/2305.15334',
    author: 'Patil et al. (Berkeley)',
    phase: 2,
    description: 'Training LLMs for accurate API/function calling. Introduces APIBench and techniques to reduce hallucination in structured output. Foundation for reliable tool use.',
    estimatedHours: 3,
    concepts: ['structured-output', 'tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'lora-paper',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2106.09685',
    author: 'Hu et al. (Microsoft)',
    phase: 2,
    description: 'Foundational paper on parameter-efficient fine-tuning. Reduces trainable parameters by 10,000x, GPU memory by 3x. Now standard practice for model adaptation.',
    estimatedHours: 3,
    concepts: ['fine-tuning-efficiency'],
    prerequisites: ['transformer-architecture'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 1: VIDEOS - Distributed Systems (Hussein Nasser)
  // ---------------------------------------------------------------------------
  {
    id: 'hussein-backend-beginner',
    title: 'Hussein Nasser - Backend Engineering (Beginner)',
    type: 'course',
    url: 'https://www.youtube.com/playlist?list=PLQnljOFTspQUNnO4p00ua_C5mKTfldiYT',
    author: 'Hussein Nasser',
    phase: 1,
    description: 'System design fundamentals every backend engineer needs. APIs, databases, caching, scaling. No fluff, pure engineering.',
    estimatedHours: 13,
    concepts: ['scalability', 'reliability', 'data-models'],
  },
  {
    id: 'hussein-distributed-systems',
    title: 'Hussein Nasser - Distributed Systems',
    type: 'course',
    url: 'https://www.youtube.com/c/HusseinNasser-software-engineering',
    author: 'Hussein Nasser',
    phase: 1,
    description: 'Distributed transactions, two-phase commit, database sharding, Kafka, caching techniques. Real-world scenarios including Amazon outage analysis.',
    estimatedHours: 5,
    concepts: ['partitioning', 'replication', 'distributed-failures', 'stream-processing'],
    prerequisites: ['reliability', 'scalability'],
  },
  {
    id: 'hussein-backend-advanced',
    title: 'Hussein Nasser - Backend Engineering (Advanced)',
    type: 'course',
    url: 'https://www.youtube.com/playlist?list=PLQnljOFTspQUybacGRk1b_p13dgI-SmcZ',
    author: 'Hussein Nasser',
    phase: 1,
    description: 'Database replication, distributed transactions, network protocols, connection management, load balancing, database sharding.',
    estimatedHours: 10,
    concepts: ['replication', 'partitioning', 'consistency-models'],
    prerequisites: ['reliability', 'scalability'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: VIDEOS - LLM Understanding (Karpathy Complete)
  // ---------------------------------------------------------------------------
  {
    id: 'karpathy-nn-zero-to-hero',
    title: 'Andrej Karpathy - Neural Networks: Zero to Hero',
    type: 'course',
    url: 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'Complete course from backprop basics to GPT. Builds intuition for attention, context costs, and why reasoning is expensive.',
    estimatedHours: 15,
    concepts: ['attention-mechanism', 'transformer-architecture'],
  },
  {
    id: 'karpathy-build-gpt',
    title: 'Andrej Karpathy - Let\'s Build GPT from Scratch',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'Building GPT from scratch in code. Understanding attention, positional encoding, and inference in practice.',
    estimatedHours: 4,
    concepts: ['transformer-architecture', 'attention-mechanism', 'query-key-value'],
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'karpathy-intro-llms',
    title: 'Andrej Karpathy - Intro to Large Language Models',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'One-hour overview of how LLMs work, from tokens to training to inference.',
    estimatedHours: 2,
    concepts: ['foundation-models', 'scaling-laws'],
  },
  {
    id: 'karpathy-llm-os',
    title: 'Andrej Karpathy - LLMs as Operating Systems',
    type: 'video',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'Conceptualizing LLMs as a new kind of operating system. Memory, tools, scheduling.',
    estimatedHours: 2,
    concepts: ['foundation-models', 'tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'stanford-cs25',
    title: 'Stanford CS25: Transformers United',
    type: 'course',
    url: 'https://web.stanford.edu/class/cs25/',
    phase: 2,
    description: 'Seminar series on Transformers. Talks from researchers at OpenAI, Google, etc. Covers scaling laws, inference optimization, fine-tuning vs pretraining.',
    estimatedHours: 20,
    concepts: ['transformer-architecture', 'attention-mechanism', 'scaling-laws', 'compute-optimal-training'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: VIDEOS - ReAct, CoT, Agents
  // ---------------------------------------------------------------------------
  {
    id: 'react-prompting-videos',
    title: 'ReAct Prompting Explained (AssemblyAI/HuggingFace)',
    type: 'video',
    url: 'https://www.youtube.com/@AssemblyAI',
    author: 'AssemblyAI',
    phase: 2,
    description: 'Visual explanations of ReAct prompting pattern. How reasoning and acting interleave.',
    estimatedHours: 2,
    concepts: ['react-pattern', 'chain-of-thought'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'cot-prompting-videos',
    title: 'Chain of Thought Prompting Explained',
    type: 'video',
    url: 'https://www.youtube.com/@DeepLearningAI',
    author: 'DeepLearning.AI',
    phase: 2,
    description: 'Understanding chain of thought prompting. Zero-shot vs few-shot CoT.',
    estimatedHours: 2,
    concepts: ['chain-of-thought'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'lilian-weng-agents',
    title: 'Lilian Weng - LLM Agent Architectures',
    type: 'article',
    url: 'https://lilianweng.github.io/',
    author: 'Lilian Weng (OpenAI)',
    phase: 2,
    description: 'Comprehensive blog posts on agent architectures: tool-using agents, planning vs reacting, memory architectures. Deep technical content.',
    estimatedHours: 6,
    concepts: ['react-pattern', 'plan-and-execute', 'tool-use'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: PAPERS - RAG & Memory
  // ---------------------------------------------------------------------------
  {
    id: 'rag-paper',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    type: 'paper',
    url: 'https://arxiv.org/abs/2005.11401',
    author: 'Lewis et al. (Meta)',
    phase: 3,
    description: 'The original RAG paper. Combining retrieval with generation.',
    estimatedHours: 4,
    concepts: ['rag-basics', 'embeddings'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'lost-in-middle-paper',
    title: 'Lost in the Middle: How Language Models Use Long Contexts',
    type: 'paper',
    url: 'https://arxiv.org/abs/2307.03172',
    author: 'Liu et al.',
    phase: 3,
    description: 'LLMs struggle with information in the middle of long contexts. U-shaped attention.',
    estimatedHours: 2,
    concepts: ['lost-in-middle', 'context-window-limits'],
    prerequisites: ['rag-basics'],
  },
  {
    id: 'long-context-paper',
    title: 'Do Long-Context Models Really Understand?',
    type: 'paper',
    phase: 3,
    description: 'Critical examination of whether long context = better understanding.',
    estimatedHours: 2,
    concepts: ['context-window-limits'],
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'memgpt-paper',
    title: 'MemGPT: Towards LLMs as Operating Systems',
    type: 'paper',
    url: 'https://arxiv.org/abs/2310.08560',
    author: 'Packer et al. (Berkeley)',
    phase: 3,
    description: 'Virtual context management inspired by OS memory hierarchy. LLM manages its own memory through function calls. Enables unbounded conversation and document analysis.',
    estimatedHours: 4,
    concepts: ['memory-management', 'external-memory'],
    prerequisites: ['external-memory', 'tool-use'],
  },
  {
    id: 'generative-agents-paper',
    title: 'Generative Agents: Interactive Simulacra of Human Behavior',
    type: 'paper',
    url: 'https://arxiv.org/abs/2304.03442',
    author: 'Park et al. (Stanford)',
    phase: 3,
    description: 'Agents with memory, reflection, and planning. Memory stream architecture: observations → reflections → plans. Demonstrates importance of memory management for believable agents.',
    estimatedHours: 5,
    concepts: ['memory-management', 'external-memory', 'reflexion'],
    prerequisites: ['external-memory', 'react-pattern'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: ARTICLES - RAG Practical
  // ---------------------------------------------------------------------------
  {
    id: 'llamaindex-rag-pitfalls',
    title: 'LlamaIndex Blog: RAG Pitfalls',
    type: 'article',
    url: 'https://www.llamaindex.ai/blog',
    phase: 3,
    description: 'Practical lessons on what goes wrong with RAG in production.',
    estimatedHours: 2,
    concepts: ['chunking-strategies', 'hybrid-search'],
    prerequisites: ['rag-basics'],
  },
  {
    id: 'pinecone-rag-production',
    title: 'Pinecone: RAG in Production',
    type: 'video',
    url: 'https://www.youtube.com/c/PineconeIO',
    phase: 3,
    description: 'Engineering talks on running RAG at scale. Failure cases and solutions.',
    estimatedHours: 3,
    concepts: ['vector-search', 'hybrid-search', 'chunking-strategies'],
    prerequisites: ['rag-basics', 'embeddings'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: PAPERS - Safety & Guardrails
  // ---------------------------------------------------------------------------
  {
    id: 'constitutional-ai-paper',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    type: 'paper',
    url: 'https://arxiv.org/abs/2212.08073',
    author: 'Bai et al. (Anthropic)',
    phase: 4,
    description: 'Training AI to follow principles through self-critique. Alternative to RLHF.',
    estimatedHours: 4,
    concepts: ['constitutional-ai'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'self-consistency-paper',
    title: 'Self-Consistency Improves Chain of Thought Reasoning',
    type: 'paper',
    url: 'https://arxiv.org/abs/2203.11171',
    author: 'Wang et al. (Google)',
    phase: 4,
    description: 'Sample multiple reasoning paths, take majority vote. Simple but effective.',
    estimatedHours: 2,
    concepts: ['self-consistency'],
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'red-teaming-paper',
    title: 'Red Teaming Language Models',
    type: 'paper',
    phase: 4,
    description: 'Methods for adversarial testing of LLMs before deployment.',
    estimatedHours: 3,
    concepts: ['red-teaming', 'offline-evaluation'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'helm-paper',
    title: 'Holistic Evaluation of Language Models (HELM)',
    type: 'paper',
    url: 'https://arxiv.org/abs/2211.09110',
    author: 'Liang et al. (Stanford)',
    phase: 4,
    description: 'Comprehensive framework for LLM evaluation: 7 metrics across 42 scenarios. Measures accuracy, calibration, robustness, fairness, bias, toxicity, efficiency. The standard for systematic offline evaluation.',
    estimatedHours: 5,
    concepts: ['offline-evaluation'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'ml-testing-survey',
    title: 'Test & Evaluation Best Practices for ML-Enabled Systems',
    type: 'paper',
    url: 'https://arxiv.org/abs/2310.06800',
    author: 'Carnegie Mellon SEI',
    phase: 4,
    description: 'T&E across ML lifecycle: component, integration, post-deployment. Covers online evaluation strategies including A/B testing, shadow traffic, and production monitoring.',
    estimatedHours: 4,
    concepts: ['online-evaluation', 'offline-evaluation'],
    prerequisites: ['foundation-models', 'slos-slis'],
  },
  {
    id: 'ml-testing-practices',
    title: 'Machine Learning Testing: Survey, Landscapes and Horizons',
    type: 'paper',
    url: 'https://arxiv.org/abs/1906.10742',
    phase: 4,
    description: 'Comprehensive survey of ML testing. Covers online testing (A/B tests, canaries), runtime monitoring, and the gap between offline metrics and real-world performance.',
    estimatedHours: 6,
    concepts: ['online-evaluation', 'offline-evaluation'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: VIDEOS - Safety & Evaluation
  // ---------------------------------------------------------------------------
  {
    id: 'anthropic-safety-talks',
    title: 'Anthropic Safety Research Talks',
    type: 'video',
    url: 'https://www.youtube.com/@anthropic-ai',
    phase: 4,
    description: 'Research presentations on LLM reliability, hallucinations, alignment, prompt injection. Direct from Anthropic researchers.',
    estimatedHours: 4,
    concepts: ['constitutional-ai', 'offline-evaluation', 'output-validation'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'deeplearning-ai-llm-evals',
    title: 'DeepLearning.AI - LLM Evaluation',
    type: 'video',
    url: 'https://www.youtube.com/@DeepLearningAI',
    author: 'DeepLearning.AI',
    phase: 4,
    description: 'Why LLM evaluation is hard. Metrics, benchmarks, and real-world evaluation strategies.',
    estimatedHours: 3,
    concepts: ['offline-evaluation', 'online-evaluation'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'harvard-ai-ethics',
    title: 'Harvard CS - AI Ethics (Applied)',
    type: 'course',
    url: 'https://www.youtube.com/@Harvard',
    author: 'Harvard',
    phase: 4,
    description: 'Applied AI ethics, not philosophical debates. AI alignment explained, responsible AI at scale.',
    estimatedHours: 6,
    concepts: ['constitutional-ai', 'offline-evaluation'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'stanford-hai-talks',
    title: 'Stanford HAI Technical Talks',
    type: 'video',
    url: 'https://www.youtube.com/@StanfordHAI',
    author: 'Stanford HAI',
    phase: 4,
    description: 'Technical talks from Stanford Human-Centered AI. Focus on technical content, not policy panels.',
    estimatedHours: 4,
    concepts: ['offline-evaluation', 'constitutional-ai'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: PAPERS - Inference & Economics
  // ---------------------------------------------------------------------------
  {
    id: 'vllm-paper',
    title: 'vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention',
    type: 'paper',
    url: 'https://arxiv.org/abs/2309.06180',
    author: 'Kwon et al. (Berkeley)',
    phase: 5,
    description: 'PagedAttention for efficient KV cache management. Enables high-throughput serving.',
    estimatedHours: 3,
    concepts: ['paged-attention', 'kv-cache', 'batching-inference'],
    prerequisites: ['kv-cache'],
  },
  {
    id: 'speculative-decoding-paper',
    title: 'Speculative Decoding',
    type: 'paper',
    phase: 5,
    description: 'Using small models to draft, large models to verify. Speeds up inference.',
    estimatedHours: 2,
    concepts: ['speculative-decoding'],
    prerequisites: ['kv-cache'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: ARTICLES - Economics
  // ---------------------------------------------------------------------------
  {
    id: 'openai-pricing-docs',
    title: 'OpenAI API Pricing Documentation',
    type: 'article',
    url: 'https://openai.com/pricing',
    phase: 5,
    description: 'Understanding token costs, rate limits, batching discounts.',
    estimatedHours: 1,
    concepts: ['token-economics'],
  },
  {
    id: 'anthropic-pricing-docs',
    title: 'Anthropic API Pricing Documentation',
    type: 'article',
    url: 'https://www.anthropic.com/pricing',
    phase: 5,
    description: 'Claude pricing tiers, context window costs.',
    estimatedHours: 1,
    concepts: ['token-economics'],
  },
  {
    id: 'gptcache-paper',
    title: 'GPTCache: Semantic Cache for LLM Applications',
    type: 'paper',
    url: 'https://arxiv.org/abs/2411.05276',
    author: 'Zilliz',
    phase: 5,
    description: 'Semantic caching using query embeddings. Reduces API calls 60-70% with cache hit rates up to 68%. Covers similarity thresholds, eviction strategies, and accuracy trade-offs.',
    estimatedHours: 2,
    concepts: ['semantic-caching'],
    prerequisites: ['embeddings', 'token-economics'],
  },
  {
    id: 'prompt-caching-docs',
    title: 'Prompt Caching - Claude & OpenAI Documentation',
    type: 'article',
    url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
    phase: 5,
    description: 'Official docs on API-level prompt caching. How prefix caching works, pricing (90% cheaper), minimum token requirements, TTL strategies. Different from semantic caching.',
    estimatedHours: 1,
    concepts: ['prompt-caching'],
    prerequisites: ['kv-cache', 'token-economics'],
  },
  {
    id: 'llm-observability-guide',
    title: 'LLM Observability with OpenTelemetry',
    type: 'article',
    url: 'https://opentelemetry.io/blog/2024/llm-observability/',
    phase: 5,
    description: 'Extending observability for LLM systems. Tracing prompts, completions, token usage. Integrates with standard observability stack.',
    estimatedHours: 2,
    concepts: ['llm-observability'],
    prerequisites: ['monitoring'],
  },
  {
    id: 'langfuse-observability',
    title: 'Langfuse: Open Source LLM Observability',
    type: 'article',
    url: 'https://langfuse.com/docs',
    phase: 5,
    description: 'Production LLM observability platform. Tracing, evaluation, prompt management, cost tracking. Open source alternative to LangSmith.',
    estimatedHours: 3,
    concepts: ['llm-observability', 'online-evaluation'],
    prerequisites: ['monitoring', 'token-economics'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: VIDEOS - Inference Infrastructure (Frontier 2024-2025)
  // ---------------------------------------------------------------------------
  {
    id: 'modal-vercel-infrastructure',
    title: 'Modal/Vercel/Replicate - LLM Infrastructure Talks',
    type: 'video',
    url: 'https://www.youtube.com/@modal_labs',
    author: 'Modal / Vercel / Replicate',
    phase: 5,
    description: 'Real LLM infrastructure at scale. Serving LLMs, inference optimization, production deployment.',
    estimatedHours: 4,
    concepts: ['batching-inference', 'paged-attention', 'token-economics'],
    prerequisites: ['kv-cache'],
  },
  {
    id: 'openai-research-talks',
    title: 'OpenAI Research Talks',
    type: 'video',
    url: 'https://www.youtube.com/@OpenAI',
    author: 'OpenAI',
    phase: 5,
    description: 'Internal research talks from OpenAI. Insights into how their systems work.',
    estimatedHours: 4,
    concepts: ['scaling-laws', 'batching-inference'],
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'deepmind-systems-talks',
    title: 'DeepMind Systems Talks',
    type: 'video',
    url: 'https://www.youtube.com/@DeepMind',
    author: 'DeepMind',
    phase: 5,
    description: 'Systems-level research talks from DeepMind. Focus on architecture and scaling.',
    estimatedHours: 4,
    concepts: ['scaling-laws', 'compute-optimal-training'],
    prerequisites: ['transformer-architecture'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 6: DOCUMENTATION & VIDEOS - Frameworks
  // ---------------------------------------------------------------------------
  {
    id: 'langchain-docs',
    title: 'LangChain Documentation (Architecture)',
    type: 'article',
    url: 'https://python.langchain.com/docs/',
    phase: 6,
    description: 'Official docs. Focus on architecture sections, not tutorials.',
    estimatedHours: 4,
    concepts: ['langchain-architecture'],
    prerequisites: ['react-pattern', 'rag-basics'],
  },
  {
    id: 'langchain-videos',
    title: 'LangChain Official Videos',
    type: 'video',
    url: 'https://www.youtube.com/@LangChain',
    author: 'LangChain',
    phase: 6,
    description: 'LangChain architecture overview, LangGraph concepts, tool calling patterns. Watch to understand how others abstract problems you can solve better.',
    estimatedHours: 4,
    concepts: ['langchain-architecture', 'framework-tradeoffs'],
    prerequisites: ['react-pattern', 'rag-basics'],
  },
  {
    id: 'autogen-videos',
    title: 'Microsoft AutoGen - Multi-Agent Systems',
    type: 'video',
    url: 'https://www.youtube.com/@MicrosoftResearch',
    author: 'Microsoft Research',
    phase: 6,
    description: 'AutoGen multi-agent systems, agent collaboration patterns. More serious alternative to LangChain.',
    estimatedHours: 4,
    concepts: ['langchain-architecture', 'framework-tradeoffs'],
    prerequisites: ['react-pattern', 'plan-and-execute'],
  },
  {
    id: 'llamaindex-docs',
    title: 'LlamaIndex Documentation (Internals)',
    type: 'article',
    url: 'https://docs.llamaindex.ai/',
    phase: 6,
    description: 'Official docs. Focus on how indexes and query engines work internally.',
    estimatedHours: 4,
    concepts: ['llamaindex-architecture'],
    prerequisites: ['rag-basics', 'chunking-strategies'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 6: ANTI-FRAMEWORK - Build From Scratch
  // Understanding > Using. Implement before importing.
  // ---------------------------------------------------------------------------
  {
    id: 'rag-from-scratch',
    title: 'Build RAG From Scratch (No Frameworks)',
    type: 'article',
    url: 'https://huggingface.co/blog/ngxson/make-your-own-rag',
    phase: 6,
    description: 'Implement RAG in ~200 lines without LangChain or LlamaIndex. Build your own vector store, chunking, retrieval. Proves you understand the mechanics.',
    estimatedHours: 4,
    concepts: ['minimal-implementations', 'framework-tradeoffs'],
    prerequisites: ['rag-basics', 'embeddings', 'vector-search'],
  },
  {
    id: 'rag-without-frameworks',
    title: 'RAG Applications Without LangChain or LlamaIndex',
    type: 'article',
    url: 'https://blog.futuresmart.ai/building-rag-applications-without-langchain-or-llamaindex',
    phase: 6,
    description: 'Production-ready RAG with just ChromaDB and OpenAI API. All code debuggable, no black boxes. Explains what frameworks hide.',
    estimatedHours: 3,
    concepts: ['minimal-implementations', 'framework-tradeoffs'],
    prerequisites: ['rag-basics', 'vector-search'],
  },
  {
    id: 'minimal-agent-loop',
    title: 'Minimal Agent Loop Implementation',
    type: 'article',
    url: 'https://github.com/pguso/rag-from-scratch',
    phase: 6,
    description: 'Educational project: build agents from the ground up. Clear explanations, commented code, no abstractions. Demystifies what LangChain agents actually do.',
    estimatedHours: 4,
    concepts: ['minimal-implementations', 'framework-tradeoffs'],
    prerequisites: ['react-pattern', 'tool-use'],
  },
];

// ============================================================================
// PROJECTS (Practical Application)
// ============================================================================

export const projects = [
  {
    id: 'project-kv-store',
    title: 'Distributed Key-Value Store',
    phase: 1 as StudyPhase,
    description: 'Build a simple distributed KV store with replication. Simulate network partitions and observe behavior.',
    deliverables: [
      'Leader-based replication working',
      'Handles leader failure gracefully',
      'Can demonstrate split-brain scenario',
      'Written explanation of consistency trade-offs observed',
    ],
  },
  {
    id: 'project-react-agent',
    title: 'ReAct Agent from Scratch',
    phase: 2 as StudyPhase,
    description: 'Implement a ReAct agent without using LangChain or similar. Must include tool use and reasoning traces.',
    deliverables: [
      'Agent can call at least 3 different tools',
      'Reasoning traces are visible and coherent',
      'Handles tool failures gracefully',
      'Cost tracking per query',
    ],
  },
  {
    id: 'project-rag-system',
    title: 'RAG System with Metrics',
    phase: 3 as StudyPhase,
    description: 'Build a RAG system and measure precision/recall with different chunking strategies.',
    deliverables: [
      'Working RAG pipeline',
      'At least 3 chunking strategies compared',
      'Precision/recall measured on test set',
      'Written analysis of trade-offs',
    ],
  },
  {
    id: 'project-validators',
    title: 'LLM Output Validators',
    phase: 4 as StudyPhase,
    description: 'Build a validation layer for LLM outputs. Include schema validation, fact-checking, and safety filtering.',
    deliverables: [
      'JSON schema validator with error recovery',
      'Simple fact-checking against knowledge base',
      'Safety filter (detect harmful outputs)',
      'Metrics: false positive/negative rates',
    ],
  },
  {
    id: 'project-router',
    title: 'Model Router with Cost Tracking',
    phase: 5 as StudyPhase,
    description: 'Build a router that sends simple queries to a small model and complex queries to a large model. Track costs.',
    deliverables: [
      'Classification of query complexity working',
      'Routing to at least 2 different models',
      'Cost tracking dashboard',
      'Analysis: cost savings vs quality trade-off',
    ],
  },
  {
    id: 'project-framework-critique',
    title: 'Framework Feature Reimplementation',
    phase: 6 as StudyPhase,
    description: 'Pick one LangChain feature (e.g., ConversationBufferMemory). Reimplement it from scratch. Document why you would or wouldn\'t use the framework version.',
    deliverables: [
      'Working reimplementation',
      'Performance comparison (latency, memory)',
      'Code complexity comparison',
      'Written recommendation: when to use framework vs custom',
    ],
  },
];

// ============================================================================
// HELPER: Get all data
// ============================================================================

export function getSeedData() {
  return {
    concepts,
    resources,
    projects,
  };
}

// ============================================================================
// CLI: Print summary
// ============================================================================

if (require.main === module) {
  console.log('=== Jarre Seed Data Summary ===\n');

  console.log(`Concepts: ${concepts.length}`);
  for (let phase = 1; phase <= 6; phase++) {
    const count = concepts.filter(c => c.phase === phase).length;
    console.log(`  Phase ${phase}: ${count} concepts`);
  }

  console.log(`\nResources: ${resources.length}`);
  for (let phase = 1; phase <= 6; phase++) {
    const count = resources.filter(r => r.phase === phase).length;
    console.log(`  Phase ${phase}: ${count} resources`);
  }

  console.log(`\nProjects: ${projects.length}`);

  console.log('\n=== Ready to seed database ===');
}
