/**
 * Seed inline quizzes for kz2h-tokenizers (Karpathy: Tokenizers — el traductor entre humanos y LLMs).
 *
 * 9 quizzes across 3 sections (mc, tf, mc2 mix).
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-kz2h-tokenizers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'kz2h-tokenizers';

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
  // Section 0: Tokenización — Partir el Texto en Pedazos
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Tokenización — Partir el Texto en Pedazos',
    positionAfterHeading: 'Tokenización — Partir el Texto en Pedazos',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué los tokenizers modernos usan subwords en vez de letras individuales o palabras completas?',
    options: [
      { label: 'A', text: 'Porque las letras individuales son más fáciles de procesar para la GPU' },
      { label: 'B', text: 'Porque las subwords balancean vocabulario compacto con capacidad de representar cualquier palabra, incluso las nunca vistas' },
      { label: 'C', text: 'Porque las palabras completas son demasiado largas para la memoria' },
      { label: 'D', text: 'Porque es más fácil de programar que un tokenizer por palabras' },
    ],
    correctAnswer: 'B',
    explanation: 'Letras individuales generarían secuencias demasiado largas y perderían significado. Palabras completas necesitarían un vocabulario infinito. BPE encuentra subwords frecuentes que permiten un vocabulario finito (~50k-100k tokens) capaz de representar cualquier texto, incluyendo palabras raras o nuevas.',
  },
  {
    sectionTitle: 'Tokenización — Partir el Texto en Pedazos',
    positionAfterHeading: 'Tokenización — Partir el Texto en Pedazos',
    sortOrder: 1,
    format: 'tf',
    questionText: 'El tokenizer analiza la gramática y el significado de las palabras para decidir cómo dividir el texto.',
    options: null,
    correctAnswer: 'false',
    explanation: 'El tokenizer no entiende nada del lenguaje. BPE es puramente estadístico: cuenta qué pares de bytes aparecen juntos con más frecuencia en el corpus de entrenamiento y los fusiona. No hay gramática, no hay semántica — solo patrones de frecuencia.',
  },
  {
    sectionTitle: 'Tokenización — Partir el Texto en Pedazos',
    positionAfterHeading: 'Tokenización — Partir el Texto en Pedazos',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Cómo maneja BPE una palabra rara como "Nicolás" que probablemente no está en el vocabulario como token único?',
    options: [
      { label: 'A', text: 'La reemplaza por un token especial [UNK] (desconocido)' },
      { label: 'B', text: 'La descarta y la ignora por completo' },
      { label: 'C', text: 'La descompone en subwords o bytes que sí están en el vocabulario, como "Nic" + "ol" + "ás"' },
      { label: 'D', text: 'Agrega la palabra al vocabulario dinámicamente durante la inferencia' },
    ],
    correctAnswer: 'C',
    explanation: 'BPE nunca produce tokens desconocidos. Cualquier texto se puede representar descomponiendo hasta el nivel de bytes individuales. Una palabra rara se parte en fragmentos más pequeños que sí existen en el vocabulario, garantizando cobertura total.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Por Qué los LLMs No Cuentan Letras
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Por Qué los LLMs No Cuentan Letras',
    positionAfterHeading: 'Por Qué los LLMs No Cuentan Letras',
    sortOrder: 0,
    format: 'mc',
    questionText: '"tiene" se tokeniza como 1 token, pero "tinee" se tokeniza como 2 tokens ("tin" + "ee"). ¿Por qué esta diferencia importa para el LLM?',
    options: [
      { label: 'A', text: 'No importa — el LLM entiende ambas palabras igual' },
      { label: 'B', text: 'Porque el LLM nunca ve letras: ve tokens. "tiene" es una unidad atómica con significado aprendido, pero "tinee" son dos fragmentos sin relación con la palabra original' },
      { label: 'C', text: 'Porque "tinee" tiene más letras y usa más memoria' },
      { label: 'D', text: 'Porque el tokenizer detecta errores ortográficos automáticamente' },
    ],
    correctAnswer: 'B',
    explanation: 'El LLM opera exclusivamente sobre tokens. "tiene" como token único tiene un embedding rico entrenado con millones de ejemplos. "tinee" se parte en fragmentos que el modelo no asocia con la palabra correcta. Un typo cambia completamente la representación interna.',
  },
  {
    sectionTitle: 'Por Qué los LLMs No Cuentan Letras',
    positionAfterHeading: 'Por Qué los LLMs No Cuentan Letras',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Los LLMs no pueden contar correctamente las letras en "strawberry" porque ven tokens, no caracteres individuales.',
    options: null,
    correctAnswer: 'true',
    explanation: '"strawberry" se tokeniza como algo similar a "straw" + "berry". El modelo nunca ve las letras r-r-r individualmente. Pedirle que cuente letras es como pedirte que cuentes las letras de un párrafo mirando solo las palabras — necesitarías descomponerlas, algo que el LLM no sabe hacer.',
  },
  {
    sectionTitle: 'Por Qué los LLMs No Cuentan Letras',
    positionAfterHeading: 'Por Qué los LLMs No Cuentan Letras',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son consecuencias reales de la tokenización en el comportamiento de los LLMs?',
    options: [
      { label: 'A', text: 'Los LLMs tienen mejor ortografía que el humano promedio porque procesan texto carácter por carácter' },
      { label: 'B', text: 'Un typo puede confundir al modelo porque cambia completamente los tokens generados' },
      { label: 'C', text: 'Las "alucinaciones" pueden ocurrir porque el modelo predice el token más probable, no el más correcto' },
      { label: 'D', text: 'Idiomas con menos datos en el corpus de entrenamiento usan más tokens por palabra, haciendo la inferencia más cara y menos precisa' },
    ],
    correctAnswer: '[B,C,D]',
    justificationHint: 'Piensa en qué ve realmente el LLM: tokens, no letras. ¿Puede un modelo que no ve letras tener "buena ortografía"?',
    explanation: 'A es falso: los LLMs no ven letras, así que no "deletrean". B es correcto: un typo cambia los tokens y confunde al modelo. C es correcto: el LLM predice tokens probables, no verdades. D es correcto: idiomas subrepresentados se fragmentan más, costando más tokens y perdiendo contexto.',
  },

  // ────────────────────────────────────────────────
  // Section 2: De Tokens a Embeddings — El Pipeline
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'De Tokens a Embeddings — El Pipeline',
    positionAfterHeading: 'De Tokens a Embeddings — El Pipeline',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué es la embedding matrix en el contexto de un LLM?',
    options: [
      { label: 'A', text: 'Un algoritmo que comprime texto para ahorrar memoria' },
      { label: 'B', text: 'Una tabla de lookup que asigna a cada token ID un vector denso de números reales' },
      { label: 'C', text: 'Una red neuronal separada que analiza el significado de cada palabra' },
      { label: 'D', text: 'Un diccionario que traduce tokens a sus definiciones en lenguaje natural' },
    ],
    correctAnswer: 'B',
    explanation: 'La embedding matrix es conceptualmente simple: una tabla gigante donde cada fila corresponde a un token ID y contiene su vector (ej: 768 o 4096 dimensiones). El token ID es el índice, el vector es la representación que el modelo usa internamente.',
  },
  {
    sectionTitle: 'De Tokens a Embeddings — El Pipeline',
    positionAfterHeading: 'De Tokens a Embeddings — El Pipeline',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Los embeddings comienzan como números aleatorios y se ajustan durante el entrenamiento mediante backpropagation.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Al inicio del entrenamiento, los vectores de embedding son aleatorios — no codifican ningún significado. A medida que el modelo se entrena, backpropagation ajusta estos vectores para que tokens con roles similares tengan representaciones cercanas en el espacio vectorial.',
  },
  {
    sectionTitle: 'De Tokens a Embeddings — El Pipeline',
    positionAfterHeading: 'De Tokens a Embeddings — El Pipeline',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Por qué los tokens "gato" y "perro" terminan con vectores de embedding similares después del entrenamiento?',
    options: [
      { label: 'A', text: 'Porque un lingüista programó manualmente que son palabras relacionadas' },
      { label: 'B', text: 'Porque aparecen en contextos similares en el corpus de entrenamiento ("mi gato come...", "mi perro come..."), y el modelo aprende a darles vectores cercanos' },
      { label: 'C', text: 'Porque tienen la misma cantidad de letras' },
      { label: 'D', text: 'Porque el tokenizer los asigna a IDs consecutivos' },
    ],
    correctAnswer: 'B',
    explanation: 'La hipótesis distribucional: palabras que aparecen en contextos similares tienen significados similares. "gato" y "perro" aparecen en frases parecidas, así que backpropagation los empuja a regiones cercanas del espacio vectorial. Nadie programa esta relación — emerge del entrenamiento.',
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
