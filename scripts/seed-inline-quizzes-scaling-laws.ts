#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "Scaling Laws for Neural Language Models" paper sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-scaling-laws.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Quiz definitions — keyed by section_title (to resolve section_id at runtime)
// ============================================================================

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
  // ── Section 0: Power Laws en Deep Learning ──────────────────────────────

  {
    sectionTitle: 'Power Laws en Deep Learning',
    positionAfterHeading: 'Power Laws en Deep Learning',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué significa que la pérdida de un modelo de lenguaje siga una power law respecto al tamaño del modelo?',
    options: [
      { label: 'A', text: 'Que la pérdida disminuye linealmente al duplicar los parámetros' },
      { label: 'B', text: 'Que la pérdida sigue L(N) = aN^(-α), es decir, mejora de forma predecible pero con rendimientos decrecientes al escalar parámetros' },
      { label: 'C', text: 'Que la pérdida se reduce a cero cuando el modelo es suficientemente grande' },
      { label: 'D', text: 'Que modelos más grandes siempre son más eficientes en cómputo' },
    ],
    correctAnswer: 'B',
    explanation:
      'Una power law L(N) = aN^(-α) implica que al graficar log(L) vs log(N) se obtiene una línea recta. La pérdida mejora de forma predecible al escalar, pero cada duplicación de parámetros produce una mejora cada vez menor. No hay un punto donde la pérdida llegue a cero; se acerca asintóticamente a un valor irreducible.',
    justificationHint:
      'En escala log-log, la pendiente es -α. Si α ≈ 0.076 para parámetros, necesitas ~10x más parámetros para reducir la pérdida en un factor constante. ¿Qué implica esto para el costo de entrenar cada generación de modelos?',
  },
  {
    sectionTitle: 'Power Laws en Deep Learning',
    positionAfterHeading: 'Power Laws en Deep Learning',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Las leyes de escala dependen fuertemente de la arquitectura específica del Transformer (número de capas vs. ancho).',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Uno de los hallazgos más sorprendentes del paper es que la pérdida depende principalmente del NÚMERO TOTAL de parámetros (excluyendo embeddings), no de cómo se distribuyen entre profundidad (capas) y ancho (dimensión). Un modelo ancho y poco profundo y uno estrecho y profundo con el mismo número de parámetros alcanzan pérdida similar.',
  },

  // ── Section 1: Las Leyes de Escala ──────────────────────────────────────

  {
    sectionTitle: 'Las Leyes de Escala',
    positionAfterHeading: 'Las Leyes de Escala',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuáles son las tres variables principales que determinan la pérdida del modelo según las leyes de escala de Kaplan et al.?',
    options: [
      { label: 'A', text: 'Learning rate, batch size, número de épocas' },
      { label: 'B', text: 'Número de parámetros (N), tamaño del dataset (D), y presupuesto de cómputo (C)' },
      { label: 'C', text: 'Profundidad del modelo, ancho de las capas, número de cabezas de atención' },
      { label: 'D', text: 'Vocabulario, longitud de contexto, dimensión de embeddings' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las tres leyes de escala centrales son: L(N) para parámetros, L(D) para datos, y L(C) para cómputo. Cada una sigue una power law independiente cuando las otras variables no son el cuello de botella. El paper muestra que puedes predecir la pérdida de un modelo grande entrenando modelos pequeños y extrapolando.',
  },
  {
    sectionTitle: 'Las Leyes de Escala',
    positionAfterHeading: 'Las Leyes de Escala',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      'Si duplicas el presupuesto de cómputo, ¿cómo deberías distribuirlo según las leyes de escala originales de Kaplan et al.?',
    options: [
      { label: 'A', text: 'Invertir todo el cómputo extra en más datos de entrenamiento' },
      { label: 'B', text: 'La mayoría del cómputo extra debería ir a un modelo más grande, con un aumento menor en datos' },
      { label: 'C', text: 'Dividir equitativamente entre modelo más grande y más datos' },
      { label: 'D', text: 'Invertir todo el cómputo extra en más pasos de entrenamiento' },
    ],
    correctAnswer: 'B',
    explanation:
      'Kaplan et al. encontraron que al escalar cómputo, es más eficiente hacer el modelo más grande que entrenarlo más tiempo con más datos. Su recomendación original era escalar N (parámetros) más agresivamente que D (datos). Nota: Chinchilla (Hoffmann et al., 2022) revisó esta conclusión y sugirió que datos y parámetros deben escalarse en proporciones similares.',
    justificationHint:
      'Compara con Chinchilla: Kaplan sugería escalar N más rápido, pero Chinchilla demostró que el ratio óptimo es ~20 tokens por parámetro. GPT-3 (175B params, 300B tokens) estaba sub-entrenado; Chinchilla (70B params, 1.4T tokens) lo superó con menos parámetros.',
  },
  {
    sectionTitle: 'Las Leyes de Escala',
    positionAfterHeading: 'Las Leyes de Escala',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Las leyes de escala permiten predecir con exactitud la pérdida de un modelo de 100B de parámetros entrenando solo modelos de 10M de parámetros.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Este es uno de los resultados más prácticos del paper: la relación power law se mantiene sobre varios órdenes de magnitud. Puedes entrenar modelos pequeños (baratos), graficar la tendencia en escala log-log, y extrapolar cuánta pérdida tendrá un modelo mucho más grande. Esto permite tomar decisiones de inversión informadas antes de gastar millones en entrenamiento.',
  },

  // ── Section 2: Entrenamiento Compute-Optimal ────────────────────────────

  {
    sectionTitle: 'Entrenamiento Compute-Optimal',
    positionAfterHeading: 'Entrenamiento Compute-Optimal',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué significa que un modelo esté "compute-optimal" según el framework de las leyes de escala?',
    options: [
      { label: 'A', text: 'Que usa la GPU más eficiente disponible en el mercado' },
      { label: 'B', text: 'Que dado un presupuesto fijo de cómputo C, el tamaño del modelo N y los datos D están calibrados para minimizar la pérdida alcanzable con C' },
      { label: 'C', text: 'Que el modelo converge en el menor número de épocas posible' },
      { label: 'D', text: 'Que la implementación del modelo tiene zero overhead de cómputo' },
    ],
    correctAnswer: 'B',
    explanation:
      'Compute-optimal significa encontrar el sweet spot entre N y D para un presupuesto C fijo. Un modelo demasiado grande entrenado con pocos datos desperdicia cómputo (no converge). Un modelo demasiado pequeño entrenado mucho tiempo también lo desperdicia (la pérdida se satura). El óptimo equilibra ambas dimensiones.',
  },
  {
    sectionTitle: 'Entrenamiento Compute-Optimal',
    positionAfterHeading: 'Entrenamiento Compute-Optimal',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Qué descubrimiento clave sobre early stopping hacen los autores del paper?',
    options: [
      { label: 'A', text: 'Que early stopping es siempre perjudicial y debe evitarse' },
      { label: 'B', text: 'Que modelos más grandes alcanzan la misma pérdida que modelos pequeños en muchos menos pasos, haciendo que el entrenamiento parcial de modelos grandes sea más eficiente que el entrenamiento completo de modelos pequeños' },
      { label: 'C', text: 'Que early stopping solo funciona con datasets pequeños' },
      { label: 'D', text: 'Que early stopping produce modelos con peor generalización' },
    ],
    correctAnswer: 'B',
    explanation:
      'Este es un insight contra-intuitivo: es más eficiente entrenar un modelo GRANDE por pocas iteraciones que un modelo pequeño hasta convergencia. El modelo grande empieza con pérdida más baja (por su capacidad) y cada paso de entrenamiento lo mejora más rápido. Para un presupuesto de cómputo fijo, un modelo grande parcialmente entrenado supera a uno pequeño completamente entrenado.',
    justificationHint:
      'Imagina que tienes $1000 de GPU. ¿Es mejor entrenar un modelo de 1B parámetros por 1000 pasos o un modelo de 100M por 10,000 pasos? Las leyes de escala dicen que el modelo de 1B por 1000 pasos probablemente gane, porque su curva de aprendizaje empieza más abajo.',
  },

  // ── Section 3: Overfitting y Requisitos de Datos ────────────────────────

  {
    sectionTitle: 'Overfitting y Requisitos de Datos',
    positionAfterHeading: 'Overfitting y Requisitos de Datos',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Según las leyes de escala, duplicar el número de parámetros requiere duplicar el tamaño del dataset para evitar overfitting.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'La relación no es lineal. El paper muestra que la pérdida del test sigue L(N,D) ≈ [(N_c/N)^(α_N/α_D) + (D_c/D)]^α_D, donde los exponentes determinan cuántos datos necesitas al escalar el modelo. La relación exacta depende de los exponentes de las power laws y no es simplemente 1:1. Chinchilla posteriormente estimó ~20 tokens por parámetro como punto óptimo.',
  },
  {
    sectionTitle: 'Overfitting y Requisitos de Datos',
    positionAfterHeading: 'Overfitting y Requisitos de Datos',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Qué ocurre cuando entrenas un modelo grande con un dataset insuficientemente grande?',
    options: [
      { label: 'A', text: 'El modelo no aprende nada útil' },
      { label: 'B', text: 'La pérdida de entrenamiento sigue bajando pero la de test se estanca o empeora, desviándose de la power law ideal' },
      { label: 'C', text: 'El modelo colapsa y produce outputs aleatorios' },
      { label: 'D', text: 'La pérdida converge al mismo valor que un modelo más pequeño' },
    ],
    correctAnswer: 'B',
    explanation:
      'Con datos insuficientes, el modelo memoriza el training set en vez de generalizar. La pérdida de entrenamiento puede seguir bajando, pero la de test se desvía de la power law predicha. El gap entre train y test loss crece con la ratio N/D. Las leyes de escala permiten cuantificar cuánto gap esperar para cada combinación de N y D.',
  },

  // ── Section 4: Implicaciones Prácticas ──────────────────────────────────

  {
    sectionTitle: 'Implicaciones Prácticas',
    positionAfterHeading: 'Implicaciones Prácticas',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Por qué las leyes de escala son relevantes para la industria de AI más allá de la investigación académica?',
    options: [
      { label: 'A', text: 'Porque prueban que los modelos de lenguaje son inteligentes' },
      { label: 'B', text: 'Porque permiten estimar el costo y rendimiento de futuros modelos antes de invertir millones en entrenamiento' },
      { label: 'C', text: 'Porque demuestran que solo se necesitan modelos pequeños para todas las tareas' },
      { label: 'D', text: 'Porque eliminan la necesidad de experimentación empírica' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las leyes de escala transformaron la AI de "prueba y error" a "planificación predictiva". Un lab puede entrenar modelos de 10M, 100M, 1B parámetros, observar la tendencia de power law, y predecir cuánto costará (en cómputo, datos, dinero) alcanzar cierto nivel de rendimiento con un modelo de 100B+. Esto permite tomar decisiones de inversión de decenas de millones de dólares con evidencia cuantitativa.',
  },
  {
    sectionTitle: 'Implicaciones Prácticas',
    positionAfterHeading: 'Implicaciones Prácticas',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Las leyes de escala de Kaplan et al. han sido confirmadas sin correcciones significativas por toda la investigación posterior.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Chinchilla (Hoffmann et al., 2022) fue la corrección más importante: demostró que Kaplan subestimó la importancia de los datos. Mientras Kaplan sugería escalar parámetros más agresivamente que datos, Chinchilla mostró que deben escalarse en proporciones comparables (~20 tokens/parámetro). Esto implicó que modelos como GPT-3 estaban significativamente sub-entrenados en datos.',
    justificationHint:
      'GPT-3: 175B params, 300B tokens (~1.7 tokens/param). Chinchilla: 70B params, 1.4T tokens (~20 tokens/param). Chinchilla superó a GPT-3 con 2.5x menos parámetros. ¿Qué nos dice esto sobre la inversión óptima entre modelo y datos?',
  },
  {
    sectionTitle: 'Implicaciones Prácticas',
    positionAfterHeading: 'Implicaciones Prácticas',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Cuál es la limitación principal de las leyes de escala como herramienta predictiva?',
    options: [
      { label: 'A', text: 'Solo funcionan para modelos de lenguaje en inglés' },
      { label: 'B', text: 'Predicen la pérdida promedio (perplexity) pero no necesariamente el rendimiento en tareas downstream específicas o capacidades emergentes' },
      { label: 'C', text: 'Requieren GPUs específicas de NVIDIA para ser válidas' },
      { label: 'D', text: 'Solo son válidas para Transformers, no para otras arquitecturas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las leyes de escala predicen cross-entropy loss, que es una métrica promedio. Pero capacidades como razonamiento, seguir instrucciones, o few-shot learning pueden emerger abruptamente a ciertas escalas sin que la loss lo anticipe. Un modelo puede mejorar su loss continuamente pero adquirir habilidades cualitativamente nuevas solo al cruzar ciertos umbrales de escala.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching scaling-laws-paper section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'scaling-laws-paper')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for scaling-laws-paper. Seed sections first.');
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections:`);
  const titleToId = new Map<string, string>();
  for (const s of sections) {
    console.log(`  ${s.section_title} → ${s.id}`);
    titleToId.set(s.section_title, s.id);
  }

  // Clear existing quizzes for these sections
  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error clearing existing quizzes:', deleteError);
    process.exit(1);
  }

  console.log('\nCleared existing quizzes for scaling-laws-paper sections.');

  // Resolve section IDs and insert quizzes
  const toInsert = [];
  let skipped = 0;

  for (const quiz of QUIZZES) {
    const sectionId = titleToId.get(quiz.sectionTitle);
    if (!sectionId) {
      console.warn(`  Warning: No section found for "${quiz.sectionTitle}", skipping.`);
      skipped++;
      continue;
    }

    toInsert.push({
      section_id: sectionId,
      position_after_heading: quiz.positionAfterHeading,
      sort_order: quiz.sortOrder,
      format: quiz.format,
      question_text: quiz.questionText,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      explanation: quiz.explanation,
      justification_hint: quiz.justificationHint ?? null,
      is_active: true,
    });
  }

  if (toInsert.length === 0) {
    console.error('No quizzes to insert. Check section title matching.');
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(toInsert);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError);
    process.exit(1);
  }

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for Scaling Laws paper`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

  // Summary by section
  const countBySection = new Map<string, number>();
  const formatCount = { mc: 0, tf: 0, mc2: 0 };
  for (const q of toInsert) {
    const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
    countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
    formatCount[q.format as keyof typeof formatCount]++;
  }
  console.log('\nPer-section breakdown:');
  for (const [title, count] of countBySection) {
    console.log(`  ${title}: ${count} quizzes`);
  }
  console.log(`\nBy format: MC=${formatCount.mc}, TF=${formatCount.tf}, MC2=${formatCount.mc2}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
