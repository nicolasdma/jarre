# Fase 5 — Amazonía Ecuatoriana · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 5 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='5'`.

**Para el coordinator (yo mismo, futuro):** 8 conceptos con 8 recursos. URLs verificadas via WebSearch/WebFetch el 2026-04-22. Puntos `[revisar]` al final.

---

## Objetivo de la fase

Instalar la lectura académica del oriente ecuatoriano antes de entrar por Puyo. Al terminar, el usuario debería poder responder sin dudar: por qué la Amazonía ecuatoriana es el bosque más biodiverso del planeta y no un accidente, por qué los Shuar resistieron a los incas y a los españoles mientras los pueblos andinos caían, cómo el descubrimiento de 1967 en Lago Agrio reescribe toda la historia política y económica del país, qué es Yasuní-ITT y por qué el referéndum de 2023 es parte de un conflicto continental sobre extractivismo, y por qué la ruta oriental Puyo–Palora–Macas–Tena atraviesa territorios de cuatro nacionalidades indígenas diferentes con lógicas territoriales distintas.

---

## Conceptos (8)

### C1. Geografía amazónica ecuatoriana y biodiversidad Yasuní
- **ID sugerido:** `travel-f5-amazonia-geografia-biodiversidad`
- **Slug:** `amazonia-ecuatoriana-geografia-biodiversidad`
- **Definición canónica:** La Amazonía ecuatoriana ocupa cerca de la mitad del territorio nacional y se estructura en tres franjas: piedemonte andino (2.000–500 m, cabeceras de Napo, Pastaza, Santiago, Morona), selva alta (500–200 m, Puyo–Tena–Macas) y selva baja (Yasuní, Cuyabeno). El Parque Nacional Yasuní concentra el récord mundial de diversidad arbórea (644+ especies por hectárea, más que en EE.UU. y Canadá juntos), explicado por su posición en el Refugio del Pleistoceno Napo: mientras el resto de la Amazonía se secó hace 20.000 años, este pliegue entre Andes y cuenca se mantuvo húmedo y funcionó como reserva genética. Es la razón geológica, no cultural, de por qué Ecuador discute qué hacer con un millón de hectáreas de selva.
- **Prerrequisitos:** `travel-f1-geografia-fisica` (cross-phase, Fase 1)

### C2. Pueblos amazónicos ecuatorianos (Shuar, Achuar, Kichwa, Waorani)
- **ID sugerido:** `travel-f5-pueblos-amazonicos`
- **Slug:** `pueblos-amazonicos-ecuatorianos`
- **Definición canónica:** Siete nacionalidades indígenas amazónicas reconocidas: Kichwa amazónicos (la mayoría, bilingüismo con kichwa serrano, ocupan Napo–Tena–Pastaza), Shuar y Achuar (familia lingüística jíbara, Morona Santiago–Pastaza, famosos históricamente por la tzantza como ritual guerrero y por su resistencia exitosa al Tawantinsuyu y a los encomenderos españoles), Waorani (contacto con misioneros evangélicos SIL desde 1956, Yasuní y zona intangible), y los más pequeños Siona, Siekopai (Secoya), Cofán, Shiwiar, Andwa, Sapara. La territorialidad no-aldeana (caseríos dispersos, no pueblos concentrados) hizo que tanto la colonización inca como la española fracasaran en el piedemonte, y explica por qué en el siglo XX la "colonización" recién arranca con carreteras y reforma agraria. El prefijo "jíbaro" es exónimo despectivo español; los Shuar se autodenominan Shuar ("gente").
- **Prerrequisitos:** `travel-f1-pueblos-precolombinos` (cross-phase, Fase 1)

### C3. Caucho amazónico y el genocidio del Putumayo
- **ID sugerido:** `travel-f5-ciclo-caucho`
- **Slug:** `ciclo-caucho-amazonia`
- **Definición canónica:** Entre 1880 y 1914 el caucho (Hevea brasiliensis) es el nuevo boom extractivo de la Amazonía: los neumáticos de bicicleta y auto, el aislamiento eléctrico y la industria militar disparan la demanda. Julio César Arana y la Peruvian Amazon Company (Casa Arana) dominan la cuenca del Putumayo (frontera difusa Colombia–Perú–Ecuador) reclutando forzosamente pueblos Huitoto, Bora, Andoque y Ocaina bajo sistema de enganche; se estima que 40.000–50.000 indígenas mueren en tres décadas. En 1910 el cónsul británico Roger Casement documenta las atrocidades para el Parlamento inglés, y en 1924 José Eustasio Rivera publica *La Vorágine*, novela que fija el arquetipo literario latinoamericano de la selva como infierno extractivo. El boom revienta en 1914 cuando las plantaciones británicas en Malasia (semillas contrabandeadas desde Brasil) inundan el mercado mundial. En el lado ecuatoriano el impacto es menor que en Perú/Colombia, pero los pueblos del oriente quedan diezmados y el modelo extractivo queda instalado como plantilla para el siguiente ciclo.
- **Prerrequisitos:** C2

### C4. Colonización amazónica y reforma agraria (1960s–1980s)
- **ID sugerido:** `travel-f5-colonizacion-reforma-agraria`
- **Slug:** `colonizacion-amazonica-reforma-agraria`
- **Definición canónica:** Hasta los años 1950 el oriente ecuatoriano era demográficamente marginal. Tres fuerzas convergentes lo transforman: (a) la Ley de Tierras Baldías (1954), la Ley de Reforma Agraria y Colonización (1964) y la Ley de Colonización de la Región Amazónica (1978), que declaran "baldías" las tierras no tituladas (es decir, las de pueblos indígenas) y adjudican parcelas a colonos serranos; (b) el IERAC como brazo operativo del Estado, que moviliza ~30.000 colonos desde la sierra sur (Azuay, Loja, Cañar) hacia Morona Santiago y Zamora, y 10.000 a Napo; (c) la narrativa de "seguridad nacional" post-1941 (guerra con Perú) que empuja al Estado a poblar la frontera oriental. Entre 1964 y 1994 desaparece cerca de un quinto de la selva oriental. La respuesta Shuar es la Federación Interprovincial de Centros Shuar (FICSH, 1964), pionera mundial en organización indígena amazónica, con apoyo salesiano; negocia titulación colectiva de territorios para frenar a colonos. Esta colonización es el pre-requisito directo del boom petrolero.
- **Prerrequisitos:** C2

### C5. Petróleo: Lago Agrio, Texaco y juicio Chevron (Aguinda)
- **ID sugerido:** `travel-f5-petroleo-texaco-chevron`
- **Slug:** `petroleo-texaco-chevron-aguinda`
- **Definición canónica:** En febrero de 1967 el consorcio Texaco-Gulf perfora el primer pozo productor en Nueva Loja, rebautizada "Lago Agrio" por el Sour Lake texano de Texaco. La producción a escala arranca en 1972 con el oleoducto transecuatoriano SOTE (Lago Agrio–Balao/Esmeraldas), y marca el fin del ciclo cacaotero-bananero: Ecuador pasa a rentista petrolero en menos de una década, el Estado crece, se financian subsidios y gasto social. El costo ambiental es catastrófico: entre 1972 y 1992 Texaco vierte ~63.000 millones de litros de aguas de formación a 880 piscinas sin revestimiento que contaminan ríos de los que bebían Cofán, Siona, Secoya, Kichwa y colonos. En 1993 nace el caso Aguinda (30.000 afectados), primero en Nueva York y luego en cortes ecuatorianas; en 2011 Ecuador condena a Chevron (heredera de Texaco) a USD 8.000 millones, ratificado en 2013 a 9.500 millones. Chevron obtiene arbitrajes internacionales que traban el cobro. Treinta años después la contaminación sigue presente y el caso es referencia mundial de litigio climático-indígena.
- **Prerrequisitos:** C2, C4

### C6. Yasuní-ITT y pueblos en aislamiento (Tagaeri-Taromenane)
- **ID sugerido:** `travel-f5-yasuni-iti`
- **Slug:** `yasuni-iti-aislamiento-voluntario`
- **Definición canónica:** Dentro del Parque Yasuní vive el último fragmento Waorani no contactado: los Tagaeri (descendientes de Taga, quien en los 60s se aparta del contacto misional) y los Taromenane (grupo histórico paralelo, lingüísticamente Wao-terero). El Estado reconoce su derecho al aislamiento vía Decretos 552 (1999) y 2187 (2007) que establecen una Zona Intangible de 758.000 ha. En 2007 el presidente Rafael Correa lanza en la ONU la Iniciativa Yasuní-ITT (bloques Ishpingo–Tambococha–Tiputini): Ecuador se compromete a dejar 846 millones de barriles bajo tierra a cambio de USD 3.600 millones en compensación internacional (la mitad del valor de mercado). La iniciativa fracasa en 2013 (solo USD 13 M efectivamente desembolsados) y Correa autoriza la explotación. Yasunidos, colectivo juvenil que luego suma a CONAIE, junta firmas para consulta popular; tras una década de bloqueo legal la Corte Constitucional la valida en mayo 2023. El **20 de agosto de 2023** el 59% de los ecuatorianos vota **Sí al Yasuní**: parar la explotación. En marzo 2025 la Corte Interamericana condena al Estado por violar derechos de los pueblos en aislamiento. La implementación del referéndum sigue en disputa.
- **Prerrequisitos:** C1, C5

### C7. Frontera con Perú: Paquisha 1981 y Cenepa 1995
- **ID sugerido:** `travel-f5-frontera-peru-cenepa`
- **Slug:** `frontera-peru-paquisha-cenepa`
- **Definición canónica:** Desde el Protocolo de Río de Janeiro (1942), firmado bajo ocupación peruana tras la guerra de 1941, Ecuador cede ~200.000 km² amazónicos a Perú y queda con un trazado fronterizo impugnado en la cordillera del Cóndor (cabeceras del río Cenepa). Tres brotes armados: (a) **Falso Paquisha (1981)**: destacamentos ecuatorianos en posición que Perú considera propia son desalojados en 5 días; (b) **Guerra del Cenepa (26 enero – 28 febrero 1995)**: el último conflicto armado interestatal en Sudamérica, con superioridad aérea ecuatoriana y defensa exitosa de posiciones en Tiwinza; (c) **Acuerdo de Paz de Brasilia (26 octubre 1998)**, firmado por Mahuad y Fujimori con garantía de los cuatro países de Río. El acuerdo cierra la disputa, habilita navegación ecuatoriana por el Amazonas y construye centros binacionales. Es relevante para el viajero: la ruta Puyo–Macas bordea territorios donde la militarización persistió hasta fines de los 90s, y los Shuar del Cóndor fueron actores clave en ambos conflictos (conocen el terreno mejor que nadie).
- **Prerrequisitos:** ninguno (puede estudiarse en paralelo con C2)

### C8. Amazonía presente: extractivismo, CONFENIAE y turismo comunitario
- **ID sugerido:** `travel-f5-amazonia-presente`
- **Slug:** `amazonia-presente-confeniae-turismo`
- **Definición canónica:** Síntesis de la fase. Hoy la Amazonía ecuatoriana vive la tensión entre cuatro vectores: (a) rondas petroleras y mineras del Estado (29 bloques licitados que solapan 76% de territorios de 7 nacionalidades); (b) organización política indígena liderada por CONFENIAE (Confederación de Nacionalidades Indígenas de la Amazonía Ecuatoriana, 1980), brazo amazónico de CONAIE, que articula a las 11 nacionalidades y orquesta consultas, resistencias judiciales (sentencia Sarayaku-Pastaza 2012 en Corte IDH, sentencia Waorani-ARCOM 2019) y alianzas con Yasunidos; (c) turismo comunitario como alternativa económica (Kapawi en Achuar, Napo Wildlife Center en Waorani, eco-lodges en Puyo–Tena); (d) misiones evangélicas (Summer Institute of Linguistics) y católicas (salesianos, capuchinos) todavía activas, con impactos disputados en identidad y educación intercultural. El *Sumak Kawsay* (kichwa, "buen vivir") que entra a la Constitución 2008 nace en parte de este laboratorio amazónico y es hoy marco jurídico y discursivo para las luchas.
- **Prerrequisitos:** C4, C5, C6

---

## Recursos (8)

### R1. Artículo — Medio siglo de extracción petrolera en el Ecuador: impactos y alternativas
- **ID sugerido:** `travel-r-larrea-medio-siglo-petroleo`
- **Tipo:** `article` (paper académico)
- **Autor:** Carlos Larrea
- **URL:** https://repositorio.uasb.edu.ec/bitstream/10644/8947/1/Larrea%20C-CON-34-Medio%20siglo.pdf
- **Idioma:** español
- **Duración estimada:** ~1.5h lectura (~25-30 páginas)
- **Enseña:** C5 Texaco/Chevron · **Refuerza:** C1 (Yasuní), C6 (ITT)
- **Notas:** Carlos Larrea es profesor de la Universidad Andina Simón Bolívar, uno de los economistas ecuatorianos con más trabajo sobre la economía petrolera y Yasuní. Publicado en el repositorio institucional UASB. Hace panorama cuantitativo + propuesta de transición post-petrolera.

### R2. Libro — La maldición de la abundancia
- **ID sugerido:** `travel-r-acosta-maldicion-abundancia`
- **Tipo:** `book`
- **Autor:** Alberto Acosta
- **URL (Internet Archive, open access):** https://archive.org/details/LaMaldicionDeLaAbundancia
- **URL alternativa (PDF directo):** https://radialistas.net/wp-content/uploads/2022/09/La-Maldicion-De-La-Abundancia-Alberto-Acosta.pdf
- **Idioma:** español
- **Capítulos a leer:** Prólogo (Eduardo Gudynas) + Capítulo "Petróleo, el motor invisible de una economía primaria" + "La propuesta Yasuní-ITT". Aprox. 90-110 páginas.
- **Duración estimada:** ~5-6h
- **Enseña:** C5 petróleo, C6 Yasuní-ITT · **Refuerza:** C4, C8
- **Notas:** Acosta fue ministro de Energía y Minas 2007, uno de los arquitectos originales de la iniciativa Yasuní-ITT antes de romper con Correa. Publicado por Abya-Yala + CEP (2009). Es el texto canónico de la crítica del extractivismo ecuatoriano.

### R3. Video — Crude (2009) de Joe Berlinger
- **ID sugerido:** `travel-r-crude-berlinger`
- **Tipo:** `video` (documental largo)
- **Autor/Director:** Joe Berlinger
- **URL (IMDB ficha):** https://www.imdb.com/title/tt1326204/
- **URL (press kit First Run Features):** https://firstrunfeatures.com/presskits/dvd_presskits/crude.pdf
- **Duración:** 104 min
- **Idioma:** inglés con subtítulos español (disponible en alquiler Amazon Prime, AppleTV y plataformas)
- **Enseña:** C5 Texaco/Chevron · **Refuerza:** C2, C8
- **Notas:** `[revisar]` Documental seminal, sigue dos años del juicio Aguinda vs Chevron con protagonismo de Pablo Fajardo (abogado ecuatoriano) y Steven Donziger. Chevron logró orden judicial para obtener metraje no editado — eso mismo habla de su impacto. Verificar disponibilidad de streaming legal actual; si no, dejarlo como recurso "fuera de plataforma" con link de alquiler o reemplazar por documental equivalente en YouTube.

### R4. Video — Primer Gran Levantamiento Indígena de 1990 (testimonio Luis Macas)
- **ID sugerido:** `travel-r-levantamiento-1990-macas`
- **Tipo:** `video`
- **Autor/Canal:** (canal independiente, verificar)
- **URL:** https://www.youtube.com/watch?v=cu7CYyT_n_Y
- **URL alternativa (archivo CONAIE):** https://conaie.org/2020/06/05/1990-30-anos-del-primer-gran-levantamiento-indigena/
- **Idioma:** español
- **Duración estimada:** 20-40 min
- **Enseña:** C8 CONFENIAE / movimiento indígena · **Refuerza:** C2, C4
- **Notas:** `[revisar]` Confirmar canal y calidad antes de seedear. Luis Macas (primer presidente Kichwa de CONAIE, Saraguro) es protagonista del levantamiento Inti Raymi 1990.

### R5. Libro — Sublevaciones indígenas en la Audiencia de Quito (Moreno Yáñez)
- **ID sugerido:** `travel-r-moreno-yanez-sublevaciones`
- **Tipo:** `book`
- **Autor:** Segundo E. Moreno Yáñez
- **URL (editorial UASB, ficha):** https://www.uasb.edu.ec/publicacion/sublevaciones-indigenas-en-la-audiencia-de-quito-desde-comienzos-del-siglo-xviii-hasta-finales-de-la-colonia/
- **URL (PDF Dokumen):** https://dokumen.pub/sublevaciones-indigenas-en-la-audiencia-de-quito-desde-comienzos-del-siglo-xviii-hasta-finales-de-la-colonia-5-edicion-9789978846971-9789978196144-9978846972.html
- **Idioma:** español
- **Capítulos a leer:** Introducción + casos Pomallacta 1730, Riobamba 1764, Columbe-Guamote 1803. Aprox. 60-80 páginas.
- **Duración estimada:** ~4-5h
- **Enseña:** C2 resistencia indígena histórica · **Refuerza:** C4
- **Notas:** Clásico académico (tesis Bonn, premio Egregia, reeditado por UASB en 5ª edición). Aunque se centra en la sierra, da contexto estructural para entender por qué las rebeliones amazónicas (Shuar) fueron diferentes.

### R6. Artículo / Revista — Revista CONFENIAE 2023 (lucha Siekopai y Shuar Arutam)
- **ID sugerido:** `travel-r-confeniae-revista-2023`
- **Tipo:** `article` (revista institucional indígena)
- **Autor:** CONFENIAE (Confederación de Nacionalidades Indígenas de la Amazonía Ecuatoriana)
- **URL:** https://confeniae.net/wp-content/uploads/2023/09/FINAL-confe-REVISTA-2023-PEKE.pdf
- **Idioma:** español
- **Duración estimada:** ~1-1.5h
- **Enseña:** C2 pueblos amazónicos, C8 organización política · **Refuerza:** C4
- **Notas:** Material de primera mano de la organización paraguas de las nacionalidades amazónicas. Incluye cronología de la lucha Shuar Arutam contra minería en cordillera del Cóndor y el caso Siekopai. Balancea el material académico con voz indígena propia.

### R7. Video — Sí al Yasuní (reportaje sobre consulta popular 2023)
- **ID sugerido:** `travel-r-si-al-yasuni-reportaje`
- **Tipo:** `video`
- **Autor/Canal:** (BMS o similar, a confirmar)
- **URL primaria:** https://www.youtube.com/watch?v=-ThOGWiywWQ
- **URL alternativa:** https://www.youtube.com/watch?v=YyoV0e3Tz4I
- **Duración estimada:** 15-45 min
- **Idioma:** español
- **Enseña:** C6 Yasuní-ITT · **Refuerza:** C1, C5, C8
- **Notas:** `[revisar]` Elegir el más riguroso. Alternativa: documental 93 metros "Yasuní: genocidio en la selva" (dir. David Beriain, 2017). El usuario necesita el marco de agosto 2023 porque sigue siendo episodio abierto (2024-2025).

### R8. Paper — Petróleo, desarrollo y naturaleza: Amazonía suroriente del Ecuador
- **ID sugerido:** `travel-r-vallejo-amazonia-suroriente`
- **Tipo:** `paper`
- **Autor:** Ivette Vallejo (FLACSO Ecuador, publicado en Anthropologica PUCP)
- **URL:** http://www.scielo.org.pe/scielo.php?script=sci_arttext&pid=S0254-92122014000100006
- **Idioma:** español
- **Duración estimada:** ~1h (paper 15-20 páginas)
- **Enseña:** C8 presente extractivista · **Refuerza:** C2, C5, C7
- **Notas:** Publicado en Anthropologica (PUCP, peer-reviewed, SciELO). Se enfoca en el extractivismo petrolero en Pastaza y Morona Santiago (Puyo–Macas, exactamente la ruta del usuario) con pueblos Achuar, Kichwa y Shuar. Complementa al paper Larrea (nacional) con zoom regional.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de |
|---------|-------------------------------|---------------------|
| R1 Larrea Medio siglo | C5 | — |
| R2 Acosta Maldición | C5, C6 | — |
| R3 Crude (Berlinger) | C5 | — |
| R4 Levantamiento 1990 | C8 | — |
| R5 Moreno Yáñez | C2 | — |
| R6 CONFENIAE Revista 2023 | C2, C8 | — |
| R7 Sí al Yasuní reportaje | C6 | — |
| R8 Vallejo suroriente | C8 | — |

Prerrequisitos entre conceptos: expresados en cada card. Notar el cross-phase a Fase 1 (`travel-f1-geografia-fisica` → C1; `travel-f1-pueblos-precolombinos` → C2), que se traduce a filas de `concept_prerequisites` sólo si ya existen las concepciones de Fase 1 seedadas.

---

## Cosas a validar antes de seedear

1. **R3 Crude**: confirmar disponibilidad legal de visualización. Si solo alquiler, marcar `resource_url` como enlace a ficha y dejar nota "recurso requiere acceso externo". Alternativa: documental YouTube sobre Aguinda (Teleamazonas tiene material) si se requiere video on-platform.
2. **R4 Levantamiento 1990**: elegir video final. Preferencia por material con Luis Macas en cámara. CONAIE tiene archivo propio.
3. **R7 Sí al Yasuní**: elegir entre las dos URLs. Buscar canal BMS directamente para confirmar autoría.
4. **R1 Larrea (PDF)**: el WebFetch devolvió binary; confirmar manualmente que el PDF se descarga OK. Si no, sustituir por artículo equivalente publicado en revista Procesos (UASB).
5. **Cross-phase prereqs**: C1 y C2 de Fase 5 referencian `travel-f1-*`. Antes de aplicar la migration, confirmar que la migration de Fase 1 ya corrió.
6. **Enum `resource_type`**: todos los tipos usados (`article`, `book`, `video`, `paper`) están cubiertos.
7. **`estimated_hours`**: R1 1.5h, R2 5.5h, R3 1.75h, R4 0.5h, R5 4.5h, R6 1h, R7 0.5h, R8 1h. Total fase ≈16h de trabajo crudo.

---

## Próximos pasos del coordinator

- [ ] Resolver los puntos de `[revisar]` arriba (R3, R4, R7)
- [ ] Confirmar URL final del paper R1 (descarga directa o re-hospedar si el PDF UASB falla)
- [ ] Tener listo el brief Fase 6 (este mismo commit)
- [ ] Cuando el ejecutor reporte seed done, actualizar `PROGRESS.md` y pasar este brief como input para `20260421050000_seed_travel_phase_5.sql`
