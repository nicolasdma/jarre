#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "p0-calculus-optimization" resource sections.
 *
 * Covers: derivatives/gradients, chain rule/computational graphs,
 * backpropagation, gradient descent variants, and Adam/convexity/schedules.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-p0-calculus-optimization.ts
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
  // ── Section 0: Derivadas Parciales y Gradientes ────────────────────────

  {
    sectionTitle: 'Derivadas Parciales y Gradientes',
    positionAfterHeading: 'Derivadas Parciales y Gradientes',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué indica la dirección del gradiente ∇f(x) de una función escalar f: ℝⁿ → ℝ?',
    options: [
      { label: 'A', text: 'La dirección en la que la función decrece más rápidamente' },
      { label: 'B', text: 'La dirección de máximo crecimiento de f en el punto x, con magnitud igual a la tasa de cambio máxima' },
      { label: 'C', text: 'Un vector perpendicular a la dirección de máximo crecimiento' },
      { label: 'D', text: 'La dirección hacia el mínimo global de la función' },
    ],
    correctAnswer: 'B',
    explanation:
      'El gradiente ∇f(x) apunta en la dirección de máximo crecimiento local de f, y su magnitud ‖∇f(x)‖ es la tasa de cambio máxima en esa dirección. Por eso en descenso de gradiente nos movemos en la dirección OPUESTA: -∇f(x). No apunta al mínimo global, solo indica la pendiente local más empinada.',
    justificationHint:
      'Piensa en una superficie 3D. El gradiente en un punto de la montaña apunta "cuesta arriba" en la dirección más empinada. ¿Por qué esto no garantiza encontrar el pico más alto (máximo global)?',
  },
  {
    sectionTitle: 'Derivadas Parciales y Gradientes',
    positionAfterHeading: 'Derivadas Parciales y Gradientes',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La Jacobiana de una función f: ℝⁿ → ℝᵐ es una matriz de m×n que generaliza el concepto de gradiente a funciones con salida vectorial.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'La Jacobiana J ∈ ℝᵐˣⁿ contiene todas las derivadas parciales ∂fᵢ/∂xⱼ. Cuando m=1 (función escalar), la Jacobiana se reduce a un vector fila de 1×n, que es el gradiente transpuesto. La Jacobiana es fundamental en backpropagation porque describe cómo pequeños cambios en las entradas afectan cada componente de la salida.',
  },
  {
    sectionTitle: 'Derivadas Parciales y Gradientes',
    positionAfterHeading: 'Derivadas Parciales y Gradientes',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué propiedad de la matriz Hessiana H indica que un punto crítico es un mínimo local?',
    options: [
      { label: 'A', text: 'Que H sea simétrica' },
      { label: 'B', text: 'Que todos los eigenvalores de H sean positivos (H positiva definida)' },
      { label: 'C', text: 'Que el determinante de H sea distinto de cero' },
      { label: 'D', text: 'Que la traza de H sea positiva' },
    ],
    correctAnswer: 'B',
    explanation:
      'Una Hessiana positiva definida (todos los eigenvalores > 0) significa que la curvatura es positiva en todas las direcciones, confirmando un mínimo local. Si tiene eigenvalores mixtos (positivos y negativos), el punto es un saddle point. En deep learning, los saddle points son mucho más comunes que los mínimos locales en espacios de alta dimensión.',
  },

  // ── Section 1: Regla de la Cadena y Grafos Computacionales ─────────────

  {
    sectionTitle: 'Regla de la Cadena y Grafos Computacionales',
    positionAfterHeading: 'Regla de la Cadena y Grafos Computacionales',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál es la ventaja fundamental del modo reverso (reverse mode) sobre el modo directo (forward mode) de diferenciación automática para redes neuronales?',
    options: [
      { label: 'A', text: 'El modo reverso es numéricamente más estable' },
      { label: 'B', text: 'El modo reverso calcula los gradientes de UNA salida escalar respecto a TODOS los parámetros en una sola pasada, mientras que el modo directo requiere una pasada por cada parámetro' },
      { label: 'C', text: 'El modo reverso no necesita almacenar valores intermedios' },
      { label: 'D', text: 'El modo reverso puede ejecutarse sin conocer la función de pérdida' },
    ],
    correctAnswer: 'B',
    explanation:
      'Para una función f: ℝⁿ → ℝ (loss con n parámetros), el modo directo requiere n pasadas forward para obtener ∂f/∂xᵢ para cada i. El modo reverso (backpropagation) calcula TODOS los ∂f/∂xᵢ en una sola pasada backward. Con millones de parámetros, esto hace que el modo reverso sea órdenes de magnitud más eficiente.',
    justificationHint:
      'Si tienes una red con 10 millones de parámetros y una pérdida escalar, el modo directo necesitaría 10 millones de pasadas forward. ¿Cuántas pasadas backward necesita el modo reverso? ¿Cuál es el trade-off en términos de memoria?',
  },
  {
    sectionTitle: 'Regla de la Cadena y Grafos Computacionales',
    positionAfterHeading: 'Regla de la Cadena y Grafos Computacionales',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'En un grafo computacional, la regla de la cadena multivariable establece que si un nodo z depende de x a través de múltiples caminos intermedios, los gradientes parciales de cada camino se multiplican entre sí.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Cuando un nodo z depende de x a través de múltiples caminos (por ejemplo, vía a y vía b), los gradientes de cada camino se SUMAN, no se multiplican. La regla de la cadena multivariable dice: ∂z/∂x = (∂z/∂a)(∂a/∂x) + (∂z/∂b)(∂b/∂x). Dentro de cada camino los gradientes se multiplican (cadena), pero entre caminos se suman (regla de la cadena total).',
  },
  {
    sectionTitle: 'Regla de la Cadena y Grafos Computacionales',
    positionAfterHeading: 'Regla de la Cadena y Grafos Computacionales',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué representan los nodos y las aristas en un grafo computacional utilizado para diferenciación automática?',
    options: [
      { label: 'A', text: 'Los nodos representan parámetros y las aristas representan gradientes' },
      { label: 'B', text: 'Los nodos representan operaciones o variables intermedias, y las aristas representan el flujo de datos (dependencias)' },
      { label: 'C', text: 'Los nodos representan capas de la red y las aristas representan funciones de activación' },
      { label: 'D', text: 'Los nodos representan funciones de pérdida y las aristas representan los pesos' },
    ],
    correctAnswer: 'B',
    explanation:
      'En un grafo computacional (como los de PyTorch/TensorFlow), cada nodo es una variable o el resultado de una operación elemental (suma, multiplicación, activación). Las aristas indican qué valores alimentan a qué operaciones. Durante el forward pass se computan los valores; durante el backward pass se propagan gradientes en dirección inversa por las aristas, aplicando la regla de la cadena en cada nodo.',
  },

  // ── Section 2: Backpropagation: Derivación Completa ────────────────────

  {
    sectionTitle: 'Backpropagation: Derivación Completa',
    positionAfterHeading: 'Backpropagation: Derivación Completa',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué la función sigmoide σ(x) = 1/(1+e⁻ˣ) es propensa a causar vanishing gradients en redes profundas?',
    options: [
      { label: 'A', text: 'Porque su salida está acotada entre 0 y 1' },
      { label: 'B', text: 'Porque su derivada σ\'(x) = σ(x)(1-σ(x)) tiene un máximo de 0.25, y al multiplicar muchas derivadas < 1 en la cadena, los gradientes decaen exponencialmente' },
      { label: 'C', text: 'Porque no es diferenciable en x = 0' },
      { label: 'D', text: 'Porque requiere más memoria que otras funciones de activación' },
    ],
    correctAnswer: 'B',
    explanation:
      'La derivada de sigmoide alcanza un máximo de 0.25 en x=0 y se acerca a 0 para |x| grande (regiones de saturación). En backpropagation, los gradientes se multiplican capa por capa. Con 10 capas, el gradiente se escala por (0.25)¹⁰ ≈ 9.5×10⁻⁷ en el MEJOR caso. En la práctica, con pre-activaciones grandes, los factores son mucho menores que 0.25, haciendo el vanishing aún peor.',
    justificationHint:
      'Calcula σ\'(5) y σ\'(10). Luego imagina multiplicar esos valores por 20 capas. ¿Cuánto gradiente llega a la primera capa? Compara con ReLU, cuya derivada es exactamente 1 para x > 0.',
  },
  {
    sectionTitle: 'Backpropagation: Derivación Completa',
    positionAfterHeading: 'Backpropagation: Derivación Completa',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Backpropagation es un algoritmo de optimización que modifica directamente los pesos de la red neuronal.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Backpropagation es exclusivamente un algoritmo de CÁLCULO DE GRADIENTES: aplica la regla de la cadena de forma eficiente para obtener ∂L/∂w para cada peso w. NO modifica pesos. La actualización de pesos la hace el OPTIMIZADOR (SGD, Adam, etc.) usando los gradientes que backprop calculó. Esta distinción es importante: puedes usar backprop con cualquier optimizador.',
  },
  {
    sectionTitle: 'Backpropagation: Derivación Completa',
    positionAfterHeading: 'Backpropagation: Derivación Completa',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es la principal ventaja de ReLU(x) = max(0, x) sobre sigmoide para mitigar el vanishing gradient?',
    options: [
      { label: 'A', text: 'ReLU tiene una salida acotada que estabiliza el entrenamiento' },
      { label: 'B', text: 'ReLU tiene derivada 1 para x > 0, lo que permite que los gradientes fluyan sin atenuarse a través de las capas' },
      { label: 'C', text: 'ReLU es computacionalmente más costosa pero más precisa' },
      { label: 'D', text: 'ReLU centra las activaciones alrededor de cero' },
    ],
    correctAnswer: 'B',
    explanation:
      'Para x > 0, ReLU\'(x) = 1, lo que significa que el gradiente pasa sin atenuación. A diferencia de sigmoide (máximo 0.25), multiplicar 1 × 1 × ... × 1 a través de muchas capas preserva la magnitud del gradiente. El trade-off es que para x ≤ 0, ReLU\'(x) = 0 ("dying ReLU"), que se aborda con variantes como Leaky ReLU o GELU.',
  },

  // ── Section 3: Optimización: Descenso de Gradiente y Variantes ─────────

  {
    sectionTitle: 'Optimización: Descenso de Gradiente y Variantes',
    positionAfterHeading: 'Optimización: Descenso de Gradiente y Variantes',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia clave entre batch gradient descent, SGD y mini-batch gradient descent?',
    options: [
      { label: 'A', text: 'Batch usa todos los datos, SGD usa un solo ejemplo, mini-batch usa un subconjunto. El trade-off es entre estabilidad de la estimación del gradiente y eficiencia computacional' },
      { label: 'B', text: 'Son tres nombres para el mismo algoritmo con diferentes learning rates' },
      { label: 'C', text: 'Batch usa GPU, SGD usa CPU, mini-batch usa ambos' },
      { label: 'D', text: 'Solo difieren en la función de pérdida que utilizan' },
    ],
    correctAnswer: 'A',
    explanation:
      'Batch GD computa el gradiente exacto sobre TODO el dataset (costoso pero estable). SGD usa UN ejemplo aleatorio (ruidoso pero rápido, con propiedades de regularización). Mini-batch (típicamente 32-512 ejemplos) balancea: estimación razonable del gradiente con eficiencia computacional y paralelización en GPU. En la práctica, el ruido de SGD/mini-batch ayuda a escapar de mínimos locales.',
  },
  {
    sectionTitle: 'Optimización: Descenso de Gradiente y Variantes',
    positionAfterHeading: 'Optimización: Descenso de Gradiente y Variantes',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Qué hace el término de momentum en la actualización v_t = βv_{t-1} + ∇L(θ_{t-1})?',
    options: [
      { label: 'A', text: 'Reduce la magnitud del gradiente para evitar overshooting' },
      { label: 'B', text: 'Acumula un promedio exponencial de gradientes pasados, acelerando la convergencia en direcciones consistentes y amortiguando oscilaciones en direcciones con gradientes cambiantes de signo' },
      { label: 'C', text: 'Selecciona automáticamente el learning rate óptimo' },
      { label: 'D', text: 'Proyecta el gradiente al subespacio de mayor curvatura' },
    ],
    correctAnswer: 'B',
    explanation:
      'Momentum funciona como una "bola rodando cuesta abajo": acumula velocidad en la dirección consistente del gradiente (β típicamente 0.9 conserva 90% de la velocidad anterior). En valles estrechos donde el gradiente oscila lateralmente, las componentes oscilantes se cancelan mientras las componentes consistentes se refuerzan. Esto acelera significativamente la convergencia.',
    justificationHint:
      'Imagina una superficie con forma de valle largo y estrecho. Sin momentum, el gradiente zigzaguea entre las paredes del valle avanzando poco. Con momentum, las oscilaciones se cancelan y la velocidad se acumula en la dirección del valle. Dibuja mentalmente 5 pasos de cada variante.',
  },
  {
    sectionTitle: 'Optimización: Descenso de Gradiente y Variantes',
    positionAfterHeading: 'Optimización: Descenso de Gradiente y Variantes',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Un learning rate demasiado grande puede causar que la función de pérdida AUMENTE en lugar de disminuir, ya que la actualización sobrepasa el mínimo y escala la pared opuesta del valle.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Con un learning rate excesivo, el paso θ_{t+1} = θ_t - α∇L puede saltar más allá del mínimo a un punto con pérdida mayor. En casos extremos, esto causa divergencia: la pérdida crece sin límite. Por eso los learning rate schedules (warmup + decay) son cruciales: se empieza pequeño (warmup), se permite explorar (rate alto), y se refina (decay).',
  },

  // ── Section 4: Adam, Convexidad y Learning Rate Schedules ──────────────

  {
    sectionTitle: 'Adam, Convexidad y Learning Rate Schedules',
    positionAfterHeading: 'Adam, Convexidad y Learning Rate Schedules',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué Adam aplica corrección de sesgo (bias correction) a las estimaciones m_t y v_t en los primeros pasos del entrenamiento?',
    options: [
      { label: 'A', text: 'Para normalizar los gradientes entre 0 y 1' },
      { label: 'B', text: 'Porque m_t y v_t se inicializan en 0, lo que sesga las estimaciones del primer y segundo momento hacia valores artificialmente bajos; la corrección m̂_t = m_t/(1-β₁ᵗ) compensa este sesgo de inicialización' },
      { label: 'C', text: 'Para limitar la magnitud máxima de los pasos de actualización' },
      { label: 'D', text: 'Para evitar que el optimizador se atasque en saddle points' },
    ],
    correctAnswer: 'B',
    explanation:
      'Al inicializar m₀ = v₀ = 0, los primeros promedios exponenciales están sesgados hacia cero. Por ejemplo, m₁ = (1-β₁)g₁ ≈ 0.1g₁ (con β₁=0.9), subestimando el momento real. La corrección divide por (1-β₁ᵗ): m̂₁ = m₁/(1-0.9¹) = m₁/0.1 = g₁, recuperando el valor correcto. A medida que t crece, (1-β₁ᵗ) → 1 y la corrección desaparece.',
    justificationHint:
      'Haz la cuenta explícita: con β₁=0.9, calcula m₁, m₂, m₃ sin corrección. Luego aplica la corrección. ¿A partir de qué paso t la corrección es despreciable (< 1%)?',
  },
  {
    sectionTitle: 'Adam, Convexidad y Learning Rate Schedules',
    positionAfterHeading: 'Adam, Convexidad y Learning Rate Schedules',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Las funciones de pérdida de redes neuronales profundas son generalmente convexas, lo que garantiza que el descenso de gradiente converja al mínimo global.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Las funciones de pérdida de redes profundas son altamente NO convexas: tienen múltiples mínimos locales, saddle points, y regiones planas. Sin embargo, investigaciones recientes sugieren que en espacios de alta dimensión, la mayoría de los mínimos locales tienen pérdidas similares al mínimo global, y los saddle points son más problemáticos que los mínimos locales. Por eso optimizadores como Adam con momentum funcionan bien en la práctica.',
  },
  {
    sectionTitle: 'Adam, Convexidad y Learning Rate Schedules',
    positionAfterHeading: 'Adam, Convexidad y Learning Rate Schedules',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia entre weight decay y regularización L2 en el contexto de Adam?',
    options: [
      { label: 'A', text: 'Son exactamente equivalentes para todos los optimizadores' },
      { label: 'B', text: 'Weight decay resta λw directamente al peso, mientras que L2 agrega λw al gradiente. En SGD son equivalentes, pero en Adam difieren porque la adaptación del learning rate por parámetro modifica el efecto de L2' },
      { label: 'C', text: 'L2 es más fuerte que weight decay en todos los casos' },
      { label: 'D', text: 'Weight decay solo se aplica a los biases, L2 a todos los parámetros' },
    ],
    correctAnswer: 'B',
    explanation:
      'En SGD: w ← w - α(∇L + λw) = w(1-αλ) - α∇L, lo que hace L2 y weight decay equivalentes. Pero en Adam, el gradiente se divide por √v_t (segundo momento), lo que escala TAMBIÉN el término λw de L2. AdamW (Loshchilov & Hutter, 2019) corrige esto aplicando weight decay directamente: w ← (1-λ)w - α·m̂_t/√v̂_t, desacoplando la regularización de la adaptación del learning rate.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching p0-calculus-optimization section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'p0-calculus-optimization')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for p0-calculus-optimization. Seed sections first.');
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

  console.log('\nCleared existing quizzes for p0-calculus-optimization sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for p0-calculus-optimization`);
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
