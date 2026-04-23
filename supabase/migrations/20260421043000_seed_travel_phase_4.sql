-- ============================================================================
-- Travel track — Phase 4 (Colombia Andina Sur) canonical seed
-- Source of truth: docs/travel-track/phase-4-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f4-popayan-oligarquia',
    'Popayán colonial y oligarquía presidencial',
    'popayan-colonial-oligarquia-presidencial',
    'Popayán, fundada por Sebastián de Belalcázar el 13 de enero de 1537 en el valle de Pubenza a 1.760 m, se consolida como tercera ciudad del Virreinato de la Nueva Granada (tras Santafé de Bogotá y Cartagena) por ser nodo de la ruta Quito–Bogotá, centro administrativo de la Gobernación de Popayán y sede episcopal desde 1546. Sobre sus haciendas cañeras (Valle del Cauca sur) y mineras (Barbacoas, Iscuandé, Chocó) con mano de obra esclavizada, se forma durante los siglos XVII y XVIII una elite de 14 familias troncales — Mosquera, Valencia, Caldas, Arboleda, Arroyo, Payán, Pombo, Torres, Lemos, Hurtado, Velasco, Muñoz, Carvajal, Olano — endógama, ilustrada y articulada por el Colegio Seminario Mayor San Francisco de Asís (1643) y, desde 1827, la Universidad del Cauca. Esta oligarquía suministró a la república colombiana 17 presidentes (Tomás Cipriano de Mosquera 4 veces entre 1845 y 1867; Guillermo León Valencia 1962–1966), varios constituyentes y tres próceres (Camilo Torres Tenorio 1765–1816; Francisco José de Caldas 1768–1816; Francisco Antonio de Ulloa). Popayán conserva un casco histórico colonial — Catedral Basílica (1906 tras terremoto), San Francisco, Santo Domingo, San Agustín, Ermita, Puente del Humilladero (1873) — y su Semana Santa fue declarada Patrimonio Inmaterial UNESCO en 2009. El terremoto del 31 de marzo de 1983 (Jueves Santo) destruyó parte del centro histórico. Popayán concentrada y minoritaria versus Cauca étnicamente masivo y disperso: esta tensión estructural es clave del siglo XX regional.',
    '4',
    'travel'
  ),
  (
    'travel-f4-san-agustin',
    'San Agustín arqueológico y la cultura megalítica (siglos I–IX d.C.)',
    'san-agustin-cultura-megalitica',
    'El Parque Arqueológico de San Agustín, en el sur del Huila cerca del nacimiento del río Magdalena (1.900 m, municipios de San Agustín e Isnos), es la mayor necrópolis megalítica de América y conserva ~500 estatuas monolíticas de piedra basáltica (hasta 4 m y 4 toneladas), montículos funerarios con cámaras laterales (dólmenes) y caminos ceremoniales que corresponden a una sociedad que floreció entre el 100 a.C. y el 900 d.C. — con un período clásico 100–800 d.C. — y que después se dispersó antes del contacto europeo, cuyo nombre propio se desconoce. La iconografía de las estatuas mezcla rasgos humanos, felinos (jaguar) y aves rapaces con actitudes chamánicas, probablemente vinculadas a transformación ritual y culto a los ancestros. La estilística incluye tres fases diferenciadas (Formativo, Clásico Regional, Reciente). El sitio fue descrito por fray Juan de Santa Gertrudis en 1757 pero "redescubierto" por el arqueólogo alemán Konrad Theodor Preuss (Museo de Berlín, expediciones 1913–1914) que publica Monumentale vorgeschichtliche Kunst (1929). Excavaciones sistemáticas colombianas se intensifican con Luis Duque Gómez (ICANH) desde los años 40 y con Gerardo Reichel-Dolmatoff. Declarado Patrimonio Mundial UNESCO en 1995. El área cultural se extiende al vecino Parque Arqueológico de Tierradentro (Páez, Cauca) — hipogeos funerarios pintados, también UNESCO 1995. San Agustín es la evidencia de que el norte andino tuvo sociedades complejas no-incaicas, previas y paralelas a Muiscas y Tayronas.',
    '4',
    'travel'
  ),
  (
    'travel-f4-cric-nasa-misak',
    'Pueblos Nasa, Misak y CRIC: organización indígena del Cauca',
    'cric-nasa-misak-organizacion-indigena',
    'El departamento del Cauca es hoy el corazón de la lucha indígena contemporánea colombiana. Los pueblos Nasa (antes "paez", ~160.000 personas, lengua nasa yuwe) habitan la vertiente oriental de la cordillera Central (Tierradentro, Toribío, Caldono, Jambaló) y los Misak (~30.000 personas, "guambianos", lengua namtrik) habitan Silvia, Guambía, y el Macizo Colombiano. Tras décadas de pérdida territorial por las haciendas terrajeras (peonaje por uso de tierra ancestral), el Consejo Regional Indígena del Cauca (CRIC) es fundado el 24 de febrero de 1971 en Toribío sobre siete puntos programáticos: recuperación de tierras perdidas, ampliación de resguardos, fortalecimiento de cabildos, no pago de terraje, leyes de indio, defensa de historia lengua y costumbres, formación de maestros indígenas. El CRIC implementa la recuperación de tierras (1971–1990); inaugura la Universidad Autónoma Indígena Intercultural (UAIIN, 2003); crea la Guardia Indígena (chonta como bastón de mando). Figuras: Quintín Lame Chantre (1883–1967, Los pensamientos del indio que se educó en las selvas colombianas, 1939, primer texto político indígena moderno), Lorenzo Muelas, Feliciano Valencia. La Minga Indígena (movilización colectiva) sale regularmente del Cauca a Bogotá. El Cauca ha sido también escenario atroz del conflicto armado: las FARC-EP, el ELN, los paramilitares, el ejército y desde 2016 las disidencias han masacrado líderes indígenas — en 2020–2024 el Cauca concentró ~35% del asesinato de líderes sociales del país. El CRIC es caso canónico mundial de organización indígena sostenida.',
    '4',
    'travel'
  ),
  (
    'travel-f4-pasto-narino',
    'Pasto, Nariño y el Carnaval de Negros y Blancos',
    'pasto-narino-carnaval-negros-blancos',
    'El departamento de Nariño, en el extremo suroeste, está separado del resto del país por el Nudo de los Pastos — configuración orográfica donde la cordillera Oriental colombiana se fusiona con la andina ecuatoriana — y mantiene un aislamiento histórico respecto a Bogotá y Quito. Su capital San Juan de Pasto (fundada 1539, 2.527 m, al pie del volcán Galeras en actividad) fue fortín realista durante la independencia: Agustín Agualongo lideró las guerras de Pasto (1822–1824) de resistencia al ejército bolivariano. Los pueblos Pasto (quillacingas, altiplano), Awá (piedemonte pacífico), Inga y Kamëntsá (Valle de Sibundoy, ruta amazónica) conforman la matriz indígena regional junto con población afrodescendiente del Pacífico nariñense (Tumaco). El Carnaval de Negros y Blancos de Pasto se celebra cada año del 2 al 7 de enero en secuencia ritual precisa: Pre-carnaval, Fiesta de los Inocentes, Canto a la Tierra (3 ene, homenaje a la Pachamama con delegaciones indígenas), Día de los Negros (5 ene, origen en la liberación simbólica de esclavos), Día de los Blancos (6 ene, con Desfile Magno, carrozas monumentales de hasta 15 m construidas por Maestros Carroceros en 11 meses de trabajo). Declarado Patrimonio Inmaterial UNESCO en 2009. Tumaco-La Tolita (cultura costera precolombina 300 a.C.–300 d.C., metalurgia del platino antes que Europa), el Santuario del Señor de los Milagros de Bombonal, la Laguna de la Cocha (humedal RAMSAR) y el volcán Galeras (erupciones 1989, 1993, 2004, 2005) completan el tejido nariñense.',
    '4',
    'travel'
  ),
  (
    'travel-f4-las-lajas-ipiales',
    'Santuario de Las Lajas e Ipiales: sincretismo y frontera',
    'las-lajas-ipiales-frontera-ecuador',
    'El Santuario Nacional de Nuestra Señora del Rosario de Las Lajas (Ipiales, Nariño) es una basílica neogótica construida entre 1916 y 1949 por Lucindo Espinosa sobre el cañón del río Guáitara a 2.600 m, a solo 7 km de la frontera ecuatoriana del Puente Internacional de Rumichaca. Se sostiene como un puente de tres arcos sobre un precipicio de 100 m y alberga una imagen rupestre de la Virgen del Rosario sobre una laja de roca — según la tradición devocional de 1754, aparecida milagrosamente a una indígena Awá sordomuda, María Mueses, y a su hija Rosa. El sitio es simultáneamente (a) ejemplo de sincretismo arquitectónico — neogótico tardío español en un cañón andino con devoción pre-colombina subyacente; (b) nodo peregrinacional binacional Colombia-Ecuador con ~750.000 visitantes anuales; (c) articulación física de la frontera colombo-ecuatoriana (el Puente de Rumichaca se superpone sobre un puente inca sobre el río Carchi). Ipiales (2.898 m, 115.000 habitantes) es la principal ciudad fronteriza del sur del país y mantiene una economía de frontera con flujo comercial y migratorio intenso hacia/desde Ecuador — escenario crítico en 2017–2019 (crisis migratoria venezolana vía ruta sur) y de nuevo desde 2023 por retornos. Rumichaca (del quechua "puente de piedra") es el paso terrestre principal del sur de Colombia y el único para transporte masivo entre los dos países. El sur nariñense tiene ~170.000 indígenas Awá y Pasto cuyo territorio está atravesado por la frontera.',
    '4',
    'travel'
  ),
  (
    'travel-f4-trampolin-muerte',
    'Trampolín de la Muerte: el corredor Andes-Amazonía',
    'trampolin-muerte-andes-amazonia',
    'La vía Pasto–Mocoa, conocida popularmente como Trampolín de la Muerte o Trampolín del Diablo, es una carretera de montaña de 142 km que desciende desde el altiplano pastuso (~2.700 m en Pasto) hasta la capital del Putumayo (Mocoa, 615 m) cruzando la cordillera Oriental por el páramo de Bordoncillo y descendiendo por un corredor de nubes con cornisas de apenas 3 m de ancho sobre precipicios de 400–500 m. Fue construida originalmente en 1930–1934 como vía militar durante el conflicto colombo-peruano (1932–1933, disputa por Leticia tras el Tratado Salomón-Lozano 1922) para movilizar tropas desde el interior al frente del Putumayo. El trazado se mantiene casi idéntico 90 años después: una sola vía, tramos de una mano alternada, sin barreras ni señalización adecuada, vulnerable a deslizamientos constantes por la altísima pluviosidad del piedemonte amazónico (más de 4.000 mm anuales). Es considerada una de las carreteras más peligrosas del mundo. La Variante San Francisco–Mocoa (carretera moderna de 45 km con 49 puentes y 13 túneles), financiada por BID/CAF y en construcción desde 2009, pretende reemplazarla; tras múltiples paros por cuestionamientos ambientales (cruza el corredor Alto Fragua Indiwasi y territorios Kamëntsá e Inga) su finalización se proyecta hacia 2027–2028. El Trampolín es la materialización física del gradiente altitudinal Andes-Amazonía: cruzarlo en moto es literalmente bajarse de la cordillera a la selva — el mismo descenso que hicieron los colonizadores del caucho y que hoy hacen los migrantes y el flujo cocalero.',
    '4',
    'travel'
  ),
  (
    'travel-f4-caucho-casa-arana',
    'Putumayo y ciclo del caucho: Casa Arana y genocidio amazónico',
    'putumayo-caucho-casa-arana-genocidio',
    'Entre 1879 y 1912 la Amazonía noroccidental — entre los ríos Caquetá, Putumayo, Napo y Yurúa — vive el ciclo del caucho: la demanda mundial de caucho natural (Hevea brasiliensis) explota tras la invención del neumático (Dunlop 1888) y la electrificación urbana global, alcanzando precios récord en la bolsa de Londres. La Casa Arana (Julio César Arana del Águila, peruano nacido en Rioja 1864, muerto 1952), con sede social en Iquitos y financiamiento principalmente londinense (Peruvian Amazon Company cotizada en la Bolsa de Londres desde 1908), monopoliza la explotación en el Putumayo-Caquetá — territorio de los pueblos Uitoto (Murui-Muinane), Bora, Andoque, Ocaina, Muinane y Nonuya. El sistema operativo: habilitación (adelanto en mercancías que los indígenas deben pagar con caucho) que se convierte en peonaje por deuda; capataces de origen barbadense — los muchachos de confianza — aplican disciplina laboral con marquetería (tortura), violaciones sistemáticas a mujeres, castigos con cepo, mutilaciones. La denuncia pública la inicia Walter Hardenburg en The Devil''s Paradise (1909, Truth de Londres). Ante el escándalo la Foreign Office envía al cónsul británico Roger Casement (irlandés, nacionalista, antes había denunciado el Congo de Leopoldo II) al Putumayo en 1910; publica su Informe Casement sobre el Putumayo (1912) documentando el genocidio: aproximadamente 40.000 indígenas asesinados entre 1900 y 1912 (estimaciones amplían a 60.000–80.000 víctimas). Arana no es condenado penalmente pese al escándalo. La empresa colapsa con el boom del caucho asiático plantado (Malasia, Ceilán) a partir de 1912. El caucho es la contracara amazónica del auge cafetero: el café produjo pequeña propiedad paisa con el Estado presente; el caucho produjo genocidio amazónico sin Estado.',
    '4',
    'travel'
  ),
  (
    'travel-f4-farc-sustitucion-pnis',
    'Conflicto armado sur: FARC, PNIS y sustitución de cultivos',
    'farc-putumayo-caqueta-sustitucion-pnis',
    'El sur andino-amazónico (Putumayo, Caquetá, Huila sur, Cauca, Nariño) es núcleo histórico del conflicto armado colombiano. Las FARC-EP nacen en 1964 en Marquetalia (Tolima, entre Planadas e Ibagué) tras la Operación Marquetalia del gobierno Guillermo León Valencia contra las autodefensas campesinas comunistas de Manuel Marulanda Vélez "Tirofijo" y Jacobo Arenas. El grueso del Bloque Sur FARC opera en Caquetá y Putumayo con frentes 48, 32, 15 y 49; el Bloque Occidental opera en Cauca y Nariño. Desde los años 80 la economía cocalera sustituye paulatinamente la coca tradicional indígena: el Putumayo llega a concentrar ~40.000 ha de coca en 2000, por lo cual se convierte en el epicentro del Plan Colombia (2000, USD 10.000 millones, con fumigaciones aéreas con glifosato, destrucción ambiental masiva documentada). El punto álgido es la Zona de Distensión del Caguán (1998–2002, 42.000 km² desmilitarizados para negociaciones Pastrana-Marulanda que colapsan tras secuestros) y las masacres paramilitares del Bloque Sur AUC (Mapiripán 1997, El Tigre Putumayo 1999, ~300 masacres). El Acuerdo Final de Paz de La Habana (24 nov 2016, Santos–Timochenko, Teatro Colón Bogotá) crea el Programa Nacional Integral de Sustitución (PNIS) con asistencia estatal a ~99.000 familias. Su ejecución ha sido parcialmente exitosa y parcialmente colapsada; la re-expansión coca post-2017 (Catatumbo, Putumayo occidental) y el fortalecimiento de disidencias FARC (Segunda Marquetalia de Iván Márquez, Estado Mayor Central de Iván Mordisco) mantienen territorios bajo control no estatal. El sur es también epicentro del asesinato de firmantes de paz (~430 excombatientes asesinados 2016–2024). La JEP procesa crímenes del conflicto en siete macrocasos. Esta fase cierra con conciencia de que el sur no es "postal indígena" sino el territorio donde se juega la resolución — o no — del conflicto colombiano.',
    '4',
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
  ('travel-f4-popayan-oligarquia',      'travel-f1-virreinatos'),
  ('travel-f4-popayan-oligarquia',      'travel-f1-rutas-coloniales'),
  ('travel-f4-san-agustin',             'travel-f1-pueblos-precolombinos'),
  ('travel-f4-cric-nasa-misak',         'travel-f4-san-agustin'),
  ('travel-f4-cric-nasa-misak',         'travel-f1-pueblos-precolombinos'),
  ('travel-f4-cric-nasa-misak',         'travel-f1-divergencia-poscolonial'),
  ('travel-f4-pasto-narino',            'travel-f4-popayan-oligarquia'),
  ('travel-f4-pasto-narino',            'travel-f1-independencias'),
  ('travel-f4-las-lajas-ipiales',       'travel-f4-pasto-narino'),
  ('travel-f4-trampolin-muerte',        'travel-geo-sudamerica'),
  ('travel-f4-caucho-casa-arana',       'travel-f4-trampolin-muerte'),
  ('travel-f4-caucho-casa-arana',       'travel-f1-divergencia-poscolonial'),
  ('travel-f4-farc-sustitucion-pnis',   'travel-f4-cric-nasa-misak'),
  ('travel-f4-farc-sustitucion-pnis',   'travel-f4-caucho-casa-arana'),
  ('travel-f4-farc-sustitucion-pnis',   'travel-f1-divergencia-poscolonial')
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
    'travel-r-safford-palacios-colombia',
    'Colombia: país fragmentado, sociedad dividida (caps. para F4)',
    'book',
    'https://archive.org/details/safford-frank-palacios-marco-colombia-pais-fragmentado-sociedad-dividida-ocr-2002',
    'Frank Safford y Marco Palacios',
    '4',
    'Manual canónico de historia de Colombia (Norma, 2002; orig. Oxford UP 2001). Safford (Northwestern) y Palacios (Andes) escriben la síntesis más rigurosa disponible. Lectura para F4: Cap 1-2 (geografía e indígenas), Cap 4 (Popayán y el sur), Cap 12 (el sur y el conflicto XX).',
    12.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-san-agustin-arqueologia',
    'San Agustín: arqueología del Alto Magdalena',
    'book',
    'https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/224',
    'Gerardo Reichel-Dolmatoff + Luis Duque Gómez (ICANH)',
    '4',
    'Reichel-Dolmatoff es el padre de la arqueología colombiana moderna (San Agustín: A Culture of Colombia, Praeger 1972; ed. española Banco Popular 1975). Complementar con Luis Duque Gómez Exploraciones arqueológicas en San Agustín (ICANH 1964) y dossier UNESCO del Parque Arqueológico (1995) y del vecino Tierradentro.',
    5.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cric-lucha-indigena',
    'CRIC: 40+ años de lucha indígena',
    'book',
    'https://www.cric-colombia.org/portal/wp-content/uploads/2013/07/CRIC-40-ANOS-LUCHA.pdf',
    'Consejo Regional Indígena del Cauca (CRIC)',
    '4',
    'Libro digital de acceso libre del CRIC sobre 40 años de organización indígena. Complementar con documentales 50 años del CRIC, Quintín Lame (Los pensamientos del indio, 1939) y Joanne Rappaport (Georgetown) como antropóloga anglo canónica sobre el Cauca.',
    5.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-carnaval-pasto',
    'Carnaval de Negros y Blancos de Pasto',
    'video',
    'https://www.senalmemoria.co/articulos/carnaval-negros-blancos-pasto',
    'Señal Memoria / RTVC + UNESCO',
    '4',
    'Archivo audiovisual estatal colombiano sobre el Carnaval de Negros y Blancos (Patrimonio Inmaterial UNESCO 2009). Complementar con ficha UNESCO, sitio Corpocarnaval, paper Universidad de Nariño sobre religiosidad popular andina, y el largometraje Mi padre el carroza (Diego García-Moreno, 2016) sobre la familia Zarama de carroceros.',
    3.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-las-lajas-frontera',
    'Las Lajas, Ipiales y frontera colombo-ecuatoriana',
    'article',
    'https://enciclopedia.banrepcultural.org/index.php/Santuario_de_Las_Lajas',
    'Banco de la República — Enciclopedia Banrepcultural',
    '4',
    'Fuentes académicas que articulan arquitectura + devoción + geopolítica de frontera. Complementar con paper Redalyc sobre peregrinación Las Lajas y artículo Javeriana sobre la frontera Rumichaca. Cruzar con reportes sobre migración venezolana por Rumichaca 2017-2024 si se profundiza el eje frontera.',
    2.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-trampolin-muerte-corredor',
    'Trampolín de la Muerte y el corredor Andes-Amazonía',
    'article',
    'https://www.elespectador.com/colombia/mas-regiones/el-trampolin-de-la-muerte-la-carretera-que-une-a-putumayo-con-el-resto-del-pais/',
    'El Espectador + Semana + Mongabay Latam + Invías',
    '4',
    'Triangulación de periodismo serio colombiano (El Espectador, Semana), ambiental (Mongabay sobre la Variante San Francisco-Mocoa) y técnico (Invías Ruta 45), con paper histórico sobre el conflicto colombo-peruano 1932. La vía no es anecdótica sino materialización de una geografía política.',
    3.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-voragine-casement-caucho',
    'La vorágine + Informe Casement (caucho, Casa Arana)',
    'book',
    'https://archive.org/details/lavoraginecolecc0000rive',
    'José Eustasio Rivera + Roger Casement + Roberto Pineda Camacho',
    '4',
    'Tríptico poderosísimo: La vorágine (Rivera, 1924, novela canónica del caucho colombiano, centenario 2024 con edición crítica Biblioteca Nacional); Informe Casement sobre el Putumayo (1912, ed. ICANH 1988) como documento primario del genocidio; Holocausto en el Amazonas (Pineda Camacho, Planeta/Banrepcultural 2000) como historiografía. Complementar con Taussig (Cultura del terror).',
    12.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cev-2022-conflicto-sur',
    'Hay futuro si hay verdad — Informe Final Comisión de la Verdad 2022',
    'book',
    'https://www.comisiondelaverdad.co/hay-futuro-si-hay-verdad',
    'Comisión para el Esclarecimiento de la Verdad (CEV)',
    '4',
    'Informe Final de la CEV (junio 2022, 11 tomos, 500.000 testimonios). Priorizar Tomo 1 (Hallazgos) + Tomo Colombia adentro (territorial, con capítulos específicos Putumayo/Cauca/Nariño). Complementar con ¡Basta ya! CNMH 2013, macrocasos JEP, monitoreo UNODC de cultivos y El orden desarmado de Gutiérrez Sanín (IEPRI-UNAL 2020).',
    8.0,
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
  ('travel-r-safford-palacios-colombia',    'travel-f4-popayan-oligarquia',      FALSE),
  ('travel-r-san-agustin-arqueologia',      'travel-f4-san-agustin',             FALSE),
  ('travel-r-cric-lucha-indigena',          'travel-f4-cric-nasa-misak',         FALSE),
  ('travel-r-carnaval-pasto',               'travel-f4-pasto-narino',            FALSE),
  ('travel-r-las-lajas-frontera',           'travel-f4-las-lajas-ipiales',       FALSE),
  ('travel-r-trampolin-muerte-corredor',    'travel-f4-trampolin-muerte',        FALSE),
  ('travel-r-voragine-casement-caucho',     'travel-f4-caucho-casa-arana',       FALSE),
  ('travel-r-cev-2022-conflicto-sur',       'travel-f4-farc-sustitucion-pnis',   FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
