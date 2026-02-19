-- Fix missing resource_concepts for DDIA chapters
--
-- Problem: Concepts were created in concepts table but never linked
-- to their respective DDIA chapter resources via resource_concepts.
-- This caused mastery updates to only apply to the coarse-grained
-- "umbrella" concepts (e.g. "transactions") instead of the granular
-- ones (e.g. "serializability", "weak-isolation").
--
-- This migration adds the granular concepts as taught (is_prerequisite=false)
-- for each DDIA chapter where they belong.

-- ============================================================================
-- Chapter 4: Encoding and Evolution
-- Currently only has: encoding-evolution (taught), data-models (prereq)
-- Missing: encoding-formats, thrift-protobuf, avro, schema-evolution, dataflow-modes
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch4', 'encoding-formats', false),
  ('ddia-ch4', 'thrift-protobuf', false),
  ('ddia-ch4', 'avro', false),
  ('ddia-ch4', 'schema-evolution', false),
  ('ddia-ch4', 'dataflow-modes', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- Chapter 7: Transactions
-- Currently only has: transactions (taught), replication (prereq), storage-engines (prereq)
-- Missing: transaction-concepts, weak-isolation, preventing-lost-updates, write-skew, serializability
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch7', 'transaction-concepts', false),
  ('ddia-ch7', 'weak-isolation', false),
  ('ddia-ch7', 'preventing-lost-updates', false),
  ('ddia-ch7', 'write-skew', false),
  ('ddia-ch7', 'serializability', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- Chapter 8: The Trouble with Distributed Systems
-- Currently only has: distributed-failures (taught), partitioning (prereq), replication (prereq)
-- Missing: unreliable-networks, unreliable-clocks, knowledge-truth
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch8', 'unreliable-networks', false),
  ('ddia-ch8', 'unreliable-clocks', false),
  ('ddia-ch8', 'knowledge-truth', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- Chapter 9: Consistency and Consensus
-- Currently only has: consensus (taught), consistency-models (taught), distributed-failures (prereq)
-- Missing: ordering
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch9', 'ordering', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- Chapter 11: Stream Processing
-- Currently only has: stream-processing (taught), partitioning (prereq)
-- Missing: databases-streams, processing-streams
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch11', 'databases-streams', false),
  ('ddia-ch11', 'processing-streams', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- Chapter 1: Also link fan-out-latency and tail-latency (discussed in ch1)
-- Currently only has: maintainability, reliability, scalability
-- The tail-latency and hedged-requests concepts are Phase 1 and directly
-- covered in DDIA Ch1's percentiles/SLA discussion
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('ddia-ch1', 'tail-latency', false),
  ('ddia-ch1', 'fan-out-latency', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;
