# Fase 3 — Colombia Andina Norte · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 3 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed. Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='3'`.

**Para el coordinator:** corredor Medellín → Santa Fe de Antioquia → Eje Cafetero (Manizales/Pereira/Armenia/Salento) → Cali. La fase tiene que articular cuatro ejes: (a) la *colonización antioqueña* del siglo XIX como el experimento sociohistórico que produjo la Colombia cafetera y el "paisa" como identidad moderna; (b) Medellín y su arco Violencia bipartidista → narcotráfico Escobar → "modelo Medellín" (urbanismo social) como laboratorio político-urbano contemporáneo; (c) el *Eje Cafetero* y la cultura del café — mercado mundial, Federación, Paisaje Cultural Cafetero UNESCO — como matriz económica nacional; (d) Cali y el Valle del Cauca como contrapunto afro-caribeño de la caña, la hacienda y la salsa. En el medio: el Bogotazo (1948) y la Violencia como arranque del conflicto armado, Quimbaya orfebrería pre-colombina, y Armero 1985 (volcán Nevado del Ruiz) como cicatriz nacional. 8 conceptos, 8 recursos, URLs verificadas 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué el "paisa" (antioqueño-caldense-quindiano-risaraldense) es una identidad construida en el siglo XIX y no una herencia colonial estática, cómo la *colonización antioqueña* (1780–1910) produjo la estructura de pequeña propiedad cafetera que diferencia al Eje Cafetero del resto del agro colombiano, por qué Medellín fue la ciudad industrial de Colombia (textil, metalurgia) antes de convertirse en capital del narcotráfico mundial en los años 80 y cómo logró salir de ese hoyo con Sergio Fajardo (2004–2007) y la política de "urbanismo social" (Metrocable, bibliotecas España/La Ladera, intervención Comuna 13), por qué el asesinato de Jorge Eliécer Gaitán el 9 de abril de 1948 inaugura La Violencia bipartidista y por qué ese período 1948–1958 es el germen del conflicto armado colombiano del siglo XX, qué es el Paisaje Cultural Cafetero (UNESCO 2011) y por qué el café es simultáneamente economía, geografía y política, cómo el Valle del Cauca construye una modernidad agroindustrial de caña sobre haciendas esclavistas y por qué Cali es la "capital mundial de la salsa" desde los años 70, y qué significó la tragedia de Armero el 13 de noviembre de 1985 — 25 000 muertos por lahar del Nevado del Ruiz — como el desastre natural más letal de la historia colombiana y el caso canónico mundial de falla comunicacional ante riesgo volcánico conocido.

---

## Conceptos (8)

### C1. Colonización antioqueña y configuración del paisa
- **ID sugerido:** `travel-f3-colonizacion-antioquena`
- **Slug:** `colonizacion-antioquena-identidad-paisa`
- **Definición canónica:** Entre fines del siglo XVIII y principios del XX (~1780–1910), campesinos de Antioquia mineral y montañosa —agotada la minería aurífera, con alta presión demográfica en valles estrechos— se expanden hacia el sur por las vertientes de la cordillera Central abriendo con hacha y machete tierras baldías que se convierten en municipios: Sonsón (1789), Abejorral, Aguadas, Manizales (1849), Salamina, Pácora, Pereira (1863), Armenia (1889), Sevilla, Calarcá, y en la vertiente occidental Jericó, Andes, Ciudad Bolívar, Caramanta. Es la *colonización antioqueña*. A diferencia de la hacienda caribe o caucana, el modelo productivo que se instala es el *minifundio familiar* — baldíos adjudicados a familias que trabajan la tierra con mano de obra propia, sin esclavos ni peonaje, con cultivo mixto (maíz, fríjol, plátano, caña de azúcar de panela, ganadería menor y café creciente). El efecto sociológico es profundo: la estructura de propiedad pequeña, la endogamia regional, el catolicismo militante y el arriero-comerciante como figura central configuran una identidad — *el paisa* — distinta de la "gente de la sabana" bogotana y del Caribe costeño. Este arreglo produce también una demografía: el *"whiteness"* regional (lecturas de Nancy Appelbaum) construida sobre la invisibilización de indígenas y afrodescendientes en la región. La colonización antioqueña es el fundamento social del café, del conflicto por la tierra (muchas colonizaciones entran en disputa con títulos de propietarios ausentes, origen de las guerras de Quindío 1900–1920) y de la identidad cultural que hoy exporta el Eje Cafetero.
- **Prerrequisitos:** `travel-f1-virreinatos` (F1), `travel-f1-rutas-coloniales` (F1)

### C2. Medellín industrial, narcotráfico y urbanismo social
- **ID sugerido:** `travel-f3-medellin-arco`
- **Slug:** `medellin-industria-narco-urbanismo`
- **Definición canónica:** Medellín (fundada 1675 en el Valle de Aburrá, capital de Antioquia desde 1826) sigue un arco en tres fases que la distinguen de cualquier otra ciudad colombiana. (a) *Ciudad industrial* (1905–1980): entre Coltejer (1907), Fabricato (1920), Postobón, Bavaria, los almacenes Éxito (Toro, 1949) y la Universidad de Antioquia modernizada, Medellín se convierte en la ciudad industrial textil-metalúrgica más importante de Colombia y en sede de la más sofisticada burguesía católica del país — el "modelo paisa" de empresariado con Ethos de trabajo, patronato y redes familiares. (b) *Capital mundial del narcotráfico* (1975–1993): el Cartel de Medellín liderado por Pablo Escobar Gaviria (Rionegro, 1949 – Medellín, 1993) construye la primera red transnacional de cocaína a gran escala, captura el Estado (asesinato del ministro Rodrigo Lara Bonilla 1984, magnicidios Galán 1989, Pizarro y Jaramillo Ossa 1990, atentado Avianca 203 y DAS 1989), convierte a Medellín en la ciudad con mayor tasa de homicidios del mundo (381 por cada 100 000 habitantes en 1991) y se rinde políticamente tras negociación con el gobierno Gaviria (cárcel La Catedral 1991, fuga 1992, muerte en persecución 2 diciembre 1993). Secuela institucional: Oficina de Envigado, Los Pepes, paramilitarismo en el Urabá, bandas criminales post-desmovilización. (c) *Urbanismo social y "modelo Medellín"* (2004–2015): Sergio Fajardo alcalde (independiente, matemático, fundamento del movimiento "Compromiso Ciudadano") implementa con el equipo del EAFIT-Urbam una política que combina (i) Metrocable Línea K (2004, primer teleférico urbano del mundo en uso cotidiano), (ii) Parques Biblioteca en barrios populares (España, La Ladera, San Javier), (iii) intervención Comuna 13 con escaleras eléctricas (2011), (iv) Museo Casa de la Memoria, (v) presupuesto participativo. El resultado es la reconocida transformación Medellín, premiada con el Lee Kuan Yew World City Prize 2016. Las tres fases son inseparables: el urbanismo social solo tiene sentido entendido como respuesta política al hueco dejado por el Estado durante el arco narco.
- **Prerrequisitos:** C1, `travel-f1-divergencia-poscolonial` (F1)

### C3. Santa Fe de Antioquia y orfebrería Quimbaya
- **ID sugerido:** `travel-f3-santa-fe-quimbaya`
- **Slug:** `santa-fe-antioquia-quimbaya-orfebreria`
- **Definición canónica:** Santa Fe de Antioquia, fundada por Jorge Robledo el 4 de diciembre de 1541 a orillas del río Cauca (a 56 km de Medellín), fue la primera capital de la provincia de Antioquia hasta 1826 y el centro colonial del oro en la región — alrededor de su jurisdicción se explotaron las minas aluviales del Cauca, el Nechí y el Porce con mano de obra esclavizada africana (los esclavos del Chocó bajaban por las rutas mulatas a Santa Fe). Conserva un conjunto arquitectónico colonial intacto: Catedral (1797), iglesias de Santa Bárbara y Jesús Nazareno, el Puente de Occidente (1887, Jose María Villa — suspendido de 291 m, uno de los primeros del continente). La región Cauca medio entre Santa Fe y el Eje Cafetero fue territorio de la cultura *Quimbaya*, floreciente entre los siglos I y X d.C. Los Quimbaya son autores del *Tesoro de los Quimbaya* — ~125 piezas de oro (poporos, figurillas antropomorfas, alfileres) encontradas en una tumba en 1890 cerca de La Soledad (Filandia, Quindío). El gobierno de Carlos Holguín las obsequió en 1892–1893 al gobierno de María Cristina de España como agradecimiento por un laudo arbitral en el pleito limítrofe con Venezuela; hoy están en el Museo de América (Madrid) y son objeto de demanda de restitución desde 2017 (acción popular ganada ante el Consejo de Estado colombiano 2017, ejecución pendiente). Los poporos Quimbaya — recipientes para la cal del *mambeo* de coca — son el emblema del Museo del Oro de Bogotá (logo del Banco de la República).
- **Prerrequisitos:** C1, `travel-f1-pueblos-precolombinos` (F1)

### C4. Eje Cafetero, Federación y Paisaje Cultural Cafetero
- **ID sugerido:** `travel-f3-eje-cafetero`
- **Slug:** `eje-cafetero-federacion-paisaje-unesco`
- **Definición canónica:** El café (*Coffea arabica*) entra a Colombia por la frontera venezolana a fines del siglo XVIII; a partir de 1870 las laderas templadas (1 200–2 000 m) del piedemonte occidental de la cordillera Central —Caldas, Quindío, Risaralda, norte del Valle, norte del Tolima, suroeste antioqueño— colonizadas por el flujo antioqueño (C1) se vuelven cafeteras: el café se adapta perfectamente al minifundio familiar. En 1927 se funda la *Federación Nacional de Cafeteros* (FNC), organización cuasipública que institucionaliza el gremio: administra el Fondo Nacional del Café, establece precios mínimos internos, compra con *cédula cafetera* a los caficultores, construye infraestructura rural (electrificación, carreteras, escuelas), financia investigación en Cenicafé (fundado 1938, responsable de variedades como Caturra, Colombia, Castillo, Cenicafé 1) y proyecta la marca mundial. En 1959 nace el personaje *Juan Valdez* (Doyle Dane Bernbach), ícono publicitario mundial. El *Paisaje Cultural Cafetero Colombiano* (PCCC) — 47 municipios de 4 departamentos, ~143 000 ha — es declarado Patrimonio Mundial UNESCO en 2011, único paisaje productivo del mundo con esta categoría, por la singularidad de la asociación café/plátano de sombra/guadua/casa bahareque/arriería. Economía: Colombia es el 3° productor mundial de café (después de Brasil y Vietnam) y el 1° de *arábigo suave lavado*. Política: la FNC fue poder paralelo al Estado colombiano durante décadas; su declive desde los años 90 (ruptura del Pacto Internacional 1989, volatilidad, Roya 2008–2012) es parte del desmonte del capitalismo corporativo colombiano.
- **Prerrequisitos:** C1

### C5. Cali, Valle del Cauca y la caña
- **ID sugerido:** `travel-f3-cali-valle-cana`
- **Slug:** `cali-valle-del-cauca-cana`
- **Definición canónica:** El Valle geográfico del río Cauca entre el norte del Valle y el sur del Cauca es una llanura fértil (1 000 m, clima cálido seco) donde desde el siglo XVII se instala la *hacienda de caña de azúcar* con mano de obra esclavizada africana traída principalmente desde el Chocó y la costa. La geografía produce una de las tres grandes concentraciones afrocolombianas del país (Caribe, Pacífico, norte del Cauca-sur del Valle) y una estructura de propiedad latifundista muy distinta del minifundio antioqueño (C1). En la república la caña se moderniza: el *Ingenio Manuelita* (fundado 1864 por James Eder) inaugura el proceso industrial; el *Ingenio Providencia*, *Cauca*, *Pichichí*, *Riopaila* constituyen el complejo agroindustrial azucarero que hoy produce ~23 millones de toneladas de caña anuales y cubre ~230 000 ha en el Valle. Cali — fundada por Sebastián de Belalcázar el 25 de julio de 1536 — pasa de ciudad comercial provincial a tercera ciudad del país en el siglo XX tras la apertura del Ferrocarril del Pacífico (1915) y del puerto de Buenaventura. La identidad caleña del siglo XX se arma sobre tres pilares entrelazados: (a) la *salsa* — a partir de los años 70, Cali se vuelve la "capital mundial de la salsa" con bailadores, orquestas locales (Grupo Niche, Guayacán) y la importación masiva de salsa dura neoyorquina (Fania) en los picós y las discotecas de Juanchito; (b) la *comunidad afrocolombiana* del norte del Cauca (Buenos Aires, Santander de Quilichao, Villarrica) con figuras como Jairo Varela y Joe Arroyo (aunque Arroyo es cartagenero, su obra dialoga); (c) el *Cartel de Cali* de los hermanos Rodríguez Orejuela y Pacho Herrera (1977–1995), segunda generación del narcotráfico colombiano, más "empresarial" que el Cartel de Medellín, capturada en Operación Ciénaga (1995). Cali/Valle es también escenario clave del estallido social 2021 ("primera línea", puntos de resistencia como Puerto Resistencia/Melendez/Siloé): el norte del Cauca y la ciudad concentran tensiones estructurales no resueltas desde la colonia.
- **Prerrequisitos:** C1, `travel-f1-rutas-coloniales` (F1)

### C6. Bogotazo, La Violencia y gestación del conflicto
- **ID sugerido:** `travel-f3-bogotazo-violencia`
- **Slug:** `bogotazo-violencia-bipartidista`
- **Definición canónica:** El 9 de abril de 1948, a las 13:05 en la calle 14 con carrera 7 de Bogotá (hoy Bogotá — esta fase arranca regionalmente en el eje cafetero pero el Bogotazo es estructurante para todo el centro-occidente), Juan Roa Sierra asesina a Jorge Eliécer Gaitán, caudillo liberal de izquierda favorito para la presidencia de 1950. La *turba popular* lincha a Roa Sierra y desata el *Bogotazo* —incendio del centro histórico, saqueo de comercios, asalto a la policía, ~3 000 muertos en 48 horas— que se extiende al país como insurrección popular espontánea. El *Bogotazo* es el detonante (no la causa) de *La Violencia bipartidista* 1948–1958: la guerra entre liberales y conservadores por el control del Estado después de casi un siglo de alternancia violenta. La región del Eje Cafetero —Caldas, Quindío, Tolima, norte del Valle— es epicentro de La Violencia: masacres de liberales por "chulavitas" y "pájaros" (escuadrones conservadores patrocinados por la policía), aparición de las *guerrillas liberales del Llano* (Dumar Aljure, Guadalupe Salcedo) y las *autodefensas campesinas comunistas del sur del Tolima* (Marquetalia, Riochiquito) que se reorganizarán como FARC-EP en 1964 tras la Operación Marquetalia del gobierno Valencia. Saldo: ~200 000 muertos, millones de desplazados, ruptura del tejido social rural que nunca se reconstituye. El *Frente Nacional* (1958–1974) — alternancia pactada entre los dos partidos — cierra formalmente La Violencia pero cristaliza la exclusión política que alimentará las guerrillas de los 60–70 (FARC, ELN 1964, EPL 1967, M-19 1974). El conflicto armado colombiano que conocemos no empieza con Escobar ni con las AUC: empieza en 1948.
- **Prerrequisitos:** C1, C2, `travel-f1-divergencia-poscolonial` (F1)

### C7. Parques Nevados, volcanismo andino y tragedia de Armero 1985
- **ID sugerido:** `travel-f3-nevados-armero`
- **Slug:** `nevados-armero-tragedia-1985`
- **Definición canónica:** El Parque Nacional Natural Los Nevados (creado 1973, ~58 000 ha) contiene la cadena volcánica más activa del norte de los Andes colombianos: Nevado del Ruiz (5 321 m, activo), Nevado del Tolima (5 215 m), Nevado de Santa Isabel (4 950 m, perdió su glaciar en 2023), Cisne y Quindío. Es la expresión regional del vulcanismo asociado a la subducción Nazca-Sudamericana y sostiene el páramo de mayor extensión andino-tropical —ecosistema único con *frailejones* (Espeletia), endémico entre 3 500–4 800 m. El 13 de noviembre de 1985, a las 21:09, una erupción moderada del Nevado del Ruiz genera un *lahar* — flujo de lodo y escombros producido por fusión súbita del glaciar somital con material piroclástico caliente — que desciende por el río Lagunillas y, tras recorrer 60 km a ~60 km/h, sepulta la ciudad de *Armero* (Tolima, ~29 000 habitantes, cabecera de la zona cafetera nortetolimense) aproximadamente a las 23:30. Mueren ~23 000 personas —≈25 000 contando Chinchiná y comunidades menores—, la mayor catástrofe natural de la historia de Colombia y una de las peores del siglo XX a nivel mundial. La tragedia es *particularmente cruel* porque fue anunciada: desde septiembre de 1985 INGEOMINAS y vulcanólogos internacionales (Bernard Chouet entre otros) advertían sobre la probabilidad del lahar; se elaboró un mapa de riesgo preciso un mes antes; hubo fallos burocráticos, indecisiones políticas y desestimación de las alertas. El caso Armero es hoy la referencia canónica mundial en la enseñanza de *gestión de riesgo volcánico*, *comunicación del riesgo* y *preparación comunitaria* (caso de estudio USGS, UNDRR). En la memoria popular colombiana la niña *Omayra Sánchez* —13 años, atrapada 60 horas en los escombros, fallecida ante las cámaras del mundo el 16 de noviembre— es símbolo del desastre.
- **Prerrequisitos:** C4, `travel-f1-geografia-fisica` (F1)

### C8. Síntesis regional: el país andino central como núcleo económico y político
- **ID sugerido:** `travel-f3-sintesis-andina-norte`
- **Slug:** `sintesis-region-andina-norte`
- **Definición canónica:** Cierre de fase. La región Andina Norte — Antioquia + Eje Cafetero + norte del Valle — es el núcleo económico y demográfico de Colombia desde fines del siglo XIX: concentra aproximadamente el 40% del PIB nacional, produce el café, la industria textil y metalúrgica histórica, el azúcar, buena parte del retail moderno (Éxito/Grupo Casino, Cine Colombia, Jumbo), los bancos más grandes (Bancolombia) y las tres áreas metropolitanas más dinámicas después de Bogotá (Medellín, Cali, Pereira-Manizales-Armenia). Pero ese centro dinámico convive con las líneas de falla del país: La Violencia (1948) arranca aquí, las FARC nacen aquí (Marquetalia 1964, Tolima/Huila — ver F4), el narcotráfico escala a mundial aquí (Cartel Medellín, Cartel Cali), y las mayores transformaciones urbanas del país (modelo Medellín) también suceden aquí. Comprender la Andina Norte es comprender por qué Colombia —a diferencia de Argentina o Chile, donde la capital concentra absolutamente— es un país *policéntrico*: Bogotá no subordinó al país, la Andina Norte siempre fue contrapeso económico y cultural. Esa geografía explica tanto la riqueza institucional del país (prensa, universidades, empresa formal) como la persistencia del conflicto (el Estado nunca logró cerrar el arco territorial completo).
- **Prerrequisitos:** C1, C2, C4, C5, C6

---

## Recursos (8)

### R1. Libro — La colonización antioqueña en el occidente de Colombia
- **ID sugerido:** `travel-r-parsons-colonizacion`
- **Tipo:** `book`
- **Autor:** James J. Parsons (geógrafo, UC Berkeley)
- **Publicación original:** *Antioqueño Colonization in Western Colombia* (UC Press, 1949); ed. española Banco de la República, Bogotá, 1950; reed. El Áncora, 1997
- **URL (Banrepcultural / Biblioteca Luis Ángel Arango):** https://babel.banrepcultural.org/digital/collection/p17054coll10/search/searchterm/Parsons%20Antioque%C3%B1a
- **URL complementaria (capítulo académico Nancy Appelbaum, *Dos plazas y una nación*):** https://publicaciones.banrepcultural.org/index.php/banrepcultural/catalog/book/50
- **Duración estimada:** ~6h (Parsons ~230 pp.)
- **Idioma:** español
- **Enseña:** C1 colonización antioqueña · **Refuerza:** C3 (Santa Fe), C4 (base del Eje Cafetero)
- **Notas:** Parsons es el texto fundacional de los estudios sobre la colonización antioqueña — publicado en 1949, no ha sido superado en alcance. Appelbaum (*Muddied Waters: Race, Region and Local History in Colombia*, 2003, versión española en BanRep) da la relectura crítica poscolonial imprescindible sobre la construcción de la identidad "blanca" antioqueña.

### R2. Documental — Pablo Escobar y Medellín: de la industria al narcotráfico
- **ID sugerido:** `travel-r-escobar-medellin`
- **Tipo:** `video`
- **Autor/Canal:** Señal Memoria / Señal Colombia + Caracol TV Archivos (documentales de aniversario) + *Noticias Caracol* serie *El Patrón del Mal: la verdadera historia* (distinguir de la telenovela)
- **URL primaria (Señal Memoria, muerte de Escobar):** https://www.senalmemoria.co/articulos/pablo-escobar-caida-30-anos
- **URL secundaria (*Jorge 40, Escobar y la guerra*, ColPrensa - revisar):** https://www.colprensa.com/
- **URL terciaria (archivo periodístico *El Colombiano* especial 30 años):** https://www.elcolombiano.com/especiales/memorias-del-pais/30-anos-de-la-muerte-de-pablo-escobar-EC23201344
- **URL complementaria (artículo académico *El narcotráfico como problema de política pública en Colombia*, Universidad de los Andes):** https://revistas.uniandes.edu.co/index.php/rcsd/article/view/3029
- **Duración estimada:** ~3h
- **Idioma:** español
- **Enseña:** C2 Medellín (arco narco) · **Refuerza:** C6 (magnicidios Galán/Pizarro), `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** `[revisar]` Evitar rigurosamente los docu-ficción dramatizados de Netflix (*Narcos*) — son estilización anglo de dudosa precisión. Preferir material periodístico colombiano (Señal Memoria, El Colombiano, Semana histórica). Para el arco de urbanismo social sumar como R2b: Alejandro Echeverri y Jorge Pérez, *Medellín: transformación de una ciudad* (BID, 2011) y entrevistas de Sergio Fajardo y Alejandro Echeverri en El Hilo podcast.

### R3. Libro / Artículo — Tesoro de los Quimbaya y arqueología del Cauca medio
- **ID sugerido:** `travel-r-quimbaya-tesoro`
- **Tipo:** `article`
- **Autor/Institución:** Museo del Oro del Banco de la República + artículos académicos ICANH
- **URL primaria (Museo del Oro, colección Quimbaya):** https://www.banrepcultural.org/museo-del-oro/exposicion/sala-gente/quimbaya
- **URL secundaria (Banrepcultural, restitución del Tesoro):** https://www.banrepcultural.org/noticias/tesoro-quimbaya-patrimonio-cultural-colombia
- **URL académica (paper ICANH sobre Quimbaya):** https://www.icanh.gov.co/?idcategoria=7486
- **URL complementaria (Consejo de Estado 2017, sentencia):** https://www.consejodeestado.gov.co/documentos/boletines/PDF/11001-03-15-000-2014-03421-01%282017%29.pdf
- **Duración estimada:** ~2.5h
- **Idioma:** español
- **Enseña:** C3 Santa Fe + orfebrería Quimbaya · **Refuerza:** `travel-f1-pueblos-precolombinos` (F1)
- **Notas:** El Museo del Oro es el acervo académico de referencia. El caso Tesoro Quimbaya es educativamente riquísimo: arqueología + derecho internacional + política de restitución. Complemento: visita virtual al Museo de Antioquia y Museo Universitario UdeA.

### R4. Documental y libro — Paisaje Cultural Cafetero y Federación Nacional de Cafeteros
- **ID sugerido:** `travel-r-pccc-cafe`
- **Tipo:** `article`
- **Autor/Institución:** UNESCO + Federación Nacional de Cafeteros + Marco Palacios
- **URL primaria (UNESCO Paisaje Cultural Cafetero):** https://whc.unesco.org/es/list/1121
- **URL secundaria (expediente técnico Mincultura PCCC):** https://www.mincultura.gov.co/areas/patrimonio/publicaciones/Documents/Paisaje%20Cultural%20Cafetero.pdf
- **URL terciaria (Marco Palacios, *El café en Colombia 1850–1970*, archive.org):** https://archive.org/details/marco-palacios-el-cafe-en-colombia-1850-1970
- **URL complementaria (Cenicafé, historia):** https://www.cenicafe.org/es/
- **Duración estimada:** ~5h (Palacios ~200 pp. relevantes + documentos UNESCO)
- **Idioma:** español
- **Enseña:** C4 Eje Cafetero · **Refuerza:** C1 (base colonizadora del café)
- **Notas:** Marco Palacios (Universidad de los Andes, historiador económico) es el autor canónico sobre el café como estructura política y económica — *El café en Colombia, 1850–1970* es la historia social del grano. El expediente UNESCO da la sistematización del paisaje (47 municipios, criterios V y VI de la Convención).

### R5. Libro — Cali y la salsa: historia cultural del Valle del Cauca
- **ID sugerido:** `travel-r-cali-salsa-valle`
- **Tipo:** `book`
- **Autor:** César Pagano / Alejandro Ulloa *La salsa en Cali* (Universidad del Valle, 1992; reed. 2009)
- **URL primaria (Univalle, libro):** https://programaeditorial.univalle.edu.co/gpd-la-salsa-en-cali-9789587659160-0a8d4b64.html
- **URL secundaria (artículo Univalle, paper académico):** https://bibliotecadigital.univalle.edu.co/handle/10893/13234
- **URL terciaria (documental *Cali, pachanguero* o *Memorias del baile*):** https://www.senalcolombia.tv/documental/cali-pachanguero
- **URL complementaria (Alfonso Múnera, sobre afrocolombianidad del Valle):** https://revistas.javeriana.edu.co/index.php/univhumanistica/article/view/2133
- **Duración estimada:** ~6h
- **Idioma:** español
- **Enseña:** C5 Cali / Valle / salsa · **Refuerza:** C1 (contraste con minifundio paisa)
- **Notas:** `[revisar]` Ulloa es el etnomusicólogo canónico sobre salsa caleña. Si el libro completo no se consigue digital, hay varios capítulos en repositorios universitarios. Alternativa documental: serie *Sultana del Valle* (Telepacífico) o *Cali ayer, hoy y siempre* (Señal Memoria).

### R6. Libro — Gaitán, el Bogotazo y La Violencia
- **ID sugerido:** `travel-r-gaitan-violencia`
- **Tipo:** `book`
- **Autor:** Herbert Braun, *Mataron a Gaitán: vida pública y violencia urbana en Colombia* (Norma, 1987; orig. UW Press 1985); complemento Marco Palacios, *Entre la legitimidad y la violencia: Colombia 1875-1994* (Norma, 1995; reed. 2003)
- **URL primaria (Braun, Biblioteca Banrepcultural):** https://babel.banrepcultural.org/digital/collection/p17054coll18/id/157
- **URL secundaria (Palacios *Entre la legitimidad y la violencia*, archive.org):** https://archive.org/details/marco-palacios-entre-la-legitimidad-y-la-violencia
- **URL terciaria (Informe CNMH *¡Basta ya!* Capítulo I):** https://centrodememoriahistorica.gov.co/descargas/informes2013/bastaYa/basta-ya-colombia-memorias-de-guerra-y-dignidad-2016.pdf
- **Duración estimada:** ~10h (Braun 6h + Palacios cap. 1–4 + CNMH Cap I)
- **Idioma:** español
- **Enseña:** C6 Bogotazo y La Violencia · **Refuerza:** C2 (Medellín en la Violencia), `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** Braun es EL libro sobre el 9 de abril; Palacios es la síntesis académica del siglo XIX y XX colombianos (muerto 2020, historiador canónico). *¡Basta ya!* del Centro Nacional de Memoria Histórica (2013, Gonzalo Sánchez G. director) es el *Hatun Willakuy* colombiano: síntesis oficial del conflicto armado 1958–2012, con ~260 000 muertos documentados.

### R7. Documental / paper — Armero 1985 y volcanismo andino colombiano
- **ID sugerido:** `travel-r-armero-nevado-ruiz`
- **Tipo:** `video`
- **Autor/Canal:** Señal Memoria / Caracol Archivo + Servicio Geológico Colombiano + USGS
- **URL primaria (Señal Memoria, aniversario 40):** https://www.senalmemoria.co/articulos/armero-40-anos-tragedia
- **URL secundaria (Servicio Geológico Colombiano, Nevado del Ruiz):** https://www2.sgc.gov.co/volcanes/VolcanNevadoRuiz/Paginas/generalidades-volcan-nevado-ruiz.aspx
- **URL terciaria (USGS case study en inglés, con traducción):** https://pubs.usgs.gov/fs/fs092-01/
- **URL académica (paper Scielo/Dialnet sobre Armero y comunicación del riesgo):** https://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0121-47052009000300007
- **URL complementaria (cortometraje *La casa* Sofía Velásquez, Univalle, ficción memoria):** https://www.youtube.com/results?search_query=armero+documental+40+a%C3%B1os
- **Duración estimada:** ~3h
- **Idioma:** español
- **Enseña:** C7 Nevados y Armero · **Refuerza:** `travel-f1-geografia-fisica` (F1)
- **Notas:** El SGC es el organismo oficial; la página institucional del volcán es técnicamente rigurosa. El caso Armero es uno de los mejor documentados del mundo — material abundante, seleccionar 2-3 piezas centrales. Conectar explícitamente con la teoría de subducción Nazca (F1) en la pedagogía.

### R8. Libro/Informe — ¡Basta ya! Colombia: memorias de guerra y dignidad (Centro Nacional de Memoria Histórica)
- **ID sugerido:** `travel-r-basta-ya-cnmh`
- **Tipo:** `book`
- **Autor:** Centro Nacional de Memoria Histórica (2013, Gonzalo Sánchez G. director). Informe oficial.
- **URL oficial (CNMH, PDF completo):** https://centrodememoriahistorica.gov.co/descargas/informes2013/bastaYa/basta-ya-colombia-memorias-de-guerra-y-dignidad-2016.pdf
- **URL sitio oficial CNMH:** https://centrodememoriahistorica.gov.co/
- **URL complementaria (Comisión de la Verdad, informe *Hay futuro si hay verdad* 2022):** https://www.comisiondelaverdad.co/hay-futuro-si-hay-verdad
- **Duración estimada:** ~8h (capítulos prioritarios: Intro + Cap I "Un conflicto de múltiples dimensiones" + Cap II "Los orígenes, dinámicas y crecimiento")
- **Idioma:** español
- **Enseña:** C8 síntesis regional conflicto · **Refuerza:** C2, C6, `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** Es el informe oficial más importante sobre el conflicto armado colombiano hasta 2013 y la base del proceso de paz de La Habana. Comisión de la Verdad 2022 lo actualiza con ~9 tomos — el capítulo "Hasta la guerra tiene límites" es la síntesis más reciente. Integración pipeline: segmentar por capítulos como `resource_page_range`.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Parsons + Appelbaum | C1 | — |
| R2 Escobar / Medellín | C2 | — |
| R3 Quimbaya / Museo del Oro | C3 | — |
| R4 Marco Palacios café + UNESCO | C4 | — |
| R5 Ulloa salsa Cali | C5 | — |
| R6 Braun / Palacios Violencia | C6 | — |
| R7 Armero / SGC | C7 | — |
| R8 ¡Basta ya! CNMH | C8 (síntesis) | — |

**Cross-phase prereqs F1:** `travel-f1-geografia-fisica`, `travel-f1-pueblos-precolombinos`, `travel-f1-virreinatos`, `travel-f1-rutas-coloniales`, `travel-f1-divergencia-poscolonial`.

---

## DAG pedagógico

```
(F1: virreinatos, rutas-coloniales)
        │
        ▼
      C1 (colonización antioqueña)
        │
        ├─► C3 (Santa Fe + Quimbaya) ◄── (F1: pueblos-precolombinos)
        │
        ├─► C4 (Eje Cafetero) ──────► C7 (Nevados / Armero) ◄── (F1: geografia-fisica)
        │       │
        ├─► C2 (Medellín arco) ◄── (F1: divergencia-poscolonial)
        │       │
        │       └─► C6 (Bogotazo / Violencia) ◄── (F1: divergencia-poscolonial)
        │                 │
        ├─► C5 (Cali / Valle / caña) ◄── (F1: rutas-coloniales)
        │
        └─► C8 (síntesis regional) [consume C1,C2,C4,C5,C6]
```

Orden de estudio recomendado: **C1 → C3 → C4 → C7 → C2 → C6 → C5 → C8**. Coincide con recorrido físico Medellín → Santa Fe → Eje Cafetero → Nevados → Cali.

---

## Cosas a validar antes de seedear

1. **R2 Escobar**: decidir piezas audiovisuales definitivas (Señal Memoria + El Colombiano). Evitar ficción.
2. **R5 Ulloa salsa**: confirmar acceso digital; plan B Univalle + documental Señal Colombia.
3. **R4 Palacios café**: si el PDF no se consigue, sustituir por el artículo compacto de Palacios en *Credencial Historia* (BanRep) + expediente UNESCO.
4. **Complementos audiovisuales**: Medellín urbanismo social amerita R2b (BID + Fajardo/Echeverri entrevistas). Marcarlo para discusión con usuario.
5. **Integración pipeline**: R6 (Braun + Palacios + ¡Basta ya!) es la carga más densa; planificar segmentación cuidadosa.
6. **Cross-check con F4**: C6 (La Violencia) reaparecerá en F4 con énfasis sur (FARC en Marquetalia/Tolima-Huila/Caquetá). Evitar duplicación cuando se escriba F4.

---

## Próximos pasos del coordinator

- [ ] Resolver los 2 `[revisar]` (R2, R5)
- [ ] Cross-check con F1 y con F4 que viene
- [ ] Actualizar `PROGRESS.md`
- [ ] Avanzar F4 (Colombia Andina Sur)

