# Fase 9 — Andes Peruanos Sur: Cusco y Amazonía sur · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 9 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a las migrations `20260421020000_seed_travel_phase_metadata.sql` y `20260421040000_seed_travel_phase_1.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='9'`.

**Para el coordinator (yo mismo, futuro):** esta fase es densísima — corazón del Tahuantinsuyu + resistencia neo-inca + gran rebelión Túpac Amaru II + violencia política 1980-2000 + Amazonía sur con minería ilegal y pueblos en aislamiento. El usuario va a recorrer físicamente el corredor Cusco → Santa Teresa → Quillabamba → Kiteni → Madre de Dios: el contenido tiene que encuadrar ese descenso como el cierre natural del imperio (altiplano → ceja de selva → llanura amazónica). 8 conceptos, 8 recursos, cada URL verificada en search results del 2026-04-22.

---

## Objetivo de la fase

Al terminar, el usuario debería poder responder sin dudar: por qué Cusco es el "ombligo" y no una capital accidental, cómo funcionaba un imperio de 2M km² sin rueda ni dinero (control vertical de pisos ecológicos), por qué Machu Picchu no fue "descubierto" en 1911 sino rebautizado como mercancía global, por qué la rebelión de Túpac Amaru II de 1780 es el antecedente ineludible de la independencia peruana y por qué su nombre vuelve a aparecer en el MRTA dos siglos después, qué significa la "utopía andina" de Flores Galindo para leer Vargas Llosa y Arguedas, cómo llegó la guerra interna de Sendero Luminoso al sur andino, y por qué la bajada del altiplano a la selva (Santa Teresa → Kiteni → Quillabamba → Madre de Dios) reproduce a escala de siglo XXI el mismo gradiente ecológico que los incas gestionaban hace 600 años — ahora con minería ilegal de oro, pueblos Mashco Piro en aislamiento voluntario y el fantasma de Fitzcarraldo.

---

## Conceptos (8)

### C1. Formación del Tahuantinsuyu y control vertical de pisos ecológicos
- **ID sugerido:** `travel-f9-tahuantinsuyu-pisos`
- **Slug:** `tahuantinsuyu-control-vertical-pisos-ecologicos`
- **Definición canónica:** Entre ~1438 (reforma de Pachacútec tras la derrota de los Chancas) y 1533 (captura de Atahualpa), el Tahuantinsuyu — "las cuatro regiones unidas" (Chinchaysuyu, Antisuyu, Collasuyu, Contisuyu) — se expande desde Cusco hasta cubrir ~2 millones de km² entre el sur de Colombia y el norte de Chile. Su viabilidad económica se explica por el modelo de *control vertical de un máximo de pisos ecológicos* (John Murra, 1972): cada grupo étnico mantiene "islas" productivas discontinuas en distintas altitudes (costa 0m para pescado y algodón; yunga 500–2 300m para maíz y coca; quechua 2 300–3 500m para papa y maíz; suni/puna 3 500–4 800m para tubérculos andinos y camélidos) sin pasar por mercado, articuladas por reciprocidad y redistribución estatal. El imperio formaliza esta lógica con la *mita* (turno de trabajo rotatorio), los *quipus* (registro de cuerdas anudadas), los *tambos* y *chaskis* (postas y mensajeros del qhapaq ñan) y los *mitmaqkuna* (poblaciones desplazadas). Sin este esquema, no se entiende nada posterior — ni la colonia española, que recicla la mita para Potosí, ni las comunidades campesinas del siglo XXI.
- **Prerrequisitos:** `travel-f1-pueblos-precolombinos` (F1 — panorámica precolombina continental); `travel-f1-geografia-fisica` (F1 — la subducción Nazca explica la cordillera, los pisos son consecuencia de la altitud).

### C2. Cusco como ombligo cosmológico: forma de puma, Coricancha y sistema de ceques
- **ID sugerido:** `travel-f9-cusco-ombligo`
- **Slug:** `cusco-coricancha-ceques`
- **Definición canónica:** Cusco (*Qusqu* = ombligo) no fue solo capital administrativa sino centro cosmológico diseñado. Pachacútec lo refunda con planta zoomorfa — el casco histórico traza la silueta de un puma cuya cabeza es Sacsayhuamán (fortaleza-santuario con muros ciclópeos sin mortero) y cuyo cuerpo se recorta entre los ríos Tullumayo y Saphi. Desde el *Coricancha* (Templo del Sol, recubierto originalmente de planchas de oro) irradiaban 41 líneas ceremoniales imaginarias — el *sistema de ceques* reconstruido por Tom Zuidema (tesis Leiden 1964) — que organizaban 328 *huacas* (santuarios) en un calendario ritual-astronómico simultáneamente geográfico y político: cada ceque era responsabilidad de un *ayllu* o panaca (linaje real). La conquista no destruye esta estructura sino que la superpone: la iglesia de Santo Domingo se erige literalmente sobre los muros del Coricancha, la Catedral sobre el palacio de Viracocha. Esta superposición arquitectónica es el emblema físico del sincretismo andino.
- **Prerrequisitos:** C1.

### C3. Conquista y resistencia neo-inca: de Cajamarca a Vilcabamba (1532–1572)
- **ID sugerido:** `travel-f9-resistencia-vilcabamba`
- **Slug:** `conquista-resistencia-neoinca-vilcabamba`
- **Definición canónica:** La "conquista del Perú" no termina en 1533 con la ejecución de Atahualpa sino en 1572 con la decapitación de Túpac Amaru I en la Plaza de Armas del Cusco por orden del virrey Francisco de Toledo. Entre medio: (a) Manco Inca, entronizado títere por Pizarro, se rebela en 1536, sitia Cusco durante diez meses y, derrotado en Sacsayhuamán, funda el estado neo-inca de Vilcabamba al noroeste del Cusco (ceja de selva, actual La Convención — cerca del corredor Santa Teresa/Quillabamba). (b) Durante 36 años (1536–1572) cuatro incas — Manco, Sayri Túpac, Titu Cusi, Túpac Amaru I — gobiernan un estado paralelo que mantiene ritual, administración y ejército propios. (c) Toledo, al llegar en 1569, define la erradicación de Vilcabamba como prioridad política y la campaña militar culmina en la captura y ejecución pública de Túpac Amaru I (23 sept 1572). Esta "vertebrita andina" subterránea — que la conciencia colonial niega y la memoria popular preserva — es la matriz de todas las rebeliones andinas posteriores, incluida la de 1780.
- **Prerrequisitos:** C1, C2; `travel-f1-virreinatos` (F1 — contexto del Virreinato del Perú).

### C4. Machu Picchu: de llaqta imperial a marca global
- **ID sugerido:** `travel-f9-machu-picchu`
- **Slug:** `machu-picchu-bingham-yale`
- **Definición canónica:** Machu Picchu no fue "descubierto" por Hiram Bingham el 24 de julio de 1911 — familias campesinas vivían cultivando allí y guías locales (Melchor Arteaga, el niño Pablito Álvarez) lo llevaron al sitio. Bingham, historiador de Yale con financiación de la National Geographic Society, la reclasifica como "ciudad perdida de los incas" y la convierte en noticia global (National Geographic, abril 1913). Función real del sitio: *llaqta* real de Pachacútec hacia 1450, hacienda estacional y centro religioso, nunca capital ni fortaleza. Entre 1911 y 1915 Bingham exporta ~46 000 piezas arqueológicas a Yale; la controversia se extiende 100 años hasta que, tras campaña diplomática del gobierno de Alan García y acuerdo de noviembre 2010, Yale repatria 363 piezas prioritarias en 2011 y completa la devolución en 2012 (hoy en el Museo Machupicchu Casa Concha en Cusco). Hoy la ciudadela es UNESCO (1983), Nueva Maravilla del Mundo (2007) y locomotora de la economía cusqueña — con cuota diaria de 4 500 visitantes y conflictos recurrentes de Cusco vs Lima por la gobernanza del sitio.
- **Prerrequisitos:** C2, C3.

### C5. Túpac Amaru II y la Gran Rebelión (1780–1783)
- **ID sugerido:** `travel-f9-tupac-amaru-ii`
- **Slug:** `tupac-amaru-ii-gran-rebelion`
- **Definición canónica:** El 4 de noviembre de 1780, José Gabriel Condorcanqui Noguera — curaca de Surimana, Tungasuca y Pampamarca, descendiente legal reconocido del inca Túpac Amaru I y comerciante arriero acomodado — captura al corregidor Antonio de Arriaga en Tinta (sur del Cusco), lo ejecuta días después y desata la mayor rebelión anticolonial del siglo XVIII en toda América española. Adopta el nombre Túpac Amaru II y articula una alianza multiétnica (indígenas, mestizos, criollos descontentos) contra abusos del sistema de corregimientos, repartos forzosos y mita de Potosí. La rebelión se extiende del Cusco al altiplano del Collao (Puno) y al Alto Perú hasta La Paz, donde Túpac Katari cerca la ciudad en 1781. Capturado por traición en Langui el 6 abril 1781, es ejecutado el 18 mayo 1781 en la Plaza de Armas del Cusco con un ritual de tortura diseñado por el visitador José Antonio de Areche: obligado a presenciar la ejecución de su esposa Micaela Bastidas e hijos, se intenta descuartizarlo con cuatro caballos y finalmente se lo decapita. Las reformas borbónicas postrebelión suprimen corregimientos y curacazgos pero ya es tarde: 30 años después empezarán las guerras de independencia, y el nombre "Túpac Amaru" vuelve a ser bandera en el siglo XX (MRTA, 1984–1997).
- **Prerrequisitos:** C3; `travel-f1-virreinatos` (F1); `travel-f1-potosi` (F1 — la mita colonial a Potosí es el combustible de la rebelión).

### C6. Valle Sagrado y tecnología agrícola inca: Moray, andenes, waru waru y el eje Urubamba
- **ID sugerido:** `travel-f9-valle-sagrado`
- **Slug:** `valle-sagrado-moray-andenes`
- **Definición canónica:** El *Valle Sagrado del Urubamba* (río Vilcanota en su tramo superior) entre Pisac y Ollantaytambo es el granero tecnológico del imperio y la prueba empírica del modelo de control vertical. Sus componentes: (a) *andenes* — terrazas de piedra con drenaje interno que convierten laderas de 30–45° en parcelas cultivables y controlan erosión; existen ~1.5M acres en los Andes; (b) *Moray* — complejo de tres anfiteatros circulares concéntricos a 3 500m con ~20 microclimas simultáneos (diferencia de hasta 15°C entre el borde y el fondo), interpretado por el antropólogo John Earls (PUCP) como estación experimental para adaptar cultivos entre pisos ecológicos; (c) *waru waru* en el altiplano — camellones elevados con canales de agua que amortiguan heladas nocturnas; (d) *Ollantaytambo* y *Pisac* como ciudades vivas con trazado inca todavía habitado, únicas del imperio con continuidad urbana ininterrumpida; (e) *salineras de Maras* — pozas de evaporación pre-incas aún en operación. El valle funciona como laboratorio y despensa de Cusco: demuestra que el imperio incaico no fue sólo expansión militar sino una ingeniería paisajística a escala continental.
- **Prerrequisitos:** C1, C2.

### C7. Utopía andina, indigenismo literario y la violencia política (CVR 1980–2000)
- **ID sugerido:** `travel-f9-utopia-violencia`
- **Slug:** `utopia-andina-cvr-sierra-sur`
- **Definición canónica:** Tres capas interrelacionadas de la memoria andina del siglo XX. (a) *Utopía andina* (Alberto Flores Galindo, 1986): tesis de que desde 1572 existe en los Andes una memoria milenarista del Inca — el retorno del *Inkarrí* reconstituyendo cabeza y cuerpo — que fusiona mesianismo cristiano y cosmología andina y que late bajo cada rebelión colonial, republicana y moderna del sur peruano. (b) *Indigenismo literario*: José María Arguedas — bilingüe quechua/castellano, educado en haciendas del sur andino — publica *Los ríos profundos* (1958), *Todas las sangres* (1964) y póstuma *El zorro de arriba y el zorro de abajo* (1971) construyendo una literatura desde adentro del mundo andino (no sobre él como Ciro Alegría), con el río Pachachaca y Abancay como ejes simbólicos. Mario Vargas Llosa responde desde afuera y desde la derecha con *Lituma en los Andes* (1993). (c) *Conflicto armado interno 1980–2000*: Sendero Luminoso (PCP-SL, maoísta, fundado por Abimael Guzmán en Huamanga/Ayacucho) y el MRTA generan una guerra interna con ~69 280 muertos y desaparecidos según la CVR (informe final, 28 agosto 2003, 9 tomos). 75% de las víctimas fueron quechuahablantes rurales del sur central; Ayacucho concentra el epicentro pero Cusco, Apurímac, Puno y Huancavelica quedan heridos. Respuesta estatal: Fujimori 1990–2000, autogolpe 1992, captura de Guzmán 1992, Grupo Colina, esterilizaciones forzadas a mujeres andinas, vacancia 2000 tras los vladivideos. El juicio y condena de Fujimori en 2009 es el primer caso en el mundo de un expresidente juzgado en su país por violaciones a DDHH.
- **Prerrequisitos:** C5; `travel-f1-divergencia-poscolonial` (F1 — por qué los Andes centrales siguen una trayectoria poscolonial divergente).

### C8. Amazonía sur: el descenso Cusco → Santa Teresa → Kiteni → Quillabamba → Madre de Dios
- **ID sugerido:** `travel-f9-amazonia-sur`
- **Slug:** `amazonia-sur-manu-madre-de-dios`
- **Definición canónica:** El descenso del altiplano cusqueño (3 400m) a la llanura amazónica (250m) en Madre de Dios no es una transición geográfica menor sino un corredor cultural y económico denso que replica a escala del siglo XXI el mismo gradiente ecológico que gestionaban los incas. Hitos del corredor: (a) *Santa Teresa* y *Quillabamba* (La Convención, ceja de selva) — región del estado neo-inca de Vilcabamba, después hacendaria (Hugo Blanco lidera la primera toma de tierras campesina del Perú en 1962, antecedente de la reforma agraria de Velasco 1969), hoy productora de coca legal y café. (b) *Kiteni* y el río Urubamba inferior — puerta al territorio matsigenka y al gas de Camisea (megaproyecto energético desde 2004). (c) *Parque Nacional Manu* (1973, Patrimonio Natural UNESCO 1987) — 1.7M ha, una de las zonas más biodiversas del planeta, territorio ancestral de matsigenka, harakbut, yine y del pueblo *Mashco Piro* en aislamiento voluntario (los avistamientos se multiplicaron desde 2011 por presión externa sobre su territorio). (d) *Ciclo del caucho* (1880–1915): Julio César Arana (Casa Arana) y Carlos Fermín Fitzcarrald — epónimo del *Fitzcarraldo* de Werner Herzog (1982) — esclavizan y exterminan comunidades amazónicas; informe Roger Casement 1912 denuncia el genocidio. (e) *Minería ilegal de oro en Madre de Dios*: *La Pampa* es hoy la mayor zona de deforestación por minería aluvial ilegal del Perú, 100 000+ ha devastadas, mercurio en ríos, trata sexual de adolescentes, enfrentamientos con la policía (Operación Mercurio 2019). El usuario cruza este corredor físicamente — la moto baja los mismos 3 000m que bajaban los mitmaqkuna cusqueños a buscar coca en Vilcabamba.
- **Prerrequisitos:** C1 (pisos ecológicos), C3 (Vilcabamba), C7 (violencia política se extiende también al VRAEM).

---

## Recursos (8)

### R1. Libro — Historia del Tahuantinsuyu
- **ID sugerido:** `travel-r-rostworowski-tahuantinsuyu`
- **Tipo:** `book`
- **Autor:** María Rostworowski de Diez Canseco
- **Editorial:** Instituto de Estudios Peruanos (IEP), Lima, 1988 (reeditado en *Obras Completas VIII*, 3ra ed.)
- **URL (academia.edu):** https://www.academia.edu/40423619/HISTORIA_DEL_TAHUANTINSUYU_ROSTWOROWSKI_Mar%C3%ADa
- **URL oficial editorial:** https://fondoeditorial.iep.org.pe/producto/historia-del-tahuantinsuyu-obras-completas-viii/
- **Duración estimada:** ~8h (332 pp., leer íntegro — es el manual canónico)
- **Idioma:** español
- **Enseña:** C1 Tahuantinsuyu · **Refuerza:** C2 (Cusco), C3 (conquista), C6 (Valle Sagrado)
- **Notas:** Libro fundacional de los estudios incaicos en el Perú contemporáneo. Rostworowski (1915–2016) fue la primera historiadora peruana en usar sistemáticamente documentación colonial (visitas, probanzas, testamentos de curacas) para reconstruir la sociedad inca desde adentro. Indispensable como base del curso. Para pipeline de Jarre, descargar PDF y servir como `resource_page_range` por partes.

### R2. Paper — El "control vertical" de un máximo de pisos ecológicos en la economía de las sociedades andinas
- **ID sugerido:** `travel-r-murra-pisos-ecologicos`
- **Tipo:** `paper`
- **Autor:** John V. Murra
- **Publicación original:** en *Visita de la Provincia de León de Huánuco en 1562*, tomo II, Universidad Nacional Hermilio Valdizán, Huánuco, 1972
- **URL (PDF abierto):** https://americafarberman.files.wordpress.com/2017/08/6646535-040805-murra-el-control-vertical-de-un-maximo-de-pisos-ecologicos-bb.pdf
- **Duración estimada:** ~2h (52 pp., densidad alta)
- **Idioma:** español
- **Enseña:** C1 (el modelo nuclear) · **Refuerza:** C6 (Moray/andenes), C8 (descenso altiplano-selva)
- **Notas:** El texto canónico de la etnohistoria andina. Define el archipiélago vertical con casos etnográficos concretos (Chupaychu, Lupaqa, Chincha). Lectura obligada antes de caminar cualquier andén. Complementar con el artículo de revisita en Chungará: https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0717-73562010000100038

### R3. Libro — Buscando un Inca: identidad y utopía en los Andes
- **ID sugerido:** `travel-r-flores-galindo-buscando-inca`
- **Tipo:** `book`
- **Autor:** Alberto Flores Galindo
- **Editorial:** 1ra ed. Instituto de Apoyo Agrario, Lima, 1987; reediciones posteriores Horizonte y SUR
- **URL (Internet Archive, OCR 1994):** https://archive.org/details/flores-galindo-a.-buscando-un-inca.-identidad-y-utopia-en-los-andes-ocr-1994
- **Duración estimada:** ~8h (370 pp.). Capítulos prioritarios: I "En busca de un Inca", II "La redención por la violencia" (Túpac Amaru II), VI "En el nombre del Inca" (siglo XX y Sendero).
- **Idioma:** español
- **Enseña:** C7 utopía andina · **Refuerza:** C3 (Vilcabamba), C5 (Túpac Amaru II como realización parcial de la utopía), vincula hasta el conflicto armado
- **Notas:** Premio Casa de las Américas 1986. Flores Galindo (1949–1990, fallecido joven) es EL historiador que sutura la memoria andina colonial con la violencia política del XX. Complementa a Rostworowski (R1): ella reconstruye el imperio, él reconstruye cómo la idea del imperio sigue actuando 500 años después. Lectura obligada para el eje C7.

### R4. Libro — El sistema de ceques del Cuzco
- **ID sugerido:** `travel-r-zuidema-ceques`
- **Tipo:** `book` (libro breve derivado de tesis doctoral Leiden 1964)
- **Autor:** R. Tom Zuidema
- **Publicación:** *The Ceque System of Cuzco: The Social Organization of the Capital of the Inca* (Leiden, 1964); edición española en Fondo Editorial PUCP
- **URL (repositorio PUCP):** https://repositorio.pucp.edu.pe/index/handle/123456789/181630
- **URL complemento (Sherbondy, Dialnet):** https://dialnet.unirioja.es/descarga/articulo/8462571.pdf ("LOS CEQUES: Código de canales en el Cusco Incaico", Jeanette E. Sherbondy)
- **Duración estimada:** ~4h (el libro; el complemento Sherbondy son ~30 pp.)
- **Idioma:** español
- **Enseña:** C2 ceques y Coricancha · **Refuerza:** C1 (cosmología y administración)
- **Notas:** Zuidema (1927–2016) es el antropólogo que descifró los ceques a partir del cronista jesuita Bernabé Cobo (1653). Denso pero indispensable para entender por qué Sacsayhuamán y Qorikancha están donde están y no son solo "ruinas". Si el libro completo es mucho, el Sherbondy-Dialnet es una síntesis accesible.

### R5. Artículo — Machu Picchu: Bingham, Yale y repatriación
- **ID sugerido:** `travel-r-machu-picchu-bingham-yale`
- **Tipo:** `article`
- **Autor/medio:** Infobae Perú (serie con fuentes primarias: Richard L. Burger/Yale, archivos National Geographic)
- **URL primaria (piezas arqueológicas y Bingham):** https://www.infobae.com/historias/2025/06/06/las-aventuras-del-profesor-estadounidense-que-divulgo-la-existencia-del-machu-picchu-y-las-piezas-arqueologicas-que-se-llevo-de-peru/
- **URL secundaria (114 años del redescubrimiento):** https://www.infobae.com/peru/2025/07/24/machu-picchu-cumple-114-anos-desde-que-fue-redescubierta-la-historia-detras-de-la-llegada-de-hiram-bingham-a-la-ciudadela-inca-en-1911/
- **URL académica complementaria (repatriación):** https://revistas.unal.edu.co/index.php/peju/article/view/63873/0 (Pensamiento Jurídico, UNAL Colombia — caso legal)
- **Duración estimada:** ~1.5h (leer las 3 piezas y cruzar datos)
- **Idioma:** español
- **Enseña:** C4 Machu Picchu · **Refuerza:** C2 (ciudad inca), C3 (llaqta de Pachacútec)
- **Notas:** `[revisar]` Las dos URL de Infobae dan narrativa detallada con cifras precisas (5 415 lotes, 173 individuos, 363 piezas repatriadas 2011). Alternativa si se quiere endurecer desde academia anglófona: libro de Richard Burger y Lucy Salazar *Machu Picchu: Unveiling the Mystery of the Incas* (Yale University Press, 2004).

### R6. Documental — La rebelión de Túpac Amaru II (Sucedió en el Perú / TV Perú)
- **ID sugerido:** `travel-r-tupac-amaru-documental`
- **Tipo:** `video`
- **Autor/Canal:** TV Perú — programa *Sucedió en el Perú* (conducido por Antonio Zapata Velasco, historiador PUCP)
- **URL canal oficial búsqueda:** https://www.youtube.com/@TVPeru/search?query=tupac%20amaru%20ii%20sucedio%20en%20el%20peru
- **URL alternativa (Infobae, lectura previa):** https://www.infobae.com/peru/2023/11/04/a-243-anos-de-la-rebelion-de-tupac-amaru-el-comienzo-de-su-lucha-y-la-estrategia-para-capturar-al-corregidor-arriaga/
- **URL alternativa académica (Dialnet, paper):** https://dialnet.unirioja.es/descarga/articulo/9253440.pdf
- **Duración estimada:** 1h (documental típico *Sucedió en el Perú*) + 1h lectura de contexto
- **Idioma:** español
- **Enseña:** C5 Túpac Amaru II · **Refuerza:** C3 (línea de resistencia desde Vilcabamba), C7 (el nombre que el MRTA retoma en 1984)
- **Notas:** `[revisar]` *Sucedió en el Perú* es el programa de divulgación histórica estatal peruano, equivalente local al Canal Encuentro argentino. Antonio Zapata ha hecho varios episodios sobre Túpac Amaru II — verificar cuál es el más riguroso y vigente antes de seedear. Plan B: Colección Documental del Bicentenario, Repositorio del Bicentenario (https://repositorio.bicentenario.gob.pe/handle/20.500.12934/111), que publicó los 4 tomos documentales en 2021 con introducciones académicas audiovisuales.

### R7. Informe CVR — Hatun Willakuy (síntesis del Informe Final)
- **ID sugerido:** `travel-r-cvr-hatun-willakuy`
- **Tipo:** `book` (la síntesis oficial del Informe Final es un libro de ~480 pp.)
- **Autor:** Comisión de la Verdad y Reconciliación del Perú (2001–2003, presidida por Salomón Lerner Febres)
- **URL (PDF oficial IDEHPUCP):** https://idehpucp.pucp.edu.pe/wp-content/uploads/2012/11/hatun-willakuy-cvr-espanol.pdf
- **URL sitio oficial CVR (informe de 9 tomos):** https://www.cverdad.org.pe/ifinal/
- **URL videos CVR (archivo audiovisual):** https://www.verdadyreconciliacionperu.com/videos/videosListado.aspx?O=Autor&A=CVR
- **Duración estimada:** ~10h (lectura íntegra de *Hatun Willakuy* + 1-2 videos documentales del archivo)
- **Idioma:** español
- **Enseña:** C7 conflicto armado 1980–2000 · **Refuerza:** C5 (memoria insurgente), `travel-f1-divergencia-poscolonial` (F1)
- **Notas:** *Hatun Willakuy* ("gran relato" en quechua) es la versión abreviada oficial del Informe Final de 9 tomos. Es la síntesis canónica del conflicto — imprescindible para entender Ayacucho, pero también por qué Cusco y Puno quedaron heridos. Para el pipeline de Jarre: subir PDF y procesar por capítulos (recomendado: Introducción + Cap 1 "Los actores armados" + Cap 2 "Las regiones" + Conclusiones). Es el recurso más doloroso de la fase — el usuario que va en moto por el sur andino debe tenerlo puesto en el cuerpo, no ser turista en un paisaje bonito.

### R8. Reportaje de investigación — Minería ilegal en Madre de Dios y Parque Nacional Manu
- **ID sugerido:** `travel-r-madre-de-dios-mineria`
- **Tipo:** `article` (serie periodística de investigación ambiental + informe técnico)
- **Autor/medio:** Mongabay Latam (periodismo ambiental) + Derecho, Ambiente y Recursos Naturales (DAR, Perú)
- **URL primaria (Mongabay Manu):** https://es.mongabay.com/2021/10/peligro-en-el-manu-vias-mineria-ilegal-narcotrafico-peru/
- **URL primaria (Mongabay Tambopata/frontera):** https://es.mongabay.com/2022/09/mineria-ilegal-en-la-frontera-de-peru-y-bolivia-amenaza-a-territorios-indigenas/
- **URL informe DAR (PDF técnico 2024):** https://dar.org.pe/wp-content/uploads/2024/08/Mineria-ilegal-en-Madre-de-Dios-version-final.pdf
- **URL documental audiovisual (Servindi):** https://www.servindi.org/actualidad-noticias/28/08/2018/muestran-fotos-y-videos-sobre-deforestacion-por-la-mineria-ilegal
- **Duración estimada:** ~3h (dos artículos Mongabay + ojeada informe DAR + 20 min video Servindi)
- **Idioma:** español
- **Enseña:** C8 Amazonía sur · **Refuerza:** `travel-f1-divergencia-poscolonial` (F1 — extractivismo contemporáneo como continuación del modelo colonial)
- **Notas:** Mongabay es el periodismo ambiental de referencia en Latinoamérica, con reporteo de terreno y cartografía satelital. El informe DAR 2024 es técnico pero imprescindible para cifras (100 000+ ha deforestadas, 70% de la minería aurífera peruana es ilegal, mercurio en peces). Complemento literario lateral (no seedeado): *Fitzcarraldo* de Werner Herzog (1982) para el ciclo del caucho. Para Mashco Piro, ver reportes específicos del Ministerio de Cultura (DACI) citados en los Mongabay.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Rostworowski, Tahuantinsuyu | C1 | — |
| R2 Murra, pisos ecológicos | C1 (paper nuclear del modelo) | — |
| R3 Flores Galindo, Buscando un Inca | C7 | — |
| R4 Zuidema, ceques | C2 | — |
| R5 Machu Picchu / Bingham / Yale | C4 | — |
| R6 Documental Túpac Amaru II | C5 | — |
| R7 CVR / Hatun Willakuy | C7 (parcial, eje conflicto armado) | — |
| R8 Mongabay + DAR Madre de Dios | C8 | — |

**Cobertura de conceptos por recursos directos:** C1 (R1, R2), C2 (R4), C3 (cubierto en R1 tramo final + R3 cap II), C4 (R5), C5 (R6), C6 (cubierto en R1 + R2), C7 (R3, R7), C8 (R8). **C3 y C6 no tienen recurso propio dedicado** — cubiertos via R1 (Rostworowski dedica capítulos a conquista y agricultura) y R3 (Flores Galindo sobre Vilcabamba). Si en reseed se juzga insuficiente, considerar R9 específico sobre Vilcabamba (ver "Cosas a validar" abajo).

Prerrequisitos de concepto a concepto ya expresados en cada card de concepto arriba; se traducen a filas de `concept_prerequisites`. **Cross-phase prereqs** apuntan a F1: `travel-f1-pueblos-precolombinos`, `travel-f1-geografia-fisica`, `travel-f1-virreinatos`, `travel-f1-potosi`, `travel-f1-divergencia-poscolonial`.

---

## DAG pedagógico

```
(F1: geografia-fisica, pueblos-precolombinos)
        │
        ▼
      C1 (Tahuantinsuyu + pisos) ──────────┐
        │                                  │
        ├─► C2 (Cusco ombligo)             │
        │       │                          │
        │       └─► C3 (Vilcabamba) ◄──── (F1: virreinatos)
        │               │
        │               ├─► C4 (Machu Picchu)
        │               └─► C5 (Túpac Amaru II) ◄──── (F1: potosi)
        │                       │
        ├─► C6 (Valle Sagrado)  │
        │                       ▼
        │                   C7 (utopía + CVR) ◄──── (F1: divergencia-poscolonial)
        │                       │
        └─────────────► C8 (Amazonía sur) ◄─────────┘
```

Orden de estudio recomendado: **C1 → C2 → C6 → C3 → C4 → C5 → C7 → C8**.
C6 temprano (inmediatamente después de C2) porque es la prueba empírica de C1 y el usuario probablemente va a caminar andenes antes de profundizar en política imperial.

---

## Estimación total de horas

| Recurso | Horas |
|---------|-------|
| R1 Rostworowski | 8h |
| R2 Murra paper | 2h |
| R3 Flores Galindo | 8h |
| R4 Zuidema ceques | 4h |
| R5 Machu Picchu artículos | 1.5h |
| R6 Documental Túpac Amaru II | 2h |
| R7 Hatun Willakuy + videos CVR | 10h |
| R8 Mongabay + DAR | 3h |
| **Total recursos** | **38.5h** |

Más cuestionarios, síntesis y escritura reflexiva: **~50h totales** para la fase. Realista para una fase densa recorrida en ~3 semanas de viaje activo por Cusco + Valle Sagrado + Machu Picchu + descenso a Madre de Dios.

---

## Cosas a validar antes de seedear

1. **R4 Zuidema ceques**: confirmar tipo de recurso — el libro original es denso y sus 600+ pp. pueden ser overkill. Si el pipeline lo complica, sustituir por la síntesis Sherbondy (ya linkeada arriba) o por el capítulo correspondiente en Rostworowski (R1).
2. **R5 Machu Picchu**: considerar si sumar el libro de Richard Burger y Lucy Salazar *Machu Picchu: Unveiling the Mystery of the Incas* (Yale University Press, 2004) como recurso primario en lugar de los artículos Infobae. Infobae es periodismo riguroso pero no es Yale. Depende del apetito del usuario por inglés académico.
3. **R6 Documental Túpac Amaru II**: verificar la URL final del episodio de *Sucedió en el Perú*. Plan B: repositorio del Bicentenario con los 4 tomos documentales (texto) + conversatorios subidos a YouTube del Proyecto Bicentenario.
4. **C3 Vilcabamba y C6 Valle Sagrado sin recurso propio**: decidir si sumar R9 (sugerencia: *Vilcabamba y la conquista de los incas* de Vincent Lee, o un paper SciELO específico) o dejarlos apoyados en los capítulos correspondientes de R1+R3. Juicio del coordinator: apoyar en R1+R3 es suficiente y evita diluir. Pero marcarlo como punto de discusión con el usuario.
5. **Tipos de recurso**: R4 y R7 pueden chocar con el enum `resource_type` (`paper, book, video, course, article`). R4 es libro corto derivado de tesis — `book` funciona. R7 es informe oficial — `book` también funciona aunque semánticamente es un *informe*. Verificar con el ejecutor si hace falta ampliar el enum.
6. **Complemento literario opcional**: *Los ríos profundos* de Arguedas (R10 potencial) y *Lituma en los Andes* de Vargas Llosa son lectura complementaria fuerte para C7 pero no son rigurosos como historia. Queda a criterio del usuario si quiere sumarlos como lectura "lateral" no evaluable — no los seedeo como recursos del track porque el track es de rigor académico.
7. **Integración con pipeline**: los PDFs largos (R1, R3, R7) entran como `resource_page_range` segmentados; los artículos web (R5, R8) se resuelven y procesan; el documental R6 pasa por el pipeline YouTube estándar (resolve → segment → content → quizzes). R4 puede ir como PDF o como página PUCP.

---

## Próximos pasos del coordinator

Mientras el ejecutor sigue con infra:
- [ ] Resolver los 4 puntos de `[revisar]` arriba (R4 tipo, R5 Burger opcional, R6 URL final, R9 eventual para C3/C6)
- [ ] Cross-check con F1: los prereqs `travel-f1-*` existen en el seed de F1 y coinciden en naming con los usados aquí
- [ ] Actualizar `PROGRESS.md` con el cierre de Fase 9 (es la fase más densa hasta ahora)
- [ ] Empezar a bocetar Fase 10 (probable: Andes del centro — Ayacucho, Huancavelica, Huamanga, Huancayo, epicentro CVR propiamente dicho) — notar que C7 de esta F9 quedará enriquecido ahí
