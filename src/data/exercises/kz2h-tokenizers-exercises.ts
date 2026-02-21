import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * kz2h-tokenizers — 2 exercises
 *
 * Exercise 1 (sequence): Text-to-numbers pipeline — tokenization-bpe
 * Exercise 2 (connect): Tokenization concepts → their effects — tokenization-bpe
 */

const tokenizersExercise1: SequenceExercise = {
  id: 'tokenizers-1',
  type: 'sequence',
  title: 'De texto a números: el pipeline completo',
  instructions: 'Ordena los pasos que sigue un LLM para convertir texto en algo que puede procesar.',
  conceptId: 'tokenization-bpe',
  steps: [
    { id: 's1', text: 'Recibir texto crudo (ej: "El gato duerme")' },
    { id: 's2', text: 'Tokenizar: partir en subwords usando BPE (ej: ["El", " gato", " duerme"])' },
    { id: 's3', text: 'Convertir tokens a IDs numéricos usando el diccionario (ej: [512, 8847, 23091])' },
    { id: 's4', text: 'Buscar cada ID en la embedding matrix → obtener vectores densos (ej: 768 dimensiones)' },
    { id: 's5', text: 'La red neuronal procesa los vectores de embedding' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

const tokenizersExercise2: ConnectExercise = {
  id: 'tokenizers-2',
  type: 'connect',
  title: 'Conceptos de tokenización y sus efectos',
  instructions: 'Conecta cada concepto con su consecuencia directa en el comportamiento de los LLMs.',
  conceptId: 'tokenization-bpe',
  svgViewBox: '0 0 700 340',
  nodes: [
    // Left column — concepts
    { id: 'bpe', label: 'BPE (Byte Pair Encoding)', x: 100, y: 50 },
    { id: 'typo', label: 'Typo raro → tokens sin sentido', x: 100, y: 140 },
    { id: 'freq', label: '"vaca" 10M veces vs "baca" 50K', x: 100, y: 230 },
    // Right column — effects
    { id: 'subword', label: 'Palabras raras se parten en pedazos conocidos', x: 550, y: 50 },
    { id: 'confuse', label: 'El modelo recibe secuencia semánticamente diferente', x: 550, y: 140 },
    { id: 'correct', label: 'El modelo genera la forma correcta por estadística', x: 550, y: 230 },
  ],
  correctConnections: [
    ['bpe', 'subword'],
    ['typo', 'confuse'],
    ['freq', 'correct'],
  ],
};

export const tokenizersExercises = [tokenizersExercise1, tokenizersExercise2];
