# Pipeline: YouTube Video → Jarre Learning System

> Documento unificado para procesar un video de YouTube de principio a fin.
> Cubre desde la extracción del transcript hasta los video embeds inline.
> Gold standard: `kz2h-micrograd` (Karpathy: Micrograd — backprop from scratch).

---

## Visión General

```
YouTube Video
    ↓
[FASE 0] Análisis del video (chapters, descripción, estructura)
    ↓
[FASE 1] Extracción del transcript con timestamps
    ↓
[FASE 2] Traducción párrafo-por-párrafo EN → ES
    ↓
[FASE 3] Generación de contenido pedagógico (3 iteraciones)
    ↓
[FASE 4] Setup de base de datos (resource, concepts)
    ↓
[FASE 5] Seed de secciones a Supabase
    ↓
[FASE 6] Mapeo de segmentos de video a headings ← PROCESO CENTRAL
    ↓
[FASE 7] Artefactos: Advance Organizer, Quizzes, Questions, Exercises
    ↓
[FASE 8] Registro de rutas + Verificación
```

**Tiempo estimado por recurso:** Variable según duración del video y densidad conceptual. kz2h-micrograd (~2.5h video) tomó ~3 sesiones completas.

---

## INPUT REQUERIDO

1. **URL de YouTube** o Video ID
2. **Resource ID:** Convención `kz2h-{topic}` para Karpathy, `{keyword}-lecture` para otros
3. **Título en español**
4. **Fase de estudio** (1-11)

---

## FASE 0: Análisis del Video

Antes de extraer nada, analizar el video manualmente. Esto informa todas las decisiones posteriores.

### 0a. Obtener chapters del video

Los chapters de YouTube son la fuente primaria de estructura. Obtenerlos de:

1. **Descripción del video** — Los chapters están listados con timestamps (`00:00:00 intro`, `00:08:08 derivative...`)
2. **YouTube UI** — En el player, los chapters aparecen como segmentos en la barra de progreso
3. **Si no hay chapters** — Anotar manualmente los cambios de tema mirando el video (buscar transiciones como "now let's...", "next we'll...", slides nuevos)

**Formato de captura:**

```
00:00:00 intro
00:00:25 micrograd overview
00:08:08 derivative of a simple function with one input
00:14:12 derivative of a function with multiple inputs
...
```

Guardar en un comentario dentro del script de seed o en un archivo temporal.

### 0b. Analizar la estructura conceptual

Mirar el video (al menos en 2x) y responder:

- ¿Cuáles son los 4-6 **temas centrales** del video?
- ¿El video sigue un orden pedagógico lineal o salta entre temas?
- ¿Hay partes que son **setup** (mostrar código, importar librerías) vs **conceptuales** (explicar por qué)?
- ¿Hay demostraciones en vivo donde el instructor escribe código?
- ¿Hay momentos de "revelación" o eureka que merecen tratamiento especial?

### 0c. Decidir la resegmentación temática

Los chapters del video rara vez coinciden 1:1 con secciones pedagógicas. Decidir:

- **Qué chapters se fusionan** (temas relacionados que juntos forman una unidad coherente)
- **Qué chapters se dividen** (un chapter largo que cubre múltiples conceptos)
- **Qué orden temático seguir** (puede diferir del orden cronológico del video)

**Ejemplo de kz2h-micrograd:**

```
VIDEO (cronológico):          CONTENIDO (temático):
1. intro                  →   S0: Qué es ML (caps 1,2 + cap 13 de PyTorch)
2. micrograd overview     →   S1: Value (caps 5, parte de 6)
3. derivative simple      →   S2: Derivada Parcial (caps 3,4, parte de 6)
4. derivative multiple    →   S3: Backpropagation (caps 7-12, parte de 15-17)
5. Value object           →   S4: MLP (caps 14, 15-17, 18-21)
6. manual backprop #1
...21 chapters total
```

Notar: los capítulos 3-4 (derivadas) aparecen DESPUÉS de 5 (Value) en el video, pero ANTES en el contenido pedagógico. La resegmentación prioriza comprensión gradual sobre orden cronológico.

---

## FASE 1: Extracción del Transcript

### Script: `scripts/ingest-youtube.py`

```bash
# Uso básico
python scripts/ingest-youtube.py "https://www.youtube.com/watch?v=VMj-3S1tku0"

# Con opciones
python scripts/ingest-youtube.py VMj-3S1tku0 \
  --resource-id kz2h-micrograd \
  --language en \
  --chunk-size 500
```

**Flags:**

| Flag | Default | Propósito |
|------|---------|-----------|
| `--resource-id` | `youtube-{VIDEO_ID}` | Override del resource_id |
| `--concept-id` | `to-be-mapped` | Concept ID (se cambia después) |
| `--language` | `en` | Idioma del transcript |
| `--chunk-size` | `500` | Palabras por chunk |
| `--output-dir` | `scripts/output` | Directorio de salida |

**Qué hace el script:**

1. Extrae video ID de URL (soporta youtube.com, youtu.be, embed, bare ID)
2. Obtiene transcript vía `youtube-transcript-api` (prefiere manual sobre auto-generated)
3. Limpia artefactos de auto-caption (`[Music]`, `[Applause]`, stuttering)
4. Segmenta en chunks de ~500 palabras usando silence gaps (>5s) como boundaries
5. Genera JSON con timestamps: `scripts/output/youtube-{VIDEO_ID}-sections.json`

**Output:**

```json
[
  {
    "resource_id": "kz2h-micrograd",
    "concept_id": "to-be-mapped",
    "section_title": "Part 1 (0:00 - 8:08)",
    "sort_order": 0,
    "content_original": "so what is micrograd...",
    "word_count": 487
  }
]
```

**Dependencias:** `pip install youtube-transcript-api`

**Gotcha:** Si el video tiene captions auto-generados, la calidad puede ser baja. Verificar el output manualmente.

---

## FASE 2: Traducción

### Script: `scripts/translate-chapter.py`

```bash
python scripts/translate-chapter.py scripts/output/youtube-VMj-3S1tku0-sections.json \
  --glossary ml-ai
```

**Flags:**

| Flag | Default | Propósito |
|------|---------|-----------|
| `--glossary` | `distributed-systems` | Dominio del glosario (`scripts/glossaries/{domain}.json`) |
| `--output-dir` | `scripts/output` | Directorio de salida |

**Qué hace:**

1. Divide cada sección en párrafos (por `\n\n`)
2. Traduce párrafo por párrafo vía DeepSeek V3 con:
   - Glosario técnico inyectado en system prompt
   - Contexto deslizante (últimos 500 chars de traducción anterior)
   - Instrucción explícita "DO NOT SUMMARIZE" en cada llamada
   - Temperatura 0.15 (muy conservador)
3. Verifica ratio de longitud por párrafo: `0.85 ≤ ratio ≤ 1.50`
4. Genera `scripts/output/{stem}-translated.json`

**Glosarios disponibles:**
- `scripts/glossaries/distributed-systems.json` (36 términos)
- `scripts/glossaries/ml-ai.json` (74 términos)

**Output:** Mismo formato pero con `content_markdown` (ES) y `content_original` (EN) preservado.

**IMPORTANTE:** Este output es la **traducción fiel** del transcript. NO es el contenido pedagógico final. La Fase 3 lo transforma.

---

## FASE 3: Generación de Contenido Pedagógico

> Referencia completa: `cursos/PROMPT-GENERATE-CONTENT.md` + `cursos/CONTENT-QUALITY-STANDARD.md`

### Resumen del proceso (3 iteraciones)

**Iteración 1 — Conversación cruda:**
- Input: transcript traducido
- Output: conversación de aprendizaje (~400-600 líneas)
- Guardar en `ml_deep/{nombre}-conversacion-completa.md`
- **Esperar aprobación antes de continuar**

**Iteración 2 — Enrichment pedagógico:**
- Aplicar las 6 operaciones: expandir, insistir, eureka, analogías, repetición distribuida, explicitar código
- Resegmentar en 5 secciones con progresión: contexto → building block → mecanismo → automatización → integración
- Output: `scripts/output/{resource-id}-resegmented.json`
- **Producir sección por sección, esperar aprobación**

**Iteración 3 — Cross-linking:**
- Agregar links 🔗, reglas prácticas, tablas comparativas
- Revisar tono, progresión, ritmo

### Formato del JSON resegmentado

```json
[
  {
    "resource_id": "kz2h-micrograd",
    "concept_id": "neural-network-fundamentals",
    "section_title": "Qué es ML — La Fábrica que Aprende Sola",
    "sort_order": 0,
    "content_markdown": "**El cambio de paradigma**\n\nHay una inversión...\n\n**Micrograd y la clase Value**\n\n..."
  }
]
```

### Los bold headings son la unidad atómica

Dentro de `content_markdown`, cada `**Bold Heading**` (en su propia línea) define una sub-sección. Estos headings son la **interfaz de posicionamiento** para video embeds y quizzes inline.

**CRÍTICO:** Los headings deben diseñarse pensando en qué segmentos de video van a mapear a ellos. Cada heading que corresponde a una parte del video debe nombrarse de forma que refleje el concepto cubierto en esa porción del video.

### Métricas de referencia (video corto 1-2hrs)

| Métrica | Target |
|---------|--------|
| Secciones | 4-6 |
| Chars por sección | 10K-18K |
| Total | 50K-80K |
| Ratio expansión vs fuente | 3-5x |

### Métricas de referencia (video largo 3-5hrs)

| Métrica | Target |
|---------|--------|
| Secciones | 4-6 |
| Chars por sección | 16K-25K |
| Total | 80K-120K |
| Ratio expansión vs fuente | 2-3x |

---

## FASE 4: Setup de Base de Datos

### 4a. Verificar/crear el resource

```sql
SELECT id, title FROM resources WHERE id = 'kz2h-micrograd';

-- Si no existe:
INSERT INTO resources (id, title, type, phase)
VALUES ('kz2h-micrograd', 'Micrograd: Backprop desde Cero', 'lecture', '2'::study_phase);
```

**Tipo:** Usar `'lecture'` para videos estructurados (aparecen en library principal). El tipo `'video'` se oculta en la vista principal.

### 4b. Crear concepts

Cada sección mapea a un `concept_id`. Crear migración:

```sql
-- supabase/migrations/{timestamp}_{resource_id}_concepts.sql
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('neural-network-fundamentals', 'Neural Network Fundamentals', 'neural-network-fundamentals',
   'Core concepts of neural networks including Value objects, computation graphs, and forward passes', '2'::study_phase),
  ('backpropagation-training', 'Backpropagation & Training', 'backpropagation-training',
   'Automatic differentiation via backpropagation and gradient descent training', '2'::study_phase)
ON CONFLICT (id) DO NOTHING;
```

---

## FASE 5: Seed de Secciones

### Script dedicado por recurso

Crear `scripts/seed-{resource-id}-sections.ts`:

```bash
npx tsx scripts/seed-kz2h-micrograd-sections.ts
```

**Qué hace:**
1. Lee `scripts/output/{resource-id}-resegmented.json`
2. Valida que `concept_id` de cada sección existe en DB
3. Limpia dependencias FK (question_bank, inline_quizzes, video_segments) — **NO son CASCADE**
4. Borra secciones existentes del mismo resource_id
5. Inserta las nuevas secciones

**Alternativa genérica:**

```bash
npx tsx scripts/seed-sections.ts --from-file scripts/output/{resource-id}-resegmented.json
```

---

## FASE 6: Mapeo de Segmentos de Video a Headings

> **Esta es la fase más crítica y artesanal del pipeline.**
> No hay automatización posible — requiere juicio humano sobre pedagogía.

### El Concepto

Cada sección del contenido pedagógico tiene bold headings (`**Heading**`). Algunos de esos headings corresponden a partes específicas del video. El objetivo es **embeber el clip exacto del video debajo del heading correspondiente**, para que el estudiante lea el heading, vea el video de esa parte, y luego lea la explicación expandida.

**Flujo en la UI:**

```
**Bold Heading**           ← Título del concepto
┌──────────────────────┐
│  ▶ YouTube Embed     │   ← Video clip (start → end)
│  0:32:10 – 0:51:10   │
│  · Backprop manual    │
└──────────────────────┘
Contenido expandido...     ← Texto pedagógico enriquecido
┌──────────────────────┐
│  Quiz inline          │   ← Evaluación post-lectura
└──────────────────────┘
```

### Prerrequisitos

Para esta fase necesitás tener:

1. ✅ Los **chapters del video** con timestamps (de FASE 0)
2. ✅ El **contenido resegmentado** con todos los bold headings (de FASE 3)
3. ✅ Las **secciones seeded** en Supabase (de FASE 5) — necesitás los `section_id` UUIDs

### El Proceso Paso a Paso

#### Paso 1: Listar los chapters del video

Copiar los chapters de la descripción de YouTube con timestamps exactos:

```
00:00:00 intro
00:00:25 micrograd overview
00:08:08 derivative of a simple function with one input
00:14:12 derivative of a function with multiple inputs
00:19:09 starting the core Value object and its visualization
00:32:10 manual backpropagation example #1: simple expression
00:51:10 preview of a single optimization step
00:52:52 manual backpropagation example #2: a neuron
01:09:02 implementing the backward function for each operation
...
```

Calcular `endSeconds` de cada chapter: es el `startSeconds` del siguiente chapter.

#### Paso 2: Listar todos los bold headings del contenido

Para cada sección, extraer los headings:

```
SECCIÓN 0: Qué es ML — La Fábrica que Aprende Sola
  - El cambio de paradigma
  - Los ingredientes del ML
  - La fábrica con perillas
  - Micrograd y la clase Value
  - De micrograd a PyTorch

SECCIÓN 1: Value — Un Número con Memoria
  - Construyendo Value
  - El DAG
  - El gradiente
  ...
```

#### Paso 3: Clasificar cada heading

Para CADA heading, decidir:

| Clasificación | Criterio | Acción |
|---------------|----------|--------|
| **Video directo** | El heading corresponde claramente a un chapter o porción del video | Mapear chapter(s) → heading con timestamps |
| **Editorial** | El heading es contenido agregado por el enrichment pedagógico (analogías, reglas prácticas, síntesis, explicación de código detallada) | No asignar video — skip |

**Señales de heading editorial (sin video):**
- Empieza con "Regla práctica:" — es un mnemotécnico sintetizado
- Es una explicación de método Python (`__init__`, `__call__`, `parameters`) — nivel de detalle que el video no cubre
- Es una analogía o metáfora ("La fábrica con perillas") — narrativa agregada
- Es una síntesis comparativa (tablas tanh vs ReLU) — contenido expandido

**Señales de heading con video:**
- Nombra un concepto que el instructor explica directamente en el video
- Corresponde a un step del flujo que se demuestra en vivo
- Involucra código que el instructor escribe en pantalla

#### Paso 4: Para cada heading con video, determinar timestamps

Este es el paso más delicado. Hay 5 estrategias de mapeo:

##### Estrategia 1: Mapeo directo (1 chapter → 1 heading)

El caso más simple. Un chapter del video corresponde exactamente a un heading.

```typescript
{
  sectionTitle: 'La Derivada Parcial — El Momento Eureka',
  positionAfterHeading: 'PARA. QUE. ES. ESTO.',
  startSeconds: 488,     // 00:08:08 — inicio del chapter
  endSeconds: 852,       // 00:14:12 — inicio del siguiente chapter
  label: 'La derivada: definición, límite y evaluación numérica',
}
```

**Cuándo usar:** El chapter cubre UN tema que mapea limpiamente a UN heading.

##### Estrategia 2: Fusión (N chapters → 1 heading)

Varios chapters del video se combinan en un solo heading porque juntos forman una unidad temática.

```typescript
{
  // Chapters 1+2: "intro" + "micrograd overview"
  positionAfterHeading: 'Micrograd y la clase Value',
  startSeconds: 0,       // 00:00:00 — inicio de chapter 1
  endSeconds: 488,       // 00:08:08 — inicio de chapter 3 (fin de chapter 2)
  label: 'Intro: qué es micrograd, Value y expression graphs',
}
```

**Cuándo usar:** Chapters cortos y adyacentes que cubren el mismo tema. Típico con "intro" + primer chapter, o "walkthrough" + "conclusion".

##### Estrategia 3: División (1 chapter → N headings)

Un chapter largo cubre múltiples conceptos. Se crean múltiples segmentos con timestamps parciales.

```typescript
// Chapter 5: "starting the core Value object" (19:09 → 32:10)
// Se divide en 2 headings:

{
  positionAfterHeading: 'Construyendo Value',
  startSeconds: 1149,    // 00:19:09 — inicio del chapter
  endSeconds: 1930,      // 00:32:10 — fin del chapter
  label: 'Clase Value: __add__, __mul__, _prev, _op, visualización',
},
{
  positionAfterHeading: 'El DAG',
  startSeconds: 1440,    // ~24:00 — graphviz se introduce a mitad del chapter
  endSeconds: 1930,      // 00:32:10 — fin del chapter
  label: 'El DAG: visualización con Graphviz y draw_dot',
}
```

**Cuándo usar:** Un chapter de >10 minutos que introduce múltiples conceptos. El timestamp de inicio del segundo segmento es APROXIMADO — mirar el video para encontrar el punto de transición.

**CÓMO encontrar el punto de corte:**
1. Abrir el video en YouTube
2. Navegar al chapter
3. Buscar el momento donde el instructor cambia de tema, introduce un nuevo concepto, o muestra algo nuevo en pantalla
4. Anotar el timestamp (redondear a minutos está OK para segmentos >5min)

##### Estrategia 4: Rearreglo temático (chapters no-adyacentes → mismo heading o sección)

Chapters que están dispersos en el video pero pertenecen al mismo tema pedagógico.

```typescript
// Chapter 13 (01:39:31) aparece en Sección 0, NO en orden cronológico
{
  sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',  // Sección 0
  positionAfterHeading: 'De micrograd a PyTorch',
  startSeconds: 5971,    // 01:39:31 — chapter 13, cronológicamente mucho después
  endSeconds: 6235,      // 01:43:55
  label: 'Demo PyTorch: mismos resultados que micrograd',
}
```

**Cuándo usar:** Cuando el video tiene un momento posterior que complementa un tema de la introducción. El contenido resegmentado agrupa temas, no sigue cronología.

##### Estrategia 5: Reutilización (1 chapter → N headings en distintas secciones)

El mismo video se embebe en dos contextos diferentes, cada uno enfatizando un aspecto distinto.

```typescript
// Chapter 8 ("manual backprop #2") reutilizado:

// Contexto 1: Forward y backward completo
{
  sectionTitle: 'Backpropagation y la Chain Rule',
  positionAfterHeading: 'Forward y backward a mano',
  startSeconds: 3070,    // 00:51:10
  endSeconds: 4142,      // 01:09:02
  label: 'Neurona con tanh: forward pass y backprop manual',
},

// Contexto 2: Foco específico en tanh
{
  sectionTitle: 'Backpropagation y la Chain Rule',
  positionAfterHeading: 'Backprop con tanh',
  startSeconds: 3172,    // 00:52:52 (ligeramente diferente)
  endSeconds: 4142,      // 01:09:02
  label: 'Implementando tanh y backprop completo de una neurona',
}
```

**Cuándo usar:** Cuando un chapter es tan rico que dos headings diferentes se benefician de verlo. Cada instancia puede tener timestamps ligeramente distintos para enfocar la porción más relevante.

#### Paso 5: Escribir el script de seed

Crear `scripts/seed-video-segments-{resource-id}.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = '{resource-id}';
const YOUTUBE_VIDEO_ID = '{video-id}';

interface VideoSegmentDef {
  sectionTitle: string;          // DEBE coincidir EXACTAMENTE con section_title en DB
  positionAfterHeading: string;  // DEBE coincidir EXACTAMENTE con **heading** en content_markdown
  sortOrder: number;
  startSeconds: number;
  endSeconds: number;
  label: string;                 // Descripción breve del clip
}

const SEGMENTS: VideoSegmentDef[] = [
  // Pegar los chapters de YouTube como comentario de referencia:
  //
  // 00:00:00 intro
  // 00:00:25 topic overview
  // ...
  //
  // Luego los segmentos:
  {
    sectionTitle: '{Título exacto de la sección}',
    positionAfterHeading: '{Texto exacto del **heading**}',
    sortOrder: 0,
    startSeconds: 0,
    endSeconds: 488,
    label: 'Descripción del contenido del clip',
  },
  // ...
];

async function main() {
  // 1. Fetch section IDs
  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', RESOURCE_ID)
    .order('sort_order');

  if (sectionsError || !sections?.length) {
    console.error('Failed to fetch sections:', sectionsError);
    process.exit(1);
  }

  const sectionMap = new Map(sections.map((s) => [s.section_title, s.id]));

  // 2. Delete existing video segments
  const sectionIds = sections.map((s) => s.id);
  await supabase.from('video_segments').delete().in('section_id', sectionIds);

  // 3. Insert new segments
  const rows = SEGMENTS.map((seg) => {
    const sectionId = sectionMap.get(seg.sectionTitle);
    if (!sectionId) throw new Error(`Section not found: "${seg.sectionTitle}"`);
    return {
      section_id: sectionId,
      position_after_heading: seg.positionAfterHeading,
      sort_order: seg.sortOrder,
      youtube_video_id: YOUTUBE_VIDEO_ID,
      start_seconds: seg.startSeconds,
      end_seconds: seg.endSeconds,
      label: seg.label,
    };
  });

  const { error: insertError } = await supabase.from('video_segments').insert(rows);
  if (insertError) {
    console.error('Failed to insert:', insertError);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} video segments across ${sections.length} sections`);
}

main();
```

**Ejecutar:**

```bash
npx tsx scripts/seed-video-segments-{resource-id}.ts
```

### Reglas del Matching (CRÍTICAS)

| Regla | Detalle |
|-------|---------|
| `sectionTitle` | Debe coincidir **exactamente** con `section_title` en la tabla `resource_sections` |
| `positionAfterHeading` | Debe coincidir **exactamente** con el texto dentro de `**...**` en el `content_markdown` |
| Case-sensitive | `"El DAG"` ≠ `"el dag"` |
| Sin trim | Sin espacios extra al inicio/final |
| Silent skip | Si no matchea, el video simplemente no se renderiza (sin error) |

### Orden de Renderizado en la UI

Para cada heading en el contenido:

```
1. **Bold Heading**          ← se renderiza como título
2. [Video Embed]             ← SI hay video_segment con positionAfterHeading == heading
3. Contenido markdown        ← texto pedagógico debajo del heading
4. [Inline Quiz]             ← SI hay inline_quiz con positionAfterHeading == heading
```

El video va ANTES del contenido textual. La idea: "mirá esta parte del video, y después leé la explicación expandida".

### Tabla de Decisión: ¿Este heading lleva video?

```
¿El instructor cubre este concepto         ┬── SÍ → ¿Es un chapter completo?
  directamente en el video?                 │         ├── SÍ → Estrategia 1 (mapeo directo)
                                            │         └── NO → ¿Es parte de un chapter largo?
                                            │                   ├── SÍ → Estrategia 3 (división)
                                            │                   └── Es varios chapters juntos
                                            │                             → Estrategia 2 (fusión)
                                            │
                                            └── NO → ¿Es contenido editorial?
                                                      ├── Regla práctica → SKIP
                                                      ├── Analogía/metáfora → SKIP
                                                      ├── Explicación de código detallada → SKIP
                                                      ├── Tabla comparativa → SKIP
                                                      └── Síntesis/resumen → SKIP
```

### Estadísticas del Gold Standard (kz2h-micrograd)

| Métrica | Valor |
|---------|-------|
| Chapters de YouTube | 21 |
| Headings totales en contenido | 54 |
| Headings con video | 22 (42%) |
| Headings editoriales (sin video) | 32 (58%) |
| Capítulos fusionados | 9 → 5 segmentos |
| Capítulos divididos | 4 → 10 segmentos |
| Capítulos reutilizados | 1 (chapter 8 en 2 headings) |

**Distribución por sección:**

| Sección | Headings | Con Video | % |
|---------|----------|-----------|---|
| S0: Qué es ML | 5 | 2 | 40% |
| S1: Value | 3 | 3 | 100% |
| S2: Derivada | 6 | 4 | 67% |
| S3: Backprop | 16 | 9 | 56% |
| S4: MLP | 20 | 5 | 25% |

**Patrón:** Las secciones más conceptuales/de implementación (S1, S2) tienen mayor % de video. Las secciones con más contenido editorial expandido (S4) tienen menor %.

### Tabla de video_segments en DB

```sql
CREATE TABLE video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  position_after_heading TEXT NOT NULL,    -- Matching exacto con **heading**
  sort_order INTEGER NOT NULL DEFAULT 0,  -- Orden dentro del mismo heading
  youtube_video_id TEXT NOT NULL,          -- ID de 11 chars de YouTube
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  label TEXT,                              -- Descripción breve (opcional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- RLS: Public read (contenido no es user-specific)
- Index: `(section_id, sort_order)`
- Cascade: `ON DELETE CASCADE` desde `resource_sections`

### Tipo TypeScript

```typescript
interface VideoSegment {
  id: string;
  sectionId: string;
  positionAfterHeading: string;
  sortOrder: number;
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  label: string | null;
}
```

---

## FASE 7: Artefactos

> Referencia completa: `cursos/TEMPLATE-CONTENT-GENERATION.md`

### 7a. Advance Organizer (TSX)

Componente visual para el paso ACTIVATE del flujo de aprendizaje.

**Archivo:** `src/app/learn/[resourceId]/{resource-id}.tsx`

5 secciones numeradas con: analogía box, grid comparativo, insight clave, mnemotécnico, pregunta final. Ver `cursos/TEMPLATE-CONTENT-GENERATION.md` Paso 2 para estructura completa.

### 7b. Inline Quizzes

**Archivo:** `scripts/seed-inline-quizzes-{resource-id}.ts`

- 12-20 quizzes totales (2-4 por sección)
- Mix: ~35% MC, ~30% TF, ~35% MC2
- `positionAfterHeading` sigue la MISMA convención que video segments
- Los quizzes van DESPUÉS del contenido, los videos van ANTES

**Ejecutar:** `npx tsx scripts/seed-inline-quizzes-{resource-id}.ts`

### 7c. Reading Questions

**Archivo:** `src/app/learn/[resourceId]/reading-questions.ts`

6-7 preguntas: 2 why, 2 tradeoff, 1 connection, 1 design_decision, 1 error_detection.

### 7d. Ejercicios Interactivos

**Archivo:** `src/data/exercises/{resource-id}-exercises.ts`

3 ejercicios: 1 sequence, 1 label o connect, 1 sequence o connect.

### 7e. Playground (opcional)

**Directorio:** `src/app/playground/{name}/`

3 archivos: page.tsx, {name}-playground.tsx, lesson-guide.tsx.

---

## FASE 8: Registro y Verificación

### 8a. Registrar rutas

En `src/app/learn/[resourceId]/page.tsx`:

```tsx
// 1. Import
import { KZ2HMicrograd } from './kz2h-micrograd';

// 2. PRACTICAL_ROUTES
'kz2h-micrograd': { label: 'Playground', href: '/playground/micrograd' },

// 3. EXPLANATION_COMPONENTS
'kz2h-micrograd': () => <KZ2HMicrograd />,
```

### 8b. Verificación

```bash
# TypeScript compila
npx tsc --noEmit

# Dev server funciona
npm run dev

# Verificar en browser:
# 1. /library → el recurso aparece en la fase correcta
# 2. /learn/{resource-id} → las secciones se renderizan
# 3. Los videos aparecen debajo de los headings correctos
# 4. Los quizzes aparecen después del contenido
# 5. El advance organizer se muestra en el paso ACTIVATE
```

---

## Tracking de Progreso

Actualizar la tabla en `BACKLOG.md`:

| Resource | Transcript | Translate | Resegment | TSX | Questions | Quizzes | Exercises | Video Segments |
|----------|-----------|-----------|-----------|-----|-----------|---------|-----------|----------------|
| kz2h-micrograd | x | x | x | x | x | x | x | x |
| kz2h-makemore-bigram | - | - | - | - | - | - | - | - |

---

## Orden de Ejecución Óptimo

```
[FASE 0: Análisis]
    ↓
[FASE 1: Transcript] → [FASE 2: Traducción]
    ↓
[FASE 3: Contenido pedagógico] ← iterativo, con aprobaciones
    ↓
[FASE 4: DB Setup]
    ↓
[FASE 5: Seed secciones]
    ↓ (en paralelo)
    ├── [FASE 6: Video segments]    ← requiere secciones seeded + headings finales
    ├── [FASE 7b: Inline quizzes]   ← requiere secciones seeded + headings finales
    ├── [FASE 7a: Advance organizer] ← independiente
    ├── [FASE 7c: Reading questions] ← independiente
    ├── [FASE 7d: Ejercicios]       ← independiente
    └── [FASE 7e: Playground]       ← independiente
    ↓
[FASE 8: Registro + Verificación]
```

**Dependencias críticas:**
- FASE 6 y 7b dependen de FASE 5 (necesitan `section_id` UUIDs)
- FASE 6 y 7b dependen de los headings exactos del contenido (FASE 3)
- Todo lo demás puede paralelizarse después de FASE 5

---

## Checklist Completa por Recurso

```
□ FASE 0: Análisis del video
  □ Obtener chapters de YouTube con timestamps
  □ Analizar estructura conceptual (mirar video)
  □ Decidir resegmentación temática (5 secciones)

□ FASE 1: Transcript
  □ python scripts/ingest-youtube.py {URL}
  □ Verificar output: palabras, segmentos, duración

□ FASE 2: Traducción
  □ python scripts/translate-chapter.py {json} --glossary ml-ai
  □ Verificar ratios de longitud (0.85-1.50)

□ FASE 3: Contenido pedagógico
  □ Iteración 1: Conversación cruda → aprobación
  □ Iteración 2: Enrichment → 5 secciones → aprobación por sección
  □ Iteración 3: Cross-linking → revisión final
  □ Output: scripts/output/{resource-id}-resegmented.json

□ FASE 4: DB Setup
  □ Resource existe en tabla resources
  □ Concepts creados con migración
  □ Migración aplicada

□ FASE 5: Seed secciones
  □ npx tsx scripts/seed-{resource-id}-sections.ts
  □ Verificar secciones en Supabase

□ FASE 6: Video segments ← PROCESO CENTRAL
  □ Listar chapters de YouTube con timestamps
  □ Listar todos los bold headings del contenido
  □ Clasificar cada heading: video directo vs editorial
  □ Para cada heading con video, determinar timestamps (5 estrategias)
  □ Escribir script seed-video-segments-{resource-id}.ts
  □ Ejecutar: npx tsx scripts/seed-video-segments-{resource-id}.ts
  □ Verificar en UI: videos aparecen debajo de headings correctos

□ FASE 7: Artefactos
  □ 7a: Advance Organizer TSX
  □ 7b: Inline Quizzes (12-20, seed script)
  □ 7c: Reading Questions (6-7)
  □ 7d: Ejercicios (3)
  □ 7e: Playground (opcional)

□ FASE 8: Verificación
  □ npx tsc --noEmit
  □ Registrar en page.tsx (import, PRACTICAL_ROUTES, EXPLANATION_COMPONENTS)
  □ Verificar en browser: library → learn → activate → sections → videos → quizzes
  □ Actualizar BACKLOG.md
```
