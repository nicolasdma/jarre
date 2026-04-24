-- ============================================================================
-- Aventura track — Phase 1 (Cruzar el Darién en kayak) canonical seed
-- ----------------------------------------------------------------------------
-- Replaces the smoke-test placeholder with the curated Phase 1 curriculum
-- from docs/aventura-track/phase-1-brief.md (version 2026-04-23).
--
-- Shape of this migration (differs from travel F1):
--   1. DELETE the smoke concept `aventura-smoke-darien-intro`, the smoke
--      resource `aventura-smoke-darien-wiki`, and their resource_concepts
--      link. Unlike travel F1 (which UPDATE-d its smoke concept in place),
--      here we DELETE+INSERT because the `aventura-smoke-*` prefix must
--      not leak into production URLs, logs, backups, or the review deck.
--      Final concept IDs are `aventura-f1-*`.
--   2. INSERT 9 curated concepts with 4-6 sentence canonical definitions
--      refined from the 51 verified sources.
--   3. INSERT 17 concept_prerequisites per the DAG in the brief.
--   4. INSERT 51 curated resources (aventura-r-*), all verified via
--      WebFetch by 9 parallel research agents, with track='aventura',
--      phase='1', curriculum_source='core', created_by=NULL.
--   5. INSERT 143 resource_concepts (51 teach + 92 reinforce) per the
--      mapping table in the brief. All is_prerequisite=FALSE, same
--      pattern as travel F1. The 92 "reinforce" rows survived the FSRS
--      audit documented in PROGRESS.md (113 proposed -> 21 cut on the
--      "does studying this resource genuinely anchor concept X" criterion).
--
-- Idempotent: concept/resource rows use ON CONFLICT upserts;
-- concept_prerequisites uses ON CONFLICT DO NOTHING; resource_concepts
-- uses ON CONFLICT DO UPDATE (same as travel F1).
--
-- Chronological note: applied AFTER 20260423010000_fix_travel_broken_urls
-- (concurrent agent's travel-only fix, no scope overlap).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Remove smoke-test artifacts
-- ---------------------------------------------------------------------------
DELETE FROM resource_concepts
  WHERE resource_id = 'aventura-smoke-darien-wiki'
     OR concept_id  = 'aventura-smoke-darien-intro';

DELETE FROM resources
  WHERE id = 'aventura-smoke-darien-wiki';

DELETE FROM concepts
  WHERE id = 'aventura-smoke-darien-intro';

-- ---------------------------------------------------------------------------
-- 2) Insert 9 curated concepts (aventura-f1-*)
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'aventura-f1-oceanografia-caribe-sur',
    'Geografía y oceanografía del Golfo de Urabá y Caribe sur',
    'oceanografia-golfo-uraba-caribe-sur',
    'El Golfo de Urabá (~1.800 km², profundidad media ~40 m) es un estuario tropical donde el río Atrato descarga al Caribe sur generando plumas de agua dulce y sedimentos que afectan visibilidad y olas en la boca, con zonas de hipoxia estacional documentadas. La circulación superficial está dominada por el Giro Panamá-Colombia (Panama-Colombia Gyre, PCG), cuya intensidad es modulada hasta un factor ~2 por remolinos de la Corriente del Caribe en ciclos de ~116 días — variabilidad que determina la ventana real de cruce más que el calendario nominal. Los vientos alisios del noreste dominan de diciembre a abril (mar relativamente calmo, ventana operativa) y la temporada de lluvias (mayo-noviembre) trae marejadas y sistemas tropicales eventuales. Las mareas son semidiurnas de bajo rango (~50 cm), pero el viento regional y la descarga del Atrato producen corrientes costeras locales que no siguen la marea. Entender esta geometría no es opcional: es el prerrequisito físico de toda decisión de ruta, horario de salida y criterio de aborto.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-tapon-darien',
    'El Tapón del Darién: por qué no hay carretera',
    'tapon-darien-sin-carretera',
    'El Tapón del Darién es la única discontinuidad de la Carretera Panamericana entre Alaska y Tierra del Fuego: ~100 km de selva, pantano y montaña entre Yaviza (Panamá) y Turbo (Colombia). Su ausencia no es falla de ingeniería sino resultado de una decisión política sostenida desde los 70s y consolidada por la demanda del Sierra Club (1975), con la injunction del Department of Transportation levantada recién en 1992: convergieron la barrera fitosanitaria contra la fiebre aftosa que protege la ganadería norteamericana y contra el screwworm, la presión ambiental por una de las áreas con mayor stock de carbono y segunda mayor riqueza arbórea del neotrópico, y el veto sostenido de los pueblos Emberá, Wounaan y Guna. El resultado es una doble paradoja: Parque Nacional Darién figura como Patrimonio Mundial UNESCO pero con rating de Significant Concern (IUCN 2025), y simultáneamente es el corredor de migración irregular más peligroso del hemisferio. Los datos recientes confirman que el equilibrio es inestable: pérdida 2002-2023 de ~21.500 ha de bosque primario, 300.000 t de residuos acumulados por la crisis migratoria, e inversión anunciada de US$ 70M en un puente sobre Tuira/Chucunaque que reabriría la frontera agrícola. La ruta marítima por el Caribe sur existe justamente porque la terrestre fue vetada políticamente, no técnicamente.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-guna-yala',
    'Guna Yala: soberanía indígena, navegación tradicional y protocolo de cruce',
    'guna-yala-soberania-navegacion',
    'Guna Yala (antes San Blas) es una comarca indígena autónoma panameña de 51 comunidades distribuidas en ~365 islas del Caribe, gobernada por el Congreso General Guna desde la Revolución Dule de 1925 y formalizada por Ley 16 de 1953. La estructura política es dual: Congreso General Guna (político-administrativo, sesiones ordinarias en mayo y octubre) y Congreso General de la Cultura (espiritual), con autoridades tradicionales (Sagla local, argarmar, Sagladummagan como autoridad máxima) cuyas decisiones vinculan a extranjeros dentro de la comarca. El Reglamento de Turismo vigente (2017) exige autorización escrita del Congreso para embarcaciones de recreo, tarifas concretas (~US$ 10 anclaje + US$ 2/persona + US$ 10 comunidad), estadía máxima de 30 días y coordinación previa con la Dirección Nacional de Migración y la Autoridad Marítima panameña. Los Guna tienen siglos de navegación en cayucos a vela y conocen las corrientes del Caribe sur con precisión empírica, pero también pueden negar el paso legítimamente — cruzar sin permiso no es desliz burocrático sino violación de soberanía reconocida. Cualquier ruta viable desde Capurganá/Sapzurro hacia Puerto Obaldía atraviesa esta comarca.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-embera-wounaan',
    'Emberá y Wounaan en el Darién panameño: territorio, contacto y reciprocidad',
    'embera-wounaan-darien',
    'Los pueblos Emberá y Wounaan son originarios del Darién continental, organizados en Comarcas Emberá-Wounaan (Cémaco y Sambú, Ley 22 de 1983) en el interior, y en Tierras Colectivas reguladas por Ley 72 de 2008 en las comunidades costeras — exactamente las que puede tocar una travesía en kayak en bocas de río del Darién panameño. Su movilidad histórica es fluvial y marítima, no terrestre: la construcción naval de la jãba (piragua) en ecosistemas fluviales y de cabotaje costero es pieza central de la cultura, documentada en etnografía contemporánea con coautoría wounaan y emberá. El contacto en una travesía costera es lateral pero real: intercambio de información sobre clima y rutas, posible apoyo en emergencia, y obligación de protocolo — pedir permiso antes de entrar a comunidad, no fotografiar sin consentimiento, no introducir bienes que distorsionen la economía local. La ética del contacto se juega entre dos polos a evitar: la romantización (descubrí algo prístino) y el cinismo (ya están todos corrompidos); la posición correcta es reciprocidad informada, reconociendo que estas comunidades defienden activamente 650.000 ha con drones, GPS y asesoría legal, y son víctimas del tráfico ilícito que cruza sus tierras, no cómplices. Su frontera no coincide con la frontera estatal.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-migracion-clan-golfo',
    'Migración irregular y crimen organizado: por qué el Darién es noticia desde 2021',
    'migracion-irregular-clan-golfo',
    'Desde 2021 el Darién pasó de ruta marginal a corredor masivo: 250.000+ cruces en 2022, 520.000+ en 2023, principalmente venezolanos, ecuatorianos, haitianos, africanos y asiáticos rumbo a EE.UU., con caída documentada del ~94% en 2025 tras el cierre anunciado por Mulino y el bloqueo impuesto por el Congreso General Guna al tránsito por Guna Yala. La ruta terrestre clásica es Necoclí -> lancha a Capurganá/Acandí -> trochas controladas por el Clan del Golfo (cobro de ~US$ 125/persona, impuesto del 20% a lancheros) -> emergencia en Bajo Chiquito -> SENAFRONT -> Lajas Blancas -> bus a Costa Rica. Para un cruce en kayak por la costa Caribe, la implicancia no es teórica: el Clan del Golfo regula el acceso desde el continente colombiano a Capurganá/Sapzurro, cobra en playas de embarque, y el tramo entre Acandí y Puerto Obaldía es activo para tráfico humano y narco. En 2025 se documentaron rutas marítimas alternativas de retorno por la misma franja (Miramar/Colón -> Guna Yala -> Puerto Obaldía, 7-9 h) con naufragios y fallas de motor — evidencia de que estas aguas matan a embarcaciones motorizadas con tripulación profesional, lo que eleva cualitativamente el riesgo para un kayakista solo. En este tramo el riesgo no náutico domina al náutico.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-travesias-historicas',
    'Travesías históricas y modernas: del Vasco Núñez al kayak de mar contemporáneo',
    'travesias-historicas-darien-kayak',
    'El Darién fue cruzado de Atlántico a Pacífico por Vasco Núñez de Balboa en 1513 — guiado por caciques locales, 25 días para 60 km lineales, según la crónica coetánea de Bartolomé de las Casas (Historia de las Indias, Tomo IV). Lionel Wafer, cirujano bucanero abandonado en el istmo en 1681, produjo el primer relato etnográfico europeo detallado de los Cuna/Kuna tras vivir entre ellos, complementando las crónicas cortesanas con observación directa del clima, los ríos y la cultura. En el siglo XX las expediciones Land Rover (1960) y Range Rover (1972, dirigida por el Col. John Blashford-Snell: 59 británicos + 70 militares panameños y colombianos, 100 días) demostraron que la ruta terrestre exige un ejército, haciéndola inviable para el individuo. En el siglo XXI la ruta marítima quedó documentada en travesías verificables: Freya Hoffmeister pasó por Guna Yala/San Blas en 2013 durante su circunnavegación solo de Sudamérica en kayak (15.300 km, con escolta naval colombiana en tramos de riesgo criminal), y Keifer Edelmayer completó Gatún -> Capurganá en 21 días en octubre de 2023 con documentación operativa detallada del caso base. La lección de 500 años es consistente: el éxito no es del más fuerte sino de quien pidió guía local y respetó la ventana climática.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-logistica-operativa',
    'Logística operativa: kayak, autonomía, comunicaciones, permisos',
    'logistica-kayak-darien',
    'Una travesía realista por la costa Caribe del Darién (~150 km lineales Capurganá -> Puerto Obaldía con paradas en Guna Yala) exige kayak de mar de 16-18 ft con bulkheads y skirt — NDK Explorer, P&H Scorpio MK II o Current Designs Karla son estándar de la categoría, todos ~US$ 4.500+, con spec de expediciones en aguas remotas. La autonomía requerida es agua para 3 días entre cachés, comida liofilizada para 7-10 días, comunicación satelital obligatoria (Garmin InReach Mini 2 o ZOLEO: no hay cobertura celular en franjas largas después de San Blas), bombeo de achique manual de respaldo, signal mirror, bengalas o pistola de señales calibre 10 (resistente a humedad), PLB independiente del InReach, y botiquín para fauna marina e infección de heridas tropicales. Los permisos son tres en orden: reporte de salida vía Check-Mig pre-registro + trámite en persona en Migración Colombia Capurganá; autorización escrita del Congreso General Guna para ingresar a la comarca con sus tasas; ingreso formal a Panamá por puesto marítimo en Puerto Obaldía cumpliendo los requisitos del SNM (pasaporte >=3 meses, solvencia de B/. 500, Tarjeta E/S que se resuelve en persona porque no hay carrier que la emita para un kayakista autopropulsado). Algunos seguros (Global Rescue, IMG Patriot Platinum) cubren evacuación marítima con activación vía SOS de InReach, pero el alcance real varía por póliza y hay que verificarlo caso por caso antes de zarpar — el seguro estándar de viaje no cubre. Las competencias mínimas del líder de la travesía están formalizadas en el ACA Level 3 Coastal Kayaking Trip Leader (programa que cierra el 31-dic-2026 en la transición al nuevo Leader Pathway).',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-fauna-salud-tropical',
    'Fauna marina peligrosa y salud tropical en el Caribe sur',
    'fauna-salud-tropical-caribe-sur',
    'Concepto de prevención antes de zarpar, no de respuesta médica reactiva — en una travesía corta el peso y el tiempo no están para improvisar medicina. La fauna de riesgo se estratifica: (a) cocodrilo americano (Crocodylus acutus) en bocas del Atrato, esteros y manglares, activo al amanecer y atardecer; (b) medusas y cubomedusas — especialmente carabela portuguesa (Physalia physalis) en aguas abiertas, cuyo protocolo correcto es inmersión en agua caliente 40-45°C por 20-45 min (el vinagre al 5% favorece la descarga de nematocistos y está desaconsejado para esta especie según la Wilderness & Environmental Medicine); (c) insectos vectores: Aedes aegypti con dengue/zika/chikungunya/Oropouche (brote activo en Darién con 265+ casos confirmados en 2025), y flebotominos Lutzomyia trapidoi como vector principal de Leishmania panamensis con tasa de infección del 9-12% y picos en estación lluviosa, endémicos en toda la franja costera. La quimioprofilaxis antimalárica es recomendada por CDC Yellow Book 2024 para Darién, comarcas Emberá-Wounaan y Guna Yala (no para el área estricta del Canal), y la vacuna de fiebre amarilla es obligatoria por normativa panameña y urgente dado el brote colombiano 2025 con 53 casos confirmados y 21 muertes documentados por PAHO fuera de la cuenca amazónica. La prevención operativa es DEET o picaridina + ropa tratada con permetrina + evitar campamentos cerca de palmares al atardecer + fotoprotección extrema (espejo de mar, dorso de manos y cuello) + hidratación electrolítica de 1,5-2 L/h remando al mediodía + higiene rigurosa de heridas (cualquier corte en agua salada tropical se infecta rápido). Para granularidad epidemiológica municipal (Acandí, Unguía, Juradó, Bajo Baudó) el insumo vivo es el Boletín Epidemiológico Semanal del INS Colombia, a consultar dentro de los 60 días previos al viaje.',
    '1',
    'aventura'
  ),
  (
    'aventura-f1-riesgo-rescate',
    'Riesgo, decisión y rescate: el plan B realista',
    'riesgo-rescate-darien',
    'Síntesis operativa de la fase. Tres categorías de riesgo, tres protocolos distintos: (a) náutico — vuelco, hipotermia leve, marejada inesperada, falla de equipo: self-rescue + roll + comunicación inmediata por InReach; el SOS no llama directo a un helicóptero sino a un coordinador en Texas (Garmin Response, ex-GEOS IERCC integrado en 2021) que negocia con SENAN Panamá o DIMAR Colombia según GPS, con tiempos de rescate aéreo documentados en Caribe sur de 6-24 h. (b) médico — corte profundo, deshidratación, picadura grave, fractura: estabilizar y activar PLB independiente; el punto de extracción más cercano y la cobertura real del seguro de evacuación definen decisión. (c) humano — el State Department clasifica Darién y Mosquito Coast como Nivel 4 do-not-travel, mientras Guna Yala queda fuera del Nivel 4; el protocolo ante encuentro hostil con armados es no resistir, no negociar, ceder bienes — este riesgo no se mitiga con habilidad de remar sino con ruta y horarios decididos en tierra antes de zarpar. La decisión clave del cruce: abortar es siempre una opción válida, y debe estar pre-comprometida por escrito antes de zarpar con criterios objetivos (ventana climática se cierra, equipo crítico falla, encuentro humano hostil, lesión que comprometa remo). La literatura de expedición es convergente: Gonzales documenta el plan-continuation bias como causa principal de fatalidades en paddlers competentes, Will Gadd insiste en que la calidad de una decisión se juzga por el proceso, no por el resultado, y los AAR canónicos de Sea Kayaker (Broze/Gronseth) muestran que los sobrevivientes de accidentes mayores abortaron a tiempo. El caso base operativo verificable de esta ruta es Edelmayer 2023: 21 días Gatún -> Capurganá siguiendo todos estos protocolos en orden; su trip report es la lectura obligatoria antes de cualquier intento propio.',
    '1',
    'aventura'
  )
ON CONFLICT (id) DO UPDATE SET
  name                 = EXCLUDED.name,
  slug                 = EXCLUDED.slug,
  canonical_definition = EXCLUDED.canonical_definition,
  phase                = EXCLUDED.phase,
  track                = EXCLUDED.track,
  updated_at           = NOW();

-- ---------------------------------------------------------------------------
-- 3) concept_prerequisites — DAG per the brief
--    C1 is foundational; C2<-C1; C3<-C1,C2; C4<-C2; C5<-C2;
--    C6<-C1,C2,C3; C7<-C1,C3,C5; C8<-C1,C7; C9<-C5,C6,C7,C8
--    Total: 17 edges.
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('aventura-f1-tapon-darien',          'aventura-f1-oceanografia-caribe-sur'),
  ('aventura-f1-guna-yala',             'aventura-f1-oceanografia-caribe-sur'),
  ('aventura-f1-guna-yala',             'aventura-f1-tapon-darien'),
  ('aventura-f1-embera-wounaan',        'aventura-f1-tapon-darien'),
  ('aventura-f1-migracion-clan-golfo',  'aventura-f1-tapon-darien'),
  ('aventura-f1-travesias-historicas',  'aventura-f1-oceanografia-caribe-sur'),
  ('aventura-f1-travesias-historicas',  'aventura-f1-tapon-darien'),
  ('aventura-f1-travesias-historicas',  'aventura-f1-guna-yala'),
  ('aventura-f1-logistica-operativa',   'aventura-f1-oceanografia-caribe-sur'),
  ('aventura-f1-logistica-operativa',   'aventura-f1-guna-yala'),
  ('aventura-f1-logistica-operativa',   'aventura-f1-migracion-clan-golfo'),
  ('aventura-f1-fauna-salud-tropical',  'aventura-f1-oceanografia-caribe-sur'),
  ('aventura-f1-fauna-salud-tropical',  'aventura-f1-logistica-operativa'),
  ('aventura-f1-riesgo-rescate',        'aventura-f1-migracion-clan-golfo'),
  ('aventura-f1-riesgo-rescate',        'aventura-f1-travesias-historicas'),
  ('aventura-f1-riesgo-rescate',        'aventura-f1-logistica-operativa'),
  ('aventura-f1-riesgo-rescate',        'aventura-f1-fauna-salud-tropical')
ON CONFLICT (concept_id, prerequisite_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Canonical Phase 1 resources (51 total, sort_order 1..51)
--    Sort grouped by teaching concept in DAG order: C1(5) C2(7) C3(6) C4(5)
--    C5(6) C6(5) C7(5) C8(6) C9(6)
-- ---------------------------------------------------------------------------
INSERT INTO resources (
  id, title, type, url, author, phase, description,
  estimated_hours, sort_order, curriculum_source, is_archived,
  created_by, track
) VALUES
  -- ---- C1 Oceanografía Caribe sur ----
  (
    'aventura-r-uraba-tropical-estuary-review',
    'Gulf of Urabá (Caribbean Colombia), a Tropical Estuary: A Review',
    'paper',
    'https://link.springer.com/article/10.1007/s12601-022-00093-9',
    'Contreras-Fernández, Florez-Leiva, Bernal-Sánchez, Pacheco-Paternina, Bedoya-Valestt, Portillo-Cogollo (U. Antioquia / INVEMAR)',
    '1',
    'Review peer-reviewed más completo del Golfo como sistema estuarino (~1.800 km², profundidad media 40 m). Cubre pluma del Atrato, hipoxia estacional, estacionalidad seca/lluviosa y algas tóxicas. Ocean Science Journal 57:556-575, 2022. DOI 10.1007/s12601-022-00093-9.',
    2.5, 1, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-kastner-pcg-eddies-2024',
    'The Influence of Caribbean Current Eddies on Coastal Circulation in the Southwest Caribbean Sea',
    'paper',
    'https://journals.ametsoc.org/view/journals/phoc/54/10/JPO-D-24-0049.1.xml',
    'Kastner, Pawlak, Giddings, Adelson, Collin, Davis (Scripps + STRI)',
    '1',
    'Caracteriza cuantitativamente el Giro Panamá-Colombia (PCG) y cómo remolinos de la Corriente del Caribe modulan corrientes costeras hasta un factor 2 en ciclos de ~116 días — insumo crítico para elegir ventana de cruce. Journal of Physical Oceanography 54(10), 2024. DOI 10.1175/JPO-D-24-0049.1.',
    3.0, 2, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-toro-circulacion-uraba-cioh',
    'Circulación oceánica del Golfo de Urabá usando campos de viento de alta resolución temporal',
    'paper',
    'https://ojs.dimar.mil.co/index.php/CIOH/article/view/516',
    'Toro, Mosquera, Barrientos, Bedoya (CIOH - DIMAR Colombia)',
    '1',
    'Fuente oficial colombiana en español directamente sobre el Golfo de Urabá. Divide el golfo en tres zonas dinámicas según forzamiento del viento y cuantifica la influencia del Atrato hasta 3 m de profundidad. Boletín Científico CIOH 38(2), 2019. Acceso abierto.',
    2.0, 3, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-frank-wolf-darien-paddlingmag',
    'Frank Wolf Rounds The Darien Gap',
    'article',
    'https://paddlingmag.com/stories/columns/fathom/darien-gap/',
    'Frank Wolf (Paddling Magazine)',
    '1',
    'Crónica publicada en agosto 2024 por Paddling Magazine. Wolf y Mark Sky recorrieron 500 km de Colón (Panamá) a Turbo (Colombia) en kayak de mar, incluyendo travesía nocturna de 10 km en el delta del Atrato con tormenta súbita. Narrativa, no datos cuantitativos — complemento vivencial al paper oceanográfico.',
    0.5, 4, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-dimar-derroteros-caribe',
    'Publicaciones Náuticas y Cartas del CIOH-DIMAR (Caribe colombiano)',
    'article',
    'https://cioh.dimar.mil.co/index.php/es/publicaciones-nauticas',
    'Dirección General Marítima de Colombia (DIMAR) — CIOH',
    '1',
    'Cartografía náutica oficial colombiana. Derroteros del Caribe (3 volúmenes) con descripciones de costas, vientos, mareas, corrientes y peligros por tramos; Lista de Luces y Avisos a Navegantes mensuales descargables. Cartas individuales se distribuyen vía Capitanías de Puerto; la web es el catálogo.',
    1.0, 5, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C2 Tapón del Darién ----
  (
    'aventura-r-miller-minding-the-gap',
    'Minding the Gap: Pan-Americanism''s Highway, American Environmentalism, and Remembering the Failure to Close the Darién Gap',
    'paper',
    'https://www.journals.uchicago.edu/doi/full/10.1093/envhis/emu002',
    'Shawn William Miller (Brigham Young University)',
    '1',
    'Paper académico de referencia sobre por qué la Panamericana nunca se cerró: pan-americanismo, demanda Sierra Club 1975, veto fitosanitario, memoria pública del fracaso, injunction DOT levantada 1992. Environmental History 19(2):189-216, 2014. DOI 10.1093/envhis/emu002.',
    3.0, 6, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-stri-darien-carbon-2019',
    'Tree Aboveground Biomass and Species Richness of the Mature Tropical Forests of Darien, Panama',
    'paper',
    'https://conbio.onlinelibrary.wiley.com/doi/10.1111/csp2.42',
    'Mateo-Vega, Arroyo-Mora, Potvin (STRI / McGill)',
    '1',
    'Base empírica peer-reviewed del argumento la-no-carretera-conservó-algo-único. El Darién tiene los stocks de carbono más altos y la segunda mayor riqueza arbórea entre 9 sitios neotropicales; bosques con uso tradicional indígena mantienen la misma riqueza que los intactos. Conservation Science and Practice, 2019. DOI 10.1111/csp2.42. Mirror: https://www.sciencedaily.com/releases/2019/07/190719102122.htm',
    2.0, 7, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-jstor-daily-panam-highway',
    'The Pan-American Highway and the Darién Gap',
    'article',
    'https://daily.jstor.org/the-pan-american-highway-and-the-darien-gap/',
    'Matthew Wills (JSTOR Daily)',
    '1',
    'Síntesis divulgativa con estándar editorial alto sobre la historia política del Tapón. Cita directa al paper de Miller; funciona como puerta de entrada antes del paper académico. Publicado 13 nov 2022, actualizado 2025.',
    0.25, 8, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-iucn-darien-outlook',
    'IUCN World Heritage Outlook: Darién National Park Conservation Assessment',
    'article',
    'https://worldheritageoutlook.iucn.org/node/972',
    'IUCN — World Heritage Outlook programme',
    '1',
    'Evaluación técnica más autoritativa y actualizada (assessment finalizado 11-oct-2025). Rating Significant Concern. Documenta 533 especies de aves, pérdida 2002-2023 de 21.500 ha de bosque primario, y la amenaza explícita de la extensión de la Panamericana.',
    1.5, 9, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-mongabay-radwin-darien-2025',
    'Panamá refuerza la protección en el Tapón del Darién, pero la amenaza de deforestación sigue latente',
    'article',
    'https://es.mongabay.com/2025/09/darien-tapon-panama-deforestacion-proteccion/',
    'Maxwell Radwin (Mongabay Latam)',
    '1',
    'Long-form en español con datos del director de áreas protegidas de Panamá (Luis Carles Rudy): 106 km de gap en Yaviza, moratoria maderera hasta 2029, 300.000 toneladas de residuos de la crisis migratoria, inversión de US$ 70M en puente sobre Tuira/Chucunaque que podría reabrir frontera agrícola.',
    0.5, 10, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-outside-in-darien-gap',
    'Outside/In: The Darien Gap',
    'video',
    'http://outsideinradio.org/transcript-the-darien-gap',
    'Sam Evans-Brown (host), Justine Paradis, Taylor Quimby — New Hampshire Public Radio',
    '1',
    'Audio-documental que cubre las tres capas del Tapón simultáneamente: biología (coyote cruzando a Sudamérica por primera vez), crisis migratoria con testimonio directo, y resistencia indígena — Héctor Huertas y Alicia Korten sobre cómo Emberá-Wounaan usaron condicionalidades del Banco Mundial para frenar la carretera. Episodio ~30 min más transcript completo.',
    0.75, 11, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-pbs-drost-darien',
    'What Migrants Face as They Journey Through the Deadly Darien Gap',
    'video',
    'https://www.pbs.org/newshour/show/what-migrants-face-as-they-journey-through-the-deadly-darien-gap',
    'Nadja Drost, Bruno Federico — PBS NewsHour + Pulitzer Center',
    '1',
    'Reportaje inmersivo que le valió a Drost el Pulitzer Prize 2021 en International Reporting. Sostiene el lado consecuencial — el resultado es la ruta migratoria más peligrosa del hemisferio — sin el sensacionalismo de otros docs broadcast. Emitido 12-ago-2020. ~13 min.',
    0.25, 12, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C3 Guna Yala ----
  (
    'aventura-r-reglamento-turismo-gunayala',
    'Reglamento de Turismo de Gunayala',
    'article',
    'https://www.gunayala.org.pa/Reglamento%20de%20Turismo.htm',
    'Congreso General Guna (Onmaggeddummad Sunmaggaled)',
    '1',
    'Fuente primaria indígena viva. Norma vigente (2017) publicada en el sitio oficial del Congreso General Guna. Art. 28: autorización escrita obligatoria para yates/veleros extranjeros. Art. 29: estadía máxima 30 días. Art. 37: tasas ($10 anclaje, $2 por persona, $10 adicionales por comunidad). Documento operacional obligatorio antes de entrar a aguas de la comarca.',
    1.0, 13, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-gunayala-resumen-oficial',
    'Gunayala en Resumen',
    'article',
    'https://www.gunayala.org.pa/gunayala_en_resumen.htm',
    'Anelio Merry López — Depto. de Comunicación, Congreso General Guna',
    '1',
    'Fuente primaria indígena. Estructura dual de gobierno (Congreso General político/administrativo + Congreso General de la Cultura espiritual), autoridades tradicionales (Sagla local, argarmar, Sagladummagan), períodos de sesiones (mayo y octubre), 51 comunidades en 3.206 km². Complementa el Reglamento con marco institucional.',
    0.5, 14, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-howe-people-who-would-not-kneel',
    'A People Who Would Not Kneel: Panama, the United States, and the San Blas Kuna',
    'book',
    'https://www.amazon.com/PEOPLE-WHO-WOULD-NOT-KNEEL/dp/1560988657',
    'James Howe (MIT Anthropology)',
    '1',
    'Obra canónica sobre la Revolución Dule de 1925, publicada por Smithsonian Institution Press. Cubre el contexto colonial, Richard Marsh, Nele Kantule y Simral Colman, y cómo los Guna lograron autonomía sin ser conquistados. Esencial para entender por qué NO se puede tratar la comarca como Panamá estándar. 390 pp.',
    12.0, 15, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-howe-chiefs-scribes',
    'Chiefs, Scribes, and Ethnographers: Kuna Culture from Inside and Out',
    'book',
    'https://utpress.utexas.edu/9780292725713/',
    'James Howe',
    '1',
    'University of Texas Press, 2009. Documenta cómo jefes e intelectuales Guna colaboraron activamente con antropólogos extranjeros y produjeron su propia etnografía — caso único en las Américas. Los Guna son pueblo con historiografía propia, no pueblo estudiado por otros. 360 pp. ISBN 9780292725713.',
    10.0, 16, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-bila-burba-documental',
    'Bila Burba',
    'video',
    'https://letterboxd.com/film/bila-burba/',
    'Duiren Wagua (cineasta gunadule, comunidad Koskuna) — Utopia Docs',
    '1',
    'Fuente primaria indígena audiovisual. Director guna. Estreno mundial IDFA 2023 (Frontlight), Premio del Público Panama International Film Festival 2024, emisión broadcast TVN Panamá oct-2025. Revolución Dule de 1925 con reenactment comunitario y entrevistas a descendientes. 70 min. IMDb: https://www.imdb.com/title/tt30225315/',
    1.25, 17, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-cultural-survival-statute-tourism',
    'The Kuna General Congress and the Statute on Tourism',
    'article',
    'https://www.culturalsurvival.org/publications/cultural-survival-quarterly/kuna-general-congress-and-statute-tourism',
    'Stephen G. Snow — Cultural Survival Quarterly',
    '1',
    'Análisis del Estatuto de Turismo de 1996 incorporado a la Ley Fundamental, que obliga a todo operador turístico — incluidos kayakistas extranjeros — a solicitar permiso escrito al Congreso General. Crítico lúcido de la brecha entre normativa e implementación. Abril 2010.',
    0.5, 18, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C4 Emberá y Wounaan ----
  (
    'aventura-r-naval-embera-wounaan-espiga',
    'Colapso, adaptación y resistencia de la construcción naval emberá y wounaan en Panamá',
    'paper',
    'https://revistas.uned.ac.cr/index.php/espiga/article/view/5587',
    'Alberda, Ramos-Pérez, Cunampio, Gómez, Mémbora-Peña (U. Panamá) — Revista Espiga (UNED Costa Rica)',
    '1',
    'Paper 2024 open access con coautoría indígena (Cunampio y Mémbora-Peña son nombres wounaan/emberá). Trata explícitamente la jãba (piragua) en ecosistemas fluviales y marítimos. Rompe el estereotipo de indígena-selvático mostrando construcción naval en frontera Panamá-Colombia. Vol. 23(48), 127-169.',
    2.5, 19, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-herlihy-choco-relocation-cs',
    'Chocó Indian Relocation in Darién, Panama',
    'article',
    'https://www.culturalsurvival.org/publications/cultural-survival-quarterly/choco-indian-relocation-darien-panama',
    'Peter H. Herlihy — Cultural Survival Quarterly',
    '1',
    'El mejor artículo corto para entender la transición de dispersión fluvial tradicional a aldeas nucleadas a comarca. Herlihy (LSU PhD 1986) es la referencia académica en geografía cultural emberá-wounaan. Documenta que el patrón pre-1950 era familias extendidas dispersas en los ríos — fundamental para entender la interacción lateral en bocas de río.',
    0.5, 20, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-mongabay-bilbao-estrategia-darien',
    'La estrategia de los indígenas panameños para proteger los bosques del Tapón del Darién',
    'article',
    'https://es.mongabay.com/2019/06/indigenas-panama-darien-video/',
    'Guido Bilbao — Mongabay Latam / Pulitzer Center',
    '1',
    'Video-reportaje de investigación ambiental serio (coproducción con Pulitzer Center). Muestra cómo las comunidades emberá-wounaan están defendiendo activamente 650.000 ha en disputa con drones, GPS y abogados. Destruye el estereotipo pasivo-exótico. Artículo largo + video embebido ~10-12 min. Junio 2019.',
    0.75, 21, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-theodossopoulos-trap-authenticity',
    'Emberá Indigenous Tourism and the Trap of Authenticity: Beyond Inauthenticity and Invention',
    'paper',
    'https://kar.kent.ac.uk/34014/',
    'Dimitrios Theodossopoulos — Anthropology Quarterly',
    '1',
    'Piedra angular para la ética del contacto sin romantizar ni exotizar. Tesis: la oposición auténtico-vs-inventado es la trampa del turista. Enseña cómo pensar el encuentro sin caer en descubrí-algo-prístino ni en ya-están-todos-corrompidos. Anthropology Quarterly 86(2):397-426, 2013. AAM open access.',
    2.5, 22, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-ley-72-2008-tierras-colectivas',
    'Ley Nº 72 de 2008 — Procedimiento para la adjudicación de propiedad colectiva de tierras indígenas fuera de comarcas (Panamá)',
    'article',
    'https://www.ecolex.org/details/legislation/ley-no-72-procedimiento-para-la-adjudicacion-de-la-propiedad-colectiva-de-tierras-de-los-pueblos-indigenas-que-no-estan-dentro-de-las-comarcas-lex-faoc095794/',
    'Asamblea Nacional de Panamá (ficha NATLEX-OIT / FAOLEX)',
    '1',
    'Ley clave para entender por qué las comunidades costeras emberá-wounaan (Jaqué, desembocaduras) están técnicamente fuera de la Comarca Cémaco/Sambú y dependen de este procedimiento especial — parcialmente implementado. Gaceta Oficial 26.193 del 30-dic-2008. PDF oficial: https://faolex.fao.org/docs/pdf/pan95794.pdf',
    0.5, 23, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C5 Migración y Clan del Golfo ----
  (
    'aventura-r-crisis-group-darien-bottleneck',
    'Bottleneck of the Americas: Crime and Migration in the Darién Gap',
    'article',
    'https://www.crisisgroup.org/sites/default/files/2023-11/102-darien-gap-spanish.pdf',
    'International Crisis Group — Latin America Report N°102 (Bram Ebus y equipo)',
    '1',
    'El reporte de referencia sobre la estructura criminal del Darién. Documenta el circuito Necoclí -> Capurganá/Acandí -> trochas Clan del Golfo -> Bajo Chiquito -> Lajas Blancas. Cuantifica el cobro ~US$ 125/persona. Versión en español (ES por Q3). Publicado 3-nov-2023. ~30 pp.',
    2.0, 24, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-gitoc-gulf-clan-darien',
    'On the Border: The Gulf Clan, Irregular Migration and Organized Crime in Darién',
    'article',
    'https://globalinitiative.net/wp-content/uploads/2022/11/Andre%CC%81s-Cajiao-Paula-Tobo-Mariana-Botero-Restrepo-On-the-border-The-Gulf-Clan-irregular-migration-and-organized-crime-in-Darie%CC%81n-GI-TOC-November-2022.pdf',
    'Cajiao, Tobo, Botero Restrepo — Global Initiative Against Transnational Organized Crime (GI-TOC)',
    '1',
    'Documento fundacional sobre el Clan del Golfo (Autodefensas Gaitanistas) como regulador del corredor. Detalla economía extractiva en Necoclí/Capurganá/Sapzurro/Acandí, impuesto del 20% a quienes conducen migrantes, y la regla de no-violencia hacia migrantes por el negocio. Noviembre 2022. ~40 pp.',
    2.5, 25, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-hrw-neglected-jungle-darien',
    'Neglected in the Jungle: Inadequate Protection and Assistance for Migrants and Asylum Seekers Crossing the Darién Gap',
    'article',
    'https://www.hrw.org/report/2024/04/03/neglected-jungle/inadequate-protection-and-assistance-migrants-and-asylum-seekers',
    'Human Rights Watch',
    '1',
    'Reporte más completo post-récord 2023. Entrevistas a 300+ migrantes. Documenta ausencia de estrategia colombiana de protección y cómo Panamá prioriza flujo-controlado sobre asistencia. Complementa ICG con ángulo DDHH. 3-abr-2024. ~80 pp.',
    3.5, 26, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-infobae-peor-que-darien-maritima',
    'Es peor que el Darién: el relato de los migrantes que vuelven a Colombia vía marítima',
    'article',
    'https://www.infobae.com/colombia/2025/03/07/es-peor-que-el-darien-el-relato-de-los-migrantes-que-vuelven-a-colombia-via-maritima/',
    'Jimmy Nomesqui Rivera — Infobae Colombia (síntesis del reportaje BBC Mundo)',
    '1',
    'La pieza más cercana al cruce en kayak disponible. Describe las dos rutas marítimas activas en 2025 por el Caribe panameño: Miramar/Colón -> Gaigirgordub (Guna Yala) -> Puerto Obaldía (~9 h); Cartí -> Puerto Obaldía (~7 h). Naufragios, motores fallando, vientos alisios intensos enero-abril. Evidencia cualitativa de riesgo para kayakista. 7-mar-2025.',
    0.5, 27, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-insightcrime-darien-profit',
    'How Organized Crime Profits from Migrant Flow Across Colombia''s Darién Gap',
    'article',
    'https://insightcrime.org/news/organized-crime-profits-migrants-darien-gap/',
    'Javier Lizcano Villalba y Raquel Ballestin — InSight Crime',
    '1',
    'Pieza canónica de InSight Crime sobre la economía criminal del Darién. Urabeños/Gaitanistas operando en Acandí con cobros de US$ 50 por guía, y uso desde 2018 de migrantes como mulas de cocaína. Complementa ICG y GI-TOC con casos judiciales concretos. Noviembre 2022, actualizado febrero 2024.',
    0.5, 28, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-senafront-transito-irregular',
    'Tránsito Irregular por Darién — Estadísticas oficiales',
    'article',
    'https://www.migracion.gob.pa/estadisticas/',
    'Servicio Nacional de Migración de Panamá (datos SENAFRONT)',
    '1',
    'Única fuente primaria de cifras. Serie anual 2010-2026 con desagregación mensual, por país de origen, género y condición. Permite contrastar afirmaciones periodísticas contra dato bruto y entender la caída de ~94% en 2025 tras cierre Mulino + bloqueo Guna Yala. Complementada por Datos Abiertos Panamá para CSV. Actualización mensual.',
    0.5, 29, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C6 Travesías históricas ----
  (
    'aventura-r-wafer-isthmus-1699',
    'A New Voyage and Description of the Isthmus of America',
    'book',
    'https://archive.org/details/newvoyagedescrip03wafe',
    'Lionel Wafer (cirujano bucanero, 1660?-1705?)',
    '1',
    'Primer relato etnográfico europeo detallado de los Cuna/Kuna, escrito por alguien que vivió entre ellos tras ser abandonado en 1681. Incluye vocabulario comparado, costumbres, clima, ríos, flora/fauna del istmo. Edición 1729 Knapton (incorpora material de la edición original de 1699). ~260 pp. Descarga libre en Internet Archive.',
    8.0, 30, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-las-casas-historia-indias-iv',
    'Historia de las Indias, Tomo IV',
    'book',
    'https://www.gutenberg.org/files/56283/56283-h/56283-h.htm',
    'Fray Bartolomé de las Casas (cronista colonial)',
    '1',
    'Crónica coetánea en español que narra la expedición de Vasco Núñez de Balboa al descubrimiento del Mar del Sur el 25-sep-1513. Capítulos 39-77 del Tomo IV cubren Darién. Fuente textual canónica para la travesía original con guía de caciques locales. Edición Madrid 1875 en Project Gutenberg (HTML libre, dominio público).',
    10.0, 31, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-sauer-early-spanish-main',
    'The Early Spanish Main',
    'book',
    'https://archive.org/details/earlyspanishmain00saue_0',
    'Carl Ortwin Sauer (UC Berkeley)',
    '1',
    'Capítulo Entry to Darién and the South Sea (1511-1514) reconstruye la travesía de Balboa combinando crónicas coloniales con conocimiento de primera mano de la geografía, vegetación y etnografía del istmo. Lectura académica obligatoria para entender por qué el cruce fue posible. UC Press, 1966. 330 pp.',
    10.0, 32, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-blashford-snell-darien-conquest',
    'The Darién Conquest: Crossing the Gap',
    'article',
    'https://www.bradtguides.com/the-darien-conquest-crossing-the-gap/',
    'Col. John Blashford-Snell CBE (líder de la expedición Range Rover 1972) — Bradt Guides',
    '1',
    'Relato primera mano del líder de la expedición Range Rover 1972: 59 británicos + 40 Guardia Nacional panameña + 30 militares colombianos, dos Range Rovers, 100 días. Demostración operativa de que el cruce terrestre exige un ejército — haciendo la ruta marítima la única viable individualmente. Sustituto textual del film Darien Conquest (1971, ACMI ID 66601, no digitalizado). Publicado 13-oct-2022 (aniversario 50°).',
    0.5, 33, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-hoffmeister-south-america-plan',
    'Freya Hoffmeister — South America Expedition Plan and Facts',
    'article',
    'https://www.freyahoffmeister.com/expeditions/south-america-2011-15/plan-and-facts-sa/plan-and-facts-sa-english',
    'Freya Hoffmeister (primera circunnavegación solo de Sudamérica en kayak, 2011-2015)',
    '1',
    'Sitio oficial activo. Logs cronológicos 2012-2013 pasando por costa pacífica colombiana, Canal de Panamá y Archipiélago de San Blas/Guna Yala. Segunda etapa finalizó en Caribe colombiano el 6-may-2013 tras 15.300 km totales, con escolta naval por riesgo criminal. Demostración empírica contemporánea de la viabilidad marítima con logística correcta.',
    1.5, 34, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C7 Logística operativa ----
  (
    'aventura-r-snm-panama-requisitos-turistas',
    'Requisitos para Turistas en Panamá (Servicio Nacional de Migración)',
    'article',
    'https://www.migracion.gob.pa/turistas/',
    'Servicio Nacional de Migración de Panamá (SNM)',
    '1',
    'Fuente oficial canónica. Requisitos al entrar por puesto migratorio marítimo (Puerto Obaldía): pasaporte vigencia >=3 meses, solvencia de B/.500, reserva de salida, Tarjeta E/S. El último es punto friccional para kayakista autopropulsado (no hay carrier que la emita) — resolver con el oficial en Puerto Obaldía. Página con historial de rotación — re-fetch cada 6 meses. Actualización ene-2025.',
    0.25, 35, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-paddling-mag-satellite-communicators',
    '4 Best Two-Way Satellite Communicators For Off-Grid Adventures',
    'article',
    'https://paddlingmag.com/gear/accessories/safety-rescue/satellite-communicators/',
    'Paddling Magazine Staff',
    '1',
    'Comparativa directa de los 4 comunicadores relevantes: Garmin inReach Mini 2 ($399, 14 días batería, IPX7), ZOLEO ($199, IP68), ACR Bivy Stick ($299), SPOT X ($249). Incluye autonomía, uso independiente vs dependencia del teléfono. Actualiza benchmark post-integración GEOS en Garmin. Publicado ago-2023.',
    0.5, 36, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-paddling-mag-touring-kayaks-2026',
    'Best Touring Kayaks For 2026',
    'article',
    'https://paddlingmag.com/boats/kayaks/touring-kayak/',
    'Paddling Magazine',
    '1',
    'Comparativa actualizada entre NDK Explorer (17''6", $4.585, elección para circunnavegaciones en aguas remotas), P&H Scorpio MK II (17''2", cuatro escotillas estancas), Current Designs Karla, TRAK 2.0 plegable — todos dentro del rango 16-18 ft con bulkheads. Edición 2026 publicada oct-2024.',
    0.5, 37, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-freya-hoffmeister-equipment',
    'Freya Hoffmeister: Current Equipment',
    'article',
    'https://www.freyahoffmeister.com/sponsors/current-equipment',
    'Freya Hoffmeister (circunnavegadora de Sudamérica y Norteamérica)',
    '1',
    'Lista pública granular de equipo real de expedición tropical: Iridium 9555 (satellite phone backup), pistola de señales cartucho calibre 10 (reemplaza bengalas en clima húmedo), Kokatat Lightweight Gloves etiquetados Tropics, MSR Dromedary 4L, dry bags Sea to Summit + LOKSAK OPSAK anti-olor para fauna. Único listado público de paddler tropical documentado.',
    0.75, 38, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-aca-l3-coastal-trip-leader',
    'ACA Level 3 Coastal Kayaking Trip Leader Skills Course',
    'paper',
    'https://americancanoe.org/event/level-3-coastal-kayaking-trip-leader-skills-course/',
    'American Canoe Association (ACA)',
    '1',
    'Marco de competencias mínimas para liderar una travesía costera: trip planning, navegación básica, reparación de kayak en campo, rescates y recoveries, group management, leadership. Curso 2 días. El programa CKTL cierra el 31-dic-2026 en la transición al nuevo Leader Pathway — re-fetch posterior. Leader Pathway: https://americancanoe.org/leader-pathway/',
    1.0, 39, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C8 Fauna y salud tropical ----
  (
    'aventura-r-cdc-yellow-book-panama',
    'CDC Yellow Book 2024: Yellow Fever Vaccine & Malaria Prevention Information by Country — Panama',
    'article',
    'https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/panama',
    'U.S. CDC — Travelers'' Health Branch',
    '1',
    'Fuente operativa más accionable para decidir vacuna previaje y profilaxis. Fiebre amarilla recomendada para viajeros >=9 meses en toda área al este del Canal (incluye Darién); quimioprofilaxis antimalárica recomendada para Darién, Emberá, Guna Yala y Panamá Este — no para zona estricta del Canal ni Ciudad de Panamá. CDC Yellow Book 2024.',
    0.5, 40, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-cdc-colombia-travelers-health',
    'CDC Travelers'' Health — Colombia',
    'article',
    'https://wwwnc.cdc.gov/travel/destinations/traveler/none/colombia',
    'U.S. CDC — Travelers'' Health Branch',
    '1',
    'Cubre fiebre amarilla (vacuna obligatoria para ingreso desde 2025 tras brote en Tolima), malaria bajo 5600 ft (P. falciparum + P. vivax en Urabá/Chocó), dengue/zika/chikungunya (DENV-3 circulando), leishmaniasis cutánea por flebotominos. Última revisión 23-mar-2026. Versión es disponible en wwwnc.cdc.gov/travel/es/',
    0.5, 41, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-paho-yellow-fever-americas-2025',
    'Epidemiological Update: Yellow Fever in the Americas Region',
    'paper',
    'https://www.paho.org/en/documents/epidemiological-update-yellow-fever-americas-region-24-april-2025',
    'Pan American Health Organization / WHO — Health Emergencies',
    '1',
    'Actualización epidemiológica PAHO 24-abr-2025. SE 1-15/2025: Colombia reporta 53 casos confirmados y 21 muertes por fiebre amarilla con circulación fuera de Amazonía (Tolima). Justifica tratar la vacuna de FA como no-negociable para cruce Darién. Complementar con SITREP dengue PAHO SE 46/2025 y brote Oropouche concentrado en Darién.',
    1.5, 42, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-ins-colombia-bes',
    'Boletín Epidemiológico Semanal — Instituto Nacional de Salud (Colombia)',
    'article',
    'https://www.ins.gov.co/buscador-eventos/Paginas/Vista-Boletin-Epidemilogico.aspx',
    'Instituto Nacional de Salud (INS) — MinSalud Colombia',
    '1',
    'Única fuente con granularidad municipal. Reporta semanalmente dengue, leishmaniasis (cutánea y mucosa), malaria, ETV. Municipios clave para la ruta costera: Acandí, Unguía, Juradó, Bajo Baudó — todos en zona hiperendémica de leishmaniasis cutánea por Lutzomyia. Usar boletín del año en curso dentro de 60 días del viaje. URLs PDF anuales rotan; página índice estable.',
    1.0, 43, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-rigg-sandflies-panama',
    'Leishmania spp. Infection Rate and Feeding Patterns of Sand Flies from a Hyperendemic Cutaneous Leishmaniasis Community in Panamá',
    'paper',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6447106/',
    'Rigg, Calzada, Saldaña, Perea, Chaves, Valderrama (Instituto Gorgas, Panamá)',
    '1',
    'Identifica Lutzomyia trapidoi como el principal vector antropofílico de Leishmania panamensis en Panamá, con tasa de infección del vector 9-12% y picos de transmisión en estación lluviosa. Justifica repelente DEET/picaridina + ropa tratada con permetrina + evitar palmares al atardecer. Am J Trop Med Hyg 100(5):1024-1031, 2019. PMID 30457097.',
    2.0, 44, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-lakkis-jellyfish-practical',
    'Jellyfish Stings: A Practical Approach',
    'paper',
    'https://pubmed.ncbi.nlm.nih.gov/25935311/',
    'Lakkis, Maalouf, Mahmassani (American University of Beirut)',
    '1',
    'Review peer-reviewed revista oficial Wilderness Medical Society. Para Physalia physalis (carabela portuguesa, confirmada Caribe sur): desaconseja vinagre 5% por favorecer descarga de nematocistos; recomienda inmersión agua caliente 40-45°C por 20-45 min + remoción mecánica. Complementar con systematic review de Bañón-Boulet 2025 en International Maritime Health. WEM 26(3):422-429, sep-2015.',
    1.5, 45, 'core', FALSE, NULL, 'aventura'
  ),

  -- ---- C9 Riesgo, decisión, rescate ----
  (
    'aventura-r-edelmayer-darien-kayak-guide',
    'A Guide to Kayaking From Panama to Colombia, a.k.a. the Darien Gap',
    'article',
    'https://www.keiferaedelmayer.com/blog/a-guide-to-kayaking-from-panama-to-colombia-aka-the-darien-gap',
    'Keifer A. Edelmayer (paddler solista)',
    '1',
    'La única fuente pública verificada que documenta la ejecución real de la ruta del curriculum (Gatún -> Chagres -> Portobelo -> San Blas -> Puerto Obaldía -> Capurganá). 21 días, oct-2023. Lista equipo exacto, criterios de aborto (stay within one hour of shore during storms), interacción humana (checks policiales, aprobación sahila Guna), vacíos de cobertura. Caso base operativo. Lectura obligatoria.',
    1.0, 46, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-broze-gronseth-deep-trouble',
    'Sea Kayaker''s Deep Trouble: True Stories and Their Lessons from Sea Kayaker Magazine',
    'book',
    'https://archive.org/details/seakayakersdeept0000broz',
    'Matt Broze & George Gronseth (safety columnists Sea Kayaker Magazine); editor Christopher Cunningham',
    '1',
    'El corpus fundacional del análisis AAR en sea kayaking. 20 casos analizados con la estructura qué llevaba el grupo / qué falló / cuánto costó evacuar / qué se aprende. Incluye blow-offshore, entrapment en sea caves, hipotermia con skirt failure. Contexto Pacífico norte — traducir al Caribe tropical (hipotermia -> deshidratación/insolación). International Marine, 1997. ISBN 0-07-008499-8. 220 pp.',
    8.0, 47, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-gonzales-deep-survival',
    'Deep Survival: Who Lives, Who Dies, and Why',
    'book',
    'https://www.laurencegonzales.com/',
    'Laurence Gonzales (Montaigne Medal 2018)',
    '1',
    'Libro que enseña POR QUÉ los paddlers competentes mueren: plan-continuation bias, sunk-cost escalation, get-there-itis. Caps. 7 (The Rules of Adventure) y 8 (Danger Zones) desarman el mito del tenía-que-cruzarlo que mata gente. W.W. Norton, 2003 (reed. 2017). 352 pp.',
    12.0, 48, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-will-gadd-misadventure-risk',
    'Will Gadd: How to Avoid Misadventure + How to Communicate Risk (Delivering Adventure podcast)',
    'article',
    'https://deliveringadventure.com/2022/11/07/episode-6-how-to-avoid-misadventure-part-2-with-will-gadd/',
    'Will Gadd (ACMG Alpine Guide) en podcast Delivering Adventure (Chris Kaipio + Jordy Shepherd)',
    '1',
    'Gadd articula en lenguaje operativo: la calidad se juzga por el proceso, no por el resultado — buen outcome con mal proceso es suerte. Relevante para C9 porque insiste en involucrar al partner en la decisión y en bajar las consecuencias mediante redundancias. Dos episodios (nov-2022 y feb-2024, ~60 min cada uno). Segundo episodio: https://deliveringadventure.com/2024/02/08/s2-e09-how-to-communicate-risk-with-will-gadd/',
    2.0, 49, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-garmin-response-sos-protocol',
    'Garmin Response: Interactive SOS 24/7 Emergency Monitoring',
    'article',
    'https://www.garmin.com/en-US/satellite-communicators/interactive-sos-and-garmin-response/',
    'Garmin International (ex-GEOS IERCC, integrado en 2021)',
    '1',
    'Whitepaper de facto para el dispositivo que el paddler lleva (inReach Mini 2). Enseña que el SOS NO llama a un helicóptero — llama a un coordinador en Montgomery, Texas que negocia con SENAN Panamá o DIMAR Colombia según GPS, y tarda en traducir, confirmar y escalar. 150.000+ SOS históricos, 19.000+ inReach. Calibra expectativa real vs. fantasía de rescate inmediato. Anual SOS report: https://www.garmin.com/en-US/blog/outdoor/2025-inreach-sos-year-in-review/',
    0.5, 50, 'core', FALSE, NULL, 'aventura'
  ),
  (
    'aventura-r-osac-panama-security-report',
    'Panama Country Security Report + Panama Travel Advisory',
    'article',
    'https://www.osac.gov/Content/Report/c7575230-2685-4c5d-bd60-1c840cdaf93e',
    'Overseas Security Advisory Council (OSAC) — U.S. Bureau of Diplomatic Security + U.S. Department of State',
    '1',
    'Fija por zona GPS el nivel de riesgo humano. Nivel 4 para Darién y Mosquito Coast (do-not-travel); Guna Yala fuera de Nivel 4 (transitable). Traza la frontera entre zona donde remar es riesgo náutico (San Blas) y zona donde remar es riesgo humano no mitigable (Mosquito Coast oeste, aguas Darién fronterizas). Emergency 911, crime 104, fire 103 — English proficiency limitada. Country Security Report 2-ene-2025; Travel Advisory: https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/panama-travel-advisory.html',
    0.5, 51, 'core', FALSE, NULL, 'aventura'
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
-- 5) resource_concepts — 51 teach + 92 reinforce, all is_prerequisite=FALSE
--    "Reinforce" rows survived the FSRS audit (113 proposed -> 92 kept, 21
--    cut on the criterion "does studying this resource genuinely anchor
--    concept X").
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  -- ---- C1 resources teach C1; reinforce where noted ----
  ('aventura-r-uraba-tropical-estuary-review',   'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-uraba-tropical-estuary-review',   'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-uraba-tropical-estuary-review',   'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-kastner-pcg-eddies-2024',         'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-kastner-pcg-eddies-2024',         'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-toro-circulacion-uraba-cioh',     'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-toro-circulacion-uraba-cioh',     'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-frank-wolf-darien-paddlingmag',   'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-frank-wolf-darien-paddlingmag',   'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-frank-wolf-darien-paddlingmag',   'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-frank-wolf-darien-paddlingmag',   'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-dimar-derroteros-caribe',         'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-dimar-derroteros-caribe',         'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-dimar-derroteros-caribe',         'aventura-f1-riesgo-rescate',          FALSE),

  -- ---- C2 resources teach C2; reinforce where noted ----
  ('aventura-r-miller-minding-the-gap',          'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-miller-minding-the-gap',          'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-stri-darien-carbon-2019',         'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-stri-darien-carbon-2019',         'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-jstor-daily-panam-highway',       'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-jstor-daily-panam-highway',       'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-iucn-darien-outlook',             'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-iucn-darien-outlook',             'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-iucn-darien-outlook',             'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-mongabay-radwin-darien-2025',     'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-mongabay-radwin-darien-2025',     'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-mongabay-radwin-darien-2025',     'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-outside-in-darien-gap',           'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-outside-in-darien-gap',           'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-outside-in-darien-gap',           'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-outside-in-darien-gap',           'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-pbs-drost-darien',                'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-pbs-drost-darien',                'aventura-f1-migracion-clan-golfo',    FALSE),

  -- ---- C3 resources teach C3; reinforce where noted ----
  ('aventura-r-reglamento-turismo-gunayala',     'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-reglamento-turismo-gunayala',     'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-reglamento-turismo-gunayala',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-gunayala-resumen-oficial',        'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-gunayala-resumen-oficial',        'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-gunayala-resumen-oficial',        'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-howe-people-who-would-not-kneel', 'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-howe-people-who-would-not-kneel', 'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-howe-chiefs-scribes',             'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-howe-chiefs-scribes',             'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-bila-burba-documental',           'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-bila-burba-documental',           'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-cultural-survival-statute-tourism','aventura-f1-guna-yala',              FALSE),
  ('aventura-r-cultural-survival-statute-tourism','aventura-f1-logistica-operativa',    FALSE),
  ('aventura-r-cultural-survival-statute-tourism','aventura-f1-riesgo-rescate',         FALSE),

  -- ---- C4 resources teach C4; reinforce where noted ----
  ('aventura-r-naval-embera-wounaan-espiga',     'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-naval-embera-wounaan-espiga',     'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-herlihy-choco-relocation-cs',     'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-mongabay-bilbao-estrategia-darien','aventura-f1-embera-wounaan',         FALSE),
  ('aventura-r-mongabay-bilbao-estrategia-darien','aventura-f1-tapon-darien',           FALSE),
  ('aventura-r-mongabay-bilbao-estrategia-darien','aventura-f1-migracion-clan-golfo',   FALSE),
  ('aventura-r-theodossopoulos-trap-authenticity','aventura-f1-embera-wounaan',         FALSE),
  ('aventura-r-theodossopoulos-trap-authenticity','aventura-f1-guna-yala',              FALSE),
  ('aventura-r-ley-72-2008-tierras-colectivas',  'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-ley-72-2008-tierras-colectivas',  'aventura-f1-guna-yala',               FALSE),

  -- ---- C5 resources teach C5; reinforce where noted ----
  ('aventura-r-crisis-group-darien-bottleneck',  'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-crisis-group-darien-bottleneck',  'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-crisis-group-darien-bottleneck',  'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-crisis-group-darien-bottleneck',  'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-gitoc-gulf-clan-darien',          'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-gitoc-gulf-clan-darien',          'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-gitoc-gulf-clan-darien',          'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-hrw-neglected-jungle-darien',     'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-hrw-neglected-jungle-darien',     'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-hrw-neglected-jungle-darien',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-infobae-peor-que-darien-maritima','aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-infobae-peor-que-darien-maritima','aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-infobae-peor-que-darien-maritima','aventura-f1-guna-yala',               FALSE),
  ('aventura-r-infobae-peor-que-darien-maritima','aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-insightcrime-darien-profit',      'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-insightcrime-darien-profit',      'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-insightcrime-darien-profit',      'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-senafront-transito-irregular',    'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-senafront-transito-irregular',    'aventura-f1-riesgo-rescate',          FALSE),

  -- ---- C6 resources teach C6; reinforce where noted ----
  ('aventura-r-wafer-isthmus-1699',              'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-wafer-isthmus-1699',              'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-wafer-isthmus-1699',              'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-las-casas-historia-indias-iv',    'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-las-casas-historia-indias-iv',    'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-las-casas-historia-indias-iv',    'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-sauer-early-spanish-main',        'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-sauer-early-spanish-main',        'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-sauer-early-spanish-main',        'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-blashford-snell-darien-conquest', 'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-blashford-snell-darien-conquest', 'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-blashford-snell-darien-conquest', 'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-hoffmeister-south-america-plan',  'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-hoffmeister-south-america-plan',  'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-hoffmeister-south-america-plan',  'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-hoffmeister-south-america-plan',  'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-hoffmeister-south-america-plan',  'aventura-f1-riesgo-rescate',          FALSE),

  -- ---- C7 resources teach C7; reinforce where noted ----
  ('aventura-r-snm-panama-requisitos-turistas',  'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-snm-panama-requisitos-turistas',  'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-snm-panama-requisitos-turistas',  'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-paddling-mag-satellite-communicators', 'aventura-f1-logistica-operativa',    FALSE),
  ('aventura-r-paddling-mag-satellite-communicators', 'aventura-f1-fauna-salud-tropical',   FALSE),
  ('aventura-r-paddling-mag-satellite-communicators', 'aventura-f1-riesgo-rescate',         FALSE),
  ('aventura-r-paddling-mag-touring-kayaks-2026',     'aventura-f1-logistica-operativa',    FALSE),
  ('aventura-r-freya-hoffmeister-equipment',     'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-freya-hoffmeister-equipment',     'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-freya-hoffmeister-equipment',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-aca-l3-coastal-trip-leader',      'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-aca-l3-coastal-trip-leader',      'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-aca-l3-coastal-trip-leader',      'aventura-f1-riesgo-rescate',          FALSE),

  -- ---- C8 resources teach C8; reinforce where noted ----
  ('aventura-r-cdc-yellow-book-panama',          'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-cdc-yellow-book-panama',          'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-cdc-yellow-book-panama',          'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-cdc-colombia-travelers-health',   'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-cdc-colombia-travelers-health',   'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-paho-yellow-fever-americas-2025', 'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-paho-yellow-fever-americas-2025', 'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-paho-yellow-fever-americas-2025', 'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-ins-colombia-bes',                'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-ins-colombia-bes',                'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-ins-colombia-bes',                'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-rigg-sandflies-panama',           'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-rigg-sandflies-panama',           'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-rigg-sandflies-panama',           'aventura-f1-embera-wounaan',          FALSE),
  ('aventura-r-lakkis-jellyfish-practical',      'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-lakkis-jellyfish-practical',      'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-lakkis-jellyfish-practical',      'aventura-f1-riesgo-rescate',          FALSE),

  -- ---- C9 resources teach C9; reinforce where noted ----
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-migracion-clan-golfo',    FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-edelmayer-darien-kayak-guide',    'aventura-f1-fauna-salud-tropical',    FALSE),
  ('aventura-r-broze-gronseth-deep-trouble',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-broze-gronseth-deep-trouble',     'aventura-f1-oceanografia-caribe-sur', FALSE),
  ('aventura-r-broze-gronseth-deep-trouble',     'aventura-f1-travesias-historicas',    FALSE),
  ('aventura-r-broze-gronseth-deep-trouble',     'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-gonzales-deep-survival',          'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-gonzales-deep-survival',          'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-will-gadd-misadventure-risk',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-garmin-response-sos-protocol',    'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-garmin-response-sos-protocol',    'aventura-f1-logistica-operativa',     FALSE),
  ('aventura-r-osac-panama-security-report',     'aventura-f1-riesgo-rescate',          FALSE),
  ('aventura-r-osac-panama-security-report',     'aventura-f1-tapon-darien',            FALSE),
  ('aventura-r-osac-panama-security-report',     'aventura-f1-guna-yala',               FALSE),
  ('aventura-r-osac-panama-security-report',     'aventura-f1-migracion-clan-golfo',    FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
