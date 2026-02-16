import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * Scaling Laws for Neural Language Models (Kaplan et al., 2020) — 3 exercises
 */

export const scalingExercise1: ConnectExercise = {
  id: 'scaling.1',
  type: 'connect',
  title: 'Variables de scaling y sus relaciones',
  instructions: 'Conecta cada variable de scaling con su función de pérdida correspondiente.',
  conceptId: 'scaling-laws',
  svgViewBox: '0 0 600 350',
  nodes: [
    { id: 'n', label: 'Model Size (N)', x: 100, y: 60 },
    { id: 'd', label: 'Dataset Size (D)', x: 300, y: 60 },
    { id: 'c', label: 'Compute (C)', x: 500, y: 60 },
    { id: 'ln', label: 'Loss L(N)', x: 100, y: 280 },
    { id: 'ld', label: 'Loss L(D)', x: 300, y: 280 },
    { id: 'lc', label: 'Loss L(C)', x: 500, y: 280 },
  ],
  correctConnections: [
    ['n', 'ln'],
    ['d', 'ld'],
    ['c', 'lc'],
  ],
};

export const scalingExercise2: SequenceExercise = {
  id: 'scaling.2',
  type: 'sequence',
  title: 'Compute-optimal training (Kaplan)',
  instructions: 'Ordena los pasos de la estrategia de entrenamiento compute-optimal según Kaplan et al.',
  conceptId: 'compute-optimal-training',
  steps: [
    { id: 'k1', text: 'Fijar el presupuesto de cómputo C disponible' },
    { id: 'k2', text: 'Calcular el tamaño óptimo del modelo N \u221D C^0.73' },
    { id: 'k3', text: 'Determinar D con el presupuesto restante (modelo grande, datos moderados)' },
    { id: 'k4', text: 'Entrenar el modelo priorizando tamaño sobre datos' },
    { id: 'k5', text: 'Detener antes de convergencia total (early stopping)' },
  ],
  correctOrder: ['k1', 'k2', 'k3', 'k4', 'k5'],
};

export const scalingExercise3: SequenceExercise = {
  id: 'scaling.3',
  type: 'sequence',
  title: 'Revisión Chinchilla: corrigiendo Kaplan',
  instructions: 'Ordena los pasos de cómo Chinchilla corrigió las leyes de escalamiento de Kaplan.',
  conceptId: 'compute-optimal-training',
  steps: [
    { id: 'c1', text: 'Observar que los LLMs existentes están sub-entrenados (pocos datos para su tamaño)' },
    { id: 'c2', text: 'Experimentar con escalamiento balanceado entre N y D' },
    { id: 'c3', text: 'Descubrir que N_opt \u221D C^0.50 (no C^0.73 como Kaplan)' },
    { id: 'c4', text: 'Entrenar Chinchilla: 70B parámetros con 1.4T tokens' },
    { id: 'c5', text: 'Superar a Gopher (280B) con 4x menos parámetros' },
  ],
  correctOrder: ['c1', 'c2', 'c3', 'c4', 'c5'],
};

export const scalingLawsExercises = [scalingExercise1, scalingExercise2, scalingExercise3];
