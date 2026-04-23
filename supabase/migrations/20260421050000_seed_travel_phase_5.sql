-- ============================================================================
-- Travel track — Phase 5 (Amazonía Ecuatoriana) canonical seed
-- ----------------------------------------------------------------------------
-- Source of truth: docs/travel-track/phase-5-brief.md
--
-- Shape:
--   1. INSERT concepts C1..C8 (IDs `travel-f5-*`).
--   2. INSERT concept_prerequisites per the DAG in the brief
--      (including cross-phase prereqs to Phase 1).
--   3. INSERT 8 canonical resources (R1..R8), `curriculum_source='core'`,
--      `created_by=NULL`, `track='travel'`, `phase='5'`.
--   4. INSERT resource_concepts (teach-only, is_prerequisite=FALSE).
--
-- Idempotent: ON CONFLICT upserts on concepts/resources; ON CONFLICT DO UPDATE
-- on resource_concepts; ON CONFLICT DO NOTHING on concept_prerequisites.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f5-amazonia-geografia-biodiversidad',
    'Geografía amazónica ecuatoriana y biodiversidad Yasuní',
    'amazonia-ecuatoriana-geografia-biodiversidad',
    'La Amazonía ecuatoriana ocupa cerca de la mitad del territorio nacional y se estructura en tres franjas: piedemonte andino (2.000–500 m, cabeceras de Napo, Pastaza, Santiago, Morona), selva alta (500–200 m, Puyo–Tena–Macas) y selva baja (Yasuní, Cuyabeno). El Parque Nacional Yasuní concentra el récord mundial de diversidad arbórea (644+ especies por hectárea, más que en EE.UU. y Canadá juntos), explicado por su posición en el Refugio del Pleistoceno Napo: mientras el resto de la Amazonía se secó hace 20.000 años, este pliegue entre Andes y cuenca se mantuvo húmedo y funcionó como reserva genética. Es la razón geológica, no cultural, de por qué Ecuador discute qué hacer con un millón de hectáreas de selva.',
    '5',
    'travel'
  ),
  (
    'travel-f5-pueblos-amazonicos',
    'Pueblos amazónicos ecuatorianos (Shuar, Achuar, Kichwa, Waorani)',
    'pueblos-amazonicos-ecuatorianos',
    'Siete nacionalidades indígenas amazónicas reconocidas: Kichwa amazónicos (la mayoría, bilingüismo con kichwa serrano, ocupan Napo–Tena–Pastaza), Shuar y Achuar (familia lingüística jíbara, Morona Santiago–Pastaza, famosos históricamente por la tzantza como ritual guerrero y por su resistencia exitosa al Tawantinsuyu y a los encomenderos españoles), Waorani (contacto con misioneros evangélicos SIL desde 1956, Yasuní y zona intangible), y los más pequeños Siona, Siekopai (Secoya), Cofán, Shiwiar, Andwa, Sapara. La territorialidad no-aldeana (caseríos dispersos, no pueblos concentrados) hizo que tanto la colonización inca como la española fracasaran en el piedemonte, y explica por qué en el siglo XX la "colonización" recién arranca con carreteras y reforma agraria. El prefijo "jíbaro" es exónimo despectivo español; los Shuar se autodenominan Shuar ("gente").',
    '5',
    'travel'
  ),
  (
    'travel-f5-ciclo-caucho',
    'Caucho amazónico y el genocidio del Putumayo',
    'ciclo-caucho-amazonia',
    'Entre 1880 y 1914 el caucho (Hevea brasiliensis) es el nuevo boom extractivo de la Amazonía: los neumáticos de bicicleta y auto, el aislamiento eléctrico y la industria militar disparan la demanda. Julio César Arana y la Peruvian Amazon Company (Casa Arana) dominan la cuenca del Putumayo (frontera difusa Colombia–Perú–Ecuador) reclutando forzosamente pueblos Huitoto, Bora, Andoque y Ocaina bajo sistema de enganche; se estima que 40.000–50.000 indígenas mueren en tres décadas. En 1910 el cónsul británico Roger Casement documenta las atrocidades para el Parlamento inglés, y en 1924 José Eustasio Rivera publica "La Vorágine", novela que fija el arquetipo literario latinoamericano de la selva como infierno extractivo. El boom revienta en 1914 cuando las plantaciones británicas en Malasia (semillas contrabandeadas desde Brasil) inundan el mercado mundial. En el lado ecuatoriano el impacto es menor que en Perú/Colombia, pero los pueblos del oriente quedan diezmados y el modelo extractivo queda instalado como plantilla para el siguiente ciclo.',
    '5',
    'travel'
  ),
  (
    'travel-f5-colonizacion-reforma-agraria',
    'Colonización amazónica y reforma agraria (1960s–1980s)',
    'colonizacion-amazonica-reforma-agraria',
    'Hasta los años 1950 el oriente ecuatoriano era demográficamente marginal. Tres fuerzas convergentes lo transforman: (a) la Ley de Tierras Baldías (1954), la Ley de Reforma Agraria y Colonización (1964) y la Ley de Colonización de la Región Amazónica (1978), que declaran "baldías" las tierras no tituladas (es decir, las de pueblos indígenas) y adjudican parcelas a colonos serranos; (b) el IERAC como brazo operativo del Estado, que moviliza ~30.000 colonos desde la sierra sur (Azuay, Loja, Cañar) hacia Morona Santiago y Zamora, y 10.000 a Napo; (c) la narrativa de "seguridad nacional" post-1941 (guerra con Perú) que empuja al Estado a poblar la frontera oriental. Entre 1964 y 1994 desaparece cerca de un quinto de la selva oriental. La respuesta Shuar es la Federación Interprovincial de Centros Shuar (FICSH, 1964), pionera mundial en organización indígena amazónica, con apoyo salesiano; negocia titulación colectiva de territorios para frenar a colonos. Esta colonización es el pre-requisito directo del boom petrolero.',
    '5',
    'travel'
  ),
  (
    'travel-f5-petroleo-texaco-chevron',
    'Petróleo: Lago Agrio, Texaco y juicio Chevron (Aguinda)',
    'petroleo-texaco-chevron-aguinda',
    'En febrero de 1967 el consorcio Texaco-Gulf perfora el primer pozo productor en Nueva Loja, rebautizada "Lago Agrio" por el Sour Lake texano de Texaco. La producción a escala arranca en 1972 con el oleoducto transecuatoriano SOTE (Lago Agrio–Balao/Esmeraldas), y marca el fin del ciclo cacaotero-bananero: Ecuador pasa a rentista petrolero en menos de una década, el Estado crece, se financian subsidios y gasto social. El costo ambiental es catastrófico: entre 1972 y 1992 Texaco vierte ~63.000 millones de litros de aguas de formación a 880 piscinas sin revestimiento que contaminan ríos de los que bebían Cofán, Siona, Secoya, Kichwa y colonos. En 1993 nace el caso Aguinda (30.000 afectados), primero en Nueva York y luego en cortes ecuatorianas; en 2011 Ecuador condena a Chevron (heredera de Texaco) a USD 8.000 millones, ratificado en 2013 a 9.500 millones. Chevron obtiene arbitrajes internacionales que traban el cobro. Treinta años después la contaminación sigue presente y el caso es referencia mundial de litigio climático-indígena.',
    '5',
    'travel'
  ),
  (
    'travel-f5-yasuni-iti',
    'Yasuní-ITT y pueblos en aislamiento (Tagaeri-Taromenane)',
    'yasuni-iti-aislamiento-voluntario',
    'Dentro del Parque Yasuní vive el último fragmento Waorani no contactado: los Tagaeri (descendientes de Taga, quien en los 60s se aparta del contacto misional) y los Taromenane (grupo histórico paralelo, lingüísticamente Wao-terero). El Estado reconoce su derecho al aislamiento vía Decretos 552 (1999) y 2187 (2007) que establecen una Zona Intangible de 758.000 ha. En 2007 el presidente Rafael Correa lanza en la ONU la Iniciativa Yasuní-ITT (bloques Ishpingo–Tambococha–Tiputini): Ecuador se compromete a dejar 846 millones de barriles bajo tierra a cambio de USD 3.600 millones en compensación internacional (la mitad del valor de mercado). La iniciativa fracasa en 2013 (solo USD 13 M efectivamente desembolsados) y Correa autoriza la explotación. Yasunidos, colectivo juvenil que luego suma a CONAIE, junta firmas para consulta popular; tras una década de bloqueo legal la Corte Constitucional la valida en mayo 2023. El 20 de agosto de 2023 el 59% de los ecuatorianos vota Sí al Yasuní: parar la explotación. En marzo 2025 la Corte Interamericana condena al Estado por violar derechos de los pueblos en aislamiento. La implementación del referéndum sigue en disputa.',
    '5',
    'travel'
  ),
  (
    'travel-f5-frontera-peru-cenepa',
    'Frontera con Perú: Paquisha 1981 y Cenepa 1995',
    'frontera-peru-paquisha-cenepa',
    'Desde el Protocolo de Río de Janeiro (1942), firmado bajo ocupación peruana tras la guerra de 1941, Ecuador cede ~200.000 km² amazónicos a Perú y queda con un trazado fronterizo impugnado en la cordillera del Cóndor (cabeceras del río Cenepa). Tres brotes armados: (a) Falso Paquisha (1981): destacamentos ecuatorianos en posición que Perú considera propia son desalojados en 5 días; (b) Guerra del Cenepa (26 enero – 28 febrero 1995): el último conflicto armado interestatal en Sudamérica, con superioridad aérea ecuatoriana y defensa exitosa de posiciones en Tiwinza; (c) Acuerdo de Paz de Brasilia (26 octubre 1998), firmado por Mahuad y Fujimori con garantía de los cuatro países de Río. El acuerdo cierra la disputa, habilita navegación ecuatoriana por el Amazonas y construye centros binacionales. Es relevante para el viajero: la ruta Puyo–Macas bordea territorios donde la militarización persistió hasta fines de los 90s, y los Shuar del Cóndor fueron actores clave en ambos conflictos (conocen el terreno mejor que nadie).',
    '5',
    'travel'
  ),
  (
    'travel-f5-amazonia-presente',
    'Amazonía presente: extractivismo, CONFENIAE y turismo comunitario',
    'amazonia-presente-confeniae-turismo',
    'Síntesis de la fase. Hoy la Amazonía ecuatoriana vive la tensión entre cuatro vectores: (a) rondas petroleras y mineras del Estado (29 bloques licitados que solapan 76% de territorios de 7 nacionalidades); (b) organización política indígena liderada por CONFENIAE (Confederación de Nacionalidades Indígenas de la Amazonía Ecuatoriana, 1980), brazo amazónico de CONAIE, que articula a las 11 nacionalidades y orquesta consultas, resistencias judiciales (sentencia Sarayaku-Pastaza 2012 en Corte IDH, sentencia Waorani-ARCOM 2019) y alianzas con Yasunidos; (c) turismo comunitario como alternativa económica (Kapawi en Achuar, Napo Wildlife Center en Waorani, eco-lodges en Puyo–Tena); (d) misiones evangélicas (Summer Institute of Linguistics) y católicas (salesianos, capuchinos) todavía activas, con impactos disputados en identidad y educación intercultural. El Sumak Kawsay (kichwa, "buen vivir") que entra a la Constitución 2008 nace en parte de este laboratorio amazónico y es hoy marco jurídico y discursivo para las luchas.',
    '5',
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
-- 2) concept_prerequisites — DAG per brief
--    C1 ← travel-f1-geografia-fisica (cross-phase)
--    C2 ← travel-f1-pueblos-precolombinos (cross-phase)
--    C3 ← C2
--    C4 ← C2
--    C5 ← C2, C4
--    C6 ← C1, C5
--    C7 ← (none; studied in parallel with C2)
--    C8 ← C4, C5, C6
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('travel-f5-amazonia-geografia-biodiversidad',  'travel-geo-sudamerica'),
  ('travel-f5-pueblos-amazonicos',                'travel-f1-pueblos-precolombinos'),
  ('travel-f5-ciclo-caucho',                      'travel-f5-pueblos-amazonicos'),
  ('travel-f5-colonizacion-reforma-agraria',      'travel-f5-pueblos-amazonicos'),
  ('travel-f5-petroleo-texaco-chevron',           'travel-f5-pueblos-amazonicos'),
  ('travel-f5-petroleo-texaco-chevron',           'travel-f5-colonizacion-reforma-agraria'),
  ('travel-f5-yasuni-iti',                        'travel-f5-amazonia-geografia-biodiversidad'),
  ('travel-f5-yasuni-iti',                        'travel-f5-petroleo-texaco-chevron'),
  ('travel-f5-amazonia-presente',                 'travel-f5-colonizacion-reforma-agraria'),
  ('travel-f5-amazonia-presente',                 'travel-f5-petroleo-texaco-chevron'),
  ('travel-f5-amazonia-presente',                 'travel-f5-yasuni-iti')
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
    'travel-r-larrea-medio-siglo-petroleo',
    'Medio siglo de extracción petrolera en el Ecuador: impactos y alternativas',
    'article',
    'https://repositorio.uasb.edu.ec/bitstream/10644/8947/1/Larrea%20C-CON-34-Medio%20siglo.pdf',
    'Carlos Larrea (Universidad Andina Simón Bolívar)',
    '5',
    'Paper académico de Carlos Larrea (UASB) con panorama cuantitativo de medio siglo de petróleo ecuatoriano y propuesta de transición post-petrolera.',
    1.5,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-acosta-maldicion-abundancia',
    'La maldición de la abundancia (caps. Petróleo + Yasuní-ITT)',
    'book',
    'https://archive.org/details/LaMaldicionDeLaAbundancia',
    'Alberto Acosta',
    '5',
    'Libro canónico de crítica del extractivismo por Alberto Acosta (ex-ministro de Energía 2007, arquitecto original de Yasuní-ITT). Lectura: Prólogo (Gudynas) + capítulos "Petróleo, motor invisible de economía primaria" + "La propuesta Yasuní-ITT".',
    5.5,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-crude-berlinger',
    'Crude (2009)',
    'video',
    'https://www.imdb.com/title/tt1326204/',
    'Joe Berlinger',
    '5',
    'Documental seminal de 104 min que sigue dos años del juicio Aguinda vs Chevron con protagonismo de Pablo Fajardo y Steven Donziger. Disponibilidad por alquiler; URL apunta a la ficha canónica. Coordinator puede reemplazar por alternativa YouTube abierta si fuera necesario.',
    1.75,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-levantamiento-1990-macas',
    'Primer Gran Levantamiento Indígena de 1990 (testimonio Luis Macas)',
    'video',
    'https://conaie.org/2020/06/05/1990-30-anos-del-primer-gran-levantamiento-indigena/',
    'CONAIE',
    '5',
    'Archivo institucional de CONAIE sobre los 30 años del levantamiento Inti Raymi de 1990, con testimonios de Luis Macas (primer presidente Kichwa de CONAIE). URL primaria del brief; coordinator puede refinar en follow-up si encuentra video más riguroso.',
    0.5,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-moreno-yanez-sublevaciones',
    'Sublevaciones indígenas en la Audiencia de Quito (caps. selección)',
    'book',
    'https://www.uasb.edu.ec/publicacion/sublevaciones-indigenas-en-la-audiencia-de-quito-desde-comienzos-del-siglo-xviii-hasta-finales-de-la-colonia/',
    'Segundo E. Moreno Yáñez',
    '5',
    'Clásico académico (tesis Bonn, premio Egregia, 5ª ed. UASB). Lectura: Introducción + casos Pomallacta 1730, Riobamba 1764, Columbe-Guamote 1803. Aunque se centra en sierra, da contexto estructural para entender por qué la resistencia amazónica Shuar fue distinta.',
    4.5,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-confeniae-revista-2023',
    'Revista CONFENIAE 2023 — Lucha Siekopai y Shuar Arutam',
    'article',
    'https://confeniae.net/wp-content/uploads/2023/09/FINAL-confe-REVISTA-2023-PEKE.pdf',
    'CONFENIAE',
    '5',
    'Material de primera mano de la organización paraguas de las 11 nacionalidades amazónicas. Cronología de la lucha Shuar Arutam contra minería en cordillera del Cóndor y el caso Siekopai. Balancea material académico con voz indígena propia.',
    1.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-si-al-yasuni-reportaje',
    'Sí al Yasuní — reportaje sobre consulta popular 2023',
    'video',
    'https://www.youtube.com/watch?v=-ThOGWiywWQ',
    NULL,
    '5',
    'Reportaje sobre la consulta popular del 20 de agosto de 2023 en que el 59% votó parar la explotación petrolera en Yasuní-ITT. URL primaria del brief; coordinator puede refinar autoría en follow-up.',
    0.5,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-vallejo-amazonia-suroriente',
    'Petróleo, desarrollo y naturaleza: Amazonía suroriente del Ecuador',
    'paper',
    'http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S0254-92122014000100006',
    'Ivette Vallejo (FLACSO Ecuador)',
    '5',
    'Paper peer-reviewed en Anthropologica (PUCP, SciELO). Extractivismo petrolero en Pastaza y Morona Santiago con pueblos Achuar, Kichwa y Shuar — ruta Puyo–Macas del usuario.',
    1.0,
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
-- 4) resource_concepts — teach-only per the mapping table in the brief
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('travel-r-larrea-medio-siglo-petroleo',  'travel-f5-petroleo-texaco-chevron',          FALSE),
  ('travel-r-acosta-maldicion-abundancia',  'travel-f5-yasuni-iti',                       FALSE),
  ('travel-r-crude-berlinger',              'travel-f5-petroleo-texaco-chevron',          FALSE),
  ('travel-r-levantamiento-1990-macas',     'travel-f5-amazonia-presente',                FALSE),
  ('travel-r-moreno-yanez-sublevaciones',   'travel-f5-pueblos-amazonicos',               FALSE),
  ('travel-r-confeniae-revista-2023',       'travel-f5-pueblos-amazonicos',               FALSE),
  ('travel-r-si-al-yasuni-reportaje',       'travel-f5-yasuni-iti',                       FALSE),
  ('travel-r-vallejo-amazonia-suroriente',  'travel-f5-amazonia-presente',                FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
