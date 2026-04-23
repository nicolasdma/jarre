-- ============================================================================
-- Travel track — Phase 1 (Panorámica Continental) canonical seed
-- ----------------------------------------------------------------------------
-- Replaces the smoke-test placeholder content with the curated Phase 1
-- curriculum from docs/travel-track/phase-1-brief.md.
--
-- Shape of this migration:
--   1. UPDATE the smoke-test concept `travel-geo-sudamerica` with the real
--      canonical definition of C1 (ID and slug are preserved so existing
--      prerequisite references stay valid).
--   2. INSERT concepts C2..C8 (IDs `travel-f1-*`).
--   3. INSERT concept_prerequisites per the DAG declared in the brief.
--   4. DELETE the placeholder resource `travel-smoke-panoramica-intro` and
--      its resource_concepts row.
--   5. INSERT 8 canonical resources (R1..R8) with verified URLs, scoped
--      `curriculum_source='core'`, `created_by=NULL`, `track='travel'`,
--      `phase='1'`. For the three `[revisar]` resources the primary URL from
--      the brief is used; coordinator may refine in a follow-up migration.
--   6. INSERT resource_concepts per the mapping at the bottom of the brief.
--
-- Idempotent: safe to re-run. Concept/resource rows use ON CONFLICT upserts;
-- concept_prerequisites and resource_concepts use ON CONFLICT DO NOTHING.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) C1 — Geografía física sudamericana (upgrade placeholder → canonical)
-- ---------------------------------------------------------------------------
UPDATE concepts
SET
  name = 'Geografía física sudamericana',
  slug = 'geografia-fisica-sudamericana',
  canonical_definition = 'La placa de Nazca subducida bajo la sudamericana explica la cordillera andina, que a su vez estructura cuencas (Amazonas, Orinoco, Paraná-Plata), biomas (selva, puna, pampa, estepa, bosque austral) y régimen climático del continente. Entender esta geometría física es prerrequisito para leer toda decisión colonial y pre-colombina posterior.',
  phase = '1',
  track = 'travel',
  updated_at = NOW()
WHERE id = 'travel-geo-sudamerica';

-- ---------------------------------------------------------------------------
-- 2) C2..C8 — Rest of the Phase 1 concept set
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f1-pueblos-precolombinos',
    'Pueblos pre-colombinos mayores',
    'pueblos-precolombinos-sudamerica',
    'Distribución continental de los pueblos originarios antes de la conquista. Los grandes imperios (Tawantinsuyu, Muisca/Chibcha) en los Andes donde la altitud permitió agricultura intensiva y densidad poblacional; pueblos cazadores-recolectores y agricultores dispersos en Amazonía, pampa, Patagonia y Chaco. Mapuches y Selk''nam como casos extremos de resistencia al imperio inca y al colonialismo europeo respectivamente.',
    '1',
    'travel'
  ),
  (
    'travel-f1-virreinatos',
    'Los tres virreinatos',
    'tres-virreinatos-america-hispana',
    'Organización administrativa española en Sudamérica: (a) Virreinato del Perú (1542) con eje Potosí–Lima–Pacífico–Panamá; (b) Virreinato de Nueva Granada (1717) con eje Cartagena–Magdalena–Bogotá; (c) Virreinato del Río de la Plata (1776) con eje Potosí–Córdoba–Buenos Aires, desgajado del Perú por las reformas borbónicas. La fragmentación del Perú en 3 virreinatos refleja el declive del monopolio de Potosí y el crecimiento del comercio atlántico.',
    '1',
    'travel'
  ),
  (
    'travel-f1-potosi',
    'Potosí: el motor económico',
    'potosi-motor-economia-colonial',
    'El Cerro Rico de Potosí fue la mayor fuente de plata de la historia humana y el motor económico del imperio español durante 3 siglos. Explica por qué Sevilla se enriquece, por qué China acepta plata americana (sistema monetario Ming), por qué hay esclavos africanos en Cartagena, por qué existe Córdoba como escala de la ruta comercial. La mita — trabajo forzado indígena reciclado del sistema inca — es la institución laboral que lo hace posible.',
    '1',
    'travel'
  ),
  (
    'travel-f1-rutas-coloniales',
    'Ejes fluviales y rutas coloniales',
    'rutas-coloniales-magdalena-plata',
    'En un continente sin carreteras, los ríos son la carretera. (a) Magdalena: única vía entre Cartagena/Santa Marta y Bogotá, espina dorsal de Nueva Granada. (b) Camino Real Potosí–Córdoba–Buenos Aires: ruta precolombina reutilizada que conecta el Alto Perú con el Atlántico, con las postas jesuíticas como nodos. (c) Amazonas: tardía para la colonización española, dominada por los portugueses. Cada capital del continente se explica por su relación con uno de estos ejes.',
    '1',
    'travel'
  ),
  (
    'travel-f1-capitales-ubicacion',
    'Por qué las capitales están donde están',
    'ubicacion-capitales-sudamerica',
    'Capítulo de síntesis. Lima: Pizarro + el mar + Callao (conexión Europa). Bogotá: altura defensiva + acceso al Magdalena + asiento de Audiencia en 1550. Quito: altura + ruta inca preexistente. Sucre/La Paz: Potosí. Santiago: valle central protegido por Andes y desierto. Buenos Aires: "puerta trasera" de Potosí, contrabando → virreinato en 1776. Córdoba: escala en el Camino Real + universidad jesuita de 1613. Ninguna capital es accidental.',
    '1',
    'travel'
  ),
  (
    'travel-f1-independencias',
    'Independencias: San Martín y Bolívar',
    'independencias-san-martin-bolivar',
    'Dos movimientos convergentes. San Martín sube por el sur: Mendoza → Cruce de los Andes 1817 → Chile → Lima por mar 1820. Bolívar baja por el norte: Caracas → Bogotá (Boyacá 1819) → Quito (Pichincha 1822) → Perú. Se encuentran en Guayaquil julio 1822: discusión sobre forma de gobierno, San Martín se retira, Bolívar toma el mando. Cierre militar: Junín y Ayacucho 1824. La fragmentación posterior de la Gran Colombia (Venezuela, Colombia, Ecuador independizándose entre 1830-1831) y la separación de Bolivia del Perú muestran que la unidad era solo militar.',
    '1',
    'travel'
  ),
  (
    'travel-f1-divergencia-poscolonial',
    'Divergencia poscolonial',
    'divergencia-poscolonial-sudamerica',
    'Síntesis de la fase. Después de 1825 los países sudamericanos siguen trayectorias divergentes explicables por su estructura colonial previa. Cono Sur (Argentina, Chile, Uruguay): inmigración europea masiva 1870–1930, modernización temprana, identidad "blanca" construida. Andes centrales (Perú, Bolivia, Ecuador): repúblicas con mayoría indígena campesina, oligarquías terratenientes extractivas, modernización tardía. Colombia: guerra bipartidista crónica Liberal/Conservador, narcotráfico y conflicto armado tardío. Chile: Pinochet como primer laboratorio neoliberal del mundo. Las geografías de Fase 1 (Potosí, Magdalena, Plata) predicen estos caminos.',
    '1',
    'travel'
  )
ON CONFLICT (id) DO UPDATE SET
  name                 = EXCLUDED.name,
  slug                 = EXCLUDED.slug,
  canonical_definition = EXCLUDED.canonical_definition,
  phase                = EXCLUDED.phase,
  track                = EXCLUDED.track,
  updated_at           = NOW();

-- ---------------------------------------------------------------------------
-- 3) concept_prerequisites — DAG from the brief
--    C3 ← C1, C2
--    C4 ← C3
--    C5 ← C1, C3
--    C6 ← C3, C4, C5
--    C7 ← C3, C4
--    C8 ← C6, C7
--    (C1, C2 have no prerequisites)
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('travel-f1-virreinatos',              'travel-geo-sudamerica'),
  ('travel-f1-virreinatos',              'travel-f1-pueblos-precolombinos'),
  ('travel-f1-potosi',                   'travel-f1-virreinatos'),
  ('travel-f1-rutas-coloniales',         'travel-geo-sudamerica'),
  ('travel-f1-rutas-coloniales',         'travel-f1-virreinatos'),
  ('travel-f1-capitales-ubicacion',      'travel-f1-virreinatos'),
  ('travel-f1-capitales-ubicacion',      'travel-f1-potosi'),
  ('travel-f1-capitales-ubicacion',      'travel-f1-rutas-coloniales'),
  ('travel-f1-independencias',           'travel-f1-virreinatos'),
  ('travel-f1-independencias',           'travel-f1-potosi'),
  ('travel-f1-divergencia-poscolonial',  'travel-f1-capitales-ubicacion'),
  ('travel-f1-divergencia-poscolonial',  'travel-f1-independencias')
ON CONFLICT (concept_id, prerequisite_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Drop smoke-test resource and its mapping (concept stays, definition replaced above)
-- ---------------------------------------------------------------------------
DELETE FROM resource_concepts
 WHERE resource_id = 'travel-smoke-panoramica-intro';

DELETE FROM resources
 WHERE id = 'travel-smoke-panoramica-intro';

-- ---------------------------------------------------------------------------
-- 5) R1..R8 — Canonical Phase 1 resources
-- ---------------------------------------------------------------------------
INSERT INTO resources (
  id, title, type, url, author, phase, description,
  estimated_hours, sort_order, curriculum_source, is_archived,
  created_by, track
) VALUES
  (
    'travel-r-virreinatos-panorama',
    'Virreinatos de América: La Historia Completa',
    'video',
    'https://www.youtube.com/watch?v=NHPP1EF7eoI',
    'Pero eso es otra Historia',
    '1',
    'Capítulo consolidado de la serie sobre los tres virreinatos hispanoamericanos. Divulgación sólida con fuentes a vista.',
    1.5,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-potosi-documental',
    'Documental histórico sobre Potosí',
    'video',
    'https://www.youtube.com/watch?v=Dumvzm40-kk',
    'Canal Encuentro',
    '1',
    'Documental de Canal Encuentro (Argentina) sobre Potosí como motor del imperio español y la mita como institución laboral.',
    0.5,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-guayaquil',
    'La Entrevista de Guayaquil',
    'video',
    'https://www.youtube.com/watch?v=tyPHu1xzwlk',
    NULL,
    '1',
    'El encuentro de San Martín y Bolívar en Guayaquil (julio 1822) y la bifurcación política del proceso independentista. URL primaria del brief; coordinator puede refinar autoría en follow-up.',
    0.5,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-magdalena-espina-dorsal',
    'El río Magdalena en el siglo XIX: la espina dorsal de Colombia',
    'article',
    'https://enciclopedia.banrepcultural.org/index.php?title=El_r%C3%ADo_Magdalena_en_el_siglo_XIX:_la_%E2%80%9Cespina_dorsal_de_Colombia%E2%80%9D',
    'Banco de la República de Colombia — Enciclopedia Banrepcultural',
    '1',
    'Artículo académico colombiano sobre el río Magdalena como única vía entre Cartagena/Santa Marta y Bogotá durante la Colonia y el siglo XIX.',
    0.5,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-camino-real-potosi',
    'El Camino Real: de Lima a Buenos Aires',
    'article',
    'https://laamericaespanyola.com/2018/06/28/el-camino-real-de-lima-a-buenos-aires/',
    'laamericaespanyola.com',
    '1',
    'Artículo sobre el Camino Real Potosí–Córdoba–Buenos Aires, sus postas jesuíticas y el papel del contrabando del Alto Perú hacia el Atlántico. URL primaria del brief; coordinator puede reemplazar por fuente académica en follow-up.',
    0.5,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-halperin-donghi',
    'Historia Contemporánea de América Latina (caps. Introducción, 1, 3)',
    'book',
    'https://archive.org/details/halperin-donghi-tulio.-historia-contemporanea-de-america-latina-ocr-1998',
    'Tulio Halperín Donghi',
    '1',
    'Libro académico canónico del siglo XIX sudamericano. Capítulos a leer: Introducción + Cap 1 (La crisis de la independencia) + Cap 3 (La larga espera, 1825-1850). ~90 páginas.',
    5.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-formacion-andes',
    '¿Cómo se formaron los Andes?',
    'article',
    'https://www.investigacionyciencia.es/revistas/investigacion-y-ciencia/qu-ocultan-las-estrellas-de-neutrones-765/cmo-se-formaron-los-andes-17429',
    'Investigación y Ciencia',
    '1',
    'Divulgación científica sobre la subducción Nazca-Sudamericana y los parones tectónicos que explican la formación de los Andes.',
    0.5,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-pueblos-originarios-encuentro',
    'Mapuches: Relatos de Yolanda (serie Pueblos Originarios)',
    'video',
    'https://www.youtube.com/watch?v=d93Lj6CEq-E',
    'Canal Encuentro',
    '1',
    'Episodio de la serie Pueblos Originarios de Canal Encuentro centrado en el pueblo mapuche. Cobertura profunda de un pueblo específico; coordinator evalúa sumar un segundo video para panorama continental de C2 en follow-up.',
    0.5,
    8,
    'core',
    FALSE,
    NULL,
    'travel'
  )
ON CONFLICT (id) DO UPDATE SET
  title             = EXCLUDED.title,
  type              = EXCLUDED.type,
  url               = EXCLUDED.url,
  author            = EXCLUDED.author,
  phase             = EXCLUDED.phase,
  description       = EXCLUDED.description,
  estimated_hours   = EXCLUDED.estimated_hours,
  sort_order        = EXCLUDED.sort_order,
  curriculum_source = EXCLUDED.curriculum_source,
  is_archived       = EXCLUDED.is_archived,
  created_by        = EXCLUDED.created_by,
  track             = EXCLUDED.track,
  updated_at        = NOW();

-- ---------------------------------------------------------------------------
-- 6) resource_concepts — all teach-only, no prerequisites
--    (per the mapping table at the end of phase-1-brief.md)
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('travel-r-virreinatos-panorama',           'travel-f1-virreinatos',              FALSE),
  ('travel-r-potosi-documental',              'travel-f1-potosi',                   FALSE),
  ('travel-r-guayaquil',                      'travel-f1-independencias',           FALSE),
  ('travel-r-magdalena-espina-dorsal',        'travel-f1-rutas-coloniales',         FALSE),
  ('travel-r-camino-real-potosi',             'travel-f1-rutas-coloniales',         FALSE),
  ('travel-r-halperin-donghi',                'travel-f1-divergencia-poscolonial',  FALSE),
  ('travel-r-formacion-andes',                'travel-geo-sudamerica',              FALSE),
  ('travel-r-pueblos-originarios-encuentro',  'travel-f1-pueblos-precolombinos',    FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
