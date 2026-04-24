-- ============================================================================
-- Seed `aventura` track phase metadata
-- ----------------------------------------------------------------------------
-- V1 seeds only Phase 1 — "Cruzar el Darién en kayak". Subsequent phases
-- (future expeditions: Aconcagua, Patagonia, Caribe en velero, Amazonas en
-- canoa, etc.) are added in follow-up migrations when curated. Objective
-- and outcomes come from docs/aventura-track/phase-1-brief.md.
--
-- Idempotent via ON CONFLICT (track, phase) DO UPDATE.
-- ============================================================================

BEGIN;

INSERT INTO curriculum_phase_metadata (
  track, phase, sort_order, is_primary,
  title_es, title_en,
  objective_es, objective_en,
  outcomes_es, outcomes_en
) VALUES
  ('aventura', '1', 1, TRUE,
   'Cruzar el Darién en kayak', 'Crossing the Darién by kayak',
   'Llegar al borde del Golfo de Urabá con la cabeza armada para tomar la decisión más importante de la travesía: cruzar o no cruzar, y si se cruza, por qué ruta, en qué ventana climática, con qué protocolo de contingencia. No es un curso de remo — es un curso de decisión informada antes de meterse a una zona donde el error no se desanda fácil.',
   'Arrive at the edge of the Gulf of Urabá equipped to make the trip''s most important call: to cross or not, and if crossing, which route, in what weather window, with what contingency protocol. This is not a paddling course — it is a course in informed decision-making before entering a zone where mistakes are hard to undo.',
   ARRAY[
     'Explicar por qué no hay carretera entre Colombia y Panamá (no es solo "selva")',
     'Identificar la ventana realista de mar calmo en el Caribe sur y por qué',
     'Distinguir quién es soberano de qué pedazo de costa (Guna Yala no es Panamá en sentido pleno)',
     'Separar riesgos náuticos de riesgos humanos y definir protocolo de mitigación distinto para cada uno',
     'Prevenir fauna marina peligrosa y enfermedades tropicales del Caribe sur antes de zarpar',
     'Diseñar plan operativo: a quién avisa, con qué equipo, y cuál es el plan B si el plan A se rompe en el día 3'
   ],
   ARRAY[
     'Explain why there is no road between Colombia and Panama (it is not just "jungle")',
     'Identify the realistic calm-sea window in the southern Caribbean and why',
     'Distinguish who is sovereign over which stretch of coast (Guna Yala is not Panama in the full sense)',
     'Separate nautical risks from human risks and define distinct mitigation protocols for each',
     'Prevent dangerous marine fauna and tropical disease exposure in the southern Caribbean before departure',
     'Design the operational plan: who to notify, with what gear, and what Plan B looks like if Plan A breaks on day 3'
   ])
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
