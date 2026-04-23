-- ============================================================================
-- Travel track — Phase 11 (Argentina: Cuyo y Patagonia) canonical seed
-- Cierre del track: C8 (Buenos Aires y la nación argentina) retoma F1-C8.
-- Source of truth: docs/travel-track/phase-11-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f11-cuyo-vitivinicola',
    'Cuyo colonial y vitivinícola',
    'cuyo-colonial-vitivinicola',
    'Mendoza (1561) y San Juan (1562) fueron fundadas desde Santiago de Chile y pertenecieron a la Capitanía General de Chile hasta 1776 — Cuyo es, históricamente, una región trasandina. La agricultura de oasis fue posible por la adaptación del sistema de acequias de origen andalusí-morisco al deshielo cordillerano (Río Mendoza, Río San Juan), tecnología que estructuró cinco siglos de ocupación territorial (Ponte, INCIHUSA-CONICET). La industria vinícola moderna se monta en la segunda mitad del XIX con inmigración italiana, francesa y española, consolidándose con el ferrocarril a Buenos Aires en 1885 y la reconversión técnica liderada por Tiburcio Benegas y Emilio Civit.',
    '11',
    'travel'
  ),
  (
    'travel-f11-cruce-andes',
    'Cruce de los Andes y Campaña Libertadora de San Martín (1817)',
    'cruce-andes-san-martin-1817',
    'Entre enero y febrero de 1817, José de San Martín cruzó la cordillera con ~5.000 hombres, 10.000 mulas y artillería desmontada por seis pasos simultáneos (Los Patos y Uspallata como principales, más cuatro columnas secundarias de distracción), en una operación logística de 21 días sin precedente sudamericano. El plan — diseñado desde la gobernación mendocina — buscaba liberar Chile como plataforma para atacar Lima por mar y descabezar el virreinato del Perú, estrategia complementaria al avance de Bolívar por el norte. Victoria de Chacabuco (12-feb-1817) y consolidación en Maipú (5-abr-1818). Mendoza es así el punto logístico donde se hizo operativa la independencia sudamericana del Cono Sur.',
    '11',
    'travel'
  ),
  (
    'travel-f11-conquista-desierto',
    'Conquista del Desierto (1878-1885)',
    'conquista-del-desierto',
    'Entre 1878 y 1885, bajo Julio A. Roca como ministro de Guerra y luego presidente, el Ejército Argentino ejecutó la ocupación militar de la Pampa y la Patagonia, territorios hasta entonces controlados por confederaciones mapuche-tehuelche (Calfucurá, Namuncurá, Sayhueque). La operación — concurrente con la "Pacificación de la Araucanía" chilena y coordinada con ella — incorporó al Estado argentino ~550.000 km² mediante una combinación de campañas militares, zanja de Alsina, deportación de poblaciones originarias a ingenios tucumanos y misiones salesianas, y venta de tierras a sociedades especuladoras. Es el trauma fundante del Estado argentino moderno y la condición material del modelo agroexportador 1880-1930. El debate historiográfico (genocidio vs. "campaña"; Lenton, Delrio, Walther, Hilda Sábato) es parte del concepto.',
    '11',
    'travel'
  ),
  (
    'travel-f11-patagonia-rebelde',
    'Patagonia rebelde (huelgas 1920-1921)',
    'patagonia-rebelde-huelgas-1920',
    'Entre 1920 y 1922, peones rurales anarquistas y socialistas — migrantes europeos que traían el repertorio combativo de la Semana Trágica porteña de 1919 — protagonizaron huelgas en las estancias laneras de Santa Cruz (Río Gallegos, San Julián, El Calafate) contra condiciones laborales serviles. El gobierno de Hipólito Yrigoyen envió al Regimiento 10 de Caballería al mando del teniente coronel Héctor Benigno Varela, que fusiló sin juicio a ~1.500 trabajadores y arrojó los cuerpos a zanjas colectivas. El caso fue reconstruido por Osvaldo Bayer en "La Patagonia rebelde / Los vengadores de la Patagonia trágica" (4 tomos, 1972-78), obra fundacional de la historia argentina desde abajo. La película homónima de Héctor Olivera (1974) fue prohibida por Isabel Perón y la dictadura de Videla.',
    '11',
    'travel'
  ),
  (
    'travel-f11-ypf-petroleo',
    'Petróleo, Comodoro Rivadavia e YPF',
    'ypf-petroleo-argentino',
    'El 13 de diciembre de 1907, una perforación que buscaba agua en Comodoro Rivadavia encontró petróleo a 539 m. Yrigoyen y el general Enrique Mosconi crearon YPF en junio de 1922 — primera petrolera estatal integral del mundo, anterior a la Total francesa — como instrumento de soberanía energética. YPF es símbolo del nacionalismo económico argentino del siglo XX (integración vertical completa: pozo, refinería, surtidor). Su privatización bajo Menem en 1992 y la renacionalización parcial bajo Cristina Fernández en 2012 (recuperación del 51% a Repsol) son hitos ideológicos nacionales. La formación no convencional Vaca Muerta (Neuquén, identificada en 2010, producción significativa desde 2013) reabre la discusión entre modelo extractivo, conflicto con comunidades mapuche y soberanía energética en el siglo XXI.',
    '11',
    'travel'
  ),
  (
    'travel-f11-ushuaia-fuego',
    'Ushuaia, Tierra del Fuego y la frontera austral',
    'ushuaia-tierra-del-fuego',
    'Ushuaia nace como misión anglicana (Thomas Bridges, padre de Lucas, 1869) y se convierte en presidio nacional en 1902, estrategia de poblamiento argentino del confín sur por deportación penal (modelo australiano/siberiano). Tierra del Fuego es el territorio donde se consuma el genocidio selk''nam en paralelo con la explotación del oro de Bahía San Sebastián (1880s) y la ganadería ovina. El siglo XX agrega tres capas: el conflicto del Beagle con Chile (1978, Argentina movilizó para invadir; mediación de Juan Pablo II vía cardenal Antonio Samoré salvó la guerra), la guerra de Malvinas (abril-junio 1982) donde Tierra del Fuego fue base logística (Río Grande), y la pretensión antártica argentina con Base Marambio (1969) como proyecto geopolítico. Ushuaia condensa "fin del mundo" como categoría identitaria nacional argentina.',
    '11',
    'travel'
  ),
  (
    'travel-f11-cordoba-docta',
    'Córdoba: la docta, los jesuitas, el Cordobazo',
    'cordoba-docta-jesuitas-cordobazo',
    'Córdoba fue fundada en 1573 en el Camino Real Potosí-Buenos Aires y los jesuitas instalaron en 1613 el Colegio Máximo — origen de la Universidad Nacional de Córdoba, cuarta más antigua de América. El sistema de seis estancias jesuíticas (Caroya, Jesús María, Santa Catalina, Alta Gracia, La Candelaria, San Ignacio) financiaba la educación y constituye el primer complejo agroindustrial integrado del territorio argentino (Patrimonio UNESCO 2000). La identidad "docta" cordobesa se reafirma con la Reforma Universitaria de 1918 (manifiesto liminar de Deodoro Roca), hito continental. El 29 de mayo de 1969, el Cordobazo — alianza obrero-estudiantil liderada por Agustín Tosco (Luz y Fuerza) y Elpidio Torres (SMATA) contra la dictadura de Onganía — abre el ciclo de radicalización política de los 70. Córdoba ha sido además desde los 50 el polo industrial automotriz argentino (IKA, Fiat, Renault).',
    '11',
    'travel'
  ),
  (
    'travel-f11-buenos-aires-nacion',
    'Buenos Aires y la nación argentina (cierre del track)',
    'buenos-aires-nacion-argentina',
    'Concepto de cierre del track. Buenos Aires pasó de ser puerta trasera de Potosí a cabecera del Virreinato del Río de la Plata (1776) a capital de la nación (1880 tras la federalización forzada). La inmigración europea masiva 1870-1930 (6 millones sobre una población de 4 millones; pico 1914: 30% de los habitantes eran extranjeros) creó una estructura social singular en América Latina: amplia clase media urbana con identidad propia (Adamovsky, Historia de la clase media argentina, 2009), tango como síntesis cultural negra-criolla-italiana, peronismo 1945-55 como fractura entre el "pueblo trabajador" y la clase media antiperonista, inestabilidad institucional crónica (seis golpes 1930-76), y dictadura 1976-1983 como aplicación sistemática del terrorismo de Estado (30.000 desaparecidos, ESMA, vuelos de la muerte) documentada por CONADEP en Nunca Más (1984, primera comisión de la verdad del mundo). El concepto cierra el track retomando F1-C8: la divergencia poscolonial argentina explicada no como destino sino como resultado de decisiones históricas reconstruibles.',
    '11',
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
-- 2) concept_prerequisites — DAG (per brief)
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('travel-f11-cuyo-vitivinicola',       'travel-f1-virreinatos'),
  ('travel-f11-cuyo-vitivinicola',       'travel-f10-chiloe'),
  ('travel-f11-cruce-andes',             'travel-f11-cuyo-vitivinicola'),
  ('travel-f11-cruce-andes',             'travel-f1-independencias'),
  ('travel-f11-conquista-desierto',      'travel-f1-divergencia-poscolonial'),
  ('travel-f11-conquista-desierto',      'travel-f10-mapuche-araucania'),
  ('travel-f11-patagonia-rebelde',       'travel-f11-conquista-desierto'),
  ('travel-f11-patagonia-rebelde',       'travel-f10-patagonia-lanera'),
  ('travel-f11-ypf-petroleo',            'travel-f11-conquista-desierto'),
  ('travel-f11-ypf-petroleo',            'travel-f1-divergencia-poscolonial'),
  ('travel-f11-ushuaia-fuego',           'travel-f10-patagonia-canoeros'),
  ('travel-f11-ushuaia-fuego',           'travel-f11-conquista-desierto'),
  ('travel-f11-cordoba-docta',           'travel-f1-rutas-coloniales'),
  ('travel-f11-cordoba-docta',           'travel-f1-capitales-ubicacion'),
  ('travel-f11-buenos-aires-nacion',     'travel-f11-conquista-desierto'),
  ('travel-f11-buenos-aires-nacion',     'travel-f11-patagonia-rebelde'),
  ('travel-f11-buenos-aires-nacion',     'travel-f11-ypf-petroleo'),
  ('travel-f11-buenos-aires-nacion',     'travel-f11-cordoba-docta'),
  ('travel-f11-buenos-aires-nacion',     'travel-f1-capitales-ubicacion'),
  ('travel-f11-buenos-aires-nacion',     'travel-f1-divergencia-poscolonial')
ON CONFLICT (concept_id, prerequisite_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Resources R1..R8
-- ---------------------------------------------------------------------------
INSERT INTO resources (
  id, title, type, url, author, phase, description,
  estimated_hours, sort_order, curriculum_source, is_archived,
  created_by, track
) VALUES
  (
    'travel-r-acequias-mendoza',
    'De los caciques del agua a la Mendoza de las acequias',
    'article',
    'https://www.scielo.org.ar/scielo.php?pid=S0524-97672007000100006&script=sci_arttext',
    'Ricardo Ponte — INCIHUSA-CONICET — UNCuyo',
    '11',
    'Paper de referencia sobre cinco siglos de manejo hidráulico en Mendoza. Conecta tecnología andalusí-morisca con oasis irrigados y estructura urbana colonial. Fuente primaria para entender por qué Mendoza-ciudad está donde está.',
    1.5,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cruce-andes-pigna',
    'San Martín y el cruce de los Andes',
    'video',
    'https://www.youtube.com/watch?v=UJO8g_mKL6c',
    'Felipe Pigna',
    '11',
    'Divulgación académica seria sobre la operación logística del cruce de los Andes (1817). Video consolidado de Pigna, referente argentino del género; el complemento de 2025 entra en detalle logístico.',
    1.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-patagonia-rebelde',
    'La Patagonia rebelde (playlist Canal Encuentro)',
    'video',
    'https://www.youtube.com/playlist?list=PLZ6TIj4tHEIuBMYwbd5F0cKhBkK1zY2EY',
    'Canal Encuentro (basada en Bayer) + opcional película de Héctor Olivera (1974)',
    '11',
    'Serie Canal Encuentro de ~4h basada en la obra de Osvaldo Bayer. Complementar con la película de Héctor Olivera (1974, Oso de Plata Berlín) disponible en archive.org: https://archive.org/details/la-patagonia-rebelde-1974. La película fue prohibida por Isabel Perón y la dictadura.',
    4.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-bayer-patagonia-rebelde',
    'La Patagonia rebelde (caps. selección)',
    'book',
    'https://archive.org/details/LaPatagoniaRebeldeOsvaldoBayer',
    'Osvaldo Bayer',
    '11',
    'Canon absoluto de la historia argentina desde abajo. Bayer investigó 10 años archivos militares, testimonios orales y prensa obrera. Síntesis en un tomo de "Los vengadores de la Patagonia trágica" (4 tomos originales 1972-78). Lectura: Introducción + primera huelga + represión Varela + epílogo (~200 pp).',
    8.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-ypf-pigna',
    'El descubrimiento de petróleo en Comodoro Rivadavia',
    'article',
    'https://elhistoriador.com.ar/el-descubrimiento-de-petroleo-en-comodoro-rivadavia-por-felipe-pigna/',
    'Felipe Pigna — El Historiador',
    '11',
    'Introducción accesible al hallazgo del petróleo en Comodoro Rivadavia (13 dic 1907) y la creación de YPF (1922). Complementar con paper SciELO sobre el petróleo argentino en las primeras décadas del siglo XX y con informe Gestar para la secuencia privatización-renacionalización-Vaca Muerta.',
    1.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cordobazo-encuentro',
    'El Cordobazo — serie "En la calle, la historia" (Canal Encuentro)',
    'video',
    'https://www.youtube.com/watch?v=8VDkQTFR-iU',
    'Canal Encuentro (Argentina)',
    '11',
    'Canal Encuentro es gold standard argentino de divulgación estatal educativa. Documental paralelo opcional sobre Agustín Tosco personaliza la alianza obrero-estudiantil del 29 de mayo 1969.',
    0.5,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-adamovsky-clase-media',
    'Historia de la clase media argentina',
    'book',
    'https://journals.openedition.org/cal/736?lang=es',
    'Ezequiel Adamovsky',
    '11',
    'Libro contemporáneo canónico (Planeta, 2009; Premio Nacional) que reconfigura la historiografía argentina tradicional. Adamovsky argumenta que la "clase media argentina" es una construcción ideológica de 1919 en adelante, no una categoría sociológica neutra. URL apunta a reseña académica OpenEdition; si hay PDF abierto del libro, usar esa URL en follow-up.',
    10.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-nunca-mas-conadep',
    'Nunca Más — Informe CONADEP (prólogo + caps. seleccionados)',
    'book',
    'https://www.cultura.gob.ar/media/uploads/lc_nuncamas_digital1.pdf',
    'Comisión Nacional sobre la Desaparición de Personas (CONADEP) — Prólogo de Ernesto Sabato',
    '11',
    'Primera comisión de la verdad del mundo (1983-84), modelo posterior para Sudáfrica, Chile, Perú. Lectura: Prólogo de Sabato + Cap I (la acción represiva) + Cap II (víctimas) + capítulo ESMA + conclusiones (~250 pp seleccionadas). Inseparable del cierre del track: el viaje termina en Buenos Aires donde el Nunca Más se escribe.',
    12.0,
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
-- 4) resource_concepts — teach-only
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('travel-r-acequias-mendoza',           'travel-f11-cuyo-vitivinicola',      FALSE),
  ('travel-r-cruce-andes-pigna',          'travel-f11-cruce-andes',            FALSE),
  ('travel-r-patagonia-rebelde',          'travel-f11-patagonia-rebelde',      FALSE),
  ('travel-r-bayer-patagonia-rebelde',    'travel-f11-patagonia-rebelde',      FALSE),
  ('travel-r-ypf-pigna',                  'travel-f11-ypf-petroleo',           FALSE),
  ('travel-r-cordobazo-encuentro',        'travel-f11-cordoba-docta',          FALSE),
  ('travel-r-adamovsky-clase-media',      'travel-f11-buenos-aires-nacion',    FALSE),
  ('travel-r-nunca-mas-conadep',          'travel-f11-buenos-aires-nacion',    FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
