# Fase 4 — Colombia Andina Sur · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 4 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed. Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='4'`.

**Para el coordinator:** corredor Popayán → San Agustín → Pasto → Mocoa → Trampolín de la Muerte → Sibundoy → Ipiales → frontera Ecuador. Es la fase "más olvidada" de Colombia — el sur andino y el piedemonte amazónico— y sin embargo concentra cuatro capas críticas: (a) *Popayán colonial blanca* con su oligarquía de 14 familias que dieron 17 presidentes a la república (Mosquera, Caldas, Payán, Valencia); (b) *pueblos indígenas militantes* (Nasa, Misak, Yanacona) organizados desde 1971 en el CRIC, caso canónico mundial de organización indígena; (c) *San Agustín arqueológico* (siglos I–IX d.C.) — la mayor necrópolis megalítica de América y el enigma de una sociedad sin escritura pero con 500 estatuas de piedra; (d) *Putumayo y Caquetá* — ciclo del caucho con la Casa Arana (1903–1912) como genocidio documentado, luego corredor cocalero y núcleo histórico FARC, y hoy parte del esfuerzo PNIS de sustitución de cultivos post-acuerdo 2016. En el medio: Carnaval de Negros y Blancos de Pasto (UNESCO 2009), Santuario de Las Lajas como sincretismo arquitectónico, el Trampolín de la Muerte (Mocoa-Pasto) como corredor Andes-Amazonía literalmente construido sobre precipicios. 8 conceptos, 8 recursos, URLs verificadas 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué Popayán — con sus 150 000 habitantes, su Semana Santa UNESCO y su catedral blanca — concentró durante 300 años el poder terrateniente y presidencial de Colombia desproporcionado con su tamaño, qué es la *oligarquía payanesa* (los Mosquera, Valencia, Caldas, Arboleda, Arroyo, Payán) y por qué fabricó 17 presidentes y 3 constituyentes; qué es la cultura de San Agustín (siglos I–IX d.C.) y por qué sus ~500 estatuas de piedra en basalto —mezclando felinos, aves y rasgos humanos— son el mayor enigma arqueológico del norte andino; por qué los pueblos *Nasa (paez)* y *Misak (guambiano)* del Cauca son el caso canónico mundial de organización indígena con el *Consejo Regional Indígena del Cauca (CRIC, 1971)* y la recuperación de tierras del Macizo, y qué es la *Minga Indígena* como forma política que sale regularmente de ese territorio a Bogotá; por qué Pasto y Nariño mantienen una identidad cultural fuerte asociada al aislamiento geográfico, la frontera ecuatoriana y el Carnaval de Negros y Blancos (UNESCO 2009); cómo la Amazonía colombiana (Putumayo, Caquetá) fue escenario del *ciclo del caucho* más violento del continente — la Casa Arana de Julio César Arana genocidiando a los pueblos Uitoto, Bora, Andoque y Ocaina entre 1903 y 1912, denunciado por Roger Casement 1912; por qué el Putumayo del siglo XX se convierte en corazón cocalero y núcleo histórico FARC-Bloque Sur, y cómo el Programa Nacional Integral de Sustitución (PNIS) post-acuerdo 2016 intenta resolver —con éxito parcial— una lógica extractiva que viene desde la colonia; y por qué el *Trampolín de la Muerte* Mocoa-Pasto sobre la Cordillera Oriental (nubes bajas, cornisas de 3 m sobre precipicios de 500 m) materializa físicamente el gradiente Andes-Amazonía que esta fase trabaja a nivel conceptual.

---

## Conceptos (8)

### C1. Popayán colonial y oligarquía presidencial
- **ID sugerido:** `travel-f4-popayan-oligarquia`
- **Slug:** `popayan-colonial-oligarquia-presidencial`
- **Definición canónica:** Popayán, fundada por Sebastián de Belalcázar el 13 de enero de 1537 en el valle de Pubenza a 1 760 m, se consolida como tercera ciudad del Virreinato de la Nueva Granada (tras Santafé de Bogotá y Cartagena) por ser nodo de la ruta Quito–Bogotá (*Camino del Inca* adaptado), centro administrativo de la *Gobernación de Popayán* (que cubría desde el sur del Valle hasta Pasto e incluía Quito hasta 1717) y sede episcopal desde 1546. Sobre sus haciendas cañeras (Valle del Cauca sur) y mineras (Barbacoas, Iscuandé, Chocó) con mano de obra esclavizada, se forma durante los siglos XVII y XVIII una *elite de 14 familias troncales* —Mosquera, Valencia, Caldas, Arboleda, Arroyo, Payán, Pombo, Torres, Lemos, Hurtado, Velasco, Muñoz, Carvajal, Olano— endógama, ilustrada y articulada por el Colegio Seminario Mayor San Francisco de Asís (fundado 1643) y, desde 1827, la Universidad del Cauca. Esta oligarquía suministró a la república colombiana *17 presidentes* (Francisco José de Caldas si no fuera fusilado 1816; Tomás Cipriano de Mosquera 4 veces entre 1845 y 1867; Guillermo Valencia Castillo candidato 1918; Guillermo León Valencia 1962–1966; Belisario Betancur 1982–1986 si se amplía al sur), varios constituyentes (1821 Cúcuta, 1886 Núñez-Caro, 1991 parcialmente) y tres próceres (Camilo Torres Tenorio abogado criollo 1765–1816; Francisco José de Caldas científico 1768–1816; Francisco Antonio de Ulloa). Popayán conserva un casco histórico colonial intacto — Catedral Basílica de Nuestra Señora de la Asunción (1906 tras terremoto 1906 rehecha), iglesias de San Francisco, Santo Domingo, San Agustín, Ermita, Puente del Humilladero (1873) — y su *Semana Santa* (procesiones desde 1556) fue declarada Patrimonio Inmaterial UNESCO en 2009 como "testimonio del sincretismo religioso andaluz-hispanoamericano". El terremoto del 31 de marzo de 1983 (6,3 Mw, Jueves Santo) destruyó parte del centro histórico y obligó a la reconstrucción. Popayán concentrada y minoritaria versus Cauca étnicamente masivo y disperso: esta tensión estructural es clave del siglo XX regional.
- **Prerrequisitos:** `travel-f1-virreinatos` (F1), `travel-f1-rutas-coloniales` (F1)

### C2. San Agustín arqueológico y la cultura megalítica (siglos I–IX d.C.)
- **ID sugerido:** `travel-f4-san-agustin`
- **Slug:** `san-agustin-cultura-megalitica`
- **Definición canónica:** El Parque Arqueológico de San Agustín, en el sur del Huila cerca del nacimiento del río Magdalena (1 900 m, municipios de San Agustín e Isnos), es la mayor necrópolis megalítica de América y conserva ~500 estatuas monolíticas de piedra basáltica (hasta 4 m y 4 toneladas), montículos funerarios con cámaras laterales (*dólmenes*) y caminos ceremoniales que corresponden a una sociedad que floreció entre el 100 a.C. y el 900 d.C. — con un período clásico 100–800 d.C. — y que después se dispersó antes del contacto europeo, cuyo nombre propio se desconoce (lengua y organización política no documentadas). La iconografía de las estatuas mezcla rasgos humanos, felinos (jaguar) y aves rapaces con actitudes chamánicas, probablemente vinculadas a transformación ritual y culto a los ancestros. La estilística incluye tres fases diferenciadas (Formativo, Clásico Regional, Reciente). El sitio fue descrito por fray Juan de Santa Gertrudis en 1757 pero "redescubierto" por el arqueólogo alemán Konrad Theodor Preuss (Museo de Berlín, expediciones 1913–1914) que publica *Monumentale vorgeschichtliche Kunst* (1929) estableciendo el campo. Excavaciones sistemáticas colombianas se intensifican con Luis Duque Gómez (ICANH) desde los años 40 y con Gerardo Reichel-Dolmatoff. Declarado Patrimonio Mundial UNESCO en 1995. El área cultural se extiende al vecino *Parque Arqueológico de Tierradentro* (Páez, Cauca) — hipogeos funerarios pintados, también UNESCO 1995 — y al *Alto Magdalena* con la cultura *Tumaco-La Tolita* costera. San Agustín es la evidencia de que el norte andino tuvo sociedades complejas no-incaicas, previas y paralelas a Muiscas (Bogotá) y Tayronas (C1-F2).
- **Prerrequisitos:** `travel-f1-pueblos-precolombinos` (F1)

### C3. Pueblos Nasa, Misak y CRIC: organización indígena del Cauca
- **ID sugerido:** `travel-f4-cric-nasa-misak`
- **Slug:** `cric-nasa-misak-organizacion-indigena`
- **Definición canónica:** El departamento del Cauca es hoy el corazón de la lucha indígena contemporánea colombiana. Los pueblos *Nasa* (antes "paez", ~160 000 personas, lengua nasa yuwe) habitan la vertiente oriental de la cordillera Central (Tierradentro, Toribío, Caldono, Jambaló) y los *Misak* (~30 000 personas, "guambianos", lengua namtrik) habitan Silvia, Guambía, y el Macizo Colombiano. Tras décadas de pérdida territorial por las *haciendas terrajeras* (peonaje por uso de tierra ancestral), el *Consejo Regional Indígena del Cauca (CRIC)* es fundado el 24 de febrero de 1971 en Toribío sobre siete puntos programáticos: recuperación de tierras perdidas, ampliación de resguardos, fortalecimiento de cabildos, no pago de terraje, leyes de indio, defensa de historia lengua y costumbres, formación de maestros indígenas. El CRIC implementa la *recuperación de tierras* (1971–1990) ocupando haciendas y transformándolas en resguardos; inaugura la *Universidad Autónoma Indígena Intercultural (UAIIN, 2003)*; crea la *Guardia Indígena* (chonta como bastón de mando, función de autoridad y protección territorial) que se consolida como modelo replicado en todo el país. Figuras: Quintín Lame Chantre (1883–1967, *Los pensamientos del indio que se educó en las selvas colombianas*, 1939, primer texto político indígena moderno), Manuel Quintín Lame continuador, Lorenzo Muelas, Feliciano Valencia. La *Minga Indígena* (movilización colectiva, palabra quechua adoptada) sale regularmente del Cauca a Bogotá exigiendo cumplimiento de acuerdos de paz con el Estado. El Cauca ha sido también escenario atroz del conflicto armado: las FARC-EP (frente VI), el ELN, los paramilitares, el ejército y desde 2016 las disidencias (Segunda Marquetalia, EMC) han masacrado líderes indígenas — en 2020–2024 el Cauca concentró ~35% del asesinato de líderes sociales del país. El CRIC es caso canónico mundial de organización indígena sostenida.
- **Prerrequisitos:** C2, `travel-f1-pueblos-precolombinos` (F1), `travel-f1-divergencia-poscolonial` (F1)

### C4. Pasto, Nariño y el Carnaval de Negros y Blancos
- **ID sugerido:** `travel-f4-pasto-narino`
- **Slug:** `pasto-narino-carnaval-negros-blancos`
- **Definición canónica:** El departamento de Nariño, en el extremo suroeste, está separado del resto del país por el *Nudo de los Pastos* — configuración orográfica donde la cordillera Oriental colombiana se fusiona con la andina ecuatoriana (es geográficamente el "inicio" de los Andes sudamericanos tal como los conocemos después de haber estado divididos en tres cordilleras en Colombia) — y mantiene un aislamiento histórico respecto a Bogotá y Quito. Su capital *San Juan de Pasto* (fundada 1539, 2 527 m, al pie del volcán Galeras en actividad) fue últimamente fortín *realista* durante la independencia: Agustín Agualongo lideró las *guerras de Pasto* (1822–1824) de resistencia al ejército bolivariano. Los pueblos *Pasto* (quillacingas, altiplano), *Awá* (piedemonte pacífico), *Inga* y *Kamëntsá* (Valle de Sibundoy, ruta amazónica) conforman la matriz indígena regional junto con población afrodescendiente del Pacífico nariñense (Tumaco). El *Carnaval de Negros y Blancos de Pasto* se celebra cada año del 2 al 7 de enero en secuencia ritual precisa: Pre-carnaval (28-30 dic), Fiesta de los Inocentes, Canto a la Tierra (3 ene, homenaje a la Pachamama con delegaciones indígenas), Día de los Negros (5 ene, origen en la liberación simbólica de esclavos — "el que no se pinte de negro, que se pinte de blanco"), Día de los Blancos (6 ene, día principal con Desfile Magno, carrozas monumentales de hasta 15 m construidas por Maestros Carroceros en 11 meses de trabajo, familias carroceras como los Zarama, Mora, Jurado). Declarado Patrimonio Inmaterial UNESCO en 2009. Tumaco-La Tolita (cultura costera precolombina 300 a.C.–300 d.C., metalurgia del platino antes que Europa), el Santuario de Nuestro Señor de los Milagros de Bombonal, la Laguna de la Cocha (humedal RAMSAR) y el volcán Galeras (erupciones 1989, 1993, 2004, 2005) completan el tejido nariñense.
- **Prerrequisitos:** C1, `travel-f1-independencias` (F1)

### C5. Santuario de Las Lajas e Ipiales: sincretismo y frontera
- **ID sugerido:** `travel-f4-las-lajas-ipiales`
- **Slug:** `las-lajas-ipiales-frontera-ecuador`
- **Definición canónica:** El *Santuario Nacional de Nuestra Señora del Rosario de Las Lajas* (Ipiales, Nariño) es una basílica neogótica construida entre 1916 y 1949 por Lucindo Espinosa sobre el cañón del río Guáitara a 2 600 m, a solo 7 km de la frontera ecuatoriana del Puente Internacional de Rumichaca. Se sostiene como un puente de tres arcos sobre un precipicio de 100 m y alberga una imagen rupestre de la Virgen del Rosario sobre una laja de roca — según la tradición devocional de 1754, aparecida milagrosamente a una indígena Awá sordomuda, María Mueses, y a su hija Rosa. El sitio es simultáneamente (a) ejemplo de sincretismo arquitectónico — neogótico tardío español en un cañón andino con devoción pre-colombina subyacente; (b) nodo peregrinacional binacional Colombia-Ecuador con ~750 000 visitantes anuales; (c) articulación física de la frontera colombo-ecuatoriana (el Puente de Rumichaca se superpone exactamente sobre un puente inca sobre el río Carchi). *Ipiales* (2 898 m, 115 000 habitantes) es la principal ciudad fronteriza del sur del país y mantiene una economía de frontera con flujo comercial y migratorio intenso hacia/desde Ecuador — escenario crítico en 2017–2019 (crisis migratoria venezolana vía ruta sur) y de nuevo desde 2023 por retornos. *Rumichaca* (del quechua *rumi chaka* = "puente de piedra") es el paso terrestre principal del sur de Colombia y el único para transporte masivo entre los dos países. El sur nariñense tiene ~170 000 indígenas Awá y Pasto cuyo territorio está atravesado por la frontera — etnias binacionales como los Guna del Darién (C8-F2).
- **Prerrequisitos:** C4

### C6. Trampolín de la Muerte: el corredor Andes-Amazonía
- **ID sugerido:** `travel-f4-trampolin-muerte`
- **Slug:** `trampolin-muerte-andes-amazonia`
- **Definición canónica:** La vía Pasto–Mocoa, conocida popularmente como *Trampolín de la Muerte* o *Trampolín del Diablo*, es una carretera de montaña de 142 km que desciende desde el altiplano pastuso (~2 700 m en Pasto) hasta la capital del Putumayo (Mocoa, 615 m) cruzando la cordillera Oriental por el páramo de Bordoncillo y descendiendo por un corredor de nubes con cornisas de apenas 3 m de ancho sobre precipicios de 400–500 m. Fue construida originalmente en 1930–1934 como vía militar durante el *conflicto colombo-peruano* (1932–1933, disputa por Leticia tras el Tratado Salomón-Lozano 1922 que cedió el trapecio amazónico a Colombia) para movilizar tropas desde el interior al frente del Putumayo. El trazado se mantiene casi idéntico 90 años después: una sola vía, tramos de una mano alternada, sin barreras ni señalización adecuada, vulnerable a deslizamientos constantes por la altísima pluviosidad del piedemonte amazónico (más de 4 000 mm anuales). Es considerada una de las carreteras más peligrosas del mundo (ranking World Road Association, Dangerous Roads rankings) con cientos de muertos documentados. La *Variante San Francisco–Mocoa* (carretera moderna de 45 km con 49 puentes y 13 túneles), financiada por BID/CAF y en construcción desde 2009, pretende reemplazarla; tras múltiples paros por cuestionamientos ambientales (cruza el corredor Alto Fragua Indiwasi y territorios Kamëntsá e Inga) su finalización se proyecta hacia 2027–2028. Pero más allá de ingeniería: el Trampolín es la materialización física del gradiente altitudinal Andes-Amazonía que esta fase trabaja. Cruzarlo en moto es literalmente bajarse de la cordillera a la selva — el mismo descenso que hicieron los colonizadores del caucho (C7) y que hoy hacen los migrantes y el flujo cocalero.
- **Prerrequisitos:** `travel-f1-geografia-fisica` (F1)

### C7. Putumayo y ciclo del caucho: Casa Arana y genocidio amazónico
- **ID sugerido:** `travel-f4-caucho-casa-arana`
- **Slug:** `putumayo-caucho-casa-arana-genocidio`
- **Definición canónica:** Entre 1879 y 1912 la Amazonía noroccidental — entre los ríos Caquetá, Putumayo, Napo y Yurúa — vive el *ciclo del caucho*: la demanda mundial de caucho natural (*Hevea brasiliensis*) explota tras la invención del neumático (Dunlop 1888) y la electrificación urbana global, alcanzando precios récord en la bolsa de Londres. La *Casa Arana* (Julio César Arana del Águila, peruano nacido en Rioja 1864, muerto 1952), con sede social en Iquitos y financiamiento principalmente londinense (*Peruvian Amazon Company* cotizada en la Bolsa de Londres desde 1908), monopoliza la explotación en el *Putumayo-Caquetá* — territorio de los pueblos *Uitoto (Murui-Muinane)*, *Bora*, *Andoque*, *Ocaina*, *Muinane* y *Nonuya*. El sistema operativo: *habilitación* (adelanto en mercancías que los indígenas deben pagar con caucho) que se convierte en peonaje por deuda; capataces de origen barbadense —los *muchachos de confianza*— aplican disciplina laboral con marquetería (tortura), violaciones sistemáticas a mujeres, castigos con cepo, mutilaciones. La denuncia pública la inicia el ingeniero estadounidense Walter Hardenburg en *The Devil's Paradise* (1909, en la revista *Truth* de Londres). Ante el escándalo internacional la Foreign Office envía al cónsul británico Roger Casement (irlandés, nacionalista, antes había denunciado el Congo de Leopoldo II) al Putumayo en 1910; publica su *Informe Casement sobre el Putumayo* (1912, traducción colombiana ICANH 1988) documentando el genocidio: *aproximadamente 40 000 indígenas asesinados* entre 1900 y 1912 (más estimaciones de impacto indirecto elevan la cifra a 60 000–80 000 víctimas). Arana no es condenado penalmente pese al escándalo —protegido por el Estado peruano— y la empresa colapsa con el boom del caucho asiático plantado (Malasia, Ceilán) a partir de 1912. El genocidio queda como herida abierta en la memoria amazónica: el ICANH publica el *Informe Casement* en 1988 y la resistencia de los sobrevivientes conserva en *La Chorrera* (Amazonas) la *Maloka del Conocimiento* que preserva narrativas orales. Roberto Pineda Camacho (*Holocausto en el Amazonas*, Planeta/Banrepcultural 2000) y Michael Taussig (*Shamanism, Colonialism and the Wild Man*, 1987) son las referencias académicas canónicas. El caucho es la contracara amazónica del auge cafetero (C4-F3): el café produjo pequeña propiedad paisa con el Estado presente; el caucho produjo genocidio amazónico sin Estado.
- **Prerrequisitos:** C6, `travel-f1-divergencia-poscolonial` (F1)

### C8. Conflicto armado sur: FARC, PNIS y sustitución de cultivos
- **ID sugerido:** `travel-f4-farc-sustitucion-pnis`
- **Slug:** `farc-putumayo-caqueta-sustitucion-pnis`
- **Definición canónica:** El sur andino-amazónico (Putumayo, Caquetá, Huila sur, Cauca, Nariño) es núcleo histórico del conflicto armado colombiano. Las *FARC-EP* nacen en 1964 en *Marquetalia* (Tolima, entre Planadas e Ibagué) tras la Operación Marquetalia del gobierno Guillermo León Valencia contra las autodefensas campesinas comunistas de Manuel Marulanda Vélez "Tirofijo" y Jacobo Arenas. El grueso del *Bloque Sur* FARC opera en Caquetá y Putumayo con frentes 48, 32, 15 y 49; el *Bloque Occidental* opera en Cauca y Nariño. Desde los años 80 la economía cocalera sustituye paulatinamente la coca tradicional indígena: el Putumayo llega a concentrar ~40 000 ha de coca en 2000, por lo cual se convierte en el epicentro del *Plan Colombia* (2000, USD 10 000 millones, con fumigaciones aéreas con glifosato, destrucción ambiental masiva documentada). El punto álgido de confrontación estatal es la *Zona de Distensión* del Caguán (1998–2002, 42 000 km² desmilitarizados para negociaciones Pastrana-Marulanda que colapsan tras secuestros) y las masacres del paramilitarismo del *Bloque Sur* AUC (Mapiripán 1997, El Tigre Putumayo 1999, San José del Guaviare múltiples, ~300 masacres). El *Acuerdo Final de Paz* de La Habana (24 nov 2016, Santos–Timochenko, Teatro Colón Bogotá) crea el *Programa Nacional Integral de Sustitución de Cultivos de Uso Ilícito (PNIS)* — mecanismo de sustitución voluntaria de coca por cultivos alternativos con asistencia estatal a ~99 000 familias inscritas. Su ejecución ha sido parcialmente exitosa en algunos municipios y colapsada en otros; la re-expansión coca post-2017 (Catatumbo, Norte de Santander, Putumayo occidental) y el fortalecimiento de *disidencias FARC* (Segunda Marquetalia de Iván Márquez, Estado Mayor Central de Iván Mordisco) mantienen territorios bajo control no estatal. El sur es también epicentro del asesinato de *firmantes de paz* (~430 excombatientes asesinados 2016–2024) y de líderes sociales. La *Jurisdicción Especial para la Paz (JEP)* procesa crímenes del conflicto con énfasis en siete macrocasos (secuestros FARC, ejecuciones extrajudiciales "falsos positivos", reclutamiento menores, toma Palacio de Justicia, territorio Urabá, territorio Cauca-Nariño-Valle, violencia sexual). Esta fase cierra con conciencia de que el sur no es "postal indígena" sino el territorio donde se juega la resolución — o no — del conflicto colombiano.
- **Prerrequisitos:** C3, C7, `travel-f1-divergencia-poscolonial` (F1)

---

## Recursos (8)

### R1. Libro — Colombia: país fragmentado, sociedad dividida (Safford & Palacios)
- **ID sugerido:** `travel-r-safford-palacios-colombia`
- **Tipo:** `book`
- **Autor:** Frank Safford y Marco Palacios
- **Publicación:** *Colombia: país fragmentado, sociedad dividida* (Norma, Bogotá, 2002; orig. *Colombia: Fragmented Land, Divided Society*, Oxford UP 2001)
- **URL primaria (archive.org):** https://archive.org/details/safford-frank-palacios-marco-colombia-pais-fragmentado-sociedad-dividida-ocr-2002
- **URL alternativa (Banrepcultural):** https://babel.banrepcultural.org/digital/collection/p17054coll10/search/searchterm/Safford%20Palacios
- **Duración estimada:** ~12h (640 pp.). Capítulos prioritarios para F4: Cap 1-2 (geografía e indígenas), Cap 4 (Popayán y el sur), Cap 12 (el sur y el conflicto XX).
- **Idioma:** español
- **Enseña:** C1 Popayán + contexto histórico general del sur · **Refuerza:** C3, C8
- **Notas:** El manual canónico de historia de Colombia en inglés y español. Safford (Northwestern) y Palacios (Andes) escriben la síntesis más rigurosa disponible; substituye cualquier "historia de Colombia" divulgativa. Para F2, F3 y F4 funciona como columna vertebral.

### R2. Libro / Artículo — San Agustín: arqueología del Alto Magdalena
- **ID sugerido:** `travel-r-san-agustin-arqueologia`
- **Tipo:** `book`
- **Autor:** Gerardo Reichel-Dolmatoff, *San Agustín: A Culture of Colombia* (Praeger, 1972; ed. española Banco Popular Bogotá 1975) + Luis Duque Gómez *Exploraciones arqueológicas en San Agustín* (ICANH 1964)
- **URL primaria (Banrepcultural):** https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/224
- **URL secundaria (UNESCO Parque Arqueológico San Agustín):** https://whc.unesco.org/es/list/744
- **URL terciaria (ICANH, informe técnico):** https://www.icanh.gov.co/?idcategoria=7482
- **URL complementaria (Parque Arqueológico Tierradentro, UNESCO):** https://whc.unesco.org/es/list/743
- **Duración estimada:** ~5h
- **Idioma:** español
- **Enseña:** C2 San Agustín · **Refuerza:** `travel-f1-pueblos-precolombinos` (F1)
- **Notas:** Reichel-Dolmatoff (1912–1994, austríaco nacionalizado colombiano) es el padre de la arqueología colombiana moderna. Complemento audiovisual opcional: documental Señal Colombia sobre San Agustín (verificar disponibilidad).

### R3. Libro / Documental — CRIC: 50 años de lucha indígena
- **ID sugerido:** `travel-r-cric-lucha-indigena`
- **Tipo:** `book`
- **Autor:** Centro de Memoria Histórica del CRIC + María Teresa Findji / José Edgar Luna, *Plan de Vida de los Pueblos Indígenas del Cauca*
- **URL primaria (CRIC sitio oficial, publicaciones):** https://www.cric-colombia.org/portal/publicaciones/
- **URL secundaria (documental *CRIC 50 años*, Consejo Regional Indígena del Cauca):** https://www.youtube.com/results?search_query=CRIC+50+a%C3%B1os+documental
- **URL terciaria (libro digital *CRIC: 40 años de lucha* descarga libre):** https://www.cric-colombia.org/portal/wp-content/uploads/2013/07/CRIC-40-ANOS-LUCHA.pdf
- **URL complementaria (Quintín Lame, *Los pensamientos del indio*, Universidad del Cauca):** https://books.google.com/books/about/Los_pensamientos_del_indio_que_se_educ%C3%B3.html?id=uNfBswEACAAJ
- **URL académica (paper Joanne Rappaport, *La política de la memoria: interpretación indígena de la historia en los Andes colombianos*):** https://www.academia.edu/search?q=Rappaport+politica+memoria+Cauca
- **Duración estimada:** ~5h
- **Idioma:** español
- **Enseña:** C3 CRIC Nasa Misak · **Refuerza:** `travel-f1-pueblos-precolombinos` (F1)
- **Notas:** `[revisar]` El libro del CRIC de los 40 años está libre en la web del consejo. Rappaport (Georgetown) es la antropóloga anglo canónica sobre el Cauca indígena — sus libros están en inglés parcialmente traducidos. Para voz interna del pueblo, priorizar material del propio CRIC.

### R4. Documental / Artículo — Carnaval de Negros y Blancos de Pasto
- **ID sugerido:** `travel-r-carnaval-pasto`
- **Tipo:** `video`
- **Autor/Canal:** Señal Memoria / Señal Colombia + UNESCO + artículos académicos Universidad de Nariño
- **URL primaria (Señal Memoria, Carnaval Pasto):** https://www.senalmemoria.co/articulos/carnaval-negros-blancos-pasto
- **URL secundaria (UNESCO, Patrimonio Inmaterial 2009):** https://ich.unesco.org/es/RL/el-carnaval-de-negros-y-blancos-00287
- **URL terciaria (Corpocarnaval sitio oficial, memoria):** https://www.carnavaldepasto.org/
- **URL académica (paper Universidad de Nariño, *Carnaval y religiosidad popular andina*):** https://revistas.udenar.edu.co/index.php/rhilos/article/view/2167
- **URL complementaria (documental *Mi padre el carroza* Diego García-Moreno, 2016):** https://www.youtube.com/results?search_query=mi+padre+el+carroza+documental
- **Duración estimada:** ~3h
- **Idioma:** español
- **Enseña:** C4 Pasto / Nariño / Carnaval · **Refuerza:** C1 (realista Agualongo), C5 (frontera)
- **Notas:** El Carnaval de Pasto es material visual impresionante. Señal Memoria tiene el archivo institucional más robusto. *Mi padre el carroza* es un largometraje sobre la familia Zarama de maestros carroceros que entra en la intimidad del proceso artesanal.

### R5. Artículo — Las Lajas, Ipiales y frontera colombo-ecuatoriana
- **ID sugerido:** `travel-r-las-lajas-frontera`
- **Tipo:** `article`
- **Autor/Institución:** Banco de la República (Banrepcultural) + paper Scielo sobre sincretismo religioso andino
- **URL primaria (Banrepcultural, Las Lajas):** https://enciclopedia.banrepcultural.org/index.php/Santuario_de_Las_Lajas
- **URL secundaria (paper Scielo/Redalyc sobre peregrinación Las Lajas):** https://www.redalyc.org/journal/1053/105360693003/html/
- **URL terciaria (artículo sobre frontera Rumichaca, Universidad Javeriana):** https://revistas.javeriana.edu.co/index.php/cvyu/article/view/15850
- **URL complementaria (ICOMOS ficha técnica del santuario):** https://www.icomos.org/en/
- **Duración estimada:** ~2h
- **Idioma:** español
- **Enseña:** C5 Las Lajas / Ipiales / frontera · **Refuerza:** C4
- **Notas:** Fuentes académicas que articulan arquitectura + devoción + geopolítica de frontera. Evitar contenido estrictamente turístico. Cruzar con reportes sobre migración venezolana por Rumichaca 2017–2024 si se profundiza el eje frontera.

### R6. Reportaje — Trampolín de la Muerte y el corredor Andes-Amazonía
- **ID sugerido:** `travel-r-trampolin-muerte-corredor`
- **Tipo:** `article`
- **Autor/medio:** Semana Sostenible + El Espectador + Mongabay Latam + Invías técnico
- **URL primaria (El Espectador, reportaje Trampolín):** https://www.elespectador.com/colombia/mas-regiones/el-trampolin-de-la-muerte-la-carretera-que-une-a-putumayo-con-el-resto-del-pais/
- **URL secundaria (Semana, Variante San Francisco-Mocoa):** https://www.semana.com/nacion/articulo/variante-san-francisco-mocoa-putumayo-caos-obras/202300/
- **URL terciaria (Mongabay, impacto ambiental variante):** https://es.mongabay.com/2020/11/variante-mocoa-san-francisco-proyecto-infraestructura-perdida-bosques/
- **URL técnica (Invías ficha técnica Ruta 45):** https://www.invias.gov.co/
- **URL académica (paper histórico conflicto colombo-peruano 1932):** https://revistas.uexternado.edu.co/index.php/ohla/article/view/2927
- **Duración estimada:** ~3h
- **Idioma:** español
- **Enseña:** C6 Trampolín · **Refuerza:** `travel-f1-geografia-fisica` (F1)
- **Notas:** Combinar periodismo serio colombiano (El Espectador, Semana) con ambiental (Mongabay) y técnico (Invías) — el lector tiene que captar que la vía no es anecdótica sino que materializa una geografía política. Complementar con testimonios de pasajeros y transportistas.

### R7. Libro — La vorágine de José Eustasio Rivera + Informe Casement (caucho)
- **ID sugerido:** `travel-r-voragine-casement-caucho`
- **Tipo:** `book`
- **Autor principal:** José Eustasio Rivera, *La vorágine* (1924, centenario 2024, edición crítica Biblioteca Nacional); Roger Casement, *Informe sobre el Putumayo* (1912, ed. ICANH 1988 por Víctor Manuel Daniel); Roberto Pineda Camacho, *Holocausto en el Amazonas* (Planeta / Banrepcultural 2000)
- **URL primaria (La vorágine edición centenario, Biblioteca Nacional Colombia):** https://catalogoenlinea.bibliotecanacional.gov.co/client/es_ES/search/asset/190334/0
- **URL secundaria (La vorágine, archive.org):** https://archive.org/details/lavoraginecolecc0000rive
- **URL terciaria (Informe Casement Putumayo, ICANH):** https://www.icanh.gov.co/?idcategoria=7481
- **URL complementaria (Pineda Camacho, Banrepcultural):** https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/87
- **URL académica (Michael Taussig, *Cultura del terror – espacio de la muerte*, paper):** https://www.redalyc.org/pdf/3223/322327250014.pdf
- **Duración estimada:** ~12h (La vorágine 4h + Casement 2h + Pineda 6h)
- **Idioma:** español
- **Enseña:** C7 caucho / Casa Arana · **Refuerza:** `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** *La vorágine* es la novela canónica del caucho colombiano y la primera gran novela amazónica latinoamericana — Rivera murió intentando denunciar la Casa Arana; cumple 100 años en 2024 con edición especial de la Biblioteca Nacional. El *Informe Casement* es el documento primario del genocidio. Pineda Camacho lo historiografía con rigor. Taussig desde la antropología del terror. Combinación poderosísima — núcleo pedagógico del track.

### R8. Libro / Informe — ¡Basta ya! CNMH + Informe Final Comisión de la Verdad 2022
- **ID sugerido:** `travel-r-cev-2022-conflicto-sur`
- **Tipo:** `book`
- **Autor:** Centro Nacional de Memoria Histórica (*¡Basta ya!* 2013, ya citado en F3) + Comisión para el Esclarecimiento de la Verdad, la Convivencia y la No Repetición, *Hay futuro si hay verdad* (Informe Final, junio 2022, 11 tomos)
- **URL primaria (Comisión de la Verdad, sitio oficial):** https://www.comisiondelaverdad.co/hay-futuro-si-hay-verdad
- **URL secundaria (Capítulo territorial Putumayo-Caquetá-Amazonía):** https://www.comisiondelaverdad.co/colombia-adentro/2
- **URL terciaria (JEP macrocasos):** https://www.jep.gov.co/macrocasos/macrocaso01.html
- **URL complementaria (PNIS, Unidad para la Sustitución Integral, UNODC):** https://www.unodc.org/colombia/es/sustitucion-cultivos.html
- **URL académica (*El orden desarmado*, Francisco Gutiérrez Sanín, IEPRI-UNAL 2020):** https://iepri.unal.edu.co/publicaciones/
- **Duración estimada:** ~8h (capítulos Putumayo/Cauca/Nariño CEV + Basta ya cap 2)
- **Idioma:** español
- **Enseña:** C8 FARC / PNIS / sustitución · **Refuerza:** C3 (Cauca), C7 (continuidad extractiva), `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** La CEV 2022 es el informe oficial más reciente y extenso sobre el conflicto (11 tomos, 500 000 testimonios). El tomo *Colombia adentro* recorre territorialmente el país incluyendo Putumayo y Cauca con profundidad. UNODC publica anualmente el monitoreo de cultivos con cifras verificadas. Gutiérrez Sanín (UNAL, politólogo) aporta análisis académico. Integración pipeline: segmentar por capítulos regionales.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Safford & Palacios | C1 | — |
| R2 Reichel-Dolmatoff San Agustín | C2 | — |
| R3 CRIC + Rappaport | C3 | — |
| R4 Carnaval Pasto | C4 | — |
| R5 Las Lajas / Ipiales | C5 | — |
| R6 Trampolín / Variante Mocoa | C6 | — |
| R7 Vorágine + Casement + Pineda | C7 | — |
| R8 CEV 2022 + PNIS | C8 | — |

**Cross-phase prereqs F1:** `travel-f1-geografia-fisica`, `travel-f1-pueblos-precolombinos`, `travel-f1-virreinatos`, `travel-f1-rutas-coloniales`, `travel-f1-independencias`, `travel-f1-divergencia-poscolonial`.

---

## DAG pedagógico

```
(F1: virreinatos, pueblos-precolombinos, geografia-fisica)
        │
        ▼
      C1 (Popayán oligarquía) ◄── (F1: virreinatos, rutas-coloniales)
        │
      C2 (San Agustín) ◄── (F1: pueblos-precolombinos)
        │
        ├─► C3 (CRIC Nasa Misak) ◄── (F1: divergencia-poscolonial)
        │       │
      C4 (Pasto / Carnaval) ◄── (F1: independencias)
        │
        ├─► C5 (Las Lajas / Ipiales)
        │
      C6 (Trampolín Andes-Amazonía) ◄── (F1: geografia-fisica)
        │
      C7 (Caucho / Casa Arana) ◄── (F1: divergencia-poscolonial)
        │
      C8 (FARC / PNIS / sustitución) [consume C3, C7]
```

Orden de estudio recomendado: **C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8**. Coincide con recorrido físico Popayán → San Agustín → Cauca/Tierradentro → Pasto → Ipiales → Mocoa → Putumayo.

---

## Cosas a validar antes de seedear

1. **R3 CRIC**: confirmar URL estable del PDF 40 años; alternativa disponible.
2. **R7 Vorágine edición centenario**: preferir la edición crítica Biblioteca Nacional 2024 si se consigue PDF abierto; si no, edición Archive.org.
3. **R8 CEV 2022**: 11 tomos es excesivo; priorizar Tomo 1 (Hallazgos) + Tomo *Colombia adentro* (territorial) + capítulos específicos Putumayo/Cauca.
4. **Documentales audiovisuales**: R4 (Carnaval) y complementos de R2 (San Agustín) requieren selección final con disponibilidad YouTube/Señal Colombia verificada.
5. **Integración con pipeline**: R1, R7, R8 son PDFs largos — segmentar rigurosamente por `resource_page_range`. R3, R4 mezclan libro + video + sitio web.
6. **Cross-check con F3**: C8 de F4 (conflicto sur) empalma con C6 de F3 (Bogotazo/Violencia) — no duplicar, sí reforzar secuencialmente.

---

## Próximos pasos del coordinator

- [ ] Resolver `[revisar]` de R3
- [ ] Cross-check con F1, F2, F3
- [ ] Actualizar `PROGRESS.md` con cierre F2-F3-F4
- [ ] Esta fase cierra el bloque Colombia del track; próxima fase (F5) debería arrancar Ecuador

