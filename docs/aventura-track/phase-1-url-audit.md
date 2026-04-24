# Aventura F1 — Auditoría URL-por-URL de los 49 HTML no-ingeribles

**Fecha:** 2026-04-23 (original) · **Escalamiento A#1+A#2:** 2026-04-23 (segundo turno executor)
**Rol:** executor · chunk A (auditoría previa a migration de fix) + escalamiento A#1/A#2 (4 papers académicos con host bloqueado)
**Scope:** los **49 recursos HTML** de `aventura` F1 que hoy devuelven `pipeline_support='unsupported'`. Los 2 restantes (`aventura-r-crisis-group-darien-bottleneck` y `aventura-r-gitoc-gulf-clan-darien`) ya son PDF directo y quedan fuera del alcance.
**Objetivo:** clasificar cada uno en **P / Y / R / X** con URL final propuesta (verificada via `curl -I` o `WebFetch`) como insumo del chunk B (migration SQL de UPDATE/DELETE/INSERT).
**Escalamiento 2026-04-23 (segundo turno):** 4 papers académicos marcados X por host bloqueado en chunk A (Urabá, Kastner, Miller, Rigg) revisitados con OpenAlex + Semantic Scholar APIs + mirrors institucionales. Resultado: **1 recuperado a P (Rigg → UNA Costa Rica), 3 X confirmados sin mirror OA**. Neto post-escalamiento: **P=9, Y=2, R=0, X=38, Total=49**.
**NO se ejecutó ningún cambio a DB ni a código en ninguno de los dos turnos.**

---

## 1. Resumen numérico

| Bucket | Criterio | Cantidad (post-escalamiento 2026-04-23) |
|---|---|---|
| **P** | Swap a PDF verificado del mismo autor/host | **9** (era 8) |
| **Y** | Swap a YouTube con captions | **2** |
| **R** | Reemplazo por fuente equivalente (nuevo recurso) | **0** |
| **X** | Link externo permanente (sin alternativa aceptable) | **38** (era 39) |
| **Total** | | **49** |

- **Escalamiento 2026-04-23** (ver Apéndice A #1 y #2): de los 4 papers académicos con host bloqueado, 1 (Rigg) ganó mirror OA legítimo en UNA Costa Rica descubierto vía OpenAlex API; los otros 3 (Urabá, Kastner, Miller) quedan X confirmado — ni Semantic Scholar ni OpenAlex reportan mirror OA, y los repositorios institucionales probados devolvieron stubs, DSpace 7 JS-only, o bitstreams de "accesoRestringido.pdf".
- **⚠ Decisiones bloqueantes para el usuario antes de chunk B:** **5** (detalladas en Apéndice A). A#1 y A#2 pierden peso con el escalamiento: los 3 papers restantes (Urabá, Kastner, Miller) confirmados X sin alternativa verificable.
- **Estimación de mejora post-swap (si se ejecuta P+Y sin bloqueo):** de **2 ingeribles** hoy (3.9 %) a **13 ingeribles** (25.5 %). Post-escalamiento: techo efectivo = 13 (9 P + 2 Y + 2 PDF existentes). Más allá de eso, los 38 X restantes son irreemplazables (3 papers académicos con host bloqueado + fuentes primarias gunas + blog de Edelmayer + libros con copyright + periodismo long-form + sitios gubernamentales HTML).

---

## 2. Tabla principal (49 filas)

Columnas:
- **id** — `aventura-r-*`
- **bucket** — P / Y / R / X (⚠ cuando necesita decisión del usuario)
- **url_actual** — la URL HTML unsupported vigente en remote
- **url_propuesta** — la URL final propuesta para la migration de fix (misma que la actual si bucket=X)
- **http_verif** — resultado de `curl -sI -L -A "<UA navegador>"` sobre la URL propuesta
- **notas** — 1 línea: fuente de la propuesta, captions (si Y), por qué X, o ⚠

### C1 — Oceanografía del Golfo de Urabá (5 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-uraba-tropical-estuary-review` | **X** ⚠ | link.springer.com/article/10.1007/s12601-022-00093-9 | *(mantener)* | — | Springer `/content/pdf/…` requiere cookie idp; RG PDF da 403 Cloudflare; no hay OA mirror verificable. ⚠ ver Apéndice A #1. |
| `aventura-r-kastner-pcg-eddies-2024` | **X** ⚠ | journals.ametsoc.org/view/journals/phoc/54/10/JPO-D-24-0049.1.xml | *(mantener)* | — | AMS responde 202 (cookie challenge) a `/downloadpdf/…`; Stanford Coastal Dynamics Lab publications 2024 lista el paper pero da 403 a WebFetch; sin arxiv/escholarship. ⚠ ver Apéndice A #1. |
| `aventura-r-toro-circulacion-uraba-cioh` | **X** | ojs.dimar.mil.co/index.php/CIOH/article/view/516 | *(mantener)* | — | DIMAR usa Incapsula; `/article/download/516/637` devuelve 403. RG y Scielo mirrors son papers distintos (no este). Sin OA PDF accesible al bot. |
| `aventura-r-frank-wolf-darien-paddlingmag` | **X** | paddlingmag.com/stories/columns/fathom/darien-gap/ | *(mantener)* | — | Crónica editorial de Paddling Magazine. Sin PDF ni canal YT con la misma entrevista. Irreemplazable como narrativa vivencial del paddler. |
| `aventura-r-dimar-derroteros-caribe` | **X** | cioh.dimar.mil.co/index.php/es/publicaciones-nauticas | *(mantener)* | — | Catálogo HTML que distribuye cartas físicas vía Capitanía de Puerto + Avisos a Navegantes PDF rotan mensualmente. No hay un PDF único estable a qué apuntar. |

### C2 — Tapón del Darién (7 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-miller-minding-the-gap` | **X** ⚠ | journals.uchicago.edu/doi/full/10.1093/envhis/emu002 | *(mantener)* | — | U. Chicago `/doi/pdf/…` da 403 Cloudflare. BYU ScholarsArchive (Miller es BYU) responde 202. Open Access Button sin match. ⚠ ver Apéndice A #2. |
| `aventura-r-stri-darien-carbon-2019` | **X** ⚠ | conbio.onlinelibrary.wiley.com/doi/10.1111/csp2.42 | *(mantener)* | — | Wiley `/doi/pdfdirect/…` y `/doi/epdf/…` dan 403 Cloudflare. STRI bibliography-search bloqueado por Cloudflare challenge. ⚠ ver Apéndice A #2. |
| `aventura-r-jstor-daily-panam-highway` | **X** | daily.jstor.org/the-pan-american-highway-and-the-darien-gap/ | *(mantener)* | — | JSTOR Daily publica solo HTML editorial; no ofrece PDF. Es el puente divulgativo a Miller; se mantiene como referencia externa. |
| `aventura-r-iucn-darien-outlook` | **X** | worldheritageoutlook.iucn.org/node/972 | *(mantener)* | — | Assessment IUCN servido solo como HTML en `/node/972`. Los únicos PDFs enlazados en esa página son de documentos externos (Gaceta Oficial Panamá, Prisma Regional) no del assessment. Sin PDF export visible. |
| `aventura-r-mongabay-radwin-darien-2025` | **X** | es.mongabay.com/2025/09/darien-tapon-panama-deforestacion-proteccion/ | *(mantener)* | — | Mongabay no publica PDF ni video propio del artículo. |
| `aventura-r-outside-in-darien-gap` | **X** | outsideinradio.org/transcript-the-darien-gap | *(mantener)* | — | El episodio está en NPR/Apple Podcasts/NHPR pero NO tiene versión YouTube. El pipeline no soporta MP3. Irreemplazable como audio-doc con Huertas/Korten. |
| `aventura-r-pbs-drost-darien` | **Y** | pbs.org/newshour/show/what-migrants-face-as-they-journey-through-the-deadly-darien-gap | **https://www.youtube.com/watch?v=XMPX1547Pss** | YT 200 · captions EN auto-generated (yt-dlp `--list-subs` OK) | Canal oficial "PBS NewsHour". Mismo título exacto que el recurso actual ("What migrants face as they journey through the deadly Darien Gap"). Publicado 12-ago-2020 con Nadja Drost + Bruno Federico — Pulitzer 2021. |

### C3 — Guna Yala (6 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-reglamento-turismo-gunayala` | **X** | gunayala.org.pa/Reglamento%20de%20Turismo.htm | *(mantener)* | — | Fuente primaria indígena viva (Congreso General Guna). El sitio oficial no publica PDF del reglamento. Irreemplazable — reemplazar por paper académico subvertiría el criterio de fuente primaria. |
| `aventura-r-gunayala-resumen-oficial` | **X** | gunayala.org.pa/gunayala_en_resumen.htm | *(mantener)* | — | Fuente primaria indígena (Anelio Merry López, Depto Comunicación del Congreso). Mismo razonamiento que el anterior. |
| `aventura-r-howe-people-who-would-not-kneel` | **X** | amazon.com/PEOPLE-WHO-WOULD-NOT-KNEEL/dp/1560988657 | *(mantener)* | — | Libro con copyright vigente (Smithsonian Institution Press, 2009). El link apunta al listing Amazon como referencia; el pipeline no puede ingerir este texto. Se mantiene como "lectura offline". |
| `aventura-r-howe-chiefs-scribes` | **X** | utpress.utexas.edu/9780292725713/ | *(mantener)* | — | Libro con copyright vigente (UT Press, 2009). Mismo caso anterior. |
| `aventura-r-bila-burba-documental` | **X** | letterboxd.com/film/bila-burba/ | *(mantener)* | — | Película en distribución comercial (Pragda). En YouTube sólo hay trailers de 3–7 min (p.ej. `dssZRDDuigI`, `06afClopZo0`), no el documental completo de 70 min. El trailer no tiene peso pedagógico equivalente — mejor mantener link Letterboxd como referencia a la obra. |
| `aventura-r-cultural-survival-statute-tourism` | **X** | culturalsurvival.org/publications/cultural-survival-quarterly/kuna-general-congress-and-statute-tourism | *(mantener)* | — | Cultural Survival Quarterly publica sólo HTML; no hay PDF. |

### C4 — Emberá y Wounaan (5 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-naval-embera-wounaan-espiga` | **X** | revistas.uned.ac.cr/index.php/espiga/article/view/5587 | *(mantener)* | — | OJS UNED Costa Rica — el galley HTML no expuso un `/article/download/5587/<id>` verificable al probe. Sin mirror CSIC/DIALNET identificado con coautoría wounaan. (Próxima sesión podría reintentar con un WebFetch al HTML buscando link "PDF" en la interfaz OJS.) |
| `aventura-r-herlihy-choco-relocation-cs` | **X** | culturalsurvival.org/publications/cultural-survival-quarterly/choco-indian-relocation-darien-panama | *(mantener)* | — | Cultural Survival Quarterly HTML only. |
| `aventura-r-mongabay-bilbao-estrategia-darien` | **X** | es.mongabay.com/2019/06/indigenas-panama-darien-video/ | *(mantener)* | — | Mongabay sin PDF. El video embebido en el artículo es de Pulitzer Center/Mongabay y no está en YouTube oficial como pieza aislada. |
| `aventura-r-theodossopoulos-trap-authenticity` | **P** | kar.kent.ac.uk/34014/ | **https://kar.kent.ac.uk/34014/1/2013%20The%20trap%20of%20Authenticity%20AQ.pdf** | `200 · application/pdf · 228 549 B` | AAM open access en Kent Academic Repository del propio autor. Link ya listado como descarga en la ficha KAR. |
| `aventura-r-ley-72-2008-tierras-colectivas` | **P** | ecolex.org/.../lex-faoc095794/ | **https://faolex.fao.org/docs/pdf/pan95794.pdf** | `200 · application/pdf · 72 290 B` | FAO-LEX publica la ley en PDF. La URL ya estaba listada como referencia en el `description` original del recurso. |

### C5 — Migración y Clan del Golfo (4 HTML · 2 ya PDF)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-hrw-neglected-jungle-darien` | **P** | hrw.org/report/2024/04/03/neglected-jungle/inadequate-protection-and-assistance-migrants-and-asylum-seekers | **https://www.hrw.org/sites/default/files/media_2024/04/americas0424%20web.pdf** | `200 · application/pdf · 7 007 331 B` | HRW publica los reports completos en `/sites/default/files/…`. Link encontrado haciendo GET al HTML de la report page. |
| `aventura-r-infobae-peor-que-darien-maritima` | **X** | infobae.com/colombia/2025/03/07/es-peor-que-el-darien-el-relato-de-los-migrantes-que-vuelven-a-colombia-via-maritima/ | *(mantener)* | — | Periodismo Infobae sin PDF. Es la única crónica 2025 que describe las rutas marítimas de retorno — irreemplazable. |
| `aventura-r-insightcrime-darien-profit` | **X** | insightcrime.org/news/organized-crime-profits-migrants-darien-gap/ | *(mantener)* | — | InSight Crime publica sólo HTML editorial. |
| `aventura-r-senafront-transito-irregular` | **P** ⚠ | migracion.gob.pa/estadisticas/ | **https://www.migracion.gob.pa/wp-content/uploads/MOVIMIENTO-MIGRATORIO-2025-3.pdf** | `200 · application/pdf · 302 593 B` | SNM publica PDFs mensuales y acumulativos en `/wp-content/uploads/`. Propuesta = cumulativo anual 2025. ⚠ ver Apéndice A #3 (política link-rot: anual vs mensual). |

### C6 — Travesías históricas (5 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-wafer-isthmus-1699` | **P** | archive.org/details/newvoyagedescrip03wafe | **https://archive.org/download/newvoyagedescrip03wafe/newvoyagedescrip03wafe.pdf** | `302 → 200 · application/pdf · 59 803 624 B` | Libro 1729 dominio público. archive.org redirige al mirror `ia601401.us.archive.org` y sirve PDF. El pipeline sigue redirects, y el path termina en `.pdf`. |
| `aventura-r-las-casas-historia-indias-iv` | **P** | gutenberg.org/files/56283/56283-h/56283-h.htm | **https://archive.org/download/las-casas-bartolome-de.-historia-de-las-indias-vol.-4-de-5-1876/Las%20Casas%2C%20Bartolom%C3%A9%20de.%20-%20Historia%20de%20las%20Indias%20%28vol.%204%20de%205%29%20%5B1876%5D.pdf** | `302 → 200 · application/pdf · 2 035 834 B` | Project Gutenberg ID 56283 no ofrece PDF para este título (solo HTML/EPUB/MOBI). archive.org sí tiene el mismo texto en una edición Madrid 1876 — edición comparable en contenido del Tomo IV, con capítulos que cubren la travesía de Balboa 1513. |
| `aventura-r-sauer-early-spanish-main` | **X** ⚠ | archive.org/details/earlyspanishmain00saue_0 | *(mantener)* | — | archive.org `/download/…/earlyspanishmain00saue_0.pdf` redirige a mirror con 401 Unauthorized — ítem bajo Controlled Digital Lending (no es dominio público, Sauer 1966). Sin login no accesible al bot. ⚠ ver Apéndice A #4. |
| `aventura-r-blashford-snell-darien-conquest` | **X** | bradtguides.com/the-darien-conquest-crossing-the-gap/ | *(mantener)* | — | Artículo editorial Bradt Guides sin PDF adjunto. El film ACMI ID 66601 no está digitalizado. |
| `aventura-r-hoffmeister-south-america-plan` | **X** | freyahoffmeister.com/expeditions/south-america-2011-15/plan-and-facts-sa/plan-and-facts-sa-english | *(mantener)* | — | Sitio personal. Hoffmeister no publica PDF de la expedición SA ni documental YouTube específico del tramo Guna Yala. Irreemplazable como demostración empírica contemporánea. |

### C7 — Logística operativa (5 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-snm-panama-requisitos-turistas` | **X** | migracion.gob.pa/turistas/ | *(mantener)* | — | SNM publica la página de requisitos sólo como HTML. |
| `aventura-r-paddling-mag-satellite-communicators` | **X** | paddlingmag.com/gear/accessories/safety-rescue/satellite-communicators/ | *(mantener)* | — | Comparativa editorial de Paddling Magazine. Sin PDF ni video. |
| `aventura-r-paddling-mag-touring-kayaks-2026` | **X** | paddlingmag.com/boats/kayaks/touring-kayak/ | *(mantener)* | — | Mismo caso. |
| `aventura-r-freya-hoffmeister-equipment` | **X** | freyahoffmeister.com/sponsors/current-equipment | *(mantener)* | — | Listado personal HTML. Sin PDF. |
| `aventura-r-aca-l3-coastal-trip-leader` | **X** | americancanoe.org/event/level-3-coastal-kayaking-trip-leader-skills-course/ | *(mantener)* | — | Info de curso HTML. ACA no publica el handbook del L3 como PDF público. |

### C8 — Fauna y salud tropical (6 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-cdc-yellow-book-panama` | **X** | wwwnc.cdc.gov/travel/yellowbook/2024/preparing/yellow-fever-vaccine-malaria-prevention-by-country/panama | *(mantener)* | — | CDC Yellow Book por país se publica sólo como HTML (sección de un capítulo más amplio). No hay PDF por país. |
| `aventura-r-cdc-colombia-travelers-health` | **X** | wwwnc.cdc.gov/travel/destinations/traveler/none/colombia | *(mantener)* | — | CDC Travelers' Health por destino — sólo HTML. |
| `aventura-r-paho-yellow-fever-americas-2025` | **P** | paho.org/en/documents/epidemiological-update-yellow-fever-americas-region-24-april-2025 | **https://www.paho.org/sites/default/files/2025-05/2025-april-24-phe-epiupdate-yellow-fever-final.pdf** | `200 · application/pdf · 1 128 500 B` | PAHO adjunta PDF oficial del epi-update. Link encontrado haciendo GET al HTML de la documento-page. |
| `aventura-r-ins-colombia-bes` | **P** ⚠ | ins.gov.co/buscador-eventos/Paginas/Vista-Boletin-Epidemilogico.aspx | **https://www.ins.gov.co/buscador-eventos/BoletinEpidemiologico/2025_Boletin_epidemiologico_semana_1.pdf** | `200 · application/pdf · 4 133 931 B` | PDF semanal del INS. El ejemplar SE01/2025 existe y abre. ⚠ ver Apéndice A #5 (política link-rot: apuntar a una semana fija vs el índice dinámico). |
| `aventura-r-rigg-sandflies-panama` | **P** ✓ | pmc.ncbi.nlm.nih.gov/articles/PMC6447106/ | **https://repositorio.una.ac.cr/bitstreams/ecb86f96-80b6-4acc-8d66-c78c2fbdc0ac/download?filename=rigg-2019-leishmania-sandflies-panama.pdf** | `200 · application/pdf · 488 251 B` | Mirror OA legítimo en DSpace de la **Universidad Nacional de Costa Rica (UNA)**, primer autor Luis F. Chaves está afiliado a UNA. Descubierto vía OpenAlex API (`locations[].landing_page_url = hdl.handle.net/11056/22465`); corroborado por Semantic Scholar API (`isOpenAccess=true, status=GREEN`). El bitstream real sirve PDF v1.4 10 pp a fetcher anónimo. La URL nativa `/bitstreams/<uuid>/download` no termina en `.pdf`; se agrega querystring `?filename=…pdf` para que `isLikelyPdfUrl` la acepte (`search.includes('.pdf')`) sin alterar la respuesta del server (DSpace ignora el param). **Swap escalamiento 2026-04-23** — ver Apéndice A #2. |
| `aventura-r-lakkis-jellyfish-practical` | **X** | pubmed.ncbi.nlm.nih.gov/25935311/ | *(mantener)* | — | PubMed sólo muestra abstract. Wilderness & Environmental Medicine no tiene OA del paper. Sin mirror. |

### C9 — Riesgo, decisión, rescate (6 recursos)

| id | bucket | url_actual | url_propuesta | http_verif | notas |
|---|---|---|---|---|---|
| `aventura-r-edelmayer-darien-kayak-guide` | **X** | keiferaedelmayer.com/blog/a-guide-to-kayaking-from-panama-to-colombia-aka-the-darien-gap | *(mantener)* | — | Blog personal del único paddler que documentó el cruce en 2023. Sin PDF ni video YouTube del mismo contenido. **Ancla operativa de C9, irreemplazable.** |
| `aventura-r-broze-gronseth-deep-trouble` | **X** ⚠ | archive.org/details/seakayakersdeept0000broz | *(mantener)* | — | archive.org sirve el PDF bajo Controlled Digital Lending — 401 Unauthorized al bot (libro con copyright vigente, 1997). ⚠ ver Apéndice A #4. |
| `aventura-r-gonzales-deep-survival` | **X** | laurencegonzales.com | *(mantener)* | — | Homepage del autor. Libro con copyright. Sin PDF accesible. |
| `aventura-r-will-gadd-misadventure-risk` | **Y** ⚠ | deliveringadventure.com/2022/11/07/episode-6-how-to-avoid-misadventure-part-2-with-will-gadd/ | **https://www.youtube.com/watch?v=FSh0KZrWumo** | YT 200 · captions auto (yt-dlp OK) | Canal oficial "Delivering Adventure Podcast". Episodio **S2.E09 "How to Communicate Risk with Will Gadd" (feb-2024)** — NO es el mismo episodio del recurso actual (S1.E06 Misadventure Part 2, nov-2022), que no tiene versión YouTube. Mantiene autor + concepto (proceso vs resultado, comunicar riesgo). **⚠ ver Apéndice A #6** (swap requiere actualizar title + description del recurso, el usuario decide si acepta el cambio de episodio específico). |
| `aventura-r-garmin-response-sos-protocol` | **X** | garmin.com/en-US/satellite-communicators/interactive-sos-and-garmin-response/ | *(mantener)* | — | Landing corporativa HTML. Garmin no publica whitepaper PDF del servicio. |
| `aventura-r-osac-panama-security-report` | **X** | osac.gov/Content/Report/c7575230-2685-4c5d-bd60-1c840cdaf93e | *(mantener)* | — | OSAC Country Security Reports se publican sólo como HTML. Probados endpoints `?output=pdf` y `/api/Report/Download` — ambos dan 404. |

---

## Apéndice A — ⚠ decisiones bloqueantes (6 preguntas)

Cada ítem impacta cuántos recursos quedan en P/Y/R vs X antes de escribir la migration (chunk B). El executor de chunk B necesita respuesta del usuario para estos seis puntos, o default explícito (conservador = "mantener X en caso de duda").

### #1 — Papers académicos de C1 con host bloqueado por challenge (Urabá Springer, Kastner AMS)

**Situación:** `aventura-r-uraba-tropical-estuary-review` y `aventura-r-kastner-pcg-eddies-2024` son los dos papers ancla de C1. Springer bloquea al bot con handshake idp; AMS con challenge 202. No encontré mirror PDF abierto en las fuentes consultadas (ADS, arxiv, Stanford Coastal Dynamics Lab, escholarship UC).

**Pregunta al usuario:** ¿aceptamos **mantener X** para ambos (C1 queda sin ningún recurso ingerible), o invertimos una sesión extra de búsqueda en ResearchGate, repositorios institucionales de Scripps/UC San Diego/U. Antioquia, archivos del propio grupo de investigación?

**Default recomendado:** X en esta ronda. Si más adelante se implementa la opción C (pipeline HTML), estos dos papers serían los principales beneficiados.

**Resultado escalamiento 2026-04-23 (executor):** X confirmado para los dos — sin mirror OA accesible al bot.

| id | veredicto | url_propuesta | http_verif | fuente | notas |
|---|---|---|---|---|---|
| `aventura-r-uraba-tropical-estuary-review` | **X** | — | — | — | Sin mirror OA verificable. OpenAlex API reporta `is_oa=false`, única `location` alternativa es DIGITAL.CSIC `hdl/10261/303495` → bitstream único es `accesoRestringido.pdf` de 15.38 kB (nota de acceso restringido, no el paper). Semantic Scholar idem `isOpenAccess=false`. ResearchGate author-upload 403 Cloudflare. Dialnet 404. SCIELO Colombia timeout DNS. Springer `/content/pdf/…` redirige a article con cookie-error 200 (HTML). ADS sin E-Print. Tiempo invertido: ~12 min. |
| `aventura-r-kastner-pcg-eddies-2024` | **X** | — | — | — | Sin mirror OA verificable. OpenAlex `is_oa=false, oa_status=closed, any_repository_has_fulltext=false` — única `location` reportada es el DOI cerrado en AMS. Semantic Scholar idem `isOpenAccess=false, status=CLOSED`. WWU EHL research page (`sites.google.com/wwu.edu/wwu-ehl/research`) cita el paper pero sin link PDF. WWU College of Environment faculty page idem. UW EFM page idem. ESSOAR / ESS Open Archive 403 al search (challenge), sin preprint identificado para este DOI. ADS sin E-Print. Tiempo invertido: ~12 min. |

### #2 — Papers académicos con Cloudflare challenge o gate interstitial (Miller, STRI, Rigg)

**Situación:**
- `aventura-r-miller-minding-the-gap` (U Chicago) — Cloudflare 403 a `/doi/pdf/…`.
- `aventura-r-stri-darien-carbon-2019` (Wiley OA) — Cloudflare 403 a `/doi/pdfdirect/…` y `/doi/epdf/…`.
- `aventura-r-rigg-sandflies-panama` — la URL `pmc.ncbi.nlm.nih.gov/articles/PMC6447106/pdf/tpmd170628.pdf` pasaría el check syntactic de `isLikelyPdfUrl` pero devuelve HTML 1817 B al fetcher anónimo. Europe PMC sí sirve PDF real (488 KB) pero via `/api/getPdf?pmcid=…` — esa URL no pasa el check (ni path ni search contienen `.pdf`).

**Pregunta al usuario:**
(a) Para Miller/STRI: ¿vale la pena explorar mirrors específicos (BYU ScholarsArchive, RG, STRI internal repo de Mateo-Vega/Potvin en McGill)? Si el bot no puede descargarlos tampoco, sería trabajo perdido.
(b) Para Rigg: ¿aceptamos marcar la URL PMC como "pipeline va a fallar al descargar aunque detecte como PDF" (experiencia degradada pero distinta del mensaje actual)? ¿O preferimos mantener X hasta que el pipeline tenga fallback ASR/HTML?

**Default recomendado:** mantener X hasta tener evidencia de un mirror que sí descargue PDF real al bot.

**Resultado escalamiento 2026-04-23 (executor):** Rigg recuperado como P via UNA Costa Rica (OpenAlex reveló mirror OA). Miller y STRI (pedido: Miller, Rigg — STRI fuera del scope de este escalamiento y queda como estaba en el audit original): Miller confirmado X. Rigg resuelto.

| id | veredicto | url_propuesta | http_verif | fuente | notas |
|---|---|---|---|---|---|
| `aventura-r-rigg-sandflies-panama` | **P** ✓ | `https://repositorio.una.ac.cr/bitstreams/ecb86f96-80b6-4acc-8d66-c78c2fbdc0ac/download?filename=rigg-2019-leishmania-sandflies-panama.pdf` | `200 · application/pdf · 488 251 B` (PDF v1.4, 10 pp) | UNA Costa Rica (DSpace institucional, handle `11056/22465`) | Descubierto vía `api.openalex.org/works/doi:10.4269/ajtmh.17-0628` → `locations[].landing_page_url = hdl.handle.net/11056/22465`. Corroborado por `api.semanticscholar.org/graph/v1/paper/…` (`isOpenAccess=true, openAccessPdf.status=GREEN`). Primer autor Luis F. Chaves está afiliado a UNA — self-archive legítimo, no pirata. El bitstream real responde `application/pdf` 488 KB / 10 pp al bot anónimo. Workaround syntactic: URL nativa `/bitstreams/<uuid>/download` no termina en `.pdf` — se agrega `?filename=rigg-2019-leishmania-sandflies-panama.pdf` para que `isLikelyPdfUrl` la acepte (`search.includes('.pdf')=true`). DSpace ignora el param y devuelve el mismo PDF. Tiempo invertido: ~6 min. |
| `aventura-r-miller-minding-the-gap` | **X** | — | — | — | Sin mirror OA verificable. OpenAlex `is_oa=false, oa_status=closed` — alternate location reportada es `hdl.handle.net/10654/44504` (listada como "Aaltodoc" por OpenAlex pero el prefix real es UMNG — Universidad Militar Nueva Granada de Colombia, handle misaligned). UMNG DSpace 7 responde `<title>DSpace</title>` vacío a curl (página JS-only, sin metadata accesible al bot). Semantic Scholar `isOpenAccess=false`. CV actualizado 2018 de Miller (`history.byu.edu/shawnmillercv-pdf`) NO lista BYU ScholarsArchive ni academia.edu como repositorio personal. BYU Academia.edu profile dice "Miller hasn't uploaded any papers yet". ResearchGate 403 Cloudflare. Tiempo invertido: ~10 min. |

### #3 — SENAFRONT: mensual vs cumulativo anual (link-rot)

**Situación:** `aventura-r-senafront-transito-irregular` hoy apunta al HTML de `migracion.gob.pa/estadisticas/`. En la página hay múltiples PDFs:
- `MOVIMIENTO-MIGRATORIO-MARZO-2026.pdf` (mensual, 676 KB) — el más reciente.
- `MOVIMIENTO-MIGRATORIO-2025-3.pdf` (cumulativo 2025, 303 KB).
- Presumibles `2024-3-2.pdf`, etc.

SNM publica un PDF nuevo cada mes; el link elegido se va a quedar desactualizado rápido.

**Pregunta al usuario:** ¿apuntamos al cumulativo 2025 con nota de re-fetch anual (propuesta por defecto de esta auditoría), al mensual más reciente (se rompe en ~30 días), o mantenemos X?

**Default recomendado:** cumulativo 2025 + documentar en el `description` del recurso y en `PROGRESS.md` el compromiso de re-fetch anual (igual patrón que las notas de link-rot existentes para SNM y ACA).

### #4 — Libros bajo Controlled Digital Lending en archive.org (Sauer, Broze)

**Situación:**
- `aventura-r-sauer-early-spanish-main` → archive.org 401 (Early Spanish Main, 1966, libro con copyright).
- `aventura-r-broze-gronseth-deep-trouble` → archive.org 401 (Deep Trouble, 1997, libro con copyright).

archive.org sirve PDFs de estos items pero solo a usuarios autenticados que "piden prestado" el libro (CDL). El pipeline es bot anónimo — no pasa.

**Pregunta al usuario:** ¿los mantenemos como X (lectura offline no-ingesting) o intentamos reemplazarlos por otra fuente con peso académico equivalente (bucket R)?

**Default recomendado:** X. Ambos libros son canónicos — reemplazarlos por un paper "sobre lo mismo" subvertiría el criterio original de curaduría. El valor del recurso ya vive en el `canonical_definition` del concepto.

### #5 — INS Colombia BES: semana fija vs página índice

**Situación:** `aventura-r-ins-colombia-bes` hoy apunta al buscador HTML del INS. El PDF canónico semanal (`2025_Boletin_epidemiologico_semana_1.pdf`) existe y abre, pero (a) cada semana publican uno nuevo, (b) la numeración SE-XX rota. Apuntar a una semana fija significa que dentro de un año estará desactualizada.

**Pregunta al usuario:** ¿apuntamos al PDF de SE01/2025 (más estable que el índice pero se deprecia en meses), a un PDF por semana más reciente (se rompe semanalmente), o mantenemos el índice HTML actual (X)?

**Default recomendado:** apuntar a SE01/2025 con nota de re-fetch mensual/trimestral en `description` (patrón simétrico con SENAFRONT). Acepta link-rot como costo del ingest.

### #6 — Swap del Will Gadd a otro episodio

**Situación:** `aventura-r-will-gadd-misadventure-risk` hoy apunta al episodio **S1.E06 "How to Avoid Misadventure Part 2"** (nov-2022). Ese episodio no tiene versión YouTube. Sí existe en YouTube canal oficial el **S2.E09 "How to Communicate Risk"** (feb-2024, `FSh0KZrWumo`) con captions auto.

Ambos episodios ya están listados en el `description` actual del recurso como "dos episodios"; el episodio YouTube (2024) es el segundo. Swap significa: que el recurso quede apuntando al episodio de 2024, con su título actualizado.

**Pregunta al usuario:** ¿autorizás el swap + actualizar title del recurso a "Will Gadd: How to Communicate Risk (Delivering Adventure podcast, S2.E09)" y `description` reducida a ese episodio? El episodio de Misadventure Part 2 puede quedar mencionado como ampliación en `description` (sin ser el recurso principal). O preferís mantener X (el episodio de 2022 es el recurso primario).

**Default recomendado:** swap con title/description actualizados. Ambos episodios son de Will Gadd, ambos articulan el mismo marco de "proceso vs resultado en decisiones de riesgo", y gana un recurso ingerible con captions.

---

## Apéndice B — X razonados (por qué no hay alternativa)

Lista compacta de los 39 recursos que quedan como link externo permanente, agrupados por razón.

**Fuentes primarias indígenas vivas (irreemplazables por diseño):**
- `aventura-r-reglamento-turismo-gunayala`, `aventura-r-gunayala-resumen-oficial` — sitio oficial Congreso General Guna, solo HTML.

**Libros con copyright vigente (pipeline no puede ingerir):**
- `aventura-r-howe-people-who-would-not-kneel` (Smithsonian Press 2009) — Amazon listing.
- `aventura-r-howe-chiefs-scribes` (UT Press 2009) — UT Press listing.
- `aventura-r-gonzales-deep-survival` (W.W. Norton 2003/2017) — author homepage.
- `aventura-r-sauer-early-spanish-main` (1966) — archive.org CDL bloqueado (⚠ A#4).
- `aventura-r-broze-gronseth-deep-trouble` (1997) — archive.org CDL bloqueado (⚠ A#4).

**Blogs personales / crónicas / YouTubers sin versión descargable:**
- `aventura-r-frank-wolf-darien-paddlingmag` — crónica Paddling Mag.
- `aventura-r-edelmayer-darien-kayak-guide` — **ancla operativa C9**, único trip report público de la ruta.
- `aventura-r-hoffmeister-south-america-plan`, `aventura-r-freya-hoffmeister-equipment` — sitio personal Hoffmeister.

**Periodismo HTML sin PDF:**
- `aventura-r-jstor-daily-panam-highway`, `aventura-r-mongabay-radwin-darien-2025`, `aventura-r-mongabay-bilbao-estrategia-darien`, `aventura-r-infobae-peor-que-darien-maritima`, `aventura-r-insightcrime-darien-profit` — Mongabay, JSTOR Daily, Infobae, InSight Crime no publican PDF.
- `aventura-r-herlihy-choco-relocation-cs`, `aventura-r-cultural-survival-statute-tourism` — Cultural Survival Quarterly HTML-only.

**Documentales / podcasts sin YouTube oficial equivalente:**
- `aventura-r-bila-burba-documental` — sólo trailers YouTube de 3–7 min; documental completo en distribución comercial (Pragda).
- `aventura-r-outside-in-darien-gap` — audio-doc NHPR, sin versión YouTube del episodio.

**Sitios oficiales HTML sin PDF específico:**
- `aventura-r-snm-panama-requisitos-turistas` — requisitos SNM.
- `aventura-r-osac-panama-security-report` — OSAC Country Security Report.
- `aventura-r-garmin-response-sos-protocol` — landing Garmin.
- `aventura-r-dimar-derroteros-caribe` — catálogo DIMAR (cartas físicas + avisos que rotan).
- `aventura-r-aca-l3-coastal-trip-leader` — info de curso ACA.
- `aventura-r-cdc-yellow-book-panama`, `aventura-r-cdc-colombia-travelers-health` — CDC HTML por país.
- `aventura-r-iucn-darien-outlook` — assessment IUCN solo HTML en la ficha `/node/972`.

**Editorial gear / comparativas sin PDF:**
- `aventura-r-paddling-mag-satellite-communicators`, `aventura-r-paddling-mag-touring-kayaks-2026` — Paddling Mag.
- `aventura-r-blashford-snell-darien-conquest` — Bradt Guides.

**Papers académicos con host bloqueante (⚠ A#1 y A#2):**
- `aventura-r-uraba-tropical-estuary-review` — Springer idp (post-escalamiento 2026-04-23: X confirmado, sin mirror OA en OpenAlex/S2).
- `aventura-r-kastner-pcg-eddies-2024` — AMS cookie challenge (post-escalamiento: X confirmado, OpenAlex `any_repository_has_fulltext=false`).
- `aventura-r-toro-circulacion-uraba-cioh` — DIMAR Incapsula.
- `aventura-r-miller-minding-the-gap` — U Chicago Cloudflare (post-escalamiento: X confirmado; Miller no archiva en BYU ScholarsArchive ni academia.edu per CV 2018 y profile vacío).
- `aventura-r-stri-darien-carbon-2019` — Wiley Cloudflare.
- ~~`aventura-r-rigg-sandflies-panama`~~ — **movido a P post-escalamiento 2026-04-23** (UNA Costa Rica OA mirror).
- `aventura-r-lakkis-jellyfish-practical` — PubMed abstract-only, paper sin OA.
- `aventura-r-naval-embera-wounaan-espiga` — OJS UNED sin galley PDF identificado.

---

## Apéndice C — Estimación de mejora de ingeribilidad

| Estado | Ingeribles | % | Detalle |
|---|---|---|---|
| Pre-fix (hoy) | 2 | 3.9 % | ICG Bottleneck + GI-TOC Gulf Clan |
| Post P+Y post-escalamiento 2026-04-23 (mejor caso, usuario aprueba 5 ⚠ restantes como Y/P) | **13** | **25.5 %** | +9 P + 2 Y — se agrega Theodossopoulos, Wafer, HRW, PAHO, INS (A#5), SENAFRONT (A#3), Ley 72, Las Casas Vol 4, **Rigg UNA Costa Rica (A#2 post-escalamiento)**, PBS Drost, Will Gadd (A#6) |
| Post P+Y con defaults conservadores | **13** | **25.5 %** | Mismo set — los defaults recomendados son swap para A#3/A#5/A#6 y X para A#1/A#4; Rigg (A#2) pasó a P con evidencia |
| Peor caso (usuario descarta los 5 ⚠ restantes) | **9** | **17.6 %** | 7 P sin ⚠ (Theodossopoulos, Wafer, HRW, PAHO, Ley 72, Las Casas, **Rigg UNA**) + 1 Y sin ⚠ (PBS Drost) + los 2 PDF existentes |
| Techo teórico si se escala opción C (pipeline HTML) | ~35–45 | 68–88 % | Muchas de las 38 X restantes son HTML de calidad que hoy fallan solo porque el pipeline no extrae texto de HTML. Queda fuera de scope según decisión del usuario 2026-04-23. |

**Conclusión práctica (post-escalamiento):** chunk B puede arrancar con los **7 P no-bloqueados + 1 Y no-bloqueado = 8 swaps seguros** sin esperar respuesta del usuario (Rigg pasa a no-bloqueado porque la evidencia escalada resolvió ⚠#2 para ese recurso). Una vez resueltas las 5 preguntas ⚠ restantes del Apéndice A, se extiende el UPDATE set hasta 11 recursos. Los 38 X quedan como link externo permanente.

---

## Apéndice D — Notas técnicas para el executor del chunk B

- **Patrón de verificación usado en esta auditoría:** `curl -sI -L --max-time 25 -A "Mozilla/5.0 …" <url>` — el pipeline de Jarre pasará por el mismo fetcher anónimo. Una URL que responde 200+application/pdf a este test va a funcionar al pipeline.
- **archive.org sirve PDFs via redirect** a mirrors `dnXXX.*.archive.org` o `iaYYY.us.archive.org`. El pipeline sigue redirects normalmente. La URL canónica `archive.org/download/IDENTIFIER/FILE.pdf` queda como la que persiste en DB.
- **Encoding de URLs:** algunos PDFs archive.org (Las Casas Vol 4) tienen espacios, tildes, comas y corchetes en el filename. Hay que percent-encodear correctamente: `%20` espacios, `%C3%A9` é, `%2C` coma, `%28 %29` paréntesis, `%5B %5D` corchetes.
- **`detectPipelineSourceType` (ver `src/lib/utils/resource-url.ts:43`) es syntactic**, no chequea content-type. Una URL que termina en `.pdf` pasa el check aunque el host devuelva HTML. Esto aplica al caso Rigg PMC discutido en ⚠ A#2.
- **La migration de fix (chunk B) va a ser 100% UPDATE** — no hay bucket R en esta ronda, así que no hacen falta DELETE+INSERT. Pattern directo del fix-travel (`20260423010000_fix_travel_broken_urls.sql`). `BEGIN; UPDATE … WHERE id=…; UPDATE … WHERE id=…; COMMIT;`.
- **Si un swap trae `type` cambiado** (caso Y: Will Gadd de `article` a `video`), el UPDATE incluye `SET url=…, type='video'`. PBS Drost ya era `type='video'` → solo UPDATE de `url`.
- **Idempotencia:** siguiendo el patrón de travel, cada `UPDATE` es idempotente (re-ejecutar no rompe). No hace falta `ON CONFLICT` porque las filas ya existen en la tabla — `UPDATE … WHERE id=…` simplemente re-setea los mismos valores la segunda vez.
- **Post-push verificación (post-escalamiento):** correr la query de `pipeline_support` del `NEXT-SESSION-resource-format-fix.md § 2` filtrada por `track='aventura' AND phase='1'` debería dar `pdf_direct + youtube ≥ 11`, `html_unsupported ≤ 40`.
- **Workaround DSpace-bitstream para el caso Rigg (A#2 escalamiento):** `isLikelyPdfUrl` es syntactic y sólo mira `pathname.endsWith('.pdf') || search.includes('.pdf')`. DSpace 7 sirve bitstreams en URLs `/bitstreams/<uuid>/download` (o `/server/api/core/bitstreams/<uuid>/content` tras redirect), ninguna de las dos termina en `.pdf`. Se agrega querystring `?filename=<slug>.pdf` a la URL original del handle — DSpace **ignora** el parámetro (probado: mismo `application/pdf` 488 251 B con y sin el querystring), pero gana que `search.includes('.pdf')` devuelva true y el pipeline la clasifique como `pdf`. Patrón reutilizable para futuros bitstreams DSpace en repositorios institucionales OA. **Verificado con `node -e "new URL(…)"`**: search = `?filename=rigg-2019-leishmania-sandflies-panama.pdf`, `search.toLowerCase().includes('.pdf') === true`.
- **APIs usadas en el escalamiento (reutilizables):** `https://api.openalex.org/works/doi:<DOI>?select=locations,best_oa_location,open_access` devuelve `any_repository_has_fulltext` + lista de mirrors OA (handle, bitstream_url) más fiable que WebSearch. `https://api.semanticscholar.org/graph/v1/paper/<DOI>?fields=openAccessPdf,isOpenAccess` corrobora. Si ambas dicen `is_oa=false` + `any_repository_has_fulltext=false`, asumir X con confianza alta — sin mirror OA conocido a nivel agregador global. Si una reporta `pdf_url`, verificar con `curl` + User-Agent navegador que el server responda `application/pdf` real (no redirect a HTML).
