/**
 * Seed inline quizzes for "How to Train Really Large Models on Many GPUs?"
 *
 * 15 quizzes across 5 sections (mc, tf, mc2 mix).
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-lilian-weng-distributed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'p2-lilian-weng-distributed';

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
  // ────────────────────────────────────────────────
  // Section 0: Data Parallelism y Sincronización de Gradientes
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Data Parallelism y Sincronización de Gradientes',
    positionAfterHeading: 'El mecanismo básico de Data Parallelism',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es la operación clave que sincroniza gradientes entre GPUs en Data Parallelism?',
    options: [
      { label: 'A', text: 'Broadcast — un nodo envía sus gradientes a todos los demás' },
      { label: 'B', text: 'AllReduce — todos los nodos suman/promedian gradientes y cada uno recibe el resultado' },
      { label: 'C', text: 'Scatter — cada nodo envía un fragmento diferente a cada otro nodo' },
      { label: 'D', text: 'Gather — un nodo central recibe todos los gradientes' },
    ],
    correctAnswer: 'B',
    explanation: 'AllReduce suma (o promedia) un tensor distribuido entre todos los nodos y deja el resultado en cada uno. Es la operación fundamental de DP porque cada GPU necesita el gradiente promediado completo.',
  },
  {
    sectionTitle: 'Data Parallelism y Sincronización de Gradientes',
    positionAfterHeading: 'Bulk Synchronous Parallel (BSP) vs Asynchronous Parallel (ASP)',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En ASP (Asynchronous Parallel), los workers pueden calcular gradientes usando pesos que ya fueron modificados por otros workers, un problema llamado weight staleness.',
    options: null,
    correctAnswer: 'true',
    explanation: 'En ASP, no hay barrera de sincronización. Un worker puede estar calculando gradientes con pesos de la iteración N mientras otro ya actualizó los pesos a la iteración N+3. Los gradientes resultantes son "stale" — basados en información obsoleta.',
  },
  {
    sectionTitle: 'Data Parallelism y Sincronización de Gradientes',
    positionAfterHeading: 'PyTorch Distributed Data Parallel (DDP)',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son optimizaciones de PyTorch DDP para reducir el overhead de comunicación?',
    options: [
      { label: 'A', text: 'Gradient bucketing — agrupa gradientes para hacer menos AllReduces con payloads más grandes' },
      { label: 'B', text: 'Overlap — inicia AllReduce de un bucket antes de que termine todo el backward pass' },
      { label: 'C', text: 'Weight sharing — comparte pesos entre workers en lugar de replicarlos' },
      { label: 'D', text: 'Ring AllReduce — distribuye la comunicación uniformemente sin cuello de botella central' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'DDP replica el modelo completo en cada GPU — no comparte pesos. Eso sería ZeRO Stage 3.',
    explanation: 'DDP usa bucketing para amortizar latencia, overlap para solapar comunicación con cómputo, y Ring AllReduce para distribuir uniformemente la carga de red. Weight sharing NO es parte de DDP.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Model Parallelism y Pipeline Parallelism
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Model Parallelism y Pipeline Parallelism',
    positionAfterHeading: 'Naive Model Parallelism (vertical split)',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el problema principal del naive model parallelism (dividir capas verticalmente entre GPUs)?',
    options: [
      { label: 'A', text: 'Consume más memoria que data parallelism' },
      { label: 'B', text: 'Solo una GPU está activa a la vez, creando computation bubbles' },
      { label: 'C', text: 'Requiere que todas las capas tengan el mismo tamaño' },
      { label: 'D', text: 'No funciona con modelos de más de 10B parámetros' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin microbatches, las GPUs deben esperar secuencialmente: GPU-0 procesa → pasa a GPU-1 → GPU-0 espera → GPU-1 procesa → etc. Con 4 GPUs, cada una está activa solo ~25% del tiempo.',
  },
  {
    sectionTitle: 'Model Parallelism y Pipeline Parallelism',
    positionAfterHeading: 'GPipe (Google, 2019)',
    sortOrder: 1,
    format: 'mc',
    questionText: 'En GPipe con d=4 stages y m=16 microbatches, ¿cuál es la fracción de tiempo desperdiciada en bubbles?',
    options: [
      { label: 'A', text: '~5% — (4-1)/(16+4-1) ≈ 0.16' },
      { label: 'B', text: '~16% — (4-1)/(16+4-1) ≈ 0.16' },
      { label: 'C', text: '~25% — (4-1)/(4×4) ≈ 0.19' },
      { label: 'D', text: '~50% — la mitad del tiempo son bubbles' },
    ],
    correctAnswer: 'B',
    explanation: 'bubble_fraction = (d-1)/(m+d-1) = 3/19 ≈ 15.8%. Con la recomendación de m ≥ 4d, el overhead de bubbles se mantiene por debajo del 25%.',
  },
  {
    sectionTitle: 'Model Parallelism y Pipeline Parallelism',
    positionAfterHeading: 'PipeDream (Microsoft, 2019)',
    sortOrder: 2,
    format: 'tf',
    questionText: 'PipeDream usa "weight stashing" porque en el schedule 1F1B, el forward y backward de un mismo microbatch pueden ejecutarse con versiones diferentes de los pesos.',
    options: null,
    correctAnswer: 'true',
    explanation: 'En 1F1B, una GPU puede haber actualizado sus pesos entre el forward y el backward de un microbatch. Weight stashing almacena la versión de pesos usada en el forward para reutilizarla en el backward, garantizando consistencia.',
  },

  // ────────────────────────────────────────────────
  // Section 2: Tensor Parallelism y Paralelismo Híbrido
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Tensor Parallelism y Paralelismo Híbrido',
    positionAfterHeading: 'Megatron-LM: Tensor Parallelism para Transformers',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cómo divide Megatron-LM el bloque de self-attention entre GPUs?',
    options: [
      { label: 'A', text: 'Divide la secuencia de entrada — cada GPU procesa una porción de los tokens' },
      { label: 'B', text: 'Divide las attention heads — cada GPU computa un subconjunto de heads completos' },
      { label: 'C', text: 'Replica el attention en cada GPU y solo divide el MLP' },
      { label: 'D', text: 'Cada GPU computa attention para una capa diferente' },
    ],
    correctAnswer: 'B',
    explanation: 'Multi-head attention se divide naturalmente por heads: si hay 8 heads y 8 GPUs, cada GPU computa 1 head completo con sus matrices Wq, Wk, Wv. Las proyecciones de salida se combinan con un AllReduce.',
  },
  {
    sectionTitle: 'Tensor Parallelism y Paralelismo Híbrido',
    positionAfterHeading: 'Comunicación en Tensor Parallelism',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Tensor Parallelism requiere comunicación de menor latencia que Pipeline Parallelism porque los AllReduce de TP ocurren dentro de cada capa y bloquean el cómputo de la siguiente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'TP hace AllReduce en la ruta crítica: la siguiente capa no puede iniciar hasta que el AllReduce de la capa actual termine. PP solo comunica activaciones en los boundaries entre stages, con más oportunidad de solapamiento.',
  },
  {
    sectionTitle: 'Tensor Parallelism y Paralelismo Híbrido',
    positionAfterHeading: 'PTD-P: Paralelismo Tridimensional',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son reglas prácticas para diseñar paralelismo 3D (PTD-P)?',
    options: [
      { label: 'A', text: 'TP grado = GPUs por nodo (típicamente 8), porque necesita NVLink' },
      { label: 'B', text: 'PP se usa entre nodos porque solo comunica activaciones de boundary' },
      { label: 'C', text: 'DP debería tener el grado más alto porque es lo más eficiente en comunicación' },
      { label: 'D', text: 'TP debería usarse entre nodos para maximizar el paralelismo dentro de cada capa' },
    ],
    correctAnswer: '[A,B]',
    justificationHint: 'TP requiere la máxima bandwidth (NVLink, dentro del nodo). DP necesita AllReduce de gradientes, que puede solaparse con cómputo pero no es "lo más eficiente".',
    explanation: 'TP dentro del nodo (NVLink) y PP entre nodos (InfiniBand) es el patrón estándar. DP usa el grado restante. TP entre nodos sería demasiado lento por la latencia de red.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Mixture-of-Experts (MoE)
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Mixture-of-Experts (MoE)',
    positionAfterHeading: 'El problema del load balancing',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué los modelos MoE necesitan un auxiliary loss para load balancing?',
    options: [
      { label: 'A', text: 'Para que los experts se entrenen con datos diversos y no se especialicen' },
      { label: 'B', text: 'Para evitar un feedback loop donde experts populares mejoran más y reciben aún más tokens' },
      { label: 'C', text: 'Para reducir el consumo de memoria de los experts menos usados' },
      { label: 'D', text: 'Para sincronizar los pesos entre experts durante el entrenamiento' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin auxiliary loss, el router desarrolla un self-reinforcing loop: experts que reciben más tokens se optimizan mejor, sus scores de gating suben, reciben aún más tokens, y los demás experts quedan sin entrenar.',
  },
  {
    sectionTitle: 'Mixture-of-Experts (MoE)',
    positionAfterHeading: 'Switch Transformer: Simplificación extrema',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Switch Transformer usa k=1 (un solo expert por token) lo que reduce la computación por token a la mitad comparado con top-2 routing.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Con top-2, cada token pasa por 2 experts. Con k=1, solo pasa por 1 expert, reduciendo el cómputo de la capa MoE a la mitad. Switch compensó con técnicas de estabilización (FP32 selectivo, inicialización reducida).',
  },
  {
    sectionTitle: 'Mixture-of-Experts (MoE)',
    positionAfterHeading: 'Expert Choice (EC) Routing',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son ventajas de Expert Choice routing sobre token choice routing?',
    options: [
      { label: 'A', text: 'Balance de carga perfecto: cada expert procesa exactamente k tokens' },
      { label: 'B', text: 'Tokens más informativos pueden ser seleccionados por múltiples experts' },
      { label: 'C', text: 'Funciona perfectamente con generación autoregresiva' },
      { label: 'D', text: 'Convergencia ~2x más rápida que top-1 y top-2 gating' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Expert Choice necesita ver todos los tokens del batch para seleccionar — esto es incompatible con generación autoregresiva donde los tokens futuros no existen aún.',
    explanation: 'Expert Choice logra balance perfecto y permite asignación heterogénea de cómputo, con convergencia 2x más rápida. Pero NO funciona con generación autoregresiva porque necesita ver todos los tokens del batch.',
  },

  // ────────────────────────────────────────────────
  // Section 4: Técnicas de Ahorro de Memoria
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Técnicas de Ahorro de Memoria',
    positionAfterHeading: 'Activation Recomputation (Gradient Checkpointing)',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Activation recomputation reduce la memoria de activaciones de O(ℓ) a O(√ℓ). ¿Cuál es el costo?',
    options: [
      { label: 'A', text: '~10% más de tiempo de cómputo' },
      { label: 'B', text: '~33% más de tiempo de cómputo (un forward pass extra por partición)' },
      { label: 'C', text: '~100% más de tiempo de cómputo (el doble de forward passes)' },
      { label: 'D', text: 'No tiene costo de cómputo adicional, solo complejidad de implementación' },
    ],
    correctAnswer: 'B',
    explanation: 'Activation recomputation descarta activaciones intermedias y las recalcula durante el backward pass. Esto requiere un forward pass adicional por partición, lo que típicamente incrementa el tiempo total en ~33%.',
  },
  {
    sectionTitle: 'Técnicas de Ahorro de Memoria',
    positionAfterHeading: 'ZeRO: Zero Redundancy Optimizer',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Qué particiona ZeRO Stage 3 que Stage 1 y Stage 2 no particionan?',
    options: [
      { label: 'A', text: 'Las activaciones intermedias del forward pass' },
      { label: 'B', text: 'Los propios parámetros del modelo' },
      { label: 'C', text: 'Los datos de entrenamiento' },
      { label: 'D', text: 'Los buffers de comunicación' },
    ],
    correctAnswer: 'B',
    explanation: 'Stage 1 particiona optimizer states, Stage 2 añade gradientes, y Stage 3 añade los propios parámetros del modelo. En Stage 3, cada GPU solo almacena 1/N de los pesos y hace AllGather cuando necesita los demás.',
  },
];

async function main() {
  // 1. Fetch section IDs by title
  const { data: sections, error: fetchError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', RESOURCE_ID)
    .order('sort_order');

  if (fetchError || !sections) {
    console.error('Error fetching sections:', fetchError?.message);
    process.exit(1);
  }

  const titleToId = new Map(sections.map((s) => [s.section_title, s.id]));
  console.log(`Found ${sections.length} sections for ${RESOURCE_ID}`);

  // 2. Validate all section titles match
  for (const q of QUIZZES) {
    if (!titleToId.has(q.sectionTitle)) {
      console.error(`Section title not found: "${q.sectionTitle}"`);
      console.error('Available:', [...titleToId.keys()]);
      process.exit(1);
    }
  }

  // 3. Delete existing quizzes for these sections
  const sectionIds = [...titleToId.values()];
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error deleting existing quizzes:', deleteError.message);
    process.exit(1);
  }
  console.log('Cleared existing quizzes');

  // 4. Insert quizzes
  const rows = QUIZZES.map((q) => ({
    section_id: titleToId.get(q.sectionTitle),
    position_after_heading: q.positionAfterHeading,
    sort_order: q.sortOrder,
    format: q.format,
    question_text: q.questionText,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    justification_hint: q.justificationHint ?? null,
  }));

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} inline quizzes for ${RESOURCE_ID}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
