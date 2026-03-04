-- Phase 1.5: Linear Algebra Bridge resources + concept mappings
-- Must run after 20260304170000 (enum value creation).

INSERT INTO resources (
  id,
  title,
  type,
  url,
  author,
  phase,
  description,
  estimated_hours,
  sort_order,
  curriculum_source,
  is_archived
)
VALUES
  (
    'p15-3b1b-linear-algebra-core',
    '3Blue1Brown — Essence of Linear Algebra (Core Chapters)',
    'lecture',
    'https://www.3blue1brown.com/topics/linear-algebra',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Visual bridge for ML math: vectors, span, linear transformations, matrix multiplication as composition, and dot product intuition.',
    2.5,
    10,
    'core',
    FALSE
  ),
  (
    'p15-cs231n-linear-backprop',
    'CS231n — Linear Backprop Handout',
    'paper',
    'https://cs231n.stanford.edu/handouts/linear-backprop.pdf',
    'Stanford CS231n',
    '1.5'::study_phase,
    'Compact matrix-shape mental model for forward/backward passes used in practical neural network training.',
    1.5,
    20,
    'core',
    FALSE
  ),
  (
    'p15-matrix-calculus-dl',
    'The Matrix Calculus You Need For Deep Learning',
    'paper',
    'https://arxiv.org/pdf/1802.01528.pdf',
    'Terence Parr & Jeremy Howard',
    '1.5'::study_phase,
    'Short reference to connect matrix operations with gradients and backprop notation in modern ML resources.',
    2,
    30,
    'core',
    FALSE
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  author = EXCLUDED.author,
  phase = EXCLUDED.phase,
  description = EXCLUDED.description,
  estimated_hours = EXCLUDED.estimated_hours,
  sort_order = EXCLUDED.sort_order,
  curriculum_source = 'core',
  is_archived = FALSE;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p15-3b1b-linear-algebra-core', 'linear-algebra-ml', FALSE),

  ('p15-cs231n-linear-backprop', 'calculus-backprop', FALSE),
  ('p15-cs231n-linear-backprop', 'linear-algebra-ml', TRUE),

  ('p15-matrix-calculus-dl', 'calculus-backprop', FALSE),
  ('p15-matrix-calculus-dl', 'linear-algebra-ml', TRUE)
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = EXCLUDED.is_prerequisite;
