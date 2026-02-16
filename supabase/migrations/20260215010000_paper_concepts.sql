-- Add missing concept IDs needed for paper sections
-- These concepts are referenced in resource_sections for the 3 papers

INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('hedged-requests', 'Hedged Requests', 'hedged-requests',
   'Technique to reduce tail latency by sending the same request to multiple replicas and using whichever responds first. Variants include tied requests (cancel redundant) and probing (pick least-loaded server).', '1'::study_phase),
  ('fan-out-latency', 'Fan-out Latency', 'fan-out-latency',
   'In systems where a single user request fans out to many backend servers, the overall latency is determined by the slowest server. Tail latency amplification grows with fan-out degree.', '1'::study_phase),
  ('multi-head-attention', 'Multi-Head Attention', 'multi-head-attention',
   'Running multiple attention functions in parallel, each with different learned projections (Q, K, V). Allows the model to attend to information from different representation subspaces at different positions.', '2'::study_phase),
  ('power-law-loss', 'Power-Law Loss Scaling', 'power-law-loss',
   'Empirical observation that neural language model loss decreases as a power law with model size, dataset size, and compute. L(x) = (x_c/x)^alpha where alpha varies by axis.', '2'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- Add prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('hedged-requests', 'tail-latency'),
  ('fan-out-latency', 'tail-latency'),
  ('multi-head-attention', 'attention-mechanism'),
  ('power-law-loss', 'scaling-laws')
ON CONFLICT DO NOTHING;
