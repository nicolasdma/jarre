-- Create "The Tail at Scale" paper resource and link concepts
-- Paper by Jeffrey Dean & Luiz André Barroso (2013)

-- 1. Insert the resource
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES (
  'tail-at-scale-paper',
  'The Tail at Scale',
  'paper',
  'https://research.google/pubs/pub40801/',
  'Jeffrey Dean, Luiz André Barroso',
  '1'::study_phase,
  'Seminal paper on why tail latency dominates user experience in large-scale distributed systems, and practical techniques (hedged requests, tied requests, micro-partitioning) to mitigate it.',
  2.5
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  estimated_hours = EXCLUDED.estimated_hours;

-- 2. Ensure concepts exist (created in 20260215010000_paper_concepts.sql, but safety net)
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('tail-latency', 'Tail Latency', 'tail-latency',
   'The high-percentile latency (p99, p999) experienced by the slowest requests. In distributed systems with fan-out, tail latency of individual servers is amplified exponentially.', '1'::study_phase),
  ('hedged-requests', 'Hedged Requests', 'hedged-requests',
   'Technique to reduce tail latency by sending the same request to multiple replicas and using whichever responds first. Variants include tied requests (cancel redundant) and probing (pick least-loaded server).', '1'::study_phase),
  ('fan-out-latency', 'Fan-out Latency', 'fan-out-latency',
   'In systems where a single user request fans out to many backend servers, the overall latency is determined by the slowest server. Tail latency amplification grows with fan-out degree.', '1'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- 3. Link concepts taught by this paper
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('tail-at-scale-paper', 'tail-latency', false),
  ('tail-at-scale-paper', 'hedged-requests', false),
  ('tail-at-scale-paper', 'fan-out-latency', false)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- 4. Link prerequisite concepts (from DDIA ch1)
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('tail-at-scale-paper', 'reliability', true),
  ('tail-at-scale-paper', 'scalability', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;
