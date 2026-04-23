-- ============================================================================
-- Travel track — Phase 10 (Chile, sur a norte) canonical seed
-- ----------------------------------------------------------------------------
-- Source of truth: docs/travel-track/phase-10-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f10-patagonia-canoeros',
    'Patagonia chilena y pueblos canoeros',
    'patagonia-chilena-pueblos-canoeros',
    'Los archipiélagos del extremo sur chileno fueron habitados durante más de 6.000 años por pueblos canoeros — kawésqar (alacalufes) y yagán (yámana) en los canales fueguinos, selk''nam terrestres en Tierra del Fuego — adaptados al clima subantártico con tecnología marina muy anterior a cualquier contacto europeo. Entre 1880 y 1910 estos pueblos fueron virtualmente exterminados por una combinación de enfermedades, misiones anglicanas y salesianas, y cacería sistemática por parte de estancieros laneros que pagaban por oreja selk''nam. La categoría "último confín de la tierra" (Bridges) es el marcador literario canónico de este mundo y su destrucción.',
    '10',
    'travel'
  ),
  (
    'travel-f10-patagonia-lanera',
    'Puerto Natales, Torres del Paine y ganadería lanera',
    'patagonia-lanera-torres-del-paine',
    'El macizo del Paine es un laccolito granítico de ~12,5 millones de años intrusionado en rocas sedimentarias cretácicas, esculpido por los glaciares del último máximo glacial (17.000 a 12.000 años atrás) que le dieron sus torres, cuernos y lagos proglaciares (Grey, Pehoé). Sobre ese paisaje, a fines del siglo XIX, se monta una economía lanera basada en latifundios — la Sociedad Explotadora de Tierra del Fuego controlaba millones de hectáreas — que fue el escenario de las huelgas patagónicas chilenas de 1920-21, contemporáneas y menos recordadas que las argentinas del lado oriental.',
    '10',
    'travel'
  ),
  (
    'travel-f10-chiloe',
    'Chiloé y el archipiélago del sur hispanohablante',
    'chiloe-archipielago-sur',
    'Chiloé fue la última posesión española en Sudamérica en caer (1826, catorce años después de la independencia del Chile continental) por su condición insular y su lealtad a la corona. Su aislamiento produjo una cultura mestiza particular: iglesias de madera construidas sin un solo clavo por carpinteros chilotes sobre plantillas jesuíticas (16 de ellas Patrimonio UNESCO desde 2000), mitología propia (Trauco, Caleuche, Pincoya) que sincretiza creencias huilliches y españolas, y una economía basada en papa (más de 400 variedades nativas), pesca artesanal y emigración estacional. Chiloé es el "punto cero" cultural entre la zona central chilena y la Patagonia austral.',
    '10',
    'travel'
  ),
  (
    'travel-f10-mapuche-araucania',
    'Mapuche y la Araucanía: frontera hasta 1881',
    'mapuche-araucania-frontera',
    'Los mapuche (o reche) resistieron tanto al imperio inca (frontera natural del Tawantinsuyu sobre el río Maule) como al imperio español durante tres siglos, manteniendo territorio autónomo al sur del Biobío mediante el sistema de parlamentos (tratados reconocidos por la corona). Solo tras la independencia, entre 1861 y 1883, el Estado chileno emprende la "Pacificación de la Araucanía" — eufemismo para ocupación militar, reducción a comunidades y remate de tierras a colonos europeos. El conflicto actual (CAM, Coordinadora Arauco Malleco; Temucuicui; reclamos territoriales 2020-2025) es la continuación histórica de esa ruptura y su contemporaneidad con la Conquista del Desierto argentina no es casualidad.',
    '10',
    'travel'
  ),
  (
    'travel-f10-valdivia-terremoto',
    'Valdivia y el terremoto de 1960',
    'valdivia-terremoto-1960',
    'Valdivia fue fundada en 1552 por Pedro de Valdivia como plaza militar clave para el control del Pacífico sur; su sistema de fuertes (Corral, Niebla, Mancera) la convirtió en la llave defensiva del imperio español hasta que los corsarios holandeses la tomaron brevemente en 1643. El 22 de mayo de 1960 sufrió el mayor terremoto instrumentalmente registrado en la historia de la humanidad: 9,5 Mw, liberando ~25% de la energía sísmica global del siglo XX, con tsunami que cruzó el Pacífico y causó víctimas en Japón, Hawái y Filipinas. El evento es el caso canónico mundial para estudiar subducción de la placa de Nazca y riesgo sísmico interplaca, y reconfiguró Valdivia física y demográficamente.',
    '10',
    'travel'
  ),
  (
    'travel-f10-santiago-modelo-chileno',
    'Santiago, Allende, Pinochet y el "modelo chileno"',
    'santiago-allende-pinochet-modelo',
    'El valle central (Santiago, Rancagua, Talca) concentra desde el siglo XVI la población y la agricultura chilenas, y desde 1880 la industria y el aparato estatal. La elección de Salvador Allende en 1970 (primera vez en el mundo que un marxista llega al poder por vía electoral) y el golpe de Pinochet del 11 de septiembre de 1973 convirtieron a Chile en el primer laboratorio neoliberal del planeta: los Chicago Boys, formados por Milton Friedman en la U. de Chicago vía el "proyecto Chile" de los 50s, aplicaron desde 1975 privatizaciones, apertura comercial, sistema de AFP y retiro del Estado en un régimen de terror que produjo 3.200 muertos/desaparecidos y ~40.000 torturados (Informe Rettig, Informe Valech). Plebiscito 1988, transición "pactada", y 30 años después el estallido social de octubre 2019 abre la ventana del proceso constituyente fallido 2022 (rechazo 62%) que reinstala la discusión pendiente sobre ese modelo.',
    '10',
    'travel'
  ),
  (
    'travel-f10-atacama-salitre-cobre',
    'Atacama, salitre, cobre y la Guerra del Pacífico',
    'atacama-salitre-cobre-guerra-pacifico',
    'El desierto de Atacama — el más árido del mundo, producto combinado de la corriente fría de Humboldt, el anticiclón subtropical del Pacífico y la sombra orográfica andina — fue durante el siglo XIX boliviano y peruano. La extracción del salitre (fertilizante y precursor de explosivos) a partir de 1860 generó una economía dirigida por capitales ingleses y chilenos en territorio ajeno; el intento boliviano de subir impuestos a la Compañía de Salitres de Antofagasta en 1878 desencadenó la Guerra del Pacífico (1879-1884), que dejó a Bolivia sin mar, a Perú sin Tarapacá y a Chile con el 40% del territorio actual. El ciclo del salitre colapsa con la síntesis Haber-Bosch (1913) y es reemplazado por el cobre: Chuquicamata (1915, Anaconda/Kennecott) se nacionaliza con Allende en 1971 y Codelco pasa a financiar una parte sustancial del Estado chileno hasta hoy.',
    '10',
    'travel'
  ),
  (
    'travel-f10-atacama-valparaiso',
    'San Pedro de Atacama y Valparaíso: cierre en dos puertos simbólicos',
    'san-pedro-atacama-valparaiso',
    'Cierre de fase en dos puertos simbólicos. (a) San Pedro de Atacama es el oasis central del pueblo likan antai (atacameños), con ocupación continua desde hace ~11.000 años: Aldea de Tulor (circular, 800 a.C.), Pukará de Quitor (fortaleza del siglo XII tomada por Pedro de Valdivia en 1540), y hoy comunidades que disputan con Codelco y SQM el litio del Salar de Atacama. (b) Valparaíso fue el puerto más importante del Pacífico sur entre 1880 y 1914: apogeo económico cuando todo barco que iba de Europa a California pasaba por el Estrecho de Magallanes; la apertura del Canal de Panamá en 1914 lo mató comercialmente pero preservó su trama urbana de cerros, ascensores y arquitectura inmigrante (alemana, inglesa, italiana, croata) que la UNESCO declaró Patrimonio en 2003. Valparaíso es la contracara civil del Santiago oligárquico.',
    '10',
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
  ('travel-f10-patagonia-canoeros',       'travel-f1-pueblos-precolombinos'),
  ('travel-f10-patagonia-lanera',         'travel-f10-patagonia-canoeros'),
  ('travel-f10-patagonia-lanera',         'travel-geo-sudamerica'),
  ('travel-f10-chiloe',                   'travel-f1-virreinatos'),
  ('travel-f10-mapuche-araucania',        'travel-f1-pueblos-precolombinos'),
  ('travel-f10-mapuche-araucania',        'travel-f10-chiloe'),
  ('travel-f10-valdivia-terremoto',       'travel-geo-sudamerica'),
  ('travel-f10-valdivia-terremoto',       'travel-f1-virreinatos'),
  ('travel-f10-santiago-modelo-chileno',  'travel-f10-chiloe'),
  ('travel-f10-santiago-modelo-chileno',  'travel-f10-mapuche-araucania'),
  ('travel-f10-santiago-modelo-chileno',  'travel-f1-divergencia-poscolonial'),
  ('travel-f10-atacama-salitre-cobre',    'travel-geo-sudamerica'),
  ('travel-f10-atacama-salitre-cobre',    'travel-f1-potosi'),
  ('travel-f10-atacama-valparaiso',       'travel-f10-santiago-modelo-chileno'),
  ('travel-f10-atacama-valparaiso',       'travel-f10-atacama-salitre-cobre')
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
    'travel-r-bridges-confin-tierra',
    'El último confín de la Tierra (caps. selección)',
    'book',
    'https://archive.org/details/lucas-bridges-e.-el-ultimo-confin-de-la-tierra-ocr-1952',
    'E. Lucas Bridges',
    '10',
    'Testimonio etnográfico de primera mano (1948/1952) — Bridges creció entre selk''nam como hijo del misionero anglicano fundador de Ushuaia. Libro canónico; leer con crítica poscolonial (revisión de Anne Chapman). Lectura: Prólogo + Parte I + capítulos sobre selk''nam y yagán (~200 pp).',
    10.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-boton-nacar',
    'El botón de nácar (2015)',
    'video',
    'https://www.youtube.com/watch?v=SgLZUwqcHDQ',
    'Patricio Guzmán',
    '10',
    'Documental de Patricio Guzmán (Oso de Plata, Berlín 2015). Segunda parte de su trilogía sobre Chile (Nostalgia de la luz → El botón de nácar → La cordillera de los sueños). Conecta pueblos canoeros con desaparecidos del Pinochetato a través del agua.',
    1.5,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-araucania-memoria-chilena',
    'Ocupación militar y colonización de la Araucanía (1851-1883)',
    'article',
    'https://www.memoriachilena.gob.cl/602/w3-article-3630.html',
    'Memoria Chilena — Biblioteca Nacional de Chile',
    '10',
    'Memoria Chilena es el portal académico de la Biblioteca Nacional — fuente primaria y análisis historiográfico en el mismo sitio. Cubrir también la entrada paralela sobre el movimiento mapuche y el Estado en el siglo XX.',
    1.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-batalla-chile-golpe',
    'La Batalla de Chile, Parte II: El golpe de Estado (1977)',
    'video',
    'https://www.youtube.com/watch?v=9b_gXhnZDEU',
    'Patricio Guzmán — Equipo Tercer Año',
    '10',
    'Segunda parte de la trilogía La Batalla de Chile (1975-79), filmada en tiempo real durante el gobierno de la Unidad Popular. Considerada la mejor película documental política del siglo XX.',
    1.5,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-chicago-boys-paper',
    'Chicago Boys en Chile: neoliberalismo, saber experto y el auge de una nueva tecnocracia',
    'article',
    'https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0185-19182019000100139',
    'Revista Mexicana de Ciencias Políticas y Sociales (UNAM) — SciELO',
    '10',
    'Paper académico peer-reviewed indexado en SciELO con acceso abierto. Cobertura histórico-política de los Chicago Boys en Chile como laboratorio neoliberal global.',
    1.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-neruda-canto-general',
    'Canto General (fragmentos: Alturas de Macchu Picchu + La tierra se llama Juan)',
    'book',
    'https://archive.org/details/PabloNerudaCantoGeneral',
    'Pablo Neruda',
    '10',
    'Neruda escribió Canto General en clandestinidad huyendo de González Videla en 1948-49. Lectura: "Alturas de Macchu Picchu" (12 poemas, ~30 pp) + "La tierra se llama Juan" (retratos obreros salitreros y mineros) + "Que despierte el leñador". ~100 páginas totales.',
    3.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-valdivia-60-anos',
    'La tragedia de Valdivia: 60 años del gran terremoto',
    'video',
    'https://www.youtube.com/watch?v=r0NBGNwLHzw',
    'TVN Chile — Reportajes',
    '10',
    'Documental TVN Chile (2020, aniversario 60) con testimonios de sobrevivientes y reconstrucción científica del sismo 9,5 Mw del 22 de mayo de 1960.',
    0.75,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-likan-antai',
    'Licán Antai (atacameños) — Memoria Chilena + paper Estudios Atacameños',
    'article',
    'https://www.memoriachilena.gob.cl/602/w3-article-722.html',
    'Memoria Chilena (Biblioteca Nacional de Chile) + Estudios Atacameños (UCN)',
    '10',
    'Panorámica de Memoria Chilena sobre los likan antai complementada con paper académico de Estudios Atacameños (revista de la Universidad Católica del Norte) sobre arquitectura tradicional en Ayquina, Caspana y Toconce.',
    1.5,
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
  ('travel-r-bridges-confin-tierra',         'travel-f10-patagonia-canoeros',      FALSE),
  ('travel-r-boton-nacar',                   'travel-f10-patagonia-canoeros',      FALSE),
  ('travel-r-araucania-memoria-chilena',     'travel-f10-mapuche-araucania',       FALSE),
  ('travel-r-batalla-chile-golpe',           'travel-f10-santiago-modelo-chileno', FALSE),
  ('travel-r-chicago-boys-paper',            'travel-f10-santiago-modelo-chileno', FALSE),
  ('travel-r-neruda-canto-general',          'travel-f10-atacama-salitre-cobre',   FALSE),
  ('travel-r-valdivia-60-anos',              'travel-f10-valdivia-terremoto',      FALSE),
  ('travel-r-likan-antai',                   'travel-f10-atacama-valparaiso',      FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
