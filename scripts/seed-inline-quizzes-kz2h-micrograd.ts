/**
 * Seed inline quizzes for kz2h-micrograd (Karpathy: Micrograd — backprop from scratch).
 *
 * 15 quizzes across 5 sections.
 * Bloom distribution: Remember 20%, Understand 27%, Apply 27%, Analyze 20%, Evaluate 6%
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-kz2h-micrograd.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'kz2h-micrograd';

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
  // Section 0: Qué es ML — La Fábrica que Aprende Sola
  // Q1: Remember (keep), Q2: Apply, Q3: Analyze
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es la diferencia fundamental entre programación tradicional y machine learning?',
    options: [
      { label: 'A', text: 'ML usa más memoria que la programación tradicional' },
      { label: 'B', text: 'En programación tradicional defines las reglas; en ML el modelo descubre las reglas a partir de datos' },
      { label: 'C', text: 'ML solo funciona con imágenes, no con texto' },
      { label: 'D', text: 'La programación tradicional no puede resolver problemas complejos' },
    ],
    correctAnswer: 'B',
    explanation: 'Programación tradicional: reglas + datos → respuesta. Machine Learning: datos + respuestas → reglas. El modelo encuentra los patrones solo, en vez de que un humano los programe.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Tu red neuronal entrenó 50 epochs y la loss bajó de 4.8 a 0.003. Al probar con datos nuevos, la loss sube a 3.7. ¿Cuál es el diagnóstico más probable?',
    options: [
      { label: 'A', text: 'El learning rate es demasiado bajo' },
      { label: 'B', text: 'Overfitting: el modelo memorizó los datos de entrenamiento en lugar de aprender patrones generalizables' },
      { label: 'C', text: 'Los datos de prueba están corruptos' },
      { label: 'D', text: 'Necesitas más epochs de entrenamiento' },
    ],
    correctAnswer: 'B',
    explanation: 'Loss bajísima en training pero alta en datos nuevos es la firma del overfitting. Con solo 4 datos y 41 parámetros (como en micrograd), el modelo tiene capacidad de sobra para memorizar cada ejemplo sin aprender la regla subyacente.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 2,
    format: 'mc',
    questionText: 'El MLP de micrograd tiene 41 parámetros y 4 datos de entrenamiento. ¿Qué implica esta relación parámetros/datos para la generalización?',
    options: [
      { label: 'A', text: 'Es ideal: más parámetros siempre significa mejor aprendizaje' },
      { label: 'B', text: 'El modelo tiene ~10x más parámetros que datos, lo que favorece la memorización sobre la generalización' },
      { label: 'C', text: 'No importa: el training loop converge igual' },
      { label: 'D', text: 'Se necesitan exactamente tantos parámetros como datos' },
    ],
    correctAnswer: 'B',
    explanation: 'Con 41 parámetros y solo 4 ejemplos, el modelo tiene capacidad de sobra para memorizar cada dato sin aprender patrones generalizables. En la práctica, se necesitan muchos más datos que parámetros para que el modelo generalice bien.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Value — Un Número con Memoria
  // Q1: Remember (keep), Q2: Apply, Q3: Analyze
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué información adicional almacena un objeto Value respecto a un número normal de Python?',
    options: [
      { label: 'A', text: 'Solo el valor numérico y un nombre descriptivo' },
      { label: 'B', text: 'Su valor (.data), su gradiente (.grad), sus padres (_prev) y la operación que lo creó (_op)' },
      { label: 'C', text: 'El tipo de dato y la posición en memoria' },
      { label: 'D', text: 'Solo el gradiente para backpropagation' },
    ],
    correctAnswer: 'B',
    explanation: 'Value almacena .data (escalar), .grad (gradiente), _prev (nodos que lo produjeron) y _op (operación). Esta información forma el DAG que permite calcular gradientes automáticamente.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Dado `a = Value(2.0)`, `b = Value(3.0)`, `c = a * b`, `d = c + a`: ¿cuántas aristas tiene el DAG resultante?',
    options: [
      { label: 'A', text: '3 aristas' },
      { label: 'B', text: '4 aristas' },
      { label: 'C', text: '5 aristas' },
      { label: 'D', text: '6 aristas' },
    ],
    correctAnswer: 'B',
    explanation: 'El DAG tiene: a→c, b→c (multiplicación), c→d, a→d (suma). Total: 4 aristas. Nota que `a` aparece como padre en dos operaciones — es un DAG, no un árbol.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 2,
    format: 'mc',
    questionText: 'Si eliminamos _children y _op de la clase Value (dejando solo .data y .grad), ¿qué capacidad se pierde?',
    options: [
      { label: 'A', text: 'Solo se pierde la visualización con Graphviz' },
      { label: 'B', text: 'Se pierde la capacidad de calcular gradientes automáticamente, porque backprop necesita recorrer el grafo hacia atrás' },
      { label: 'C', text: 'No se pierde nada: .grad se puede calcular sin conocer la historia' },
      { label: 'D', text: 'Solo se pierden las etiquetas de depuración' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin _children, el método backward() no puede recorrer el grafo. Sin _op, no puede saber qué función _backward ejecutar. La "memoria" del Value es lo que hace posible la retropropagación automática.',
  },

  // ────────────────────────────────────────────────
  // Section 2: La Derivada Parcial — El Momento Eureka
  // Q1: Apply numérico (keep), Q2: Apply, Q3: Analyze
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si c = a × b, donde a = 3 y b = 4, ¿cuánto vale dc/da (la derivada parcial de c respecto a a)?',
    options: [
      { label: 'A', text: '3 (el valor de a)' },
      { label: 'B', text: '4 (el valor de b)' },
      { label: 'C', text: '12 (el valor de c)' },
      { label: 'D', text: '1 (siempre es 1)' },
    ],
    correctAnswer: 'B',
    explanation: 'En c = a × b, dc/da = b. Si b = 4, entonces mover a en 0.01 mueve c en 0.04. La otra variable actúa como la pendiente.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Si f(x) = x³, ¿cuánto vale df/dx evaluada en x = 2?',
    options: [
      { label: 'A', text: '6' },
      { label: 'B', text: '8' },
      { label: 'C', text: '12' },
      { label: 'D', text: '3' },
    ],
    correctAnswer: 'C',
    explanation: 'La derivada de x³ es 3x². Evaluada en x=2: 3 × 2² = 3 × 4 = 12. Si x pasa de 2.0 a 2.001, f(x) cambia aproximadamente 0.012.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 2,
    format: 'mc',
    questionText: 'Para c = a*b + a (con a=3, b=4), ¿cuánto vale dc/da?',
    options: [
      { label: 'A', text: '4 (solo b)' },
      { label: 'B', text: '5 (b + 1)' },
      { label: 'C', text: '3 (solo a)' },
      { label: 'D', text: '7 (a + b)' },
    ],
    correctAnswer: 'B',
    explanation: 'c = a*b + a. Derivando respecto a a: dc/da = b + 1 = 4 + 1 = 5. La variable `a` contribuye por dos caminos (en a*b y en +a), y los gradientes se SUMAN. Es la regla multivariable de la chain rule.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Backpropagation y la Chain Rule
  // Q1: Apply numérico (keep), Q2: Evaluate, Q3: Analyze
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si a=2, b=a×3=6, c=b+1=7, d=c×2=14, ¿cuál es el gradiente de a respecto a d (dd/da)?',
    options: [
      { label: 'A', text: '2' },
      { label: 'B', text: '3' },
      { label: 'C', text: '6' },
      { label: 'D', text: '14' },
    ],
    correctAnswer: 'C',
    explanation: 'Chain rule: db/da = 3, dc/db = 1 (suma), dd/dc = 2. Total: 3 × 1 × 2 = 6. Si mueves a en 0.01, d cambia en 0.06.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Si usamos `=` en lugar de `+=` en _backward, el único efecto es que el entrenamiento se vuelve más lento pero sigue siendo correcto.',
    options: null,
    correctAnswer: 'false',
    explanation: 'Falso. Usar `=` produce gradientes INCORRECTOS cuando un nodo contribuye por múltiples caminos (ej: a + a). La segunda asignación sobreescribe la primera, dando gradiente 1 en vez de 2. Esto es un error de corrección, no de velocidad.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: 2,
    format: 'mc',
    questionText: 'En un grafo con gradientes calculados, el peso w1 tiene grad = 0.001 y w2 tiene grad = 15.0. ¿Qué indica esta diferencia?',
    options: [
      { label: 'A', text: 'w2 es más importante que w1 para el modelo' },
      { label: 'B', text: 'w1 tiene casi nulo efecto sobre la loss actual; w2 la afecta fuertemente — el update moverá w2 mucho más' },
      { label: 'C', text: 'w1 ya convergió y w2 no' },
      { label: 'D', text: 'Hay un bug: los gradientes deberían tener magnitudes similares' },
    ],
    correctAnswer: 'B',
    explanation: 'El gradiente mide la sensibilidad de la loss al peso. grad=0.001 significa que mover w1 casi no cambia la loss. grad=15.0 significa que w2 influye fuertemente. Con SGD, el update es proporcional al gradiente: w2 se moverá 15000x más que w1.',
  },

  // ────────────────────────────────────────────────
  // Section 4: De una Neurona a un MLP
  // Q1: Remember (keep), Q2: Apply, Q3: Analyze
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué operación realiza una neurona individual en micrograd?',
    options: [
      { label: 'A', text: 'Solo una suma de las entradas' },
      { label: 'B', text: 'Producto punto de pesos × entradas, más un sesgo, seguido de una función de activación (tanh)' },
      { label: 'C', text: 'Una multiplicación de matrices' },
      { label: 'D', text: 'Un promedio ponderado sin función de activación' },
    ],
    correctAnswer: 'B',
    explanation: 'Una neurona calcula: activation = tanh(Σ(wi × xi) + b). Es el producto punto de pesos con entradas, más un sesgo, pasado por una no-linealidad (tanh).',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Cuántos parámetros tiene un MLP con arquitectura [3, 4, 4, 1]?',
    options: [
      { label: 'A', text: '12 (solo pesos, sin bias)' },
      { label: 'B', text: '41 (16 + 20 + 5)' },
      { label: 'C', text: '48 (3×4 + 4×4 + 4×1)' },
      { label: 'D', text: '37 (12 + 16 + 4 + 5)' },
    ],
    correctAnswer: 'B',
    explanation: 'Capa 1: 4 neuronas × (3 pesos + 1 bias) = 16. Capa 2: 4 × (4+1) = 20. Salida: 1 × (4+1) = 5. Total: 16 + 20 + 5 = 41.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Qué aprende un MLP que no tiene función de activación no-lineal (sin tanh ni ReLU)?',
    options: [
      { label: 'A', text: 'Aprende más rápido porque hay menos operaciones' },
      { label: 'B', text: 'Solo puede aprender funciones lineales, sin importar cuántas capas tenga' },
      { label: 'C', text: 'Aprende lo mismo pero con más parámetros' },
      { label: 'D', text: 'No puede hacer forward pass' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin no-linealidades, la composición de N transformaciones lineales es otra transformación lineal. Apilar 100 capas lineales equivale a una sola capa lineal. La no-linealidad es lo que permite aproximar funciones arbitrariamente complejas (Cybenko 1989).',
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
