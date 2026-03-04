-- ============================================================================
-- Curriculum Professional Baseline
-- ----------------------------------------------------------------------------
-- Goals
-- 1) Separate canonical curriculum resources from user-generated/experimental rows.
-- 2) Archive known experimental noise from core learning flow.
-- 3) Add integrity constraints to keep the catalog clean over time.
-- 4) Create phase metadata as source-of-truth for template generation.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Resource source classification
-- ---------------------------------------------------------------------------
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS curriculum_source TEXT NOT NULL DEFAULT 'core';

-- Backfill obvious experimental artifacts first.
UPDATE resources
SET curriculum_source = 'experimental',
    is_archived = TRUE,
    updated_at = NOW()
WHERE id LIKE 'yt-%'
   OR id LIKE '%fasttest%';

-- Backfill user-generated resources.
UPDATE resources
SET curriculum_source = 'user_generated',
    updated_at = NOW()
WHERE created_by IS NOT NULL
  AND curriculum_source <> 'experimental';

-- Backfill canonical core resources.
UPDATE resources
SET curriculum_source = 'core',
    updated_at = NOW()
WHERE created_by IS NULL
  AND curriculum_source NOT IN ('experimental', 'user_generated');

-- Canonical Karpathy resources should remain core-owned even after user-side merges.
UPDATE resources
SET created_by = NULL,
    curriculum_source = 'core',
    is_archived = FALSE,
    updated_at = NOW()
WHERE id LIKE 'kz2h-%'
  AND id NOT LIKE '%fasttest%';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resources_curriculum_source_check'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT resources_curriculum_source_check
      CHECK (curriculum_source IN ('core', 'user_generated', 'experimental'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resources_core_created_by_null_check'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT resources_core_created_by_null_check
      CHECK (curriculum_source <> 'core' OR created_by IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resources_user_generated_has_owner_check'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT resources_user_generated_has_owner_check
      CHECK (curriculum_source <> 'user_generated' OR created_by IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resources_curriculum_source
  ON resources(curriculum_source, phase, sort_order);

-- Prevent duplicate canonical URLs inside the same phase.
CREATE UNIQUE INDEX IF NOT EXISTS uq_resources_core_phase_url
  ON resources (phase, lower(url))
  WHERE curriculum_source = 'core'
    AND is_archived = FALSE
    AND url IS NOT NULL;

-- Keep source classification consistent when rows are inserted/updated.
CREATE OR REPLACE FUNCTION set_resource_curriculum_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.curriculum_source IS NULL THEN
    NEW.curriculum_source := CASE
      WHEN NEW.created_by IS NULL THEN 'core'
      ELSE 'user_generated'
    END;
  ELSIF NEW.curriculum_source = 'core' AND NEW.created_by IS NOT NULL THEN
    NEW.curriculum_source := 'user_generated';
  ELSIF NEW.curriculum_source = 'user_generated' AND NEW.created_by IS NULL THEN
    NEW.curriculum_source := 'core';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_resource_curriculum_source ON resources;
CREATE TRIGGER trg_set_resource_curriculum_source
BEFORE INSERT OR UPDATE OF created_by, curriculum_source
ON resources
FOR EACH ROW
EXECUTE FUNCTION set_resource_curriculum_source();

-- ---------------------------------------------------------------------------
-- 2) Phase metadata for curriculum templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curriculum_phase_metadata (
  phase study_phase PRIMARY KEY,
  sort_order INTEGER NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  objective_es TEXT NOT NULL,
  objective_en TEXT NOT NULL,
  outcomes_es TEXT[] NOT NULL DEFAULT '{}',
  outcomes_en TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO curriculum_phase_metadata (
  phase, sort_order, is_primary,
  title_es, title_en,
  objective_es, objective_en,
  outcomes_es, outcomes_en
) VALUES
  ('0', 0, FALSE,
   'Fundamentos Matemáticos', 'Mathematical Foundations',
   'Construir el lenguaje matemático mínimo para entender optimización, probabilidad y aprendizaje profundo.',
   'Build the minimum mathematical language needed to reason about optimization, probability, and deep learning.',
   ARRAY[
     'Aplicar álgebra lineal en representaciones de modelos',
     'Explicar backpropagation desde cálculo multivariable',
     'Usar probabilidad e información para interpretar pérdidas'
   ],
   ARRAY[
     'Apply linear algebra to model representations',
     'Explain backpropagation from multivariable calculus',
     'Use probability and information theory to interpret losses'
   ]),

  ('1', 1, TRUE,
   'Sistemas Distribuidos', 'Distributed Systems',
   'Dominar los principios de confiabilidad, consistencia y coordinación que sostienen sistemas de AI en producción.',
   'Master reliability, consistency, and coordination principles behind production AI systems.',
   ARRAY[
     'Razonar sobre fallos parciales y trade-offs CAP',
     'Diseñar replicación, consenso y recuperación',
     'Analizar latencia de cola y comportamiento bajo carga'
   ],
   ARRAY[
     'Reason about partial failures and CAP trade-offs',
     'Design replication, consensus, and recovery',
     'Analyze tail latency and behavior under load'
   ]),

  ('2', 2, TRUE,
   'ML & Deep Learning', 'ML & Deep Learning Foundations',
   'Pasar de intuición a implementación: entrenar redes pequeñas y entender por qué aprenden.',
   'Move from intuition to implementation: train small networks and understand why they learn.',
   ARRAY[
     'Implementar entrenamiento básico con gradientes',
     'Explicar funciones de activación, normalización y regularización',
     'Relacionar decisiones de arquitectura con generalización'
   ],
   ARRAY[
     'Implement gradient-based training basics',
     'Explain activations, normalization, and regularization',
     'Relate architectural choices to generalization'
   ]),

  ('3', 3, TRUE,
   'Secuencias, Atención & Transformers', 'Sequences, Attention & Transformers',
   'Entender la evolución desde seq2seq hasta transformers y los patrones que explican modelos modernos.',
   'Understand the evolution from seq2seq to transformers and the patterns behind modern models.',
   ARRAY[
     'Comparar límites de RNN/seq2seq con atención',
     'Explicar QKV, positional encoding y arquitectura transformer',
     'Diferenciar modelos encoder-only y decoder-only'
   ],
   ARRAY[
     'Compare RNN/seq2seq limits against attention',
     'Explain QKV, positional encoding, and transformer architecture',
     'Differentiate encoder-only and decoder-only models'
   ]),

  ('4', 4, TRUE,
   'LLMs: Entrenamiento & Alineación', 'LLMs: Training, Alignment & Scaling',
   'Comprender cómo se entrenan y alinean LLMs y qué decisiones impactan costo, seguridad y capacidad.',
   'Understand how LLMs are trained and aligned and which choices impact cost, safety, and capability.',
   ARRAY[
     'Describir pretraining, instruction tuning y alignment',
     'Evaluar impactos de scaling y data mix',
     'Conectar entrenamiento con comportamiento en inferencia'
   ],
   ARRAY[
     'Describe pretraining, instruction tuning, and alignment',
     'Evaluate scaling and data-mix impacts',
     'Connect training choices with inference behavior'
   ]),

  ('5', 5, TRUE,
   'Infraestructura ML', 'ML Infrastructure & Distributed Training',
   'Diseñar infraestructura de entrenamiento y serving con foco en confiabilidad operacional.',
   'Design training and serving infrastructure with operational reliability in mind.',
   ARRAY[
     'Diseñar estrategias de paralelismo y eficiencia',
     'Razonar sobre deuda técnica en sistemas ML',
     'Preparar despliegues reproducibles y observables'
   ],
   ARRAY[
     'Design parallelism and efficiency strategies',
     'Reason about technical debt in ML systems',
     'Prepare reproducible and observable deployments'
   ]),

  ('6', 6, TRUE,
   'Agentes & Razonamiento', 'Agents & Reasoning',
   'Construir agentes robustos con herramientas, memoria y control de errores.',
   'Build robust agents with tools, memory, and error control.',
   ARRAY[
     'Diseñar loops de razonamiento con herramientas',
     'Gestionar memoria y contexto multi-turno',
     'Evaluar confiabilidad y fallback de agentes'
   ],
   ARRAY[
     'Design reasoning loops with tools',
     'Manage multi-turn memory and context',
     'Evaluate agent reliability and fallback strategies'
   ]),

  ('7', 7, TRUE,
   'RAG, Memoria & Contexto', 'RAG, Memory & Context',
   'Implementar sistemas de recuperación y contexto con calidad verificable.',
   'Implement retrieval and context systems with measurable quality.',
   ARRAY[
     'Diseñar chunking, retrieval y re-ranking',
     'Medir calidad factual y cobertura contextual',
     'Integrar memoria externa sin degradar precisión'
   ],
   ARRAY[
     'Design chunking, retrieval, and reranking',
     'Measure factual quality and contextual coverage',
     'Integrate external memory without harming precision'
   ]),

  ('8', 8, TRUE,
   'Seguridad & Guardrails', 'Safety, Guardrails & Eval',
   'Asegurar sistemas LLM contra errores, abuso y salidas no controladas.',
   'Harden LLM systems against errors, abuse, and uncontrolled outputs.',
   ARRAY[
     'Aplicar evaluaciones offline/online con criterios claros',
     'Implementar guardrails y validación estructurada',
     'Mitigar prompt injection y riesgos operacionales'
   ],
   ARRAY[
     'Run offline/online evaluations with clear criteria',
     'Implement guardrails and structured validation',
     'Mitigate prompt injection and operational risks'
   ]),

  ('9', 9, TRUE,
   'Inferencia & Economía', 'Inference & Economics',
   'Optimizar latencia, costo y throughput de sistemas AI en producción.',
   'Optimize latency, cost, and throughput of production AI systems.',
   ARRAY[
     'Aplicar cachés, batching y routing de modelos',
     'Cuantificar costo por token y por workflow',
     'Diseñar estrategias de observabilidad y capacidad'
   ],
   ARRAY[
     'Apply caching, batching, and model routing',
     'Quantify cost per token and per workflow',
     'Design observability and capacity strategies'
   ]),

  ('10', 10, TRUE,
   'Diseño de Sistemas', 'System Design & Integration',
   'Integrar componentes AI en arquitecturas mantenibles y escalables de extremo a extremo.',
   'Integrate AI components into maintainable, scalable end-to-end architectures.',
   ARRAY[
     'Definir arquitectura objetivo con trade-offs explícitos',
     'Orquestar componentes, contratos y límites del sistema',
     'Diseñar operación y evolución del sistema en producción'
   ],
   ARRAY[
     'Define target architecture with explicit trade-offs',
     'Orchestrate components, contracts, and system boundaries',
     'Design production operation and system evolution'
   ]),

  ('11', 11, FALSE,
   'AI para Empresa (Track alternativo)', 'AI for Enterprise (Alternate track)',
   'Aplicar AI Engineering a contexto organizacional: estrategia, gobierno y adopción.',
   'Apply AI Engineering in organizational context: strategy, governance, and adoption.',
   ARRAY[
     'Evaluar oportunidades y ROI por dominio',
     'Definir gobierno y riesgo para despliegues enterprise',
     'Construir plan de adopción transversal'
   ],
   ARRAY[
     'Evaluate opportunities and ROI by domain',
     'Define governance and risk for enterprise rollouts',
     'Build a cross-functional adoption plan'
   ])
ON CONFLICT (phase) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_primary = EXCLUDED.is_primary,
  title_es = EXCLUDED.title_es,
  title_en = EXCLUDED.title_en,
  objective_es = EXCLUDED.objective_es,
  objective_en = EXCLUDED.objective_en,
  outcomes_es = EXCLUDED.outcomes_es,
  outcomes_en = EXCLUDED.outcomes_en,
  updated_at = NOW();

COMMIT;
