# Fase 10 — Chile (sur a norte) · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 10 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed. Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='10'`.

**Para el coordinator:** 8 conceptos, 8 recursos. URLs verificadas el 2026-04-22. El orden de la fase es sur->norte porque el usuario entra desde Patagonia argentina (Punta Arenas es la primera parada, con Unimarc y taller de moto). La fase termina en San Pedro de Atacama y empalma con F11 por el noroeste argentino (Antofagasta de la Sierra -> Catamarca).

---

## Objetivo de la fase

Leer Chile en clave longitudinal: entender por qué un país de 4.300 km de norte a sur pero menos de 200 km de este a oeste tiene tantas "economías regionales" superpuestas (ganadería lanera austral, bosque valdiviano, valle central agrícola, minería del salitre y cobre). Al terminar, el usuario debería poder explicar: por qué Chile tiene el sismo más grande jamás registrado, por qué Bolivia perdió el mar, por qué los Chicago Boys hicieron de Chile el primer laboratorio neoliberal del mundo, y por qué el conflicto mapuche no es folklore sino una continuidad política de 150 años.

---

## Conceptos (8)

### C1. Patagonia chilena y pueblos canoeros
- **ID sugerido:** `travel-f10-patagonia-canoeros`
- **Slug:** `patagonia-chilena-pueblos-canoeros`
- **Definición canónica:** Los archipiélagos del extremo sur chileno fueron habitados durante más de 6.000 años por pueblos canoeros — kawésqar (alacalufes) y yagán (yámana) en los canales fueguinos, selk'nam terrestres en Tierra del Fuego — adaptados al clima subantártico con tecnología marina muy anterior a cualquier contacto europeo. Entre 1880 y 1910 estos pueblos fueron virtualmente exterminados por una combinación de enfermedades, misiones anglicanas y salesianas, y cacería sistemática por parte de estancieros laneros que pagaban por oreja selk'nam. La categoría "último confín de la tierra" (Bridges) es el marcador literario canónico de este mundo y su destrucción.
- **Prerrequisitos:** F1-C2 (pueblos precolombinos continentales)

### C2. Puerto Natales, Torres del Paine y ganadería lanera
- **ID sugerido:** `travel-f10-patagonia-lanera`
- **Slug:** `patagonia-lanera-torres-del-paine`
- **Definición canónica:** El macizo del Paine es un laccolito granítico de ~12,5 millones de años intrusionado en rocas sedimentarias cretácicas, esculpido por los glaciares del último máximo glacial (17.000 a 12.000 años atrás) que le dieron sus torres, cuernos y lagos proglaciares (Grey, Pehoé). Sobre ese paisaje, a fines del siglo XIX, se monta una economía lanera basada en latifundios — la Sociedad Explotadora de Tierra del Fuego controlaba millones de hectáreas — que fue el escenario de las huelgas patagónicas chilenas de 1920-21, contemporáneas y menos recordadas que las argentinas del lado oriental.
- **Prerrequisitos:** C1, F1-C1 (geografía física)

### C3. Chiloé y el archipiélago del sur hispanohablante
- **ID sugerido:** `travel-f10-chiloe`
- **Slug:** `chiloe-archipielago-sur`
- **Definición canónica:** Chiloé fue la última posesión española en Sudamérica en caer (1826, catorce años después de la independencia del Chile continental) por su condición insular y su lealtad a la corona. Su aislamiento produjo una cultura mestiza particular: iglesias de madera construidas sin un solo clavo por carpinteros chilotes sobre plantillas jesuíticas (16 de ellas Patrimonio UNESCO desde 2000), mitología propia (Trauco, Caleuche, Pincoya) que sincretiza creencias huilliches y españolas, y una economía basada en papa (más de 400 variedades nativas), pesca artesanal y emigración estacional. Chiloé es el "punto cero" cultural entre la zona central chilena y la Patagonia austral.
- **Prerrequisitos:** F1-C3 (virreinatos: acá mostró sus límites)

### C4. Mapuche y la Araucanía: frontera hasta 1881
- **ID sugerido:** `travel-f10-mapuche-araucania`
- **Slug:** `mapuche-araucania-frontera`
- **Definición canónica:** Los mapuche (o reche) resistieron tanto al imperio inca (frontera natural del Tawantinsuyu sobre el río Maule) como al imperio español durante tres siglos, manteniendo territorio autónomo al sur del Biobío mediante el sistema de parlamentos (tratados reconocidos por la corona). Solo tras la independencia, entre 1861 y 1883, el Estado chileno emprende la "Pacificación de la Araucanía" — eufemismo para ocupación militar, reducción a comunidades y remate de tierras a colonos europeos. El conflicto actual (CAM, Coordinadora Arauco Malleco; Temucuicui; reclamos territoriales 2020-2025) es la continuación histórica de esa ruptura y su contemporaneidad con la Conquista del Desierto argentina no es casualidad.
- **Prerrequisitos:** F1-C2, C3

### C5. Valdivia y el terremoto de 1960
- **ID sugerido:** `travel-f10-valdivia-terremoto`
- **Slug:** `valdivia-terremoto-1960`
- **Definición canónica:** Valdivia fue fundada en 1552 por Pedro de Valdivia como plaza militar clave para el control del Pacífico sur; su sistema de fuertes (Corral, Niebla, Mancera) la convirtió en la llave defensiva del imperio español hasta que los corsarios holandeses la tomaron brevemente en 1643. El 22 de mayo de 1960 sufrió el mayor terremoto instrumentalmente registrado en la historia de la humanidad: 9,5 Mw, liberando ~25% de la energía sísmica global del siglo XX, con tsunami que cruzó el Pacífico y causó víctimas en Japón, Hawái y Filipinas. El evento es el caso canónico mundial para estudiar subducción de la placa de Nazca y riesgo sísmico interplaca, y reconfiguró Valdivia física y demográficamente.
- **Prerrequisitos:** F1-C1, F1-C3

### C6. Santiago, Allende, Pinochet y el "modelo chileno"
- **ID sugerido:** `travel-f10-santiago-modelo-chileno`
- **Slug:** `santiago-allende-pinochet-modelo`
- **Definición canónica:** El valle central (Santiago, Rancagua, Talca) concentra desde el siglo XVI la población y la agricultura chilenas, y desde 1880 la industria y el aparato estatal. La elección de Salvador Allende en 1970 (primera vez en el mundo que un marxista llega al poder por vía electoral) y el golpe de Pinochet del 11 de septiembre de 1973 convirtieron a Chile en el primer laboratorio neoliberal del planeta: los Chicago Boys, formados por Milton Friedman en la U. de Chicago vía el "proyecto Chile" de los 50s, aplicaron desde 1975 privatizaciones, apertura comercial, sistema de AFP y retiro del Estado en un régimen de terror que produjo 3.200 muertos/desaparecidos y ~40.000 torturados (Informe Rettig, Informe Valech). Plebiscito 1988, transición "pactada", y 30 años después el estallido social de octubre 2019 abre la ventana del proceso constituyente fallido 2022 (rechazo 62%) que reinstala la discusión pendiente sobre ese modelo.
- **Prerrequisitos:** C3, C4, F1-C8

### C7. Atacama, salitre, cobre y la Guerra del Pacífico
- **ID sugerido:** `travel-f10-atacama-salitre-cobre`
- **Slug:** `atacama-salitre-cobre-guerra-pacifico`
- **Definición canónica:** El desierto de Atacama — el más árido del mundo, producto combinado de la corriente fría de Humboldt, el anticiclón subtropical del Pacífico y la sombra orográfica andina — fue durante el siglo XIX boliviano y peruano. La extracción del salitre (fertilizante y precursor de explosivos) a partir de 1860 generó una economía dirigida por capitales ingleses y chilenos en territorio ajeno; el intento boliviano de subir impuestos a la Compañía de Salitres de Antofagasta en 1878 desencadenó la Guerra del Pacífico (1879-1884), que dejó a Bolivia sin mar, a Perú sin Tarapacá y a Chile con el 40% del territorio actual. El ciclo del salitre colapsa con la síntesis Haber-Bosch (1913) y es reemplazado por el cobre: Chuquicamata (1915, Anaconda/Kennecott) se nacionaliza con Allende en 1971 y Codelco pasa a financiar una parte sustancial del Estado chileno hasta hoy.
- **Prerrequisitos:** F1-C1, F1-C4

### C8. San Pedro, patrimonio atacameño y Valparaíso
- **ID sugerido:** `travel-f10-atacama-valparaiso`
- **Slug:** `san-pedro-atacama-valparaiso`
- **Definición canónica:** Cierre de fase en dos puertos simbólicos. (a) San Pedro de Atacama es el oasis central del pueblo likan antai (atacameños), con ocupación continua desde hace ~11.000 años: Aldea de Tulor (circular, 800 a.C.), Pukará de Quitor (fortaleza del siglo XII tomada por Pedro de Valdivia en 1540), y hoy comunidades que disputan con Codelco y SQM el litio del Salar de Atacama. (b) Valparaíso fue el puerto más importante del Pacífico sur entre 1880 y 1914: apogeo económico cuando todo barco que iba de Europa a California pasaba por el Estrecho de Magallanes; la apertura del Canal de Panamá en 1914 lo mató comercialmente pero preservó su trama urbana de cerros, ascensores y arquitectura inmigrante (alemana, inglesa, italiana, croata) que la UNESCO declaró Patrimonio en 2003. Valparaíso es la contracara civil del Santiago oligárquico.
- **Prerrequisitos:** C6, C7

---

## Recursos (8)

### R1. Libro — El último confín de la Tierra
- **ID sugerido:** `travel-r-bridges-confin-tierra`
- **Tipo:** `book`
- **Autor:** E. Lucas Bridges (1948, ed. 1952)
- **URL (archive.org, open access):** https://archive.org/details/lucas-bridges-e.-el-ultimo-confin-de-la-tierra-ocr-1952
- **Idioma:** español (traducción del inglés)
- **Capítulos a leer:** Prólogo + Parte I (familia Bridges y fundación de Ushuaia) + capítulos sobre los selk'nam y yagán. Total: ~200 páginas seleccionadas.
- **Enseña:** C1 pueblos canoeros · **Refuerza:** C2 (contexto lanero), F1-C2
- **Notas:** Testimonio etnográfico de primera mano — Bridges creció entre selk'nam como hijo del misionero anglicano fundador de Ushuaia (1826). Libro canónico; leer con crítica poscolonial (revisión de Anne Chapman).

### R2. Documental — El botón de nácar (Patricio Guzmán, 2015)
- **ID sugerido:** `travel-r-boton-nacar`
- **Tipo:** `video`
- **Autor/Canal:** Patricio Guzmán
- **URL:** https://www.youtube.com/watch?v=SgLZUwqcHDQ
- **URL alternativa:** https://www.youtube.com/watch?v=Z5Kag8T7vUE
- **Duración estimada:** ~82 min
- **Idioma:** español
- **Enseña:** C1 (pueblos canoeros, Jemmy Button) · **Refuerza:** C6 (hace el vínculo con desaparecidos del Pinochetato a través del agua)
- **Notas:** Oso de Plata Berlín 2015. Segunda parte de la trilogía sobre Chile de Guzmán (Nostalgia de la luz -> El botón de nácar -> La cordillera de los sueños). Verificar URL primaria antes de seed; la alternativa sirve de respaldo.

### R3. Artículo — Ocupación militar y colonización de la Araucanía (1851-1883)
- **ID sugerido:** `travel-r-araucania-memoria-chilena`
- **Tipo:** `article`
- **Autor/Institución:** Memoria Chilena · Biblioteca Nacional de Chile
- **URL:** https://www.memoriachilena.gob.cl/602/w3-article-3630.html
- **Idioma:** español
- **Enseña:** C4 mapuche/Araucanía · **Refuerza:** C6 (consolidación del Estado chileno post-1880)
- **Notas:** Memoria Chilena es el portal académico de la Biblioteca Nacional — fuente primaria y análisis historiográfico en el mismo sitio. Complementar con la entrada paralela "El movimiento mapuche y el Estado en el siglo XX" (https://www.memoriachilena.gob.cl/602/w3-article-602.html) para traer el hilo hasta hoy.

### R4. Documental — La Batalla de Chile, Parte II: El golpe de Estado (Patricio Guzmán, 1977)
- **ID sugerido:** `travel-r-batalla-chile-golpe`
- **Tipo:** `video`
- **Autor/Canal:** Patricio Guzmán · Equipo Tercer Año
- **URL:** https://www.youtube.com/watch?v=9b_gXhnZDEU
- **Duración estimada:** ~90 min
- **Idioma:** español
- **Enseña:** C6 Allende/Pinochet · **Refuerza:** F1-C8 (divergencia poscolonial)
- **Notas:** Segunda parte de la trilogía *La Batalla de Chile* (1975-79), filmada en tiempo real durante el gobierno de la Unidad Popular. Considerada la mejor película documental política del siglo XX. La Parte I (https://www.youtube.com/watch?v=kUHsggUO0i4) es precuela opcional si el usuario tiene tiempo.

### R5. Artículo — Chicago Boys en Chile: neoliberalismo, saber experto y el auge de una nueva tecnocracia
- **ID sugerido:** `travel-r-chicago-boys-paper`
- **Tipo:** `article`
- **Autor/Revista:** Revista Mexicana de Ciencias Políticas y Sociales (UNAM) · SciELO
- **URL:** https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0185-19182019000100139
- **Idioma:** español
- **Enseña:** C6 (neoliberalismo Pinochet) · **Refuerza:** C7 (nacionalización/privatización cobre)
- **Notas:** Paper académico indexado en SciELO, acceso abierto. Opción superior al documental *Chicago Boys* (Fuentes/Valdeavellano, 2015) porque está garantizado libre. Si el usuario consigue el documental completo en Filmin/Vimeo, sumarlo como recurso audiovisual paralelo.

### R6. Libro — Canto General (fragmentos: "Alturas de Macchu Picchu" + "La tierra se llama Juan")
- **ID sugerido:** `travel-r-neruda-canto-general`
- **Tipo:** `book`
- **Autor:** Pablo Neruda (1950)
- **URL (archive.org):** https://archive.org/details/PabloNerudaCantoGeneral
- **Idioma:** español
- **Capítulos a leer:** "Alturas de Macchu Picchu" (12 poemas, ~30 páginas) + "La tierra se llama Juan" (retratos obreros salitreros y mineros) + "Que despierte el leñador". Total: ~100 páginas.
- **Enseña:** C7 (salitre y cobre desde la voz obrera) · **Refuerza:** C1, C6
- **Notas:** Neruda es el ángulo estético-político del track: escribió Canto General en clandestinidad huyendo de González Videla en 1948-49. "La tierra se llama Juan" es el contrapunto literario exacto del paper de Memoria Chilena sobre el salitre.

### R7. Documental — La tragedia de Valdivia: 60 años del gran terremoto
- **ID sugerido:** `travel-r-valdivia-60-anos`
- **Tipo:** `video`
- **Autor/Canal:** TVN Chile · Reportajes (2020, aniversario 60)
- **URL:** https://www.youtube.com/watch?v=r0NBGNwLHzw
- **URL alternativa:** https://www.youtube.com/watch?v=HB7xZVWhwnI ("Valdivia 1960, el gran terremoto")
- **Duración estimada:** 30-45 min
- **Idioma:** español
- **Enseña:** C5 terremoto 1960 · **Refuerza:** F1-C1 (subducción Nazca)
- **Notas:** Testimonios de sobrevivientes y reconstrucción científica. Para profundidad adicional complementar con artículo de Cooperativa Ciencia (aniversario 65, 2025): https://www.cooperativaciencia.cl/tendencias/2025/05/22/terremoto-de-valdivia-1960-las-lecciones-del-sismo-de-9-5-que-marco-la-historia-de-chile/

### R8. Artículo — Licán Antai (atacameños) + paper Estudios Atacameños
- **ID sugerido:** `travel-r-likan-antai`
- **Tipo:** `article`
- **Autor/Institución:** Memoria Chilena (Biblioteca Nacional de Chile) + revista *Estudios Atacameños* (Universidad Católica del Norte)
- **URL primaria (panorámica):** https://www.memoriachilena.gob.cl/602/w3-article-722.html
- **URL secundaria (paper académico sobre arquitectura tradicional):** https://estudiosatacamenos.ucn.cl/index.php/estudios-atacamenos/article/view/3747
- **Idioma:** español
- **Enseña:** C8 (patrimonio atacameño) · **Refuerza:** C7, F1-C2
- **Notas:** Estudios Atacameños es la revista académica de referencia para arqueología/etnohistoria del norte chileno. El paper sobre vivienda tradicional en Ayquina, Caspana y Toconce conecta patrimonio con el conflicto contemporáneo por agua y litio en el Salar.

---

## Mapeo concepto <-> recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Bridges Confín | C1 | — |
| R2 Botón de nácar | C1 | C6 (refuerzo simbólico) |
| R3 Araucanía Memoria Chilena | C4 | — |
| R4 Batalla de Chile II | C6 | — |
| R5 Chicago Boys paper | C6 | — |
| R6 Canto General | C7 | C6 (sensibilidad obrera) |
| R7 Valdivia 60 años | C5 | — |
| R8 Likan Antai | C8 | — |

Prerrequisitos concepto-concepto ya expresados en cada card; se traducen a filas de `concept_prerequisites`. **Cross-phase:** C1->F1-C2, C2->F1-C1, C3->F1-C3, C4->F1-C2/C3, C5->F1-C1/C3, C6->F1-C8, C7->F1-C1/C4.

---

## Horas estimadas y DAG pedagógico

- **Total estimado:** ~28 h (lecturas densas Halperín-style + 4 videos largos).
- **Orden sugerido del DAG:**
  1. C1 (pueblos canoeros) + C2 (geología y lana) — base física y humana del sur.
  2. C3 (Chiloé) — transición cultural.
  3. C4 (mapuche) — conflicto fundacional.
  4. C5 (Valdivia-terremoto) — punto geofísico intermedio.
  5. C6 (Santiago/Allende/Pinochet) — nudo político del siglo XX.
  6. C7 (Atacama y Guerra del Pacífico) — eje económico norte.
  7. C8 (San Pedro + Valparaíso) — cierre y empalme con F11.

---

## Cosas a validar antes de seedear

1. **R2 URL primaria** (El botón de nácar): verificar vigencia; si falla, usar alternativa Z5Kag8T7vUE.
2. **R4 La Batalla de Chile II:** considerar sumar Parte I y III como recursos opcionales o dejar solo la Parte II como crítica.
3. **R1 Bridges:** el libro es ~500 páginas; decidir rango de páginas exacto para `resource_page_range`.
4. **Nostalgia de la luz (Guzmán 2010):** quedó fuera del set final por overlap con R2, pero sumable como R9 si hay bandwidth (conecta astronomía de Atacama con desaparecidos, puente perfecto C6-C7).
5. **Chicago Boys documental:** si se consigue versión legal completa (Filmin/Vimeo), sumarlo como video refuerzo además del paper R5.
