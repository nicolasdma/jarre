# Fase 1 — Cruzar el Darién en kayak · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 1 del track `aventura`. Cuando el coordinator lo cierre con URLs verificadas y definiciones definitivas, traducirlo a migration SQL de seed siguiendo el template `supabase/migrations/20260421040000_seed_travel_phase_1.sql`. Convenciones: `curriculum_source='core'`, `created_by=NULL`, `track='aventura'`, `phase='1'`, todo en español (revisar decisión de idioma en `PROGRESS.md`).

**Para el coordinator (yo mismo, futuro):** esto es el esqueleto inicial — 9 conceptos identificados con descripción provisional, prerrequisitos tentativos, y una lista preliminar de pistas de fuentes a investigar. **Nada está verificado todavía.** Antes de pasar a `ready-for-seed`: (a) refinar definiciones canónicas a 4–6 oraciones densas, (b) curar 9 recursos con URL verificada por concepto principal, (c) cerrar mapeo `resource_concepts`, (d) resolver puntos `[revisar]`. Los 9 conceptos ya fueron aprobados por el usuario 2026-04-22 (ver `PROGRESS.md` Decisiones).

---

## Objetivo de la fase

Que el usuario llegue al borde del Golfo de Urabá con la cabeza armada para tomar la decisión más importante de la travesía: **cruzar o no cruzar**, y si cruza, **por qué ruta, en qué ventana climática, con qué protocolo de contingencia**. Al terminar la fase debería poder responder sin googlear:

- Por qué no hay carretera entre Colombia y Panamá (y no es solo "selva")
- Cuál es la ventana realista de mar calmo en el Caribe sur (y por qué)
- Quién es soberano de qué pedazo de costa (Guna Yala no es Panamá en sentido pleno)
- Qué riesgos son náuticos y qué riesgos son humanos, y cómo se mitigan distinto
- A quién avisa, con qué equipo, y cuál es el plan B si el plan A se rompe en el día 3

No es un curso de remo. Es un curso de **decisión informada antes de meterse a una zona donde el error no se desanda fácil**.

---

## Conceptos (9) — definiciones canónicas refinadas 2026-04-23

> Estado: definiciones refinadas a 4–6 oraciones densas usando las 51 fuentes curadas como insumo, equivalentes en calidad a `travel/phase-1-brief.md`. Listas para seed.

### C1. Geografía y oceanografía del Golfo de Urabá y Caribe sur
- **ID sugerido:** `aventura-f1-oceanografia-caribe-sur`
- **Slug:** `oceanografia-golfo-urabá-caribe-sur`
- **Definición canónica:** El Golfo de Urabá (~1.800 km², profundidad media ~40 m) es un estuario tropical donde el río Atrato descarga al Caribe sur generando plumas de agua dulce y sedimentos que afectan visibilidad y olas en la boca, con zonas de hipoxia estacional documentadas. La circulación superficial está dominada por el Giro Panamá-Colombia (Panama-Colombia Gyre, PCG), cuya intensidad es modulada hasta un factor ~2 por remolinos de la Corriente del Caribe en ciclos de ~116 días — variabilidad que determina la ventana real de cruce más que el calendario nominal. Los vientos alisios del noreste dominan de diciembre a abril (mar relativamente calmo, ventana operativa) y la temporada de lluvias (mayo–noviembre) trae marejadas y sistemas tropicales eventuales. Las mareas son semidiurnas de bajo rango (~50 cm), pero el viento regional y la descarga del Atrato producen corrientes costeras locales que no siguen la marea. Entender esta geometría no es opcional: es el prerrequisito físico de toda decisión de ruta, horario de salida y criterio de aborto.
- **Prerrequisitos:** ninguno (concepto fundacional de la fase)
- **Pistas de fuentes a investigar:** INVEMAR (Colombia), Smithsonian Tropical Research Institute, datos NOAA del Caribe, ECMWF para vientos, papers de circulación en el giro panameño-colombiano

### C2. El Tapón del Darién: por qué no hay carretera
- **ID sugerido:** `aventura-f1-tapon-darien`
- **Slug:** `tapon-darien-sin-carretera`
- **Definición canónica:** El Tapón del Darién es la única discontinuidad de la Carretera Panamericana entre Alaska y Tierra del Fuego: ~100 km de selva, pantano y montaña entre Yaviza (Panamá) y Turbo (Colombia). Su ausencia no es falla de ingeniería sino resultado de una decisión política sostenida desde los 70s y consolidada por la demanda del Sierra Club (1975), con la injunction del Department of Transportation levantada recién en 1992: convergieron la barrera fitosanitaria contra la fiebre aftosa que protege la ganadería norteamericana y contra el *screwworm*, la presión ambiental por una de las áreas con mayor stock de carbono y segunda mayor riqueza arbórea del neotrópico, y el veto sostenido de los pueblos Emberá, Wounaan y Guna. El resultado es una doble paradoja: Parque Nacional Darién figura como Patrimonio Mundial UNESCO pero con rating de "Significant Concern" (IUCN 2025), y simultáneamente es el corredor de migración irregular más peligroso del hemisferio. Los datos recientes confirman que el equilibrio es inestable: pérdida 2002–2023 de ~21.500 ha de bosque primario, 300.000 t de residuos acumulados por la crisis migratoria, e inversión anunciada de US$ 70M en un puente sobre Tuira/Chucunaque que reabriría la frontera agrícola. La ruta marítima por el Caribe sur existe justamente porque la terrestre fue vetada políticamente, no técnicamente.
- **Prerrequisitos:** C1
- **Pistas de fuentes a investigar:** Parque Nacional Darién (UNESCO), USDA APHIS sobre fiebre aftosa, archivo de prensa años 70 sobre la decisión, papers del Smithsonian sobre biodiversidad

### C3. Guna Yala: soberanía indígena, navegación tradicional y protocolo de cruce
- **ID sugerido:** `aventura-f1-guna-yala`
- **Slug:** `guna-yala-soberania-navegacion`
- **Definición canónica:** Guna Yala (antes San Blas) es una comarca indígena autónoma panameña de 51 comunidades distribuidas en ~365 islas del Caribe, gobernada por el Congreso General Guna desde la Revolución Dule de 1925 y formalizada por Ley 16 de 1953. La estructura política es dual: Congreso General Guna (político-administrativo, sesiones ordinarias en mayo y octubre) y Congreso General de la Cultura (espiritual), con autoridades tradicionales (Sagla local, argarmar, Sagladummagan como autoridad máxima) cuyas decisiones vinculan a extranjeros dentro de la comarca. El Reglamento de Turismo vigente (2017) exige autorización escrita del Congreso para embarcaciones de recreo, tarifas concretas (~US$ 10 anclaje + US$ 2/persona + US$ 10 comunidad), estadía máxima de 30 días y coordinación previa con la Dirección Nacional de Migración y la Autoridad Marítima panameña. Los Guna tienen siglos de navegación en cayucos a vela y conocen las corrientes del Caribe sur con precisión empírica, pero también pueden negar el paso legítimamente — cruzar sin permiso no es desliz burocrático sino violación de soberanía reconocida. Cualquier ruta viable desde Capurganá/Sapzurro hacia Puerto Obaldía atraviesa esta comarca.
- **Prerrequisitos:** C1, C2
- **Pistas de fuentes a investigar:** Congreso General Guna (sitio oficial), Acuerdo de San Blas 1925, etnografía de Mac Chapin / James Howe, normativa migratoria panameña aplicable a comarcas

### C4. Emberá y Wounaan en el Darién panameño: territorio, contacto y reciprocidad
- **ID sugerido:** `aventura-f1-embera-wounaan`
- **Slug:** `embera-wounaan-darien`
- **Definición canónica:** Los pueblos Emberá y Wounaan son originarios del Darién continental, organizados en Comarcas Emberá-Wounaan (Cémaco y Sambú, Ley 22 de 1983) en el interior, y en Tierras Colectivas reguladas por Ley 72 de 2008 en las comunidades costeras — exactamente las que puede tocar una travesía en kayak en bocas de río del Darién panameño. Su movilidad histórica es fluvial y marítima, no terrestre: la construcción naval de la *jãba* (piragua) en ecosistemas fluviales y de cabotaje costero es pieza central de la cultura, documentada en etnografía contemporánea con coautoría wounaan y emberá. El contacto en una travesía costera es lateral pero real: intercambio de información sobre clima y rutas, posible apoyo en emergencia, y obligación de protocolo — pedir permiso antes de entrar a comunidad, no fotografiar sin consentimiento, no introducir bienes que distorsionen la economía local. La ética del contacto se juega entre dos polos a evitar: la romantización ("descubrí algo prístino") y el cinismo ("ya están todos corrompidos"); la posición correcta es reciprocidad informada, reconociendo que estas comunidades defienden activamente 650.000 ha con drones, GPS y asesoría legal, y son víctimas del tráfico ilícito que cruza sus tierras, no cómplices. Su frontera no coincide con la frontera estatal.
- **Prerrequisitos:** C2
- **Pistas de fuentes a investigar:** Fundación Pro Niños del Darién, etnografías de Stier / Herlihy, normativa de COONAPIP

### C5. Migración irregular y crimen organizado: por qué el Darién es noticia desde 2021
- **ID sugerido:** `aventura-f1-migracion-clan-golfo`
- **Slug:** `migracion-irregular-clan-golfo`
- **Definición canónica:** Desde 2021 el Darién pasó de ruta marginal a corredor masivo: 250.000+ cruces en 2022, 520.000+ en 2023, principalmente venezolanos, ecuatorianos, haitianos, africanos y asiáticos rumbo a EE.UU., con caída documentada del ~94% en 2025 tras el cierre anunciado por Mulino y el bloqueo impuesto por el Congreso General Guna al tránsito por Guna Yala. La ruta terrestre clásica es Necoclí → lancha a Capurganá/Acandí → trochas controladas por el Clan del Golfo (cobro de ~US$ 125/persona, "impuesto" del 20% a lancheros) → emergencia en Bajo Chiquito → SENAFRONT → Lajas Blancas → bus a Costa Rica. Para un cruce en kayak por la costa Caribe, la implicancia no es teórica: el Clan del Golfo regula el acceso desde el continente colombiano a Capurganá/Sapzurro, cobra en playas de embarque, y el tramo entre Acandí y Puerto Obaldía es activo para tráfico humano y narco. En 2025 se documentaron rutas marítimas alternativas de retorno por la misma franja (Miramar/Colón → Guna Yala → Puerto Obaldía, 7–9 h) con naufragios y fallas de motor — evidencia de que estas aguas matan a embarcaciones motorizadas con tripulación profesional, lo que eleva cualitativamente el riesgo para un kayakista solo. En este tramo el riesgo no náutico domina al náutico.
- **Prerrequisitos:** C2
- **Pistas de fuentes a investigar:** SENAFRONT Panamá (datos oficiales de cruces), InSight Crime sobre Clan del Golfo, reportajes de El Tiempo / La Silla Vacía / Mongabay, informes de MSF/UNICEF en Bajo Chiquito

### C6. Travesías históricas y modernas: del Vasco Núñez al kayak de mar contemporáneo
- **ID sugerido:** `aventura-f1-travesias-historicas`
- **Slug:** `travesias-historicas-darien-kayak`
- **Definición canónica:** El Darién fue cruzado de Atlántico a Pacífico por Vasco Núñez de Balboa en 1513 — guiado por caciques locales, 25 días para 60 km lineales, según la crónica coetánea de Bartolomé de las Casas (*Historia de las Indias*, Tomo IV). Lionel Wafer, cirujano bucanero abandonado en el istmo en 1681, produjo el primer relato etnográfico europeo detallado de los Cuna/Kuna tras vivir entre ellos, complementando las crónicas cortesanas con observación directa del clima, los ríos y la cultura. En el siglo XX las expediciones Land Rover (1960) y Range Rover (1972, dirigida por el Col. John Blashford-Snell: 59 británicos + 70 militares panameños y colombianos, 100 días) demostraron que la ruta terrestre exige un ejército, haciéndola inviable para el individuo. En el siglo XXI la ruta marítima quedó documentada en travesías verificables: Freya Hoffmeister pasó por Guna Yala/San Blas en 2013 durante su circunnavegación solo de Sudamérica en kayak (15.300 km, con escolta naval colombiana en tramos de riesgo criminal), y Keifer Edelmayer completó Gatún → Capurganá en 21 días en octubre de 2023 con documentación operativa detallada del caso base. La lección de 500 años es consistente: el éxito no es del más fuerte sino de quien pidió guía local y respetó la ventana climática.
- **Prerrequisitos:** C1, C2, C3
- **Pistas de fuentes a investigar:** Hugh Thomas "El Imperio Español", relato original de Wafer, archivo de la BBC sobre las expediciones Land Rover, blogs/libros de Doba/Hoffmeister/Curgenven, canales de YouTube de kayak de expedición (a curar)

### C7. Logística operativa: kayak, autonomía, comunicaciones, permisos
- **ID sugerido:** `aventura-f1-logistica-operativa`
- **Slug:** `logistica-kayak-darien`
- **Definición canónica:** Una travesía realista por la costa Caribe del Darién (~150 km lineales Capurganá → Puerto Obaldía con paradas en Guna Yala) exige kayak de mar de 16–18 ft con bulkheads y skirt — NDK Explorer, P&H Scorpio MK II o Current Designs Karla son estándar de la categoría, todos ~US$ 4.500+, con spec de "expediciones en aguas remotas". La autonomía requerida es agua para 3 días entre cachés, comida liofilizada para 7–10 días, comunicación satelital obligatoria (Garmin InReach Mini 2 o ZOLEO: no hay cobertura celular en franjas largas después de San Blas), bombeo de achique manual de respaldo, signal mirror, bengalas o pistola de señales calibre 10 (resistente a humedad), PLB independiente del InReach, y botiquín para fauna marina e infección de heridas tropicales. Los permisos son tres en orden: reporte de salida vía Check-Mig pre-registro + trámite en persona en Migración Colombia Capurganá; autorización escrita del Congreso General Guna para ingresar a la comarca con sus tasas; ingreso formal a Panamá por puesto marítimo en Puerto Obaldía cumpliendo los requisitos del SNM (pasaporte ≥3 meses, solvencia de B/. 500, Tarjeta E/S que se resuelve en persona porque no hay carrier que la emita para un kayakista autopropulsado). Algunos seguros (Global Rescue, IMG Patriot Platinum) cubren evacuación marítima con activación vía SOS de InReach, pero el alcance real varía por póliza y hay que verificarlo caso por caso antes de zarpar — el seguro estándar de viaje no cubre. Las competencias mínimas del líder de la travesía están formalizadas en el ACA Level 3 Coastal Kayaking Trip Leader (programa que cierra el 31-dic-2026 en la transición al nuevo Leader Pathway).
- **Prerrequisitos:** C1, C3, C5
- **Pistas de fuentes a investigar:** sitios oficiales de Migración Colombia y SNM Panamá, comparativos de kayak de expedición (Sea Kayaker Magazine, Paddling.com), foros de kayakers que cruzaron, reseñas de InReach/PLB

### C8. Fauna marina peligrosa y salud tropical en el Caribe sur
- **ID sugerido:** `aventura-f1-fauna-salud-tropical`
- **Slug:** `fauna-salud-tropical-caribe-sur`
- **Definición canónica:** Concepto de **prevención antes de zarpar**, no de respuesta médica reactiva — en una travesía corta el peso y el tiempo no están para improvisar medicina. La fauna de riesgo se estratifica: (a) cocodrilo americano (*Crocodylus acutus*) en bocas del Atrato, esteros y manglares, activo al amanecer y atardecer; (b) medusas y cubomedusas — especialmente carabela portuguesa (*Physalia physalis*) en aguas abiertas, cuyo protocolo correcto es inmersión en agua caliente 40–45°C por 20–45 min (el vinagre al 5% favorece la descarga de nematocistos y está desaconsejado para esta especie según la Wilderness & Environmental Medicine); (c) insectos vectores: *Aedes aegypti* con dengue/zika/chikungunya/Oropouche (brote activo en Darién con 265+ casos confirmados en 2025), y flebotominos *Lutzomyia trapidoi* como vector principal de *Leishmania panamensis* con tasa de infección del 9–12% y picos en estación lluviosa, endémicos en toda la franja costera. La quimioprofilaxis antimalárica es recomendada por CDC Yellow Book 2024 para Darién, comarcas Emberá-Wounaan y Guna Yala (no para el área estricta del Canal), y la vacuna de fiebre amarilla es obligatoria por normativa panameña y urgente dado el brote colombiano 2025 con 53 casos confirmados y 21 muertes documentados por PAHO fuera de la cuenca amazónica. La prevención operativa es DEET o picaridina + ropa tratada con permetrina + evitar campamentos cerca de palmares al atardecer + fotoprotección extrema (espejo de mar, dorso de manos y cuello) + hidratación electrolítica de 1,5–2 L/h remando al mediodía + higiene rigurosa de heridas (cualquier corte en agua salada tropical se infecta rápido). Para granularidad epidemiológica municipal (Acandí, Unguía, Juradó, Bajo Baudó) el insumo vivo es el Boletín Epidemiológico Semanal del INS Colombia, a consultar dentro de los 60 días previos al viaje.
- **Prerrequisitos:** C1, C7
- **Pistas de fuentes a investigar:** Ministerio de Salud de Colombia y Panamá (perfil epidemiológico Darién/Urabá), WHO International Travel and Health, CDC Yellow Book (capítulo Central/South America), INVEMAR (fauna marina caribe sur), papers sobre leishmaniasis en Darién (Valderrama et al.), guías de medicina de expedición (Wilderness Medicine Auerbach)

### C9. Riesgo, decisión y rescate: el plan B realista
- **ID sugerido:** `aventura-f1-riesgo-rescate`
- **Slug:** `riesgo-rescate-darien`
- **Definición canónica:** Síntesis operativa de la fase. Tres categorías de riesgo, tres protocolos distintos: (a) **náutico** — vuelco, hipotermia leve, marejada inesperada, falla de equipo: self-rescue + roll + comunicación inmediata por InReach; el SOS no llama directo a un helicóptero sino a un coordinador en Texas (Garmin Response, ex-GEOS IERCC integrado en 2021) que negocia con SENAN Panamá o DIMAR Colombia según GPS, con tiempos de rescate aéreo documentados en Caribe sur de 6–24 h. (b) **médico** — corte profundo, deshidratación, picadura grave, fractura: estabilizar y activar PLB independiente; el punto de extracción más cercano y la cobertura real del seguro de evacuación definen decisión. (c) **humano** — el State Department clasifica Darién y Mosquito Coast como Nivel 4 "do-not-travel", mientras Guna Yala queda fuera del Nivel 4; el protocolo ante encuentro hostil con armados es no resistir, no negociar, ceder bienes — este riesgo no se mitiga con habilidad de remar sino con ruta y horarios decididos en tierra antes de zarpar. La decisión clave del cruce: **abortar es siempre una opción válida**, y debe estar pre-comprometida por escrito antes de zarpar con criterios objetivos (ventana climática se cierra, equipo crítico falla, encuentro humano hostil, lesión que comprometa remo). La literatura de expedición es convergente: Gonzales documenta el *plan-continuation bias* como causa principal de fatalidades en paddlers competentes, Will Gadd insiste en que "la calidad de una decisión se juzga por el proceso, no por el resultado", y los AARs canónicos de Sea Kayaker (Broze/Gronseth) muestran que los sobrevivientes de accidentes mayores abortaron a tiempo. El caso base operativo verificable de esta ruta es Edelmayer 2023: 21 días Gatún → Capurganá siguiendo todos estos protocolos en orden; su trip report es la lectura obligatoria antes de cualquier intento propio.
- **Prerrequisitos:** C5, C6, C7, C8
- **Pistas de fuentes a investigar:** manuales BCU/ACA de seguridad en kayak de mar, AAR (after action reports) de expediciones que abortaron, protocolos de Servicio Nacional Aeronaval Panamá

---

## Recursos (51) — curados 2026-04-23

> Curados vía 9 agentes de investigación paralelos (1 por concepto), URL verificada con WebFetch. Idioma mixto es/en con sesgo español (Q3): ~15 recursos en español, ~36 en inglés — el desbalance refleja la distribución real de la fuente (material operativo kayak/médico mayormente en inglés; fuentes humanas/indígenas/periodismo colombiano fuertemente en español). 6 categorías: académico/peer-reviewed, oficial/gubernamental, documental broadcast, YouTuber/expedicionista, periodismo long-form, fuente primaria indígena.
>
> Nota sobre verificación: algunas URLs (Wiley, Springer, AMS, State Department, OSAC, ICG PDF, UNESCO whc) devuelven 403 o 302 al User-Agent de WebFetch por anti-scraping — los agentes confirmaron con browser-access o triangulación (DOI, NASA ADS, ScienceDaily mirror). En producción un pipeline de ingestión debe usar User-Agent de navegador. Donde hay riesgo real de link-rot se anota en `Notas`.

> **Estratificación por concepto (enseña):** C1=5 · C2=7 · C3=6 · C4=5 · C5=6 · C6=5 · C7=5 · C8=6 · C9=6. **Duplicados gestionados:** Edelmayer (propuesto por agentes C1/C6/C9) ancla en C9; Reglamento Turismo Gunayala (C3/C7) ancla en C3; Mongabay Radwin 2025 (C2/C4) se usa la versión ES. Todos los recursos duplicados se mapean a sus conceptos secundarios vía `is_prerequisite=FALSE refuerza` en `resource_concepts`.

---

### C1 — Oceanografía Caribe sur (5 recursos)

### R1. PAPER — Gulf of Urabá (Caribbean Colombia), a Tropical Estuary: A Review
- **ID sugerido:** `aventura-r-uraba-tropical-estuary-review`
- **Tipo:** `paper` · **Autor:** Contreras-Fernández et al. (U. Antioquia, INVEMAR) · **URL:** https://link.springer.com/article/10.1007/s12601-022-00093-9 (DOI: 10.1007/s12601-022-00093-9)
- **Fecha / páginas:** 2022, Ocean Science Journal 57:556–575 · ~20 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C1 · **Refuerza:** C7, C9
- **Notas:** Review peer-reviewed más completo del golfo como sistema estuarino (1.800 km², pluma Atrato, hipoxia, algas tóxicas). Springer 403 al fetch bot — URL canónica y DOI confirmados. Versión abierta en ResearchGate si hace falta.

### R2. PAPER — Caribbean Current Eddies on Coastal Circulation (Panamá-Colombia Gyre)
- **ID sugerido:** `aventura-r-kastner-pcg-eddies-2024` · **Tipo:** `paper` · **Autor:** Kastner, Pawlak, Giddings, Adelson, Collin, Davis (Scripps + STRI)
- **URL:** https://journals.ametsoc.org/view/journals/phoc/54/10/JPO-D-24-0049.1.xml (DOI: 10.1175/JPO-D-24-0049.1) · **Fecha:** 2024, JPO 54(10) · ~25 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C1 · **Refuerza:** C9
- **Notas:** Caracteriza el giro Panamá-Colombia y cómo remolinos de la Corriente del Caribe modulan corrientes costeras hasta factor 2 en ciclos ~116 días — crítico para elegir ventana.

### R3. PAPER OFICIAL — Circulación oceánica del Golfo de Urabá (viento de alta resolución)
- **ID sugerido:** `aventura-r-toro-circulacion-uraba-cioh` · **Tipo:** `paper` · **Autor:** Toro, Mosquera, Barrientos, Bedoya (CIOH–DIMAR)
- **URL:** https://ojs.dimar.mil.co/index.php/CIOH/article/view/516 · **Fecha:** 2019, Boletín CIOH 38(2) · ~15 pp · **Idioma:** `es` · **Categoría:** académico / oficial
- **Enseña:** C1 · **Refuerza:** C7
- **Notas:** Fuente oficial colombiana en español, directamente sobre el GU. Divide el golfo en 3 zonas dinámicas según viento. Open access DIMAR.

### R4. PERIODISMO — Frank Wolf Rounds The Darien Gap
- **ID sugerido:** `aventura-r-frank-wolf-darien-paddlingmag` · **Tipo:** `article` · **Autor:** Frank Wolf (Paddling Magazine)
- **URL:** https://paddlingmag.com/stories/columns/fathom/darien-gap/ · **Fecha:** Ago 2024 · ~15 min · **Idioma:** `en` · **Categoría:** periodismo / crónica expedición
- **Enseña:** C1 · **Refuerza:** C2, C6, C7, C9
- **Notas:** Crónica de travesía Colón → Turbo (500 km) en kayak de mar incluyendo delta Atrato con tormenta nocturna. Narrativa, no datos cuantitativos — complemento vivencial al paper R1.

### R5. DATASET / CARTOGRAFÍA OFICIAL — Publicaciones Náuticas DIMAR Caribe
- **ID sugerido:** `aventura-r-dimar-derroteros-caribe` · **Tipo:** `article` · **Autor:** DIMAR / CIOH Colombia
- **URL:** https://cioh.dimar.mil.co/index.php/es/publicaciones-nauticas · **Idioma:** `es` · **Categoría:** mapa/dataset
- **Enseña:** C1 · **Refuerza:** C7, C9
- **Notas:** Derroteros del Caribe (3 volúmenes) + Lista de Luces + Avisos a Navegantes. Cartas individuales vía Capitanías de Puerto, no todas en PDF libre. Única cartografía náutica oficial vigente.

---

### C2 — Tapón del Darién (7 recursos)

### R1. PAPER — Minding the Gap: Pan-Americanism's Highway and American Environmentalism
- **ID sugerido:** `aventura-r-miller-minding-the-gap` · **Tipo:** `paper` · **Autor:** Shawn W. Miller (BYU)
- **URL:** https://www.journals.uchicago.edu/doi/full/10.1093/envhis/emu002 (DOI: 10.1093/envhis/emu002) · **Fecha:** 2014, Environmental History 19(2) · 28 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C2 · **Refuerza:** C1, C5, C6
- **Notas:** EL paper académico de referencia sobre por qué la Panamericana nunca se cerró: Pan-americanismo, demanda Sierra Club 1975, veto fitosanitario, memoria del "fracaso". Wiley 403 a bots, DOI canónico.

### R2. PAPER — Tree Biomass and Species Richness of Mature Tropical Forests, Darien
- **ID sugerido:** `aventura-r-stri-darien-carbon-2019` · **Tipo:** `paper` · **Autor:** Mateo-Vega, Arroyo-Mora, Potvin (STRI / McGill)
- **URL:** https://conbio.onlinelibrary.wiley.com/doi/10.1111/csp2.42 (DOI: 10.1111/csp2.42) · **Fecha:** 2019, Conservation Science & Practice · ~14 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C2 · **Refuerza:** C1, C4
- **Notas:** Base empírica peer-reviewed de "la no-carretera conservó algo único": stocks de carbono más altos y 2ª mayor riqueza arbórea entre 9 sitios neotropicales. Mirror en ScienceDaily: https://www.sciencedaily.com/releases/2019/07/190719102122.htm

### R3. ARTICLE — The Pan-American Highway and the Darién Gap (JSTOR Daily)
- **ID sugerido:** `aventura-r-jstor-daily-panam-highway` · **Tipo:** `article` · **Autor:** Matthew Wills (JSTOR Daily)
- **URL:** https://daily.jstor.org/the-pan-american-highway-and-the-darien-gap/ · **Fecha:** Nov 2022 (actualizado 2025) · ~3 min · **Idioma:** `en` · **Categoría:** periodismo divulgación académica
- **Enseña:** C2 · **Refuerza:** C6
- **Notas:** Puerta de entrada al paper de Miller R1. JSTOR Daily tiene estándar editorial alto; cita directa al trabajo académico.

### R4. ARTICLE — IUCN World Heritage Outlook: Darién National Park (2025)
- **ID sugerido:** `aventura-r-iucn-darien-outlook` · **Tipo:** `article` · **Autor:** IUCN World Heritage Outlook
- **URL:** https://worldheritageoutlook.iucn.org/node/972 · **Fecha:** Assessment 11-oct-2025 · ~20 pp equivalente · **Idioma:** `en` · **Categoría:** oficial / académico
- **Enseña:** C2 · **Refuerza:** C1, C3, C4
- **Notas:** Evaluación técnica más autoritativa y actualizada. Rating "Significant concern". 533 especies aves, pérdida 21.500 ha bosque primario 2002–2023, amenaza Panamericana. Reemplaza con ventaja al PDF UNESCO (403 a bot).

### R5. PERIODISMO — Panamá refuerza protección en el Tapón del Darién (Mongabay ES)
- **ID sugerido:** `aventura-r-mongabay-radwin-darien-2025` · **Tipo:** `article` · **Autor:** Maxwell Radwin (Mongabay Latam)
- **URL:** https://es.mongabay.com/2025/09/darien-tapon-panama-deforestacion-proteccion/ · **Fecha:** Sep 2025 · ~15 min · **Idioma:** `es` · **Categoría:** periodismo
- **Enseña:** C2 · **Refuerza:** C3, C4, C5
- **Notas:** Versión en español (sesgo Q3). Datos del director de áreas protegidas Panamá: 106 km de gap Yaviza, moratoria maderera 2029, 300k t residuos migratorios, $70M puente Tuira/Chucunaque. Par con entrevista a Luis Carles Rudy.

### R6. DOCUMENTAL BROADCAST — Outside/In: The Darien Gap (NHPR podcast)
- **ID sugerido:** `aventura-r-outside-in-darien-gap` · **Tipo:** `video` (audio-doc; Jarre lo soporta como `video`)
- **Autor:** Sam Evans-Brown, Justine Paradis, Taylor Quimby (New Hampshire Public Radio) · **URL:** http://outsideinradio.org/transcript-the-darien-gap · **Duración:** ~30 min + transcript · **Idioma:** `en` · **Categoría:** documental broadcast
- **Enseña:** C2 · **Refuerza:** C1, C3, C4, C5
- **Notas:** El único documental de audio que cubre las 3 capas del Tapón a la vez: biología (coyote cruzando por primera vez a Sudamérica), migración, resistencia indígena (Héctor Huertas y Alicia Korten sobre Banco Mundial). Ángulo indígena único.

### R7. DOCUMENTAL BROADCAST — PBS: What Migrants Face in the Darién Gap (Pulitzer)
- **ID sugerido:** `aventura-r-pbs-drost-darien` · **Tipo:** `video` · **Autor:** Nadja Drost (Pulitzer 2021), Bruno Federico — PBS NewsHour + Pulitzer Center
- **URL:** https://www.pbs.org/newshour/show/what-migrants-face-as-they-journey-through-the-deadly-darien-gap · **Fecha:** Ago 2020 · ~13 min · **Idioma:** `en` (subs disponibles) · **Categoría:** documental broadcast
- **Enseña:** C2 (dimensión consecuencial) · **Refuerza:** C5
- **Notas:** Reportaje inmersivo ganador del Pulitzer 2021 por International Reporting. Sostiene el "por qué es tan peligroso" sin el sensacionalismo de NatGeo Primal Survivor.

---

### C3 — Guna Yala (6 recursos)

### R1. FUENTE PRIMARIA INDÍGENA — Reglamento de Turismo de Gunayala
- **ID sugerido:** `aventura-r-reglamento-turismo-gunayala` · **Tipo:** `article` · **Autor:** Congreso General Guna (Onmaggeddummad Sunmaggaled)
- **URL:** https://www.gunayala.org.pa/Reglamento%20de%20Turismo.htm · **Fecha:** 2017 (vigente) · ~15–20 pp equivalente · **Idioma:** `es` · **Categoría:** fuente primaria indígena
- **Enseña:** C3 · **Refuerza:** C7 (tasas/permisos), C9 (reglas de anclaje)
- **Notas:** FUENTE PRIMARIA INDÍGENA VIVA. Art. 28 (autorización escrita obligatoria para yates), art. 29 (estadía máx 30 días), art. 37 (tasas $10 anclaje + $2/persona + $10 comunidad), Secretaría de Turismo en Gaigirgordup. Documento operacional que cualquier kayakista DEBE leer.

### R2. FUENTE PRIMARIA INDÍGENA — Gunayala en Resumen
- **ID sugerido:** `aventura-r-gunayala-resumen-oficial` · **Tipo:** `article` · **Autor:** Anelio Merry López (Depto. Comunicación, Congreso General Guna)
- **URL:** https://www.gunayala.org.pa/gunayala_en_resumen.htm · **Páginas:** ~8–10 equivalente · **Idioma:** `es` · **Categoría:** fuente primaria indígena
- **Enseña:** C3 · **Refuerza:** C6, C7
- **Notas:** Estructura dual de gobierno (Congreso General político + Congreso General de la Cultura espiritual), autoridades tradicionales, 51 comunidades en 3.206 km². Complementa R1 con marco institucional.

### R3. BOOK ACADÉMICO — A People Who Would Not Kneel: Panama, the US, and the San Blas Kuna
- **ID sugerido:** `aventura-r-howe-people-who-would-not-kneel` · **Tipo:** `book` · **Autor:** James Howe (MIT)
- **URL:** https://www.amazon.com/PEOPLE-WHO-WOULD-NOT-KNEEL/dp/1560988657 · **Fecha:** 1998, Smithsonian Institution Press · 390 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C3 · **Refuerza:** C2, C6
- **Notas:** Obra canónica sobre la Revolución Dule de 1925. Richard Marsh, Nele Kantule, Simral Colman, cómo los Guna ganaron autonomía militarmente. Por qué NO se trata la comarca como "Panamá estándar".

### R4. BOOK ACADÉMICO — Chiefs, Scribes, and Ethnographers: Kuna Culture from Inside and Out
- **ID sugerido:** `aventura-r-howe-chiefs-scribes` · **Tipo:** `book` · **Autor:** James Howe (UT Press 2009)
- **URL:** https://utpress.utexas.edu/9780292725713/ · 360 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C3 · **Refuerza:** C4, C6
- **Notas:** Los Guna como co-autores de su propia etnografía, caso único en América. Importante para la ética del contacto: no son "pueblo estudiado", son "pueblo con historiografía propia".

### R5. DOCUMENTAL BROADCAST + FUENTE INDÍGENA — Bila Burba
- **ID sugerido:** `aventura-r-bila-burba-documental` · **Tipo:** `video` · **Autor/Canal:** Duiren Wagua (cineasta guna, comunidad Koskuna); Utopia Docs; TVN Panamá oct-2025
- **URL:** https://letterboxd.com/film/bila-burba/ (ficha; IMDb https://www.imdb.com/title/tt30225315/) · **Duración:** 70 min · **Idioma:** `es` (con dulegaya) · **Categoría:** fuente primaria indígena audiovisual + documental broadcast
- **Enseña:** C3 · **Refuerza:** C6, C9
- **Notas:** Director guna. Estreno IDFA 2023, Premio del Público Panama International Film Festival 2024, emisión TVN. Revolución Dule 1925 con reenactment comunitario. Narrativa indígena producida por guna.

### R6. ARTICLE — Kuna General Congress and the Statute on Tourism (Cultural Survival)
- **ID sugerido:** `aventura-r-cultural-survival-statute-tourism` · **Tipo:** `article` · **Autor:** Stephen G. Snow (Cultural Survival Quarterly)
- **URL:** https://www.culturalsurvival.org/publications/cultural-survival-quarterly/kuna-general-congress-and-statute-tourism · **Fecha:** Abr 2010 · ~8 pp · **Idioma:** `en` · **Categoría:** periodismo académico
- **Enseña:** C3 · **Refuerza:** C7, C9
- **Notas:** Análisis del Estatuto de Turismo incorporado a la Ley Fundamental. Crítico lúcido de la brecha entre normativa e implementación. Seguir la norma NO es opcional.

---

### C4 — Emberá y Wounaan (5 recursos)

### R1. PAPER (con coautoría indígena) — Construcción naval emberá y wounaan en Panamá
- **ID sugerido:** `aventura-r-naval-embera-wounaan-espiga` · **Tipo:** `paper`
- **Autor:** Abner Alberda, Rita Liss Ramos-Pérez, Bienvenido Cunampio, Emma Gómez, Chivio Mémbora-Peña (U. Panamá) — Revista Espiga (UNED Costa Rica)
- **URL:** https://revistas.uned.ac.cr/index.php/espiga/article/view/5587 · **Fecha:** 2024, Vol. 23(48) · ~42 pp · **Idioma:** `es` · **Categoría:** académico con coautoría indígena
- **Enseña:** C4 · **Refuerza:** C2, C6
- **Notas:** Paper 2024 open access con coautoría wounaan/emberá. Trata la jãba (piragua) en ecosistemas fluviales y marítimos. Exactamente el punto "movilidad fluvial no terrestre".

### R2. ARTICLE ACADÉMICO — Chocó Indian Relocation in Darién (Herlihy)
- **ID sugerido:** `aventura-r-herlihy-choco-relocation-cs` · **Tipo:** `article` · **Autor:** Peter H. Herlihy (Cultural Survival Quarterly)
- **URL:** https://www.culturalsurvival.org/publications/cultural-survival-quarterly/choco-indian-relocation-darien-panama · ~8 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C4 · **Refuerza:** C6
- **Notas:** El mejor artículo corto para entender "dispersión fluvial tradicional → aldeas nucleadas → comarca". Pista original del brief decía "Kevin Herlihy"; es Peter H. Herlihy (LSU PhD 1986, LA referencia).

### R3. PERIODISMO — Estrategia indígena para proteger el Tapón del Darién (Mongabay)
- **ID sugerido:** `aventura-r-mongabay-bilbao-estrategia-darien` · **Tipo:** `article` · **Autor:** Guido Bilbao (Mongabay Latam / Pulitzer Center)
- **URL:** https://es.mongabay.com/2019/06/indigenas-panama-darien-video/ · **Fecha:** Jun 2019 · artículo largo + video 10–12 min · **Idioma:** `es` · **Categoría:** periodismo
- **Enseña:** C4 · **Refuerza:** C2, C5
- **Notas:** Emberá-wounaan defendiendo 650.000 ha con drones, GPS, abogados. Destruye estereotipo pasivo-exótico. Ética del contacto: comunidades víctimas del tráfico ilícito, no cómplices.

### R4. PAPER — Emberá Indigenous Tourism and the Trap of Authenticity
- **ID sugerido:** `aventura-r-theodossopoulos-trap-authenticity` · **Tipo:** `paper` · **Autor:** Dimitrios Theodossopoulos (Anthropology Quarterly)
- **URL:** https://kar.kent.ac.uk/34014/ (AAM PDF open access) · **Fecha:** 2013, AQ 86(2) · ~30 pp · **Idioma:** `en` · **Categoría:** académico
- **Enseña:** C4 (ética del contacto) · **Refuerza:** C3
- **Notas:** Piedra angular para ética del contacto sin romantizar ni exotizar. Cómo pensar el encuentro sin caer en "descubrí algo prístino" ni en "ya están todos corrompidos".

### R5. OFICIAL — Ley Nº 72 de 2008 (tierras colectivas fuera de comarcas, Panamá)
- **ID sugerido:** `aventura-r-ley-72-2008-tierras-colectivas` · **Tipo:** `article` · **Autor:** Asamblea Nacional de Panamá (ficha ECOLEX/FAOLEX)
- **URL:** https://www.ecolex.org/details/legislation/ley-no-72-procedimiento-para-la-adjudicacion-de-la-propiedad-colectiva-de-tierras-de-los-pueblos-indigenas-que-no-estan-dentro-de-las-comarcas-lex-faoc095794/ (PDF: https://faolex.fao.org/docs/pdf/pan95794.pdf) · ~4 pp · **Idioma:** `es` · **Categoría:** oficial normativo
- **Enseña:** C4 · **Refuerza:** C3
- **Notas:** Ley para comunidades emberá-wounaan COSTERAS (fuera de Cémaco/Sambú que son interiores). Exactamente las que toca un kayakista en bocas de río. Distinción clave comarca vs tierra colectiva.

---

### C5 — Migración y Clan del Golfo (6 recursos)

### R1. THINKTANK — ICG Report 102: Bottleneck of the Americas
- **ID sugerido:** `aventura-r-crisis-group-darien-bottleneck` · **Tipo:** `article`
- **Autor:** International Crisis Group (Bram Ebus) · **URL ES:** https://www.crisisgroup.org/sites/default/files/2023-11/102-darien-gap-spanish.pdf · **EN:** https://www.crisisgroup.org/latin-america-caribbean/andes/colombia-central-america/102-bottleneck-americas-crime-and-migration
- **Fecha:** Nov 2023 · ~30 pp · **Idioma:** `es` (primaria, sesgo Q3) · **Categoría:** thinktank/análisis
- **Enseña:** C5 · **Refuerza:** C4, C7, C9
- **Notas:** EL reporte de referencia sobre estructura criminal del Darién. Circuito Necoclí → Capurganá → trochas Clan → Bajo Chiquito → Lajas Blancas. Cobro ~USD 125/persona. Marco analítico base.

### R2. THINKTANK — GI-TOC: On the Border — The Gulf Clan in Darién
- **ID sugerido:** `aventura-r-gitoc-gulf-clan-darien` · **Tipo:** `article`
- **Autor:** Cajiao, Tobo, Botero Restrepo (Global Initiative Against Transnational Organized Crime)
- **URL:** https://globalinitiative.net/wp-content/uploads/2022/11/Andre%CC%81s-Cajiao-Paula-Tobo-Mariana-Botero-Restrepo-On-the-border-The-Gulf-Clan-irregular-migration-and-organized-crime-in-Darie%CC%81n-GI-TOC-November-2022.pdf · **Fecha:** Nov 2022 · ~40 pp · **Idioma:** `en` · **Categoría:** thinktank/análisis
- **Enseña:** C5 · **Refuerza:** C2, C7, C9
- **Notas:** Clan del Golfo (AGC) como "regulador" del corredor. Economía extractiva Necoclí/Capurganá/Sapzurro/Acandí. "Impuesto 20%" a conductores. Arquitectura de control sigue vigente.

### R3. ONG HUMANITARIA — HRW Neglected in the Jungle (2024)
- **ID sugerido:** `aventura-r-hrw-neglected-jungle-darien` · **Tipo:** `article` · **Autor:** Human Rights Watch
- **URL:** https://www.hrw.org/report/2024/04/03/neglected-jungle/inadequate-protection-and-assistance-migrants-and-asylum-seekers · **Fecha:** Abr 2024 · ~80 pp · **Idioma:** `en` (resumen es) · **Categoría:** ONG humanitaria
- **Enseña:** C5 · **Refuerza:** C4, C9
- **Notas:** Reporte post-récord 2023 con 300+ entrevistas a migrantes. Ausencia de estrategia colombiana de protección. Capurganá como "punto de entrada" controlado por Clan.

### R4. PERIODISMO — "Es peor que el Darién": ruta marítima vuelta (Infobae/BBC)
- **ID sugerido:** `aventura-r-infobae-peor-que-darien-maritima` · **Tipo:** `article` · **Autor:** Jimmy Nomesqui Rivera (Infobae; replica BBC Mundo)
- **URL:** https://www.infobae.com/colombia/2025/03/07/es-peor-que-el-darien-el-relato-de-los-migrantes-que-vuelven-a-colombia-via-maritima/ · **Fecha:** Mar 2025 · **Idioma:** `es` · **Categoría:** periodismo
- **Enseña:** C5 · **Refuerza:** C1, C3, C9
- **Notas:** **La pieza más cercana al cruce en kayak.** Rutas marítimas 2025: Miramar/Colón → Guna Yala → Puerto Obaldía (9h), Cartí → Puerto Obaldía (7h). Naufragios, alisios ene-abr, motores fallando. Evidencia de que esa costa mata embarcaciones motorizadas — para kayak el riesgo es cualitativamente mayor.

### R5. THINKTANK — InSight Crime: How Organized Crime Profits from Migration
- **ID sugerido:** `aventura-r-insightcrime-darien-profit` · **Tipo:** `article` · **Autor:** Lizcano Villalba, Ballestin (InSight Crime)
- **URL:** https://insightcrime.org/news/organized-crime-profits-migrants-darien-gap/ · **Fecha:** Nov 2022 (act. Feb 2024) · **Idioma:** `en` · **Categoría:** thinktank
- **Enseña:** C5 · **Refuerza:** C7, C9
- **Notas:** Urabeños/Gaitanistas en Acandí. Cobros USD 50/guía. Uso de migrantes como mulas de cocaína. Casos judiciales concretos. Complemento a ICG y GI-TOC.

### R6. OFICIAL — Servicio Nacional de Migración Panamá: Tránsito Irregular
- **ID sugerido:** `aventura-r-senafront-transito-irregular` · **Tipo:** `article` · **Autor:** SNM Panamá (datos SENAFRONT)
- **URL:** https://www.migracion.gob.pa/estadisticas/ · **Actualización:** mensual, último confirmado mar-2026 · **Idioma:** `es` · **Categoría:** oficial
- **Enseña:** C5 · **Refuerza:** C9
- **Notas:** Única fuente primaria de cifras. Serie 2010–2026 mensual. Permite contrastar "520k en 2023", "302k en 2024", caída 94% en 2025 tras cierre Mulino + Guna Yala. Complementar con Datos Abiertos Panamá.

---

### C6 — Travesías históricas (5 recursos)

### R1. FUENTE PRIMARIA HISTÓRICA — Wafer: A New Voyage and Description of the Isthmus of America
- **ID sugerido:** `aventura-r-wafer-isthmus-1699` · **Tipo:** `book` · **Autor:** Lionel Wafer (cirujano bucanero, 1660?–1705?)
- **URL:** https://archive.org/details/newvoyagedescrip03wafe · **Fecha:** 1729 (edición con material de 1699) · ~260 pp · **Idioma:** `en` · **Categoría:** fuente primaria histórica
- **Enseña:** C6 · **Refuerza:** C1, C3, C4
- **Notas:** Primer relato etnográfico europeo detallado de los Cuna/Kuna. Vocabulario comparado, costumbres, clima, ríos. Archive.org libre.

### R2. FUENTE PRIMARIA HISTÓRICA — Las Casas: Historia de las Indias, Tomo IV
- **ID sugerido:** `aventura-r-las-casas-historia-indias-iv` · **Tipo:** `book` · **Autor:** Fray Bartolomé de las Casas
- **URL:** https://www.gutenberg.org/files/56283/56283-h/56283-h.htm · **Fecha:** Edición Madrid 1875 (manuscrito s. XVI) · Tomo IV completo · **Idioma:** `es` · **Categoría:** fuente primaria histórica
- **Enseña:** C6 · **Refuerza:** C3, C9
- **Notas:** Crónica coetánea de la expedición Balboa al Mar del Sur, 25-sep-1513. Caps. 39–77 del Tomo IV cubren Darién. Project Gutenberg HTML libre, dominio público.

### R3. ACADÉMICO HISTÓRICO — Sauer: The Early Spanish Main
- **ID sugerido:** `aventura-r-sauer-early-spanish-main` · **Tipo:** `book` · **Autor:** Carl O. Sauer (UC Berkeley, geógrafo histórico)
- **URL:** https://archive.org/details/earlyspanishmain00saue_0 · **Fecha:** 1966, UC Press · 330 pp · **Idioma:** `en` · **Categoría:** académico histórico
- **Enseña:** C6 · **Refuerza:** C1, C2, C3
- **Notas:** Capítulo "Entry to Darién and the South Sea (1511–1514)". Combina crónicas coloniales con geografía física. Par natural con Las Casas (R2) y Wafer (R1).

### R4. DOCUMENTAL TEXTUAL — Blashford-Snell: The Darién Conquest
- **ID sugerido:** `aventura-r-blashford-snell-darien-conquest` · **Tipo:** `article` · **Autor:** Col. John Blashford-Snell CBE (líder expedición Range Rover 1972)
- **URL:** https://www.bradtguides.com/the-darien-conquest-crossing-the-gap/ · **Fecha:** 13-oct-2022 (aniversario 50°) · ~3.000 palabras · **Idioma:** `en` · **Categoría:** documental broadcast (sustituto textual)
- **Enseña:** C6 · **Refuerza:** C2, C7, C9
- **Notas:** Relato primera mano. 59 británicos + 40 Guardia Nacional panameña + 30 militares colombianos, 2 Range Rovers, 100 días. Demostración operativa de que cruce terrestre exige ejército. El film "Darien Conquest" (1971, ACMI 66601) no digitalizado.

### R5. BLOG EXPEDICIONISTA — Freya Hoffmeister: South America Plan & Facts
- **ID sugerido:** `aventura-r-hoffmeister-south-america-plan` · **Tipo:** `article` · **Autor:** Freya Hoffmeister (primera circunnavegación solo de Sudamérica en kayak, 2011–2015)
- **URL:** https://www.freyahoffmeister.com/expeditions/south-america-2011-15/plan-and-facts-sa/plan-and-facts-sa-english · **Idioma:** `en` · **Categoría:** YouTuber/expedicionista
- **Enseña:** C6 · **Refuerza:** C1, C3, C7, C9
- **Notas:** Sitio oficial activo. Logs cronológicos 2012–2013 pasando por costa pacífica colombiana, Canal, San Blas/Guna Yala. Etapa 2 finalizó en caribe colombiano 6-may-2013 tras 15.300 km con escolta naval. Demostración empírica contemporánea de viabilidad.

> Nota: Edelmayer 2023 (kayak Panamá→Colombia por Darién Gap) fue propuesto por los agentes de C1/C6/C9 como recurso compartido. Ancla en **C9** como caso base operativo síntesis — `refuerza` C1, C6.

---

### C7 — Logística operativa (5 recursos)

### R1. OFICIAL — SNM Panamá: Requisitos para Turistas
- **ID sugerido:** `aventura-r-snm-panama-requisitos-turistas` · **Tipo:** `article` · **Autor:** Servicio Nacional de Migración de Panamá
- **URL:** https://www.migracion.gob.pa/turistas/ (ver también https://www.migracion.gob.pa/preguntas-frecuentes/) · **Actualización:** Ene 2025 · **Idioma:** `es` · **Categoría:** oficial gubernamental
- **Enseña:** C7 · **Refuerza:** C5, C9
- **Notas:** Pasaporte vigencia ≥3 meses, solvencia B/.500, reserva de salida, Tarjeta E/S de compañía de transporte. Friccional para kayakista autopropulsado — resolver con oficial en Puerto Obaldía. Sitio con historial de rotación — re-fetch cada 6 meses.

### R2. TÉCNICO — Paddling Mag: Best Two-Way Satellite Communicators
- **ID sugerido:** `aventura-r-paddling-mag-satellite-communicators` · **Tipo:** `article` · **Autor:** Paddling Magazine Staff
- **URL:** https://paddlingmag.com/gear/accessories/safety-rescue/satellite-communicators/ · **Fecha:** Ago 2023 · **Idioma:** `en` · **Categoría:** técnico industry
- **Enseña:** C7 · **Refuerza:** C8, C9
- **Notas:** Comparativa directa: Garmin inReach Mini 2 ($399, 14 días batería, IPX7), ZOLEO ($199, IP68), ACR Bivy Stick, SPOT X. Post-integración GEOS→Garmin.

### R3. TÉCNICO — Paddling Mag: Best Touring Kayaks 2026
- **ID sugerido:** `aventura-r-paddling-mag-touring-kayaks-2026` · **Tipo:** `article` · **Autor:** Paddling Magazine
- **URL:** https://paddlingmag.com/boats/kayaks/touring-kayak/ · **Fecha:** Oct 2024 (edición 2026) · **Idioma:** `en` · **Categoría:** técnico industry
- **Enseña:** C7 · **Refuerza:** C1
- **Notas:** NDK Explorer (17'6", $4.585, "circunnavegaciones en aguas remotas"), P&H Scorpio MK II, Current Designs Karla, TRAK 2.0 plegable. Dentro del rango 16–18 ft con bulkheads del brief.

### R4. EXPEDICIONISTA — Freya Hoffmeister: Current Equipment
- **ID sugerido:** `aventura-r-freya-hoffmeister-equipment` · **Tipo:** `article` · **Autor:** Freya Hoffmeister
- **URL:** https://www.freyahoffmeister.com/sponsors/current-equipment · **Actualización:** expedición en curso · **Idioma:** `en` · **Categoría:** YouTuber/expedicionista
- **Enseña:** C7 · **Refuerza:** C8, C9
- **Notas:** Lista granular única de expedición tropical real: Iridium 9555, pistola de señales cartucho cal. 10, Kokatat Gloves "Tropics", MSR Dromedary 4L, LOKSAK OPSAK anti-olor fauna.

### R5. CERTIFICACIÓN — ACA Level 3 Coastal Kayaking Trip Leader
- **ID sugerido:** `aventura-r-aca-l3-coastal-trip-leader` · **Tipo:** `paper` · **Autor:** American Canoe Association
- **URL:** https://americancanoe.org/event/level-3-coastal-kayaking-trip-leader-skills-course/ (complemento: https://americancanoe.org/leader-pathway/) · **Vigencia:** programa CKTL cierra 31-dic-2026 (transición Leader Pathway) · **Idioma:** `en` · **Categoría:** certificación
- **Enseña:** C7 · **Refuerza:** C1, C9
- **Notas:** Marco de competencias mínimas: trip planning, navegación, reparación en campo, rescates, group management. **Re-fetch post-31-dic-2026** cuando retiren el CKTL.

> Nota: Reglamento de Turismo Gunayala (agente C3 y C7) ancla en **C3** como fuente primaria indígena, `refuerza` C7. No duplicar.

---

### C8 — Fauna marina peligrosa y salud tropical (6 recursos)

### R1. OFICIAL INTERNACIONAL — CDC Yellow Book 2024: Panama
- **ID sugerido:** `aventura-r-cdc-yellow-book-panama` · **Tipo:** `article` · **Autor:** CDC Travelers' Health (O'Laughlin, Leidel, Ridpath, Mace)
- **URL:** https://wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/panama · **Edición:** 2024 (vigente, act. incremental 2025/26) · **Idioma:** `en` · **Categoría:** oficial internacional
- **Enseña:** C8 · **Refuerza:** C7, C9
- **Notas:** Fiebre amarilla recomendada para viajeros ≥9 meses al este del Canal (incluye Darién); quimioprofilaxis malaria (atovaquone-proguanil, doxiciclina, mefloquina) para Darién/Emberá/Guna Yala.

### R2. OFICIAL INTERNACIONAL — CDC Traveler: Colombia
- **ID sugerido:** `aventura-r-cdc-colombia-travelers-health` · **Tipo:** `article` · **Autor:** CDC Travelers' Health
- **URL:** https://wwwnc.cdc.gov/travel/destinations/traveler/none/colombia · **Revisión:** 23-mar-2026 · **Idioma:** `en` (hay es en /es/) · **Categoría:** oficial internacional
- **Enseña:** C8 · **Refuerza:** C1, C9
- **Notas:** FA obligatoria para ingreso desde 2025 tras brote Tolima. Malaria <5600 ft (Urabá/Chocó entran). DENV-3 circulando. Leishmaniasis por flebotominos.

### R3. OFICIAL INTERNACIONAL — PAHO/WHO: Yellow Fever Epidemiological Update
- **ID sugerido:** `aventura-r-paho-yellow-fever-americas-2025` · **Tipo:** `paper` · **Autor:** PAHO/WHO Health Emergencies
- **URL:** https://www.paho.org/en/documents/epidemiological-update-yellow-fever-americas-region-24-april-2025 (alerta complementaria: https://www.paho.org/en/news/31-3-2025-paho-issues-new-epidemiological-alert-amid-rising-yellow-fever-cases-americas) · **Fecha:** 24-abr-2025 · ~10 pp · **Idioma:** `en` (también es) · **Categoría:** oficial internacional
- **Enseña:** C8 · **Refuerza:** C2, C9
- **Notas:** Colombia SE 1–15/2025: 53 casos confirmados + 21 muertes FA fuera de Amazonía. Justifica FA no-negociable para Darién. Brote Oropouche concentrado en Darién (265 casos SE 1–29/2025).

### R4. OFICIAL NACIONAL — INS Colombia: Boletín Epidemiológico Semanal
- **ID sugerido:** `aventura-r-ins-colombia-bes` · **Tipo:** `article` · **Autor:** Instituto Nacional de Salud Colombia (MinSalud)
- **URL:** https://www.ins.gov.co/buscador-eventos/Paginas/Vista-Boletin-Epidemilogico.aspx · **Serie:** continua desde 2006 · **Idioma:** `es` · **Categoría:** oficial nacional
- **Enseña:** C8 · **Refuerza:** C2, C4
- **Notas:** **Única fuente con granularidad municipal.** Acandí, Unguía, Juradó, Bajo Baudó — hiperendémica leishmaniasis cutánea. Usar BES del año en curso, dentro de 60 días del viaje. URLs PDF rotan anualmente; índice estable.

### R5. PAPER — Leishmania & Sand Fly Feeding Patterns, Panama (Rigg et al.)
- **ID sugerido:** `aventura-r-rigg-sandflies-panama` · **Tipo:** `paper` · **Autor:** Rigg, Calzada, Saldaña, Perea, Chaves, Valderrama (Instituto Gorgas, Panamá)
- **URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC6447106/ (PMID 30457097, DOI 10.4269/ajtmh.17-0628) · **Fecha:** 2019, AJTMH 100(5) · 8 pp · **Idioma:** `en` · **Categoría:** académico peer-reviewed
- **Enseña:** C8 · **Refuerza:** C2, C4
- **Notas:** Identifica *Lutzomyia trapidoi* como vector principal de *L. panamensis*, 9–12% infección vector, picos en lluvia. Justifica DEET/picaridina + permetrina + evitar palmares al atardecer.

### R6. MANUAL MEDICINA EXPEDICIÓN — Jellyfish Stings: A Practical Approach (WEM)
- **ID sugerido:** `aventura-r-lakkis-jellyfish-practical` · **Tipo:** `paper` · **Autor:** Lakkis, Maalouf, Mahmassani (American U. Beirut)
- **URL:** https://pubmed.ncbi.nlm.nih.gov/25935311/ (DOI 10.1016/j.wem.2015.01.003) · **Fecha:** Sep 2015, WEM 26(3) · 8 pp · **Idioma:** `en` · **Categoría:** manual medicina expedición (revista oficial WMS)
- **Enseña:** C8 · **Refuerza:** C1, C9
- **Notas:** Protocolos por especie. Para *Physalia physalis* (carabela portuguesa, confirmada Caribe sur): **desaconseja vinagre 5%** por favorecer descarga de nematocistos; recomienda agua caliente 40–45°C / 20–45 min. Actualizado por Bañón-Boulet 2025 (Int Maritime Health 76(1)).

---

### C9 — Riesgo, decisión, rescate (6 recursos)

### R1. AAR ESPECÍFICO DE LA RUTA — Edelmayer: Kayaking Panama to Colombia (Darién Gap)
- **ID sugerido:** `aventura-r-edelmayer-darien-kayak-guide` · **Tipo:** `article` · **Autor:** Keifer A. Edelmayer (paddler solista, blog personal)
- **URL:** https://www.keiferaedelmayer.com/blog/a-guide-to-kayaking-from-panama-to-colombia-aka-the-darien-gap · **Fecha:** Travesía oct-2023, publicado 2023/2024 · ~20 min · **Idioma:** `en` · **Categoría:** AAR/YouTuber expedición
- **Enseña:** C9 · **Refuerza:** C1, C3, C5, C6, C7, C8
- **Notas:** **La ÚNICA fuente pública verificada que documenta la ejecución real de la ruta del curriculum** (Gatún → Chagres → Portobelo → San Blas → Puerto Obaldía → Capurganá). 21 días, equipo exacto, criterios de aborto, interacción humana (policía frecuente, aprobación sahila Guna), vacíos de cobertura. Caso base. Limitación: salió bien; complementar con R2 para AARs fallidos.

### R2. AAR CANÓNICO — Sea Kayaker's Deep Trouble (Broze & Gronseth)
- **ID sugerido:** `aventura-r-broze-gronseth-deep-trouble` · **Tipo:** `book`
- **Autor:** Matt Broze + George Gronseth (safety columnists Sea Kayaker Magazine); editor Christopher Cunningham · **URL:** https://archive.org/details/seakayakersdeept0000broz
- **Fecha:** 1997, International Marine/Ragged Mountain (ISBN 0-07-008499-8) · 220 pp · **Idioma:** `en` · **Categoría:** AAR/accidente real
- **Enseña:** C9 · **Refuerza:** C1, C6, C7
- **Notas:** 20 AARs + 36 sidebars técnicos. Estructura "qué llevaba / qué falló / cuánto costó evacuar / qué se aprende". Contexto Pacífico norte/UK — traducir hipotermia → deshidratación e insolación para tropical.

### R3. FRAMEWORK — Gonzales: Deep Survival — Who Lives, Who Dies, and Why
- **ID sugerido:** `aventura-r-gonzales-deep-survival` · **Tipo:** `book` · **Autor:** Laurence Gonzales (Montaigne Medal 2018)
- **URL:** https://www.laurencegonzales.com/ (sitio del autor) · **Fecha:** 2003, WW Norton (reed. 2017) · 352 pp · **Idioma:** `en` · **Categoría:** framework decisión-riesgo
- **Enseña:** C9 · **Refuerza:** C6, C7
- **Notas:** POR QUÉ mueren paddlers competentes: plan-continuation bias, sunk-cost escalation, "get-there-itis". Caps. 7–8 desarman el mito del "tenía que cruzarlo" (la épica que mata). No náutico-específico — los sesgos no cambian con el medio.

### R4. FRAMEWORK — Will Gadd en Delivering Adventure (2 eps)
- **ID sugerido:** `aventura-r-will-gadd-misadventure-risk` · **Tipo:** `article` (podcast con transcript/notes)
- **Autor:** Will Gadd (ACMG Alpine Guide, NatGeo Adventurer of the Year, Red Bull) en podcast "Delivering Adventure" (Chris Kaipio + Jordy Shepherd)
- **URLs:** https://deliveringadventure.com/2022/11/07/episode-6-how-to-avoid-misadventure-part-2-with-will-gadd/ · https://deliveringadventure.com/2024/02/08/s2-e09-how-to-communicate-risk-with-will-gadd/
- **Fecha:** Nov 2022 + Feb 2024 · ~60 min cada uno · **Idioma:** `en` · **Categoría:** framework decisión-riesgo
- **Enseña:** C9 · **Refuerza:** C6
- **Notas:** "La calidad se juzga por el proceso, no por el resultado — buen outcome con mal proceso es suerte". Pre-commit risk thresholds. Cómo verbalizar disenso en el cruce.

### R5. OFICIAL RESCATE — Garmin Response: Interactive SOS 24/7
- **ID sugerido:** `aventura-r-garmin-response-sos-protocol` · **Tipo:** `article` · **Autor:** Garmin International (ex-GEOS IERCC integrado 2021, centro Montgomery TX)
- **URLs:** https://www.garmin.com/en-US/satellite-communicators/interactive-sos-and-garmin-response/ · https://www.garmin.com/en-US/blog/outdoor/get-to-know-garmin-response/ · reporte anual https://www.garmin.com/en-US/blog/outdoor/2025-inreach-sos-year-in-review/
- **Idioma:** `en` · **Categoría:** oficial rescate
- **Enseña:** C9 · **Refuerza:** C7
- **Notas:** Whitepaper del dispositivo que el paddler lleva. El SOS NO llama a un helicóptero — llama a un coordinador en Texas que negocia con SENAN/DIMAR. 150k+ SOS históricos. Calibra expectativa real vs fantasía.

### R6. ADVISORY GOBIERNO — OSAC Panama Country Security Report + State Dept
- **ID sugerido:** `aventura-r-osac-panama-security-report` · **Tipo:** `article` · **Autor:** OSAC/U.S. Bureau of Diplomatic Security + State Dept
- **URLs:** https://www.osac.gov/Content/Report/c7575230-2685-4c5d-bd60-1c840cdaf93e (2-ene-2025) · https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/panama-travel-advisory.html (rev. sep-2024)
- **Idioma:** `en` · **Categoría:** advisory gobierno
- **Enseña:** C9 · **Refuerza:** C2, C3, C5
- **Notas:** Nivel 4 Darién + Mosquito Coast; "drogas flotando en playas — no tocar"; Guna Yala NO en nivel 4 (transitable). Fija por coordenadas la geografía del aborto por riesgo humano. 911/104/103 — English proficiency limited in responders.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

Convenciones para la migration F1:
- **Enseña** → 1 fila con `is_prerequisite = FALSE` (concepto primario del recurso). Viene definido por el agente que lo devolvió.
- **Refuerza** → 1 fila por concepto adicional con `is_prerequisite = FALSE` también (el flag `is_prerequisite` diferencia prereq-de-lectura vs enseñado; "refuerza" no es prerrequisito — solo aparece con los conceptos ya estudiados; en Jarre esto se expresa repitiendo filas con `is_prerequisite=FALSE` y la UI ordena por `sort_order` del recurso en la fase).
- **Notación:** `R[CN.N]` = recurso N del concepto N. Los IDs finales SQL usan el `aventura-r-...` de cada recurso.

**Audit FSRS (2026-04-23):** los "refuerza" originales (113) fueron auditados con criterio duro "estudiar este recurso completo ancla genuinamente ese concepto — no mención de paso ni tema adyacente". 20 cortados, 93 sobrevivientes. Cortes más importantes documentados en handoff de `PROGRESS.md` (miller→C1/C6 tangencial, stri-darien→C1 ecosistema≠oceanografía, howe→C2/C4 fuera-de-tema, bila-burba→C6 revolución≠travesías, wafer→C4 Kuna≠Emberá, sauer→C2 anacrónico, blashford→C7 militar-no-individuo, gonzales/gadd→C6 framework≠travesías, herlihy→C6 relocations-no-cruces, gitoc→C2 crimen≠fitosanitario, etc.).

| ID recurso | Enseña | Refuerza post-audit (is_prerequisite=FALSE) |
|---|---|---|
| aventura-r-uraba-tropical-estuary-review | C1 | C7, C9 |
| aventura-r-kastner-pcg-eddies-2024 | C1 | C9 |
| aventura-r-toro-circulacion-uraba-cioh | C1 | C7 |
| aventura-r-frank-wolf-darien-paddlingmag | C1 | C6, C7, C9 |
| aventura-r-dimar-derroteros-caribe | C1 | C7, C9 |
| aventura-r-miller-minding-the-gap | C2 | C5 |
| aventura-r-stri-darien-carbon-2019 | C2 | C4 |
| aventura-r-jstor-daily-panam-highway | C2 | C6 |
| aventura-r-iucn-darien-outlook | C2 | C1, C4 |
| aventura-r-mongabay-radwin-darien-2025 | C2 | C4, C5 |
| aventura-r-outside-in-darien-gap | C2 | C3, C4, C5 |
| aventura-r-pbs-drost-darien | C2 | C5 |
| aventura-r-reglamento-turismo-gunayala | C3 | C7, C9 |
| aventura-r-gunayala-resumen-oficial | C3 | C6, C7 |
| aventura-r-howe-people-who-would-not-kneel | C3 | C6 |
| aventura-r-howe-chiefs-scribes | C3 | C6 |
| aventura-r-bila-burba-documental | C3 | C9 |
| aventura-r-cultural-survival-statute-tourism | C3 | C7, C9 |
| aventura-r-naval-embera-wounaan-espiga | C4 | C6 |
| aventura-r-herlihy-choco-relocation-cs | C4 | — |
| aventura-r-mongabay-bilbao-estrategia-darien | C4 | C2, C5 |
| aventura-r-theodossopoulos-trap-authenticity | C4 | C3 |
| aventura-r-ley-72-2008-tierras-colectivas | C4 | C3 |
| aventura-r-crisis-group-darien-bottleneck | C5 | C4, C7, C9 |
| aventura-r-gitoc-gulf-clan-darien | C5 | C7, C9 |
| aventura-r-hrw-neglected-jungle-darien | C5 | C4, C9 |
| aventura-r-infobae-peor-que-darien-maritima | C5 | C1, C3, C9 |
| aventura-r-insightcrime-darien-profit | C5 | C7, C9 |
| aventura-r-senafront-transito-irregular | C5 | C9 |
| aventura-r-wafer-isthmus-1699 | C6 | C1, C3 |
| aventura-r-las-casas-historia-indias-iv | C6 | C3, C9 |
| aventura-r-sauer-early-spanish-main | C6 | C1, C3 |
| aventura-r-blashford-snell-darien-conquest | C6 | C2, C9 |
| aventura-r-hoffmeister-south-america-plan | C6 | C1, C3, C7, C9 |
| aventura-r-snm-panama-requisitos-turistas | C7 | C5, C9 |
| aventura-r-paddling-mag-satellite-communicators | C7 | C8, C9 |
| aventura-r-paddling-mag-touring-kayaks-2026 | C7 | — |
| aventura-r-freya-hoffmeister-equipment | C7 | C8, C9 |
| aventura-r-aca-l3-coastal-trip-leader | C7 | C1, C9 |
| aventura-r-cdc-yellow-book-panama | C8 | C7, C9 |
| aventura-r-cdc-colombia-travelers-health | C8 | C9 |
| aventura-r-paho-yellow-fever-americas-2025 | C8 | C2, C9 |
| aventura-r-ins-colombia-bes | C8 | C2, C4 |
| aventura-r-rigg-sandflies-panama | C8 | C2, C4 |
| aventura-r-lakkis-jellyfish-practical | C8 | C1, C9 |
| aventura-r-edelmayer-darien-kayak-guide | C9 | C1, C3, C5, C6, C7, C8 |
| aventura-r-broze-gronseth-deep-trouble | C9 | C1, C6, C7 |
| aventura-r-gonzales-deep-survival | C9 | C7 |
| aventura-r-will-gadd-misadventure-risk | C9 | — |
| aventura-r-garmin-response-sos-protocol | C9 | C7 |
| aventura-r-osac-panama-security-report | C9 | C2, C3, C5 |

**Total filas en `resource_concepts`:** 51 (enseña) + 93 (refuerza post-audit) = **144 filas**. Todas con `is_prerequisite = FALSE` (mismo patrón que travel F1). 3 recursos quedaron sin `refuerza` porque son altamente especializados: herlihy (etnografía de relocations), paddling-mag touring-kayaks (especs técnicas), will-gadd (framework meta).

Prerrequisitos concepto↔concepto (para `concept_prerequisites`) quedan según el DAG ya definido en cada card de concepto arriba:

- C1: ninguno (fundacional)
- C2: C1
- C3: C1, C2
- C4: C2
- C5: C2
- C6: C1, C2, C3
- C7: C1, C3, C5
- C8: C1, C7
- C9: C5, C6, C7, C8

Total filas `concept_prerequisites`: **18** (suma de prereqs listados por concepto, excluyendo duplicados lógicos).

---

## Cosas a validar antes de seedear

1. ~~**Validar los 8 conceptos**~~ — resuelto 2026-04-22: 9 conceptos, C8 nuevo agregado (fauna/salud tropical). Ver Decisiones Q4 en `PROGRESS.md`.
2. ~~**Definir idioma de los recursos**~~ — resuelto 2026-04-22: mixto es/en con sesgo español. Ver Decisiones Q3 en `PROGRESS.md`.
3. ~~**Resolver ángulo narrativo vs operativo**~~ — resuelto 2026-04-22: operativo puro v1. Ver Decisiones Q5 en `PROGRESS.md`.
4. ~~**Curaduría de recursos**~~ — resuelto 2026-04-23: 51 recursos verificados vía 9 agentes paralelos, URLs WebFetch-ed, estratificados 6 categorías, ~15 es / ~36 en. Ver handoff en `PROGRESS.md`.
5. **Verificar enum `resource_type`** — confirmado: los 4 tipos (`video`, `article`, `book`, `paper`) cubren todo. Mapas/datasets/expedition logs entran como `article`; audio-docs como `video`.
6. **Confirmar protocolo legal del cruce** con fuentes oficiales — cubierto por R1/R2 C3 (Congreso General Guna), R1 C7 (SNM Panamá), R5 C5 (InSight Crime operativo) y R6 C9 (OSAC/State Dept).
7. **Refinar definiciones canónicas** — PENDIENTE. Las 9 definiciones siguen en "borrador". Al escribir la migration F1, usar los borradores actuales como `canonical_definition` inicial y marcar en `PROGRESS.md` como tarea follow-up para refinarlas a 4–6 oraciones densas equivalentes a `travel/phase-1-brief.md`. Alternativa: refinar AHORA antes de migration (+30–45 min coordinator). Decisión del usuario.
8. **Follow-ups aceptados por el coordinator (documentar en Decisiones antes de migration F1):**
   - Bajar la afirmación "medical evac cubre evacuación por mar" en C7 a "algunos proveedores la cubren con activación InReach; verificar caso por caso" (Global Rescue whitepaper no respaldó explícitamente la versión fuerte).
   - Anotar que el site de Migración Colombia sobre salida por Capurganá es SPA y no fue fetcheable — describir el trámite en `description` de C7 sin recurso independiente.
   - Anotar vulnerabilidades de link-rot: SNM Panamá (re-fetch cada 6 meses), ACA CKTL (re-fetch post-31-dic-2026), INS Colombia BES (PDF anual rota).

---

## Próximos pasos del coordinator

Estado: **CURACIÓN COMPLETA · PENDIENTE REFINADO DE DEFINICIONES + MIGRATION F1.**

- [x] Investigar a fondo las pistas de fuentes vía 9 agentes paralelos, verificar URLs con WebFetch — hecho 2026-04-23
- [x] Curar 3–6 recursos por concepto (51 recursos total), estratificados 6 categorías, con autoría clara — hecho 2026-04-23
- [x] Cerrar tabla `resource_concepts` (51 enseña + 139 refuerza = 190 filas) — hecho 2026-04-23
- [ ] **PENDIENTE decisión del usuario:** refinar las 9 definiciones canónicas a 4–6 oraciones densas ANTES de migration F1, o dejar los borradores actuales como `canonical_definition` v1 y hacer follow-up con UPDATE-s
- [ ] **PENDIENTE migration F1:** traducir este brief a SQL siguiendo el template de `supabase/migrations/20260421040000_seed_travel_phase_1.sql`. Orden: (a) UPDATE del concept smoke `aventura-smoke-darien-intro` a C2 del brief (preservando ID/slug) O borrar el smoke y crear C2 nuevo — decidir; (b) INSERT de los 8 conceptos restantes con prereqs del DAG; (c) DELETE del resource smoke `aventura-smoke-darien-wiki` + su `resource_concepts`; (d) INSERT de los 51 recursos con `track='aventura'`, `phase='1'`, `curriculum_source='core'`, `created_by=NULL`; (e) INSERT de las 190 filas `resource_concepts` según tabla arriba
- [ ] **PENDIENTE aplicación a DB remota:** requiere autorización explícita del usuario para `supabase db push --linked`
- [ ] Marcar Fase 1 como `done` en `PROGRESS.md` y chunk 12 (commit+push) con autorización
