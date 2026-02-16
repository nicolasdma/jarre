# Template de Generacion de Contenido — Jarre Learning System

## Proposito

Este template es el **prompt completo y auto-contenido** para generar TODA la infraestructura de aprendizaje de un nuevo recurso (capitulo de libro, paper, video). Al recibir un PDF o link, se ejecutan los 8 pasos en orden. Cada paso produce archivos concretos que se integran al sistema.

**Flujo de aprendizaje del usuario:** ACTIVATE → LEARN → REVIEW → PRACTICE-EVAL → EVALUATE

---

## INPUT REQUERIDO

El usuario provee:
1. **PDF o link** al material fuente (libro, paper)
2. **resource_id**: ID unico del recurso (e.g. `ddia-ch8`, `attention-paper`)
3. **Titulo** del recurso en espanol
4. **Fase de estudio** (1-6, default 1)

### Convencion de Resource IDs
- DDIA capitulos: `ddia-ch{N}` (e.g. `ddia-ch8`, `ddia-ch11`)
- Papers: `{keyword}-paper` (e.g. `attention-paper`, `scaling-laws-paper`, `tail-at-scale-paper`)
- Videos: `{keyword}-video`
- Cursos: `{keyword}-course`

---

## PASO 0: Prerequisitos en Base de Datos

### 0a. Verificar que el recurso existe en la tabla `resources`

```sql
SELECT id, title FROM resources WHERE id = '{resource_id}';
```

Si no existe, insertarlo:

```sql
INSERT INTO resources (id, title, type, phase)
VALUES ('{resource_id}', '{Titulo}', 'book'|'paper'|'video', '{phase}'::study_phase);
```

### 0b. Crear concept IDs nuevos

Cada recurso se divide en 4-6 secciones, cada una mapeada a un `concept_id`. Los concept IDs deben existir en la tabla `concepts`.

Crear migracion: `supabase/migrations/{timestamp}_{resource_id}_concepts.sql`

```sql
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('{concept-id}', '{Concept Name}', '{concept-id}',
   '{Definicion canonica en ingles, 1-2 oraciones}', '{phase}'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- Prerequisites (opcional)
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES ('{concept-id}', '{prerequisite-concept-id}')
ON CONFLICT DO NOTHING;
```

Aplicar: `npx supabase db push` o ejecutar SQL directo.

**CRITICO**: El tipo `phase` es un enum. Usar cast: `'1'::study_phase`, NO un integer.

---

## PASO 1: Secciones de Contenido (resource_sections)

### Objetivo
Producir `scripts/output/{resource-id}-resegmented.json` — un array JSON de 4-6 secciones con contenido markdown traducido al espanol.

### Formato del JSON

```json
[
  {
    "resource_id": "{resource_id}",
    "concept_id": "{concept_id}",
    "section_title": "{Titulo en espanol}",
    "sort_order": 0,
    "content_markdown": "**{Titulo}**\n\nContenido extenso en markdown..."
  }
]
```

### Para libros (DDIA, etc.)

1. **Traducir** el capitulo completo a espanol (preservando terminos tecnicos en ingles)
2. **Resegmentar** en 4-6 secciones por concepto, dividiendo en bold headings naturales
3. Se puede usar `scripts/resegment-chapters.py` como referencia

### Para papers

Generar contenido directamente (no hay traduccion de PDF):
- Leer/analizar el paper
- Crear 5 secciones de 6000-12000 caracteres cada una
- Contenido de nivel postgrado, con formulas, datos especificos, contexto historico
- Tono de libro de texto tecnico, no tutorial basico

### Criterios de calidad por seccion
- **6,000-12,000 caracteres** de markdown
- Comienza con `**{Titulo de la seccion}**` en bold
- Sub-secciones marcadas con `**bold**`
- Incluye formulas, numeros concretos, ejemplos especificos
- Todo en espanol, terminos tecnicos en ingles preservados
- Cada seccion mapea a un concept_id existente

### Seedeo a Supabase

```bash
npx tsx scripts/seed-sections.ts --from-file scripts/output/{resource-id}-resegmented.json
```

El script `seed-sections.ts`:
- Lee el JSON
- Valida que los concept_ids existen
- Borra secciones anteriores del mismo resource_id
- Inserta las nuevas secciones

---

## PASO 2: Advance Organizer (componente React TSX)

### Objetivo
Crear el componente visual que se muestra en el paso ACTIVATE del flujo de aprendizaje.

### Archivo
`src/app/learn/[resourceId]/{component-name}.tsx`

Convencion de nombres:
- DDIA: `ddia-ch{N}.tsx` → export `DDIAChapter{N}`
- Papers: `{keyword}.tsx` → export `{PascalCaseName}`

### Estructura del componente

```tsx
export function {ComponentName}() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-[#COLOR]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {Source} · {Reference}
          </span>
        </div>
        <h1 className="text-4xl font-light text-j-text mb-2">{Titulo}</h1>
        <p className="text-2xl font-light text-j-text-tertiary">{Subtitulo}</p>
        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          {Descripcion introductoria 2-3 lineas}
        </p>
      </header>

      {/* Section 01-05 */}
      {/* Cada seccion con: numero, titulo, subtitulo, analogia box, grid comparativo, insight clave */}

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotecnico</p>
        <p className="text-6xl font-light text-j-text mb-2">{ACRONIMO}</p>
        {/* Desglose del acronimo */}
      </section>

      {/* Pregunta final */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          {Pregunta de reflexion profunda}
        </p>
      </section>
    </article>
  );
}
```

### Paleta de colores (usar consistente por seccion)
- Accent: `#991b1b` (rojo oscuro) — para titulos, highlights
- Warm: `#8b7355` — para comparaciones, contrastes
- System classes: `j-text`, `j-text-secondary`, `j-text-tertiary`, `j-border`, `j-accent`

### 5 secciones obligatorias
Cada seccion incluye:
1. **Numero** (`01`-`05`) en font-mono light
2. **Titulo + subtitulo**
3. **Analogia box** (fondo `bg-white/50` con esquinas decorativas)
4. **Grid comparativo** (2 columnas con border colored)
5. **Insight clave** (border-left accent color)

### Patrones existentes (copiar estructura de):
- `src/app/learn/[resourceId]/ddia-ch9.tsx` — DDIA pattern
- `src/app/learn/[resourceId]/attention-paper.tsx` — Paper pattern

---

## PASO 3: Registro de Rutas

### Archivo: `src/app/learn/[resourceId]/page.tsx`

Agregar 3 cosas:

#### 3a. Import del componente
```tsx
import { {ComponentName} } from './{filename}';
```

#### 3b. PRACTICAL_ROUTES
```tsx
'{resource_id}': { label: 'Playground', href: '/playground/{playground-name}' },
```

#### 3c. EXPLANATION_COMPONENTS
```tsx
'{resource_id}': () => <{ComponentName} />,
```

---

## PASO 4: Inline Quizzes

### Objetivo
Crear quizzes que aparecen dentro del contenido de las secciones durante el paso LEARN.

### Archivo
`scripts/seed-inline-quizzes-{resource-id}.ts`

### Estructura del script

```typescript
#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

interface QuizDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

const QUIZZES: QuizDef[] = [
  // ... quiz definitions
];

async function main() {
  const { data: sections } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', '{resource_id}')
    .order('sort_order');

  // Map section titles to IDs, insert quizzes
  // (ver seed-inline-quizzes-ch6.ts como patron completo)
}

main();
```

### Distribucion recomendada
- **12-20 quizzes totales** por recurso
- **2-4 quizzes por seccion** (excepto Resumen que puede tener 0-1)
- Mix de formatos: **~35% MC, ~30% TF, ~35% MC2**
- MC: 4 opciones (A-D), opciones plausibles
- TF: correctAnswer es `'true'` o `'false'`
- MC2: multiples correctas, correctAnswer como `'[A,C]'`, incluir `justificationHint`

### CRITICO: El `sectionTitle` en el quiz DEBE coincidir EXACTAMENTE con el `section_title` de la seccion en Supabase

### Seedeo

```bash
npx tsx scripts/seed-inline-quizzes-{resource-id}.ts
```

---

## PASO 4b: Section Questions (Preguntas "Antes de Leer")

### Objetivo
Crear preguntas que aparecen ANTES de leer cada seccion en el paso LEARN. Son preguntas de activacion que el usuario intenta responder antes de leer el contenido.

### Archivo
`scripts/seed-section-questions.ts`

Agregar una entrada al diccionario `questionsBySection` con el `resource_id` como clave y las preguntas agrupadas por `sort_order` de la seccion.

### Estructura

```typescript
'{resource_id}': {
  // Section 0
  0: [
    {
      type: 'definition',  // 'definition' | 'fact' | 'property' | 'guarantee' | 'complexity' | 'comparison'
      question_text: '¿Pregunta en espanol?',
      expected_answer: 'Respuesta esperada detallada en espanol.',
      difficulty: 1,  // 1 | 2 | 3
    },
    // ... 2-4 preguntas por seccion
  ],
  // Section 1
  1: [
    // ...
  ],
  // ... una entrada por cada sort_order de seccion
},
```

### Distribucion recomendada
- **2-4 preguntas por seccion** (total 12-20 por recurso)
- Mix de tipos: `definition`, `fact`, `property`, `comparison`, `guarantee`, `complexity`
- Difficulty 1 para conceptos base, 2 para relaciones, 3 para critica/analisis
- Las preguntas deben ser respondibles DESPUES de leer la seccion (no triviales, no imposibles)

### Seedeo

```bash
npx tsx scripts/seed-section-questions.ts --resource {resource_id} --clear
```

### CRITICO: El `sort_order` en el diccionario DEBE coincidir con el `sort_order` de la seccion en Supabase (0, 1, 2, ...). Si no coincide, las preguntas no se insertaran.

---

## PASO 5: Reading Questions

### Archivo: `src/app/learn/[resourceId]/reading-questions.ts`

Agregar una entrada al objeto `READING_QUESTIONS`:

```typescript
'{resource_id}': [
  {
    type: 'why',
    question: '{Pregunta en espanol}',
    concept: '{Concepto evaluado}',
    hint: '{Pista opcional}',
  },
  // ... 6-7 preguntas total
],
```

### Distribucion (6-7 preguntas por recurso)

| Tipo | Cantidad | Proposito |
|------|----------|-----------|
| `why` | 2 | Justificacion fundamental del diseno |
| `tradeoff` | 2 | Reconocer compensaciones |
| `connection` | 1 | Vincular con otros capitulos/papers |
| `design_decision` | 1 | Aplicacion practica |
| `error_detection` | 1 | Eliminar misconceptions |

---

## PASO 6: Ejercicios Interactivos

### Archivo: `src/data/exercises/{resource-id}-exercises.ts`

### Tipos disponibles

```typescript
// SEQUENCE — Ordenar pasos de un proceso
{ type: 'sequence', steps: [...], correctOrder: [...] }

// LABEL — Etiquetar zonas en un diagrama SVG
{ type: 'label', svgViewBox: '0 0 600 400', zones: [...], labels: [...] }

// CONNECT — Conectar nodos relacionados
{ type: 'connect', nodes: [...], correctConnections: [...] }
```

### Distribucion: 3 ejercicios por recurso
1. SequenceExercise: Proceso central (4-5 pasos)
2. LabelExercise o ConnectExercise: Diagrama arquitectonico
3. SequenceExercise o ConnectExercise: Relaciones causales

### Criterios
- IDs: `{resource-id}.{N}` (e.g. `ddia-8.1`, `attention-paper.1`)
- Textos en espanol
- `conceptId` debe coincidir con IDs en tabla `concepts`

---

## PASO 7: Playground

### Directorio: `src/app/playground/{playground-name}/`

### Archivos (3 archivos por playground)

#### `page.tsx` — Server component, page wrapper
```tsx
import Link from 'next/link';
import { {Name}Playground } from './{name}-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function {Name}Page({ searchParams }: Props) {
  const { embed } = await searchParams;
  const isEmbed = embed === '1';

  return (
    <div className="h-screen flex flex-col bg-j-bg">
      {!isEmbed && (
        <header className="border-b border-j-border px-6 py-3 flex items-center justify-between shrink-0">
          {/* Back link + title + lesson guide toggle */}
        </header>
      )}
      <div className="flex-1 min-h-0 flex">
        <{Name}Playground />
      </div>
    </div>
  );
}
```

#### `{name}-playground.tsx` — Client component con la simulacion interactiva
- `'use client'` obligatorio
- Simulacion visual e interactiva del concepto central
- Controles del usuario (sliders, botones, toggles)
- Visualizacion en tiempo real de los efectos
- Metricas y estadisticas relevantes

#### `lesson-guide.tsx` — Panel lateral con teoria contextual
- Explicacion paso a paso de lo que el usuario esta viendo
- Relacionado con los conceptos del recurso

### Patrones existentes (copiar estructura de):
- `src/app/playground/consensus/` — Playground complejo con simulacion
- `src/app/playground/tail-latency/` — Playground de paper

---

## PASO 8: Verificacion

### Checklist final

```bash
# 1. TypeScript compila sin errores
npx tsc --noEmit

# 2. Verificar secciones en Supabase
npx tsx -e "
  const { createClient } = require('@supabase/supabase-js');
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const { data } = await s.from('resource_sections').select('id, section_title').eq('resource_id', '{resource_id}').order('sort_order');
  console.log(data);
"

# 3. Verificar quizzes
npx tsx -e "
  // similar query a inline_quizzes
"

# 4. Dev server funciona
npm run dev
# Abrir: http://localhost:3001/learn/{resource_id}
```

---

## RESUMEN: Archivos generados por recurso

| # | Paso | Archivo(s) | Destino |
|---|------|-----------|---------|
| 0 | DB Setup | `supabase/migrations/{ts}_{name}.sql` | Supabase (concepts, prerequisites) |
| 1 | Secciones | `scripts/output/{id}-resegmented.json` | Supabase via `seed-sections.ts` |
| 2 | Organizer | `src/app/learn/[resourceId]/{name}.tsx` | Componente React |
| 3 | Rutas | `src/app/learn/[resourceId]/page.tsx` | Editar 3 bloques |
| 4 | Quizzes | `scripts/seed-inline-quizzes-{id}.ts` | Supabase via script |
| 4b | Section Questions | `scripts/seed-section-questions.ts` | Supabase via script (agregar entrada al diccionario) |
| 5 | Questions | `src/app/learn/[resourceId]/reading-questions.ts` | Agregar entrada |
| 6 | Exercises | `src/data/exercises/{id}-exercises.ts` | Archivo TypeScript |
| 7 | Playground | `src/app/playground/{name}/` (3 archivos) | Directorio nuevo |

---

## Concept IDs existentes

### Phase 1 — Distributed Systems
```
reliability, scalability, maintainability, slos-slis,
data-models, relational-vs-document, graph-models,
storage-engines, oltp-vs-olap, column-storage,
replication, replication-lag, multi-leader, leaderless,
partitioning, secondary-indexes, rebalancing, request-routing,
distributed-failures, unreliable-networks, unreliable-clocks, knowledge-truth,
consistency-models, ordering, consensus,
stream-processing, databases-streams, processing-streams
```

### Phase 2+ — ML/AI Papers
```
attention-mechanism, transformer-architecture, positional-encoding, multi-head-attention,
scaling-laws, compute-optimal-training, power-law-loss,
tail-latency, hedged-requests, fan-out-latency
```

---

## EJECUCION PARALELA

Para maximizar velocidad, ejecutar en paralelo:
- **Grupo A** (independientes): Paso 1 (secciones) + Paso 2 (advance organizer) + Paso 7 (playground)
- **Grupo B** (depende de Paso 1): Paso 4 (inline quizzes) — necesita section_titles exactos
- **Grupo C** (independientes): Paso 5 (reading questions) + Paso 6 (exercises)
- **Paso 3** (rutas): Se hace despues de Paso 2

Orden minimo:
```
[Paso 0] → [Paso 1 + Paso 2 + Paso 5 + Paso 6 + Paso 7] → [Paso 3 + Paso 4] → [Paso 8]
```

---

## EJEMPLO COMPLETO: Agregar un paper nuevo

**Input:** "Genera contenido para el paper 'Attention Is All You Need'"

1. `resource_id = 'attention-paper'`
2. Crear conceptos: `attention-mechanism`, `multi-head-attention`, `transformer-architecture`, `positional-encoding`
3. Generar 5 secciones de ~8000 chars → `scripts/output/attention-resegmented.json`
4. Crear `src/app/learn/[resourceId]/attention-paper.tsx` con 5 secciones numeradas + mnemotecnico
5. Registrar en `page.tsx`: import, PRACTICAL_ROUTES, EXPLANATION_COMPONENTS
6. Crear `scripts/seed-inline-quizzes-attention.ts` con 13 quizzes (MC/TF/MC2)
7. Agregar 7 reading questions a `reading-questions.ts`
8. Crear `src/data/exercises/attention-paper-exercises.ts` con 3 ejercicios
9. Crear `src/app/playground/attention/` con page.tsx + playground + lesson-guide
10. Seedear: `npx tsx scripts/seed-sections.ts --from-file ...` + `npx tsx scripts/seed-inline-quizzes-attention.ts`
11. Verificar: `npx tsc --noEmit` + abrir `/learn/attention-paper`
