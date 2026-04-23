# Fase 7 — Costa Peruana · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 7 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='7'`.

**Para el coordinator (yo mismo, futuro):** la Costa peruana es el primer gran encuadre del país. Cubre ~3 000 km desde Tumbes (frontera Ecuador) hasta Tacna (frontera Chile) con un gradiente demográfico, cultural y económico muy marcado. El usuario va a bajar de Ecuador por Tumbes → Piura → Chiclayo → Trujillo → Lima, y cada parada es una capa distinta: pesquería afropiurana, Sipán y Moche, Chan Chan y Chimú, virreinato limeño, migración andina y conurbación contemporánea. La fase debe instalar dos cosas en simultáneo: (a) el desierto costero como laboratorio civilizatorio de 5 000 años (Chavín iconográfico, Moche, Lambayeque/Sicán, Chimú) y (b) Lima como espejo y filtro político de todo el Perú republicano. 8 conceptos, 8 recursos, cada URL verificada en search results del 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué el desierto costero más árido del mundo produjo cuatro civilizaciones sucesivas de ingeniería hidráulica sofisticada (Moche, Lambayeque/Sicán, Chimú y la sociedad colonial luego); por qué Chavín de Huántar —aunque físicamente esté en la sierra de Ancash (F8)— es la matriz iconográfica pan-andina que explica la costa tanto como la sierra; por qué la tumba del Señor de Sipán (Walter Alva, 1987) reorganizó de golpe la lectura académica del Perú pre-inca al demostrar que la élite Moche tenía densidad ritual comparable a Tutankamón; por qué Chan Chan, la ciudad de adobe más grande de la América prehispánica, cae ante la conquista inca de Túpac Yupanqui en ~1470 cortando el agua del Moche; por qué Pizarro funda Lima en 1535 en la costa y no en Cusco (acceso al Callao, protección del Tahuantinsuyu derrotado); por qué el sistema guano-salitre de 1840-1879 es a la vez el primer Estado fiscal peruano y la causa directa de la Guerra del Pacífico y la pérdida de Tarapacá-Arica; por qué la migración andina a Lima del siglo XX (Matos Mar, *Desborde popular*, 1984) reconfigura la ciudad de 600 mil a 10 millones de habitantes, genera conos periurbanos autogestionados (Villa El Salvador, Comas, San Juan de Lurigancho) y cultura chicha como síntesis híbrida; y por qué el norte piurano-tumbesino conserva identidades propias —afroperuanas de Yapatera/Zaña, cocina costeña, Vicús, frontera con Ecuador marcada por la guerra de 1941— que ningún otro tramo costero reproduce.

---

## Conceptos (8)

### C1. Geografía de la costa peruana: desierto, Humboldt y valles transversales como oasis de civilización
- **ID sugerido:** `travel-f7-geografia-costa`
- **Slug:** `geografia-costa-peruana-humboldt`
- **Definición canónica:** La costa peruana es una franja desértica de ~2 500 km de largo y 40–80 km de ancho entre el Pacífico y los Andes, una de las zonas más áridas del planeta. Su régimen climático se explica por la *Corriente de Humboldt* (o del Perú) — aguas frías que suben desde la Antártida enfriando el aire costero, produciendo inversión térmica, cielos cubiertos ("garúa" limeña) y prácticamente cero precipitaciones. Esta aridez habría impedido la civilización de no ser por los *valles transversales*: ~53 ríos estacionales que bajan de los Andes, cortan el desierto y forman oasis angostos pero fértiles (Chira, Piura, La Leche, Lambayeque, Moche, Chicama, Santa, Rímac, Ica, Nazca). Cada valle es una "isla" de vida con su propia cultura prehispánica; todo pueblo costero mayor está en un valle. La Humboldt además sostiene una de las pesquerías más productivas del planeta (anchoveta) que alimentó comunidades desde Caral (3 000 a.C.) y sigue siendo eje económico contemporáneo. El fenómeno ENOS (El Niño) rompe periódicamente esta lógica: lluvias torrenciales en el norte, colapso de la pesquería, crisis alimentaria — los *meganiños* de ~600 y ~1100 d.C. están correlacionados con el colapso Moche tardío y la reconfiguración Lambayeque/Chimú.
- **Prerrequisitos:** `travel-f1-geografia-fisica` (F1 — subducción Nazca-Sudamericana explica cordillera y pisos).

### C2. Chavín de Huántar como matriz pan-andina: la primera religión de los Andes (1200–200 a.C.)
- **ID sugerido:** `travel-f7-chavin-matriz`
- **Slug:** `chavin-huantar-matriz-panandina`
- **Definición canónica:** Chavín de Huántar (valle del Mosna, Ancash, 3 180 m s.n.m.) es el centro ceremonial cuya iconografía —felinos, aves rapaces, serpientes, figura antropomorfa del *Lanzón*, *Estela Raimondi*, *Obelisco Tello*, cabezas clavas— se difunde entre ~1200 y ~200 a.C. por toda la sierra y la costa del Perú actual, definiendo lo que Luis Guillermo Lumbreras y Julio C. Tello llaman el *Horizonte Temprano* u "Horizonte Chavín". Por primera vez en los Andes existe un sistema simbólico compartido a escala pan-regional: la cerámica Cupisnique (costa norte), Paracas (costa sur) y los sitios de la sierra central reproducen motivos chavinoides con variaciones locales. Chavín no fue imperio militar ni Estado expansivo sino *centro de peregrinación* y oráculo — el Lanzón en la galería interior era consultado mediante ritual con plantas alucinógenas (San Pedro, *Trichocereus pachanoi*) por élites de distintas regiones. El programa arqueológico que desde 1995 dirige John Rick (Stanford) ha ampliado radicalmente la documentación: tres cabezas clavas nuevas en 2013, galerías subterráneas, sistema de canales para control acústico. Sin Chavín no hay cómo leer ni Moche, ni Paracas, ni Nazca — toda la iconografía costera posterior arrastra núcleos chavinoides. **Nota:** el sitio físico y su arqueología detallada van en F8 (Cordillera Blanca); acá Chavín entra como *matriz iconográfica* que estructura la costa.
- **Prerrequisitos:** C1.

### C3. Moche (100–800 d.C.): Sipán, Huacas del Sol y la Luna, iconografía ritual y el meganiño de 600
- **ID sugerido:** `travel-f7-moche`
- **Slug:** `moche-sipan-huacas-iconografia`
- **Definición canónica:** Los Moche (o Mochica) son la gran civilización de la costa norte peruana entre ~100 y ~800 d.C., con dos focos: *Moche Sur* (valles Moche-Chicama, capital en las Huacas del Sol y de la Luna cerca de Trujillo) y *Moche Norte* (valles Jequetepeque-Lambayeque, con Sipán y San José de Moro). Arquitectura: pirámides truncadas de adobe (*huacas*) con murales polícromos que representan el *Tema del Sacrificio* (Christopher Donnan) — combate ritual entre guerreros para capturar al vencido, presentación del prisionero al *Señor de los Túmi*, sangrado ritual y ofrenda de sangre. La cerámica escultórica Moche es la más realista del Perú prehispánico: retratos individuales, escenas eróticas, de enfermedad, de trabajo. El 20 de julio de 1987, Walter Alva, alertado por el saqueo del huaquero Ernil Bernal, excavó en Huaca Rajada (Sipán) la primera tumba intacta de un gobernante de la América pre-inca: el *Señor de Sipán*, enterrado hacia 250 d.C. con ~600 piezas de oro, plata, cobre y spondylus; el hallazgo es equiparable al de Tutankamón y reorganizó la lectura académica del Perú pre-inca. El colapso Moche tardío (siglos VI–VIII) se correlaciona con un *meganiño* hacia 600 d.C. documentado por estratigrafía (arenas eólicas + lluvias torrenciales) y con reconfiguración política hacia el norte que deriva en Lambayeque/Sicán. El Museo Tumbas Reales de Sipán (Lambayeque, inaugurado 2002) custodia el ajuar y es el equivalente peruano del Museo de El Cairo.
- **Prerrequisitos:** C1, C2.

### C4. Chimú (900–1470) y la conquista inca: Chan Chan, spondylus y el corte del río Moche por Túpac Yupanqui
- **ID sugerido:** `travel-f7-chimu`
- **Slug:** `chimu-chan-chan-conquista-inca`
- **Definición canónica:** Entre ~900 y 1470 d.C. el reino Chimú (*Chimor*) domina la costa norte desde Tumbes hasta el valle de Huarmey (~1 000 km de costa), con capital en *Chan Chan* (valle del Moche, cerca de Trujillo, ~20 km²) — la *ciudad de adobe más grande de la América prehispánica* e inscrita en Patrimonio Mundial UNESCO el 28 de noviembre de 1986 en su Lista en Peligro. Arquitectura: diez *ciudadelas* amuralladas (*Tschudi, Rivero, Uhle, Laberinto* etc.), cada una residencia del inca chimú y necrópolis tras su muerte (principio dinástico de "hijos construyen, padres descansan"), más barrios populares alrededor. Economía: agricultura intensiva con canales (canal *La Cumbre* de 80 km entre valles Chicama-Moche), control del comercio del *spondylus* (concha roja sagrada traída del Ecuador — usada como moneda ritual), metalurgia en tumbaga y textilería. Michael Moseley y Carol Mackey inician la excavación sistemática en 1969 (proyecto *Chan Chan-Moche Valley*). La conquista inca por *Túpac Yupanqui* hacia 1470 se hace, según las crónicas (Cieza, Rostworowski), mediante bloqueo estratégico: se corta el agua del río Moche aguas arriba, Chan Chan no puede sostenerse en el desierto, el señor Minchanzaman capitula. La élite chimú es trasladada al Cusco como rehén-aprendiz y sus orfebres enseñan metalurgia a los incas. Hoy Chan Chan está en la Lista en Peligro de UNESCO por erosión eólica, saqueo y lluvias del Niño.
- **Prerrequisitos:** C3.

### C5. Lima virreinal y republicana: fundación 1535, terremoto 1746, "Arcadia colonial" y crítica de Salazar Bondy
- **ID sugerido:** `travel-f7-lima-virreinal`
- **Slug:** `lima-virreinal-republicana`
- **Definición canónica:** Francisco Pizarro funda la *Ciudad de los Reyes* el 18 de enero de 1535 en el valle del Rímac, a 12 km del Pacífico (acceso al Callao, que se convertirá en el puerto más importante del Pacífico sur hasta el siglo XVIII). Lima es capital del *Virreinato del Perú* desde 1542 — que incluye toda la América del Sur hispana hasta las reformas borbónicas — y por dos siglos concentra Audiencia, Inquisición (1569), Universidad de San Marcos (fundada 1551, la más antigua de América), Casa de Moneda y el circuito comercial Callao-Panamá-Sevilla. El terremoto del 28 de octubre de 1746 (magnitud ~8.6) destruye Lima y borra el Callao con un tsunami (se estiman 5 000–7 000 muertos, ~10% de la población), quebrando el esplendor barroco y forzando la reconstrucción bajo el virrey Manso de Velasco. Tras la independencia (San Martín 1821, Ayacucho 1824), Lima sigue concentrando política, burocracia y élite económica — la *élite criolla limeña* articula la república alrededor de guano, salitre y comercio. El ensayo fundacional para leer Lima es *Lima la horrible* de Sebastián Salazar Bondy (1964, México — toma título del poema de César Moro), que desmonta la *"Arcadia colonial"*: el mito de una Lima virreinal idílica, aristocrática y cortés que oculta la servidumbre indígena y afro, la exclusión provinciana y la violencia estructural. Salazar Bondy es parte de la "Generación del 50" junto con Blanca Varela, Jorge Eduardo Eielson y Javier Sologuren. El ensayo sigue funcionando como diagnóstico: la pregunta "¿qué Lima somos?" cruza todo el siglo XX peruano.
- **Prerrequisitos:** `travel-f1-virreinatos` (F1).

### C6. Guano, salitre y Guerra del Pacífico (1840–1884): el primer Estado fiscal peruano y su colapso
- **ID sugerido:** `travel-f7-guano-salitre-pacifico`
- **Slug:** `guano-salitre-guerra-pacifico`
- **Definición canónica:** Entre ~1840 y 1879 el Perú republicano vive la *era del guano*: las islas guaneras del Pacífico sur (Chincha, Lobos, Guañape) acumulan millones de toneladas de excremento de aves marinas, fertilizante cotizado en Europa tras la revolución agrícola industrial. El Estado peruano vende concesiones (sistema de *consignatarios*, luego Contrato Dreyfus 1869) y por primera vez tiene ingresos fiscales masivos sin tributación indígena; con guano financia el primer ferrocarril sudamericano (Lima-Callao, 1851), la abolición de la esclavitud (1854, con indemnización a los amos), obras públicas y deuda externa creciente. Hacia 1860 el guano se agota y la economía vira al *salitre* de Tarapacá (nitrato de sodio, fertilizante y pólvora). El salitre entra en tensión con Bolivia (Antofagasta, Atacama) y Chile (que tiene capital inglés e infraestructura minera superior). La *Guerra del Pacífico* (o "del Guano y del Salitre", 1879–1884) enfrenta a Chile contra Perú y Bolivia aliados: Chile arrasa. Fases: campaña marítima (combate de Angamos, muerte de Miguel Grau el 8 oct 1879), campaña de Tarapacá (1879), campaña de Lima (batallas de San Juan y Miraflores, ocupación de Lima 1881–1883, saqueo de la Biblioteca Nacional), resistencia de la Breña de Andrés A. Cáceres en la sierra. Tratado de Ancón (1883): Perú cede Tarapacá a perpetuidad y Tacna-Arica en cautiverio por 10 años (Tacna vuelve en 1929, Arica queda chilena). Bolivia pierde su salida al mar en el Pacto de Tregua de 1884. La obra canónica para leer el período es la *Historia de la República del Perú (1822–1933)* de Jorge Basadre (16 tomos, 1939–1970), que define el *"problema del Perú"* como el desencuentro estructural entre Estado y país profundo.
- **Prerrequisitos:** `travel-f1-divergencia-poscolonial` (F1).

### C7. Migración andina a Lima (s. XX): Matos Mar, *Desborde popular*, cultura chicha, conos y Sendero
- **ID sugerido:** `travel-f7-migracion-lima`
- **Slug:** `migracion-andina-lima-desborde`
- **Definición canónica:** Entre 1940 y 2000 Lima pasa de ~600 000 a ~8 000 000 de habitantes por migración masiva desde la sierra (principalmente Ancash, Junín, Ayacucho, Apurímac, Cajamarca, Puno). Fases: (a) 1940–1960, migración rural-urbana "clásica" impulsada por crisis agraria, fracaso de la reforma previa a Velasco y servicio militar; surgen las primeras *barriadas* (San Martín de Porres, El Agustino). (b) 1961, fundación de *Ciudad de Dios* al sur, símbolo de las invasiones organizadas nocturnas con esteras y banderas. (c) 1971, fundación de *Villa El Salvador* por 200 familias invasoras en el desierto sur, devenida "ciudad autogestionada" con plan urbano comunitario diseñado por Miguel Romero Sotelo y los propios pobladores; premio Príncipe de Asturias 1987. (d) Años 80–90, oleada del *desplazamiento forzado por Sendero Luminoso* desde Ayacucho y sierra central — ~600 000 desplazados según la CVR, la mayoría asentada en Huaycán, Raucana, Canto Grande. El sociólogo José Matos Mar publica *Desborde popular y crisis del Estado* (IEP, 1984) documentando el fenómeno: el Perú "oficial" no puede contener al Perú "popular" migrante, el Estado colapsa en servicios, impuestos, orden público, y la ciudad se reorganiza desde abajo mediante comités de vaso de leche, clubes de madres, comedores populares, microempresa informal (después leída por Hernando de Soto en *El otro sendero*, 1986). Producto cultural emblema: la *chicha* — género musical híbrido que fusiona cumbia colombiana, huayno andino y rock psicodélico (Los Shapis, Chacalón), banda sonora de la nueva Lima popular. La *Lima contemporánea* (Gamarra, cono norte, San Juan de Lurigancho como el distrito más poblado del Perú con >1 millón) es producto directo de ese desborde.
- **Prerrequisitos:** C5, C6.

### C8. Costa norte piurano-tumbesina: afroperuanos Yapatera/Zaña, Vicús, cocina norteña y frontera Ecuador 1941
- **ID sugerido:** `travel-f7-norte-costa`
- **Slug:** `costa-norte-piura-tumbes`
- **Definición canónica:** El extremo norte de la costa peruana —Tumbes, Piura y Lambayeque— tiene identidades regionales marcadamente distintas del resto del país, articuladas por cinco capas. (a) *Arqueología Vicús* (~100 a.C.–400 d.C., valle del alto Piura, región Chulucanas-Yécala): cultura de ceramista y metalurgista del oro y cobre, documentada desde 1987 por el proyecto PUCP-ORSTOM dirigido por Krzysztof Makowski; taller de Yécala (s. III–IV) es la primera evidencia directa de producción metalúrgica prehispánica en Piura. (b) *Afroperuanos Yapatera y Zaña*: Yapatera (Chulucanas, Piura) y Zaña (Lambayeque, fundada 1563) son las comunidades con mayor porcentaje de población afrodescendiente del Perú (~70% en Yapatera), descendientes de esclavos traídos desde el siglo XVI para la hacienda azucarera; la abolición llega en 1854 pero el yanaconaje se prolonga. Zaña fue ciudad barroca destruida por inundación en 1720 — hoy sus ruinas conventuales son Ruta del Esclavo UNESCO. (c) *Cocina norteña*: seco de cabrito, ceviche con limón de Chulucanas, arroz con pato, tamalitos verdes, chicha de jora — cocina prestigiada nacionalmente, con matriz mestiza afro-indígena-española. (d) *Frontera con Ecuador*: el diferendo territorial sobre Tumbes, Jaén y Maynas arrastra desde la independencia hasta la *guerra de 1941* (5 de julio). Perú ocupa la provincia ecuatoriana de El Oro, se firma el *Protocolo de Paz, Amistad y Límites de Río de Janeiro* el 29 de enero de 1942 bajo garantía de Argentina, Brasil, Chile y EE.UU., Ecuador cede el acceso amazónico. Ecuador rechaza la demarcación en 1948 y el conflicto se reabre en 1981 (Falso Paquisha) y 1995 (Cenepa), cerrándose sólo con el Acta Presidencial de Brasilia (1998). (e) *Literatura del norte*: Mario Vargas Llosa usa Piura (*La casa verde*, 1966) y Chiclayo (*¿Quién mató a Palomino Molero?*, 1986) como escenarios; Fernando de Szyszlo pinta Paracas.
- **Prerrequisitos:** C1, C3.

---

## Recursos (8)

### R1. Libro — Historia de la República del Perú (1822–1933), capítulos selectos
- **ID sugerido:** `travel-r-basadre-republica`
- **Tipo:** `book`
- **Autor:** Jorge Basadre Grohmann
- **Editorial:** 6ª ed., El Comercio, Lima, 2005 (16 tomos; 1ª ed. Editorial Cultura Antártica, 1939–1949)
- **URL (Archivo Histórico de Marina, PDF guerra del guano y salitre, tomo I):** https://archivohistoricodemarina.mil.pe/repo/data/DOCUMENTOS/BIBLIOTECA/LIBROS%20Y%20MISCELANEOS/LIBROS/pdf/Historia%20de%20la%20Guerra%20del%20Guano%20y%20el%20Salitre%20o%20Guerra%20del%20Pac%C3%ADfico%20entre%20Chile,%20Bolivia%20y%20el%20Per%C3%BA%20Vol.%20I.pdf
- **URL panorámica (ensayo Grau.pe):** https://www.grau.pe/historia-de-la-guerra-con-chile/jorge-basadre-y-la-historia-de-la-republica-del-peru/
- **Duración estimada:** ~10h (leer tomos selectos: *La era del guano*, *La Guerra del Pacífico*, *La reconstrucción nacional*)
- **Idioma:** español
- **Enseña:** C6 guano/salitre/Guerra del Pacífico · **Refuerza:** C5 (Lima republicana), `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** Basadre (1903–1980, tacneño, vivió la ocupación chilena de niño) es el historiador canónico del Perú republicano. Los 16 tomos son una cordillera; para este track leer los pasajes específicos de guano y Guerra del Pacífico. Para el pipeline de Jarre: descargar PDF del tomo I (Archivo de Marina) y procesar por `resource_page_range`.

### R2. Libro — Historia del Tahuantinsuyu / Moche, Chimú, Lambayeque (capítulos de Rostworowski y complementos)
- **ID sugerido:** `travel-r-rostworowski-costa`
- **Tipo:** `book`
- **Autor:** María Rostworowski de Diez Canseco
- **Editorial:** Obras Completas, IEP, Lima
- **URL (academia.edu, Tahuantinsuyu con capítulos sobre conquista inca de la costa):** https://www.academia.edu/40423619/HISTORIA_DEL_TAHUANTINSUYU_ROSTWOROWSKI_Mar%C3%ADa
- **URL complementaria (Costa peruana prehispánica, IEP):** https://fondoeditorial.iep.org.pe/producto/costa-peruana-prehispanica-obras-completas-iii/
- **Duración estimada:** ~6h (capítulos de conquista inca de Chimú + sección *Costa peruana prehispánica*)
- **Idioma:** español
- **Enseña:** C4 Chimú / conquista inca · **Refuerza:** C3 (Moche como antecedente), C1 (valles transversales)
- **Notas:** Rostworowski (1915–2016) es la primera historiadora peruana en reconstruir sistemáticamente las sociedades costeñas desde fuentes coloniales (visitas, testamentos). Sus tomos de *Costa peruana prehispánica* son el manual sobre Chimú, Lambayeque y curacazgos costeños. Complemento útil: Patricia Netherly, "Out of many, one: the organization of rule in the north coast polities" (en *The Northern Dynasties*, Moseley & Cordy-Collins 1990) para quien quiera profundidad antropológica política.

### R3. Libro / documental — El tesoro del Señor de Sipán: Walter Alva y la arqueología Moche
- **ID sugerido:** `travel-r-sipan-alva`
- **Tipo:** `article` (dossier + video complementario)
- **Autor/medio:** Walter Alva (coautor con Christopher Donnan, UCLA) + National Geographic España + Infobae
- **URL primaria (National Geographic, reportaje Señor de Sipán):** https://historia.nationalgeographic.com.es/a/tesoro-senor-sipan-esplendor-mochicas_18703
- **URL académica (Huacas de Moche, combate ritual — proyecto PUCP-Uhle):** https://huacasdemoche.pe/noticias/el-combate-ritual-en-las-antiguas-ceremonias-de-sacrificio/
- **URL Infobae (37 años del hallazgo):** https://www.infobae.com/peru/2024/07/18/a-37-anos-de-un-hallazgo-que-revoluciono-la-arqueologia-peruana-la-tumba-del-senor-de-sipan/
- **URL Tufinio, PUCP (sacrificios humanos Huaca de la Luna, PDF):** http://sanjosedemoro.pucp.edu.pe/descargas/arqueologia_mochica/tufinio.pdf
- **Duración estimada:** ~3h (los 3 artículos + el PDF PUCP)
- **Idioma:** español
- **Enseña:** C3 Moche · **Refuerza:** C2 (iconografía deriva de Chavín)
- **Notas:** Walter Alva y Donnan son las dos autoridades canónicas de los Moche. El PDF de Tufinio del proyecto Huacas de Moche (PUCP, Santiago Uceda & Ricardo Morales) documenta las 75 víctimas de sacrificio encontradas en la Plaza 3A de la Huaca de la Luna: evidencia directa del *Tema del Sacrificio* que Donnan había leído en la iconografía. Visita obligada: Museo Tumbas Reales de Sipán en Lambayeque (inaugurado 2002) y Huacas de Moche con su museo in situ (Trujillo).

### R4. Artículo académico — Chavín de Huántar como horizonte iconográfico pan-andino
- **ID sugerido:** `travel-r-chavin-horizonte`
- **Tipo:** `article`
- **Autor:** Luis Guillermo Lumbreras + complementos PUCP
- **URL primaria (PUCP, Textos de Lumbreras, PDF):** https://textos.pucp.edu.pe/pdf/3788.pdf
- **URL complementaria (academia.edu, Lumbreras 1993 *Galería de las Ofrendas*):** https://www.academia.edu/39766303/Lumbreras_Luis_G_1993_Chav%C3%ADn_de_Hu%C3%A1ntar_Excavaciones_en_la_Galer%C3%ADa_de_las_Ofrendas_KAVA_Mainz_PARTE_1_
- **URL proyecto Rick/Stanford (Antamina, cabezas clavas):** https://www.antamina.com/noticias/descubrimiento_historico__tres_nuevas_cabezas_clavas_chavin_huantar_asombran_mundo/
- **Duración estimada:** ~2.5h (leer el PDF PUCP + panorámica de los complementos)
- **Idioma:** español
- **Enseña:** C2 Chavín matriz pan-andina · **Refuerza:** C3 (Moche hereda iconografía)
- **Notas:** Lumbreras (1936–2023) es el arqueólogo peruano que más trabajó el sitio y quien acuñó la lectura del "Horizonte Chavín" como fenómeno pan-andino religioso (no militar). El proyecto de John Rick en Stanford (desde 1995) renueva radicalmente el registro con tecnología 3D y galerías subterráneas. **Importante:** en esta F7 Chavín entra como matriz iconográfica de la costa; en F8 (Cordillera Blanca) vuelve como sitio arqueológico físico con su propio recurso dedicado.

### R5. Libro — Lima la horrible
- **ID sugerido:** `travel-r-salazar-bondy-lima`
- **Tipo:** `book`
- **Autor:** Sebastián Salazar Bondy
- **Editorial:** 1ª ed. Populibros Peruanos, Lima, 1964 (originalmente ERA, México, 1964); reed. Universidad de Concepción, Chile, 2002; reed. Peisa 2014
- **URL (academia.edu, ensayo-reseña académica SciELO Chile):** https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0718-04622003048800013
- **URL complementaria (SciELO Perú, análisis cuadros del imaginario colonial):** http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S2071-50722017000200008
- **URL contexto contemporáneo (Infobae):** https://www.infobae.com/peru/2024/02/10/lima-la-horrible-la-obra-de-sebastian-salazar-bondy-que-aun-sigue-vigente-por-sus-temas-y-por-que-rafael-lopez-aliaga-personifica-ese-libro-segun-la-hija-del-escritor/
- **Duración estimada:** ~4h (137 pp. del ensayo + 2 reseñas académicas)
- **Idioma:** español
- **Enseña:** C5 Lima virreinal/republicana · **Refuerza:** C7 (la crítica al "mito limeño" prepara la lectura del desborde popular)
- **Notas:** Ensayo breve (137 pp.) y afilado. Salazar Bondy (1924–1965, Generación del 50) desmonta la "Arcadia colonial" — el mito aristocrático de una Lima cortés y barroca que oculta servidumbre y exclusión. Es la lectura contra-limeña obligatoria antes de caminar la ciudad. Para el pipeline de Jarre: el texto está en Archive.org (requiere login) o Peisa (físico); reemplazo por las dos reseñas de SciELO si no se consigue acceso al libro completo.

### R6. Libro — Desborde popular y crisis del Estado
- **ID sugerido:** `travel-r-matos-mar-desborde`
- **Tipo:** `book`
- **Autor:** José Matos Mar
- **Editorial:** IEP, Lima, 1984 (primera ed.); actualización *Veinte años después*, 2004
- **URL (repositorio IEP, PDF completo):** https://repositorio.iep.org.pe/bitstreams/c867f585-213a-42be-ab02-ee8009004fd8/download
- **URL catálogo IEP:** https://repositorio.iep.org.pe/handle/IEP/666
- **URL reseña académica (ResearchGate):** https://www.researchgate.net/publication/306395781_Jose_Matos_Mar_Desborde_popular_y_crisis_del_Estado_veinte_anos_despues_-_Resena
- **Duración estimada:** ~5h (~150 pp. del original + reseña actualizada)
- **Idioma:** español
- **Enseña:** C7 migración andina a Lima · **Refuerza:** C5 (Lima republicana se fractura)
- **Notas:** El libro que nombró el fenómeno. Matos Mar (1921–2015, sanmarquino, ayacuchano, fundador-director del IEP) documenta la migración andina de posguerra y el colapso del Estado republicano ante la nueva Lima popular. Aparece el año del estallido senderista (1980) y las invasiones masivas a Huaycán. PDF abierto en el repositorio IEP — lectura obligada para entender cualquier cono limeño.

### R7. Documental / reportaje — Chan Chan y la conquista inca de Chimú
- **ID sugerido:** `travel-r-chan-chan-unesco`
- **Tipo:** `article` (dossier UNESCO + reportajes arqueológicos)
- **Autor/medio:** UNESCO Patrimonio Mundial + Ministerio de Cultura del Perú + Proyecto Especial Chan Chan
- **URL UNESCO (ficha oficial):** https://whc.unesco.org/es/list/366
- **URL Ministerio de Cultura / Patrimonio Mundial Perú:** https://patrimoniomundial.cultura.pe/sitiosdelpatrimoniomundial/zona-arqueol%C3%B3gica-chan-chan
- **URL Proyecto Especial Chan Chan (oficial):** https://chanchan.gob.pe/
- **URL Cátedra UNESCO USMP (Lista en Peligro):** https://catedraunesco.usmp.edu.pe/2018/08/21/zona-arqueologica-chan-chan-patrimonio-cultural-lista-en-peligro/
- **Duración estimada:** ~2h (recorrer los 4 sitios oficiales + un paper Dialnet complementario si se quiere)
- **Idioma:** español
- **Enseña:** C4 Chimú/Chan Chan · **Refuerza:** C3 (la costa norte después de Moche)
- **Notas:** UNESCO declara Chan Chan patrimonio el 28/11/1986 e inmediatamente lo coloca en la Lista en Peligro por erosión, saqueo y lluvias. El Proyecto Especial Chan Chan (organismo peruano desde 1998) gestiona conservación. Complemento académico canónico: Michael Moseley & Kent Day (eds.) *Chan Chan: Andean Desert City* (1982, UNM Press) y Moseley & Cordy-Collins (eds.) *The Northern Dynasties: Kingship and Statecraft in Chimor* (1990, Dumbarton Oaks); el acceso académico abierto está limitado.

### R8. Artículo — Costa norte: afroperuanos Yapatera/Zaña, cultura Vicús y frontera Ecuador 1941
- **ID sugerido:** `travel-r-costa-norte-identidades`
- **Tipo:** `article` (dossier multi-fuente)
- **Autor/medio:** Yapatera Virtual (portal cultural local) + CampUCSS + Museo de Oro Banrepcultural (Vicús, Makowski) + Infobae (guerra 1941)
- **URL Yapatera (portal cultural):** https://yapateravirtual.com/yapatera/
- **URL CampUCSS (aportes afroperuanos):** https://camp.ucss.edu.pe/blog/siete-aportes-afroperuanos-a-la-identidad-nacional/
- **URL Banrepcultural (Makowski, taller Yécala, metalurgia Vicús):** https://publicaciones.banrepcultural.org/index.php/bmo/article/view/6922
- **URL Infobae (guerra Ecuador–Perú 1941):** https://www.infobae.com/peru/2024/07/05/guerra-entre-el-peru-y-ecuador-asi-fue-como-comenzo-la-guerra-en-1941-y-sus-consecuencias/
- **URL TV Perú (Guerra peruano-ecuatoriana, dossier):** https://www.tvperu.gob.pe/noticias/cultural/la-guerra-peruano-ecuatoriana-de-1941-un-episodio-historico-que-marco-la-region
- **Duración estimada:** ~3h (recorrer los 5 enlaces)
- **Idioma:** español
- **Enseña:** C8 norte costero · **Refuerza:** C1 (valles Piura/Chira), C3 (Vicús como antecedente Moche-Lambayeque)
- **Notas:** Dossier multi-fuente por falta de un libro-síntesis único sobre la costa norte peruana. El artículo Makowski-Banrepcultural es el paper académico duro para Vicús. Complemento literario no seedeado (pero fuerte para el usuario): Mario Vargas Llosa, *La casa verde* (1966) y *¿Quién mató a Palomino Molero?* (1986), ambientadas en Piura y Talara. Para afroperuanidad, libro canónico: Carlos Aguirre, *Agentes de su propia libertad* (PUCP, 1993).

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Basadre, Historia de la República | C6 | — |
| R2 Rostworowski, Costa peruana | C4 | — |
| R3 Sipán / Walter Alva / Donnan | C3 | — |
| R4 Lumbreras / Rick, Chavín | C2 | — |
| R5 Salazar Bondy, Lima la horrible | C5 | — |
| R6 Matos Mar, Desborde popular | C7 | — |
| R7 Chan Chan / UNESCO | C4 (complementa R2) | — |
| R8 Norte costero dossier | C8 | — |

**Cobertura por recursos directos:** C1 (cubierto lateralmente en R2, R3, R8 — geografía de valles); C2 (R4); C3 (R3); C4 (R2, R7); C5 (R5 + R1); C6 (R1); C7 (R6); C8 (R8). **C1 no tiene recurso propio dedicado** — se apoya en la geografía que R2, R3 y R8 describen al ubicar cada cultura en su valle. Si en reseed se juzga insuficiente, sumar R9 con el libro *Las 11 ecorregiones del Perú* de Antonio Brack (FAO-Perú) o un paper sobre la Humboldt.

Prerrequisitos de concepto a concepto ya expresados en cada card arriba; se traducen a filas de `concept_prerequisites`. **Cross-phase prereqs** apuntan a F1: `travel-f1-geografia-fisica`, `travel-f1-virreinatos`, `travel-f1-divergencia-poscolonial`.

---

## DAG pedagógico

```
(F1: geografia-fisica)
        │
        ▼
      C1 (desierto + Humboldt + valles)
        │
        ├─► C2 (Chavín matriz) ──────────┐
        │                                │
        ├─► C3 (Moche / Sipán) ◄─────────┘
        │         │
        │         └─► C4 (Chimú / Chan Chan / conquista inca)
        │
        └─► C8 (norte: Vicús, afroperuanos, frontera Ecuador)

(F1: virreinatos) ──► C5 (Lima virreinal + republicana + Salazar Bondy)
                         │
(F1: divergencia-poscolonial) ──► C6 (guano + salitre + Pacífico) ──► C7 (migración + desborde)
```

Orden de estudio recomendado: **C1 → C2 → C3 → C4 → C8 → C5 → C6 → C7**. Empezar por el desierto y los valles, subir por la arqueología (Chavín como matriz, Moche, Chimú), desviar al norte piurano-tumbesino antes de entrar a Lima, y cerrar con el arco república → guerra → migración que explica la Lima del siglo XXI.

---

## Estimación total de horas

| Recurso | Horas |
|---------|-------|
| R1 Basadre (tomos selectos) | 10h |
| R2 Rostworowski Costa | 6h |
| R3 Sipán / Alva / Donnan dossier | 3h |
| R4 Lumbreras Chavín | 2.5h |
| R5 Salazar Bondy | 4h |
| R6 Matos Mar Desborde popular | 5h |
| R7 Chan Chan UNESCO dossier | 2h |
| R8 Norte costero dossier | 3h |
| **Total recursos** | **35.5h** |

Más cuestionarios, síntesis y escritura reflexiva: **~45h totales** para la fase. Realista para ~2.5–3 semanas bajando Tumbes → Piura → Chiclayo → Trujillo → Lima.

---

## Cosas a validar antes de seedear

1. **R1 Basadre**: los 16 tomos son mucho — confirmar qué selección de capítulos entra al pipeline. Recomendación: *Era del guano* (tomo VI), *Guerra del Pacífico* (tomos VIII–IX), *Reconstrucción nacional* (tomo X). Si el PDF de Archivo de Marina cubre sólo el tomo I, complementar con el repositorio UNMSM o BCR.
2. **R2 Rostworowski Costa**: confirmar si el IEP tiene PDF abierto del tomo *Costa peruana prehispánica*; si no, trabajar con capítulos fotocopiados.
3. **R5 Salazar Bondy**: ensayo corto y contundente, pero la edición Peisa 2014 tiene prólogo de Alejandro Susti que vale la pena. Verificar disponibilidad.
4. **R7 Chan Chan**: considerar sumar un video documental (TV Perú *Sucedió en el Perú* o National Geographic). El dossier escrito es sólido pero el usuario que va a caminar Chan Chan agradece imagen.
5. **C1 sin recurso propio**: decidir si sumar R9 sobre ecorregiones/Humboldt. Juicio del coordinator: apoyar en R2+R3+R8 es suficiente pero marginal; si el usuario quiere geografía física dura, sumar el paper de *Investigación y Ciencia* sobre los Andes ya listado en F1-R7.
6. **Integración con pipeline**: R1, R2, R5, R6 entran como PDFs largos con `resource_page_range`. R3, R4, R7, R8 son dossiers multi-URL que el pipeline debe resolver individualmente.
7. **Complemento literario opcional**: Mario Vargas Llosa *La casa verde* (1966) para Piura, *Conversación en La Catedral* (1969) para Lima de los años 50, Alonso Cueto *La hora azul* (2005) para la Lima post-CVR; Ciro Alegría *El mundo es ancho y ajeno* (1941) para el horizonte andino que explica la migración. No los seedeo como recursos del track (son ficción, no rigor académico) pero son lectura lateral fuerte.

---

## Próximos pasos del coordinator

Mientras el ejecutor sigue con infra:
- [ ] Resolver los puntos de `[revisar]` arriba (R1 selección tomos, R2 PDF Costa, R7 video)
- [ ] Cross-check con F1: los prereqs `travel-f1-*` existen en el seed de F1 y coinciden en naming
- [ ] Cross-check con F8: Chavín aparece en F7 como matriz iconográfica y en F8 como sitio físico — confirmar que los IDs son distintos (`travel-f7-chavin-matriz` vs `travel-f8-chavin-sitio`) y que no hay conflicto
- [ ] Actualizar `PROGRESS.md` con el cierre del brief F7
