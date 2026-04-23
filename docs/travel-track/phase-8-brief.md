# Fase 8 — Cordillera Blanca (Ancash) · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 8 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='8'`.

**Para el coordinator (yo mismo, futuro):** la Cordillera Blanca en Ancash es la fase bisagra entre costa (F7) y sur andino (F9). Es la cordillera tropical más alta del mundo (Huascarán 6 768 m), laboratorio geológico, matriz pan-andina (Chavín de Huántar está físicamente acá), escena del peor desastre sísmico-aluvional del siglo XX peruano (Yungay 1970, ~70–80 000 muertos) y sitio donde nace la reforma agraria de Velasco Alvarado. El usuario va a recorrer el Callejón de Huaylas bajando por el río Santa, cruzando el Cañón del Pato (35 túneles, hidroeléctrica de 1958), asomándose a Huascarán y caminando Chavín. La fase debe instalar: (a) geomorfología y retroceso glaciar como termómetro climático, (b) Chavín de Huántar como sitio físico con su Lanzón y cabezas clavas, (c) Yungay 1970 como memoria del límite entre civilización y geología, (d) Velasco y reforma agraria como cierre político del XX serrano, y (e) Sendero Luminoso como sombra que pasa por Ancash sin epicentrarse. 8 conceptos, 8 recursos, cada URL verificada en search results del 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué la Cordillera Blanca es la cordillera tropical más alta del planeta y por qué su paralela Cordillera Negra (más baja, sin glaciares) define un corredor único — el Callejón de Huaylas — que es el único surco norte-sur habitable entre 2 500 y 3 500 m en el norte peruano; por qué Chavín de Huántar (1200–200 a.C.) es no sólo matriz iconográfica pan-andina (visto en F7) sino un sitio físico deliberadamente ingenierizado sobre una confluencia hídrica, con galerías subterráneas, canales para control acústico, el Lanzón monolítico todavía *in situ* y cabezas clavas que probablemente representen estados de consciencia alterada inducida por *San Pedro*; por qué el terremoto del 31 de mayo de 1970 (magnitud 7.9) desprendió la ladera norte del Huascarán generando un aluvión de hielo-roca-lodo que a ~300 km/h sepultó Yungay en tres minutos matando ~25 000 personas de golpe y ~70 000 en toda la región — quedando sólo cuatro palmeras y un Cristo en pie como campo santo; por qué el gobierno de Juan Velasco Alvarado (1968–1975, "Gobierno Revolucionario de la Fuerza Armada") nacionaliza el petróleo (IPC, 1968), promulga la reforma agraria más radical de Sudamérica ("*Campesino, el patrón ya no comerá más de tu pobreza*", 24 de junio de 1969) y deporta a Cotler y Quijano entre otros — paradojas que Julio Cotler (*Clases, Estado y nación en el Perú*, 1978) y Aníbal Quijano luego leerán como el último intento de capitalismo nacional-corporativo andino; por qué el Cañón del Pato (donde el río Santa se encajona entre Huaylas y Huallanca) es a la vez obra de ingeniería civil monumental (hidroeléctrica 1958, 35 túneles, autopista sobre precipicio) y un umbral geográfico que separa la sierra verde del desierto costero; por qué el Parque Nacional Huascarán (UNESCO 1985) con 663 glaciares es hoy el termómetro climático del Perú — el glaciar Pastoruri perdió 32 m/año de masa y tiene ~10 años de vida útil — y por qué la "Ruta del Cambio Climático" creada allí es uno de los primeros circuitos de *educación ambiental de duelo* en Sudamérica; y finalmente por qué Ancash fue *zona de paso* y no epicentro del conflicto armado interno de Sendero Luminoso — pobreza rural y fragmentación comunal aportaron contexto pero la violencia senderista se concentró en Ayacucho, Huancavelica y Apurímac (síntesis canónica de Carlos Iván Degregori para la CVR, 2003).

---

## Conceptos (8)

### C1. Geología de la Cordillera Blanca: cordillera tropical más alta del mundo y retroceso glaciar
- **ID sugerido:** `travel-f8-geologia-blanca`
- **Slug:** `geologia-cordillera-blanca-tropical`
- **Definición canónica:** La Cordillera Blanca es un ramal de los Andes Centrales de ~180 km de largo entre 8°30′ S y 10°10′ S en el departamento de Ancash, con ~35 picos sobre 6 000 m — incluyendo el *Huascarán* (6 768 m, montaña más alta del Perú y quinta de Sudamérica), *Huandoy* (6 395 m), *Alpamayo* (5 947 m, considerada "la montaña más bella del mundo" por la UIAA en 1966), *Chopicalqui*, *Pisco*, *Artesonraju*. Es la *cordillera tropical más alta del mundo* y alberga ~663 glaciares tropicales que son la mayor concentración de glaciares de zona tropical del planeta. Su origen geológico es un batolito granítico emplazado en el Mioceno (~10 m.a.) con fracturamiento activo y actividad sísmica derivada de la subducción de la placa de Nazca. La Cordillera Blanca define con su paralela Cordillera Negra (más baja, sin glaciares, al oeste) el *Callejón de Huaylas* — corredor tectónico norte-sur. Desde 1970 los glaciares peruanos han perdido ~50% de su masa por calentamiento global (INAIGEM, MINAM). El *Pastoruri* — glaciar tropical turístico de altura moderada — perdió 22% de su superficie entre 1980 y 2010, retrocede 32 m/año y es considerado "extinto" como glaciar activo; en abril de 2011 se creó allí la *Ruta del Cambio Climático*, uno de los primeros circuitos de duelo ambiental de Sudamérica. El retroceso genera dos amenazas: (a) lagunas proglaciares nuevas con alto riesgo de GLOF (*Glacial Lake Outburst Flood*) — como la que causó el aluvión de Huaraz de 1941 que mató ~1 800 personas — y (b) pérdida del reservorio hídrico estacional del río Santa y del Rímac, afectando agricultura y consumo urbano costero.
- **Prerrequisitos:** `travel-f1-geografia-fisica` (F1 — subducción Nazca-Sudamericana).

### C2. Callejón de Huaylas y río Santa: corredor tectónico y eje sierra-costa vía Cañón del Pato
- **ID sugerido:** `travel-f8-callejon-huaylas`
- **Slug:** `callejon-huaylas-rio-santa`
- **Definición canónica:** El *Callejón de Huaylas* es un valle tectónico longitudinal de ~180 km entre las Cordilleras Blanca (este) y Negra (oeste), drenado por el *río Santa* — que nace en la laguna de Conococha (4 100 m), baja hacia el norte por todo el callejón (pasando por Recuay, Huaraz, Carhuaz, Yungay, Caraz) hasta Huallanca donde gira bruscamente al oeste y atraviesa la Cordillera Negra por el *Cañón del Pato* rumbo al Pacífico en Santa (cerca de Chimbote). Este trazado convierte al río Santa en uno de los tres únicos ríos del Perú que *cruzan la Cordillera* conectando sierra y costa por vía fluvial propia (los otros dos son el Majes-Ocoña y el Marañón en su tramo norte). El callejón es el único surco norte-sur habitable a escala media (2 500–3 500 m) de la sierra centro-norte peruana, lo que explica que concentre la población ancashina (Huaraz, capital regional; Caraz, Yungay, Carhuaz) y la agricultura del maíz, papa, trigo. Los incas ya lo utilizaban: el *Qhapaq Ñan* (gran camino inca) corría por ambos flancos, y uno de los chasquis menores bajaba por Huallanca hacia Chimú para el comercio de spondylus. En 1970 el callejón es devastado por el terremoto de Ancash (ver C4). Hoy la *Ruta del Cañón del Pato* — 50 km con 35 túneles tallados en la roca — es una de las carreteras más espectaculares de Sudamérica y conecta Caraz con Chimbote en ~5 horas.
- **Prerrequisitos:** C1.

### C3. Chavín de Huántar como sitio físico: Lanzón, cabezas clavas, Galería de las Ofrendas y arqueología acústica
- **ID sugerido:** `travel-f8-chavin-sitio`
- **Slug:** `chavin-huantar-sitio-lanzon`
- **Definición canónica:** Chavín de Huántar se ubica en el flanco oriental de la Cordillera Blanca (Callejón de Conchucos, 3 180 m, en la confluencia de los ríos Mosna y Huachecsa) y fue centro ceremonial entre ~1200 y ~200 a.C. — el punto físico desde donde se difundió el *Horizonte Chavín* pan-andino (ver F7-C2). Programa arquitectónico: *Templo Viejo* (Pirámide en U con plaza circular hundida) con la *Galería del Lanzón* en su centro, donde aún hoy está *in situ* el *Lanzón monolítico* — estela de granito de 4.53 m con figura antropomorfa dentada, labios colmillados y cabellera de serpientes, interpretada por Julio C. Tello como deidad oracular suprema. *Templo Nuevo* con plaza cuadrada hundida y fachada revestida originalmente con ~100 *cabezas clavas* (sólo una permanece *in situ* sobre el muro; el resto está en el Museo Nacional de Chavín inaugurado en 2008); las cabezas, de expresión progresivamente bestializada, fueron interpretadas por Lumbreras como representación de estados de consciencia alterada inducidos ritualmente por el *cactus San Pedro* (*Trichocereus pachanoi* o *Echinopsis pachanoi*) cuyo residuo fue documentado en la *Galería de las Ofrendas* excavada por Lumbreras en 1971–1973. Ingeniería hidráulica y acústica: sistema de *canales internos* que atraviesan el templo (el famoso canal *Rocas* descubierto por Rick), diseñados para amplificar el sonido del agua durante la lluvia o manipulación ritual; el proyecto de John Rick (Stanford, desde 1995) con el Global Heritage Fund y Antamina documentó 42 galerías subterráneas interconectadas y en 2013 halló tres cabezas clavas nuevas. Arquitectura sismo-resistente: muros con drenaje interno y geometría anti-sísmica probada: Chavín sobrevivió al terremoto de 1970. UNESCO lo declaró Patrimonio Mundial en 1985.
- **Prerrequisitos:** C1, C2.

### C4. Terremoto de Ancash y aluvión de Yungay (31 de mayo de 1970)
- **ID sugerido:** `travel-f8-yungay-1970`
- **Slug:** `terremoto-yungay-aluvion-1970`
- **Definición canónica:** El domingo 31 de mayo de 1970 a las 15:23:31 hora local, un terremoto de magnitud 7.9 Mw con epicentro frente a las costas de Chimbote (Ancash) sacudió la sierra norte peruana. El sismo desprendió la ladera norte del *nevado Huascarán* generando un *aluvión* (mezcla de hielo, roca y lodo) de ~50–100 millones de m³, 1.5 km de ancho, que descendió 13 km a velocidad estimada de 200–500 km/h y en tres minutos sepultó la ciudad de *Santo Domingo de Yungay* con sus ~25 000 habitantes. El saldo total del desastre —en toda la región Ancash y la costa de Chimbote— fue de ~70 000 muertos, ~150 000 heridos y ~800 000 damnificados, el *peor desastre natural documentado en la historia del Perú y uno de los peores en la historia de América*. El gobierno de Juan Velasco Alvarado (ver C5) lideró la reconstrucción, prohibió excavar el sitio de la antigua Yungay y lo declaró *Campo Santo* nacional — hoy sólo quedan en superficie las cuatro palmeras originales de la Plaza de Armas, el Cristo del Cerro de Atma y una cruz blanca sobre el aluvión. La nueva Yungay fue construida 2 km al norte. El sismo también destruyó gran parte de Huaraz, Caraz y Carhuaz (Huaraz perdió el 90% de su trazado colonial). El impacto geológico-urbano definió la conciencia sismo-aluvional peruana y dio origen al *INDECI* (Instituto Nacional de Defensa Civil, creado en 1972) y al programa de monitoreo de lagunas proglaciares peligrosas del *IGP* (Instituto Geofísico del Perú). Lectura cultural: el aluvión quedó como trauma generacional del norte andino, equiparable al terremoto de 1746 en Lima o al de 1987 en México.
- **Prerrequisitos:** C1, C2.

### C5. Velasco Alvarado y la reforma agraria (1968–1975): nacionalización petrolera, fin de la hacienda y deuda intelectual
- **ID sugerido:** `travel-f8-velasco-reforma`
- **Slug:** `velasco-reforma-agraria-1968`
- **Definición canónica:** El 3 de octubre de 1968, una junta militar encabezada por el general *Juan Velasco Alvarado* derroca al presidente Fernando Belaúnde Terry alegando la entrega de petróleo a la IPC (International Petroleum Company, subsidiaria de Standard Oil) — específicamente la "página 11 desaparecida" del Acta de Talara. Velasco funda el *Gobierno Revolucionario de la Fuerza Armada* (1968–1975), un proyecto militar-nacionalista progresista atípico en la Sudamérica de las dictaduras derechistas del mismo período: nacionaliza la IPC (9 de octubre, *Día de la Dignidad Nacional*) y, el 24 de junio de 1969 — día del campesino — promulga el *Decreto Ley 17716, Ley de Reforma Agraria*, con la frase canónica "*Campesino, el patrón ya no comerá más de tu pobreza*". La reforma: (a) expropia ~9 millones de ha (costa azucarera, sierra ganadera y agrícola), la reforma agraria más profunda de Sudamérica en extensión excepto Cuba; (b) crea *Cooperativas Agrarias de Producción (CAPs)* en la costa y *Sociedades Agrícolas de Interés Social (SAIS)* en la sierra; (c) elimina la hacienda semifeudal. Otras reformas: Ley de Industria 1970, Ley de Comunidades Industriales, Ley General de Telecomunicaciones, reconocimiento oficial del quechua como lengua (1975). Tensión con la izquierda: aunque el gobierno es progresista, Velasco deporta al sociólogo *Julio Cotler* y al sociólogo *Aníbal Quijano* en 1973 por críticas al *velasquismo* desde la izquierda marxista independiente. Desde el exilio, Cotler escribe *Clases, Estado y nación en el Perú* (IEP, 1978) — lectura canónica que define la "triple condición colonial" del Perú: dependencia externa, dominación oligárquica interna, exclusión étnica. Evaluación ex post: la reforma agraria desestructuró la hacienda pero las cooperativas colapsaron en los 80 por gestión deficiente, y la atomización minifundista que siguió —más la cantera política radicalizada que dejó el fracaso del modelo— es uno de los factores que Carlos Iván Degregori identifica en la gestación de Sendero Luminoso.
- **Prerrequisitos:** `travel-f1-divergencia-poscolonial` (F1).

### C6. Cañón del Pato: Antúnez de Mayolo, hidroeléctrica 1958 y los 35 túneles como proeza de ingeniería andina
- **ID sugerido:** `travel-f8-canon-pato`
- **Slug:** `canon-pato-hidroelectrica-tuneles`
- **Definición canónica:** El *Cañón del Pato* es el encajonamiento del río Santa entre las Cordilleras Blanca y Negra en el distrito de Huallanca (provincia de Huaylas, Ancash), con paredes de ~1 000 m de altura y ancho mínimo de ~15 m. Su aprovechamiento energético fue propuesto por el ingeniero peruano *Santiago Antúnez de Mayolo* en mayo de 1913 — primera exploración técnica del sitio. En 1943, tras una misión de ingenieros norteamericanos que confirmó la factibilidad, el gobierno de *Manuel Prado* creó la *Corporación Peruana del Santa* (1943) con doble objetivo: (a) usar el hierro de Marcona para construir una siderúrgica en Chimbote, (b) construir la *Central Hidroeléctrica del Cañón del Pato*. La construcción comenzó en julio de 1944 con 1 200 trabajadores perforando los 35 túneles sin equipos mecánicos (llegó a 2 500 obreros en el pico). El terremoto de 1945 y problemas financieros retrasaron la obra; el gobierno de Manuel Odría la retomó en 1954 con contrato a un consorcio francés, y el presidente Manuel Prado la inauguró el 21 de abril de 1958 con 150 MW. En 1999 la planta fue adquirida por *Duke Energy* (EE.UU.) y repotenciada a ~263 MW. Hoy abastece ~10% de la electricidad del sistema interconectado nacional del Perú. La *carretera al Cañón del Pato* — tallada paralelamente durante la construcción de la hidroeléctrica y con los 35 túneles conservados — es una de las carreteras más espectaculares de Sudamérica: permite bajar en auto o motocicleta desde Caraz (2 250 m) hasta Huallanca (1 100 m) y seguir a Chimbote (costa, 35 m) en un descenso de ~2 200 m en ~50 km. El Cañón del Pato es emblema de la *ingeniería peruana sobre topografía imposible* y una de las pocas infraestructuras hidroeléctricas del mundo construidas antes de la excavadora hidráulica moderna.
- **Prerrequisitos:** C2.

### C7. Parque Nacional Huascarán UNESCO 1985: conservación, alpinismo y retroceso glaciar como termómetro climático
- **ID sugerido:** `travel-f8-parque-huascaran`
- **Slug:** `parque-nacional-huascaran-unesco`
- **Definición canónica:** El *Parque Nacional Huascarán* fue creado por Decreto Supremo N° 0622-75-AG el 1 de julio de 1975, cubre 340 000 ha a lo largo de 158 km de la Cordillera Blanca, y protege los 663 glaciares tropicales del macizo, 41 lagunas principales (Llanganuco, Parón, 69, Churup, Querococha), 779 especies de flora altoandina y 120 especies de fauna (cóndor andino, oso de anteojos, vicuña, vizcacha). UNESCO lo designó *Reserva de Biosfera* el 1 de marzo de 1977 y *Patrimonio Natural de la Humanidad* en 1985 — reconocimiento paralelo al del Machu Picchu como patrimonio cultural (1983). Es el destino andinístico más importante de los Andes Centrales: desde la primera ascensión al Huascarán Sur por Annie S. Peck (1908) y la confirmación de altitud por Broggi-Hein (1932), es ruta obligada para montañistas internacionales. La "temporada seca" (mayo a septiembre) concentra la actividad de alpinismo y trekking (*Santa Cruz Trek*, *Huayhuash Circuit* aunque este último ya está fuera del parque). *Retroceso glaciar 2000–2025*: datos del INAIGEM (Instituto Nacional de Investigación en Glaciares y Ecosistemas de Montaña, 2014) muestran pérdida de ~50% de masa glaciar desde 1970, con el *Pastoruri* como caso emblema: cerrado al turismo recreativo en diciembre 2007 por peligro, reabierto en abril 2011 como *Ruta del Cambio Climático* con valor pedagógico explícito — uno de los primeros circuitos de "duelo ambiental" del planeta. Las lagunas proglaciares nuevas (Laguna 513, Laguna Palcacocha) son vigiladas permanentemente por riesgo de desborde: el aluvión de Huaraz de 1941 (1 800 muertos) y el de Ranrahirca de 1962 (~4 000 muertos, antes del aluvión mayor de 1970) fueron GLOFs. La Palcacocha fue dragada en 2011 por riesgo a Huaraz.
- **Prerrequisitos:** C1.

### C8. Sendero Luminoso en Ancash: zona de paso, pobreza rural y marco canónico de Degregori / CVR
- **ID sugerido:** `travel-f8-sendero-ancash`
- **Slug:** `sendero-luminoso-ancash-degregori`
- **Definición canónica:** El *Partido Comunista del Perú – Sendero Luminoso* (PCP-SL), grupo maoísta fundado por *Abimael Guzmán* en Ayacucho, inició la lucha armada el 17 de mayo de 1980 quemando ánforas electorales en Chuschi (Ayacucho). La *Comisión de la Verdad y Reconciliación* (CVR, informe final 28 de agosto de 2003, 9 tomos) estimó ~69 280 muertos y desaparecidos entre 1980–2000, de los cuales 75% eran quechuahablantes rurales de Ayacucho, Huancavelica, Apurímac, Junín y Huánuco — el epicentro fue el *trapecio andino del sur-centro*, no Ancash. Sin embargo Ancash fue *zona de paso y retaguardia secundaria*: (a) el corredor Huari-Pomabamba-Sihuas (Callejón de Conchucos, al este de la Cordillera Blanca) sirvió como ruta de comunicación entre frentes de Huánuco (Alto Huallaga) y Junín; (b) los distritos altoandinos pobres del este de Ancash (Huari, Asunción, Antonio Raimondi) tuvieron incidencia senderista puntual y presencia de *rondas campesinas* de autodefensa; (c) el asesinato de autoridades locales y dirigentes comunales ocurrió episódicamente entre 1983–1993; (d) tras la captura de Guzmán en septiembre de 1992 y la desarticulación del comité central, las acciones en Ancash se extinguieron. El marco canónico para leer por qué Sendero nace en Ayacucho y no en Ancash pese a condiciones aparentemente similares (pobreza rural, quechua-hablantes, fragmentación comunal) es *Qué difícil es ser Dios* (IEP, 2010) y *Ayacucho: raíces de una crisis* (1986) de *Carlos Iván Degregori* (1945–2011, antropólogo sanmarquino, comisionado de la CVR): el epicentro ayacuchano se explica por la combinación específica de la *Universidad Nacional San Cristóbal de Huamanga* reabierta en 1959 (incubadora ideológica de Guzmán y los cuadros senderistas), el *fracaso de la reforma agraria de Velasco* en la región más que en otras, y la *movilidad social frustrada* de la primera generación universitaria provinciana post-Velasco. En Ancash existían algunas condiciones pero no esa configuración específica. **Nota cronológica:** la densidad del concepto (conflicto armado propiamente dicho) se desarrolla en F9 (Andes sur, Cusco, vinculación con Vilcabamba y Túpac Amaru II) y en una posible F10 (Ayacucho propiamente dicho).
- **Prerrequisitos:** C5; `travel-f1-divergencia-poscolonial` (F1).

---

## Recursos (8)

### R1. Libro — Chavín: Excavaciones Arqueológicas (Lumbreras)
- **ID sugerido:** `travel-r-lumbreras-chavin`
- **Tipo:** `book`
- **Autor:** Luis Guillermo Lumbreras
- **Editorial:** Universidad Alas Peruanas, Lima, 2007 (varios tomos)
- **URL principal (PUCP, Textos de Lumbreras, PDF panorámico):** https://textos.pucp.edu.pe/pdf/3788.pdf
- **URL complementaria (academia.edu, Lumbreras 1993 *Galería de las Ofrendas*, KAVA-Mainz):** https://www.academia.edu/39766303/Lumbreras_Luis_G_1993_Chav%C3%ADn_de_Hu%C3%A1ntar_Excavaciones_en_la_Galer%C3%ADa_de_las_Ofrendas_KAVA_Mainz_PARTE_1_
- **URL reseña / presentación Mujica (academia.edu):** https://www.academia.edu/37582645/MUJICA_Elias_2007_Presentaci%C3%B3n_del_libro_Chav%C3%ADn_excavaciones_arqueol%C3%B3gicas_de_Luis_Guillermo_Lumbreras
- **Duración estimada:** ~6h (panorámica + cap. sobre Galería de las Ofrendas)
- **Idioma:** español
- **Enseña:** C3 Chavín sitio · **Refuerza:** F7-C2 (matriz iconográfica pan-andina)
- **Notas:** Lumbreras (1936–2023) excavó Chavín entre 1966 y 1995 — la *Galería de las Ofrendas* (1971–1973) es el hallazgo estratigráfico canónico y documenta el uso ritual del cactus San Pedro. Su obra Chavín es la síntesis arqueológica obligada. Complemento moderno: proyecto Stanford de John Rick (desde 1995); su sitio oficial es https://chavin.stanford.edu.

### R2. Reportaje / dossier — Proyecto Chavín de Stanford (John Rick), cabezas clavas y galerías subterráneas
- **ID sugerido:** `travel-r-rick-stanford-chavin`
- **Tipo:** `article`
- **Autor/medio:** Antamina (patrocinador) + El Comercio + UAB + Peregrina Danza (divulgación)
- **URL primaria (Antamina, descubrimiento de 3 cabezas clavas 2013):** https://www.antamina.com/noticias/descubrimiento_historico__tres_nuevas_cabezas_clavas_chavin_huantar_asombran_mundo/
- **URL El Comercio ("El último secreto de Chavín"):** https://elcomercio.pe/luces/el-ultimo-secreto-de-chavin-de-huantar-que-podria-cambiar-lo-que-sabemos-del-antiguo-peru-noticia/
- **URL UAB (estudio de cabezas clavas):** https://www.uab.cat/web/detalle-noticia/estudio-de-las-cabezas-clavas-del-yacimiento-de-chavin-de-huantar-1345680342040.html
- **URL panorámica Antamina (cultura Chavín):** https://www.antamina.com/noticias/cultura-chavin-legado-hallazgos-descubrimientos-civilizacion-preinca/
- **Duración estimada:** ~2h (recorrer los 4 enlaces)
- **Idioma:** español
- **Enseña:** C3 Chavín sitio (complementa R1) · **Refuerza:** F7-C2
- **Notas:** El proyecto de Rick (Stanford, Global Heritage Fund, Antamina) aplica tomografía acústica, robots con microcámaras, escáner 3D. El hallazgo de 2013 (tres cabezas clavas nuevas) y la documentación de 42 galerías subterráneas reorganizaron la lectura arquitectónica del sitio. Si se quiere el paper académico duro: Kembel & Rick *"Building Authority at Chavín de Huántar"* (2004, *Cambridge Archaeological Journal*, requiere acceso institucional).

### R3. Libro — Clases, Estado y nación en el Perú
- **ID sugerido:** `travel-r-cotler-clases-estado`
- **Tipo:** `book`
- **Autor:** Julio Cotler
- **Editorial:** IEP, Lima, 1978 (múltiples reediciones)
- **URL (catálogo IEP):** https://iep.org.pe/ — búsqueda por autor (obra emblemática, PDF no está en abierto; acceso por librería o Archive.org)
- **URL reseña académica (Marxists Internet Archive, Velasco como contexto):** https://www.marxists.org/espanol/velasco/
- **URL complementaria (propaganda política velascato, libro SciELO open access):** https://books.scielo.org/id/cw5zr/pdf/schuster-9789587389456-12.pdf
- **Duración estimada:** ~8h (libro ~400 pp.)
- **Idioma:** español
- **Enseña:** C5 Velasco y reforma agraria · **Refuerza:** F1-C8 (divergencia poscolonial)
- **Notas:** Cotler (1932–2019, sociólogo sanmarquino, director del IEP) es el intelectual canónico del Perú republicano junto con Matos Mar. Escrito desde el exilio en México (fue deportado por Velasco en 1973). Plantea la tesis del *Perú dependiente* en doble sentido: dependencia externa + dependencia colonial interna (oligarquía-indígena). Si el PDF no está abierto, Carlos Iván Degregori editó una reedición del IEP (2005) con prólogo de Cotler que vale la pena. Alternativa parcial open: artículos de Cotler en la *Revista Argumentos* del IEP (https://argumentos-historico.iep.org.pe).

### R4. Documental / reportaje — Aluvión de Yungay 31 de mayo de 1970
- **ID sugerido:** `travel-r-yungay-1970-documental`
- **Tipo:** `video` (dossier video + reportaje escrito)
- **Autor/medio:** El Comercio (crónica "La última función"), RPP (50 años), Infobae, Municipalidad de Miraflores, Wikipedia con fuentes
- **URL YouTube documental divulgativo:** https://www.youtube.com/watch?v=5xSu85iL0f8 ("La TRAGEDIA de YUNGAY: Cuando el HUASCARAN sepultó una ciudad")
- **URL El Comercio crónica:** https://elcomercio.pe/peru/ancash/la-ultima-funcion-una-cronica-del-terrible-terremoto-y-aluvion-de-1970-noticia/
- **URL RPP (50 años del sismo):** https://rpp.pe/peru/ancash/terremoto-peru-1970-aluvion-de-yungay-se-cumplen-50-anos-del-sismo-noticia-1269676
- **URL Infobae (síntesis histórica):** https://www.infobae.com/peru/2023/05/31/el-terremoto-de-yungay-31-mayo-1970-un-desastre-que-marco-al-peru-para-siempre-y-dejo-a-una-ciudad-sepultada/
- **Duración estimada:** ~3h (30 min de documental + 3 reportajes)
- **Idioma:** español
- **Enseña:** C4 Yungay 1970 · **Refuerza:** C1, C2
- **Notas:** `[revisar]` Verificar rigor del video YouTube antes de seedear. Plan B: buscar reportaje TV Perú archivo o el *documental ruso de época* que se menciona en las fuentes (imágenes inmediatamente post-desastre). Para profundidad académica: Oliver-Smith, Anthony, *The Martyred City: Death and Rebirth in the Andes* (University of New Mexico Press, 1986), etnografía clásica del desastre; no está en abierto, pero existe como referencia canónica en inglés.

### R5. Artículo / dossier — Velasco Alvarado y la reforma agraria 1969
- **ID sugerido:** `travel-r-velasco-reforma-dossier`
- **Tipo:** `article`
- **Autor/medio:** Marxists Internet Archive (texto primario) + Redalyc (paper académico) + Haal (paper académico)
- **URL primaria (texto primario, mensaje Velasco 24 junio 1969):** https://www.marxists.org/espanol/velasco/1969/junio/24.htm
- **URL paper (Redalyc, Velasco intelectuales y política):** https://www.redalyc.org/journal/4964/496454144002/html/
- **URL paper (Haal, batalla por la reforma agraria 1969–1973):** https://haal.cl/index.php/haal/article/download/14/169
- **URL complementaria (mensaje primer aniversario de la revolución, 3 oct 1969):** https://www.marxists.org/espanol/velasco/1969/octubre/03.htm
- **Duración estimada:** ~3h (texto primario corto + 2 papers ~40 pp. c/u)
- **Idioma:** español
- **Enseña:** C5 Velasco · **Refuerza:** F1-C8
- **Notas:** El texto primario del 24 de junio de 1969 es corto y muy potente — la frase "Campesino, el patrón ya no comerá más de tu pobreza" se pronuncia acá. Los dos papers académicos dan contexto y lectura crítica.

### R6. Artículo técnico — Central Hidroeléctrica del Cañón del Pato, historia y 35 túneles
- **ID sugerido:** `travel-r-canon-pato-ingenieria`
- **Tipo:** `article`
- **Autor/medio:** Sector Electricidad + Comité Huaraz del Servicio (PDF técnico) + Wikipedia con fuentes + Patrimonio Industrial Perú
- **URL primaria (Sector Electricidad, historia completa):** https://www.sectorelectricidad.com/14401/historia-de-la-central-hidroelectrica-del-canon-del-pato-peru/
- **URL PDF técnico (CHS-Peru, memoria técnica):** http://www.chs-peru.com/informespecial/upload/archivos/archivo2_183.pdf
- **URL Patrimonio Industrial Perú (libro "55 años Cañón del Pato"):** https://patrimonioindustrialperu.blogspot.com/2013/08/libro-55-anos-canon-del-pato.html
- **Duración estimada:** ~2h (los 3 enlaces)
- **Idioma:** español
- **Enseña:** C6 Cañón del Pato · **Refuerza:** C2 (corredor río Santa)
- **Notas:** El PDF CHS-Perú es el documento técnico de referencia. La historia incluye a Santiago Antúnez de Mayolo (que también es conocido por haber propuesto la hidroeléctrica del Mantaro y la central nuclear del Perú, nunca construida). La adquisición por Duke Energy en 1999–2000 es momento clave para entender por qué la infraestructura estratégica peruana quedó en manos extranjeras tras los 90 fujimoristas.

### R7. Artículo / portal oficial — Parque Nacional Huascarán y retroceso glaciar
- **ID sugerido:** `travel-r-parque-huascaran-climatico`
- **Tipo:** `article`
- **Autor/medio:** SERNANP (Servicio Nacional de Áreas Naturales Protegidas, Perú) + UNESCO + Actualidad Ambiental + El Universal (Ruta del Cambio Climático)
- **URL UNESCO (ficha oficial Patrimonio Natural):** https://whc.unesco.org/es/list/333
- **URL Patrimonio Mundial Cultura Perú (Parque Huascarán):** https://patrimoniomundial.cultura.pe/sitiosdelpatrimoniomundial/parque-nacional-del-huascar%C3%A1n
- **URL Actualidad Ambiental (aniversario del parque):** https://www.actualidadambiental.pe/paraiso-de-glaciares-y-lagunas-parque-nacional-huascaran-esta-de-aniversario/
- **URL El Universal (Ruta del Cambio Climático):** https://www.eluniversal.com.mx/destinos/peru-crea-ruta-del-cambio-climatico-e-incluye-el-glaciar-pastoruri/
- **URL EcoKarma (Pastoruri desaparición):** https://ecokarma.org/glaciar-pastoruri-rapida-desaparicion-en-la-cordillera-andina/
- **Duración estimada:** ~2h (recorrer los 5 enlaces)
- **Idioma:** español
- **Enseña:** C7 Parque Huascarán · **Refuerza:** C1 (retroceso glaciar como termómetro climático)
- **Notas:** Complementar con los informes anuales del INAIGEM (Instituto Nacional de Investigación en Glaciares y Ecosistemas de Montaña, creado en 2014, con sede en Huaraz). Para profundidad académica: reportes de la *Unidad de Glaciología* de la Autoridad Nacional del Agua (ANA) del Perú.

### R8. Libro / informe — CVR *Hatun Willakuy* (síntesis del Informe Final) y Degregori sobre epicentro ayacuchano
- **ID sugerido:** `travel-r-cvr-degregori-ancash`
- **Tipo:** `book`
- **Autor:** Comisión de la Verdad y Reconciliación (CVR) + Carlos Iván Degregori
- **URL primaria (*Hatun Willakuy*, PDF oficial IDEHPUCP):** https://idehpucp.pucp.edu.pe/wp-content/uploads/2012/11/hatun-willakuy-cvr-espanol.pdf
- **URL sitio oficial CVR (9 tomos):** https://www.cverdad.org.pe/ifinal/
- **URL paper Degregori (IEP, *Qué difícil es ser Dios*, reseña en Argumentos):** https://argumentos-historico.iep.org.pe/articulos/el-sendero-de-carlos-ivan-degregori/
- **URL dossier IDEHPUCP (violencia de masas PCP-SL):** https://idehpucp.pucp.edu.pe/wp-content/uploads/2012/09/Dossier.pdf
- **URL compilado IDEHPUCP (violencia política Perú 1980-2000):** https://cdn01.pucp.education/idehpucp/wp-content/uploads/2017/06/28160020/pub069laviolenciapoliticaenelperu.pdf
- **Duración estimada:** ~5h (panorámica *Hatun Willakuy* selecto + dossier Degregori)
- **Idioma:** español
- **Enseña:** C8 Sendero Luminoso en Ancash · **Refuerza:** F1-C8, prepara F9-C7
- **Notas:** *Hatun Willakuy* ("gran relato" en quechua) es la síntesis oficial de la CVR. Para Ancash específicamente, revisar el capítulo 2 del Informe Final ("Las regiones"). Para entender por qué Ayacucho y no Ancash, la lectura obligada es Degregori, *Ayacucho: raíces de una crisis* (IEP, 1986) y *Qué difícil es ser Dios* (IEP, 2010). **Nota de diseño curricular:** este recurso se *comparte* parcialmente con F9-R7 — en F9 el CVR entra con profundidad máxima (conflicto armado en Cusco y Apurímac), en F8 entra en densidad intermedia (Ancash como zona de paso).

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Lumbreras, Chavín excavaciones | C3 | — |
| R2 Rick / Stanford Chavín dossier | C3 (complementa R1) | — |
| R3 Cotler, Clases Estado y nación | C5 | — |
| R4 Yungay 1970 documental/reportajes | C4 | — |
| R5 Velasco reforma agraria dossier | C5 (complementa R3) | — |
| R6 Cañón del Pato ingeniería | C6 | — |
| R7 Parque Huascarán + climático | C7 | — |
| R8 CVR + Degregori | C8 | — |

**Cobertura por recursos directos:** C1 (cubierto lateralmente en R7 — retroceso glaciar); C2 (cubierto lateralmente en R6 — el Santa y el Cañón); C3 (R1, R2); C4 (R4); C5 (R3, R5); C6 (R6); C7 (R7); C8 (R8). **C1 y C2 no tienen recurso propio dedicado** — se apoyan lateralmente en R6 (Cañón del Pato = río Santa) y R7 (Huascarán = Cordillera Blanca). Si en reseed se juzga insuficiente, sumar R9 con un paper de INAIGEM sobre retroceso glaciar o una ficha técnica de geografía de Ancash.

Prerrequisitos de concepto a concepto ya expresados en cada card arriba; se traducen a filas de `concept_prerequisites`. **Cross-phase prereqs** apuntan a F1: `travel-f1-geografia-fisica`, `travel-f1-divergencia-poscolonial`. **Cross-phase cross-reference:** F7-C2 (Chavín matriz pan-andina) y F8-C3 (Chavín sitio físico) son conceptos hermanos deliberados — F7 aborda Chavín como *horizonte iconográfico que estructura la costa*, F8 lo aborda como *centro ceremonial físico* en la Cordillera Blanca. No son duplicación: son dos aristas del mismo objeto.

---

## DAG pedagógico

```
(F1: geografia-fisica) ──► C1 (geología Cordillera Blanca)
                              │
                              ├─► C2 (Callejón de Huaylas / río Santa)
                              │       │
                              │       ├─► C3 (Chavín sitio físico)
                              │       │
                              │       ├─► C4 (Yungay 1970)
                              │       │
                              │       └─► C6 (Cañón del Pato)
                              │
                              └─► C7 (Parque Nacional Huascarán + retroceso)

(F1: divergencia-poscolonial) ──► C5 (Velasco + reforma agraria)
                                    │
                                    └─► C8 (Sendero en Ancash)
```

Orden de estudio recomendado: **C1 → C2 → C3 → C7 → C6 → C4 → C5 → C8**. Empezar por geología y corredor (C1, C2), entrar por Chavín (C3) y Parque Huascarán (C7) como base profunda, pasar por el Cañón del Pato (C6) como ingeniería contemporánea, cerrar con los dos grandes traumas del siglo XX: Yungay 1970 (C4) y Velasco–Sendero (C5, C8).

---

## Estimación total de horas

| Recurso | Horas |
|---------|-------|
| R1 Lumbreras Chavín | 6h |
| R2 Rick / Stanford dossier | 2h |
| R3 Cotler Clases Estado nación | 8h |
| R4 Yungay 1970 documental/reportajes | 3h |
| R5 Velasco reforma agraria dossier | 3h |
| R6 Cañón del Pato ingeniería | 2h |
| R7 Parque Huascarán climático | 2h |
| R8 CVR + Degregori | 5h |
| **Total recursos** | **31h** |

Más cuestionarios, síntesis y escritura reflexiva: **~40h totales** para la fase. Realista para ~2 semanas en el Callejón de Huaylas + Chavín + Cañón del Pato antes de subir al sur por Junín y Ayacucho.

---

## Cosas a validar antes de seedear

1. **R1 Lumbreras Chavín**: los PDFs disponibles son parciales (la panorámica PUCP y el KAVA-Mainz 1993). Confirmar si el pipeline prefiere el libro completo *Chavín: Excavaciones Arqueológicas* (Universidad Alas Peruanas, 2007) y si está en abierto. Si no, usar los PDFs disponibles y complementar con Rick (R2).
2. **R3 Cotler**: el libro *Clases, Estado y nación en el Perú* (1978) no está en abierto. Alternativas: (a) Reeditions 2005 y 2015 del IEP; (b) sumar el artículo "El populismo militar: la experiencia peruana" de Cotler; (c) trabajar con Matos Mar *Desborde popular* (ya seedeado en F7-R6) como sustituto parcial.
3. **R4 Yungay 1970**: verificar rigor del documental YouTube antes de seedear. Plan B: sumar el libro *The Martyred City* de Oliver-Smith (1986) para profundidad etnográfica, o buscar documentales TV Perú del 50 aniversario (2020).
4. **R8 CVR / Degregori**: el Hatun Willakuy se comparte con F9-R7. Confirmar que el pipeline acepta el mismo recurso en dos fases, o crear dos `resource_id` distintos (una edición F8, otra F9) con diferentes `resource_page_range`.
5. **Cross-phase Chavín**: verificar que la dualidad F7-C2 (matriz) vs F8-C3 (sitio) quede clara en el seed y que no haya conflicto en `resource_concepts`. Sugerencia: R1 (Lumbreras) y R2 (Rick/Stanford) cubren C3 en F8 y *también* pueden marcar F7-C2 como refuerzo en la tabla `resource_concepts`.
6. **C1 y C2 sin recurso propio dedicado**: decidir si sumar R9 con un paper de INAIGEM sobre retroceso glaciar peruano o un artículo geográfico sobre el Callejón de Huaylas. Juicio del coordinator: apoyarse en R6+R7 es suficiente.
7. **Complemento literario opcional**: César Vallejo (nació en Santiago de Chuco, La Libertad, pero su poemario *Los heraldos negros* tiene imaginario andino de la sierra norte), Julio Ramón Ribeyro cuentos sobre Lima migrante, y Óscar Colchado Lucio *Rosa Cuchillo* (1997) sobre violencia política en la sierra ancashina-ayacuchana. No los seedeo pero son lectura lateral fuerte para el usuario que quiera pulir el sentido del lugar.

---

## Próximos pasos del coordinator

Mientras el ejecutor sigue con infra:
- [ ] Resolver los puntos de `[revisar]` arriba (R1 disponibilidad, R3 Cotler acceso, R4 documental Yungay, R8 dual-phase)
- [ ] Cross-check con F1: los prereqs `travel-f1-*` existen en el seed de F1 y coinciden en naming
- [ ] Cross-check con F7: la dualidad Chavín (F7-C2 matriz vs F8-C3 sitio) está clara y los IDs no colisionan
- [ ] Cross-check con F9: R8 (CVR) se comparte con F9-R7 — resolver estrategia de reuso vs duplicación
- [ ] Actualizar `PROGRESS.md` con el cierre del brief F8
