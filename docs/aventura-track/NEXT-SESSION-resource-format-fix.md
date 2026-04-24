# Aventura Track — Handoff: Resource Format Limitation

**Escrito:** 2026-04-23 por executor
**Contexto:** cierre de sesión después de completar el seed F1 del track aventura. Infra 10/12 done; F1 aplicada a remote con 7/7 verificaciones OK. Pero al intentar generar contenido de los recursos en browser, 49 de los 51 muestran el mensaje:

> "El link no parece válido. Soportamos YouTube o PDF directo."

Esto es una **limitación preexistente del pipeline de Jarre, no un bug del seed.** Este documento explica el problema, el estado actual, la decisión tomada por el usuario, el plan de remediación, y el prompt para que la próxima sesión arranque con todo el contexto.

---

## 1. El problema técnico

El pipeline de Jarre (`src/lib/pipeline/`) convierte recursos en cursos interactivos: descarga el source → transcript (YouTube) o extracción de texto (PDF) → segmentación → generación de secciones → quizzes → FSRS cards. Solo dos tipos de source están implementados:

1. **YouTube** — detectado por `extractYoutubeId()` (transcript vía YouTube API)
2. **PDF directo** — URL termina en `.pdf` o tiene `.pdf` en querystring. ArXiv `/abs/...` se normaliza automáticamente a `/pdf/....pdf`.

Cualquier otra URL cae en `'unsupported'` y dispara la validación de `MissingCourseContent.tsx:78`.

**Código exacto** (`src/lib/utils/resource-url.ts:43`):

```ts
export type PipelineSourceType = 'youtube' | 'pdf' | 'unsupported';

export function detectPipelineSourceType(url: string): PipelineSourceType {
  const trimmed = url.trim();
  if (!trimmed) return 'unsupported';
  if (extractYoutubeId(trimmed)) return 'youtube';
  if (isLikelyPdfUrl(trimmed)) return 'pdf';
  return 'unsupported';
}
```

**Dónde aparece el mensaje:** `src/components/resources/MissingCourseContent.tsx:78` — cuando el usuario entra a un recurso que no tiene curso generado y hace click en "generar". El componente llama a `detectPipelineSourceType` antes de llamar a `/api/pipeline`, y bloquea con mensaje si la URL no es YouTube ni PDF.

**La UI de Biblioteca y el "abrir recurso" siguen funcionando** para todos los recursos — solo la generación de curso interactivo (segments + quizzes) está bloqueada para HTML articles.

---

## 2. Estado actual de la DB (2026-04-23)

Query ejecutada contra remote:

```sql
SELECT
  track,
  CASE
    WHEN url ~* 'youtube\.com|youtu\.be' THEN 'youtube'
    WHEN url ~* '\.pdf($|\?|#)' THEN 'pdf_direct'
    WHEN url ~* 'arxiv\.org/abs/' THEN 'pdf_arxiv_normalizable'
    ELSE 'html_unsupported'
  END AS pipeline_support,
  COUNT(*) AS n
FROM resources
WHERE curriculum_source='core' AND is_archived=FALSE
GROUP BY track, pipeline_support
ORDER BY track, pipeline_support;
```

| Track | YouTube | PDF directo | ArXiv normalizable | HTML unsupported | Total | % unsupported |
|---|---|---|---|---|---|---|
| ai | 28 | 5 | 50 | **74** | 157 | 47% |
| travel | 16 | 10 | 0 | **62** | 88 | 70% |
| aventura | 0 | 2 | 0 | **49** | 51 | **96%** |

**Aventura es el peor caso** porque la curaduría priorizó fuentes académicas/oficiales/periodismo/documentales broadcast que típicamente no están en YouTube ni en PDF directo.

**Los 2 recursos PDF ya ingeribles de aventura F1:**

1. `aventura-r-crisis-group-darien-bottleneck` — ICG Report 102 spanish PDF (`https://www.crisisgroup.org/sites/default/files/2023-11/102-darien-gap-spanish.pdf`)
2. `aventura-r-gitoc-gulf-clan-darien` — GI-TOC Gulf Clan PDF (`https://globalinitiative.net/wp-content/uploads/2022/11/...GI-TOC-November-2022.pdf`)

---

## 3. Decisión del usuario (2026-04-23)

> "Me parece que lo mejor por ahora es trabajar únicamente con PDF y YouTube videos. Hay papers académicos en PDF y YouTube muy completos, deberíamos priorizarlos."

### Opciones rechazadas

- **B (UX alternativa para articles HTML)** — mostrar articles como "links externos" con evaluación contra `canonical_definition` en vez de contra texto parseado. Rechazada: diverge del modelo pedagógico de Jarre (segments + quizzes + FSRS cards por sección).
- **C (extender pipeline a HTML vía jina.ai/reader o trafilatura)** — rechazada por ahora. No descartada para el futuro si reaparece necesidad.

### Opción aceptada

- **A (swap URLs) + re-curación parcial:**
  - Limitar F1 a PDF + YouTube.
  - Reemplazar los 49 HTML por alternativas PDF/YouTube donde existan, con **prioridad en papers académicos PDF y videos YouTube complejos** (lecturas académicas, documentales completos, entrevistas largas con académicos).
  - Para los que no tienen alternativa con peso académico equivalente: aceptar la limitación (link externo sin curso generado) o descartar el recurso.

---

## 4. Plan de remediación

### Fase 1 — Auditar los 49 HTML de aventura F1

Para cada recurso, clasificar en un bucket:

| Bucket | Criterio | Acción |
|---|---|---|
| **P** | El mismo host/autor ya tiene PDF accesible (PMC, archive.org, repositorios OJS, Wiley OA, Springer OA, Project Gutenberg PDF) | `UPDATE resources SET url = '<pdf>'` — cambio trivial |
| **Y** | Existe video YouTube con peso académico equivalente (lectura universitaria, documental completo, entrevista extensa) del mismo tema | `UPDATE resources SET url = '<yt>', type = 'video'` |
| **R** | No hay equivalente directo del mismo autor, pero existe otra fuente PDF/YouTube de autoridad equivalente sobre el mismo concepto | `DELETE + INSERT` nuevo recurso con nuevos `resource_concepts` |
| **X** | Sin alternativa aceptable — irreemplazable y sin PDF/YT disponible | Dejar como link externo. El recurso queda en DB, se puede abrir, pero no se genera curso. |

### Candidatos (P) identificados rápido (sin verificación, la próxima sesión debe WebFetch cada uno):

| ID actual | URL HTML actual | Candidato PDF a verificar |
|---|---|---|
| `aventura-r-wafer-isthmus-1699` | archive.org/details/newvoyagedescrip03wafe | archive.org tiene botón "PDF" download directo del mismo ítem |
| `aventura-r-sauer-early-spanish-main` | archive.org/details/earlyspanishmain00saue_0 | archive.org PDF download directo |
| `aventura-r-las-casas-historia-indias-iv` | gutenberg.org/files/56283/56283-h/56283-h.htm | Project Gutenberg típicamente ofrece `.pdf` junto con `.html` |
| `aventura-r-rigg-sandflies-panama` | pmc.ncbi.nlm.nih.gov/articles/PMC6447106/ | PMC siempre tiene `/articles/PMC6447106/pdf/...` |
| `aventura-r-theodossopoulos-trap-authenticity` | kar.kent.ac.uk/34014/ | KAR tiene PDF adjunto en la ficha |
| `aventura-r-iucn-darien-outlook` | worldheritageoutlook.iucn.org/node/972 | IUCN genera PDF export del assessment (botón "Download PDF") |
| `aventura-r-naval-embera-wounaan-espiga` | revistas.uned.ac.cr/.../article/view/5587 | OJS típicamente `/article/view/5587/<id>` da PDF |
| `aventura-r-ley-72-2008-tierras-colectivas` | ecolex.org/.../lex-faoc095794/ | Ya está el PDF listado en notas: `https://faolex.fao.org/docs/pdf/pan95794.pdf` |
| `aventura-r-miller-minding-the-gap` | journals.uchicago.edu/doi/full/10.1093/envhis/emu002 | Verificar si hay `/doi/pdf/` variante (Wiley sí tiene; U. Chicago a veces) |
| `aventura-r-stri-darien-carbon-2019` | conbio.onlinelibrary.wiley.com/doi/10.1111/csp2.42 | Wiley OA: `/doi/pdfdirect/10.1111/csp2.42` |
| `aventura-r-uraba-tropical-estuary-review` | link.springer.com/article/10.1007/s12601-022-00093-9 | Springer OA: `/content/pdf/...` — verificar acceso abierto real |
| `aventura-r-paho-yellow-fever-americas-2025` | paho.org/en/documents/epidemiological-update-yellow-fever-americas-region-24-april-2025 | PAHO publica PDF adjunto en la ficha (botón "Download") |
| `aventura-r-cdc-yellow-book-panama` | wwwnc.cdc.gov/travel/yellowbook/... | CDC tiene PDF de capítulos Yellow Book — verificar |
| `aventura-r-kastner-pcg-eddies-2024` | journals.ametsoc.org/view/journals/phoc/54/10/JPO-D-24-0049.1.xml | AMS ofrece `/downloadpdf/...` — verificar |

**Estimado:** 10–15 de los 49 resuelven con (P).

### Candidatos (Y) YouTube de peso académico:

| Tema actual | Búsqueda sugerida |
|---|---|
| `aventura-r-pbs-drost-darien` — Pulitzer 2021 | Buscar "PBS NewsHour Darien Gap Drost" en YouTube canal oficial PBS — el episodio completo probablemente existe |
| `aventura-r-will-gadd-misadventure-risk` — podcast Delivering Adventure | Delivering Adventure está también en YouTube; verificar cada episodio específico |
| `aventura-r-bila-burba-documental` | Documental completo no está en YouTube (distribución comercial), pero puede haber un trailer oficial del director Wagua o charla del IDFA — probable X o R |
| `aventura-r-outside-in-darien-gap` (NHPR podcast) | NHPR rara vez en YouTube. Probable X. |

**Buscar también lecturas universitarias en YouTube sobre:**
- Oceanografía del Caribe sur (para C1)
- Darién Gap / Panamericana history (para C2, C6)
- Revolución Dule / Guna Yala history (para C3)
- Emberá / Wounaan (para C4)
- Migración Darién 2022–2025 (para C5, conferencias de ICG/HRW en sus canales oficiales)
- Tropical medicine / leishmaniasis / marine envenomation (para C8, lectures médicas)
- Sea kayak safety / Will Gadd / sea kayak AAR (para C9)

**Estimado:** 3–8 de los 49 resuelven con (Y).

### Categorías (X) probables — sin alternativa fácil

La mayoría de los ~30 restantes van a caer acá:

- **Fuentes primarias gunas** (`aventura-r-reglamento-turismo-gunayala`, `aventura-r-gunayala-resumen-oficial`) — irreemplazables. No existe PDF oficial. **Mantener como X.** El sitio oficial del Congreso General Guna es HTML plano.
- **SNM Panamá** (`aventura-r-snm-panama-requisitos-turistas`), **SENAFRONT estadísticas** (`aventura-r-senafront-transito-irregular`) — sitios gubernamentales HTML. Mantener X.
- **OSAC / State Dept** (`aventura-r-osac-panama-security-report`) — HTML. Mantener X. OSAC sí publica PDFs pero el Country Security Report es HTML.
- **Garmin Response** (`aventura-r-garmin-response-sos-protocol`) — whitepaper corporativo HTML. Buscar si tienen PDF del annual SOS report (probable P).
- **Blog de Edelmayer** (`aventura-r-edelmayer-darien-kayak-guide`) — irreemplazable (único trip report público de la ruta). Mantener X. Impacto alto porque es el recurso ancla de C9.
- **Infobae/BBC 2025** (`aventura-r-infobae-peor-que-darien-maritima`) — única crónica de ruta marítima activa 2025. Mantener X.
- **ICG/HRW** — verificar si las landings HTML tienen PDF adjunto (probable P para ambos; HRW sí publica PDFs de reports).
- **InSight Crime** (`aventura-r-insightcrime-darien-profit`) — solo HTML. Mantener X.
- **Mongabay (2 recursos)** — no publican PDF. Mantener X.
- **Cultural Survival Quarterly (2 recursos)** — HTML. Mantener X.
- **Howe libros (2 recursos)** — Amazon/UTPress HTML. Son libros con copyright, no se pueden ingerir vía pipeline aunque tengan URL. Mantener X con nota "lectura offline".
- **JSTOR Daily / Bradt Guides / Paddling Magazine / ACA** — HTML editorial, sin PDF. Mantener X.
- **Freya Hoffmeister** (2 URLs) — blog personal HTML. Mantener X.
- **DIMAR derroteros** — catálogo HTML que apunta a cartas físicas. Mantener X.

**Estimado final:** de los 49 HTML, aproximadamente:
- **P (PDF swap):** 10–15 → serán ingeribles
- **Y (YouTube swap):** 3–8 → serán ingeribles
- **R (reemplazo por otra fuente):** 0–3 → serán ingeribles
- **X (mantener link externo):** ~25–30 → no se generará curso, el usuario los lee/ve en el sitio original

**Resultado esperado post-swap:** aventura F1 pasa de **2 ingeribles** (3.9%) a **~15–25 ingeribles** (30–50%). Todavía lejos del 100% pero mucho mejor, y respetando la prioridad académica.

### Opción más ambiciosa (decisión del usuario en próxima sesión)

**Re-curación completa desde restricción de formato:** lanzar 9 agentes nuevos con la restricción dura "solo papers PDF + videos YouTube académicos" y descartar el brief actual para F1. Pierde las fuentes primarias gunas y el periodismo de alta calidad; gana 100% ingeribilidad. Esto es un cambio de criterio pedagógico profundo — no hacer sin autorización explícita.

### Fase 2 — Generar migration

`supabase/migrations/2026MMDDHHMMSS_fix_aventura_phase_1_urls.sql` siguiendo el pattern de `20260423010000_fix_travel_broken_urls.sql` (que el otro agente escribió la sesión anterior — mirar como referencia).

Estructura:

```sql
BEGIN;

-- Bucket P: UPDATE URL a versión PDF
UPDATE resources SET url = '<pdf-url>', updated_at = NOW() WHERE id = 'aventura-r-...';
-- ... (10–15 UPDATEs)

-- Bucket Y: UPDATE URL + type a YouTube
UPDATE resources SET url = '<yt-url>', type = 'video', updated_at = NOW() WHERE id = 'aventura-r-...';
-- ... (3–8 UPDATEs)

-- Bucket R (si hay): DELETE + INSERT
DELETE FROM resource_concepts WHERE resource_id = 'aventura-r-<old>';
DELETE FROM resources WHERE id = 'aventura-r-<old>';
INSERT INTO resources (...) VALUES (...);
INSERT INTO resource_concepts (...) VALUES (...);

-- Bucket X: nada. Se mantienen como están.

COMMIT;
```

### Fase 3 — Aplicar a remote

- `supabase migration list --linked` para confirmar solo la migration nueva pending
- `supabase db push --linked`
- Verificación post-push:

```sql
SELECT
  CASE
    WHEN url ~* 'youtube\.com|youtu\.be' THEN 'youtube'
    WHEN url ~* '\.pdf($|\?|#)' THEN 'pdf_direct'
    ELSE 'html_unsupported'
  END AS pipeline_support,
  COUNT(*)
FROM resources
WHERE track='aventura' AND phase='1' AND curriculum_source='core'
GROUP BY 1;
```

Objetivo: reducir `html_unsupported` de 49 a ~25–30.

### Fase 4 — Aplicar mismo framework a travel y AI (opcional)

Post-aventura, el usuario puede decidir:
- **AI (74 HTML):** muchos son papers con PDF disponible (arXiv, PMC, ResearchGate). Probable alto rendimiento (P) para ~40–50.
- **Travel (62 HTML):** mayoría periodismo/articles — probable alto (X). Rendimiento bajo.

No bloqueante. Aventura es prioridad por ser el recién curado.

---

## 5. Insumos listos para la próxima sesión

### Archivos a leer en orden

1. `CLAUDE.md` — reglas del proyecto
2. `docs/aventura-track/PROGRESS.md` — estado 10/12 done, F1 seeded
3. `docs/aventura-track/NEXT-SESSION-resource-format-fix.md` — **este doc**
4. `docs/aventura-track/phase-1-brief.md` — referencia del contenido curado (51 recursos con sus autorías, notas, categorías)
5. `supabase/migrations/20260423020000_seed_aventura_phase_1.sql` — el seed aplicado
6. `supabase/migrations/20260423010000_fix_travel_broken_urls.sql` — pattern de migration de fix a replicar

### Query para listar los 49 HTML con su metadata

```sql
SELECT
  id,
  title,
  author,
  url,
  type,
  sort_order,
  description
FROM resources
WHERE track='aventura'
  AND phase='1'
  AND curriculum_source='core'
  AND is_archived=FALSE
  AND url !~* 'youtube\.com|youtu\.be|\.pdf($|\?|#)|arxiv\.org/abs/'
ORDER BY sort_order;
```

### Credenciales DB (ya en `.env.local`)

- `SUPABASE_DB_PASSWORD` — para `supabase db push --linked` y psql-pooler
- Pooler: `aws-0-us-west-2.pooler.supabase.com:5432`, user `postgres.kkbzuzfdcowdjhqrvvea`

---

## 6. Prompt para la próxima sesión

Pegá esto al arrancar la próxima sesión (idealmente desde `/Users/nicolasdemaria/Desktop/_projects/jarre`):

```
Estás retomando el track `aventura` del proyecto Jarre. El seed de Fase 1
está aplicado a remote (9 conceptos + 51 recursos + 17 prereqs + 143
resource_concepts, smoke eliminado, AI/travel intactos — todo verificado
via psql el 2026-04-23). Pero el pipeline de Jarre solo soporta YouTube +
PDF directo, y 49 de los 51 recursos son HTML — al intentar generar curso
en browser el usuario ve "El link no parece válido. Soportamos YouTube o
PDF directo."

Decisión del usuario (2026-04-23): limitar F1 a PDF+YouTube, priorizar
papers académicos en PDF y videos YouTube complejos. Reemplazar los 49
HTML donde haya alternativa (buckets P/Y/R), o aceptar link externo donde
no (bucket X). NO extender el pipeline a HTML por ahora.

PROTOCOLO ESTRICTO PARA CADA TURNO:

1. Antes de hacer NADA, leé en este orden:
   - `CLAUDE.md` (reglas del proyecto)
   - `docs/aventura-track/PROGRESS.md` (estado actual + decisiones + handoff)
   - `docs/aventura-track/NEXT-SESSION-resource-format-fix.md` (este plan — insumo principal)
   - `docs/aventura-track/phase-1-brief.md` (referencia del contenido curado)
   - `supabase/migrations/20260423010000_fix_travel_broken_urls.sql` (pattern de migration de fix a replicar)

2. Identificá el rol del turno:
   - `coordinator` si vas a auditar los 49 HTML uno por uno (WebFetch) y decidir P/Y/R/X
   - `executor` si vas a escribir la migration SQL de UPDATE/DELETE/INSERT
   Anunciá el rol en una línea antes de actuar.

3. Determiná el próximo chunk. Primer chunk lógico:
   - **Coordinator (chunk A):** correr el query listado en el handoff
     para sacar los 49 HTML; para cada uno, WebFetch a su URL actual
     + WebSearch candidatos PDF/YT; clasificar en bucket P/Y/R/X con
     la URL final propuesta. Output: tabla markdown de 49 filas en el
     brief actualizado o un apéndice. Reportar al usuario ANTES de
     cualquier migration.

4. Chunks siguientes:
   - **Executor (chunk B):** generar `supabase/migrations/2026MMDDHHMMSS_fix_aventura_phase_1_urls.sql`
     con UPDATEs para P/Y, DELETE+INSERT para R, nada para X.
     Seguir el pattern del fix-travel. Idempotente, atómico BEGIN/COMMIT.
   - **Executor con autorización (chunk C):** `supabase migration list --linked` →
     `supabase db push --linked` → verificación post-push con query de
     pipeline_support.

5. Estándares senior: TS strict, Zod para validación externa, tablas
   vía `TABLES` de `src/lib/db/tables.ts`, migrations idempotentes con
   ON CONFLICT, defensivo con RLS. `npm run lint` + `npm run typecheck`
   en verde antes de declarar done.

6. Acciones destructivas o remotas (commit, push, PR, `supabase db push`,
   migration a DB remota) requieren autorización EXPLÍCITA del usuario
   en ese turno. Nunca asumir consentimiento previo.

7. Si encontrás ambigüedad genuina (un recurso donde no está claro
   si debe ir a X o R, o donde la alternativa PDF es de calidad dudosa),
   pará y preguntá. No inventes URLs ni aceptes "primer resultado que
   encuentres" — el usuario ya rechazó ese criterio y puso el listón
   alto en la curaduría original.

8. Idioma: español en conversación. Código/commits/slugs: inglés.

9. Mantené `PROGRESS.md` vivo:
   - Apenas arrancás un chunk: marcalo en handoff log con tu rol y fecha.
   - Al terminar: marcá checklist items, actualizá tabla de fases si
     aplica, agregá entrada de handoff con archivos tocados +
     decisiones nuevas (append-only) + preguntas abiertas.
   - Si tomás una decisión arquitectónica, escalá a Decisiones con
     **APROBADO POR USUARIO** o **PENDIENTE APROBACIÓN**.
   - Nunca borres entradas del handoff log ni de Decisiones.

OBJETIVO DEL TURNO ACTUAL: identificá el próximo chunk (probablemente
auditoría de los 49 HTML) y proponé al usuario qué vas a hacer ANTES
de tocar contenido. Si vas a correr el query de listado, mostralo y
esperá OK antes de lanzar los 49 WebFetch.
```

---

## 7. Criterio de aceptación del fix

El fix se considera cerrado cuando:

- [ ] Los 49 HTML están clasificados en P/Y/R/X con URL final propuesta (o decisión de mantener).
- [ ] Migration de UPDATE/DELETE/INSERT escrita y aplicada a remote con autorización.
- [ ] Post-push, `html_unsupported` para aventura F1 es <30 (al menos 40% de mejora).
- [ ] Los recursos X documentados en una nota en el brief para que el usuario sepa cuáles van a ser "link externo permanente".
- [ ] `PROGRESS.md` y `phase-1-brief.md` actualizados reflejando el nuevo estado de cada URL.
- [ ] Verificación manual browser en al menos 3 recursos ingeribles (que el click en "generar curso" ahora efectivamente inicia el pipeline y no da el error).

---

## 8. Qué NO hacer en la próxima sesión

- No modificar `src/lib/utils/resource-url.ts` ni `src/lib/pipeline/*` para extender soporte a HTML. Esa es opción C, rechazada.
- No cambiar la UX de `MissingCourseContent.tsx` para mostrar un mensaje distinto. El mensaje actual es honesto.
- No descartar los 49 HTML en bloque. Hay que ir uno por uno — varios son irreemplazables (fuentes primarias gunas, blog Edelmayer, Infobae 2025).
- No re-lanzar los 9 agentes para re-curar F1 desde cero — eso es "opción ambiciosa" y requiere autorización explícita.
- No aplicar el mismo fix a travel y AI sin autorización explícita.
- No commitear ni pushear sin autorización — la branch `feature/aventura-track` tiene mucho sin commitear y no es decisión de la sesión cuándo subirlo.
