/**
 * Seed inline quizzes for kz2h-micrograd (Karpathy: Micrograd — backprop from scratch).
 *
 * 15 quizzes across 5 sections (mc, tf, mc2 mix).
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
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En micrograd, ¿qué estructura de datos se usa para representar la expresión matemática completa?',
    options: [
      { label: 'A', text: 'Un array de valores numéricos' },
      { label: 'B', text: 'Un DAG (grafo acíclico dirigido) donde cada nodo es un objeto Value' },
      { label: 'C', text: 'Una matriz de pesos y sesgos' },
      { label: 'D', text: 'Una lista enlazada de operaciones' },
    ],
    correctAnswer: 'B',
    explanation: 'Micrograd construye un DAG (Directed Acyclic Graph) donde cada nodo es un objeto Value que almacena un dato escalar, su gradiente, y referencias a sus hijos (los valores que lo produjeron) junto con la operación utilizada.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 1,
    format: 'tf',
    questionText: 'La derivada de una función en un punto mide la pendiente de la función en ese punto, es decir, cuánto cambia la salida cuando perturbamos la entrada una cantidad infinitesimalmente pequeña.',
    options: null,
    correctAnswer: 'true',
    explanation: 'La derivada es exactamente eso: el límite de (f(x+h) - f(x))/h cuando h→0. En micrograd, Karpathy demuestra esto numéricamente usando un h muy pequeño (ej: 0.0001) para verificar los gradientes.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Qué es ML — La Fábrica que Aprende Sola',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes son propiedades de la clase Value en micrograd?',
    options: [
      { label: 'A', text: 'Almacena un dato escalar (.data) y su gradiente (.grad)' },
      { label: 'B', text: 'Mantiene referencias a sus hijos (_children) para construir el grafo' },
      { label: 'C', text: 'Opera sobre tensores multidimensionales como PyTorch' },
      { label: 'D', text: 'Registra la operación (_op) que creó el nodo para saber cómo retropropagar' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Micrograd es un autograd escalar. ¿Qué información necesita cada nodo para poder hacer backprop?',
    explanation: 'Value almacena .data (escalar), .grad, _children (nodos que lo produjeron), y _op (operación usada). NO opera con tensores — es un autograd escalar, esa es la simplificación pedagógica clave.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Value — Un Número con Memoria
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si L = f(g(x)), ¿cómo se calcula dL/dx según la chain rule?',
    options: [
      { label: 'A', text: 'dL/dx = dL/dg + dg/dx' },
      { label: 'B', text: 'dL/dx = dL/dg × dg/dx' },
      { label: 'C', text: 'dL/dx = dg/dx / dL/dg' },
      { label: 'D', text: 'dL/dx = dL/dg - dg/dx' },
    ],
    correctAnswer: 'B',
    explanation: 'La chain rule dice que la derivada de una composición de funciones es el PRODUCTO de las derivadas en cada paso. dL/dx = dL/dg × dg/dx. Esta es la operación fundamental de backpropagation.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En backpropagation, el gradiente del nodo de salida (loss) siempre se inicializa en 1.0 antes de comenzar a propagar hacia atrás.',
    options: null,
    correctAnswer: 'true',
    explanation: 'El gradiente de la salida respecto a sí misma es siempre 1 (dL/dL = 1). Este es el "seed" que inicia la cadena de retropropagación multiplicativa a través de todo el grafo.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Value — Un Número con Memoria',
    sortOrder: 2,
    format: 'mc',
    questionText: 'Si un nodo z = x + y, y el gradiente de la salida respecto a z es dL/dz = 4.0, ¿cuáles son dL/dx y dL/dy?',
    options: [
      { label: 'A', text: 'dL/dx = 4.0, dL/dy = 4.0' },
      { label: 'B', text: 'dL/dx = 2.0, dL/dy = 2.0' },
      { label: 'C', text: 'dL/dx = 4.0, dL/dy = 0.0' },
      { label: 'D', text: 'Depende de los valores de x e y' },
    ],
    correctAnswer: 'A',
    explanation: 'Para la suma z = x + y: dz/dx = 1 y dz/dy = 1. Aplicando chain rule: dL/dx = dL/dz × dz/dx = 4.0 × 1 = 4.0, y lo mismo para y. La suma es un "distribuidor" de gradientes.',
  },

  // ────────────────────────────────────────────────
  // Section 2: La Derivada Parcial — El Momento Eureka
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: -1,
    format: 'tf',
    questionText: 'Si x aparece en la expresión como x + x, el gradiente de x es 1.0.',
    options: null,
    correctAnswer: 'false',
    explanation: 'El gradiente es 2.0, no 1.0. Cuando x contribuye por dos caminos (x + x), los gradientes se acumulan (+=). Cada camino contribuye 1.0, y 1.0 + 1.0 = 2.0.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué algoritmo usa micrograd para determinar el orden correcto de retropropagación?',
    options: [
      { label: 'A', text: 'BFS (breadth-first search)' },
      { label: 'B', text: 'Ordenamiento topológico del grafo, recorrido en reversa' },
      { label: 'C', text: 'DFS (depth-first search) desde las hojas hacia la raíz' },
      { label: 'D', text: 'Recorrido aleatorio del grafo' },
    ],
    correctAnswer: 'B',
    explanation: 'Micrograd construye un ordenamiento topológico del DAG y lo recorre en reversa. Esto garantiza que cuando procesamos un nodo, ya hemos calculado el gradiente de todos los nodos que dependen de él.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En micrograd, cada operación (+, ×, tanh, etc.) define su propia función _backward que sabe cómo propagar el gradiente a sus hijos.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Cada operación registra una función _backward como closure. Por ejemplo, la multiplicación z = a × b registra que dL/da = b × dL/dz y dL/db = a × dL/dz. El método backward() del nodo raíz las invoca en orden topológico inverso.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La Derivada Parcial — El Momento Eureka',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes afirmaciones sobre la acumulación de gradientes son correctas?',
    options: [
      { label: 'A', text: 'Si un nodo se usa dos veces en la expresión, sus gradientes deben sumarse (+=), no sobreescribirse (=)' },
      { label: 'B', text: 'Llamar zero_grad() es necesario antes de cada backward() para evitar acumulación no deseada' },
      { label: 'C', text: 'La acumulación de gradientes es un bug que Karpathy corrige eliminando nodos duplicados' },
      { label: 'D', text: 'Cada nodo puede contribuir gradiente a sus hijos desde múltiples caminos en el grafo' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Piensa en un nodo x que aparece en x + x. ¿Cuántos caminos conectan x con la salida?',
    explanation: 'Cuando un nodo contribuye a la salida por múltiples caminos, los gradientes de cada camino deben sumarse (regla de la suma multivariable). Por eso se usa += en _backward, y zero_grad() limpia los gradientes entre iteraciones.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Backpropagation y la Chain Rule
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: -2,
    format: 'tf',
    questionText: 'Un MLP con dos capas ocultas pero sin funciones de activación puede aproximar cualquier función no-lineal.',
    options: null,
    correctAnswer: 'false',
    explanation: 'Sin no-linealidades, apilar capas lineales es equivalente a una sola transformación lineal (la composición de funciones lineales es lineal). Se necesitan funciones de activación (tanh, ReLU, etc.) para que la red pueda aproximar funciones no-lineales.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: -1,
    format: 'mc',
    questionText: 'El gradiente de un peso es exactamente 0 después del backward pass. ¿Cuál es la causa más probable?',
    options: [
      { label: 'A', text: 'El peso no influye en la loss (no está conectado al output)' },
      { label: 'B', text: 'El peso está en zona de saturación de tanh (gradiente local ≈ 0)' },
      { label: 'C', text: 'Se olvidó llamar backward()' },
      { label: 'D', text: 'Todas las anteriores son posibles' },
    ],
    correctAnswer: 'D',
    explanation: 'Un gradiente de 0 puede tener múltiples causas: el peso puede no estar conectado al output, puede estar en zona de saturación de tanh (donde la derivada ≈ 0), o simplemente no se llamó backward(). Diagnosticar requiere inspeccionar el grafo y los valores intermedios.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
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
    explanation: 'Una neurona calcula: activation = tanh(Σ(wi × xi) + b). Es el producto punto de pesos con entradas, más un sesgo, pasado por una no-linealidad (tanh). Toda esta operación se construye como un subgrafo en el DAG.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Un MLP (Multi-Layer Perceptron) es simplemente una secuencia de capas donde la salida de una capa se convierte en la entrada de la siguiente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Un MLP es una pila de capas fully-connected. En micrograd, MLP se define con las dimensiones [nin, nout1, nout2, ...] y cada capa contiene neuronas que procesan la salida de la capa anterior.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backpropagation y la Chain Rule',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Por qué es importante que la función de activación (ej: tanh) sea no-lineal?',
    options: [
      { label: 'A', text: 'Porque reduce el número de parámetros del modelo' },
      { label: 'B', text: 'Porque sin ella, apilar capas sería equivalente a una sola transformación lineal' },
      { label: 'C', text: 'Porque hace que el entrenamiento sea más rápido' },
      { label: 'D', text: 'Porque normaliza los valores entre -1 y 1' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin no-linealidades, la composición de transformaciones lineales es otra transformación lineal (f(g(x)) = Ax donde A es el producto de las matrices). La no-linealidad permite al MLP aproximar funciones arbitrariamente complejas.',
  },

  // ────────────────────────────────────────────────
  // Section 4: Training Loop y Comparacion con PyTorch
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: -1,
    format: 'mc',
    questionText: 'La loss dejó de bajar después de 50 iteraciones y se estabilizó en 0.5. ¿Qué NO es una causa probable?',
    options: [
      { label: 'A', text: 'Learning rate demasiado bajo' },
      { label: 'B', text: 'Modelo con capacidad insuficiente (pocas neuronas/capas)' },
      { label: 'C', text: 'El gradiente del nodo raíz se inicializó en 1.0' },
      { label: 'D', text: 'Datos mal etiquetados' },
    ],
    correctAnswer: 'C',
    explanation: 'Inicializar el gradiente del nodo raíz (loss) en 1.0 es CORRECTO y NECESARIO — es dL/dL = 1.0, el seed que inicia backpropagation. Las otras tres opciones (lr bajo, modelo insuficiente, datos incorrectos) sí pueden causar que la loss se estanque.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el orden correcto de operaciones en un paso de entrenamiento (training step)?',
    options: [
      { label: 'A', text: 'backward → forward → zero_grad → update' },
      { label: 'B', text: 'forward → loss → backward → update → zero_grad' },
      { label: 'C', text: 'forward → backward → loss → update' },
      { label: 'D', text: 'zero_grad → loss → forward → backward' },
    ],
    correctAnswer: 'B',
    explanation: 'El training loop es: 1) Forward pass (calcular predicciones), 2) Calcular la loss, 3) Backward pass (calcular gradientes), 4) Actualizar parámetros (w -= lr × grad), 5) Zero grad (limpiar gradientes para la siguiente iteración).',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Un learning rate demasiado grande puede hacer que el modelo "sobrepase" el mínimo de la loss y diverga en lugar de converger.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Si el learning rate es muy grande, los pasos de actualización son demasiado amplios y el modelo oscila alrededor del mínimo o diverge. Karpathy lo demuestra en micrograd mostrando cómo la loss sube en lugar de bajar con un lr excesivo.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'De una Neurona a un MLP',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son diferencias entre micrograd y PyTorch?',
    options: [
      { label: 'A', text: 'PyTorch opera sobre tensores n-dimensionales, micrograd sobre escalares individuales' },
      { label: 'B', text: 'PyTorch tiene las mismas operaciones fundamentales de autograd (forward + backward por operación)' },
      { label: 'C', text: 'PyTorch no usa la chain rule internamente porque tiene un mecanismo diferente' },
      { label: 'D', text: 'La API de PyTorch (.backward(), .grad, .zero_grad()) es esencialmente la misma que micrograd' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Piensa en qué hace micrograd exactamente igual que PyTorch y qué difiere en escala pero no en concepto.',
    explanation: 'PyTorch es micrograd a escala: misma idea de autograd (forward/backward por op), misma API (.backward(), .grad, .zero_grad()), pero opera sobre tensores en lugar de escalares. La chain rule es exactamente el mismo mecanismo en ambos.',
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
