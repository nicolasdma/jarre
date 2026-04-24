# Pipeline Sources — limitación actual y roadmap

**Última actualización:** 2026-04-23
**Estado:** problema documentado, solución no implementada.

---

## 1. El problema en una oración

El pipeline de Jarre —el que convierte un recurso en secciones, quizzes y FSRS cards— sólo acepta URLs que resuelven a **YouTube** o **PDF directo**. Cualquier otra URL cae en `'unsupported'` y el learner ve `"El link no parece válido. Soportamos YouTube o PDF directo."` en `MissingCourseContent`.

Esto aplica a fichas UNESCO, artículos HTML de periódicos, viewers como CONTENTdm, páginas de journals (incluso peer-reviewed), landing pages de archive.org, reportes de Mongabay/ICG/IUCN — es decir, la mayoría de las fuentes académicas y periodísticas serias de hoy.

---

## 2. El código que lo define

`src/lib/utils/resource-url.ts:43`:

```ts
export function detectPipelineSourceType(url: string): PipelineSourceType {
  const trimmed = url.trim();
  if (!trimmed) return 'unsupported';

  if (extractYoutubeId(trimmed)) return 'youtube';
  if (isLikelyPdfUrl(trimmed)) return 'pdf';
  return 'unsupported';
}
```

`isLikelyPdfUrl` se queda contento con URLs que terminan en `.pdf` (o contienen `.pdf` en el query). Hay normalización previa para arXiv (`/abs/X` → `/pdf/X.pdf`) pero no para otros repositorios.

---

## 3. Impacto actual por track

Snapshot tomado el 2026-04-23 (via otro agente en paralelo, query contra DB de prod):

| Track    | YouTube | PDF directo | ArXiv (normalizable) | HTML unsupported | Total | % unsupported |
|----------|:-------:|:-----------:|:--------------------:|:----------------:|:-----:|:-------------:|
| ai       | 28      | 5           | 50                   | 74               | 157   | **47%**       |
| travel   | 16      | 10          | 0                    | 62               | 88    | **70%**       |
| aventura | 0       | 2           | 0                    | 49               | 51    | **96%**       |

Aventura es el más afectado porque el criterio de curación priorizó fuentes académicas, oficiales y periodísticas (ICG, Mongabay, IUCN, Paddling Magazine, JSTOR Daily) — que casi nunca publican en PDF directo ni en YouTube.

---

## 4. Auditoría de los 17 reemplazos aplicados el 2026-04-23

El fix de URLs 404 aplicado vía `supabase/migrations/20260423010000_fix_travel_broken_urls.sql` mejoró la **disponibilidad** de los recursos pero no resolvió el problema de pipeline support:

**Funciona (pipeline va a ingerir):**
- ✓ `travel-r-teyuna-sierra-nevada` → YouTube (Aluna documental, canal Tairona Heritage Trust)

**Unsupported (pipeline no va a ingerir — HTML):**
- ✗ `travel-r-vallenato-documental` (ich.unesco.org)
- ✗ `travel-r-munera-fronteras-caribe` (journals.openedition.org)
- ✗ `travel-r-cartagena-trata-atlantica` (digital.csic.es handle)
- ✗ `travel-r-gabo-macondo-caribe` (archive.org details)
- ✗ `travel-r-darien-migracion` (mongabay.com)
- ✗ `travel-r-escobar-medellin` (asla.org)
- ✗ `travel-r-armero-nevado-ruiz` (usgs.gov)
- ✗ `travel-r-cali-salsa-valle` (bibliotecadigital.univalle.edu.co)
- ✗ `travel-r-safford-palacios-colombia` (babel.banrepcultural / CONTENTdm)
- ✗ `travel-r-san-agustin-arqueologia` (publicaciones.icanh.gov.co catalog)
- ✗ `travel-r-cric-lucha-indigena` (tierradentro.co)
- ✗ `travel-r-carnaval-pasto` (ich.unesco.org)
- ✗ `travel-r-trampolin-muerte-corredor` (urosario.edu.co)
- ✗ `travel-r-voragine-casement-caucho` (archive.org details)
- ✗ `travel-r-levantamiento-1990-macas` (goldmanprize.org)
- ✗ `travel-r-sipan-alva` (eltiempo.com bocas)

**Swapeables a PDF directo sin perder la fuente** (prioridad alta):
- `travel-r-cartagena-trata-atlantica` → `https://digital.csic.es/bitstream/10261/90467/4/Cartagena_Indias_siglo_XVII_Vila.pdf`
- `travel-r-san-agustin-arqueologia` → `https://publicaciones.icanh.gov.co/index.php/picanh/catalog/download/36/167/60`
- `travel-r-gabo-macondo-caribe` → verificar `/download/vivirparacontarl0000garc_h5v1/<filename>.pdf` en archive.org
- `travel-r-voragine-casement-caucho` → idem patrón archive.org
- `travel-r-safford-palacios-colombia` → evaluar si CONTENTdm sirve un PDF del libro
- `travel-r-cali-salsa-valle` → evaluar si el repositorio Univalle tiene bitstream PDF

Los demás necesitan ser **sustituidos por video de YouTube equivalente** o reclasificados como referencia en `description` de otro recurso.

---

## 5. Opciones para resolverlo (roadmap)

### Opción A — Swap HTML a PDF directo donde exista en el mismo host
Esfuerzo: ~1h. Recupera 15-20 recursos del total.

Varios recursos tienen versión PDF en el mismo sitio pero la URL actual apunta al HTML. Identificar, armar UPDATE migration (convivir con REST PATCH como en `20260423010000`), aplicar.

- archive.org: `details/<item>` → `download/<item>/<file>.pdf`
- CSIC: `handle/<id>` → `bitstream/<id>/<n>/<filename>.pdf`
- ICANH publicaciones: `catalog/book/<id>` → `catalog/download/<id>/<file>/<n>`
- Kent Academic Repository, PMC, Gutenberg, IUCN: patrones similares por repositorio

Limitación: no todos tienen PDF. Fichas UNESCO, artículos Mongabay/ASLA/Goldman Prize/tierradentro/eltiempo no tienen versión PDF. Para esos, A no alcanza.

### Opción B — Ajustar UX para recursos HTML externos (sin extender el pipeline)
Esfuerzo: ~3-5h de frontend.

En vez de mostrar "El link no parece válido", mostrar:
> *"Este es un recurso externo. Leelo en la fuente original y volvé para evaluar con el tutor."*

Con botón "Abrir recurso" + evaluación/voice tutoring basada en:
- `canonical_definition` del concepto asociado (ya tiene contenido denso)
- `description` del recurso
- No en el texto parseado del artículo

Cambios probables: `MissingCourseContent.tsx` + `resource/[id]/page.tsx`. Diverge del modelo pedagógico (segmentación + quizzes por sección), pero respeta la frontera actual del pipeline.

### Opción C — Extender el pipeline para ingerir HTML articles (recomendado)
Esfuerzo: ~4-8h + testing.

Implementación limpia: nuevo tipo `'html_article'` en `PipelineSourceType`. El resolver baja el HTML y extrae texto limpio con una de estas herramientas:

- **`https://r.jina.ai/<url>`** — web service gratis de Jina AI, devuelve markdown extractado limpio de cualquier página. Sin infra nueva.
- **`trafilatura`** — librería Python madura, local, determinística. Requiere proceso Python.
- **Mozilla Readability** — JS puro, corre en Node, misma lógica que Firefox Reader Mode. Más en línea con el stack actual.

El pipeline existente (`segment → content → quizzes`) sigue igual — solo cambia el input resolver. Beneficia **los 3 tracks** y recupera 185 recursos HTML hoy unsupported.

### Recomendación
**C primero**, después **A** para los PDF que son swap trivial. **B** sería decisión de producto (achicar el pipeline explícitamente), pero reduciría pedagógicamente el curriculum.

---

## 6. Regla operativa hasta que esté resuelto

Mientras C no esté implementado:

- **Priorizar YouTube y PDF directo** como `url` de cada recurso nuevo o reemplazado.
- Si la fuente relevante es HTML y no tiene versión PDF, **evaluar si el recurso es indispensable**. Si sí, considerar bajarlo a referencia en la `description` de otro recurso PDF/YT que cubra el mismo concepto.
- Documentar en `description` cuando una fuente HTML es referencia externa no ingesible (sin expectativa de pipeline support).
- No maquillar la realidad: un recurso con URL que cae en `unsupported` es un recurso roto para el learner, aunque la URL responda 200.

Ver `QUALITY.md` §0 (Regla cero) y §4.7 (anti-pattern).

---

## 7. Prompt para retomar la implementación

Pegá esto cuando quieras retomar el trabajo:

> Leé `docs/pipeline-sources.md`. Vamos a implementar **Opción C** — extender el pipeline para ingerir HTML articles.
>
> Objetivos:
> 1. Agregar tipo `'html_article'` en `PipelineSourceType` (`src/lib/utils/resource-url.ts`). La detección cae en `html_article` cuando la URL no es YouTube ni PDF pero sí responde 200 con `Content-Type: text/html`.
> 2. Crear resolver nuevo en `src/lib/pipeline/` que baje el HTML y extraiga texto limpio. Propuesta principal: integrar `https://r.jina.ai/<url>` como primera opción (zero infra), con fallback a Mozilla Readability local si jina.ai falla o se deprecia. Preservar título, autor, fecha cuando el extractor los exponga.
> 3. Conectar el resolver al pipeline existente: el output del extractor reemplaza el transcript/PDF text como entrada para las etapas `segment → content → quizzes → FSRS`.
> 4. Actualizar el frontend (`MissingCourseContent.tsx`) para que `html_article` ya no dispare el mensaje de error.
> 5. Migrar los recursos hoy marcados `unsupported` en la DB: correr `detectPipelineSourceType` y re-clasificar los HTML válidos a `html_article`. No es una migración SQL obligatoria — puede ser runtime —, decidir según impacto en queries.
> 6. Testing: smoke test con 1 recurso por tipo de fuente (UNESCO ficha, journal article, Mongabay, archive.org landing, museo). Medir tiempo del resolver y tasa de éxito. Documentar límites (paywalls, JS-heavy pages) donde Readability/jina fallen.
> 7. Una vez C esté estable, hacer pass **Opción A**: auditar recursos con HTML landing pero que tienen PDF directo en el mismo host, swapear la URL.
>
> Antes de tocar código, leé `QUALITY.md` completo y `docs/ARCHITECTURE.md` para el contexto del pipeline.
>
> NO aplicar migraciones contra la DB sin confirmación explícita del usuario. NO usar `supabase db push` si hay migraciones untracked ajenas — aplicar por REST PATCH.
