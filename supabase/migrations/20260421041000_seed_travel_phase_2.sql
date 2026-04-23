-- ============================================================================
-- Travel track — Phase 2 (Colombia Caribe y Darién) canonical seed
-- Source of truth: docs/travel-track/phase-2-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f2-geografia-caribe',
    'Geografía del Caribe colombiano y Sierra Nevada de Santa Marta',
    'caribe-colombiano-sierra-nevada',
    'El Caribe colombiano es una planicie aluvial dominada por tres sistemas fluviales (Magdalena, Cauca-Sinú, Atrato) que desembocan en una costa de bahías protegidas (Cartagena, Morrosquillo, Urabá). En el centro-este de esta llanura emerge la Sierra Nevada de Santa Marta: un macizo piramidal aislado de 5.775 m (picos Cristóbal Colón y Simón Bolívar) a solo 42 km de la línea de costa, lo que la convierte en la montaña costera más alta del mundo y en un sistema con todos los pisos ecológicos — manglar, bosque seco tropical, bosque de niebla, páramo, glaciar — comprimidos en una transversal cortísima. Geológicamente es un "bloque" desplazado de los Andes (acreción cretácica sobre el Caribe) y no parte de la cordillera andina propiamente. Esta geometría explica simultáneamente la densidad de la cultura Tayrona pre-colombina (aprovechamiento vertical de pisos), la supervivencia actual de los pueblos Kogi-Arhuaco-Wiwa-Kankuamo (la Línea Negra protege el perímetro sagrado) y la función estratégica de Santa Marta como primera ciudad española fundada en el territorio (1525).',
    '2',
    'travel'
  ),
  (
    'travel-f2-cartagena-colonial',
    'Cartagena de Indias: puerto esclavista y fortificación de la Flota',
    'cartagena-puerto-esclavista-fortificaciones',
    'Cartagena, fundada el 1 de junio de 1533 por Pedro de Heredia, se consolida como uno de los tres puertos habilitados por la Corona para el comercio atlántico (junto a Veracruz y Portobelo) y sede del asiento de negros entre 1595 y 1789 — durante ese período ingresaron por su puerto ~150.000–200.000 africanos esclavizados, y Cartagena fue el mercado humano más grande de la América española. La ciudad es simultáneamente (a) centro económico de la trata — con la Casa del Cabildo y los corrales de esclavos en lo que hoy es Getsemaní; (b) nodo defensivo de la Flota de Tierra Firme, que justifica el sistema de fortificaciones más grande del Nuevo Mundo: 11 km de murallas, los fuertes de San Felipe de Barajas (1657), San Fernando, San José, San Luis de Bocachica; (c) sede del Tribunal de la Inquisición desde 1610 (tercero de América después de Lima y México); y (d) único puerto americano que resistió exitosamente el mayor asalto británico del siglo XVIII — el sitio de Edward Vernon de 1741, derrotado por Blas de Lezo "el Mediohombre". Cartagena es la infraestructura de piedra que el imperio español construyó para proteger el canal que drenaba plata de Potosí vía Magdalena y para procesar los cuerpos humanos que sostenían ese sistema.',
    '2',
    'travel'
  ),
  (
    'travel-f2-palenque-cimarronaje',
    'Trata atlántica y Palenque: Benkos Biohó y el cimarronaje',
    'palenque-bioho-cimarronaje',
    'La trata transatlántica introdujo a la Nueva Granada entre 1580 y 1810 cerca de medio millón de africanos esclavizados, mayoritariamente por Cartagena. Desde los primeros años hubo fugas: los cimarrones fundaban palenques — aldeas fortificadas en zonas de difícil acceso (Montes de María, serranía de San Lucas, cuenca del Dique) desde donde negociaban con las autoridades coloniales. El caso canónico es San Basilio de Palenque, fundado hacia 1600 por Benkos Biohó (probablemente un noble africano de origen Bijagó, capturado y escapado del puerto de Cartagena) y reconocido por la Corona en 1713 (Real Cédula de Felipe V tras el fracaso de expediciones punitivas) como "villa libre" — primera comunidad afrodescendiente legalmente autónoma de América. San Basilio mantiene hasta hoy la lengua palenquera (único criollo de base léxica española del mundo, con sustrato kikongo/kimbundu — Patrimonio Inmaterial UNESCO 2005); el sistema de ma-kuagro (grupos de edad); los lumbalú (rituales funerarios); y prácticas musicales (bullerengue, champeta de la vieja guardia) que se proyectan hacia toda la costa caribe.',
    '2',
    'travel'
  ),
  (
    'travel-f2-santa-marta-tayrona',
    'Santa Marta, Tayrona y Ciudad Perdida (Teyuna)',
    'santa-marta-tayrona-teyuna',
    'Santa Marta, fundada por Rodrigo de Bastidas el 29 de julio de 1525, es la ciudad española continental más antigua de Sudamérica y la cabeza de puente que lanzó la expedición de Jiménez de Quesada al Altiplano Cundiboyacense (1536–1538). Sobre las laderas de la Sierra se asentaba desde el siglo VIII la cultura Tayrona — federación de cacicazgos con poblados urbanos complejos (Pueblito/Chairama, Buritaca/Teyuna rebautizada "Ciudad Perdida") construidos en terrazas de piedra con escaleras, canales de drenaje y plazas ceremoniales entre los 900 y 1.200 m. Teyuna, fundada hacia el 800 d.C. y abandonada a fines del siglo XVI tras el colapso demográfico por viruela y guerras con los españoles, fue "redescubierta" por guaqueros en 1972 y excavada oficialmente por el ICAN desde 1976. Los actuales pueblos Kogi, Arhuaco (Iku), Wiwa y Kankuamo son descendientes directos de los Tayrona y sostienen una cosmovisión en la que la Sierra es el corazón del mundo: la Línea Negra (Resolución 837 de 1995, ampliada por Decreto 1500 de 2018) delimita un perímetro sagrado de 348 sitios alrededor del macizo. En la Quinta de San Pedro Alejandrino muere Simón Bolívar el 17 de diciembre de 1830.',
    '2',
    'travel'
  ),
  (
    'travel-f2-barranquilla-fluvial',
    'Barranquilla y la apertura fluvial del siglo XIX',
    'barranquilla-apertura-fluvial-siglo-xix',
    'Barranquilla es una anomalía del Caribe hispanoamericano: no es una fundación colonial — no tiene muralla, no tiene fuerte, no tiene cabildo de los Habsburgo — sino un villorrio de pescadores que se convierte en ciudad republicana en el siglo XIX. Entre 1870 y 1930 Barranquilla desplaza económicamente a Cartagena por tres factores convergentes: (a) la habilitación del puerto sobre el Magdalena (1849, Tomás Cipriano de Mosquera) rompe el monopolio cartagenero y convierte a Barranquilla en la boca del río; (b) la llegada de los vapores fluviales (desde 1823, David Hoadley) acorta a 10 días el viaje Barranquilla-Honda que antes tardaba 40; (c) el ferrocarril Bolívar (1871) y el Muelle de Puerto Colombia (1888–1893) permiten la transferencia carga-vapor-marítimo sin roturas. Barranquilla recibe entre 1880 y 1930 una inmigración libanesa, judía, italiana y alemana que construye una elite comercial moderna, funda la primera aviación comercial de América (SCADTA, 1919, hoy Avianca) y consolida una identidad cosmopolita de "puerta de oro" — la base material sobre la que se edifica el Carnaval de Barranquilla (Patrimonio Inmaterial UNESCO 2003), Gabriel García Márquez como periodista de El Heraldo y el "Grupo de Barranquilla".',
    '2',
    'travel'
  ),
  (
    'travel-f2-vallenato-cumbia',
    'Música caribe: vallenato, cumbia y mestizaje triétnico',
    'vallenato-cumbia-mestizaje-trietnico',
    'La música del Caribe colombiano es el caso más claro de síntesis triétnica (indígena + africana + europea) del continente. (a) La cumbia — forma madre, siglo XVII-XVIII en la depresión momposina — combina la gaita (flauta vertical indígena de los kogi/zenú), el tambor alegre y el llamador (membranófonos africanos) y la melodía pentatónica reinterpretada a partir de formas europeas; el cortejo danzado con velas es iconográfico del formato. (b) El vallenato cristaliza en los valles del río Cesar y La Guajira a fines del siglo XIX cuando el acordeón diatónico alemán — llegado vía Riohacha y Curazao — se incorpora a la caja vallenata (tambor africano corto) y la guacharaca (raspador indígena) formando el trío canónico, y el repertorio se organiza en cuatro "aires" (son, paseo, merengue, puya). Rafael Escalona (1927-2009) lo institucionaliza como literatura oral y el Festival de la Leyenda Vallenata (Valledupar, desde 1968) lo canoniza; García Márquez dijo que Cien años de soledad era "un vallenato de 400 páginas" y el vallenato entra a UNESCO como Patrimonio Inmaterial en 2015. (c) La champeta de Cartagena es la capa posterior: música afro-colombiana reurbanizada desde los palenques y los barrios populares a partir de los años 70 con influencia soukous/highlife africano reimportado por los picós.',
    '2',
    'travel'
  ),
  (
    'travel-f2-darien-tapon',
    'Tapón del Darién: geología, selva y corredor migratorio',
    'tapon-darien-geologia-migracion',
    'El Darién es el istmo selvático de ~160 km que separa Colombia de Panamá entre el golfo de Urabá y el golfo de San Miguel. Es geológicamente el lugar donde los arcos volcánicos de Centroamérica y Sudamérica se soldaron hace aproximadamente 3 millones de años (Gran Intercambio Biótico Americano), y desde entonces concentra una biodiversidad enorme en un sistema de selvas, ciénagas y montañas bajas (serranía del Baudó, serranía de Darién). La Carretera Panamericana, que en teoría conecta Prudhoe Bay con Ushuaia a lo largo de ~48.000 km, tiene aquí su única discontinuidad — el Tapón del Darién — preservada intencionalmente por razones sanitarias (fiebre aftosa), ambientales (Parques Nacionales Darién Panamá 1980, UNESCO 1981; Katíos Colombia 1974, UNESCO 1994) y de soberanía. Desde 2021 el Darién es el principal corredor migratorio del hemisferio occidental: el paso anual de migrantes creció de ~8.000 en 2020 a 248.000 en 2022 y un récord de 520.000 en 2023, con ruta Necoclí → Capurganá/Acandí → cruce selvático → Bajo Chiquito/San Vicente → Ciudad de Panamá, bajo control del Clan del Golfo. El Darién es hoy simultáneamente reserva biológica crítica, frontera interestatal activa y la mayor crisis humanitaria de las Américas.',
    '2',
    'travel'
  ),
  (
    'travel-f2-guna-yala',
    'Guna Yala (Kuna): autonomía indígena binacional',
    'guna-yala-autonomia-indigena',
    'Los Guna (antes transliterados Kuna o Cuna) son el pueblo indígena que habita el archipiélago de San Blas y la franja costera caribe entre el Darién colombiano y el golfo de San Blas panameño — 365 islas de las cuales ~49 están habitadas. Tras la independencia de Panamá (1903) y los intentos panameños de "civilizar" las islas (policía colonial, prohibición de la mola y el saburet, imposición de escuela hispana), los Guna declararon la República de Tule el 21 de febrero de 1925 bajo liderazgo de Nele Kantule y Simral Colman. La rebelión terminó con mediación estadounidense (acorazado Cleveland) y el Tratado Guna-Panameño de 1938 que reconoció la Comarca Guna Yala — primera autonomía indígena constitucionalmente reconocida de América Latina. El gobierno interno funciona con los Congresos Generales (Culturales y Políticos) que se reúnen en la casa del congreso, toman decisiones por consenso y aplican el derecho propio; el territorio está cerrado a propiedad privada no-guna. En el lado colombiano (municipio de Acandí, Chocó) viven ~2.500 Guna adicionales en los resguardos de Arquía y Caimán Nuevo. El caso Guna es el contraste más claro con el Darién: una autonomía indígena sólida contra un corredor migratorio sin soberanía efectiva — ambos en el mismo bloque continental.',
    '2',
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
  ('travel-f2-geografia-caribe',      'travel-geo-sudamerica'),
  ('travel-f2-cartagena-colonial',    'travel-f1-virreinatos'),
  ('travel-f2-cartagena-colonial',    'travel-f1-potosi'),
  ('travel-f2-cartagena-colonial',    'travel-f1-rutas-coloniales'),
  ('travel-f2-palenque-cimarronaje',  'travel-f2-cartagena-colonial'),
  ('travel-f2-santa-marta-tayrona',   'travel-f2-geografia-caribe'),
  ('travel-f2-santa-marta-tayrona',   'travel-f1-pueblos-precolombinos'),
  ('travel-f2-santa-marta-tayrona',   'travel-f1-independencias'),
  ('travel-f2-barranquilla-fluvial',  'travel-f2-cartagena-colonial'),
  ('travel-f2-barranquilla-fluvial',  'travel-f1-rutas-coloniales'),
  ('travel-f2-vallenato-cumbia',      'travel-f2-palenque-cimarronaje'),
  ('travel-f2-vallenato-cumbia',      'travel-f2-barranquilla-fluvial'),
  ('travel-f2-darien-tapon',          'travel-f2-geografia-caribe'),
  ('travel-f2-guna-yala',             'travel-f2-darien-tapon'),
  ('travel-f2-guna-yala',             'travel-f1-pueblos-precolombinos')
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
    'travel-r-munera-fronteras-caribe',
    'Fronteras imaginadas: la formación de la región Caribe colombiana',
    'book',
    'https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/163',
    'Alfonso Múnera Cavadía',
    '2',
    'Múnera es EL historiador que reformuló la historiografía colombiana mostrando que el Caribe no es folclore periférico sino matriz fundacional. URL apunta a El fracaso de la nación (Banrepcultural, 1998) — libro previo disponible en digital; Fronteras imaginadas (Planeta, 2005) es el libro maduro del programa.',
    7.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cartagena-trata-atlantica',
    'Cartagena como puerto negrero y la trata atlántica',
    'article',
    'https://enciclopedia.banrepcultural.org/index.php/Cartagena_como_puerto_negrero',
    'Banco de la República de Colombia — Enciclopedia Banrepcultural',
    '2',
    'Panorámica académica estatal colombiana sobre Cartagena como mercado humano central de la América española. Complementar con paper SciELO de Nicolás del Castillo Mathieu sobre cifras y artículo Credencial Historia sobre esclavos en la Nueva Granada.',
    3.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-palenque-bioho',
    'Ma Ngombe / De sol a sol — Palenque y estudios afro-colombianos',
    'book',
    'https://babel.banrepcultural.org/digital/collection/p17054coll10/search/searchterm/Nina%20Friedemann',
    'Nina S. de Friedemann',
    '2',
    'Friedemann (1930-1998) es la antropóloga fundadora de los estudios afro-colombianos. URL apunta a la colección digital de la Biblioteca Luis Ángel Arango. Complementar con declaratoria UNESCO 2005 del espacio cultural de San Basilio de Palenque.',
    5.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-teyuna-sierra-nevada',
    'Ciudad Perdida (Teyuna) y la Sierra Nevada — Aluna y los Hermanos Mayores',
    'video',
    'https://www.senalmemoria.co/articulos/los-hermanos-mayores-kogui-documental',
    'Señal Memoria / RTVC — complemento Aluna (Alan Ereira, 2012)',
    '2',
    'Aluna (Ereira, 2012) es la continuación de From the Heart of the World: The Elder Brothers Warning (BBC, 1990) — los Kogi aceptan por segunda vez romper su aislamiento para enviar un mensaje al hermano menor. Referencia audiovisual canónica. Complementar con informe ICANH sobre el parque Teyuna.',
    3.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-gabo-macondo-caribe',
    'Vivir para contarla (caps. Aracataca y Barranquilla)',
    'book',
    'https://archive.org/details/garcia-marquez-gabriel.-vivir-para-contarla-ocr-2002',
    'Gabriel García Márquez',
    '2',
    'Memorias del propio Gabo (Mondadori, 2002) — entrada más honesta a Aracataca, al viaje fundacional Barranquilla-Aracataca con su madre, al Grupo de Barranquilla y a los años del Heraldo. Complementar con biografía de Gerald Martin (2009) como contraparte crítica.',
    10.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-vallenato-documental',
    'Vallenato: Patrimonio de la Humanidad (Señal Memoria)',
    'video',
    'https://www.senalmemoria.co/articulos/vallenato-patrimonio-humanidad-unesco',
    'Señal Memoria / RTVC',
    '2',
    'Archivo audiovisual estatal colombiano sobre la tradición vallenata y su reconocimiento UNESCO 2015 (lista de Salvaguardia Urgente). Complementar con la ficha UNESCO y, opcionalmente, el documental El acordeón del diablo (Stefan Schwietert, 2000).',
    2.5,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-darien-migracion',
    'Tapón del Darién: crisis migratoria y ambiental (Mongabay + ICG + El País)',
    'article',
    'https://es.mongabay.com/2023/11/selva-del-darien-migrantes-cambian-ecosistemas/',
    'Mongabay Latam + International Crisis Group + El País América',
    '2',
    'Triangulación de periodismo ambiental (Mongabay: deforestación, impacto sobre Katíos), geopolítico (ICG: Clan del Golfo, gobernanza) y testimonial (El País). El parque Katíos fue UNESCO 1994 y entró en la Lista de Patrimonio en Peligro 2009-2015 por tala ilegal.',
    3.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-guna-yala-autonomia',
    'Un pueblo que no se arrodillaba: Panamá, EE.UU. y los Kunas de San Blas',
    'book',
    'https://www.jstor.org/stable/25675790',
    'James Howe (MIT)',
    '2',
    'Libro de James Howe (Plumsock Mesoamerican Studies / CIRMA, 2004; original inglés 1998) es la referencia académica sobre la revolución Tule 1925 y la autonomía Guna Yala. URL apunta a paper JSTOR que sintetiza el caso; alternativa desde la voz interna: Nan Garburred (Aiban Wagua, 2007).',
    6.0,
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
  ('travel-r-munera-fronteras-caribe',      'travel-f2-cartagena-colonial',     FALSE),
  ('travel-r-cartagena-trata-atlantica',    'travel-f2-palenque-cimarronaje',   FALSE),
  ('travel-r-palenque-bioho',               'travel-f2-palenque-cimarronaje',   FALSE),
  ('travel-r-teyuna-sierra-nevada',         'travel-f2-santa-marta-tayrona',    FALSE),
  ('travel-r-gabo-macondo-caribe',          'travel-f2-barranquilla-fluvial',   FALSE),
  ('travel-r-vallenato-documental',         'travel-f2-vallenato-cumbia',       FALSE),
  ('travel-r-darien-migracion',             'travel-f2-darien-tapon',           FALSE),
  ('travel-r-guna-yala-autonomia',          'travel-f2-guna-yala',              FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
