-- ============================================================================
-- Travel track — Phase 6 (Ecuador Andino y Costa) canonical seed
-- ----------------------------------------------------------------------------
-- Source of truth: docs/travel-track/phase-6-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f6-quito-colonial',
    'Quito colonial, pre-colombino y patrimonio UNESCO',
    'quito-colonial-precolombino-unesco',
    'Quito es doble: asentamiento precolombino de los Quitu-Caras integrado tardíamente al Tawantinsuyu por Huayna Cápac (1487), y fundación española por Sebastián de Benalcázar el 6 de diciembre de 1534 sobre las ruinas que Rumiñahui incendió antes que entregarlas intactas. La Cédula Real de 29 de agosto de 1563 establece la Real Audiencia de Quito, con jurisdicción cinco veces mayor que el Ecuador actual y dependiente del Virreinato del Perú. Entre los siglos XVII y XVIII florece la Escuela Quiteña, síntesis mestiza de barroco europeo e iconografía andina cuyos máximos exponentes son Miguel de Santiago, Bernardo de Legarda y Manuel Chili "Caspicara"; su prestigio llegó a la corte de Madrid. Quito fue el primer sitio en el mundo declarado Patrimonio Cultural de la Humanidad por UNESCO (8 de septiembre de 1978), con un centro histórico de 320 hectáreas y la infraestructura colonial mejor conservada de Hispanoamérica.',
    '6',
    'travel'
  ),
  (
    'travel-f6-avenida-volcanes',
    'Avenida de los Volcanes y geología andina ecuatoriana',
    'avenida-volcanes-geologia-andina',
    'El corredor interandino ecuatoriano — bautizado "Avenida de los Volcanes" por Alexander von Humboldt en su expedición a Ecuador (junio 1802) — es el tramo de los Andes donde la subducción de la placa de Nazca produce dos cordilleras paralelas (Occidental y Real) con una fosa central de ~350 km que alberga más de 70 volcanes y nevados. Cuatro hitos: Cotopaxi (5.897 m, activo, ciclos eruptivos 1532-34, 1742-44, 1766-68, 1853-54, 1877-80 y reactivación 2015; la erupción de 1877 envió lahares hasta Esmeraldas y Napo), Chimborazo (6.263 m, potencialmente activo, el punto de la superficie terrestre más alejado del centro de la Tierra por el abultamiento ecuatorial, y la cima que Humboldt-Bonpland-Montúfar intentaron coronar el 23 de junio de 1802 alcanzando 5.917 m, donde Humboldt concibió el Naturgemälde: primera representación visual de la distribución altitudinal de la vegetación), Antisana (5.704 m, con reserva ecológica clave para el agua de Quito) y Tungurahua (5.023 m, fases eruptivas 1999-2016). Alrededor del Instituto Geofísico de la EPN se organiza el monitoreo.',
    '6',
    'travel'
  ),
  (
    'travel-f6-guayaquil-costa',
    'Guayaquil, identidad costeña y montubio',
    'guayaquil-costa-montubio',
    'Guayaquil es la antítesis de Quito: ciudad portuaria fundada por Francisco de Orellana en 1547 (como puerto articulador del Pacífico sur-ecuatoriano), poca arquitectura colonial sobreviviente por incendios recurrentes y la acción de los piratas, y una identidad volcada al comercio, al río Guayas y a la industria naval. El 9 de octubre de 1820 Guayaquil se independiza por sí sola — liderada por el poeta José Joaquín de Olmedo — mucho antes que Quito (24 mayo 1822) y se proclama Provincia Libre; crea la División Protectora de Quito que pelea bajo Sucre en Pichincha. La población costeña mezcla descendencia afro (trabajadores de haciendas cacaoteras), indígena del litoral (Huancavilca, Chono), española y posteriormente migración sirio-libanesa y china. El montubio — el campesino mestizo de la costa interior, identidad ecuestre y agrícola reconocida como pueblo en la Constitución 2008 — es el correlato del gaucho o del llanero: categoría étnica propia que no encaja en el binomio mestizo-indígena andino. La rivalidad estructural Quito–Guayaquil (sierra conservadora–costa liberal, altura–puerto, católica–laica) es el eje que organiza la política ecuatoriana hasta hoy.',
    '6',
    'travel'
  ),
  (
    'travel-f6-cacao-pepa-oro',
    'Cacao ecuatoriano: la "pepa de oro"',
    'cacao-pepa-oro-oligarquia-cacaotera',
    'El cacao Nacional Arriba ecuatoriano fue la primera gran exportación del país independiente: desde la liberación comercial post-1820 hasta 1920, Ecuador fue el mayor exportador mundial de cacao fino, con epicentro en la cuenca del Guayas. El boom 1880-1920 (la "pepa de oro") consolida a los Gran Cacao — oligarquía cacaotera guayaquileña propietaria de haciendas con miles de árboles y mano de obra afrodescendiente e indígena bajo sistema de concertaje — y funda la burguesía comercial-financiera guayaquileña que financia la Revolución Liberal de 1895. Para 1914 el cacao aportaba 60-70% de las divisas del país. La crisis llega en 1920 con el doble golpe de la "escoba de bruja" (hongo Moniliophthora perniciosa) y la monilia (M. roreri) que destruyen los cultivos, sumados a la caída de precios por la Primera Guerra Mundial y la competencia de las colonias africanas. La crisis cacaotera es lo que habilita, veinte años después, el ascenso del banano y, luego, del petróleo como exportación dominante. Entender el cacao es entender por qué Ecuador tiene una oligarquía costeña-financiera y no una oligarquía serrana-terrateniente como Perú o Bolivia.',
    '6',
    'travel'
  ),
  (
    'travel-f6-revolucion-liberal-alfaro',
    'Revolución Liberal de Eloy Alfaro (1895–1912)',
    'revolucion-liberal-eloy-alfaro',
    'José Eloy Alfaro Delgado (Montecristi 1842 – Quito 1912), el Viejo Luchador, lidera desde el exilio la montonera liberal durante tres décadas contra el régimen conservador católico dominante desde García Moreno. El 5 de junio de 1895 triunfa la Revolución Liberal en Guayaquil y Alfaro toma el poder (1895-1901 y 1906-1911). Reformas estructurales: (a) separación Iglesia-Estado con la Ley de Instrucción Pública 1897 (educación laica y gratuita, expropiación de bienes del clero), matrimonio civil y divorcio; (b) construcción del Ferrocarril Trasandino Guayaquil-Quito, inaugurado el 25 de junio 1908, obra de ingeniería que atravesó la Nariz del Diablo y unió por primera vez costa y sierra en ~12 horas donde antes tomaba 15 días a lomo de mula; (c) derogación del concertaje indígena (1918, póstumo) y promoción del sufragio universal masculino. El 28 de enero 1912, turba conservadora azuzada por la Iglesia arrastra a Alfaro por las calles de Quito y lo quema en el parque El Ejido — episodio bautizado "Hoguera Bárbara" por Alfredo Pareja Diezcanseco (1944). Es el momento fundacional del Ecuador laico moderno.',
    '6',
    'travel'
  ),
  (
    'travel-f6-cuenca-austro',
    'Cuenca y el Austro: toquilla, patrimonio y migración',
    'cuenca-austro-toquilla-migracion',
    'Santa Ana de los Ríos de Cuenca (Azuay), tercera ciudad del Ecuador, fundada en 1557 sobre el asentamiento Cañari de Guapondélig y la ciudad Inca de Tomebamba (segunda capital del Tawantinsuyu bajo Huayna Cápac). Su centro histórico fue declarado Patrimonio Cultural de la Humanidad por UNESCO en 1999. Cuenca es capital del Austro (sierra sur: Azuay, Cañar, Loja, parte de Morona Santiago). Dos fenómenos clave: (a) el sombrero de paja toquilla (Carludovica palmata, tejido artesanalmente por mujeres de Manabí y Cuenca-Azuay), llamado internacionalmente "Panama hat" por el puerto de exportación del siglo XIX, Patrimonio Cultural Inmaterial UNESCO 2012; (b) la diáspora del Austro desde los 1990s: tras la crisis agraria y el colapso de 1999, decenas de miles de cuencanos y azuayos migraron a Nueva York, Nueva Jersey y Murcia/Madrid, al punto que las remesas del Austro sostienen la economía de provincias enteras. La diáspora azuaya explica por qué Ecuador es el tercer país latinoamericano por proporción de remesas sobre PIB.',
    '6',
    'travel'
  ),
  (
    'travel-f6-movimiento-indigena-conaie',
    'Movimiento indígena ecuatoriano: CONAIE, Pachakutik y Sumak Kawsay',
    'conaie-pachakutik-sumak-kawsay',
    'Desde la fundación de la Confederación de Nacionalidades Indígenas del Ecuador (CONAIE) el 16 de noviembre de 1986 — uniendo Ecuarunari (sierra Kichwa), CONFENIAE (Amazonía) y CONAICE (costa) — el movimiento indígena ecuatoriano se convierte en el más influyente del continente. Hitos: (a) Levantamiento del Inti Raymi (junio 1990), bajo la presidencia de Luis Macas, paraliza el país y coloca en la agenda la plurinacionalidad; (b) fundación en 1995 del brazo político Pachakutik ("tiempo de retorno/revolución" en kichwa) como instrumento electoral; (c) rol decisivo en la caída de Abdalá Bucaram (1997), Jamil Mahuad (2000) — levantamiento del 21 de enero con el coronel Lucio Gutiérrez — y Lucio Gutiérrez (2005); (d) entrada del Sumak Kawsay ("buen vivir") y los derechos de la naturaleza en la Constitución de Montecristi 2008, primera del mundo en reconocer a la naturaleza como sujeto de derechos; (e) paros nacionales de octubre 2019 (contra FMI) y junio 2022, bajo liderazgo de Leonidas Iza y CONAIE. El movimiento es el actor no-partidario más potente del país y condicionante de cualquier gobierno.',
    '6',
    'travel'
  ),
  (
    'travel-f6-crisis-dolarizacion',
    'Crisis 1999 y dolarización 2000',
    'crisis-1999-dolarizacion-2000',
    'A fines de los 90s Ecuador acumula tres crisis simultáneas: Fenómeno de El Niño 1997-98 (USD 2.900 M en daños agrícolas en la costa), colapso del precio del petróleo (USD 7/barril en 1998), crisis financiera asiática y rusa 1997-98 que corta crédito externo. El sistema bancario, liberalizado sin supervisión desde la Ley de Instituciones Financieras de 1994, está quebrado por créditos vinculados. El presidente Jamil Mahuad declara feriado bancario el 8 de marzo 1999 (anunciado por 24h, dura 5 días) y luego congela los depósitos por un año; cierran 17 bancos privados, entre ellos Filanbanco y el Progreso. El sucre, que valía 4.493/USD en enero 1998, llega a 25.000/USD en enero 2000. El 9 de enero 2000 Mahuad decreta dolarización a 25.000 sucres/USD. Dos semanas después, el 21 de enero, una coalición de CONAIE + militares (coronel Lucio Gutiérrez) lo derroca; asume Gustavo Noboa y ratifica la dolarización. Consecuencias: inflación controlada de inmediato, pero pérdida de soberanía monetaria; emigración masiva a España, Italia y EE.UU. (~1.5 millones de ecuatorianos, 10% de la población) cuyas remesas sostienen la economía familiar desde entonces. En 2026 la dolarización sigue vigente tras ocho gobiernos porque cualquier salida tiene costo político mayor que mantenerla.',
    '6',
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
-- 2) concept_prerequisites — DAG
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('travel-f6-quito-colonial',              'travel-f1-virreinatos'),
  ('travel-f6-quito-colonial',              'travel-f1-pueblos-precolombinos'),
  ('travel-f6-avenida-volcanes',            'travel-geo-sudamerica'),
  ('travel-f6-guayaquil-costa',             'travel-f1-capitales-ubicacion'),
  ('travel-f6-cacao-pepa-oro',              'travel-f6-guayaquil-costa'),
  ('travel-f6-revolucion-liberal-alfaro',   'travel-f6-guayaquil-costa'),
  ('travel-f6-revolucion-liberal-alfaro',   'travel-f6-cacao-pepa-oro'),
  ('travel-f6-cuenca-austro',               'travel-f6-guayaquil-costa'),
  ('travel-f6-cuenca-austro',               'travel-f6-cacao-pepa-oro'),
  ('travel-f6-movimiento-indigena-conaie',  'travel-f6-revolucion-liberal-alfaro'),
  ('travel-f6-movimiento-indigena-conaie',  'travel-f5-pueblos-amazonicos'),
  ('travel-f6-movimiento-indigena-conaie',  'travel-f5-amazonia-presente'),
  ('travel-f6-crisis-dolarizacion',         'travel-f6-cacao-pepa-oro'),
  ('travel-f6-crisis-dolarizacion',         'travel-f6-revolucion-liberal-alfaro'),
  ('travel-f6-crisis-dolarizacion',         'travel-f6-movimiento-indigena-conaie')
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
    'travel-r-ayala-mora-resumen-historia',
    'Resumen de Historia del Ecuador (caps. 4-6)',
    'book',
    'https://archive.org/details/ResumenDeHistoriaDelEcuador',
    'Enrique Ayala Mora',
    '6',
    'Libro canónico de historia ecuatoriana por Enrique Ayala Mora (rector UASB). Lectura: cap. 4 Revolución Alfarista + cap. 5 Época republicana siglo XX + cap. 6 Ecuador contemporáneo. ~100 páginas.',
    6.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-paz-y-mino-cacao',
    'La época cacaotera en Ecuador',
    'article',
    'https://the.pazymino.com/JPyM-Epoca_Cacaotera_Ecuador.pdf',
    'Juan J. Paz y Miño Cepeda',
    '6',
    'Artículo del Taller de Historia Económica (THE) de Paz y Miño Cepeda (Cronista de Quito, Academia Nacional de Historia). Cobertura del boom cacaotero 1880-1920 y la oligarquía guayaquileña.',
    1.25,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-feriado-bancario-dolarizacion',
    'Feriado bancario y dolarización — video explicativo',
    'video',
    'https://www.youtube.com/watch?v=Sbb8eLjwuG0',
    NULL,
    '6',
    'Video explicativo sobre la caída del sucre, el feriado bancario de 1999 y la dolarización de 2000. URL primaria del brief; coordinator puede refinar canal en follow-up.',
    0.5,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-primicias-25-anos-dolarizacion',
    'La dolarización cumple un cuarto de siglo en Ecuador',
    'article',
    'https://www.primicias.ec/economia/dolarizacion-economia-ecuador-25anos-87060/',
    'Redacción Primicias',
    '6',
    'Análisis panorámico 2000-2025 de la dolarización con datos del BCE y entrevistas a economistas académicos. Primicias es el medio digital de mayor prestigio académico actual en Ecuador.',
    0.5,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-ig-epn-volcanes',
    'IG-EPN: Erupciones históricas del Cotopaxi y Chimborazo',
    'article',
    'https://www.igepn.edu.ec/interactuamos-con-usted/1119-las-erupciones-historicas-del-volcan-cotopaxi',
    'Instituto Geofísico de la Escuela Politécnica Nacional (IG-EPN)',
    '6',
    'Artículos técnicos del IG-EPN (autoridad científica oficial única sobre vulcanología ecuatoriana): erupciones históricas del Cotopaxi y ficha institucional del Chimborazo. Lectura complementaria: crónica de la erupción 1877.',
    1.5,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-wulf-invencion-naturaleza',
    'La invención de la naturaleza (caps. 6-8, expedición ecuatoriana)',
    'book',
    'https://www.casadellibro.com/libro-la-invencion-de-la-naturaleza/9788430618088/3052193',
    'Andrea Wulf',
    '6',
    'Biografía de Humboldt premiada (Royal Society Science Book Award). Lectura: caps. 6-8 (expedición ecuatoriana, ascenso al Chimborazo, concepción del Naturgemälde). ~80 páginas.',
    5.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-batalla-pichincha',
    'La Batalla de Pichincha: victoria decisiva 24 de mayo 1822',
    'video',
    'https://www.youtube.com/watch?v=DeVidkRepzM',
    NULL,
    '6',
    'Video sobre la batalla del Pichincha (Sucre vs Aymerich) que cierra la independencia de la Audiencia de Quito e integra el territorio a la Gran Colombia. Complemento directo a la Entrevista de Guayaquil (R3 Fase 1).',
    0.5,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-icaza-huasipungo',
    'Huasipungo',
    'book',
    'https://es.wikipedia.org/wiki/Huasipungo',
    'Jorge Icaza',
    '6',
    'Novela indigenista canónica (1934) de Jorge Icaza, una de las más traducidas de Latinoamérica (40 idiomas). Describe el sistema del huasipungo (parcela que el indígena cultiva a cambio de trabajo forzado para el terrateniente). Ficción literaria; se lee en paralelo con Ayala Mora para contrastar narrativa y estructura.',
    7.0,
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
  ('travel-r-ayala-mora-resumen-historia',      'travel-f6-revolucion-liberal-alfaro',  FALSE),
  ('travel-r-paz-y-mino-cacao',                 'travel-f6-cacao-pepa-oro',             FALSE),
  ('travel-r-feriado-bancario-dolarizacion',    'travel-f6-crisis-dolarizacion',        FALSE),
  ('travel-r-primicias-25-anos-dolarizacion',   'travel-f6-crisis-dolarizacion',        FALSE),
  ('travel-r-ig-epn-volcanes',                  'travel-f6-avenida-volcanes',           FALSE),
  ('travel-r-wulf-invencion-naturaleza',        'travel-f6-avenida-volcanes',           FALSE),
  ('travel-r-batalla-pichincha',                'travel-f6-quito-colonial',             FALSE),
  ('travel-r-icaza-huasipungo',                 'travel-f6-movimiento-indigena-conaie', FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
