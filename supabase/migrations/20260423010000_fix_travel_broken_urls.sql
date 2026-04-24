-- Fix 17 broken URLs (404 / anti-bot) in travel track resources.
-- All replacements verified with HTTP 200 + browser User-Agent before being applied.
-- Idempotent: safe to re-run.

BEGIN;

-- Phase 2
UPDATE resources SET
  url = 'https://www.youtube.com/watch?v=ftFbCwJfs1I',
  author ='Aluna (Alan Ereira, 2012) — canal oficial Tairona Heritage Trust'
WHERE id = 'travel-r-teyuna-sierra-nevada';

UPDATE resources SET
  url = 'https://ich.unesco.org/en/USL/vallenato-traditional-music-of-the-greater-magdalena-region-01095',
  author ='UNESCO — Patrimonio Cultural Inmaterial (Salvaguardia Urgente 2015)'
WHERE id = 'travel-r-vallenato-documental';

UPDATE resources SET
  url = 'https://journals.openedition.org/histcrit/26563?lang=es'
WHERE id = 'travel-r-munera-fronteras-caribe';

UPDATE resources SET
  url = 'https://digital.csic.es/handle/10261/90467',
  author ='Enriqueta Vila Vilar — CSIC / Universidad de Sevilla (2012)'
WHERE id = 'travel-r-cartagena-trata-atlantica';

UPDATE resources SET
  url = 'https://archive.org/details/vivirparacontarl0000garc_h5v1'
WHERE id = 'travel-r-gabo-macondo-caribe';

UPDATE resources SET
  url = 'https://es.mongabay.com/2025/09/darien-tapon-panama-deforestacion-proteccion/'
WHERE id = 'travel-r-darien-migracion';

-- Phase 3
UPDATE resources SET
  url = 'https://www.asla.org/news-insights/dirt/medellin-is-healing-itself-with-social-urbanism',
  author ='American Society of Landscape Architects (ASLA) — urbanismo social post-Escobar'
WHERE id = 'travel-r-escobar-medellin';

UPDATE resources SET
  url = 'https://www.usgs.gov/observatories/hvo/news/volcano-watch-lessons-learned-armero-colombia-tragedy'
WHERE id = 'travel-r-armero-nevado-ruiz';

UPDATE resources SET
  url = 'https://bibliotecadigital.univalle.edu.co/entities/publication/5a980d5d-920b-4e80-b3ef-2d0a6d011a2c'
WHERE id = 'travel-r-cali-salsa-valle';

-- Phase 4
UPDATE resources SET
  url = 'https://babel.banrepcultural.org/digital/collection/p17054coll10/id/2581/'
WHERE id = 'travel-r-safford-palacios-colombia';

UPDATE resources SET
  url = 'https://publicaciones.icanh.gov.co/index.php/picanh/catalog/book/36'
WHERE id = 'travel-r-san-agustin-arqueologia';

UPDATE resources SET
  url = 'https://tierradentro.co/CRIC-40-anos-de-lucha-y-de/',
  type = 'article'
WHERE id = 'travel-r-cric-lucha-indigena';

UPDATE resources SET
  url = 'https://ich.unesco.org/en/RL/carnival-of-negros-and-blancos-00287',
  author ='UNESCO — Patrimonio Cultural Inmaterial (Lista Representativa 2009)'
WHERE id = 'travel-r-carnaval-pasto';

UPDATE resources SET
  url = 'https://urosario.edu.co/en/advances-in-science/economics-and-politics/death-s-trampoline-a-violent-inclusion-path-to-the-state'
WHERE id = 'travel-r-trampolin-muerte-corredor';

UPDATE resources SET
  url = 'https://archive.org/details/rivera-jose-eustasio.-la-voragine-ocr-1985'
WHERE id = 'travel-r-voragine-casement-caucho';

-- Phase 5
UPDATE resources SET
  url = 'https://www.goldmanprize.org/recipient/luis-macas/',
  author ='Goldman Environmental Prize Foundation — biografía Luis Macas (Premio 1994)',
  type = 'article'
WHERE id = 'travel-r-levantamiento-1990-macas';

-- Phase 7
UPDATE resources SET
  url = 'https://www.eltiempo.com/bocas/entrevista-con-el-arqueologo-peruano-walter-alva-sobre-las-tumbas-reales-del-senor-de-sipan-157538',
  author ='Walter Alva (entrevista extensa) — Revista BOCAS / El Tiempo'
WHERE id = 'travel-r-sipan-alva';

COMMIT;
