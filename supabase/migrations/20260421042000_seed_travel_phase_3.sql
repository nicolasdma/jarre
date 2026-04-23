-- ============================================================================
-- Travel track — Phase 3 (Colombia Andina Norte) canonical seed
-- Source of truth: docs/travel-track/phase-3-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f3-colonizacion-antioquena',
    'Colonización antioqueña y configuración del paisa',
    'colonizacion-antioquena-identidad-paisa',
    'Entre fines del siglo XVIII y principios del XX (~1780–1910), campesinos de Antioquia mineral y montañosa — agotada la minería aurífera, con alta presión demográfica en valles estrechos — se expanden hacia el sur por las vertientes de la cordillera Central abriendo con hacha y machete tierras baldías que se convierten en municipios: Sonsón (1789), Abejorral, Aguadas, Manizales (1849), Salamina, Pácora, Pereira (1863), Armenia (1889), Sevilla, Calarcá, y en la vertiente occidental Jericó, Andes, Ciudad Bolívar, Caramanta. A diferencia de la hacienda caribe o caucana, el modelo productivo que se instala es el minifundio familiar — baldíos adjudicados a familias que trabajan la tierra con mano de obra propia, sin esclavos ni peonaje, con cultivo mixto (maíz, fríjol, plátano, caña de panela, ganadería menor y café creciente). El efecto sociológico es profundo: la estructura de propiedad pequeña, la endogamia regional, el catolicismo militante y el arriero-comerciante como figura central configuran una identidad — el paisa — distinta de la "gente de la sabana" bogotana y del Caribe costeño. Este arreglo produce también una demografía: la "whiteness" regional (Nancy Appelbaum) construida sobre la invisibilización de indígenas y afrodescendientes. La colonización antioqueña es el fundamento social del café, del conflicto por la tierra (guerras del Quindío 1900–1920) y de la identidad cultural que hoy exporta el Eje Cafetero.',
    '3',
    'travel'
  ),
  (
    'travel-f3-medellin-arco',
    'Medellín industrial, narcotráfico y urbanismo social',
    'medellin-industria-narco-urbanismo',
    'Medellín (fundada 1675 en el Valle de Aburrá, capital de Antioquia desde 1826) sigue un arco en tres fases que la distinguen de cualquier otra ciudad colombiana. (a) Ciudad industrial (1905–1980): entre Coltejer (1907), Fabricato (1920), Postobón, Bavaria, los almacenes Éxito (1949) y la UdeA modernizada, Medellín se convierte en la ciudad industrial textil-metalúrgica más importante de Colombia y en sede de la burguesía católica del país. (b) Capital mundial del narcotráfico (1975–1993): el Cartel de Medellín liderado por Pablo Escobar Gaviria construye la primera red transnacional de cocaína a gran escala, captura el Estado (asesinato del ministro Lara Bonilla 1984, magnicidios Galán 1989, Pizarro y Jaramillo Ossa 1990, atentado Avianca 203 y DAS 1989), convierte a Medellín en la ciudad con mayor tasa de homicidios del mundo (381 por cada 100.000 habitantes en 1991) y muere en persecución el 2 de diciembre de 1993. (c) Urbanismo social y "modelo Medellín" (2004–2015): Sergio Fajardo alcalde implementa con EAFIT-Urbam una política que combina Metrocable Línea K (2004, primer teleférico urbano del mundo en uso cotidiano), Parques Biblioteca (España, La Ladera, San Javier), intervención Comuna 13 con escaleras eléctricas (2011), Museo Casa de la Memoria y presupuesto participativo. La transformación fue premiada con el Lee Kuan Yew World City Prize 2016. Las tres fases son inseparables: el urbanismo social solo tiene sentido entendido como respuesta política al hueco dejado por el Estado durante el arco narco.',
    '3',
    'travel'
  ),
  (
    'travel-f3-santa-fe-quimbaya',
    'Santa Fe de Antioquia y orfebrería Quimbaya',
    'santa-fe-antioquia-quimbaya-orfebreria',
    'Santa Fe de Antioquia, fundada por Jorge Robledo el 4 de diciembre de 1541 a orillas del río Cauca (a 56 km de Medellín), fue la primera capital de la provincia de Antioquia hasta 1826 y el centro colonial del oro en la región — alrededor de su jurisdicción se explotaron las minas aluviales del Cauca, el Nechí y el Porce con mano de obra esclavizada africana. Conserva un conjunto arquitectónico colonial intacto: Catedral (1797), iglesias de Santa Bárbara y Jesús Nazareno, el Puente de Occidente (1887, José María Villa — suspendido de 291 m). La región Cauca medio entre Santa Fe y el Eje Cafetero fue territorio de la cultura Quimbaya, floreciente entre los siglos I y X d.C. Los Quimbaya son autores del Tesoro de los Quimbaya — ~125 piezas de oro (poporos, figurillas antropomorfas, alfileres) encontradas en una tumba en 1890 cerca de La Soledad (Filandia, Quindío). El gobierno de Carlos Holguín las obsequió en 1892–1893 al gobierno de María Cristina de España como agradecimiento por un laudo arbitral; hoy están en el Museo de América (Madrid) y son objeto de demanda de restitución desde 2017 (acción popular ganada ante el Consejo de Estado colombiano, ejecución pendiente). Los poporos Quimbaya son el emblema del Museo del Oro de Bogotá (logo del Banco de la República).',
    '3',
    'travel'
  ),
  (
    'travel-f3-eje-cafetero',
    'Eje Cafetero, Federación y Paisaje Cultural Cafetero',
    'eje-cafetero-federacion-paisaje-unesco',
    'El café (Coffea arabica) entra a Colombia por la frontera venezolana a fines del siglo XVIII; a partir de 1870 las laderas templadas (1.200–2.000 m) del piedemonte occidental de la cordillera Central — Caldas, Quindío, Risaralda, norte del Valle, norte del Tolima, suroeste antioqueño — colonizadas por el flujo antioqueño se vuelven cafeteras: el café se adapta perfectamente al minifundio familiar. En 1927 se funda la Federación Nacional de Cafeteros (FNC), organización cuasipública que institucionaliza el gremio: administra el Fondo Nacional del Café, establece precios mínimos internos, compra con cédula cafetera a los caficultores, construye infraestructura rural, financia investigación en Cenicafé (fundado 1938, responsable de variedades como Caturra, Colombia, Castillo, Cenicafé 1) y proyecta la marca mundial. En 1959 nace el personaje Juan Valdez, ícono publicitario mundial. El Paisaje Cultural Cafetero Colombiano (PCCC) — 47 municipios de 4 departamentos, ~143.000 ha — es declarado Patrimonio Mundial UNESCO en 2011, único paisaje productivo del mundo con esta categoría, por la singularidad de la asociación café/plátano de sombra/guadua/casa bahareque/arriería. Colombia es el 3° productor mundial de café y el 1° de arábigo suave lavado. La FNC fue poder paralelo al Estado colombiano durante décadas; su declive desde los años 90 (ruptura del Pacto Internacional 1989, volatilidad, Roya 2008–2012) es parte del desmonte del capitalismo corporativo colombiano.',
    '3',
    'travel'
  ),
  (
    'travel-f3-cali-valle-cana',
    'Cali, Valle del Cauca y la caña',
    'cali-valle-del-cauca-cana',
    'El Valle geográfico del río Cauca entre el norte del Valle y el sur del Cauca es una llanura fértil (1.000 m, clima cálido seco) donde desde el siglo XVII se instala la hacienda de caña de azúcar con mano de obra esclavizada africana traída principalmente desde el Chocó y la costa. La geografía produce una de las tres grandes concentraciones afrocolombianas del país (Caribe, Pacífico, norte del Cauca-sur del Valle) y una estructura de propiedad latifundista muy distinta del minifundio antioqueño. En la república la caña se moderniza: el Ingenio Manuelita (fundado 1864 por James Eder) inaugura el proceso industrial; Ingenio Providencia, Cauca, Pichichí, Riopaila constituyen el complejo agroindustrial azucarero que hoy produce ~23 millones de toneladas de caña anuales sobre ~230.000 ha. Cali — fundada por Sebastián de Belalcázar el 25 de julio de 1536 — pasa de ciudad comercial provincial a tercera ciudad del país en el siglo XX tras la apertura del Ferrocarril del Pacífico (1915) y del puerto de Buenaventura. La identidad caleña se arma sobre tres pilares: (a) la salsa — desde los 70s Cali es "capital mundial de la salsa" con Grupo Niche, Guayacán, Fania en picós y Juanchito; (b) la comunidad afrocolombiana del norte del Cauca (Jairo Varela, Joe Arroyo en diálogo); (c) el Cartel de Cali de los Rodríguez Orejuela (1977–1995), segunda generación del narcotráfico, más "empresarial" que Medellín, capturado en Operación Ciénaga (1995). Cali/Valle es también escenario clave del estallido social 2021 (Puerto Resistencia, Siloé).',
    '3',
    'travel'
  ),
  (
    'travel-f3-bogotazo-violencia',
    'Bogotazo, La Violencia y gestación del conflicto',
    'bogotazo-violencia-bipartidista',
    'El 9 de abril de 1948 Juan Roa Sierra asesina a Jorge Eliécer Gaitán, caudillo liberal de izquierda favorito para la presidencia de 1950. La turba popular lincha a Roa Sierra y desata el Bogotazo — incendio del centro histórico, saqueo de comercios, asalto a la policía, ~3.000 muertos en 48 horas — que se extiende al país como insurrección popular espontánea. El Bogotazo es el detonante (no la causa) de La Violencia bipartidista 1948–1958: la guerra entre liberales y conservadores por el control del Estado después de casi un siglo de alternancia violenta. La región del Eje Cafetero — Caldas, Quindío, Tolima, norte del Valle — es epicentro de La Violencia: masacres de liberales por "chulavitas" y "pájaros" (escuadrones conservadores patrocinados por la policía), aparición de las guerrillas liberales del Llano (Dumar Aljure, Guadalupe Salcedo) y las autodefensas campesinas comunistas del sur del Tolima (Marquetalia, Riochiquito) que se reorganizarán como FARC-EP en 1964 tras la Operación Marquetalia. Saldo: ~200.000 muertos, millones de desplazados. El Frente Nacional (1958–1974) — alternancia pactada entre los dos partidos — cierra formalmente La Violencia pero cristaliza la exclusión política que alimentará las guerrillas de los 60–70 (FARC, ELN 1964, EPL 1967, M-19 1974). El conflicto armado colombiano empieza en 1948.',
    '3',
    'travel'
  ),
  (
    'travel-f3-nevados-armero',
    'Parques Nevados, volcanismo andino y tragedia de Armero 1985',
    'nevados-armero-tragedia-1985',
    'El Parque Nacional Natural Los Nevados (creado 1973, ~58.000 ha) contiene la cadena volcánica más activa del norte de los Andes colombianos: Nevado del Ruiz (5.321 m, activo), Nevado del Tolima (5.215 m), Nevado de Santa Isabel (4.950 m, perdió su glaciar en 2023), Cisne y Quindío. Es la expresión regional del vulcanismo asociado a la subducción Nazca-Sudamericana y sostiene el páramo de mayor extensión andino-tropical — ecosistema único con frailejones (Espeletia), endémico entre 3.500–4.800 m. El 13 de noviembre de 1985, a las 21:09, una erupción moderada del Nevado del Ruiz genera un lahar — flujo de lodo y escombros producido por fusión súbita del glaciar somital con material piroclástico caliente — que desciende por el río Lagunillas y, tras recorrer 60 km a ~60 km/h, sepulta la ciudad de Armero (Tolima, ~29.000 habitantes) aproximadamente a las 23:30. Mueren ~23.000 personas (≈25.000 contando Chinchiná y comunidades menores), la mayor catástrofe natural de la historia de Colombia. La tragedia fue anunciada: desde septiembre de 1985 INGEOMINAS y vulcanólogos internacionales advertían sobre el lahar; se elaboró un mapa de riesgo preciso un mes antes; hubo fallos burocráticos y desestimación de las alertas. El caso Armero es hoy la referencia canónica mundial en la enseñanza de gestión de riesgo volcánico (USGS, UNDRR). La niña Omayra Sánchez — 13 años, atrapada 60 horas en los escombros, fallecida ante las cámaras del mundo el 16 de noviembre — es símbolo del desastre.',
    '3',
    'travel'
  ),
  (
    'travel-f3-sintesis-andina-norte',
    'Síntesis: el país andino central como núcleo económico y político',
    'sintesis-region-andina-norte',
    'Cierre de fase. La región Andina Norte — Antioquia + Eje Cafetero + norte del Valle — es el núcleo económico y demográfico de Colombia desde fines del siglo XIX: concentra aproximadamente el 40% del PIB nacional, produce el café, la industria textil y metalúrgica histórica, el azúcar, buena parte del retail moderno (Grupo Éxito, Cine Colombia, Jumbo), los bancos más grandes (Bancolombia) y las tres áreas metropolitanas más dinámicas después de Bogotá (Medellín, Cali, Pereira-Manizales-Armenia). Pero ese centro dinámico convive con las líneas de falla del país: La Violencia (1948) arranca aquí, las FARC nacen aquí (Marquetalia 1964, Tolima/Huila), el narcotráfico escala a mundial aquí (Cartel Medellín, Cartel Cali), y las mayores transformaciones urbanas del país (modelo Medellín) también suceden aquí. Comprender la Andina Norte es comprender por qué Colombia — a diferencia de Argentina o Chile, donde la capital concentra absolutamente — es un país policéntrico: Bogotá no subordinó al país, la Andina Norte siempre fue contrapeso económico y cultural. Esa geografía explica tanto la riqueza institucional del país (prensa, universidades, empresa formal) como la persistencia del conflicto.',
    '3',
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
  ('travel-f3-colonizacion-antioquena',   'travel-f1-virreinatos'),
  ('travel-f3-colonizacion-antioquena',   'travel-f1-rutas-coloniales'),
  ('travel-f3-medellin-arco',             'travel-f3-colonizacion-antioquena'),
  ('travel-f3-medellin-arco',             'travel-f1-divergencia-poscolonial'),
  ('travel-f3-santa-fe-quimbaya',         'travel-f3-colonizacion-antioquena'),
  ('travel-f3-santa-fe-quimbaya',         'travel-f1-pueblos-precolombinos'),
  ('travel-f3-eje-cafetero',              'travel-f3-colonizacion-antioquena'),
  ('travel-f3-cali-valle-cana',           'travel-f3-colonizacion-antioquena'),
  ('travel-f3-cali-valle-cana',           'travel-f1-rutas-coloniales'),
  ('travel-f3-bogotazo-violencia',        'travel-f3-colonizacion-antioquena'),
  ('travel-f3-bogotazo-violencia',        'travel-f3-medellin-arco'),
  ('travel-f3-bogotazo-violencia',        'travel-f1-divergencia-poscolonial'),
  ('travel-f3-nevados-armero',            'travel-f3-eje-cafetero'),
  ('travel-f3-nevados-armero',            'travel-geo-sudamerica'),
  ('travel-f3-sintesis-andina-norte',     'travel-f3-colonizacion-antioquena'),
  ('travel-f3-sintesis-andina-norte',     'travel-f3-medellin-arco'),
  ('travel-f3-sintesis-andina-norte',     'travel-f3-eje-cafetero'),
  ('travel-f3-sintesis-andina-norte',     'travel-f3-cali-valle-cana'),
  ('travel-f3-sintesis-andina-norte',     'travel-f3-bogotazo-violencia')
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
    'travel-r-parsons-colonizacion',
    'La colonización antioqueña en el occidente de Colombia',
    'book',
    'https://babel.banrepcultural.org/digital/collection/p17054coll10/search/searchterm/Parsons%20Antioque%C3%B1a',
    'James J. Parsons (UC Berkeley)',
    '3',
    'Texto fundacional de los estudios sobre la colonización antioqueña (UC Press, 1949; ed. española Banrep 1950; reed. El Áncora 1997). ~230 pp. Complementar con Nancy Appelbaum (Muddied Waters / Dos plazas y una nación) para la relectura crítica poscolonial sobre la construcción de la identidad "blanca" antioqueña.',
    6.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-escobar-medellin',
    'Pablo Escobar y Medellín: 30 años (Señal Memoria)',
    'video',
    'https://www.senalmemoria.co/articulos/pablo-escobar-caida-30-anos',
    'Señal Memoria / RTVC',
    '3',
    'Material periodístico colombiano sobre el Cartel de Medellín y la captura del Estado 1975-1993. Evitar docu-ficción dramatizados de Netflix (Narcos). Complementar con especial 30 años de El Colombiano y artículo académico de Uniandes sobre el narcotráfico como política pública. Para la capa urbanismo social sumar BID + entrevistas Fajardo/Echeverri.',
    3.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-quimbaya-tesoro',
    'Tesoro de los Quimbaya — colección Museo del Oro',
    'article',
    'https://www.banrepcultural.org/museo-del-oro/exposicion/sala-gente/quimbaya',
    'Museo del Oro — Banco de la República',
    '3',
    'El Museo del Oro es el acervo académico de referencia. Complementar con artículo Banrepcultural sobre restitución del Tesoro + paper ICANH sobre Quimbaya + sentencia Consejo de Estado 2017. Caso pedagógicamente riquísimo: arqueología + derecho internacional + política de restitución.',
    2.5,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-pccc-cafe',
    'Paisaje Cultural Cafetero (UNESCO) + Marco Palacios, El café en Colombia',
    'article',
    'https://whc.unesco.org/es/list/1121',
    'UNESCO + Marco Palacios (Universidad de los Andes)',
    '3',
    'Dossier UNESCO del Paisaje Cultural Cafetero (47 municipios, criterios V y VI) + libro canónico de Marco Palacios "El café en Colombia 1850–1970" (historia social del grano, disponible en archive.org) + expediente técnico Mincultura + página institucional Cenicafé.',
    5.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cali-salsa-valle',
    'La salsa en Cali — historia cultural del Valle del Cauca',
    'book',
    'https://programaeditorial.univalle.edu.co/gpd-la-salsa-en-cali-9789587659160-0a8d4b64.html',
    'Alejandro Ulloa — Universidad del Valle',
    '3',
    'Ulloa es el etnomusicólogo canónico sobre salsa caleña (Univalle, 1992; reed. 2009). Complementar con documental Señal Colombia "Cali, pachanguero" y artículos de Alfonso Múnera sobre afrocolombianidad del Valle (Javeriana).',
    6.0,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-gaitan-violencia',
    'Mataron a Gaitán — Bogotazo y La Violencia (Braun + Palacios)',
    'book',
    'https://babel.banrepcultural.org/digital/collection/p17054coll18/id/157',
    'Herbert Braun + Marco Palacios',
    '3',
    'Braun, "Mataron a Gaitán: vida pública y violencia urbana en Colombia" (Norma, 1987; orig. UW Press 1985), es EL libro sobre el 9 de abril. Palacios, "Entre la legitimidad y la violencia: Colombia 1875-1994" (Norma, 1995), es la síntesis académica del siglo XIX y XX colombianos. Complementar con capítulo I del informe ¡Basta ya! del CNMH.',
    10.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-armero-nevado-ruiz',
    'Armero y el Nevado del Ruiz — 40 años (Señal Memoria + SGC + USGS)',
    'video',
    'https://www.senalmemoria.co/articulos/armero-40-anos-tragedia',
    'Señal Memoria / RTVC + Servicio Geológico Colombiano + USGS',
    '3',
    'Triangulación entre archivo audiovisual colombiano (Señal Memoria, aniversario 40), página institucional del SGC sobre el Nevado del Ruiz (rigurosa técnicamente) y estudio de caso USGS. Complementar con paper SciELO sobre Armero y comunicación del riesgo. Caso canónico mundial en gestión de riesgo volcánico.',
    3.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-basta-ya-cnmh',
    '¡Basta ya! Colombia: memorias de guerra y dignidad',
    'book',
    'https://centrodememoriahistorica.gov.co/descargas/informes2013/bastaYa/basta-ya-colombia-memorias-de-guerra-y-dignidad-2016.pdf',
    'Centro Nacional de Memoria Histórica (Gonzalo Sánchez G., dir.)',
    '3',
    'Informe oficial más importante sobre el conflicto armado colombiano hasta 2013 y base del proceso de paz de La Habana. Lectura: Intro + Cap I "Un conflicto de múltiples dimensiones" + Cap II "Los orígenes, dinámicas y crecimiento". Complementar con informe de la Comisión de la Verdad 2022 "Hay futuro si hay verdad".',
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
  ('travel-r-parsons-colonizacion',     'travel-f3-colonizacion-antioquena', FALSE),
  ('travel-r-escobar-medellin',         'travel-f3-medellin-arco',           FALSE),
  ('travel-r-quimbaya-tesoro',          'travel-f3-santa-fe-quimbaya',       FALSE),
  ('travel-r-pccc-cafe',                'travel-f3-eje-cafetero',            FALSE),
  ('travel-r-cali-salsa-valle',         'travel-f3-cali-valle-cana',         FALSE),
  ('travel-r-gaitan-violencia',         'travel-f3-bogotazo-violencia',      FALSE),
  ('travel-r-armero-nevado-ruiz',       'travel-f3-nevados-armero',          FALSE),
  ('travel-r-basta-ya-cnmh',            'travel-f3-sintesis-andina-norte',   FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
