-- ============================================================================
-- Travel track — Phase 8 (Cordillera Blanca / Ancash) canonical seed
-- Source of truth: docs/travel-track/phase-8-brief.md
-- Note: Chavín appears in F7 as pan-Andean iconographic matrix
-- (travel-f7-chavin-matriz) and here as the physical archaeological site
-- (travel-f8-chavin-sitio). Distinct IDs.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f8-geologia-blanca',
    'Geología de la Cordillera Blanca: cordillera tropical más alta del mundo',
    'geologia-cordillera-blanca-tropical',
    'La Cordillera Blanca es un ramal de los Andes Centrales de ~180 km de largo entre 8°30′ S y 10°10′ S en el departamento de Ancash, con ~35 picos sobre 6.000 m — incluyendo el Huascarán (6.768 m, montaña más alta del Perú y quinta de Sudamérica), Huandoy (6.395 m), Alpamayo (5.947 m, considerada "la montaña más bella del mundo" por la UIAA en 1966), Chopicalqui, Pisco, Artesonraju. Es la cordillera tropical más alta del mundo y alberga ~663 glaciares tropicales que son la mayor concentración de glaciares de zona tropical del planeta. Su origen geológico es un batolito granítico emplazado en el Mioceno (~10 m.a.) con fracturamiento activo y actividad sísmica derivada de la subducción de la placa de Nazca. La Cordillera Blanca define con su paralela Cordillera Negra (más baja, sin glaciares, al oeste) el Callejón de Huaylas — corredor tectónico norte-sur. Desde 1970 los glaciares peruanos han perdido ~50% de su masa por calentamiento global (INAIGEM, MINAM). El Pastoruri — glaciar tropical turístico de altura moderada — perdió 22% de su superficie entre 1980 y 2010, retrocede 32 m/año y es considerado "extinto" como glaciar activo; en abril de 2011 se creó allí la Ruta del Cambio Climático, uno de los primeros circuitos de duelo ambiental de Sudamérica. El retroceso genera dos amenazas: (a) lagunas proglaciares nuevas con alto riesgo de GLOF — como la que causó el aluvión de Huaraz de 1941 — y (b) pérdida del reservorio hídrico estacional del río Santa y del Rímac.',
    '8',
    'travel'
  ),
  (
    'travel-f8-callejon-huaylas',
    'Callejón de Huaylas y río Santa: corredor tectónico y eje sierra-costa',
    'callejon-huaylas-rio-santa',
    'El Callejón de Huaylas es un valle tectónico longitudinal de ~180 km entre las Cordilleras Blanca (este) y Negra (oeste), drenado por el río Santa — que nace en la laguna de Conococha (4.100 m), baja hacia el norte por todo el callejón (Recuay, Huaraz, Carhuaz, Yungay, Caraz) hasta Huallanca donde gira bruscamente al oeste y atraviesa la Cordillera Negra por el Cañón del Pato rumbo al Pacífico en Santa (cerca de Chimbote). Este trazado convierte al río Santa en uno de los tres únicos ríos del Perú que cruzan la Cordillera conectando sierra y costa por vía fluvial propia (los otros dos son el Majes-Ocoña y el Marañón en su tramo norte). El callejón es el único surco norte-sur habitable a escala media (2.500–3.500 m) de la sierra centro-norte peruana, lo que explica que concentre la población ancashina (Huaraz, capital regional; Caraz, Yungay, Carhuaz) y la agricultura del maíz, papa, trigo. Los incas ya lo utilizaban: el Qhapaq Ñan corría por ambos flancos. En 1970 el callejón es devastado por el terremoto de Ancash. Hoy la Ruta del Cañón del Pato — 50 km con 35 túneles tallados en la roca — es una de las carreteras más espectaculares de Sudamérica y conecta Caraz con Chimbote en ~5 horas.',
    '8',
    'travel'
  ),
  (
    'travel-f8-chavin-sitio',
    'Chavín de Huántar como sitio físico: Lanzón, cabezas clavas y arqueología acústica',
    'chavin-huantar-sitio-lanzon',
    'Chavín de Huántar se ubica en el flanco oriental de la Cordillera Blanca (Callejón de Conchucos, 3.180 m, en la confluencia de los ríos Mosna y Huachecsa) y fue centro ceremonial entre ~1200 y ~200 a.C. — el punto físico desde donde se difundió el Horizonte Chavín pan-andino. Programa arquitectónico: Templo Viejo (Pirámide en U con plaza circular hundida) con la Galería del Lanzón en su centro, donde aún hoy está in situ el Lanzón monolítico — estela de granito de 4.53 m con figura antropomorfa dentada, labios colmillados y cabellera de serpientes, interpretada por Julio C. Tello como deidad oracular suprema. Templo Nuevo con plaza cuadrada hundida y fachada revestida originalmente con ~100 cabezas clavas (sólo una permanece in situ; el resto está en el Museo Nacional de Chavín inaugurado en 2008); las cabezas, de expresión progresivamente bestializada, fueron interpretadas por Lumbreras como representación de estados de consciencia alterada inducidos ritualmente por el cactus San Pedro (Trichocereus pachanoi) cuyo residuo fue documentado en la Galería de las Ofrendas excavada por Lumbreras en 1971–1973. Ingeniería hidráulica y acústica: sistema de canales internos que atraviesan el templo (canal Rocas), diseñados para amplificar el sonido del agua; el proyecto de John Rick (Stanford, desde 1995) con el Global Heritage Fund y Antamina documentó 42 galerías subterráneas interconectadas y en 2013 halló tres cabezas clavas nuevas. Arquitectura sismo-resistente: muros con drenaje interno y geometría anti-sísmica probada: Chavín sobrevivió al terremoto de 1970. UNESCO lo declaró Patrimonio Mundial en 1985.',
    '8',
    'travel'
  ),
  (
    'travel-f8-yungay-1970',
    'Terremoto de Ancash y aluvión de Yungay (31 de mayo de 1970)',
    'terremoto-yungay-aluvion-1970',
    'El domingo 31 de mayo de 1970 a las 15:23:31 hora local, un terremoto de magnitud 7.9 Mw con epicentro frente a las costas de Chimbote (Ancash) sacudió la sierra norte peruana. El sismo desprendió la ladera norte del nevado Huascarán generando un aluvión (mezcla de hielo, roca y lodo) de ~50–100 millones de m³, 1.5 km de ancho, que descendió 13 km a velocidad estimada de 200–500 km/h y en tres minutos sepultó la ciudad de Santo Domingo de Yungay con sus ~25.000 habitantes. El saldo total del desastre — en toda la región Ancash y la costa de Chimbote — fue de ~70.000 muertos, ~150.000 heridos y ~800.000 damnificados, el peor desastre natural documentado en la historia del Perú y uno de los peores en la historia de América. El gobierno de Juan Velasco Alvarado lideró la reconstrucción, prohibió excavar el sitio de la antigua Yungay y lo declaró Campo Santo nacional — hoy sólo quedan en superficie las cuatro palmeras originales de la Plaza de Armas, el Cristo del Cerro de Atma y una cruz blanca sobre el aluvión. La nueva Yungay fue construida 2 km al norte. El sismo también destruyó gran parte de Huaraz, Caraz y Carhuaz (Huaraz perdió el 90% de su trazado colonial). El impacto geológico-urbano definió la conciencia sismo-aluvional peruana y dio origen al INDECI (Instituto Nacional de Defensa Civil, creado en 1972) y al programa de monitoreo de lagunas proglaciares peligrosas del IGP.',
    '8',
    'travel'
  ),
  (
    'travel-f8-velasco-reforma',
    'Velasco Alvarado y la reforma agraria (1968–1975)',
    'velasco-reforma-agraria-1968',
    'El 3 de octubre de 1968, una junta militar encabezada por el general Juan Velasco Alvarado derroca al presidente Fernando Belaúnde Terry alegando la entrega de petróleo a la IPC (International Petroleum Company, subsidiaria de Standard Oil). Velasco funda el Gobierno Revolucionario de la Fuerza Armada (1968–1975), un proyecto militar-nacionalista progresista atípico en la Sudamérica de las dictaduras derechistas: nacionaliza la IPC (9 de octubre, Día de la Dignidad Nacional) y, el 24 de junio de 1969 — día del campesino — promulga el Decreto Ley 17716, Ley de Reforma Agraria, con la frase canónica "Campesino, el patrón ya no comerá más de tu pobreza". La reforma: (a) expropia ~9 millones de ha (costa azucarera, sierra ganadera y agrícola), la reforma agraria más profunda de Sudamérica en extensión excepto Cuba; (b) crea Cooperativas Agrarias de Producción (CAPs) en la costa y Sociedades Agrícolas de Interés Social (SAIS) en la sierra; (c) elimina la hacienda semifeudal. Otras reformas: Ley de Industria 1970, reconocimiento oficial del quechua como lengua (1975). Tensión con la izquierda: Velasco deporta al sociólogo Julio Cotler y a Aníbal Quijano en 1973 por críticas al velasquismo. Desde el exilio, Cotler escribe Clases, Estado y nación en el Perú (IEP, 1978). Evaluación ex post: la reforma desestructuró la hacienda pero las cooperativas colapsaron en los 80 por gestión deficiente, y la atomización minifundista que siguió es uno de los factores que Carlos Iván Degregori identifica en la gestación de Sendero Luminoso.',
    '8',
    'travel'
  ),
  (
    'travel-f8-canon-pato',
    'Cañón del Pato: Antúnez de Mayolo, hidroeléctrica 1958 y los 35 túneles',
    'canon-pato-hidroelectrica-tuneles',
    'El Cañón del Pato es el encajonamiento del río Santa entre las Cordilleras Blanca y Negra en el distrito de Huallanca (provincia de Huaylas, Ancash), con paredes de ~1.000 m de altura y ancho mínimo de ~15 m. Su aprovechamiento energético fue propuesto por el ingeniero peruano Santiago Antúnez de Mayolo en mayo de 1913 — primera exploración técnica del sitio. En 1943, tras una misión de ingenieros norteamericanos que confirmó la factibilidad, el gobierno de Manuel Prado creó la Corporación Peruana del Santa (1943) con doble objetivo: usar el hierro de Marcona para construir una siderúrgica en Chimbote y construir la Central Hidroeléctrica del Cañón del Pato. La construcción comenzó en julio de 1944 con 1.200 trabajadores perforando los 35 túneles sin equipos mecánicos (llegó a 2.500 obreros en el pico). El terremoto de 1945 y problemas financieros retrasaron la obra; el gobierno de Manuel Odría la retomó en 1954 con contrato a un consorcio francés, y el presidente Manuel Prado la inauguró el 21 de abril de 1958 con 150 MW. En 1999 la planta fue adquirida por Duke Energy (EE.UU.) y repotenciada a ~263 MW. Hoy abastece ~10% de la electricidad del sistema interconectado nacional del Perú. La carretera al Cañón del Pato — tallada paralelamente durante la construcción de la hidroeléctrica y con los 35 túneles conservados — es una de las carreteras más espectaculares de Sudamérica: permite bajar desde Caraz (2.250 m) hasta Huallanca (1.100 m) y seguir a Chimbote (35 m) en un descenso de ~2.200 m en ~50 km. El Cañón del Pato es emblema de la ingeniería peruana sobre topografía imposible.',
    '8',
    'travel'
  ),
  (
    'travel-f8-parque-huascaran',
    'Parque Nacional Huascarán UNESCO 1985: conservación, alpinismo y retroceso glaciar',
    'parque-nacional-huascaran-unesco',
    'El Parque Nacional Huascarán fue creado por Decreto Supremo N° 0622-75-AG el 1 de julio de 1975, cubre 340.000 ha a lo largo de 158 km de la Cordillera Blanca, y protege los 663 glaciares tropicales del macizo, 41 lagunas principales (Llanganuco, Parón, 69, Churup, Querococha), 779 especies de flora altoandina y 120 especies de fauna (cóndor andino, oso de anteojos, vicuña, vizcacha). UNESCO lo designó Reserva de Biosfera el 1 de marzo de 1977 y Patrimonio Natural de la Humanidad en 1985 — reconocimiento paralelo al de Machu Picchu como patrimonio cultural (1983). Es el destino andinístico más importante de los Andes Centrales: desde la primera ascensión al Huascarán Sur por Annie S. Peck (1908), es ruta obligada para montañistas internacionales. La temporada seca (mayo a septiembre) concentra la actividad de alpinismo y trekking (Santa Cruz Trek, Huayhuash Circuit). Retroceso glaciar 2000–2025: datos del INAIGEM (Instituto Nacional de Investigación en Glaciares y Ecosistemas de Montaña, 2014) muestran pérdida de ~50% de masa glaciar desde 1970, con el Pastoruri como caso emblema: cerrado al turismo recreativo en diciembre 2007 por peligro, reabierto en abril 2011 como Ruta del Cambio Climático con valor pedagógico explícito — uno de los primeros circuitos de "duelo ambiental" del planeta. Las lagunas proglaciares nuevas (Laguna 513, Laguna Palcacocha) son vigiladas permanentemente por riesgo de desborde: el aluvión de Huaraz de 1941 (1.800 muertos) y el de Ranrahirca de 1962 (~4.000 muertos, antes del mayor de 1970) fueron GLOFs. La Palcacocha fue dragada en 2011 por riesgo a Huaraz.',
    '8',
    'travel'
  ),
  (
    'travel-f8-sendero-ancash',
    'Sendero Luminoso en Ancash: zona de paso y marco canónico de Degregori/CVR',
    'sendero-luminoso-ancash-degregori',
    'El Partido Comunista del Perú – Sendero Luminoso (PCP-SL), grupo maoísta fundado por Abimael Guzmán en Ayacucho, inició la lucha armada el 17 de mayo de 1980 quemando ánforas electorales en Chuschi (Ayacucho). La Comisión de la Verdad y Reconciliación (CVR, informe final 28 de agosto de 2003, 9 tomos) estimó ~69.280 muertos y desaparecidos entre 1980–2000, de los cuales 75% eran quechuahablantes rurales de Ayacucho, Huancavelica, Apurímac, Junín y Huánuco — el epicentro fue el trapecio andino del sur-centro, no Ancash. Sin embargo Ancash fue zona de paso y retaguardia secundaria: (a) el corredor Huari-Pomabamba-Sihuas (Callejón de Conchucos, al este de la Cordillera Blanca) sirvió como ruta de comunicación entre frentes de Huánuco (Alto Huallaga) y Junín; (b) los distritos altoandinos pobres del este de Ancash (Huari, Asunción, Antonio Raimondi) tuvieron incidencia senderista puntual y presencia de rondas campesinas de autodefensa; (c) el asesinato de autoridades locales y dirigentes comunales ocurrió episódicamente entre 1983–1993; (d) tras la captura de Guzmán en septiembre de 1992 y la desarticulación del comité central, las acciones en Ancash se extinguieron. El marco canónico para leer por qué Sendero nace en Ayacucho y no en Ancash pese a condiciones aparentemente similares es Qué difícil es ser Dios (IEP, 2010) y Ayacucho: raíces de una crisis (1986) de Carlos Iván Degregori (1945–2011, antropólogo sanmarquino, comisionado de la CVR): el epicentro ayacuchano se explica por la combinación específica de la Universidad Nacional San Cristóbal de Huamanga reabierta en 1959, el fracaso de la reforma agraria de Velasco en la región y la movilidad social frustrada de la primera generación universitaria provinciana.',
    '8',
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
  ('travel-f8-geologia-blanca',       'travel-geo-sudamerica'),
  ('travel-f8-callejon-huaylas',      'travel-f8-geologia-blanca'),
  ('travel-f8-chavin-sitio',          'travel-f8-geologia-blanca'),
  ('travel-f8-chavin-sitio',          'travel-f8-callejon-huaylas'),
  ('travel-f8-chavin-sitio',          'travel-f7-chavin-matriz'),
  ('travel-f8-yungay-1970',           'travel-f8-geologia-blanca'),
  ('travel-f8-yungay-1970',           'travel-f8-callejon-huaylas'),
  ('travel-f8-velasco-reforma',       'travel-f1-divergencia-poscolonial'),
  ('travel-f8-canon-pato',            'travel-f8-callejon-huaylas'),
  ('travel-f8-parque-huascaran',      'travel-f8-geologia-blanca'),
  ('travel-f8-sendero-ancash',        'travel-f8-velasco-reforma'),
  ('travel-f8-sendero-ancash',        'travel-f1-divergencia-poscolonial')
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
    'travel-r-lumbreras-chavin',
    'Chavín: Excavaciones Arqueológicas (Lumbreras)',
    'book',
    'https://www.academia.edu/39766303/Lumbreras_Luis_G_1993_Chav%C3%ADn_de_Hu%C3%A1ntar_Excavaciones_en_la_Galer%C3%ADa_de_las_Ofrendas_KAVA_Mainz_PARTE_1_',
    'Luis Guillermo Lumbreras',
    '8',
    'Lumbreras (1936–2023) excavó Chavín entre 1966 y 1995. La Galería de las Ofrendas (1971–1973) es el hallazgo estratigráfico canónico y documenta el uso ritual del cactus San Pedro. Chavín: Excavaciones Arqueológicas (Universidad Alas Peruanas, 2007) es la síntesis arqueológica obligada. URL apunta al volumen KAVA-Mainz 1993.',
    6.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-rick-stanford-chavin',
    'Proyecto Chavín de Stanford (John Rick): cabezas clavas y galerías subterráneas',
    'article',
    'https://www.antamina.com/noticias/descubrimiento_historico__tres_nuevas_cabezas_clavas_chavin_huantar_asombran_mundo/',
    'John Rick (Stanford) — Antamina + El Comercio + UAB',
    '8',
    'Proyecto Rick (Stanford, Global Heritage Fund, Antamina, desde 1995) aplica tomografía acústica, robots con microcámaras, escáner 3D. El hallazgo de 2013 (tres cabezas clavas nuevas) y la documentación de 42 galerías subterráneas reorganizaron la lectura arquitectónica del sitio.',
    2.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cotler-clases-estado',
    'Clases, Estado y nación en el Perú',
    'book',
    'https://argumentos-historico.iep.org.pe',
    'Julio Cotler',
    '8',
    'Cotler (1932–2019, sociólogo sanmarquino, director del IEP) es el intelectual canónico del Perú republicano junto con Matos Mar. Escrito desde el exilio en México (deportado por Velasco en 1973). Plantea la tesis del Perú dependiente en doble sentido: dependencia externa + dependencia colonial interna (oligarquía-indígena). IEP 1978, múltiples reediciones.',
    8.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-yungay-1970-documental',
    'Aluvión de Yungay 31 de mayo de 1970 (dossier)',
    'video',
    'https://www.youtube.com/watch?v=5xSu85iL0f8',
    'Varios — El Comercio, RPP, Infobae',
    '8',
    'Dossier video + reportaje escrito sobre el peor desastre natural de la historia del Perú. Complementar con crónica El Comercio "La última función", cobertura RPP de los 50 años del sismo, y síntesis Infobae. Para profundidad académica: Anthony Oliver-Smith, The Martyred City: Death and Rebirth in the Andes (UNM Press, 1986).',
    3.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-velasco-reforma-dossier',
    'Velasco Alvarado y la reforma agraria 1969 (dossier)',
    'article',
    'https://www.marxists.org/espanol/velasco/1969/junio/24.htm',
    'Velasco (texto primario) + Redalyc + Haal',
    '8',
    'El texto primario del 24 de junio de 1969 es corto y potente — la frase canónica "Campesino, el patrón ya no comerá más de tu pobreza" se pronuncia acá. Complementar con paper Redalyc (Velasco, intelectuales y política) y paper Haal (batalla por la reforma agraria 1969–1973).',
    3.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-canon-pato-ingenieria',
    'Central Hidroeléctrica del Cañón del Pato: historia y 35 túneles',
    'article',
    'https://www.sectorelectricidad.com/14401/historia-de-la-central-hidroelectrica-del-canon-del-pato-peru/',
    'Sector Electricidad + CHS-Perú + Patrimonio Industrial Perú',
    '8',
    'El PDF CHS-Perú es el documento técnico de referencia. La historia incluye a Santiago Antúnez de Mayolo (que también propuso la hidroeléctrica del Mantaro y la central nuclear del Perú). La adquisición por Duke Energy en 1999–2000 es momento clave para entender por qué la infraestructura estratégica peruana quedó en manos extranjeras tras los 90 fujimoristas.',
    2.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-parque-huascaran-climatico',
    'Parque Nacional Huascarán y retroceso glaciar (dossier)',
    'article',
    'https://whc.unesco.org/es/list/333',
    'UNESCO + SERNANP + INAIGEM + Actualidad Ambiental',
    '8',
    'Ficha UNESCO Patrimonio Natural 1985, página institucional del Parque (SERNANP), artículos sobre la Ruta del Cambio Climático del Pastoruri, y reportes del INAIGEM (Instituto Nacional de Investigación en Glaciares y Ecosistemas de Montaña, creado en 2014 con sede en Huaraz).',
    2.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cvr-degregori-ancash',
    'Hatun Willakuy (CVR) + Degregori sobre epicentro ayacuchano',
    'book',
    'https://idehpucp.pucp.edu.pe/wp-content/uploads/2012/11/hatun-willakuy-cvr-espanol.pdf',
    'CVR (2003) + Carlos Iván Degregori',
    '8',
    'Hatun Willakuy ("gran relato" en quechua) es la síntesis oficial de la CVR. Para Ancash específicamente, revisar el capítulo 2 del Informe Final ("Las regiones"). Para entender por qué Ayacucho y no Ancash, lectura obligada: Degregori, Ayacucho: raíces de una crisis (IEP, 1986) y Qué difícil es ser Dios (IEP, 2010). Nota: Hatun Willakuy se comparte parcialmente con F9 — aquí con énfasis en Ancash como zona de paso.',
    5.0,
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
  ('travel-r-lumbreras-chavin',           'travel-f8-chavin-sitio',       FALSE),
  ('travel-r-rick-stanford-chavin',       'travel-f8-chavin-sitio',       FALSE),
  ('travel-r-cotler-clases-estado',       'travel-f8-velasco-reforma',    FALSE),
  ('travel-r-yungay-1970-documental',     'travel-f8-yungay-1970',        FALSE),
  ('travel-r-velasco-reforma-dossier',    'travel-f8-velasco-reforma',    FALSE),
  ('travel-r-canon-pato-ingenieria',      'travel-f8-canon-pato',         FALSE),
  ('travel-r-parque-huascaran-climatico', 'travel-f8-parque-huascaran',   FALSE),
  ('travel-r-cvr-degregori-ancash',       'travel-f8-sendero-ancash',     FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
