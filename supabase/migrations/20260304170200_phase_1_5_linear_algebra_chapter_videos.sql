-- Phase 1.5 fix: replace topic-level URL with chapter-level YouTube URLs
-- so pipeline generation can run from valid single-video sources.

UPDATE resources
SET is_archived = TRUE
WHERE id = 'p15-3b1b-linear-algebra-core';

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
    'p15-3b1b-vectors',
    '3Blue1Brown — Vectors (Chapter 1)',
    'lecture',
    'https://www.youtube.com/watch?v=fNk_zzaMoSs',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Intuición base de vectores para comenzar álgebra lineal aplicada a ML.',
    0.5,
    10,
    'core',
    FALSE
  ),
  (
    'p15-3b1b-span-basis',
    '3Blue1Brown — Span & Basis (Chapter 2)',
    'lecture',
    'https://www.youtube.com/watch?v=k7RM-ot2NWY',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Combinaciones lineales, span y base con enfoque geométrico.',
    0.5,
    20,
    'core',
    FALSE
  ),
  (
    'p15-3b1b-linear-transformations',
    '3Blue1Brown — Linear Transformations (Chapter 3)',
    'lecture',
    'https://www.youtube.com/watch?v=kYB8IZa5AuE',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Matrices como transformaciones del espacio, no solo tablas de números.',
    0.5,
    30,
    'core',
    FALSE
  ),
  (
    'p15-3b1b-matrix-composition',
    '3Blue1Brown — Matrix Multiplication as Composition (Chapter 4)',
    'lecture',
    'https://www.youtube.com/watch?v=XkY2DOUCWMU',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Multiplicación matricial como composición de transformaciones.',
    0.5,
    40,
    'core',
    FALSE
  ),
  (
    'p15-3b1b-dot-products',
    '3Blue1Brown — Dot Products & Duality (Chapter 9)',
    'lecture',
    'https://www.youtube.com/watch?v=LyGKycYT2v0',
    'Grant Sanderson',
    '1.5'::study_phase,
    'Producto punto como proyección y señal de similitud direccional.',
    0.5,
    50,
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
  ('p15-3b1b-vectors', 'linear-algebra-ml', FALSE),
  ('p15-3b1b-span-basis', 'linear-algebra-ml', FALSE),
  ('p15-3b1b-linear-transformations', 'linear-algebra-ml', FALSE),
  ('p15-3b1b-matrix-composition', 'linear-algebra-ml', FALSE),
  ('p15-3b1b-dot-products', 'linear-algebra-ml', FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE
SET is_prerequisite = EXCLUDED.is_prerequisite;
