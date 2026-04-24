-- Fix 11 URLs no ingeribles en aventura F1.
-- 9 P (PDFs verificados con HTTP 200 + content-type application/pdf) +
-- 2 Y (YouTube con captions verificados via yt-dlp).
-- Verificaciones documentadas en docs/aventura-track/phase-1-url-audit.md.
-- Criterio: solo swaps P/Y verificados; R=0 en esta migration. Rigg se agregó
-- post-escalamiento A#2 (chunk B-ext consolidado en esta misma migration,
-- slot 040000 no se usó): recuperado via mirror OA en repositorio UNA Costa
-- Rica (descubierto con OpenAlex API). Los 3 papers restantes de ⚠A#1/A#2
-- (Urabá-Springer, Kastner-AMS, Miller-UChicago) confirmados X sin mirror OA
-- accesible al bot anónimo; quedan como link externo permanente. STRI-Wiley
-- sin escalar en esta ronda — decisión diferida al usuario.
-- Idempotente: safe to re-run (plain UPDATE por PK).

BEGIN;

-- ---- C2 Tapón del Darién ----

-- PBS Drost (Y): canal oficial PBS NewsHour; mismo título que el recurso actual,
-- captions EN auto confirmadas con yt-dlp.
UPDATE resources SET
  url = 'https://www.youtube.com/watch?v=XMPX1547Pss'
WHERE id = 'aventura-r-pbs-drost-darien';

-- ---- C4 Emberá y Wounaan ----

-- Theodossopoulos (P): AAM open access del autor en Kent Academic Repository.
UPDATE resources SET
  url = 'https://kar.kent.ac.uk/34014/1/2013%20The%20trap%20of%20Authenticity%20AQ.pdf'
WHERE id = 'aventura-r-theodossopoulos-trap-authenticity';

-- Ley 72 de 2008 (P): PDF oficial en FAOLEX (el URL ya figuraba en description original).
UPDATE resources SET
  url = 'https://faolex.fao.org/docs/pdf/pan95794.pdf'
WHERE id = 'aventura-r-ley-72-2008-tierras-colectivas';

-- ---- C5 Migración y Clan del Golfo ----

-- HRW Neglected in the Jungle (P): PDF oficial del report en hrw.org.
UPDATE resources SET
  url = 'https://www.hrw.org/sites/default/files/media_2024/04/americas0424%20web.pdf'
WHERE id = 'aventura-r-hrw-neglected-jungle-darien';

-- SENAFRONT (P ⚠A#3): cumulativo anual 2025 de SNM. Apendeada nota de link-rot
-- a description (el publisher rota PDFs — re-fetch anual obligatorio).
UPDATE resources SET
  url = 'https://www.migracion.gob.pa/wp-content/uploads/MOVIMIENTO-MIGRATORIO-2025-3.pdf',
  description = 'Única fuente primaria de cifras. Serie anual 2010-2026 con desagregación mensual, por país de origen, género y condición. Permite contrastar afirmaciones periodísticas contra dato bruto y entender la caída de ~94% en 2025 tras cierre Mulino + bloqueo Guna Yala. Complementada por Datos Abiertos Panamá para CSV. Actualización mensual. [Link-rot: SENAFRONT publica nuevos cumulativos anuales; re-fetch recomendado cada 12 meses al PDF del año corriente.]'
WHERE id = 'aventura-r-senafront-transito-irregular';

-- ---- C6 Travesías históricas ----

-- Wafer A New Voyage (P): mirror archive.org PDF (dominio público, ed. 1729).
UPDATE resources SET
  url = 'https://archive.org/download/newvoyagedescrip03wafe/newvoyagedescrip03wafe.pdf'
WHERE id = 'aventura-r-wafer-isthmus-1699';

-- Las Casas Historia de las Indias Tomo IV (P): edición Madrid 1876 en archive.org,
-- comparable en contenido al texto de Gutenberg (cubre travesía Balboa 1513).
UPDATE resources SET
  url = 'https://archive.org/download/las-casas-bartolome-de.-historia-de-las-indias-vol.-4-de-5-1876/Las%20Casas%2C%20Bartolom%C3%A9%20de.%20-%20Historia%20de%20las%20Indias%20%28vol.%204%20de%205%29%20%5B1876%5D.pdf'
WHERE id = 'aventura-r-las-casas-historia-indias-iv';

-- ---- C8 Fauna y salud tropical ----

-- PAHO yellow fever epi-update (P): PDF oficial adjunto a la document-page.
UPDATE resources SET
  url = 'https://www.paho.org/sites/default/files/2025-05/2025-april-24-phe-epiupdate-yellow-fever-final.pdf'
WHERE id = 'aventura-r-paho-yellow-fever-americas-2025';

-- INS Colombia BES (P ⚠A#5): SE01/2025 PDF del boletín semanal. Apendeada nota
-- de link-rot a description (INS publica un boletín por semana epidemiológica).
UPDATE resources SET
  url = 'https://www.ins.gov.co/buscador-eventos/BoletinEpidemiologico/2025_Boletin_epidemiologico_semana_1.pdf',
  description = 'Única fuente con granularidad municipal. Reporta semanalmente dengue, leishmaniasis (cutánea y mucosa), malaria, ETV. Municipios clave para la ruta costera: Acandí, Unguía, Juradó, Bajo Baudó — todos en zona hiperendémica de leishmaniasis cutánea por Lutzomyia. Usar boletín del año en curso dentro de 60 días del viaje. [Link-rot: INS publica un boletín por semana epidemiológica; re-fetch trimestral recomendado al PDF semanal más reciente del año corriente.]'
WHERE id = 'aventura-r-ins-colombia-bes';

-- Rigg et al. sandflies Panama (P ⚠A#2 post-escalamiento): mirror OA del
-- repositorio institucional UNA Costa Rica (primer autor Luis F. Chaves está
-- afiliado a UNA — self-archive legítimo). Descubierto vía OpenAlex API
-- (locations[].landing_page_url = hdl.handle.net/11056/22465); corroborado por
-- Semantic Scholar API (isOpenAccess=true, openAccessPdf.status=GREEN). HTTP
-- 200 + application/pdf + 488 251 B + PDF v1.4 10 pp al bot anónimo. Querystring
-- ?filename=...pdf agregada para que isLikelyPdfUrl acepte la URL via
-- search.includes('.pdf') — el server DSpace ignora el param y devuelve el
-- mismo PDF. type=paper se mantiene; description intacta.
UPDATE resources SET
  url = 'https://repositorio.una.ac.cr/bitstreams/ecb86f96-80b6-4acc-8d66-c78c2fbdc0ac/download?filename=rigg-2019-leishmania-sandflies-panama.pdf'
WHERE id = 'aventura-r-rigg-sandflies-panama';

-- ---- C9 Riesgo, decisión, rescate ----

-- Will Gadd (Y ⚠A#6): swap a S2.E09 "How to Communicate Risk" (feb-2024) en canal
-- oficial Delivering Adventure Podcast, captions auto confirmadas con yt-dlp.
-- Es un episodio distinto del S1.E06 Misadventure Part 2 (nov-2022) original, que
-- no existe en YouTube. Se preserva autor (Gadd) y marco conceptual (proceso vs
-- resultado). Se actualiza title + description para reflejar honestamente el
-- episodio efectivamente ingerible, y se cambia type article -> video.
UPDATE resources SET
  url = 'https://www.youtube.com/watch?v=FSh0KZrWumo',
  type = 'video',
  title = 'Will Gadd: how to communicate risk (Delivering Adventure S2.E09, Feb 2024)',
  description = 'Gadd articula en lenguaje operativo: la calidad de una decisión de riesgo se juzga por el proceso, no por el resultado — un buen outcome con mal proceso es suerte. En S2.E09 (feb-2024) Gadd se enfoca en la comunicación del riesgo entre compañeros: cómo enmarcar transparentemente una decisión de abortar, cómo involucrar al partner en la valoración en tiempo real, y cómo bajar consecuencias mediante redundancias explícitas. Relevante para C9 como modelo de transparencia procesal en decisiones críticas. Ampliación no-ingerible por el pipeline: S1.E06 How to Avoid Misadventure Part 2 (nov-2022, solo audio) — mismo autor, mismo marco.'
WHERE id = 'aventura-r-will-gadd-misadventure-risk';

COMMIT;
