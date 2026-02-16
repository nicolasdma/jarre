#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "Attention Is All You Need" paper sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-attention.ts
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
  // ── Section 0: El Problema de las Secuencias ───────────────────────────

  {
    sectionTitle: 'El Problema de las Secuencias',
    positionAfterHeading: 'El Problema de las Secuencias',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál era la limitación fundamental de las RNNs y LSTMs que motivó la creación del Transformer?',
    options: [
      { label: 'A', text: 'No podían aprender representaciones de alta dimensión' },
      { label: 'B', text: 'Su naturaleza secuencial impedía la paralelización durante el entrenamiento, y las dependencias de largo alcance se degradaban' },
      { label: 'C', text: 'Requerían demasiada memoria GPU para secuencias cortas' },
      { label: 'D', text: 'No podían procesar texto, solo datos numéricos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las RNNs procesan tokens uno por uno en secuencia (h_t depende de h_{t-1}), lo que impide paralelizar el cómputo. Además, aunque las LSTMs mejoran sobre RNNs vanilla, la información de tokens lejanos se degrada al pasar por muchos pasos secuenciales. El Transformer resuelve ambos problemas: la attention conecta cualquier par de posiciones directamente, y el cómputo se paraleliza completamente.',
    justificationHint:
      'Piensa en una secuencia de 1000 tokens. En una RNN, la información del token 1 debe pasar por 999 pasos para llegar al token 1000. En un Transformer, la attention conecta el token 1 con el 1000 directamente. ¿Qué impacto tiene esto en el gradiente durante backpropagation?',
  },
  {
    sectionTitle: 'El Problema de las Secuencias',
    positionAfterHeading: 'El Problema de las Secuencias',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Antes del Transformer, los modelos de atención ya existían pero siempre se usaban en combinación con redes recurrentes.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Los mecanismos de atención (Bahdanau 2014, Luong 2015) ya se usaban ampliamente, pero como complemento de arquitecturas recurrentes (attention sobre los hidden states de una RNN). La contribución clave del paper "Attention Is All You Need" es demostrar que la atención SOLA, sin recurrencia, es suficiente y superior para modelar secuencias.',
  },

  // ── Section 1: Self-Attention ──────────────────────────────

  {
    sectionTitle: 'Self-Attention',
    positionAfterHeading: 'Self-Attention',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué representan las matrices Query (Q), Key (K) y Value (V) en el mecanismo de self-attention?',
    options: [
      { label: 'A', text: 'Q es la pregunta del usuario, K es la clave de la base de datos, V es el valor almacenado' },
      { label: 'B', text: 'Q representa lo que un token busca, K representa lo que un token ofrece como criterio de relevancia, V representa la información que un token aporta' },
      { label: 'C', text: 'Q, K y V son tres copias idénticas del embedding de entrada' },
      { label: 'D', text: 'Q codifica la posición, K codifica el significado semántico, V codifica la sintaxis' },
    ],
    correctAnswer: 'B',
    explanation:
      'La analogía es con un sistema de retrieval: Q es "¿qué estoy buscando?", K es "¿qué tengo para ofrecer como criterio de búsqueda?", V es "¿qué información doy si soy seleccionado?". El producto Q·K^T mide la compatibilidad entre lo que cada token busca y lo que cada otro token ofrece. Los pesos resultantes (tras softmax) se aplican sobre V para obtener la mezcla de información.',
  },
  {
    sectionTitle: 'Self-Attention',
    positionAfterHeading: 'Self-Attention',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Por qué se divide por √d_k en la fórmula Attention(Q,K,V) = softmax(QK^T / √d_k)V?',
    options: [
      { label: 'A', text: 'Para normalizar los valores entre 0 y 1' },
      { label: 'B', text: 'Para evitar que los productos punto crezcan demasiado con dimensiones altas, empujando el softmax a regiones de gradientes extremadamente pequeños' },
      { label: 'C', text: 'Para reducir el costo computacional de la multiplicación de matrices' },
      { label: 'D', text: 'Para compensar el efecto del dropout aplicado a las claves' },
    ],
    correctAnswer: 'B',
    explanation:
      'Cuando d_k es grande, los productos punto Q·K tienden a crecer en magnitud (varianza proporcional a d_k). Valores muy grandes hacen que el softmax produzca distribuciones casi one-hot, con gradientes extremadamente pequeños (vanishing gradients). Dividir por √d_k escala los logits para que la varianza sea ~1, manteniendo el softmax en una región con gradientes útiles.',
    justificationHint:
      'Si d_k = 512 y los componentes de Q y K son ~N(0,1), el producto punto tiene media 0 y varianza 512. Un valor de 30 en el softmax produce una distribución donde una entrada es ~1.0 y las demás ~0.0. Dividir por √512 ≈ 22.6 reduce ese valor a ~1.3, mucho más manejable.',
  },
  {
    sectionTitle: 'Self-Attention',
    positionAfterHeading: 'Self-Attention',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'En self-attention, cada token solo puede atender a tokens que aparecen antes de él en la secuencia.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En self-attention estándar (como en el encoder del Transformer), cada token atiende a TODOS los tokens de la secuencia, incluyendo los posteriores. La restricción de atender solo tokens previos se llama "masked self-attention" (o causal attention) y se aplica solo en el decoder, para evitar que el modelo vea tokens futuros durante la generación autoregresiva.',
  },

  // ── Section 2: Multi-Head Attention ─────────────────────────────────────

  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál es la ventaja de usar múltiples cabezas de atención en paralelo en vez de una sola cabeza con mayor dimensión?',
    options: [
      { label: 'A', text: 'Reduce el costo computacional total significativamente' },
      { label: 'B', text: 'Permite que cada cabeza aprenda diferentes tipos de relaciones (sintácticas, semánticas, posicionales) simultáneamente' },
      { label: 'C', text: 'Garantiza que el modelo no sobreajuste a los datos de entrenamiento' },
      { label: 'D', text: 'Permite procesar secuencias de longitud variable sin padding' },
    ],
    correctAnswer: 'B',
    explanation:
      'Cada cabeza de atención opera en un subespacio diferente (d_k = d_model/h). Esto permite que una cabeza aprenda relaciones sintácticas ("verbo atiende a sujeto"), otra semánticas ("pronombre atiende a su referente"), otra posicionales, etc. Empíricamente se observa esta especialización. El costo total es similar a una sola cabeza de dimensión completa.',
  },
  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 1,
    format: 'mc',
    questionText:
      'Si d_model = 512 y h = 8 cabezas, ¿cuál es la dimensión de cada cabeza (d_k)?',
    options: [
      { label: 'A', text: '512' },
      { label: 'B', text: '64' },
      { label: 'C', text: '4096' },
      { label: 'D', text: '8' },
    ],
    correctAnswer: 'B',
    explanation:
      'd_k = d_model / h = 512 / 8 = 64. Cada cabeza trabaja en un subespacio de dimensión 64. Las 8 salidas se concatenan (8 × 64 = 512) y se proyectan linealmente de vuelta a d_model. Este diseño asegura que el costo computacional total de multi-head attention sea similar al de single-head attention con dimensión completa.',
  },
  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Cada cabeza de atención en multi-head attention comparte los mismos pesos de proyección W_Q, W_K y W_V.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Cada cabeza tiene sus PROPIAS matrices de proyección W_Q^i, W_K^i, W_V^i. Esto es precisamente lo que permite que cada cabeza aprenda diferentes patrones de atención: matrices diferentes proyectan al mismo input a subespacios diferentes, capturando distintos tipos de relaciones entre tokens.',
  },

  // ── Section 3: La Arquitectura Transformer ──────────────────────────────

  {
    sectionTitle: 'La Arquitectura Transformer',
    positionAfterHeading: 'La Arquitectura Transformer',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Por qué el Transformer necesita positional encoding si la self-attention no tiene noción inherente del orden de los tokens?',
    options: [
      { label: 'A', text: 'Para reducir el tamaño del vocabulario' },
      { label: 'B', text: 'Porque sin información posicional, la self-attention trataría "el gato comió ratón" igual que "el ratón comió gato", ya que la attention es una operación sobre conjuntos, no sobre secuencias' },
      { label: 'C', text: 'Para permitir que el modelo procese secuencias de longitud variable' },
      { label: 'D', text: 'Para acelerar la convergencia durante el entrenamiento' },
    ],
    correctAnswer: 'B',
    explanation:
      'La self-attention es permutation-equivariant: si reordenas los tokens de entrada, la salida se reordena de la misma forma. Sin positional encoding, "Juan ama a María" y "María ama a Juan" producirían representaciones idénticas (salvo el orden). El positional encoding inyecta información de posición para que el modelo pueda distinguir el orden.',
    justificationHint:
      'Haz el experimento mental: sin posición, attention(Q,K,V) solo depende de los VALORES de los tokens, no de dónde están. Las funciones sinusoidales del paper permiten que el modelo aprenda relaciones posicionales relativas. ¿Por qué sinusoidales y no un simple índice 1,2,3...?',
  },
  {
    sectionTitle: 'La Arquitectura Transformer',
    positionAfterHeading: 'La Arquitectura Transformer',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cuál es el propósito de las conexiones residuales (residual connections) en cada sub-capa del Transformer?',
    options: [
      { label: 'A', text: 'Reducir el número de parámetros del modelo' },
      { label: 'B', text: 'Permitir que la información fluya directamente entre capas sin degradarse, facilitando el entrenamiento de redes profundas' },
      { label: 'C', text: 'Implementar un mecanismo de memoria a corto plazo' },
      { label: 'D', text: 'Convertir las capas de atención en capas recurrentes' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las residual connections (output = sublayer(x) + x) crean un "highway" para que gradientes fluyan sin atenuarse a través de las N capas. Cada sub-capa solo necesita aprender la DIFERENCIA residual respecto a su input, lo que es más fácil de optimizar. Combinadas con layer normalization, permiten entrenar Transformers de 6+ capas sin problemas de vanishing gradients.',
  },
  {
    sectionTitle: 'La Arquitectura Transformer',
    positionAfterHeading: 'La Arquitectura Transformer',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'En el Transformer original, el encoder y el decoder tienen exactamente la misma estructura interna.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'El decoder tiene una capa adicional que el encoder no tiene: cross-attention (encoder-decoder attention). Además, la primera capa de self-attention del decoder usa masking causal para evitar atender a posiciones futuras. El encoder tiene: self-attention + feed-forward. El decoder tiene: masked self-attention + cross-attention + feed-forward.',
  },

  // ── Section 4: Resultados e Impacto ──────────────────────────────────────

  {
    sectionTitle: 'Resultados e Impacto',
    positionAfterHeading: 'Resultados e Impacto',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué el Transformer fue tan influyente más allá de la traducción automática?',
    options: [
      { label: 'A', text: 'Porque Google lo implementó como código abierto inmediatamente' },
      { label: 'B', text: 'Porque su arquitectura paralelizable y su mecanismo de atención demostraron ser superiores para prácticamente cualquier tarea de secuencia, habilitando el entrenamiento a escalas sin precedentes' },
      { label: 'C', text: 'Porque fue el primer modelo que superó a los humanos en NLP' },
      { label: 'D', text: 'Porque eliminó la necesidad de datos etiquetados para entrenar modelos de lenguaje' },
    ],
    correctAnswer: 'B',
    explanation:
      'El Transformer demostró que la atención sin recurrencia escala mejor con el hardware moderno (GPUs). BERT usa solo el encoder, GPT solo el decoder, T5 usa ambos. La capacidad de paralelizar el entrenamiento permitió modelos de billones de parámetros (GPT-3, PaLM, LLaMA), algo impensable con RNNs. Transformó NLP, visión (ViT), audio, proteínas, y más.',
  },
  {
    sectionTitle: 'Resultados e Impacto',
    positionAfterHeading: 'Resultados e Impacto',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'El paper "Attention Is All You Need" propuso el pre-entrenamiento autoregresivo que luego usaría GPT.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'El paper original se enfocó exclusivamente en traducción automática supervisada (encoder-decoder). No propuso pre-entrenamiento autoregresivo ni transfer learning. GPT (Radford et al., 2018) fue quien tomó el decoder del Transformer y lo aplicó al pre-entrenamiento autoregresivo. BERT (Devlin et al., 2018) tomó el encoder para pre-entrenamiento con masked language modeling. El paper sentó las bases arquitectónicas, pero los paradigmas de pre-entrenamiento vinieron después.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching attention-paper section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'attention-paper')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for attention-paper. Seed sections first.');
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

  console.log('\nCleared existing quizzes for attention-paper sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for Attention Is All You Need paper`);
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
