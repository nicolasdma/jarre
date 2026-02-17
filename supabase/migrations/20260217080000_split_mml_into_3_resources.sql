-- Split the single p0-math-for-ml resource into 3 thematic resources
-- for proper section-based learning flow.

-- 1. Remove old resource-concept mappings
DELETE FROM resource_concepts WHERE resource_id = 'p0-math-for-ml';

-- 2. Remove old resource
DELETE FROM resources WHERE id = 'p0-math-for-ml';

-- 3. Insert 3 new thematic resources
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p0-linear-algebra', 'Álgebra Lineal para ML', 'book',
   'https://mml-book.github.io/',
   'Deisenroth, Faisal & Ong',
   '0'::study_phase,
   'Vectores, matrices, transformaciones lineales, descomposición SVD, eigenvalores y PCA. Basado en los capítulos 2-4 y 10 de Mathematics for Machine Learning. Cada operación de un neural network es una multiplicación de matrices — esta es la base.',
   12),

  ('p0-calculus-optimization', 'Cálculo y Optimización para ML', 'book',
   'https://mml-book.github.io/',
   'Deisenroth, Faisal & Ong',
   '0'::study_phase,
   'Derivadas parciales, gradientes, regla de la cadena, backpropagation derivado paso a paso, y algoritmos de optimización (SGD, Adam, learning rate schedules). Basado en los capítulos 5 y 7 de Mathematics for Machine Learning.',
   10),

  ('p0-probability', 'Probabilidad y Teoría de la Información para ML', 'book',
   'https://mml-book.github.io/',
   'Deisenroth, Faisal & Ong',
   '0'::study_phase,
   'Espacios de probabilidad, distribuciones, Bayes, MLE/MAP, entropía, cross-entropy, KL divergence y sus aplicaciones en deep learning. Basado en el capítulo 6 de Mathematics for Machine Learning con suplemento de teoría de la información.',
   10)
ON CONFLICT (id) DO NOTHING;

-- 4. Resource-concept mappings for the 3 new resources
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  -- Linear Algebra
  ('p0-linear-algebra', 'linear-algebra-ml', FALSE),
  ('p0-linear-algebra', 'dimensionality-reduction', FALSE),

  -- Calculus & Optimization
  ('p0-calculus-optimization', 'calculus-backprop', FALSE),
  ('p0-calculus-optimization', 'optimization-ml', FALSE),

  -- Probability & Information Theory
  ('p0-probability', 'probability-statistics', FALSE),
  ('p0-probability', 'information-theory', FALSE)
ON CONFLICT DO NOTHING;
