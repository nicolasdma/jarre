-- ============================================================================
-- Seed `travel` track phase metadata (South America motorcycle trip)
-- ----------------------------------------------------------------------------
-- Eleven regions in learning order. Objective / outcomes are placeholders;
-- the coordinator replaces them with curated content in a follow-up migration.
-- ============================================================================

BEGIN;

INSERT INTO curriculum_phase_metadata (
  track, phase, sort_order, is_primary,
  title_es, title_en,
  objective_es, objective_en,
  outcomes_es, outcomes_en
) VALUES
  ('travel', '1',  1,  TRUE,
   'Panorámica Continental', 'Continental Overview',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '2',  2,  TRUE,
   'Colombia Caribe y Darién', 'Colombian Caribbean and Darién',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '3',  3,  TRUE,
   'Colombia Andina Norte', 'Northern Andean Colombia',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '4',  4,  TRUE,
   'Colombia Andina Sur', 'Southern Andean Colombia',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '5',  5,  TRUE,
   'Amazonía Ecuatoriana', 'Ecuadorian Amazon',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '6',  6,  TRUE,
   'Ecuador Andino y Costa', 'Andean and Coastal Ecuador',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '7',  7,  TRUE,
   'Costa Peruana', 'Peruvian Coast',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '8',  8,  TRUE,
   'Cordillera Blanca (Ancash)', 'Cordillera Blanca (Ancash)',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '9',  9,  TRUE,
   'Andes Peruanos Sur (Cusco y Amazonía sur)', 'Southern Peruvian Andes (Cusco and Southern Amazon)',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '10', 10, TRUE,
   'Chile (sur a norte)', 'Chile (South to North)',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator']),

  ('travel', '11', 11, TRUE,
   'Argentina: Cuyo y Patagonia', 'Argentina: Cuyo and Patagonia',
   'TBD - coordinator', 'TBD - coordinator',
   ARRAY['TBD - coordinator'], ARRAY['TBD - coordinator'])
ON CONFLICT (track, phase) DO UPDATE SET
  sort_order   = EXCLUDED.sort_order,
  is_primary   = EXCLUDED.is_primary,
  title_es     = EXCLUDED.title_es,
  title_en     = EXCLUDED.title_en,
  objective_es = EXCLUDED.objective_es,
  objective_en = EXCLUDED.objective_en,
  outcomes_es  = EXCLUDED.outcomes_es,
  outcomes_en  = EXCLUDED.outcomes_en,
  updated_at   = NOW();

COMMIT;
