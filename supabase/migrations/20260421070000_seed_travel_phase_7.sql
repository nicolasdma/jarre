-- ============================================================================
-- Travel track — Phase 7 (Costa Peruana) canonical seed
-- Source of truth: docs/travel-track/phase-7-brief.md
-- Note: Chavín appears twice — here as pan-Andean iconographic matrix
-- (travel-f7-chavin-matriz); in F8 as the physical archaeological site
-- (travel-f8-chavin-sitio). Distinct IDs, no collision.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f7-geografia-costa',
    'Geografía de la costa peruana: desierto, Humboldt y valles transversales',
    'geografia-costa-peruana-humboldt',
    'La costa peruana es una franja desértica de ~2.500 km de largo y 40–80 km de ancho entre el Pacífico y los Andes, una de las zonas más áridas del planeta. Su régimen climático se explica por la Corriente de Humboldt (o del Perú) — aguas frías que suben desde la Antártida enfriando el aire costero, produciendo inversión térmica, cielos cubiertos ("garúa" limeña) y prácticamente cero precipitaciones. Esta aridez habría impedido la civilización de no ser por los valles transversales: ~53 ríos estacionales que bajan de los Andes, cortan el desierto y forman oasis angostos pero fértiles (Chira, Piura, La Leche, Lambayeque, Moche, Chicama, Santa, Rímac, Ica, Nazca). Cada valle es una "isla" de vida con su propia cultura prehispánica; todo pueblo costero mayor está en un valle. La Humboldt además sostiene una de las pesquerías más productivas del planeta (anchoveta) que alimentó comunidades desde Caral (3.000 a.C.). El fenómeno ENOS (El Niño) rompe periódicamente esta lógica: lluvias torrenciales en el norte, colapso de la pesquería — los meganiños de ~600 y ~1100 d.C. están correlacionados con el colapso Moche tardío y la reconfiguración Lambayeque/Chimú.',
    '7',
    'travel'
  ),
  (
    'travel-f7-chavin-matriz',
    'Chavín de Huántar como matriz pan-andina (1200–200 a.C.)',
    'chavin-huantar-matriz-panandina',
    'Chavín de Huántar (valle del Mosna, Ancash, 3.180 m s.n.m.) es el centro ceremonial cuya iconografía — felinos, aves rapaces, serpientes, figura antropomorfa del Lanzón, Estela Raimondi, Obelisco Tello, cabezas clavas — se difunde entre ~1200 y ~200 a.C. por toda la sierra y la costa del Perú actual, definiendo lo que Luis Guillermo Lumbreras y Julio C. Tello llaman el Horizonte Temprano u "Horizonte Chavín". Por primera vez en los Andes existe un sistema simbólico compartido a escala pan-regional: la cerámica Cupisnique (costa norte), Paracas (costa sur) y los sitios de la sierra central reproducen motivos chavinoides con variaciones locales. Chavín no fue imperio militar ni Estado expansivo sino centro de peregrinación y oráculo — el Lanzón en la galería interior era consultado mediante ritual con plantas alucinógenas (San Pedro, Trichocereus pachanoi) por élites de distintas regiones. El programa arqueológico que desde 1995 dirige John Rick (Stanford) ha ampliado radicalmente la documentación: tres cabezas clavas nuevas en 2013, galerías subterráneas, sistema de canales para control acústico. Sin Chavín no hay cómo leer ni Moche, ni Paracas, ni Nazca — toda la iconografía costera posterior arrastra núcleos chavinoides. Nota: el sitio físico y su arqueología detallada van en F8 (Cordillera Blanca); aquí Chavín entra como matriz iconográfica que estructura la costa.',
    '7',
    'travel'
  ),
  (
    'travel-f7-moche',
    'Moche (100–800 d.C.): Sipán, Huacas del Sol y la Luna, Tema del Sacrificio',
    'moche-sipan-huacas-iconografia',
    'Los Moche (o Mochica) son la gran civilización de la costa norte peruana entre ~100 y ~800 d.C., con dos focos: Moche Sur (valles Moche-Chicama, capital en las Huacas del Sol y de la Luna cerca de Trujillo) y Moche Norte (valles Jequetepeque-Lambayeque, con Sipán y San José de Moro). Arquitectura: pirámides truncadas de adobe (huacas) con murales polícromos que representan el Tema del Sacrificio (Christopher Donnan) — combate ritual entre guerreros para capturar al vencido, presentación del prisionero al Señor de los Túmi, sangrado ritual y ofrenda de sangre. La cerámica escultórica Moche es la más realista del Perú prehispánico: retratos individuales, escenas eróticas, de enfermedad, de trabajo. El 20 de julio de 1987, Walter Alva, alertado por el saqueo del huaquero Ernil Bernal, excavó en Huaca Rajada (Sipán) la primera tumba intacta de un gobernante de la América pre-inca: el Señor de Sipán, enterrado hacia 250 d.C. con ~600 piezas de oro, plata, cobre y spondylus; el hallazgo es equiparable al de Tutankamón y reorganizó la lectura académica del Perú pre-inca. El colapso Moche tardío (siglos VI–VIII) se correlaciona con un meganiño hacia 600 d.C. documentado por estratigrafía y con reconfiguración política hacia el norte que deriva en Lambayeque/Sicán. El Museo Tumbas Reales de Sipán (Lambayeque, inaugurado 2002) custodia el ajuar.',
    '7',
    'travel'
  ),
  (
    'travel-f7-chimu',
    'Chimú (900–1470) y la conquista inca: Chan Chan y el corte del río Moche',
    'chimu-chan-chan-conquista-inca',
    'Entre ~900 y 1470 d.C. el reino Chimú (Chimor) domina la costa norte desde Tumbes hasta el valle de Huarmey (~1.000 km de costa), con capital en Chan Chan (valle del Moche, cerca de Trujillo, ~20 km²) — la ciudad de adobe más grande de la América prehispánica, inscrita en Patrimonio Mundial UNESCO el 28 de noviembre de 1986 en su Lista en Peligro. Arquitectura: diez ciudadelas amuralladas (Tschudi, Rivero, Uhle, Laberinto etc.), cada una residencia del inca chimú y necrópolis tras su muerte (principio dinástico de "hijos construyen, padres descansan"), más barrios populares alrededor. Economía: agricultura intensiva con canales (canal La Cumbre de 80 km entre valles Chicama-Moche), control del comercio del spondylus (concha roja sagrada traída del Ecuador — usada como moneda ritual), metalurgia en tumbaga y textilería. Michael Moseley y Carol Mackey inician la excavación sistemática en 1969 (proyecto Chan Chan-Moche Valley). La conquista inca por Túpac Yupanqui hacia 1470 se hace, según las crónicas (Cieza, Rostworowski), mediante bloqueo estratégico: se corta el agua del río Moche aguas arriba, Chan Chan no puede sostenerse en el desierto, el señor Minchanzaman capitula. La élite chimú es trasladada al Cusco como rehén-aprendiz y sus orfebres enseñan metalurgia a los incas. Hoy Chan Chan está en la Lista en Peligro de UNESCO por erosión eólica, saqueo y lluvias del Niño.',
    '7',
    'travel'
  ),
  (
    'travel-f7-lima-virreinal',
    'Lima virreinal y republicana: fundación 1535, terremoto 1746, Salazar Bondy',
    'lima-virreinal-republicana',
    'Francisco Pizarro funda la Ciudad de los Reyes el 18 de enero de 1535 en el valle del Rímac, a 12 km del Pacífico (acceso al Callao, que se convertirá en el puerto más importante del Pacífico sur hasta el siglo XVIII). Lima es capital del Virreinato del Perú desde 1542 — que incluye toda la América del Sur hispana hasta las reformas borbónicas — y por dos siglos concentra Audiencia, Inquisición (1569), Universidad de San Marcos (fundada 1551, la más antigua de América), Casa de Moneda y el circuito comercial Callao-Panamá-Sevilla. El terremoto del 28 de octubre de 1746 (magnitud ~8.6) destruye Lima y borra el Callao con un tsunami (se estiman 5.000–7.000 muertos, ~10% de la población), quebrando el esplendor barroco y forzando la reconstrucción bajo el virrey Manso de Velasco. Tras la independencia (San Martín 1821, Ayacucho 1824), Lima sigue concentrando política, burocracia y élite económica — la élite criolla limeña articula la república alrededor de guano, salitre y comercio. El ensayo fundacional para leer Lima es Lima la horrible de Sebastián Salazar Bondy (1964, México — toma título del poema de César Moro), que desmonta la "Arcadia colonial": el mito de una Lima virreinal idílica, aristocrática y cortés que oculta la servidumbre indígena y afro, la exclusión provinciana y la violencia estructural. Salazar Bondy es parte de la Generación del 50 junto con Blanca Varela, Jorge Eduardo Eielson y Javier Sologuren.',
    '7',
    'travel'
  ),
  (
    'travel-f7-guano-salitre-pacifico',
    'Guano, salitre y Guerra del Pacífico (1840–1884)',
    'guano-salitre-guerra-pacifico',
    'Entre ~1840 y 1879 el Perú republicano vive la era del guano: las islas guaneras del Pacífico sur (Chincha, Lobos, Guañape) acumulan millones de toneladas de excremento de aves marinas, fertilizante cotizado en Europa tras la revolución agrícola industrial. El Estado peruano vende concesiones (sistema de consignatarios, luego Contrato Dreyfus 1869) y por primera vez tiene ingresos fiscales masivos sin tributación indígena; con guano financia el primer ferrocarril sudamericano (Lima-Callao, 1851), la abolición de la esclavitud (1854, con indemnización a los amos), obras públicas y deuda externa creciente. Hacia 1860 el guano se agota y la economía vira al salitre de Tarapacá (nitrato de sodio, fertilizante y pólvora). El salitre entra en tensión con Bolivia (Antofagasta, Atacama) y Chile (que tiene capital inglés e infraestructura minera superior). La Guerra del Pacífico ("del Guano y del Salitre", 1879–1884) enfrenta a Chile contra Perú y Bolivia aliados: Chile arrasa. Fases: campaña marítima (combate de Angamos, muerte de Miguel Grau el 8 oct 1879), campaña de Tarapacá (1879), campaña de Lima (batallas de San Juan y Miraflores, ocupación de Lima 1881–1883, saqueo de la Biblioteca Nacional), resistencia de la Breña de Andrés A. Cáceres en la sierra. Tratado de Ancón (1883): Perú cede Tarapacá a perpetuidad y Tacna-Arica en cautiverio por 10 años (Tacna vuelve en 1929, Arica queda chilena). Bolivia pierde su salida al mar en el Pacto de Tregua de 1884. La obra canónica para leer el período es la Historia de la República del Perú de Jorge Basadre (16 tomos, 1939–1970).',
    '7',
    'travel'
  ),
  (
    'travel-f7-migracion-lima',
    'Migración andina a Lima (s. XX): Desborde popular y chicha',
    'migracion-andina-lima-desborde',
    'Entre 1940 y 2000 Lima pasa de ~600.000 a ~8.000.000 de habitantes por migración masiva desde la sierra (principalmente Ancash, Junín, Ayacucho, Apurímac, Cajamarca, Puno). Fases: (a) 1940–1960, migración rural-urbana "clásica" impulsada por crisis agraria, fracaso de la reforma previa a Velasco y servicio militar; surgen las primeras barriadas (San Martín de Porres, El Agustino). (b) 1961, fundación de Ciudad de Dios al sur, símbolo de las invasiones organizadas nocturnas con esteras y banderas. (c) 1971, fundación de Villa El Salvador por 200 familias invasoras en el desierto sur, devenida "ciudad autogestionada" con plan urbano comunitario diseñado por Miguel Romero Sotelo y los propios pobladores; premio Príncipe de Asturias 1987. (d) Años 80–90, oleada del desplazamiento forzado por Sendero Luminoso desde Ayacucho y sierra central — ~600.000 desplazados según la CVR, la mayoría asentada en Huaycán, Raucana, Canto Grande. El sociólogo José Matos Mar publica Desborde popular y crisis del Estado (IEP, 1984) documentando el fenómeno: el Perú "oficial" no puede contener al Perú "popular" migrante, el Estado colapsa en servicios, impuestos, orden público, y la ciudad se reorganiza desde abajo mediante comités de vaso de leche, clubes de madres, comedores populares, microempresa informal. Producto cultural emblema: la chicha — género musical híbrido que fusiona cumbia colombiana, huayno andino y rock psicodélico (Los Shapis, Chacalón). La Lima contemporánea (Gamarra, cono norte, San Juan de Lurigancho como el distrito más poblado del Perú con >1 millón) es producto directo de ese desborde.',
    '7',
    'travel'
  ),
  (
    'travel-f7-norte-costa',
    'Costa norte piurano-tumbesina: afroperuanos, Vicús, cocina y frontera 1941',
    'costa-norte-piura-tumbes',
    'El extremo norte de la costa peruana — Tumbes, Piura y Lambayeque — tiene identidades regionales marcadamente distintas del resto del país, articuladas por cinco capas. (a) Arqueología Vicús (~100 a.C.–400 d.C., valle del alto Piura, región Chulucanas-Yécala): cultura de ceramista y metalurgista del oro y cobre, documentada desde 1987 por el proyecto PUCP-ORSTOM dirigido por Krzysztof Makowski; taller de Yécala (s. III–IV) es la primera evidencia directa de producción metalúrgica prehispánica en Piura. (b) Afroperuanos Yapatera y Zaña: Yapatera (Chulucanas, Piura) y Zaña (Lambayeque, fundada 1563) son las comunidades con mayor porcentaje de población afrodescendiente del Perú (~70% en Yapatera), descendientes de esclavos traídos desde el siglo XVI para la hacienda azucarera; la abolición llega en 1854. Zaña fue ciudad barroca destruida por inundación en 1720 — hoy sus ruinas conventuales son Ruta del Esclavo UNESCO. (c) Cocina norteña: seco de cabrito, ceviche con limón de Chulucanas, arroz con pato, tamalitos verdes, chicha de jora. (d) Frontera con Ecuador: el diferendo territorial arrastra desde la independencia hasta la guerra de 1941 (5 de julio). Perú ocupa la provincia ecuatoriana de El Oro, se firma el Protocolo de Paz, Amistad y Límites de Río de Janeiro el 29 de enero de 1942 bajo garantía de Argentina, Brasil, Chile y EE.UU., Ecuador cede el acceso amazónico. Ecuador rechaza la demarcación en 1948 y el conflicto se reabre en 1981 (Falso Paquisha) y 1995 (Cenepa), cerrándose sólo con el Acta Presidencial de Brasilia (1998). (e) Literatura del norte: Mario Vargas Llosa usa Piura (La casa verde, 1966) y Chiclayo (¿Quién mató a Palomino Molero?, 1986) como escenarios.',
    '7',
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
  ('travel-f7-geografia-costa',         'travel-geo-sudamerica'),
  ('travel-f7-chavin-matriz',           'travel-f7-geografia-costa'),
  ('travel-f7-moche',                   'travel-f7-geografia-costa'),
  ('travel-f7-moche',                   'travel-f7-chavin-matriz'),
  ('travel-f7-chimu',                   'travel-f7-moche'),
  ('travel-f7-lima-virreinal',          'travel-f1-virreinatos'),
  ('travel-f7-guano-salitre-pacifico',  'travel-f1-divergencia-poscolonial'),
  ('travel-f7-migracion-lima',          'travel-f7-lima-virreinal'),
  ('travel-f7-migracion-lima',          'travel-f7-guano-salitre-pacifico'),
  ('travel-f7-norte-costa',             'travel-f7-geografia-costa'),
  ('travel-f7-norte-costa',             'travel-f7-moche')
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
    'travel-r-basadre-republica',
    'Historia de la República del Perú (1822–1933), tomos selectos',
    'book',
    'https://archivohistoricodemarina.mil.pe/repo/data/DOCUMENTOS/BIBLIOTECA/LIBROS%20Y%20MISCELANEOS/LIBROS/pdf/Historia%20de%20la%20Guerra%20del%20Guano%20y%20el%20Salitre%20o%20Guerra%20del%20Pac%C3%ADfico%20entre%20Chile,%20Bolivia%20y%20el%20Per%C3%BA%20Vol.%20I.pdf',
    'Jorge Basadre Grohmann',
    '7',
    'Basadre (1903–1980, tacneño, vivió la ocupación chilena de niño) es el historiador canónico del Perú republicano. 16 tomos (1ª ed. 1939–1949, 6ª ed. El Comercio 2005). Lectura: Era del guano, Guerra del Pacífico, Reconstrucción nacional.',
    10.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-rostworowski-costa',
    'Costa peruana prehispánica (caps. Chimú y conquista inca)',
    'book',
    'https://fondoeditorial.iep.org.pe/producto/costa-peruana-prehispanica-obras-completas-iii/',
    'María Rostworowski de Diez Canseco',
    '7',
    'Rostworowski es la primera historiadora peruana en reconstruir sistemáticamente las sociedades costeñas desde fuentes coloniales (visitas, testamentos). Sus tomos de Costa peruana prehispánica son el manual sobre Chimú, Lambayeque y curacazgos costeños (IEP, Obras Completas).',
    6.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-sipan-alva',
    'El tesoro del Señor de Sipán: Walter Alva y arqueología Moche',
    'article',
    'https://www.eltiempo.com/bocas/entrevista-con-el-arqueologo-peruano-walter-alva-sobre-las-tumbas-reales-del-senor-de-sipan-157538',
    'Walter Alva (entrevista extensa) — Revista BOCAS / El Tiempo',
    '7',
    'Walter Alva y Donnan son las dos autoridades canónicas de los Moche. Complementar con el proyecto Huacas de Moche (PUCP, Santiago Uceda & Ricardo Morales) que documenta las 75 víctimas de sacrificio en la Plaza 3A de la Huaca de la Luna — evidencia directa del Tema del Sacrificio que Donnan leyó en la iconografía.',
    3.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-chavin-horizonte',
    'Chavín de Huántar como horizonte iconográfico pan-andino',
    'article',
    'https://textos.pucp.edu.pe/pdf/3788.pdf',
    'Luis Guillermo Lumbreras (PUCP)',
    '7',
    'Lumbreras (1936–2023) es el arqueólogo peruano que más trabajó el sitio y quien acuñó la lectura del "Horizonte Chavín" como fenómeno pan-andino religioso (no militar). Complementar con el proyecto de John Rick (Stanford, desde 1995) que renueva radicalmente el registro con tecnología 3D y galerías subterráneas.',
    2.5,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-salazar-bondy-lima',
    'Lima la horrible',
    'book',
    'https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0718-04622003048800013',
    'Sebastián Salazar Bondy',
    '7',
    'Ensayo breve (137 pp.) y afilado. Salazar Bondy (1924–1965, Generación del 50) desmonta la "Arcadia colonial" — el mito aristocrático de una Lima cortés y barroca que oculta servidumbre y exclusión. Lectura contra-limeña obligatoria antes de caminar la ciudad. URL apunta a reseña académica SciELO Chile; el texto completo en Peisa 2014 o ERA 1964.',
    4.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-matos-mar-desborde',
    'Desborde popular y crisis del Estado',
    'book',
    'https://repositorio.iep.org.pe/bitstreams/c867f585-213a-42be-ab02-ee8009004fd8/download',
    'José Matos Mar',
    '7',
    'El libro que nombró el fenómeno. Matos Mar (1921–2015, sanmarquino, ayacuchano, fundador-director del IEP) documenta la migración andina de posguerra y el colapso del Estado republicano ante la nueva Lima popular. Aparece el año del estallido senderista (1980). PDF abierto en el repositorio IEP.',
    5.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-chan-chan-unesco',
    'Chan Chan — dossier UNESCO + Ministerio de Cultura',
    'article',
    'https://whc.unesco.org/es/list/366',
    'UNESCO + Ministerio de Cultura del Perú',
    '7',
    'UNESCO declara Chan Chan patrimonio el 28/11/1986 e inmediatamente lo coloca en la Lista en Peligro por erosión, saqueo y lluvias. El Proyecto Especial Chan Chan gestiona conservación desde 1998. Complemento académico canónico: Moseley & Day, Chan Chan: Andean Desert City (UNM Press, 1982) y Moseley & Cordy-Collins, The Northern Dynasties (Dumbarton Oaks, 1990).',
    2.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-costa-norte-identidades',
    'Costa norte peruana: Yapatera/Zaña, Vicús y frontera Ecuador 1941 (dossier)',
    'article',
    'https://publicaciones.banrepcultural.org/index.php/bmo/article/view/6922',
    'Krzysztof Makowski (Banrepcultural) + Yapatera Virtual + CampUCSS + Infobae',
    '7',
    'Dossier multi-fuente por falta de un libro-síntesis único. El artículo Makowski-Banrepcultural es el paper académico duro para Vicús. Complementar con Yapatera Virtual (portal cultural local), aportes afroperuanos CampUCSS, y cobertura periodística de la guerra 1941 (Infobae, TV Perú). Para afroperuanidad, libro canónico: Carlos Aguirre, Agentes de su propia libertad (PUCP, 1993).',
    3.0,
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
  ('travel-r-basadre-republica',        'travel-f7-guano-salitre-pacifico', FALSE),
  ('travel-r-rostworowski-costa',       'travel-f7-chimu',                  FALSE),
  ('travel-r-sipan-alva',               'travel-f7-moche',                  FALSE),
  ('travel-r-chavin-horizonte',         'travel-f7-chavin-matriz',          FALSE),
  ('travel-r-salazar-bondy-lima',       'travel-f7-lima-virreinal',         FALSE),
  ('travel-r-matos-mar-desborde',       'travel-f7-migracion-lima',         FALSE),
  ('travel-r-chan-chan-unesco',         'travel-f7-chimu',                  FALSE),
  ('travel-r-costa-norte-identidades',  'travel-f7-norte-costa',            FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
