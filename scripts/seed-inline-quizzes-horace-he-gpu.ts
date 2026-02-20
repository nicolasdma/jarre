/**
 * Seed inline quizzes for "Making Deep Learning Go Brrrr From First Principles"
 *
 * 12 quizzes across 4 sections (mc, tf, mc2 mix).
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-horace-he-gpu.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'p2-horace-he-gpu';

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
  // Section 0: Los Tres Regímenes
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Los Tres Regímenes: Compute, Memory y Overhead',
    positionAfterHeading: '¿Por qué el foco en maximizar compute?',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué el artículo recomienda enfocarse en maximizar compute utilization en lugar de minimizar memory bandwidth?',
    options: [
      { label: 'A', text: 'Porque compute es siempre el cuello de botella más grande' },
      { label: 'B', text: 'Porque puedes reducir overhead y memory costs, pero no puedes reducir el cómputo requerido sin cambiar las operaciones' },
      { label: 'C', text: 'Porque memory bandwidth es irrelevante en GPUs modernas' },
      { label: 'D', text: 'Porque los Tensor Cores eliminan los problemas de memory bandwidth' },
    ],
    correctAnswer: 'B',
    explanation: 'El cómputo requerido es determinado por las operaciones del modelo — no puedes reducirlo sin cambiar las operaciones. Pero sí puedes reducir overhead (tracing) y memory costs (fusion). Por eso el objetivo es maximizar el tiempo dedicado a compute útil.',
  },
  {
    sectionTitle: 'Los Tres Regímenes: Compute, Memory y Overhead',
    positionAfterHeading: 'Tensor Cores: Hardware especializado para matmul',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En un A100, si no estás haciendo multiplicación de matrices, solo puedes alcanzar 19.5 TF en lugar de los 312 TF anunciados, porque los Tensor Cores solo aceleran operaciones de matmul.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Los 312 TF del A100 son con Tensor Cores, que solo aceleran matrix multiplication. Para operaciones generales (pointwise, reductions, etc.) la GPU solo ofrece 19.5 TF — una diferencia de 16x.',
  },
  {
    sectionTitle: 'Los Tres Regímenes: Compute, Memory y Overhead',
    positionAfterHeading: 'Tensor Cores: Hardware especializado para matmul',
    sortOrder: 2,
    format: 'mc',
    questionText: 'Según la tabla de FLOPS de BERT, ¿qué porcentaje de los FLOPS totales representan las operaciones que NO son matmul (normalización + pointwise)?',
    options: [
      { label: 'A', text: '~5% — una porción pequeña pero significativa' },
      { label: 'B', text: '~0.2% — prácticamente un error de redondeo' },
      { label: 'C', text: '~15% — suficiente para importar en optimización' },
      { label: 'D', text: '~50% — la mitad del cómputo no es matmul' },
    ],
    correctAnswer: 'B',
    explanation: 'Los ops de normalización y pointwise juntos representan solo 0.2% de los FLOPS totales en BERT. A pesar de esto, consumen mucho más tiempo del esperado porque son memory-bound, alcanzando 250x-700x menos FLOPS que los matmuls.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Memory Bandwidth y Operator Fusion
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Memory Bandwidth y Operator Fusion',
    positionAfterHeading: 'La analogía del almacén',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En la analogía de la fábrica, ¿qué representa la DRAM y qué representa la SRAM?',
    options: [
      { label: 'A', text: 'DRAM = fábrica (compute), SRAM = almacén (storage)' },
      { label: 'B', text: 'DRAM = almacén (mucho espacio, lento), SRAM = fábrica (poco espacio, rápido)' },
      { label: 'C', text: 'DRAM = red de transporte, SRAM = inventario' },
      { label: 'D', text: 'DRAM y SRAM son intercambiables en la analogía' },
    ],
    correctAnswer: 'B',
    explanation: 'DRAM es el "almacén" — mucho espacio (~80 GB en A100, lo que ves en nvidia-smi) pero lento para acceder. SRAM son los registros y shared memory de la "fábrica" — muy rápidos pero escasos (~20 MB). Cada GPU kernel debe mover datos entre ambos.',
  },
  {
    sectionTitle: 'Memory Bandwidth y Operator Fusion',
    positionAfterHeading: 'Operator Fusion: la optimización más importante en deep learning',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Cuántos accesos a global memory se necesitan para `x.cos().cos()` sin fusión vs con fusión?',
    options: [
      { label: 'A', text: 'Sin fusión: 2, con fusión: 1' },
      { label: 'B', text: 'Sin fusión: 4, con fusión: 2' },
      { label: 'C', text: 'Sin fusión: 6, con fusión: 2' },
      { label: 'D', text: 'Sin fusión: 4, con fusión: 0' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin fusión: leer x, escribir x1 (2), luego leer x1, escribir x2 (2) = 4 accesos. Con fusión: leer x, escribir x2 = 2 accesos. La fusión elimina los 2 accesos intermedios, dando un speedup de ~2x.',
  },
  {
    sectionTitle: 'Memory Bandwidth y Operator Fusion',
    positionAfterHeading: 'Consecuencias sorprendentes de la fusión',
    sortOrder: 2,
    format: 'tf',
    questionText: 'Con operator fusion, gelu y relu tienen prácticamente el mismo costo de ejecución, a pesar de que gelu tiene muchas más operaciones matemáticas.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Cuando están fusionadas, ambas funciones de activación son memory-bound — el tiempo lo domina leer/escribir a global memory, no el cómputo. Las operaciones extra de gelu son "gratis" porque ocurren mientras los datos ya están en SRAM.',
  },

  // ────────────────────────────────────────────────
  // Section 2: Razonando sobre Memory Bandwidth
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Razonando sobre Memory Bandwidth: El Roofline Model',
    positionAfterHeading: 'Cálculos de primera mano',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Un A100 tiene 1.5 TB/s de memory bandwidth y 19.5 TF de compute general. Con floats de 32 bits (4 bytes), ¿cuántas operaciones por elemento necesitas para que compute > memory cost?',
    options: [
      { label: 'A', text: '~10 operaciones' },
      { label: 'B', text: '~50 operaciones' },
      { label: 'C', text: '~100 operaciones' },
      { label: 'D', text: '~1000 operaciones' },
    ],
    correctAnswer: 'C',
    explanation: 'Con 1.5 TB/s y 4 bytes/float, cargas ~400B números/segundo. Con leer+escribir son ~200B elementos efectivos/segundo. 19.5 TF / 200B ≈ 100 ops por elemento antes de que compute supere el costo de memoria.',
  },
  {
    sectionTitle: 'Razonando sobre Memory Bandwidth: El Roofline Model',
    positionAfterHeading: 'Los dos regímenes claramente visibles',
    sortOrder: 1,
    format: 'mc2',
    questionText: '¿Cuáles son observaciones correctas del microbenchmark en el artículo?',
    options: [
      { label: 'A', text: 'Con repeat < 32, el compute está mayormente idle y estamos memory-bound' },
      { label: 'B', text: 'El runtime aumenta significativamente con cada incremento de repeat' },
      { label: 'C', text: 'Con repeat > 64, alcanzamos cerca del pico de FLOPS (compute-bound)' },
      { label: 'D', text: 'El memory bandwidth alcanzado cae a medida que la compute intensity crece' },
    ],
    correctAnswer: '[A,C,D]',
    justificationHint: 'El runtime NO aumenta significativamente hasta repeat ≈ 64 — ese es el punto clave del microbenchmark.',
    explanation: 'El runtime permanece casi constante hasta repeat=64 porque estamos memory-bound (el bottleneck es la transferencia, no el cómputo). Solo cuando compute intensity supera ~64 el runtime empieza a crecer, señalando que pasamos a compute-bound.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Overhead y Diagnóstico
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Overhead, Diagnóstico y Soluciones por Régimen',
    positionAfterHeading: 'La escala del problema',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En el tiempo que Python ejecuta un solo FLOP, ¿cuántos FLOPS puede ejecutar un A100?',
    options: [
      { label: 'A', text: '~1,000 FLOPS' },
      { label: 'B', text: '~100,000 FLOPS' },
      { label: 'C', text: '~9.75 millones de FLOPS' },
      { label: 'D', text: '~312 millones de FLOPS' },
    ],
    correctAnswer: 'C',
    explanation: 'Python hace ~32M adiciones/segundo. Un A100 hace 312 TF/segundo. 312T / 32M ≈ 9.75M. En el tiempo de un FLOP de Python, el A100 podría haber hecho 9.75 millones de operaciones.',
  },
  {
    sectionTitle: 'Overhead, Diagnóstico y Soluciones por Régimen',
    positionAfterHeading: 'Ejecución asíncrona: cómo PyTorch esconde el overhead',
    sortOrder: 1,
    format: 'tf',
    questionText: 'PyTorch puede ocultar la mayoría del overhead de Python y del framework porque ejecuta CUDA kernels asincrónicamente — mientras la GPU procesa un kernel, la CPU puede encolar los siguientes.',
    options: null,
    correctAnswer: 'true',
    explanation: 'La ejecución asíncrona permite que la CPU "corra adelante" de la GPU. Mientras los GPU operators sean suficientemente grandes, la CPU puede encolar trabajo más rápido de lo que la GPU lo consume, ocultando todo el overhead. Solo falla con operators muy pequeños.',
  },
  {
    sectionTitle: 'Overhead, Diagnóstico y Soluciones por Régimen',
    positionAfterHeading: '¿Cómo detectar si estás overhead-bound?',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Cuál es la forma más rápida de detectar si tu modelo está overhead-bound?',
    options: [
      { label: 'A', text: 'Medir los FLOPS alcanzados como porcentaje del pico' },
      { label: 'B', text: 'Duplicar el batch size y ver si el runtime crece proporcionalmente' },
      { label: 'C', text: 'Reescribir el modelo en C++ y comparar' },
      { label: 'D', text: 'Reducir el número de capas y medir la diferencia' },
    ],
    correctAnswer: 'B',
    explanation: 'El overhead no escala con el tamaño del problema (compute y memory sí). Si duplicas el batch size y el runtime solo crece ~10% en vez de ~100%, estás overhead-bound. También puedes usar PyTorch profiler o GPU-Util en nvidia-smi.',
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
