# Fase 6 — Ecuador Andino y Costa · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 6 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='6'`.

**Para el coordinator (yo mismo, futuro):** 8 conceptos con 8 recursos. URLs verificadas via WebSearch/WebFetch el 2026-04-22. Puntos `[revisar]` al final.

---

## Objetivo de la fase

Cerrar el bloque Ecuador con la dualidad estructurante sierra–costa y la geología volcánica que organiza el país andino. Al terminar, el usuario debería poder responder sin dudar: por qué Quito es colonial y Guayaquil es portuaria (y qué significa eso políticamente), qué es la Avenida de los Volcanes y por qué Humboldt la bautizó así, cómo el cacao hizo rica a la oligarquía guayaquileña y destruyó su propia base con la crisis de 1920, por qué Eloy Alfaro pasó de héroe nacional a ser quemado en la plaza pública, qué pasó con los ahorros de los ecuatorianos en 1999 y por qué la dolarización sigue vigente 26 años después, y por qué el movimiento indígena ecuatoriano es el más influyente del continente desde 1990. La fase es vital para el viajero motero porque conecta las rutas Cotopaxi–Cuenca y explica los precios que va a pagar en Guayaquil (dólar, no sucre).

---

## Conceptos (8)

### C1. Quito colonial, pre-colombino y patrimonio UNESCO
- **ID sugerido:** `travel-f6-quito-colonial`
- **Slug:** `quito-colonial-precolombino-unesco`
- **Definición canónica:** Quito es doble: asentamiento precolombino de los Quitu-Caras integrado tardíamente al Tawantinsuyu por Huayna Cápac (1487), y fundación española por Sebastián de Benalcázar el 6 de diciembre de 1534 sobre las ruinas que Rumiñahui incendió antes que entregarlas intactas. La Cédula Real de 29 de agosto de 1563 establece la Real Audiencia de Quito, con jurisdicción cinco veces mayor que el Ecuador actual y dependiente del Virreinato del Perú. Entre los siglos XVII y XVIII florece la *Escuela Quiteña*, síntesis mestiza de barroco europeo e iconografía andina cuyos máximos exponentes son Miguel de Santiago, Bernardo de Legarda y Manuel Chili "Caspicara"; su prestigio llegó a la corte de Madrid. Quito fue el **primer sitio en el mundo declarado Patrimonio Cultural de la Humanidad por UNESCO** (8 de septiembre de 1978), con un centro histórico de 320 hectáreas y la infraestructura colonial mejor conservada de Hispanoamérica.
- **Prerrequisitos:** `travel-f1-virreinatos` (cross-phase, Fase 1), `travel-f1-pueblos-precolombinos`

### C2. Avenida de los Volcanes y geología andina ecuatoriana
- **ID sugerido:** `travel-f6-avenida-volcanes`
- **Slug:** `avenida-volcanes-geologia-andina`
- **Definición canónica:** El corredor interandino ecuatoriano —bautizado "Avenida de los Volcanes" por Alexander von Humboldt en su expedición a Ecuador (junio 1802)— es el tramo de los Andes donde la subducción de la placa de Nazca produce dos cordilleras paralelas (Occidental y Real) con una fosa central de ~350 km que alberga más de 70 volcanes y nevados. Los cuatro hitos: **Cotopaxi** (5.897 m, activo, ciclos eruptivos 1532-34, 1742-44, 1766-68, 1853-54, 1877-80 y reactivación 2015; la erupción de 1877 envió lahares hasta Esmeraldas y Napo), **Chimborazo** (6.263 m, potencialmente activo, el **punto de la superficie terrestre más alejado del centro de la Tierra** por el abultamiento ecuatorial, y la cima que Humboldt-Bonpland-Montúfar intentaron coronar el 23 de junio de 1802 alcanzando 5.917 m, donde Humboldt concibió el *Naturgemälde*: primera representación visual de la distribución altitudinal de la vegetación, infografía científica fundacional), **Antisana** (5.704 m, con reserva ecológica clave para el agua de Quito) y **Tungurahua** (5.023 m, activo, fases eruptivas 1999-2016). Alrededor del Instituto Geofísico de la EPN — que instaló en 1976 la primera estación sísmica permanente dedicada a un volcán en Sudamérica — se organiza el monitoreo.
- **Prerrequisitos:** `travel-f1-geografia-fisica` (cross-phase, Fase 1)

### C3. Guayaquil, identidad costeña y montubio
- **ID sugerido:** `travel-f6-guayaquil-costa`
- **Slug:** `guayaquil-costa-montubio`
- **Definición canónica:** Guayaquil es la antítesis de Quito: ciudad portuaria fundada por Francisco de Orellana en 1547 (como puerto articulador del Pacífico sur-ecuatoriano), poca arquitectura colonial sobreviviente por incendios recurrentes y la acción de los piratas, y una identidad volcada al comercio, al río Guayas y a la industria naval. El **9 de octubre de 1820** Guayaquil se independiza por sí sola —liderada por el poeta José Joaquín de Olmedo— mucho antes que Quito (24 mayo 1822) y se proclama Provincia Libre; crea la División Protectora de Quito que pelea bajo Sucre en Pichincha. La población costeña mezcla descendencia afro (trabajadores de haciendas cacaoteras), indígena del litoral (Huancavilca, Chono), española y posteriormente migración sirio-libanesa y china. El *montubio* —el campesino mestizo de la costa interior, identidad ecuestre y agrícola reconocida como pueblo en la Constitución 2008— es el correlato del gaucho o del llanero: categoría étnica propia que no encaja en el binomio mestizo-indígena andino. La rivalidad estructural Quito–Guayaquil (sierra conservadora–costa liberal, altura–puerto, católica–laica) es el eje que organiza la política ecuatoriana hasta hoy.
- **Prerrequisitos:** `travel-f1-capitales-ubicacion` (cross-phase, Fase 1)

### C4. Cacao ecuatoriano: la "pepa de oro"
- **ID sugerido:** `travel-f6-cacao-pepa-oro`
- **Slug:** `cacao-pepa-oro-oligarquia-cacaotera`
- **Definición canónica:** El cacao Nacional Arriba ecuatoriano fue la primera gran exportación del país independiente: desde la liberación comercial post-1820 hasta 1920, Ecuador fue el mayor exportador mundial de cacao fino, con epicentro en la cuenca del Guayas. El **boom 1880-1920** (la "pepa de oro") consolida a los *Gran Cacao* —oligarquía cacaotera guayaquileña propietaria de haciendas con miles de árboles y mano de obra afrodescendiente e indígena bajo sistema de concertaje— y funda la burguesía comercial-financiera guayaquileña que financia la Revolución Liberal de 1895. Para 1914 el cacao aportaba 60-70% de las divisas del país. La crisis llega en 1920 con el doble golpe de la **"escoba de bruja"** (hongo *Moniliophthora perniciosa*) y la **monilia** (*M. roreri*) que destruyen los cultivos, sumados a la caída de precios por la Primera Guerra Mundial y la competencia de las colonias africanas. La crisis cacaotera es lo que habilita, veinte años después, el ascenso del banano y, luego, del petróleo como exportación dominante. Entender el cacao es entender por qué Ecuador tiene una oligarquía costeña-financiera y no una oligarquía serrana-terrateniente como Perú o Bolivia.
- **Prerrequisitos:** C3

### C5. Revolución Liberal de Eloy Alfaro (1895–1912)
- **ID sugerido:** `travel-f6-revolucion-liberal-alfaro`
- **Slug:** `revolucion-liberal-eloy-alfaro`
- **Definición canónica:** José Eloy Alfaro Delgado (Montecristi 1842 – Quito 1912), el *Viejo Luchador*, lidera desde el exilio la montonera liberal durante tres décadas contra el régimen conservador católico dominante desde García Moreno. El **5 de junio de 1895** triunfa la Revolución Liberal en Guayaquil y Alfaro toma el poder (1895-1901 y 1906-1911). Reformas estructurales: (a) **separación Iglesia-Estado** con la Ley de Instrucción Pública 1897 (educación laica y gratuita, expropiación de bienes del clero), matrimonio civil y divorcio; (b) construcción del **Ferrocarril Trasandino Guayaquil-Quito**, inaugurado el 25 de junio 1908, obra de ingeniería que atravesó la Nariz del Diablo (pendiente 5.5%, zigzag excavado en roca viva) y unió por primera vez costa y sierra en ~12 horas donde antes tomaba 15 días a lomo de mula; (c) derogación del concertaje indígena (1918, póstumo) y promoción del sufragio universal masculino. El 28 de enero 1912, turba conservadora azuzada por la Iglesia arrastra a Alfaro por las calles de Quito y lo quema en el parque El Ejido — episodio bautizado **"Hoguera Bárbara"** por Alfredo Pareja Diezcanseco (1944). Es el momento fundacional del Ecuador laico moderno.
- **Prerrequisitos:** C3, C4

### C6. Cuenca y el Austro: toquilla, patrimonio y migración
- **ID sugerido:** `travel-f6-cuenca-austro`
- **Slug:** `cuenca-austro-toquilla-migracion`
- **Definición canónica:** Santa Ana de los Ríos de Cuenca (Azuay), tercera ciudad del Ecuador, fundada en 1557 sobre el asentamiento Cañari de *Guapondélig* y la ciudad Inca de *Tomebamba* (segunda capital del Tawantinsuyu bajo Huayna Cápac). Su centro histórico fue declarado **Patrimonio Cultural de la Humanidad por UNESCO en 1999**, reconocido como ejemplo sobresaliente de ciudad virreinal planificada según las Ordenanzas de Felipe II. Cuenca es capital del *Austro* (sierra sur: Azuay, Cañar, Loja, parte de Morona Santiago). Dos fenómenos clave: (a) el **sombrero de paja toquilla** (*Carludovica palmata*, tejido artesanalmente por mujeres de Manabí y Cuenca-Azuay), llamado internacionalmente "Panama hat" por el puerto de exportación del siglo XIX; Patrimonio Cultural Inmaterial UNESCO 2012; (b) la **diáspora del Austro** desde los 1990s: tras la crisis agraria y el colapso de 1999, decenas de miles de cuencanos y azuayos migraron a Nueva York, Nueva Jersey y Murcia/Madrid, al punto que las remesas del Austro sostienen la economía de provincias enteras y las casas "estilo americano" de pueblos como Gualaceo y Chordeleg son un fenómeno urbanístico visible. La diáspora azuaya explica por qué Ecuador es el tercer país latinoamericano por proporción de remesas sobre PIB.
- **Prerrequisitos:** C3, C4

### C7. Movimiento indígena ecuatoriano: CONAIE, Pachakutik y Sumak Kawsay
- **ID sugerido:** `travel-f6-movimiento-indigena-conaie`
- **Slug:** `conaie-pachakutik-sumak-kawsay`
- **Definición canónica:** Desde la fundación de la **Confederación de Nacionalidades Indígenas del Ecuador (CONAIE)** el 16 de noviembre de 1986 —uniendo Ecuarunari (sierra Kichwa), CONFENIAE (Amazonía) y CONAICE (costa)— el movimiento indígena ecuatoriano se convierte en el más influyente del continente. Hitos: (a) **Levantamiento del Inti Raymi (junio 1990)**, bajo la presidencia de Luis Macas, paraliza el país y coloca en la agenda la plurinacionalidad; (b) fundación en 1995 del brazo político **Pachakutik** (*Movimiento de Unidad Plurinacional Pachakutik*, "tiempo de retorno/revolución" en kichwa) como instrumento electoral; (c) rol decisivo en la caída de **Abdalá Bucaram (1997)**, **Jamil Mahuad (2000)** — levantamiento del 21 de enero con el coronel Lucio Gutiérrez — y **Lucio Gutiérrez (2005)**; (d) entrada del *Sumak Kawsay* ("buen vivir") y los derechos de la naturaleza en la **Constitución de Montecristi 2008**, primera del mundo en reconocer a la naturaleza como sujeto de derechos; (e) paros nacionales de octubre 2019 (contra FMI) y junio 2022, bajo liderazgo de Leonidas Iza y CONAIE. El movimiento es el actor no-partidario más potente del país y condicionante de cualquier gobierno.
- **Prerrequisitos:** C5, `travel-f5-pueblos-amazonicos` (cross-phase, Fase 5), `travel-f5-amazonia-presente` (cross-phase, Fase 5)

### C8. Crisis 1999 y dolarización 2000
- **ID sugerido:** `travel-f6-crisis-dolarizacion`
- **Slug:** `crisis-1999-dolarizacion-2000`
- **Definición canónica:** Síntesis contemporánea. A fines de los 90s Ecuador acumula tres crisis simultáneas: **Fenómeno de El Niño 1997-98** (USD 2.900 M en daños agrícolas en la costa), colapso del precio del petróleo (USD 7/barril en 1998), crisis financiera asiática y rusa 1997-98 que corta crédito externo. El sistema bancario, liberalizado sin supervisión desde la Ley de Instituciones Financieras de 1994, está quebrado por créditos vinculados. El presidente Jamil Mahuad declara **feriado bancario el 8 de marzo 1999** (anunciado por 24h, dura 5 días) y luego **congela los depósitos por un año**; cierran 17 bancos privados, entre ellos Filanbanco y el Progreso. El sucre, que valía 4.493/USD en enero 1998, llega a 25.000/USD en enero 2000. El 9 de enero 2000 Mahuad decreta **dolarización** a 25.000 sucres/USD. Dos semanas después, el 21 de enero, una coalición de CONAIE + militares (coronel Lucio Gutiérrez) lo derroca; asume Gustavo Noboa y ratifica la dolarización. **Consecuencias:** inflación controlada de inmediato, pero pérdida de soberanía monetaria; emigración masiva a España, Italia y EE.UU. (~1.5 millones de ecuatorianos, 10% de la población) cuyas remesas sostienen la economía familiar desde entonces. En 2026 la dolarización sigue vigente tras ocho gobiernos porque cualquier salida tiene costo político mayor que mantenerla. Para el viajero: los precios que ve en Guayaquil son en USD reales, con la rigidez que eso implica (no hay devaluación que los abarate).
- **Prerrequisitos:** C4, C5, C7

---

## Recursos (8)

### R1. Libro — Resumen de Historia del Ecuador (Enrique Ayala Mora)
- **ID sugerido:** `travel-r-ayala-mora-resumen-historia`
- **Tipo:** `book`
- **Autor:** Enrique Ayala Mora (rector UASB, doctorado en Oxford)
- **URL (Internet Archive, acceso libre):** https://archive.org/details/ResumenDeHistoriaDelEcuador
- **URL editorial (Corporación Editora Nacional):** https://www.cenlibrosecuador.org/product-details-book.php?cd=1105
- **Idioma:** español
- **Capítulos a leer:** Cap. 4 (Revolución Alfarista) + Cap. 5 (Época republicana del siglo XX) + Cap. 6 (Ecuador contemporáneo). Aprox. 100 páginas.
- **Duración estimada:** ~6h
- **Enseña:** C1 Quito colonial, C5 Alfaro, C7 movimiento indígena, C8 dolarización · **Refuerza:** C3, C4, C6
- **Notas:** EL libro canónico de historia ecuatoriana. Ayala Mora edita la *Nueva Historia del Ecuador* (15 volúmenes) y es el historiador vivo más citado del país. 22.000 copias impresas. Internet Archive tiene PDF + EPUB + texto completo.

### R2. Artículo — La época cacaotera en Ecuador (Juan Paz y Miño Cepeda)
- **ID sugerido:** `travel-r-paz-y-mino-cacao`
- **Tipo:** `article`
- **Autor:** Juan J. Paz y Miño Cepeda (Cronista de Quito, Academia Nacional de Historia)
- **URL (Boletín del Taller de Historia Económica, PDF):** https://the.pazymino.com/JPyM-Epoca_Cacaotera_Ecuador.pdf
- **URL alternativa (blog académico):** https://www.historiaypresente.com/la-epoca-cacaotera-ecuador/
- **Idioma:** español
- **Duración estimada:** ~1-1.5h
- **Enseña:** C4 cacao · **Refuerza:** C3, C5 (por qué la burguesía cacaotera financia a Alfaro)
- **Notas:** Paz y Miño es uno de los dos historiadores económicos vivos con más obra sobre Ecuador (junto a Ayala Mora). Su Taller de Historia Económica (THE) publica material académico abierto.

### R3. Video — Video sobre la caída del sucre, feriado bancario y dolarización
- **ID sugerido:** `travel-r-feriado-bancario-dolarizacion`
- **Tipo:** `video`
- **Autor/Canal:** (verificar canal específico)
- **URL primaria:** https://www.youtube.com/watch?v=Sbb8eLjwuG0
- **URL alternativa ("Héroe o Villano: Mahuad"):** https://www.youtube.com/watch?v=VDHWBtJ-DDs
- **Duración estimada:** 20-40 min
- **Idioma:** español
- **Enseña:** C8 crisis-dolarización · **Refuerza:** C7 (caída de Mahuad)
- **Notas:** `[revisar]` Elegir entre los dos videos. El segundo cubre explícitamente la figura de Mahuad entre dolarización y feriado bancario. Complemento sólido: archivo gk.city "El feriado bancario en Ecuador" (https://gk.city/2020/01/09/feriado-bancario-ecuador/) como lectura.

### R4. Artículo — La dolarización cumple un cuarto de siglo en Ecuador (análisis Primicias)
- **ID sugerido:** `travel-r-primicias-25-anos-dolarizacion`
- **Tipo:** `article`
- **Autor:** Redacción Primicias (con fuentes del BCE y economistas académicos)
- **URL:** https://www.primicias.ec/economia/dolarizacion-economia-ecuador-25anos-87060/
- **Idioma:** español
- **Duración estimada:** ~30 min
- **Enseña:** C8 dolarización · **Refuerza:** C4, C7
- **Notas:** Análisis panorámico 2000-2025 de la dolarización, con datos BCE y entrevistas a economistas. Primicias es el medio digital de mayor prestigio académico actual en Ecuador (2020-). Complemento contemporáneo al paper canónico del BCE ("La Economía Ecuatoriana Luego de 10 Años de Dolarización", https://contenido.bce.fin.ec/documentos/PublicacionesNotas/Notas/Dolarizacion/Dolarizacion10anios.pdf) que puede entrar como lectura opcional si el usuario quiere más profundidad.

### R5. Artículo + sitio — Instituto Geofísico EPN: Cotopaxi y Chimborazo
- **ID sugerido:** `travel-r-ig-epn-volcanes`
- **Tipo:** `article`
- **Autor:** Instituto Geofísico de la Escuela Politécnica Nacional (IG-EPN), Quito
- **URL principal Cotopaxi (erupciones históricas):** https://www.igepn.edu.ec/interactuamos-con-usted/1119-las-erupciones-historicas-del-volcan-cotopaxi
- **URL Chimborazo (ficha institucional):** https://www.igepn.edu.ec/chimborazo
- **URL Crónica 1877 (Cotopaxi):** https://www.igepn.edu.ec/interactuamos-con-usted/2081-la-erupcion-del-cotopaxi-de-1877
- **Idioma:** español
- **Duración estimada:** ~1.5h (lectura de tres artículos técnicos breves)
- **Enseña:** C2 Avenida de los Volcanes · **Refuerza:** —
- **Notas:** IG-EPN es la autoridad científica oficial y única fuente técnica ecuatoriana sobre vulcanología. Relevancia crítica para el usuario motero que tiene equipo de montaña en Quito y probablemente planee ascensiones o paso cerca de los conos activos.

### R6. Libro — La invención de la naturaleza: Humboldt (Andrea Wulf)
- **ID sugerido:** `travel-r-wulf-invencion-naturaleza`
- **Tipo:** `book`
- **Autor:** Andrea Wulf (historiadora, Royal Society Science Book Award)
- **URL (ficha editorial):** https://www.casadellibro.com/libro-la-invencion-de-la-naturaleza/9788430618088/3052193
- **URL (Wikipedia con bibliografía):** https://es.wikipedia.org/wiki/La_invenci%C3%B3n_de_la_naturaleza
- **Idioma:** español (original inglés 2015)
- **Capítulos a leer:** Capítulos 6-8 (expedición ecuatoriana, ascenso al Chimborazo, concepción del Naturgemälde). Aprox. 80 páginas.
- **Duración estimada:** ~5h
- **Enseña:** C2 Humboldt y avenida volcanes · **Refuerza:** C1 (Quito virreinal que Humboldt visita)
- **Notas:** Biografía premiada y canónica sobre Humboldt. La sección ecuatoriana es la clave del libro (es donde Humboldt concibe su visión integral de la naturaleza). Disponible en librerías físicas de Quito y Guayaquil (Mr. Books Mall del Sol del usuario). Alternativa open-access: ensayo original de Humboldt "Viaje a las regiones equinocciales del Nuevo Continente" en archive.org.

### R7. Video — La Batalla de Pichincha: Victoria decisiva 24 de mayo 1822
- **ID sugerido:** `travel-r-batalla-pichincha`
- **Tipo:** `video`
- **Autor/Canal:** (canal educativo, verificar)
- **URL:** https://www.youtube.com/watch?v=DeVidkRepzM
- **URL alternativa (canal "Pero eso es otra Historia"):** https://www.youtube.com/channel/UCBIMW0ZhwULY_x7fdaPRPiQ
- **Duración estimada:** 15-30 min
- **Idioma:** español
- **Enseña:** C1 Quito (cierre militar) · **Refuerza:** `travel-f1-independencias` (cross-phase, Fase 1)
- **Notas:** `[revisar]` Elegir URL final. La batalla del Pichincha (24 mayo 1822, Sucre vs Aymerich) cierra la independencia de la Audiencia de Quito y la integra a la Gran Colombia; es complemento directo a la Entrevista de Guayaquil (R3 Fase 1). Pero eso es otra Historia ya se usó en Fase 1, puede servir capítulo específico.

### R8. Novela — Huasipungo (Jorge Icaza)
- **ID sugerido:** `travel-r-icaza-huasipungo`
- **Tipo:** `book` (ficción literaria histórica)
- **Autor:** Jorge Icaza (Quito, 1906-1978)
- **URL (Wikipedia con metadatos y enlaces):** https://es.wikipedia.org/wiki/Huasipungo
- **URL alternativa (Goodreads ficha):** https://www.goodreads.com/book/show/1891345.Huasipungo
- **Idioma:** español (con voces kichwa)
- **Duración estimada:** ~6-8h (novela de ~200 páginas)
- **Enseña:** C7 movimiento indígena (raíz histórica del sistema hacienda-indígena) · **Refuerza:** C5 (crítica al sistema que Alfaro intentó desmontar)
- **Notas:** Publicada en 1934, la novela indigenista canónica de Ecuador y una de las más traducidas de Latinoamérica (40 idiomas). Describe la hacienda serrana y el sistema del huasipungo (parcela que el indígena cultiva a cambio de trabajo forzado para el terrateniente). Es ficción literaria, no historiografía: se lee en paralelo con Ayala Mora (R1) para contrastar narrativa y estructura. Alternativa académica si se prefiere no ficción: "Sublevaciones indígenas" de Moreno Yáñez (ya usado en Fase 5 R5).

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de |
|---------|-------------------------------|---------------------|
| R1 Ayala Mora Resumen | C1, C5, C7, C8 | — |
| R2 Paz y Miño Cacao | C4 | — |
| R3 Feriado bancario video | C8 | — |
| R4 Primicias 25 años dolarización | C8 | — |
| R5 IG-EPN Volcanes | C2 | — |
| R6 Wulf Humboldt | C2 | — |
| R7 Batalla Pichincha video | C1 | — |
| R8 Icaza Huasipungo | C7 | — |

Prerrequisitos entre conceptos: expresados en cada card. Cross-phase prereqs hacia Fase 1 (C1→`travel-f1-virreinatos`, `travel-f1-pueblos-precolombinos`; C2→`travel-f1-geografia-fisica`; C3→`travel-f1-capitales-ubicacion`) y hacia Fase 5 (C7→`travel-f5-pueblos-amazonicos`, `travel-f5-amazonia-presente`).

---

## Cosas a validar antes de seedear

1. **R3 Feriado bancario**: elegir URL final. Segundo candidato ("Héroe o Villano: Mahuad") es más largo y cubre mejor el contexto biográfico.
2. **R7 Batalla Pichincha**: confirmar canal y duración. Si es demasiado corto/amateur, reemplazar por capítulo específico del canal "Pero eso es otra Historia" o por material del Ministerio de Cultura ecuatoriano (YouTube channel oficial).
3. **R6 Wulf**: al ser libro físico, ver si el usuario prefiere versión digital paga (Kindle/Kobo) o la versión abierta del ensayo original de Humboldt. Mr. Books en Mall del Sol (Guayaquil, ya en saved places del usuario) lo tiene seguro en físico.
4. **R8 Huasipungo**: novela densa, 6-8h. Si el usuario lo ve mucho, dejarlo como recurso "enriquecimiento" (no obligatorio en el path pedagógico). Alternativa más corta: "Don Goyo" de Demetrio Aguilera Malta (costeña, montubios, ~150 pp).
5. **Cross-phase prereqs**: C1, C2, C3 referencian Fase 1; C7 referencia Fase 5. Antes del seed, confirmar que ambas migrations corrieron y los `source_id` de conceptos existen en DB.
6. **Enum `resource_type`**: todos los tipos usados (`article`, `book`, `video`) cubiertos.
7. **`estimated_hours`**: R1 6h, R2 1.25h, R3 0.5h, R4 0.5h, R5 1.5h, R6 5h, R7 0.5h, R8 7h. Total fase ≈22h (más pesada por Ayala Mora + Wulf + Icaza; aceptable dado que es el cierre del país Ecuador).

---

## Próximos pasos del coordinator

- [ ] Resolver los puntos de `[revisar]` arriba (R3, R7)
- [ ] Decidir si R8 Huasipungo entra como obligatorio o como enriquecimiento según carga total
- [ ] Validar que las tres migrations (Fase 1, Fase 5, Fase 6) corren en orden y los cross-phase prereqs se resuelven
- [ ] Cuando el ejecutor reporte seed done, actualizar `PROGRESS.md` y pasar este brief como input para `20260421060000_seed_travel_phase_6.sql`
