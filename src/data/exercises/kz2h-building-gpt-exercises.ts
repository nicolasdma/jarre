import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * kz2h-building-gpt — 3 exercises
 *
 * Exercise 1 (sequence): Attention mechanism steps — attention-mechanism
 * Exercise 2 (connect): Transformer components → their roles — transformer-architecture
 * Exercise 3 (sequence): Full transformer block pipeline — transformer-architecture
 */

const buildingGptExercise1: SequenceExercise = {
  id: 'building-gpt-1',
  type: 'sequence',
  title: 'Pasos del mecanismo de atención',
  instructions: 'Ordena los pasos que ocurren cuando una palabra calcula su representación contextualizada mediante attention.',
  conceptId: 'attention-mechanism',
  steps: [
    { id: 's1', text: 'Generar Query, Key y Value multiplicando el embedding por matrices W_q, W_k, W_v' },
    { id: 's2', text: 'Calcular scores de similitud: dot product entre Query y todas las Keys' },
    { id: 's3', text: 'Dividir scores por √d_k para estabilidad numérica' },
    { id: 's4', text: 'Aplicar softmax para convertir scores en pesos que suman 1' },
    { id: 's5', text: 'Calcular promedio ponderado de los Values usando los pesos de atención' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

const buildingGptExercise2: ConnectExercise = {
  id: 'building-gpt-2',
  type: 'connect',
  title: 'Componentes del Transformer y sus roles',
  instructions: 'Conecta cada componente del Transformer con su función principal.',
  conceptId: 'transformer-architecture',
  svgViewBox: '0 0 700 430',
  nodes: [
    // Left column — components
    { id: 'mha', label: 'Multi-Head Attention', x: 100, y: 50 },
    { id: 'ff', label: 'Feed-Forward Network', x: 100, y: 140 },
    { id: 'res', label: 'Residual Connection', x: 100, y: 230 },
    { id: 'pe', label: 'Positional Encoding', x: 100, y: 320 },
    // Right column — roles
    { id: 'perspectives', label: '8 perspectivas de atención en paralelo', x: 550, y: 50 },
    { id: 'interpret', label: 'Interpretar la info recopilada (512→2048→512)', x: 550, y: 140 },
    { id: 'safety', label: 'Red de seguridad: sumar entrada original', x: 550, y: 230 },
    { id: 'order', label: 'Codificar la posición de cada token', x: 550, y: 320 },
  ],
  correctConnections: [
    ['mha', 'perspectives'],
    ['ff', 'interpret'],
    ['res', 'safety'],
    ['pe', 'order'],
  ],
};

const buildingGptExercise3: SequenceExercise = {
  id: 'building-gpt-3',
  type: 'sequence',
  title: 'Pipeline completo del Transformer',
  instructions: 'Ordena los pasos desde el texto de entrada hasta la predicción de la siguiente palabra.',
  conceptId: 'transformer-architecture',
  steps: [
    { id: 's1', text: 'Tokenizar el texto y obtener IDs' },
    { id: 's2', text: 'Buscar embeddings + sumar positional encoding' },
    { id: 's3', text: 'Pasar por 6 bloques de (Attention → Residual → LayerNorm → FF → Residual → LayerNorm)' },
    { id: 's4', text: 'Tomar el vector de la última posición' },
    { id: 's5', text: 'Proyectar a 50,000 scores (uno por palabra del vocabulario) y aplicar softmax' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const buildingGptExercises = [buildingGptExercise1, buildingGptExercise2, buildingGptExercise3];
