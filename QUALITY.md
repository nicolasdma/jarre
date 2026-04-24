# QUALITY — Curriculum Resource Sourcing Rules

Esta guía aplica a todo agente (humano o Claude) que agregue, reemplace o audite **recursos del curriculum**: rows en la tabla `resources`, seeds SQL, migraciones que insertan URLs, documentos en `docs/*-track/` que listen fuentes propuestas.

Surgió después de una auditoría donde agentes previos propusieron ~15% de URLs rotas o inventadas afirmando haberlas verificado con WebSearch. El objetivo es que eso no vuelva a pasar.

---

## 0. Regla cero — Pipeline solo ingesta PDF y YouTube

Antes de cualquier otra consideración: **el pipeline actual de Jarre sólo genera contenido a partir de URLs que resuelven a `youtube` o `pdf` directo** (ver `src/lib/utils/resource-url.ts:43`, función `detectPipelineSourceType`). Cualquier otra URL —artículos HTML, landing pages, viewers como CONTENTdm, páginas de journals, `archive.org/details/...`, fichas UNESCO, etc.— devuelve `'unsupported'` y el learner se topa con **"El link no parece válido. Soportamos YouTube o PDF directo."**

**Consecuencia operativa para curación:**

- Al buscar un recurso, priorizar **PDF descargable** o **video de YouTube** como `url` primario. El pipeline va a poder generar secciones, quizzes y FSRS cards.
- Si la fuente es HTML, buscar si el mismo sitio ofrece el PDF (muchos repositorios académicos lo hacen — archive.org, CSIC, ICANH, university repositories suelen tener `/download/...` o `/bitstream/...`).
- Si no hay PDF y el video no existe en YouTube, **considerar descartar el recurso** o bajarlo a referencia en `description` de otro recurso. No proponer HTML como `url` principal esperando que "algo funcione".
- Excepción: si el usuario explícitamente aprueba un HTML como referencia externa no ingesible, documentarlo.

Diagnóstico completo, números por track y roadmap de solución en `docs/pipeline-sources.md`.

---

## 1. Protocolo de verificación técnica (obligatorio)

### Para cualquier URL

```bash
curl -sS -o /tmp/check.html -w "%{http_code}\n" -L --max-time 20 \
  --compressed \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "Accept-Language: es-ES,es;q=0.9,en;q=0.8" \
  "<URL>"
```

Debe dar **200** (o 2xx/3xx final tras redirects). Además:

- `wc -c /tmp/check.html` con tamaño coherente — una página real tiene >5KB; 461 bytes suele ser página de error.
- `grep -oE '<title[^>]*>[^<]*</title>' /tmp/check.html` debe mostrar un título relacionado al tema. Un `<title>` genérico ("Acceso denegado", "Page Not Found", "CONTENTdm" solo, "Verifying your connection...") descarta la URL.

**403 / 429 / challenge de Cloudflare** cuenta como URL no apta aunque un humano la vea funcionar en browser. El pipeline fetchea programáticamente — si bloquea bots, no sirve.

### Para YouTube (requisito extra)

El pipeline de Jarre necesita transcripts de YouTube. Un video sin captions rompe la generación de secciones (`No transcript available for video X`).

Verificar captions con `yt-dlp` (o equivalente):

```bash
yt-dlp --list-subs --skip-download "<URL>"
```

Debe listar al menos un idioma (manual o auto-generated). Si la respuesta es vacía o `has no subtitles`, el video no pasa. Excepción: si el path de ASR fallback está explícitamente habilitado y documentado, puede marcarse como `needs_asr=true` — confirmar con el usuario antes.

Verificación rápida alternativa (si `yt-dlp` no está disponible), con el endpoint oEmbed de YouTube — confirma que el video existe y es público pero no dice nada sobre captions:

```bash
curl -sS "https://www.youtube.com/oembed?format=json&url=<URL>"
```

### Para PDFs

```bash
curl -sS -I -L --max-time 15 -H "User-Agent: Mozilla/5.0 ..." "<URL>" | grep -i "content-type\|content-length"
```

- `Content-Type: application/pdf` obligatorio. Si devuelve `text/html`, es landing page, no el PDF.
- `Content-Length` coherente (>50KB para un paper, >500KB para un libro).

### Para archive.org

No confiar en la URL visual. Muchos items aparecen "vivos" pero dicen *This item is no longer available*. Verificar que la página NO contenga ese string y que haya archivos descargables visibles.

---

## 2. Principios de calidad (pedagógica y académica)

Aplicar estos principios a **toda fuente**. No hay whitelist de dominios — una fuente desconocida puede ser buena si cumple, y una fuente famosa puede ser mala si el artículo puntual no cumple.

### El autor

- ¿Es reconocido en el dominio? Obra canónica, afiliación académica vigente, citas en literatura peer-reviewed.
- ¿Es identificable? Artículos sin autor ("editorial", "redacción") son aceptables solo si la institución editora es la autoridad.
- ¿El autor puede ser defendido frente a un experto del área? Si no, no va.

### La institución

¿Hay **responsabilidad editorial**? Universidad, museo, biblioteca nacional, organismo internacional (UNESCO, WHO, FAO...), journal peer-reviewed, editorial académica, archivo estatal, agencia de prensa con línea editorial declarada.

No importa cuál — importa que *alguien firma editorialmente* el contenido y se puede responsabilizar por él.

### Triangulación

Cada recurso debe estar sostenido por **al menos una fuente independiente** que corrobore el mismo hecho o tesis. Si es el único artículo del mundo diciendo X, o es descubrimiento genuino (improbable en curriculum educativo) o es dudoso.

La triangulación se documenta en el campo `description` del recurso, mencionando las fuentes complementarias.

### Estabilidad de la URL

- Dominio institucional (`*.edu`, `*.gob.*`, `*.gov`, organismos internacionales, editoriales académicas) > dominio comercial > blog personal > wiki sin curación.
- Path estable (permalinks con ID numérico, DOI, handle) > path semántico frágil (`/articulos/titulo-que-puede-cambiar`).
- Archivo original > mirror/cache.

### Primaria vs. secundaria

Si está disponible, la **fuente primaria** gana:

- Ficha UNESCO original > nota de prensa reportando la declaratoria.
- Paper peer-reviewed original > resumen en blog universitario.
- Documento institucional (ICANH, Banrepcultural, archivos estatales) > artículo periodístico citándolo.
- Entrevista directa con el experto > artículo que cita la entrevista.

---

## 3. Señales de alarma (heurística, no whitelist negativa)

Una fuente con cualquiera de estas señales requiere justificación extra o se descarta:

- **Wiki o blog personal** sin credenciales del autor visibles.
- **Mirror / scraper** de contenido ajeno sin atribución clara (Scribd, PDFCoffee, sitios de "biblioteca digital" no institucionales).
- **Sin autor identificado** y sin institución editorial responsable.
- **Contenido derivado** cuyas fuentes originales no se pueden rastrear.
- **Domain recycling / dominios raros** (TLDs exóticos para el tema, hostings gratuitos).
- **Paywall total** sin versión abierta — el usuario no va a poder consumirlo.
- **Cloudflare challenge o anti-bot agresivo** — frágil para el pipeline.
- **Video de YouTube sin captions y sin views** — dos señales juntas típicamente indican canal amateur no curado.
- **Artículo muy corto** (<500 palabras) que promete cubrir un tema denso — probablemente superficial.

---

## 4. Anti-patterns (ejemplos reales de errores recientes)

Errores concretos que ya pasaron en este repo. No repetir.

### 4.1 "WebSearch dice que existe"

Un agente propuso 88 URLs afirmando "verificadas con WebSearch/WebFetch". Auditoría posterior encontró 14 URLs 404 duros (ej: `senalmemoria.co/articulos/pablo-escobar-caida-30-anos`, `senalmemoria.co/articulos/los-hermanos-mayores-kogui-documental`). El agente nunca abrió los enlaces — solo asumió que el dominio era confiable.

**Regla:** abrir con `curl` o `WebFetch` y verificar código 200 + contenido real. WebSearch ve resultados pero no garantiza que la URL puntual resuelva.

### 4.2 Inventar URLs por patrón

Varias URLs rotas tenían forma "si `senalmemoria.co/articulos/tema-X` existe, entonces `senalmemoria.co/articulos/tema-Y` también". No es así — cada URL se verifica individualmente.

### 4.3 Video sin captions

Un recurso apuntaba a `https://www.youtube.com/watch?v=tyPHu1xzwlk` (La Entrevista de Guayaquil). El video existe pero no tiene captions — el pipeline rompió con `No transcript available`. Ausencia de captions suele correlacionar con video de baja calidad o canal amateur.

**Regla:** verificar captions con `yt-dlp --list-subs` antes de proponer un video.

### 4.4 Aceptar 403/429 como "probablemente vivo"

Fuentes con anti-bot agresivo (National Geographic España, CRIC-colombia PDF, Conaie.org) devolvían 403/429 a curl pero "funcionan en browser". No sirven para este pipeline porque el fetcher programático tampoco va a poder. Reemplazar por fuente accesible.

### 4.5 Modificar una migración ya aplicada y asumir que la DB se actualiza

Editar un seed SQL que ya corrió contra la DB no actualiza los registros existentes. Para cambios en recursos ya en producción se necesita **una migración nueva con `UPDATE`** (ver `supabase/migrations/20260423010000_fix_travel_broken_urls.sql` como ejemplo). La migración vieja queda editada para que fresh installs obtengan la versión buena, y la migración `UPDATE` sincroniza los entornos existentes — ambos cambios se commitean juntos.

### 4.6 Usar nombre de columna equivocado

La tabla `resources` tiene columna `author`, no `source`. Verificar schema en `supabase/migrations/` antes de escribir un `UPDATE` o un PATCH REST.

### 4.7 Proponer HTML como recurso principal

Reemplazos aplicados a URLs 404 usando HTML (fichas UNESCO, journals web, landing pages de repositorios, artículos de periódicos, museos) resuelven como `pipeline_support = 'unsupported'`. La URL devuelve 200, la calidad académica es alta, pero el learner ve *"El link no parece válido"* al intentar generar el curso.

**Síntomas en la DB:** consulta `detectPipelineSourceType(url)` sobre los recursos del track y contá cuántos caen en `unsupported` — hoy aventura 96%, travel 70%, AI 47%.

**Regla:** al curar o reemplazar, preferir siempre YouTube o PDF directo. Cuando el sitio tenga ambas versiones (HTML viewer + PDF download), usar la PDF. Ver `docs/pipeline-sources.md`.

### 4.8 Asumir que `yt-dlp` siempre funciona con URLs de YouTube válidas

YouTube actualiza periódicamente su player JS (el hash aparece como `player/<hash>/tv-player-ias.js` en los logs). Cuando lo hace, `yt-dlp` necesita una versión nueva con el parser actualizado — sino falla al resolver el "n challenge" o la signature.

**Síntomas** (no son problema del video ni de la curación):

- `Error solving N challenge requests using "deno" provider`
- `found 0 n function possibilities`
- `Signature solving failed`
- `n challenge solving failed`
- `HTTP Error 429: Too Many Requests` tras reintentos

**Debugging antes de culpar al video:**

1. `yt-dlp --version` vs última en `https://github.com/yt-dlp/yt-dlp/releases/latest`.
2. Verificar captions con otra herramienta (`youtube-transcript-api` en Python, o el endpoint `oembed` para confirmar que el video existe).
3. Si otra herramienta ve captions pero `yt-dlp` falla → **infra, actualizar yt-dlp**.

**Cómo actualizar en macOS** (detectar el manager es importante — `yt-dlp -U` falla si fue instalado vía brew o pip con PEP 668):

```bash
# si está instalado por Homebrew:
brew upgrade yt-dlp

# si está instalado con pip (entorno manejado):
pipx upgrade yt-dlp
# o: python3 -m pip install --upgrade --break-system-packages yt-dlp
```

Mantener `yt-dlp` actualizado **ANTES** de auditar o reemplazar videos, o vas a descartar videos válidos pensando que no tienen captions.

---

## 5. Checklist antes de commitear recursos

Antes de pushear cualquier cambio que inserte o modifique recursos:

- [ ] Cada URL nueva verificada con `curl` devolvió 200 y título coherente.
- [ ] Si hay videos de YouTube: cada uno tiene captions confirmadas con `yt-dlp --list-subs`.
- [ ] Si hay PDFs: `Content-Type: application/pdf` y tamaño razonable.
- [ ] Cada recurso tiene autor identificable y defendible.
- [ ] Cada recurso triangulado — la `description` menciona al menos una fuente complementaria.
- [ ] Columnas correctas: `url`, `author`, `type`, `phase`, `description`, `track`, `estimated_hours`, `sort_order`, `curriculum_source`, `is_archived`, `created_by`.
- [ ] Si el cambio afecta la DB en uso: hay una migración `UPDATE` nueva además de las ediciones a seeds, y ambos lados quedan consistentes.
- [ ] Si hay dudas sobre calidad de una fuente, se consultó al usuario antes.

---

## 6. Cómo aplicar UPDATEs sin disparar migraciones ajenas

Cuando hay otros agentes con migraciones untracked en paralelo, `supabase db push` las correría todas. Para aplicar solo los `UPDATE`s propios sin tocar lo ajeno:

- Crear el archivo de migración `.sql` igual (queda en el repo como fuente de verdad).
- Aplicar el SQL directamente vía Supabase REST API (`PATCH /rest/v1/<tabla>?id=eq.<id>` con `SUPABASE_SECRET_KEY`) en lugar de correr el CLI.
- Verificar post-UPDATE con un `GET ?id=in.(...)` que los campos quedaron como se esperaba.

Ver ejemplo: la migración `20260423010000_fix_travel_broken_urls.sql` fue aplicada con PATCHes REST — no con `supabase db push` — precisamente porque había 3 migraciones untracked de otro agente en curso.
