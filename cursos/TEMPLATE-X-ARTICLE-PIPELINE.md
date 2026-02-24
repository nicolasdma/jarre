# Pipeline: X Article → Jarre Learning System

## Instrucciones

Cuando recibas un link de X (Twitter), ejecuta este pipeline completo para generar los 5 artefactos del sistema Jarre. **No pidas confirmación, ejecuta todo de una.**

---

## Paso 1: Extraer contenido del artículo

1. Intentar `https://publish.twitter.com/oembed?url={LINK}` para obtener el texto
2. Si el tweet solo contiene un link `t.co`, seguir la redirección:
   - Si redirige a un blog externo (blog.langchain.com, medium.com, etc.) → hacer WebFetch al blog
   - Si redirige a `x.com/i/article/...` → es un X Article, NO se puede extraer programáticamente
3. Buscar con WebSearch: `{autor} {keywords del tweet}` para encontrar el contenido completo
4. Si no se puede extraer → pedir al usuario que pegue el contenido

**Objetivo:** obtener el texto completo del artículo, incluyendo secciones, diagramas descritos, código, y links.

---

## Paso 2: Clasificar en la currícula

Determinar dónde encaja el artículo en las 6 fases:

| Fase | Área | Concept IDs disponibles |
|------|------|------------------------|
| **1** | Distributed Systems | reliability, scalability, maintainability, data-models, storage-engines, replication, partitioning, distributed-failures, consistency-models, consensus, stream-processing, slos-slis, monitoring, tail-latency |
| **2** | LLMs & Agents | attention-mechanism, transformer-architecture, scaling-laws, foundation-models, react-pattern, chain-of-thought, tree-of-thoughts, reflexion, tool-use, plan-and-execute, prompt-engineering, structured-output, test-time-compute, reasoning-models |
| **3** | RAG & Memory | rag-basics, embeddings, vector-search, chunking-strategies, lost-in-middle, context-window-limits, external-memory, hybrid-search, memory-management |
| **4** | Safety & Evaluation | constitutional-ai, self-consistency, offline-evaluation, online-evaluation, red-teaming, output-validation, prompt-injection, llm-security-owasp |
| **5** | Inference & Economics | kv-cache, batching-inference, paged-attention, quantization, token-economics, model-routing, semantic-caching, prompt-caching, llm-observability, compound-ai-systems |
| **6** | Framework Critique | langchain-architecture, llamaindex-architecture, framework-tradeoffs, minimal-implementations, dspy-programming |

Asignar:
- **Resource ID**: `{keyword-slug}` (e.g. `agent-sandbox-patterns`, `clawvault-agent-memory`)
- **Concept IDs primarios**: 2-3 conceptos existentes que mejor mapean al contenido
- **Fase**: La fase donde encaja

---

## Paso 3: Lanzar 5 agentes en paralelo

Usar el tool `Task` con `subagent_type: "general-purpose"` y `run_in_background: true` para los 5 artefactos **simultáneamente**. Cada agente recibe el contenido completo del artículo + el formato exacto a seguir.

### Agente 1: Pre-Lectura

**Archivo:** `cursos/{resource-id}-pre-lectura.md`

```markdown
# {Título del Recurso}
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** {YYYY-MM-DD}
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el material.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: {El Problema Fundamental}
{Explicación con analogía}
{Diagrama ASCII}
> **Punto clave**

---

## Concepto 2-N: {Componentes progresivos}
...

## Resumen Visual
{Diagrama ASCII tipo árbol con relaciones}

## Términos Clave (Inglés → Español)
| Inglés | Español | Qué es |
|--------|---------|--------|

## Preguntas de Comprensión (Auto-evaluación)
1-12 preguntas
```

**Requisitos:**
- 5-8 conceptos progresivos (de fundamental a síntesis)
- 3-5 diagramas ASCII mínimo
- 1-2 tablas comparativas para trade-offs centrales
- 10-15 términos clave con traducciones EN→ES
- 8-12 preguntas de auto-evaluación
- 200-400 líneas de contenido
- Todo en español, términos técnicos en inglés preservados
- Profundidad de nivel senior engineer

---

### Agente 2: Reading Questions

**Archivo:** `src/data/{resource-id}-reading-questions.ts`

```typescript
import { ReadingQuestion } from '@/types';

export const {camelCaseId}Questions: ReadingQuestion[] = [
  {
    type: 'why',
    question: '...',
    concept: '...',
    hint: '...',
  },
];
```

**Tipos disponibles:** `'tradeoff' | 'why' | 'connection' | 'error_detection' | 'design_decision'`

**Distribución (6-7 preguntas):**
- 2 `why` — justificación fundamental
- 2 `tradeoff` — reconocer compensaciones
- 1 `connection` — vincular con otros conceptos/fases
- 1 `design_decision` — aplicación práctica
- 1 `error_detection` — misconception plausible pero falsa

**Criterios:**
- Preguntas en español, conceptos técnicos en inglés
- Hints que guían sin revelar la respuesta
- Cada pregunta requiere comprensión profunda, no memoria
- Las de `connection` deben vincular a conceptos específicos de otras fases
- Las de `error_detection` deben presentar una afirmación falsa plausible

---

### Agente 3: Ejercicios Interactivos

**Archivo:** `src/data/exercises/{resource-id}-exercises.ts`

```typescript
import type { SequenceExercise, ConnectExercise, LabelExercise } from '@/types';

export const exercise1: SequenceExercise = {
  id: '{resource-id}.1',
  type: 'sequence',
  title: '...',
  instructions: '...',
  conceptId: '{concept-id}',
  steps: [
    { id: 's1', text: '...' },
    // 4-6 pasos
  ],
  correctOrder: ['s1', 's2', ...],
};

export const exercise2: ConnectExercise = {
  id: '{resource-id}.2',
  type: 'connect',
  title: '...',
  instructions: '...',
  conceptId: '{concept-id}',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'n1', label: '...', x: 100, y: 80 },
  ],
  correctConnections: [['n1', 'n2']],
};

export const exercise3: LabelExercise = {
  id: '{resource-id}.3',
  type: 'label',
  title: '...',
  instructions: '...',
  conceptId: '{concept-id}',
  svgViewBox: '0 0 600 400',
  svgElements: `<!-- SVG elements -->`,
  zones: [
    { id: 'z1', x: 70, y: 88, width: 140, height: 34, correctLabel: '...' },
  ],
  labels: ['...'],
};

export const {camelCaseId}Exercises = [exercise1, exercise2, exercise3];
```

**Distribución (3 ejercicios):**
1. **SequenceExercise**: Proceso central del artículo (4-6 pasos inequívocos)
2. **ConnectExercise**: Relacionar conceptos/componentes (nodos en dos columnas)
3. **LabelExercise**: Diagrama arquitectónico del artículo con zonas etiquetables

**Criterios:**
- IDs: `{resource-id}.{N}` (e.g. `agent-sandbox.1`)
- Textos en español
- SVG usa CSS variables: `var(--j-border)`, `var(--j-accent)`, `var(--j-warm)`
- Cada ejercicio refuerza un concepto diferente
- Steps deben ser inequívocos en su orden correcto

---

### Agente 4: Inline Quizzes

**Archivo:** `src/data/{resource-id}-inline-quizzes.ts`

```typescript
export interface InlineQuiz {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options?: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  academicReference?: string;
}

export const {camelCaseId}Quizzes: InlineQuiz[] = [
  // ...
];
```

**Distribución:**
- 2-3 quizzes por sección del artículo (total ~15-20)
- Mix: ~50% MC (4 opciones A-D), ~30% TF, ~20% MC2 (múltiples correctas)
- Progresión de dificultad dentro de cada sección

**Criterios:**
- Preguntas y opciones en español
- Explicaciones detalladas que enseñan el por qué
- Opciones MC plausibles, las incorrectas representan misconceptions reales
- `academicReference` apunta a la fuente (e.g. "Chase, LangChain Blog 2026")

---

### Agente 5: Question Bank

**Archivo:** `src/data/{resource-id}-question-bank.ts`

```typescript
export interface QuestionBankEntry {
  concept_id: string;
  type: 'definition' | 'fact' | 'property' | 'guarantee' | 'complexity' |
        'comparison' | 'scenario' | 'limitation' | 'error_spot';
  format: 'open' | 'mc' | 'tf';
  question_text: string;
  expected_answer: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  explanation?: string;
  difficulty: 1 | 2 | 3;
  related_concept_id?: string;
}

export const {camelCaseId}Questions: QuestionBankEntry[] = [
  // ...
];
```

**Distribución (15-25 preguntas):**
- 3-5 `definition` (nivel 1)
- 3-5 `fact`/`property` (nivel 1-2)
- 2-3 `comparison` (nivel 2)
- 2-3 `scenario` (nivel 2-3)
- 1-2 `limitation` (nivel 3)
- 1-2 `error_spot` (nivel 3)

**Distribución por dificultad:**
- Nivel 1 (40%): Conceptos base, definiciones, hechos
- Nivel 2 (40%): Aplicación, comparaciones, trade-offs
- Nivel 3 (20%): Limitaciones, escenarios complejos, error detection

**Criterios:**
- Preguntas en español, términos técnicos en inglés
- `expected_answer` para open: respuesta completa de referencia (2-4 oraciones)
- `related_concept_id` cuando la pregunta cruza conceptos
- Nivel 3 requiere razonamiento multi-paso
- Formatos: mayoría `open`, algunos `mc` para facts, algunos `tf` para guarantees

---

## Paso 4: Crear ACTIVATE Component + PLAYGROUND (OBLIGATORIO)

**CRÍTICO:** Sin estos, el flujo ACTIVATE → LEARN → APPLY queda roto. El usuario verá "Explicación no disponible" y no tendrá playground.

### 4.1: ACTIVATE Component (Advance Organizer)

Crear `src/app/learn/[resourceId]/{resource-id}.tsx` — un componente React Server Component (sin 'use client') que sirve como organizador previo visual.

**Patrón a seguir:** `src/app/learn/[resourceId]/ddia-ch1.tsx` o `ddia-ch6.tsx`

**Estructura obligatoria:**
```tsx
export function {PascalCaseId}() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero: badge + título + subtítulo + tesis */}
      {/* Visual overview del tema */}
      {/* Secciones numeradas (01, 02, ...) con: */}
      {/*   - Analogías con corner brackets */}
      {/*   - Diagramas en CSS/JSX (NO ASCII art) */}
      {/*   - Insight callouts (border-l-2 border-[#059669]) */}
      {/*   - Tablas comparativas si hay trade-offs */}
      {/* Pregunta de reflexión final */}
    </article>
  );
}
```

**Registrar en `src/app/learn/[resourceId]/page.tsx`:**
1. Import: `import { {PascalCaseId} } from './{resource-id}';`
2. Agregar a `EXPLANATION_COMPONENTS`: `'{resource-id}': () => <{PascalCaseId} />,`

### 4.2: PLAYGROUND Page (Interactive)

Crear dos archivos:
- `src/app/playground/{playground-slug}/page.tsx` — Server page con header + embed support
- `src/app/playground/{playground-slug}/{name}-playground.tsx` — 'use client' interactive component

**Patrón a seguir:** `src/app/playground/attention/` o `src/app/playground/replication-lab/`

El playground debe ser **interactivo y educativo**, no estático. Incluir:
- Visualizaciones de la arquitectura del artículo
- Toggles/selects para comparar opciones/patrones
- Simuladores que muestren trade-offs en acción
- Diagrama SVG interactivo si aplica

**Registrar en `src/app/learn/[resourceId]/page.tsx`:**
- Agregar a `PRACTICAL_ROUTES`: `'{resource-id}': { label: 'Playground', href: '/playground/{playground-slug}' },`

### 4.3: Registrar ejercicios

En `src/lib/exercises/registry.ts`:
1. Import: `import { {camelCaseId}Exercises } from '@/data/exercises/{resource-id}-exercises';`
2. Agregar al array: `...{camelCaseId}Exercises,`

### 4.4: Verificar archivos

Verificar que **todos** los archivos existen:
```
cursos/{resource-id}-pre-lectura.md
src/data/{resource-id}-reading-questions.ts
src/data/exercises/{resource-id}-exercises.ts
src/data/{resource-id}-inline-quizzes.ts
src/data/{resource-id}-question-bank.ts
src/app/learn/[resourceId]/{resource-id}.tsx          ← ACTIVATE
src/app/playground/{slug}/page.tsx                     ← PLAYGROUND page
src/app/playground/{slug}/{name}-playground.tsx         ← PLAYGROUND component
```

Verificar compilación: `npx tsc --noEmit` debe pasar sin errores.

---

## Paso 5: Integrar en Supabase (OBLIGATORIO)

**CRÍTICO:** Sin este paso, el contenido NO aparece en /library. Los archivos solos no sirven.

### 5.1: Agregar resource a seed-data.ts

Abrir `scripts/seed-data.ts` y agregar el resource al array `resources` en la fase correspondiente:

```typescript
{
  id: '{resource-id}',
  title: '{Título completo del artículo}',
  type: 'article',
  url: '{URL original del artículo}',
  author: '{Autor}',
  phase: {N},
  description: '{Descripción de 1-2 líneas}',
  estimatedHours: 1,
  sortOrder: {NNN},  // Revisar el último sortOrder de la fase y usar el siguiente
  concepts: ['{concept-id-1}', '{concept-id-2}'],
  prerequisites: ['{prerequisite-concept}'],
},
```

### 5.2: Agregar article a seed-articles.ts

Abrir `scripts/seed-articles.ts` y agregar un nuevo entry al array `ARTICLES`:

```typescript
{
  resourceId: '{resource-id}',
  preLecturaPath: resolve(__dirname, '../cursos/{resource-id}-pre-lectura.md'),
  sections: [
    {
      sectionTitle: '{Título de sección 1}',  // DEBE coincidir con sectionTitle en inline quizzes
      conceptId: '{concept-id}',
      conceptNumbers: [1],  // Números de concepto del pre-lectura a incluir
    },
    // ... más secciones
  ],
  quizzes: [],  // Se cargan dinámicamente del archivo de inline quizzes
},
```

**IMPORTANTE:** Los `sectionTitle` aquí DEBEN coincidir exactamente con los `sectionTitle` usados en el archivo de inline quizzes. De lo contrario, los quizzes no se mapean a las secciones.

### 5.3: Agregar la carga dinámica de quizzes

En la función `loadQuizzes()` de `scripts/seed-articles.ts`, agregar un nuevo case:

```typescript
if (resourceId === '{resource-id}') {
  const mod = await import('../src/data/{resource-id}-inline-quizzes');
  return mod.{camelCaseId}Quizzes.map((q) => ({
    sectionTitle: q.sectionTitle,
    positionAfterHeading: q.positionAfterHeading,
    sortOrder: q.sortOrder,
    format: q.format as 'mc' | 'tf' | 'mc2',
    questionText: q.questionText,
    options: q.options ?? null,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));
}
```

### 5.4: Ejecutar los seeds

```bash
# 1. Seedear resources y concepts (idempotente, usa upsert)
npx tsx scripts/seed-database.ts

# 2. Seedear secciones e inline quizzes del artículo
npx tsx scripts/seed-articles.ts
```

### 5.5: Verificar en la UI

Ir a `http://localhost:3001/library` y confirmar que el recurso aparece en la fase correcta. Ir a `/learn/{resource-id}` y confirmar que las secciones y quizzes se renderizan.

---

## Paso 7: Reportar resultado

Mostrar tabla resumen con:
- Nombre del recurso y autor
- Fase y concept IDs asignados
- Los 8 archivos generados (5 contenido + ACTIVATE + 2 playground) con conteo de líneas
- Confirmación de integración en Supabase (sections + quizzes insertados)
- Confirmación de que ACTIVATE y PLAYGROUND están registrados y el build pasa
- Cualquier nota técnica relevante

---

## Reglas generales

- **Idioma:** Todo en español. Términos técnicos en inglés preservados.
- **Profundidad:** Senior engineer. No tutoriales básicos.
- **Paralelismo:** SIEMPRE lanzar los 5 agentes de contenido + ACTIVATE + PLAYGROUND simultáneamente (8 archivos total).
- **Si hay múltiples links:** Lanzar pipelines en paralelo para cada uno.
- **No pedir confirmación** entre pasos. Ejecutar el pipeline completo de una.
- **concept_id** debe ser uno existente de la tabla de la currícula (Paso 2).
- **SIEMPRE integrar en Supabase** (Paso 5). Sin integración, el contenido no existe en la UI.
- **SIEMPRE crear ACTIVATE + PLAYGROUND** (Paso 4). Sin ellos, el flujo de aprendizaje queda roto.
- **SIEMPRE registrar ejercicios** en `src/lib/exercises/registry.ts`.
- **SIEMPRE verificar build** con `npx tsc --noEmit` antes de reportar.
