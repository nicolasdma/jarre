-- Phase 0: Math Foundations (Supplementary)
-- Always available, does not block any phase progression.
-- Covers linear algebra, probability, optimization, calculus, and dimensionality reduction.

-- 1. Concepts (6)
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('linear-algebra-ml', 'Linear Algebra for ML',
   'linear-algebra-ml',
   'Vectors, matrices, and their operations as the language of ML. SVD (Singular Value Decomposition) for dimensionality reduction and matrix approximation. Eigendecomposition for understanding PCA, covariance matrices, and spectral methods. Matrix calculus (Jacobians, Hessians) for understanding backpropagation. Every neural network operation is a matrix multiply.',
   '0'::study_phase),

  ('probability-statistics', 'Probability & Statistics',
   'probability-statistics',
   'Bayesian thinking: prior, likelihood, posterior. MLE (Maximum Likelihood Estimation) and MAP (Maximum A Posteriori) as the foundation of all training objectives. Common distributions: Gaussian, Bernoulli, Categorical, Dirichlet. Conjugate priors for tractable Bayesian inference. Statistical testing for model comparison.',
   '0'::study_phase),

  ('information-theory', 'Information Theory',
   'information-theory',
   'Entropy as the measure of uncertainty in a distribution. Cross-entropy as the standard loss function for classification (and language modeling). KL divergence for measuring distribution distance (used in VAEs, RLHF, knowledge distillation). Mutual information for feature selection and representation learning. Bits-per-byte for language model evaluation.',
   '0'::study_phase),

  ('optimization-ml', 'Optimization for ML',
   'optimization-ml',
   'Gradient descent and its variants: SGD (stochastic), mini-batch, momentum. Adam optimizer: adaptive learning rates with first and second moment estimates. Convexity and why neural network loss landscapes are non-convex. Learning rate schedules: warmup, cosine annealing, linear decay. Understanding why optimization works despite non-convexity.',
   '0'::study_phase),

  ('calculus-backprop', 'Calculus & Backpropagation',
   'calculus-backprop',
   'Chain rule as the engine of deep learning: how gradients flow backwards through computational graphs. Backpropagation derived step by step for a simple network. Jacobian matrices for multi-output functions. Vanishing and exploding gradients: why they happen and how residual connections, LayerNorm, and gradient clipping address them.',
   '0'::study_phase),

  ('dimensionality-reduction', 'Dimensionality Reduction',
   'dimensionality-reduction',
   'PCA (Principal Component Analysis): project to directions of maximum variance using eigendecomposition of covariance matrix. t-SNE: non-linear reduction preserving local structure (perplexity parameter, crowding problem). UMAP: faster alternative preserving both local and global structure. The manifold hypothesis: high-dimensional data lies on lower-dimensional manifolds.',
   '0'::study_phase)

ON CONFLICT (id) DO NOTHING;

-- 2. Concept prerequisites (internal to Phase 0)
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('optimization-ml', 'calculus-backprop'),
  ('dimensionality-reduction', 'linear-algebra-ml'),
  ('information-theory', 'probability-statistics')
ON CONFLICT DO NOTHING;

-- 3. Resources (5)
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p0-3b1b-linear-algebra', '3Blue1Brown: Essence of Linear Algebra', 'video',
   'https://www.3blue1brown.com/topics/linear-algebra',
   'Grant Sanderson',
   '0'::study_phase,
   'Visual, intuitive introduction to linear algebra: vectors, matrices, determinants, eigenvalues, and change of basis. The best way to build geometric intuition before diving into ML math. Free on YouTube.',
   6),

  ('p0-3b1b-neural-networks', '3Blue1Brown: Neural Networks', 'video',
   'https://www.3blue1brown.com/topics/neural-networks',
   'Grant Sanderson',
   '0'::study_phase,
   'Visual explanation of neural networks, gradient descent, and backpropagation. Builds intuition for why these techniques work without heavy notation. Free on YouTube.',
   4),

  ('p0-math-for-ml', 'Mathematics for Machine Learning', 'book',
   'https://mml-book.github.io/',
   'Deisenroth, Faisal & Ong',
   '0'::study_phase,
   'Comprehensive textbook covering linear algebra, analytic geometry, matrix decompositions, probability, optimization, and their applications to ML. Free PDF available. The standard reference for ML math foundations.',
   30),

  ('p0-cs229-probability', 'Stanford CS229: Probability Review', 'article',
   'https://cs229.stanford.edu/section/cs229-prob.pdf',
   'Stanford CS229',
   '0'::study_phase,
   'Concise review of probability and statistics needed for ML: random variables, distributions, expectation, variance, Bayes rule, MLE, and MAP. Used as the probability primer for Stanford''s ML course.',
   3),

  ('p0-statquest', 'StatQuest: Statistics Fundamentals', 'video',
   'https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9',
   'Josh Starmer',
   '0'::study_phase,
   'Clear, step-by-step video explanations of statistics concepts: distributions, hypothesis testing, p-values, Bayesian statistics, and machine learning fundamentals. Free on YouTube.',
   10)

ON CONFLICT (id) DO NOTHING;

-- 4. Resource-concept mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  -- 3B1B Linear Algebra
  ('p0-3b1b-linear-algebra', 'linear-algebra-ml', FALSE),
  ('p0-3b1b-linear-algebra', 'dimensionality-reduction', FALSE),

  -- 3B1B Neural Networks
  ('p0-3b1b-neural-networks', 'calculus-backprop', FALSE),
  ('p0-3b1b-neural-networks', 'optimization-ml', FALSE),

  -- Math for ML book
  ('p0-math-for-ml', 'linear-algebra-ml', FALSE),
  ('p0-math-for-ml', 'probability-statistics', FALSE),
  ('p0-math-for-ml', 'optimization-ml', FALSE),
  ('p0-math-for-ml', 'calculus-backprop', FALSE),
  ('p0-math-for-ml', 'dimensionality-reduction', FALSE),

  -- CS229 Probability
  ('p0-cs229-probability', 'probability-statistics', FALSE),
  ('p0-cs229-probability', 'information-theory', FALSE),

  -- StatQuest
  ('p0-statquest', 'probability-statistics', FALSE)

ON CONFLICT DO NOTHING;

-- No project for Phase 0 — it's supplementary.
