# Fase 11 — Argentina: Cuyo y Patagonia (cierre del track) · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 11 del track `travel` — fase final del viaje. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed. Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='11'`.

**Para el coordinator:** 8 conceptos, 8 recursos. URLs verificadas el 2026-04-22. El recorrido del usuario es un bucle: entra a Argentina por Mendoza (Tapicería Jorge) y San Juan, baja por RN40 a Calafate y Ushuaia, sube por RN3 costera, corta al noroeste (Campo de Piedra Pómez, Antofagasta de la Sierra), baja a Córdoba (Villa Allende, Bolgheri) y cierra en Buenos Aires (Pizzería Güerrín, Bar Amigos). La Fase 11 **no es** un recorrido topográfico sino el cierre conceptual del track: el último concepto C8 (Buenos Aires y la nación argentina) enlaza con F1-C8 (divergencia poscolonial) cerrando el círculo que empezó en la panorámica continental.

---

## Objetivo de la fase

Al terminar, el usuario debería poder explicar Argentina como una pregunta histórica abierta: por qué un país que en 1913 tenía PBI per cápita comparable a Francia hoy está en default crónico, por qué la "Conquista del Desierto" es el trauma fundante del Estado moderno, por qué el petróleo argentino nació estatal en 1907 (único caso mundial), por qué Córdoba y Buenos Aires producen dos argentinidades distintas, y por qué 1976-1983 no es un paréntesis sino la bisagra entre dos modelos de país. El cierre retoma el macro de F1 cerrando la hipótesis Halperín: la divergencia poscolonial sudamericana se lee con máxima claridad en la trayectoria argentina.

---

## Conceptos (8)

### C1. Cuyo colonial y vitivinícola
- **ID sugerido:** `travel-f11-cuyo-vitivinicola`
- **Slug:** `cuyo-colonial-vitivinicola`
- **Definición canónica:** Mendoza (1561) y San Juan (1562) fueron fundadas desde Santiago de Chile y pertenecieron a la Capitanía General de Chile hasta 1776 — Cuyo es, históricamente, una región trasandina. La agricultura de oasis fue posible por la adaptación del sistema de acequias de origen andalusí-morisco al deshielo cordillerano (Río Mendoza, Río San Juan), tecnología que estructuró cinco siglos de ocupación territorial (Ponte, INCIHUSA-CONICET). La industria vinícola moderna se monta en la segunda mitad del XIX con inmigración italiana, francesa y española, consolidándose con el ferrocarril a Buenos Aires en 1885 y la reconversión técnica liderada por Tiburcio Benegas y Emilio Civit.
- **Prerrequisitos:** F1-C3 (virreinatos), F10-C3 (dependencia colonial de Chile)

### C2. Cruce de los Andes y Campaña Libertadora de San Martín (1817)
- **ID sugerido:** `travel-f11-cruce-andes`
- **Slug:** `cruce-andes-san-martin-1817`
- **Definición canónica:** Entre enero y febrero de 1817, José de San Martín cruzó la cordillera con ~5.000 hombres, 10.000 mulas y artillería desmontada por seis pasos simultáneos (Los Patos y Uspallata como principales, más cuatro columnas secundarias de distracción), en una operación logística de 21 días sin precedente sudamericano. El plan — diseñado desde la gobernación mendocina — buscaba liberar Chile como plataforma para atacar Lima por mar y descabezar el virreinato del Perú, estrategia complementaria al avance de Bolívar por el norte (F1-C7). Victoria de Chacabuco (12-feb-1817) y consolidación en Maipú (5-abr-1818). Mendoza es así el punto logístico donde se hizo operativa la independencia sudamericana del Cono Sur.
- **Prerrequisitos:** C1, F1-C7

### C3. Conquista del Desierto (1878-1885)
- **ID sugerido:** `travel-f11-conquista-desierto`
- **Slug:** `conquista-del-desierto`
- **Definición canónica:** Entre 1878 y 1885, bajo Julio A. Roca como ministro de Guerra y luego presidente, el Ejército Argentino ejecutó la ocupación militar de la Pampa y la Patagonia, territorios hasta entonces controlados por confederaciones mapuche-tehuelche (Calfucurá, Namuncurá, Sayhueque). La operación — concurrente con la "Pacificación de la Araucanía" chilena (F10-C4) y coordinada con ella — incorporó al Estado argentino ~550.000 km² mediante una combinación de campañas militares, zanja de Alsina, deportación de poblaciones originarias a ingenios tucumanos y misiones salesianas, y venta de tierras a sociedades especuladoras. Es el trauma fundante del Estado argentino moderno y la condición material del modelo agroexportador 1880-1930. El debate historiográfico (genocidio vs. "campaña"; Lenton, Delrio, Walther, Hilda Sábato) es parte del concepto.
- **Prerrequisitos:** F1-C8, F10-C4

### C4. Patagonia rebelde (huelgas 1920-1921)
- **ID sugerido:** `travel-f11-patagonia-rebelde`
- **Slug:** `patagonia-rebelde-huelgas-1920`
- **Definición canónica:** Entre 1920 y 1922, peones rurales anarquistas y socialistas — migrantes europeos que traían el repertorio combativo de la Semana Trágica porteña de 1919 — protagonizaron huelgas en las estancias laneras de Santa Cruz (Río Gallegos, San Julián, El Calafate) contra condiciones laborales serviles. El gobierno de Hipólito Yrigoyen envió al Regimiento 10 de Caballería al mando del teniente coronel Héctor Benigno Varela, que fusiló sin juicio a ~1.500 trabajadores y arrojó los cuerpos a zanjas colectivas. El caso fue reconstruido por Osvaldo Bayer en *La Patagonia rebelde / Los vengadores de la Patagonia trágica* (4 tomos, 1972-78), obra fundacional de la historia argentina desde abajo. La película homónima de Héctor Olivera (1974) fue prohibida por Isabel Perón y la dictadura de Videla. El concepto empalma F11-C3 (continuidad del despojo) con F11-C7/C8 (ciclos represivos).
- **Prerrequisitos:** C3, F10-C2 (lanera patagónica chilena contemporánea)

### C5. Petróleo, Comodoro Rivadavia e YPF
- **ID sugerido:** `travel-f11-ypf-petroleo`
- **Slug:** `ypf-petroleo-argentino`
- **Definición canónica:** El 13 de diciembre de 1907, una perforación que buscaba agua en Comodoro Rivadavia encontró petróleo a 539 m. Yrigoyen y el general Enrique Mosconi crearon YPF en junio de 1922 — primera petrolera estatal integral del mundo, anterior a la Total francesa — como instrumento de soberanía energética. YPF es símbolo del nacionalismo económico argentino del siglo XX (integración vertical completa: pozo, refinería, surtidor). Su privatización bajo Menem en 1992 y la renacionalización parcial bajo Cristina Fernández en 2012 (recuperación del 51% a Repsol) son hitos ideológicos nacionales. La formación no convencional Vaca Muerta (Neuquén, identificada en 2010, producción significativa desde 2013) reabre la discusión entre modelo extractivo, conflicto con comunidades mapuche y soberanía energética en el siglo XXI.
- **Prerrequisitos:** C3, F1-C8

### C6. Ushuaia, Tierra del Fuego y la frontera austral
- **ID sugerido:** `travel-f11-ushuaia-fuego`
- **Slug:** `ushuaia-tierra-del-fuego`
- **Definición canónica:** Ushuaia nace como misión anglicana (Thomas Bridges, padre de Lucas, 1869) y se convierte en presidio nacional en 1902, estrategia de poblamiento argentino del confín sur por deportación penal (modelo australiano/siberiano). Tierra del Fuego es el territorio donde se consuma el genocidio selk'nam (F10-C1) en paralelo con la explotación del oro de Bahía San Sebastián (1880s) y la ganadería ovina. El siglo XX agrega tres capas: el conflicto del Beagle con Chile (1978, Argentina movilizó para invadir; mediación de Juan Pablo II vía cardenal Antonio Samoré salvó la guerra), la guerra de Malvinas (abril-junio 1982) donde Tierra del Fuego fue base logística (Río Grande), y la pretensión antártica argentina con Base Marambio (1969) como proyecto geopolítico. Ushuaia condensa "fin del mundo" como categoría identitaria nacional argentina.
- **Prerrequisitos:** F10-C1, C3

### C7. Córdoba: la docta, los jesuitas, el Cordobazo
- **ID sugerido:** `travel-f11-cordoba-docta`
- **Slug:** `cordoba-docta-jesuitas-cordobazo`
- **Definición canónica:** Córdoba fue fundada en 1573 en el Camino Real Potosí-Buenos Aires (F1-C5) y los jesuitas instalaron en 1613 el Colegio Máximo — origen de la Universidad Nacional de Córdoba, cuarta más antigua de América. El sistema de seis estancias jesuíticas (Caroya, Jesús María, Santa Catalina, Alta Gracia, La Candelaria, San Ignacio) financiaba la educación y constituye el primer complejo agroindustrial integrado del territorio argentino (Patrimonio UNESCO 2000). La identidad "docta" cordobesa se reafirma con la Reforma Universitaria de 1918 (manifiesto liminar de Deodoro Roca), hito continental. El 29 de mayo de 1969, el Cordobazo — alianza obrero-estudiantil liderada por Agustín Tosco (Luz y Fuerza) y Elpidio Torres (SMATA) contra la dictadura de Onganía — abre el ciclo de radicalización política de los 70. Córdoba ha sido además desde los 50 el polo industrial automotriz argentino (IKA, Fiat, Renault).
- **Prerrequisitos:** F1-C5, F1-C6

### C8. Buenos Aires y la nación argentina (cierre del track)
- **ID sugerido:** `travel-f11-buenos-aires-nacion`
- **Slug:** `buenos-aires-nacion-argentina`
- **Definición canónica:** Concepto de cierre del track. Buenos Aires pasó de ser puerta trasera de Potosí (F1-C4) a cabecera del Virreinato del Río de la Plata (1776) a capital de la nación (1880 tras la federalización forzada). La inmigración europea masiva 1870-1930 (6 millones sobre una población de 4 millones; pico 1914: 30% de los habitantes eran extranjeros) creó una estructura social singular en América Latina: amplia clase media urbana con identidad propia (Adamovsky, *Historia de la clase media argentina*, 2009), tango como síntesis cultural negra-criolla-italiana (Borges), peronismo 1945-55 como fractura entre el "pueblo trabajador" y la clase media antiperonista, inestabilidad institucional crónica (seis golpes 1930-76), y dictadura 1976-1983 como aplicación sistemática del terrorismo de Estado (30.000 desaparecidos, ESMA, vuelos de la muerte) documentada por CONADEP en *Nunca Más* (1984, primera comisión de la verdad del mundo). El concepto cierra el track retomando F1-C8: la divergencia poscolonial argentina explicada no como destino sino como resultado de decisiones históricas reconstruibles.
- **Prerrequisitos:** C3, C4, C5, C7, F1-C6, F1-C8

---

## Recursos (8)

### R1. Artículo — De los caciques del agua a la Mendoza de las acequias
- **ID sugerido:** `travel-r-acequias-mendoza`
- **Tipo:** `article`
- **Autor:** Ricardo Ponte · INCIHUSA-CONICET · UNCuyo (2005)
- **URL (SciELO):** https://www.scielo.org.ar/scielo.php?pid=S0524-97672007000100006&script=sci_arttext
- **Idioma:** español
- **Enseña:** C1 Cuyo vitivinícola · **Refuerza:** F1-C3
- **Notas:** Paper de referencia sobre cinco siglos de manejo hidráulico en Mendoza. Conecta tecnología andalusí-morisca con oasis irrigados y estructura urbana colonial. Fuente primaria para entender por qué Mendoza-ciudad está donde está.

### R2. Video — San Martín y el cruce de los Andes (Felipe Pigna)
- **ID sugerido:** `travel-r-cruce-andes-pigna`
- **Tipo:** `video`
- **Autor/Canal:** Felipe Pigna (historiador, canal oficial YouTube)
- **URL primaria:** https://www.youtube.com/watch?v=UJO8g_mKL6c
- **URL alternativa (logística detallada):** https://www.youtube.com/watch?v=LIkPAsDe0S0 ("La logística de San Martín para el cruce de Los Andes fue increíble", con Ari Lijalad, 2025)
- **Duración estimada:** 30-60 min
- **Idioma:** español
- **Enseña:** C2 cruce de los Andes · **Refuerza:** C1, F1-C7
- **Notas:** Pigna es divulgación académica seria (no amateur), referente argentino del género. El video de 2024 es el consolidado; el de 2025 entra en detalle logístico útil para el nivel del usuario.

### R3. Video — Historias de la Patagonia rebelde (Canal Encuentro) + película de Olivera
- **ID sugerido:** `travel-r-patagonia-rebelde`
- **Tipo:** `video`
- **Autor/Canal:** Canal Encuentro (playlist basada en Bayer) + opcional película de Héctor Olivera (1974) vía Internet Archive
- **URL primaria (serie Encuentro):** https://www.youtube.com/playlist?list=PLZ6TIj4tHEIuBMYwbd5F0cKhBkK1zY2EY
- **URL alternativa (película Olivera, archive.org):** https://archive.org/details/la-patagonia-rebelde-1974
- **Duración estimada:** Serie Encuentro: ~4h divididas. Película: 100 min.
- **Idioma:** español
- **Enseña:** C4 Patagonia rebelde · **Refuerza:** C3, F10-C2
- **Notas:** La película de Olivera ganó Oso de Plata Berlín 1974 y fue prohibida por Isabel Perón y la dictadura — además de documento histórico es documento de censura. El guion está coescrito por Bayer.

### R4. Libro — La Patagonia rebelde (Osvaldo Bayer)
- **ID sugerido:** `travel-r-bayer-patagonia-rebelde`
- **Tipo:** `book`
- **Autor:** Osvaldo Bayer (síntesis en un tomo de *Los vengadores de la Patagonia trágica*, 4 tomos originales 1972-78)
- **URL (archive.org, open access):** https://archive.org/details/LaPatagoniaRebeldeOsvaldoBayer
- **Idioma:** español
- **Capítulos a leer:** Introducción + capítulo sobre la primera huelga + capítulo sobre la represión de Varela + epílogo. Total: ~200 páginas seleccionadas.
- **Enseña:** C4 Patagonia rebelde · **Refuerza:** F1-C8
- **Notas:** Canon absoluto de la historia argentina desde abajo. Bayer investigó 10 años archivos militares, testimonios orales y prensa obrera. Inseparable del R3 fílmico: el libro es el texto, la película es la traducción masiva. Conectar con F10 (huelgas chilenas contemporáneas, simetría no casual).

### R5. Artículo — El descubrimiento de petróleo en Comodoro Rivadavia (Felipe Pigna, El Historiador)
- **ID sugerido:** `travel-r-ypf-pigna`
- **Tipo:** `article`
- **Autor:** Felipe Pigna · El Historiador
- **URL:** https://elhistoriador.com.ar/el-descubrimiento-de-petroleo-en-comodoro-rivadavia-por-felipe-pigna/
- **URL complementaria (paper académico):** https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S2448-66552019000100121
- **Idioma:** español
- **Enseña:** C5 YPF/Comodoro · **Refuerza:** C3, F1-C8
- **Notas:** Pigna como introducción accesible; el paper SciELO "El petróleo argentino en las primeras décadas del siglo XX" como profundización académica. Complementar con el informe Gestar (https://gestar.org.ar/pdf/InformeYPF.pdf) para la parte privatización-renacionalización-Vaca Muerta 1992-presente.

### R6. Video — El Cordobazo (Canal Encuentro)
- **ID sugerido:** `travel-r-cordobazo-encuentro`
- **Tipo:** `video`
- **Autor/Canal:** Canal Encuentro (Argentina, producción estatal educativa) · serie "En la calle, la historia"
- **URL primaria (HD):** https://www.youtube.com/watch?v=8VDkQTFR-iU
- **URL alternativa (documental Agustín Tosco):** https://www.youtube.com/watch?v=WJgtmGdf6bk
- **Duración estimada:** 25-30 min
- **Idioma:** español
- **Enseña:** C7 Córdoba/Cordobazo · **Refuerza:** F1-C8
- **Notas:** Encuentro es gold standard argentino de divulgación. El documental paralelo sobre Tosco personaliza la alianza obrero-estudiantil. Para la capa jesuítica-universitaria-Reforma sumar a futuro artículo UNC de patrimonio (https://www.unc.edu.ar/sobre-la-unc/patrimonio-de-la-humanidad).

### R7. Libro — Historia de la clase media argentina (Ezequiel Adamovsky)
- **ID sugerido:** `travel-r-adamovsky-clase-media`
- **Tipo:** `book`
- **Autor:** Ezequiel Adamovsky (Planeta, 2009; reseñado en Cahiers des Amériques Latines, https://journals.openedition.org/cal/736?lang=es)
- **URL (reseña académica OpenEdition):** https://journals.openedition.org/cal/736?lang=es
- **URL complementaria (entrevista con el autor):** https://radiografica.org.ar/2020/07/04/ezequiel-adamovsky-la-idea-de-clase-media-nos-invita-a-pensarnos-como-una-clase-separada-del-bajo-pueblo/
- **Idioma:** español
- **Capítulos a leer:** Introducción + capítulos sobre 1919-1945 (formación de la identidad clase-media) + capítulo sobre peronismo y antiperonismo + epílogo sobre post-2001. Total: ~250 páginas.
- **Enseña:** C8 Buenos Aires y nación · **Refuerza:** C7, F1-C8
- **Notas:** Libro contemporáneo canónico (2009, premio Nacional) que reconfigura la historiografía argentina tradicional. Adamovsky argumenta que la "clase media argentina" es una construcción ideológica de 1919 en adelante, no una categoría sociológica neutra. Clave para entender peronismo y dictadura. Si no se consigue PDF abierto, usar la reseña OpenEdition + entrevista como recursos textuales.

### R8. Libro/Informe — Nunca Más (CONADEP, 1984)
- **ID sugerido:** `travel-r-nunca-mas-conadep`
- **Tipo:** `book`
- **Autor/Institución:** Comisión Nacional sobre la Desaparición de Personas (CONADEP) · Prólogo de Ernesto Sabato
- **URL (Ministerio de Cultura, PDF open access):** https://www.cultura.gob.ar/media/uploads/lc_nuncamas_digital1.pdf
- **URL alternativa (CELS, edición 40 aniversario):** https://www.cels.org.ar/web/publicaciones/40-anos-nunca-mas/
- **Idioma:** español
- **Capítulos a leer:** Prólogo de Sabato + Cap I (la acción represiva) + Cap II (víctimas) + capítulo ESMA + conclusiones. Total: ~250 páginas seleccionadas del total de ~490.
- **Enseña:** C8 Buenos Aires y nación (dictadura) · **Refuerza:** C4 (continuidad represiva), F1-C8
- **Notas:** Primera comisión de la verdad del mundo (1983-84), modelo posterior para Sudáfrica, Chile, Perú. Inseparable del cierre del track: el viaje termina en Buenos Aires donde el Nunca Más se escribe. La cita del Prólogo de Sabato ("Durante la década del 70, la Argentina fue convulsionada por un terror que provenía tanto desde la extrema derecha como de la extrema izquierda...") sigue siendo debate público.

---

## Mapeo concepto <-> recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Acequias Mendoza | C1 | — |
| R2 Cruce Andes Pigna | C2 | — |
| R3 Patagonia rebelde video/film | C4 | — |
| R4 Bayer Patagonia rebelde libro | C4 | C8 (continuidad represiva) |
| R5 YPF Comodoro Pigna | C5 | — |
| R6 Cordobazo Encuentro | C7 | — |
| R7 Adamovsky clase media | C8 | — |
| R8 Nunca Más CONADEP | C8 | — |

Prerrequisitos concepto-concepto ya expresados en cada card; se traducen a filas de `concept_prerequisites`. **Cross-phase:**
- C1->F1-C3, F10-C3
- C2->F1-C7
- C3->F1-C8, F10-C4
- C4->F10-C2
- C5->F1-C8
- C6->F10-C1
- C7->F1-C5, F1-C6
- C8->F1-C6, F1-C8 (cierre del track)

---

## Horas estimadas y DAG pedagógico

- **Total estimado:** ~32 h (cuatro libros densos: Bridges residual de F10, Bayer, Adamovsky, Nunca Más + videos).
- **Orden sugerido del DAG (respeta cronología interna + geografía del viaje):**
  1. C1 (Cuyo vitivinícola) — primera parada física del usuario en Argentina (Mendoza/Tapicería Jorge).
  2. C2 (cruce de los Andes) — paralelo a C1, sobre el mismo territorio.
  3. C3 (Conquista del Desierto) — base del Estado argentino moderno.
  4. C4 (Patagonia rebelde) — trabaja mientras el usuario recorre Santa Cruz (El Calafate).
  5. C6 (Ushuaia/Tierra del Fuego) — punto sur del viaje físico.
  6. C5 (YPF/Comodoro/Vaca Muerta) — subida por RN3.
  7. C7 (Córdoba la docta y Cordobazo) — penúltima parada (Villa Allende).
  8. C8 (Buenos Aires y la nación) — cierre del viaje y del track. Enlaza con F1-C8.

---

## Cosas a validar antes de seedear

1. **R3 (Patagonia rebelde video):** elegir entre playlist Encuentro (más pedagógica) y película de Olivera (más intensa). Ambas se complementan; probablemente seedear las dos como R3a/R3b.
2. **R7 Adamovsky:** confirmar si existe PDF abierto del libro completo. Si no, queda la reseña + entrevista como input textual parcial.
3. **R8 Nunca Más:** definir rango de páginas exacto. Edición oficial del Ministerio de Cultura (2006 Eudeba) es la canónica.
4. **Cross-phase a F1-C8:** asegurar que cuando el usuario cierre F11-C8 el sistema abra preguntas de síntesis que retomen F1-C8 (divergencia poscolonial). Este es el "momento graduación" del track.
5. **Candidatos opcionales no incluidos pero considerables:**
   - *Operación masacre* de Rodolfo Walsh (precursor del periodismo no ficción, útil para C8).
   - *Una excursión a los indios ranqueles* de Lucio V. Mansilla (primera persona sobre la frontera pampeana pre-Roca, útil como contrapunto a C3).
   - *La voluntad* de Caparrós y Anguita (organizaciones revolucionarias 70s, refuerza C7-C8).
   - Documentales de Archivo DiFilm para material de época.
