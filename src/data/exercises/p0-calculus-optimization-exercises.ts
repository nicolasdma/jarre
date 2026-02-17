import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * P0: Calculus & Optimization — 3 exercises
 */

export const p0CoExercise1: SequenceExercise = {
  id: 'p0-co.1',
  type: 'sequence',
  title: 'Pasos de backpropagation',
  instructions:
    'Ordena los pasos del algoritmo de backpropagation para una red neuronal.',
  conceptId: 'calculus-optimization',
  steps: [
    { id: 's1', text: 'Forward pass: propagar la entrada a través de todas las capas' },
    { id: 's2', text: 'Calcular la loss comparando la salida con el target' },
    { id: 's3', text: 'Backward pass: calcular gradientes en la capa de salida' },
    { id: 's4', text: 'Propagar gradientes hacia atrás usando chain rule en capas ocultas' },
    { id: 's5', text: 'Actualizar los pesos usando los gradientes acumulados' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0CoExercise2: ConnectExercise = {
  id: 'p0-co.2',
  type: 'connect',
  title: 'Optimizadores y su característica clave',
  instructions:
    'Conecta cada optimizador con la propiedad que lo distingue.',
  conceptId: 'calculus-optimization',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'sgd', label: 'SGD', x: 80, y: 50 },
    { id: 'momentum', label: 'Momentum', x: 80, y: 150 },
    { id: 'adam', label: 'Adam', x: 80, y: 250 },
    { id: 'adagrad', label: 'AdaGrad', x: 80, y: 350 },
    { id: 'constant-lr', label: 'Learning rate constante', x: 480, y: 50 },
    { id: 'velocity', label: 'Acumulación de velocidad', x: 480, y: 150 },
    { id: 'adaptive-lr', label: 'LR adaptativo por parámetro', x: 480, y: 250 },
    { id: 'squared-grad', label: 'Gradientes cuadrados acumulados', x: 480, y: 350 },
  ],
  correctConnections: [
    ['sgd', 'constant-lr'],
    ['momentum', 'velocity'],
    ['adam', 'adaptive-lr'],
    ['adagrad', 'squared-grad'],
  ],
};

export const p0CoExercise3: SequenceExercise = {
  id: 'p0-co.3',
  type: 'sequence',
  title: 'Pasos del update de Adam',
  instructions:
    'Ordena los pasos que ejecuta el optimizador Adam en cada iteración.',
  conceptId: 'calculus-optimization',
  steps: [
    { id: 's1', text: 'Calcular el gradiente g_t de la loss respecto a los parámetros' },
    { id: 's2', text: 'Actualizar la estimación del primer momento: m_t = β₁·m_{t-1} + (1-β₁)·g_t' },
    { id: 's3', text: 'Actualizar la estimación del segundo momento: v_t = β₂·v_{t-1} + (1-β₂)·g_t²' },
    { id: 's4', text: 'Corregir el sesgo: m̂_t = m_t/(1-β₁^t), v̂_t = v_t/(1-β₂^t)' },
    { id: 's5', text: 'Actualizar parámetros: θ_t = θ_{t-1} - α·m̂_t / (√v̂_t + ε)' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0CalculusOptimizationExercises = [
  p0CoExercise1,
  p0CoExercise2,
  p0CoExercise3,
];
