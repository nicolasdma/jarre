# Fase 2 — Colombia Caribe y Darién · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 2 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='2'`.

**Para el coordinator (yo mismo, futuro):** entrada física a Colombia por el Caribe (Cartagena → Barranquilla → Santa Marta → Tayrona → Taganga → Montería → Turbo → Capurganá → frontera con Panamá por Guna Yala). La fase tiene que sostener dos ejes duros: (a) Cartagena como puerto esclavista central del sistema atlántico — no una ciudad turística con muralla sino el nodo colonial por el que entró ~40% de la trata negrera española; (b) el Tapón del Darién como frontera geológica, ambiental y geopolítica que hoy es corredor migratorio. En el medio: Sierra Nevada pre-colombina (Teyuna), vallenato y Macondo, cimarronaje palenquero, Bolívar muriendo en Santa Marta 1830. 8 conceptos, 8 recursos, cada URL verificada en búsquedas del 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué Cartagena existe donde existe (bahía protegida + única puerta de Indias habilitada + conexión por Magdalena a Bogotá), cómo funcionaba el sistema esclavista atlántico que la sostuvo durante 250 años y por qué San Basilio de Palenque es la primera "villa libre" de América (1713), qué hace que la Sierra Nevada de Santa Marta sea un objeto geográfico único (macizo costero aislado con todos los pisos ecológicos en 42 km horizontales y el pueblo Kogi-Arhuaco-Wiwa como continuidad de la cultura Tayrona), por qué Barranquilla emerge recién en el siglo XIX y desplaza económicamente a Cartagena, qué significa el vallenato como síntesis triétnica caribe (gaita indígena + tambor africano + acordeón europeo), por qué Simón Bolívar va a morir en la Quinta de San Pedro Alejandrino, qué es el Tapón del Darién como límite geológico real (la única discontinuidad del sistema de carreteras Alaska-Tierra del Fuego) y por qué es hoy el mayor corredor migratorio del hemisferio occidental, y por qué los Guna/Kuna sostienen desde 1925 la única autonomía indígena constitucionalmente reconocida de Centroamérica.

---

## Conceptos (8)

### C1. Geografía del Caribe colombiano y Sierra Nevada de Santa Marta
- **ID sugerido:** `travel-f2-geografia-caribe`
- **Slug:** `caribe-colombiano-sierra-nevada`
- **Definición canónica:** El Caribe colombiano es una planicie aluvial dominada por tres sistemas fluviales (Magdalena, Cauca-Sinú, Atrato) que desembocan en una costa de bahías protegidas (Cartagena, Morrosquillo, Urabá). En el centro-este de esta llanura emerge la Sierra Nevada de Santa Marta: un macizo piramidal aislado de 5 775 m (picos Cristóbal Colón y Simón Bolívar) a solo 42 km de la línea de costa, lo que la convierte en la montaña costera más alta del mundo y en un sistema con todos los pisos ecológicos — manglar, bosque seco tropical, bosque de niebla, páramo, glaciar — comprimidos en una transversal cortísima. Geológicamente es un "bloque" desplazado de los Andes (acreción cretácica sobre el Caribe) y no parte de la cordillera andina propiamente. Esta geometría explica simultáneamente la densidad de la cultura Tayrona pre-colombina (aprovechamiento vertical de pisos), la supervivencia actual de los pueblos Kogi-Arhuaco-Wiwa-Kankuamo (la Línea Negra protege el perímetro sagrado) y la función estratégica de Santa Marta como primera ciudad española fundada en el territorio (1525).
- **Prerrequisitos:** `travel-f1-geografia-fisica` (F1)

### C2. Cartagena de Indias: puerto esclavista y fortificación de la Flota
- **ID sugerido:** `travel-f2-cartagena-colonial`
- **Slug:** `cartagena-puerto-esclavista-fortificaciones`
- **Definición canónica:** Cartagena, fundada el 1 de junio de 1533 por Pedro de Heredia, se consolida como uno de los tres puertos habilitados por la Corona para el comercio atlántico (junto a Veracruz y Portobelo) y sede del asiento de negros entre 1595 y 1789 — durante ese período ingresaron por su puerto ~150 000–200 000 africanos esclavizados, y Cartagena fue el mercado humano más grande de la América española. La ciudad es simultáneamente (a) centro económico de la trata — con la "Casa del Cabildo" y los corrales de esclavos en lo que hoy es Getsemaní; (b) nodo defensivo de la Flota de Tierra Firme, que justifica el sistema de fortificaciones más grande del Nuevo Mundo: 11 km de murallas, los fuertes de San Felipe de Barajas (1657, ampliado por Antonio de Arévalo), San Fernando, San José, San Luis de Bocachica; (c) sede del Tribunal de la Inquisición desde 1610 (tercero de América después de Lima y México); y (d) único puerto americano que resistió exitosamente el mayor asalto británico del siglo XVIII — el sitio de Edward Vernon de 1741, derrotado por Blas de Lezo "el Mediohombre". Cartagena no es una "joya colonial" accidental: es la infraestructura de piedra que el imperio español construyó para proteger el canal que drenaba plata de Potosí vía Magdalena y para procesar los cuerpos humanos que sostenían ese sistema.
- **Prerrequisitos:** `travel-f1-virreinatos` (F1), `travel-f1-potosi` (F1), `travel-f1-rutas-coloniales` (F1)

### C3. Trata atlántica y Palenque: Benkos Biohó y el cimarronaje
- **ID sugerido:** `travel-f2-palenque-cimarronaje`
- **Slug:** `palenque-biohó-cimarronaje`
- **Definición canónica:** La trata transatlántica introdujo a la Nueva Granada entre 1580 y 1810 cerca de medio millón de africanos esclavizados, mayoritariamente por Cartagena. Desde los primeros años hubo fugas: los cimarrones fundaban *palenques* — aldeas fortificadas en zonas de difícil acceso (Montes de María, serranía de San Lucas, cuenca del Dique) desde donde negociaban con las autoridades coloniales. El caso canónico es San Basilio de Palenque, fundado hacia 1600 por Benkos Biohó (probablemente un noble africano de origen Bijagó, capturado y escapado del puerto de Cartagena) y reconocido por la Corona en 1713 (Real Cédula de Felipe V tras el fracaso de expediciones punitivas) como "villa libre" — primera comunidad afrodescendiente legalmente autónoma de América. San Basilio mantiene hasta hoy (a) la *lengua palenquera*, único criollo de base léxica española del mundo, con sustrato kikongo/kimbundu — Patrimonio Inmaterial UNESCO 2005; (b) el sistema de *ma-kuagro* (grupos de edad); (c) los *lumbalú* (rituales funerarios); (d) prácticas musicales (bullerengue, champeta de la vieja guardia) que se proyectan hacia toda la costa caribe. La "identidad caribe" colombiana se construye sobre esta matriz.
- **Prerrequisitos:** C2

### C4. Santa Marta, Tayrona y Ciudad Perdida (Teyuna)
- **ID sugerido:** `travel-f2-santa-marta-tayrona`
- **Slug:** `santa-marta-tayrona-teyuna`
- **Definición canónica:** Santa Marta, fundada por Rodrigo de Bastidas el 29 de julio de 1525, es la ciudad española continental más antigua de Sudamérica y la cabeza de puente que lanzó la expedición de Jiménez de Quesada al Altiplano Cundiboyacense (1536–1538). Sobre las laderas de la Sierra se asentaba desde el siglo VIII la cultura Tayrona — federación de cacicazgos con poblados urbanos complejos (Pueblito/Chairama, Buritaca/Teyuna rebautizada "Ciudad Perdida") construidos en terrazas de piedra con escaleras, canales de drenaje y plazas ceremoniales entre los 900 y 1 200 m. Teyuna, fundada hacia el 800 d.C. y abandonada a fines del siglo XVI tras el colapso demográfico por viruela y guerras con los españoles, fue "redescubierta" por guaqueros en 1972 y excavada oficialmente por el ICAN desde 1976. Los actuales pueblos Kogi, Arhuaco (Iku), Wiwa y Kankuamo son descendientes directos de los Tayrona y sostienen una cosmovisión en la que la Sierra es el *corazón del mundo*: la Línea Negra (Resolución 837 de 1995, ampliada por Decreto 1500 de 2018) delimita un perímetro sagrado de 348 sitios alrededor del macizo. En la Quinta de San Pedro Alejandrino, a las afueras de Santa Marta, muere Simón Bolívar el 17 de diciembre de 1830 — después del fracaso de la Gran Colombia — y ese cierre biográfico clausura simbólicamente el ciclo bolivariano que la Fase 1 dejó abierto.
- **Prerrequisitos:** C1, `travel-f1-pueblos-precolombinos` (F1), `travel-f1-independencias` (F1)

### C5. Barranquilla y la apertura fluvial del siglo XIX
- **ID sugerido:** `travel-f2-barranquilla-fluvial`
- **Slug:** `barranquilla-apertura-fluvial-siglo-xix`
- **Definición canónica:** Barranquilla es una anomalía del Caribe hispanoamericano: no es una fundación colonial — no tiene muralla, no tiene fuerte, no tiene cabildo de los Habsburgo — sino un villorrio de pescadores que se convierte en ciudad republicana en el siglo XIX. Entre 1870 y 1930 Barranquilla desplaza económicamente a Cartagena por tres factores convergentes: (a) la habilitación del puerto sobre el Magdalena (1849, Tomás Cipriano de Mosquera) rompe el monopolio cartagenero y convierte a Barranquilla en la boca del río; (b) la llegada de los vapores fluviales (desde 1823, David Hoadley) acorta a 10 días el viaje Barranquilla-Honda que antes tardaba 40; (c) el ferrocarril Bolívar (1871) y el Muelle de Puerto Colombia (1888–1893) permiten la transferencia carga-vapor-marítimo sin roturas. Barranquilla recibe entre 1880 y 1930 una inmigración libanesa, judía, italiana y alemana que construye una elite comercial moderna, funda la primera aviación comercial de América (SCADTA, 1919, hoy Avianca) y consolida una identidad cosmopolita de "puerta de oro" — la base material sobre la que se edifica el Carnaval de Barranquilla (Patrimonio Inmaterial UNESCO 2003), Gabriel García Márquez como periodista de *El Heraldo* y el "Grupo de Barranquilla" (Cepeda Samudio, Fuenmayor, Vargas, Obregón) que redefine la literatura colombiana mid-siglo XX.
- **Prerrequisitos:** C2, `travel-f1-rutas-coloniales` (F1)

### C6. Música caribe: vallenato, cumbia y mestizaje triétnico
- **ID sugerido:** `travel-f2-vallenato-cumbia`
- **Slug:** `vallenato-cumbia-mestizaje-triétnico`
- **Definición canónica:** La música del Caribe colombiano es el caso más claro de síntesis triétnica (indígena + africana + europea) del continente. (a) La *cumbia* —forma madre, siglo XVII-XVIII en la depresión momposina— combina la *gaita* (flauta vertical indígena de los kogi/zenú), el *tambor alegre* y el *llamador* (membranófonos africanos) y la melodía pentatónica reinterpretada a partir de formas europeas; el cortejo danzado con velas es iconográfico del formato. (b) El *vallenato* cristaliza en los valles del río Cesar y La Guajira a fines del siglo XIX cuando el *acordeón diatónico alemán* —llegado vía Riohacha y Curazao— se incorpora a la *caja vallenata* (tambor africano corto) y la *guacharaca* (raspador indígena) formando el trío canónico, y el repertorio se organiza en cuatro "aires" (son, paseo, merengue, puya). Rafael Escalona (1927-2009) lo institucionaliza como literatura oral y el Festival de la Leyenda Vallenata (Valledupar, desde 1968) lo canoniza; García Márquez dijo explícitamente que *Cien años de soledad* era "un vallenato de 400 páginas" y el vallenato entra a UNESCO como Patrimonio Inmaterial en 2015 (en la lista de salvaguardia urgente). (c) La *champeta* de Cartagena y la *terapia* son la capa posterior: música afro-colombiana reurbanizada desde los palenques y los barrios populares de Cartagena a partir de los años 70 con influencia soukous/highlife africano reimportado por los picós (sound-systems). Entender esta estratigrafía musical es entender la matriz cultural caribe real, no la postal turística.
- **Prerrequisitos:** C3, C5

### C7. Tapón del Darién: geología, selva y corredor migratorio
- **ID sugerido:** `travel-f2-darien-tapon`
- **Slug:** `tapon-darien-geología-migración`
- **Definición canónica:** El Darién es el istmo selvático de ~160 km que separa Colombia de Panamá entre el golfo de Urabá y el golfo de San Miguel. Es geológicamente el lugar donde los arcos volcánicos de Centroamérica y Sudamérica se soldaron hace aproximadamente 3 millones de años (Gran Intercambio Biótico Americano), y desde entonces concentra una biodiversidad enorme en un sistema de selvas, ciénagas y montañas bajas (serranía del Baudó, serranía de Darién). La Carretera Panamericana, que en teoría conecta Prudhoe Bay (Alaska) con Ushuaia (Tierra del Fuego) a lo largo de ~48 000 km, tiene aquí su única discontinuidad — el *Tapón del Darién* — preservada intencionalmente por razones sanitarias (fiebre aftosa), ambientales (Parques Nacionales Darién Panamá 1980, UNESCO 1981; Katíos Colombia 1974, UNESCO 1994) y de soberanía. Desde 2021 el Darién es el principal corredor migratorio del hemisferio occidental: el paso anual de migrantes (mayoría venezolanos, ecuatorianos, haitianos, luego africanos y asiáticos) creció de ~8 000 en 2020 a 248 000 en 2022 y un récord de 520 000 en 2023, con ruta Necoclí → Capurganá/Acandí → cruce selvático → Bajo Chiquito/San Vicente → Ciudad de Panamá, bajo control del Clan del Golfo (AGC) en el lado colombiano. El Darién es hoy simultáneamente reserva biológica crítica, frontera interestatal activa y la mayor crisis humanitaria de las Américas — no es un obstáculo pintoresco sino un nodo geopolítico vivo.
- **Prerrequisitos:** C1

### C8. Guna Yala (Kuna): autonomía indígena binacional
- **ID sugerido:** `travel-f2-guna-yala`
- **Slug:** `guna-yala-autonomia-indigena`
- **Definición canónica:** Los *Guna* (antes transliterados *Kuna* o *Cuna*) son el pueblo indígena que habita el archipiélago de San Blas y la franja costera caribe entre el Darién colombiano y el golfo de San Blas panameño — 365 islas de las cuales ~49 están habitadas. Tras la independencia de Panamá (1903) y los intentos panameños de "civilizar" las islas (policía colonial, prohibición de la *mola* y el *saburet*, imposición de escuela hispana), los Guna declararon la *República de Tule* el 21 de febrero de 1925 bajo liderazgo de Nele Kantule y Simral Colman, con bandera propia (esvástica invertida, símbolo solar ancestral). La rebelión terminó con mediación estadounidense (acorazado *Cleveland*) y el Tratado Guna-Panameño de 1938 que reconoció la *Comarca Guna Yala* — primera autonomía indígena constitucionalmente reconocida de América Latina. El gobierno interno funciona con los *Congresos Generales* (Culturales y Políticos) que se reúnen en la *casa del congreso*, toman decisiones por consenso y aplican el derecho propio; el territorio está cerrado a propiedad privada no-guna. En el lado colombiano (municipio de Acandí, Chocó) viven ~2 500 Guna adicionales en los resguardos de Arquía y Caimán Nuevo. El caso Guna es el contraste más claro con el Darién (C7): una autonomía indígena sólida contra un corredor migratorio sin soberanía efectiva — ambos en el mismo bloque continental.
- **Prerrequisitos:** C7, `travel-f1-pueblos-precolombinos` (F1)

---

## Recursos (8)

### R1. Libro — Fronteras imaginadas: la formación de la región Caribe colombiana
- **ID sugerido:** `travel-r-munera-fronteras-caribe`
- **Tipo:** `book`
- **Autor:** Alfonso Múnera Cavadía (Universidad de Cartagena, doctor Connecticut)
- **Publicación:** Editorial Planeta Colombia, Bogotá, 2005 (reed. 2008)
- **URL (archive.org / academia.edu búsqueda):** https://www.academia.edu/search?q=Alfonso%20Munera%20fronteras%20imaginadas
- **URL alternativa (paper que resume tesis):** https://revistas.uniandes.edu.co/index.php/hiscrit/article/view/7493
- **Duración estimada:** ~7h (~260 pp.). Capítulos prioritarios: "La costa y la sierra" + "El Caribe y la construcción del centro" + "Cartagena y el puerto".
- **Idioma:** español
- **Enseña:** C2 Cartagena colonial + C5 Barranquilla (contraste centro-periferia) · **Refuerza:** C1, C3
- **Notas:** Múnera es EL historiador que reformuló la historiografía colombiana mostrando que el Caribe no es folclore periférico sino matriz fundacional — la "nación andina" es una construcción política del siglo XIX que invisibilizó a Cartagena. Lectura obligada. Previamente publicó *El fracaso de la nación* (Banco de la República, 1998) sobre la independencia caribe: si el libro nuevo no se consigue, *El fracaso de la nación* está en Banrepcultural: https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/163

### R2. Paper / Documental — Cartagena, trata atlántica y el asiento de negros
- **ID sugerido:** `travel-r-cartagena-trata-atlantica`
- **Tipo:** `article`
- **Autor/Institución:** Banco de la República de Colombia · Enciclopedia Banrepcultural + artículos académicos Scielo Colombia
- **URL primaria (Banrepcultural, Cartagena puerto negrero):** https://enciclopedia.banrepcultural.org/index.php/Cartagena_como_puerto_negrero
- **URL secundaria (paper Scielo, Nicolás del Castillo Mathieu):** https://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0120-24562008000100004
- **URL terciaria (artículo Credencial Historia, BanRep):** https://www.banrepcultural.org/biblioteca-virtual/credencial-historia/numero-120/esclavos-en-la-nueva-granada
- **Duración estimada:** ~3h (tres piezas cruzadas)
- **Idioma:** español
- **Enseña:** C2 (Cartagena esclavista) + C3 (punto de partida del cimarronaje) · **Refuerza:** `travel-f1-virreinatos` (F1)
- **Notas:** Banrepcultural es la fuente académica estatal de referencia colombiana. Tres piezas complementarias: panorámica + paper con cifras (ingresos por año, trayectorias de navíos) + divulgación cualificada. Complemento audiovisual opcional: documental Señal Colombia *Las rutas de los esclavizados* (verificar disponibilidad en RTVC Play).

### R3. Libro — Benkos Biohó y San Basilio de Palenque
- **ID sugerido:** `travel-r-palenque-biohó`
- **Tipo:** `book`
- **Autor:** Nina S. de Friedemann (antropóloga, 1930–1998) + Richard Cross (fotografía)
- **Publicación:** *Ma Ngombe: guerreros y ganaderos en Palenque* (Carlos Valencia Editores, Bogotá, 1979; reed. Universidad de los Andes)
- **URL (archive.org / Banrepcultural, Biblioteca Luis Ángel Arango):** https://babel.banrepcultural.org/digital/collection/p17054coll10/search/searchterm/Nina%20Friedemann
- **URL alternativa (paper Friedemann sobre lengua palenquera):** https://publicaciones.banrepcultural.org/index.php/boletin_cultural/article/view/3003
- **URL complementaria (UNESCO, declaratoria 2005):** https://ich.unesco.org/es/RL/el-espacio-cultural-de-san-basilio-de-palenque-00102
- **Duración estimada:** ~5h
- **Idioma:** español
- **Enseña:** C3 palenque y cimarronaje · **Refuerza:** C2, C6 (matriz afro de la música caribe)
- **Notas:** `[revisar]` Friedemann es la antropóloga fundadora de los estudios afro-colombianos. Si *Ma Ngombe* no está accesible en digital, sustituir por su *De sol a sol: génesis, transformación y presencia de los negros en Colombia* (Planeta, 1986). Complemento opcional: documental María Raquel Bozzi *Palenque: un canto* o el capítulo correspondiente en la serie de la UNESCO.

### R4. Documental — Ciudad Perdida (Teyuna) y la Sierra Nevada
- **ID sugerido:** `travel-r-teyuna-sierra-nevada`
- **Tipo:** `video`
- **Autor/Canal:** Señal Memoria / Señal Colombia (RTVC) — documentales sobre la Sierra Nevada
- **URL primaria (Señal Memoria, documental Kogi):** https://www.senalmemoria.co/articulos/los-hermanos-mayores-kogui-documental
- **URL secundaria (Aluna, dir. Alan Ereira 2012):** https://www.youtube.com/watch?v=hQnoTmLp_gE
- **URL académica complementaria (ICANH, informe Teyuna):** https://www.icanh.gov.co/recursos_user/icanh_portal/parque_teyuna_ciudad_perdida.pdf
- **Duración estimada:** 90 min (Aluna) + 45 min (Señal Memoria) + lectura 1h informe ICANH = ~3h
- **Idioma:** español
- **Enseña:** C4 Santa Marta, Tayrona, Teyuna · **Refuerza:** C1 (Sierra), `travel-f1-pueblos-precolombinos` (F1)
- **Notas:** *Aluna* (Ereira, 2012) es la continuación de *From the Heart of the World: The Elder Brothers' Warning* (BBC, 1990) — los Kogi aceptan por segunda vez romper su aislamiento para enviar un mensaje al "hermano menor". Es la referencia audiovisual canónica. El informe ICANH es el estudio arqueológico oficial del parque.

### R5. Artículo / Libro — García Márquez, Macondo y el Caribe como literatura
- **ID sugerido:** `travel-r-gabo-macondo-caribe`
- **Tipo:** `book`
- **Autor:** Gerald Martin, *Gabriel García Márquez: una vida* (Debate, 2009) + Gabriel García Márquez, *Vivir para contarla* (Mondadori, 2002)
- **URL primaria (Vivir para contarla, archive.org):** https://archive.org/details/garcia-marquez-gabriel.-vivir-para-contarla-ocr-2002
- **URL secundaria (Martin, biografía oficial, capítulos):** https://archive.org/details/gerald-martin-gabriel-garcia-marquez-una-vida
- **URL complementaria (entrevista Plinio Apuleyo Mendoza, *El olor de la guayaba*):** https://archive.org/details/el-olor-de-la-guayaba
- **Duración estimada:** ~10h (leer primeros 4 caps de *Vivir para contarla* sobre Aracataca + caps Martin sobre formación caribeña). No es obligatorio leer *Cien años de soledad* entera para la fase, pero sí haberla leído antes para el track.
- **Idioma:** español
- **Enseña:** C5 (Barranquilla literaria) + C6 (vallenato como matriz narrativa) · **Refuerza:** C3
- **Notas:** Gabo es el lente estético por el cual el Caribe colombiano se universaliza. *Vivir para contarla* es la entrada más honesta a Aracataca, al viaje fundacional Barranquilla-Aracataca con su madre, al Grupo de Barranquilla y a los años del *Heraldo*. La biografía de Martin es la contraparte crítica.

### R6. Documental — Vallenato y la tradición del acordeón
- **ID sugerido:** `travel-r-vallenato-documental`
- **Tipo:** `video`
- **Autor/Canal:** Señal Colombia / Señal Memoria + UNESCO (serie sobre Patrimonio Inmaterial)
- **URL primaria (Señal Memoria, serie vallenato):** https://www.senalmemoria.co/articulos/vallenato-patrimonio-humanidad-unesco
- **URL secundaria (UNESCO, Salvaguardia urgente 2015):** https://ich.unesco.org/es/USL/la-musica-vallenata-tradicional-del-magdalena-grande-01095
- **URL terciaria (documental *El acordeón del diablo*, Stefan Schwietert 2000, link verificar):** https://www.youtube.com/results?search_query=el+acordeon+del+diablo+schwietert
- **Duración estimada:** ~2.5h
- **Idioma:** español
- **Enseña:** C6 vallenato · **Refuerza:** C3 (matriz afro), C5 (Barranquilla como ciudad de difusión)
- **Notas:** `[revisar]` *El acordeón del diablo* es el documental europeo canónico sobre la tradición (sigue a Pacho Rada); verificar disponibilidad. Plan B: material de Señal Memoria + capítulos del Festival de la Leyenda Vallenata archivados.

### R7. Reportaje de investigación — Tapón del Darién: crisis migratoria y ambiental
- **ID sugerido:** `travel-r-darien-migracion`
- **Tipo:** `article`
- **Autor/medio:** Mongabay Latam (ambiental) + International Crisis Group (geopolítica migratoria) + El País América
- **URL primaria (Mongabay, Darién selva y megaproyectos):** https://es.mongabay.com/2023/11/selva-del-darien-migrantes-cambian-ecosistemas/
- **URL secundaria (ICG, Informe 2023 "Hard Times in a Safe Haven"):** https://www.crisisgroup.org/es/latin-america-caribbean/andes/colombia/098-hard-times-safe-haven-protecting-venezuelan-migrants-colombia
- **URL terciaria (El País, serie Darién):** https://elpais.com/america-colombia/2024-02-21/asi-es-el-infierno-selvatico-del-tapon-del-darien-entre-colombia-y-panama.html
- **URL geológica (INVEMAR / Parques Nacionales Katíos):** https://runap.parquesnacionales.gov.co/area-protegida/38
- **Duración estimada:** ~3h
- **Idioma:** español
- **Enseña:** C7 Tapón del Darién · **Refuerza:** `travel-f1-divergencia-poscolonial` (F1 — migración como fenómeno estructural)
- **Notas:** Mongabay cubre el eje ambiental (deforestación, impacto sobre Katíos), ICG el eje político (Clan del Golfo, gobernanza), El País el testimonial. El parque nacional Katíos fue UNESCO 1994 y entró en la Lista de Patrimonio en Peligro 2009–2015 por tala ilegal. No usar reportajes sensacionalistas de YouTube sin fuente verificada.

### R8. Libro / Documental — Guna Yala: revolución de 1925 y autonomía
- **ID sugerido:** `travel-r-guna-yala-autonomia`
- **Tipo:** `book`
- **Autor:** James Howe (MIT, antropólogo) — *Un pueblo que no se arrodillaba: Panamá, Estados Unidos y los Kunas de San Blas* (Plumsock Mesoamerican Studies / CIRMA, 2004; original inglés 1998)
- **URL primaria (Smithsonian Libraries / búsqueda):** https://www.sil.si.edu/smithsoniancontributions/Anthropology/
- **URL secundaria (paper sobre revolución Tule 1925, Dialnet / JSTOR):** https://www.jstor.org/stable/25675790
- **URL terciaria (documental *Tule: la revolución olvidada* Señal Panamá / SERTV):** https://www.youtube.com/results?search_query=revolucion+tule+1925+documental
- **URL complementaria (Congreso General Guna, sitio oficial):** https://www.gunayala.org.pa/
- **Duración estimada:** ~6h (caps Howe sobre 1925–1938) + 1h documental
- **Idioma:** español
- **Enseña:** C8 Guna Yala · **Refuerza:** C7 (contraste con el Darién sin gobernanza)
- **Notas:** `[revisar]` El libro de Howe es la referencia académica en español — si no se consigue digital, usar *Nan Garburred: una historia de los kunas* de Aiban Wagua (guna, educador, Congreso General Kuna, 2007) como alternativa desde la voz interna del pueblo. Para arte *mola* y resistencia cultural: colección digital del Museo Smithsonian (NMAI) y catálogo Museo Antropológico Reina Torres de Araúz (Panamá).

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Múnera Fronteras | C2, C5 | — |
| R2 Cartagena trata | C2, C3 | — |
| R3 Friedemann Palenque | C3 | — |
| R4 Teyuna / Aluna | C4 | — |
| R5 Gabo + Martin | C5 | C6 (refuerzo simbólico) |
| R6 Vallenato documental | C6 | — |
| R7 Darién Mongabay+ICG | C7 | — |
| R8 Howe Guna Yala | C8 | — |

**Cobertura:** C1 queda cubierto parcialmente por R4 (la Sierra en contexto Tayrona). Si hace falta reforzarlo dedicadamente, sumar R9: artículo IGAC/INVEMAR sobre geología Sierra Nevada. **Cross-phase prereqs F1:** `travel-f1-geografia-fisica`, `travel-f1-pueblos-precolombinos`, `travel-f1-virreinatos`, `travel-f1-potosi`, `travel-f1-rutas-coloniales`, `travel-f1-independencias`, `travel-f1-divergencia-poscolonial`.

---

## DAG pedagógico

```
(F1: geografia-fisica, pueblos-precolombinos)
        │
        ▼
      C1 (Caribe + Sierra Nevada)
        │
        ├─► C4 (Santa Marta, Tayrona, Teyuna) ◄── (F1: independencias)
        │
        ├─► C2 (Cartagena colonial) ◄── (F1: virreinatos, potosi, rutas)
        │       │
        │       ├─► C3 (Palenque / cimarronaje)
        │       │       │
        │       │       └─► C6 (vallenato / cumbia / mestizaje)
        │       │
        │       └─► C5 (Barranquilla / apertura fluvial)
        │               │
        │               └─► C6
        │
        └─► C7 (Tapón del Darién)
                │
                └─► C8 (Guna Yala) ◄── (F1: pueblos-precolombinos)
```

Orden de estudio recomendado: **C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8**. El orden coincide con el recorrido físico Cartagena → Barranquilla → Santa Marta → Tayrona → Taganga → Montería → Turbo → Capurganá → Guna Yala.

---

## Cosas a validar antes de seedear

1. **R3 Friedemann Palenque**: confirmar acceso digital a *Ma Ngombe*. Plan B definido arriba.
2. **R6 vallenato**: verificar disponibilidad de *El acordeón del diablo*. Plan B: material Señal Memoria.
3. **R8 Howe**: confirmar acceso al libro. Plan B: Wagua (voz interna) + paper JSTOR.
4. **C1 sin recurso dedicado**: evaluar si sumar R9 sobre geología Sierra Nevada (IGAC, paper Scielo sobre el macizo) o dejarlo cubierto por R4.
5. **Tipos de recurso**: R2 y R7 son collages de varias URLs; decidir si se ingestan como múltiples recursos o como uno solo con `resource_page_range` extendido.
6. **Integración con pipeline**: R1, R3, R5, R8 son PDFs largos — segmentar por capítulos. R4, R6 son videos pipeline estándar. R2, R7 son artículos web.

---

## Próximos pasos del coordinator

- [ ] Resolver los 3 `[revisar]` (R3, R6, R8) antes del seed
- [ ] Cross-check con F1: todos los prereqs existen en el seed de F1
- [ ] Actualizar `PROGRESS.md` con el cierre del brief F2
- [ ] Empezar F3 (Colombia Andina Norte: Medellín, Eje Cafetero, Cali)

