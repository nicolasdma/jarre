import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * kz2h-micrograd — 3 exercises
 *
 * Exercise 1 (sequence): Training loop steps — backpropagation-training
 * Exercise 2 (connect): Operations → their backward rules — backpropagation-training
 * Exercise 3 (sequence): Building an MLP from primitives — neural-network-fundamentals
 */

const microgradExercise1: SequenceExercise = {
  id: 'micrograd-1',
  type: 'sequence',
  title: 'Pasos del training loop',
  instructions: 'Ordena los pasos de un ciclo de entrenamiento en el orden correcto, tal como se implementan en micrograd.',
  conceptId: 'backpropagation-training',
  steps: [
    { id: 's1', text: 'Forward pass: calcular las predicciones del modelo' },
    { id: 's2', text: 'Calcular la función de pérdida (loss)' },
    { id: 's3', text: 'Llamar loss.backward() para calcular gradientes' },
    { id: 's4', text: 'Actualizar cada parámetro: p.data -= learning_rate × p.grad' },
    { id: 's5', text: 'Llamar zero_grad() para limpiar gradientes acumulados' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

const microgradExercise2: ConnectExercise = {
  id: 'micrograd-2',
  type: 'connect',
  title: 'Operaciones y sus reglas de backpropagation',
  instructions: 'Conecta cada operación con su regla local de gradiente (cómo distribuye dL/dz a sus entradas).',
  conceptId: 'backpropagation-training',
  svgViewBox: '0 0 700 340',
  nodes: [
    // Left column — operations
    { id: 'add', label: 'z = a + b', x: 100, y: 50 },
    { id: 'mul', label: 'z = a × b', x: 100, y: 140 },
    { id: 'tanh', label: 'z = tanh(a)', x: 100, y: 230 },
    // Right column — gradient rules
    { id: 'pass', label: 'dL/da = dL/dz, dL/db = dL/dz', x: 550, y: 50 },
    { id: 'cross', label: 'dL/da = b·dL/dz, dL/db = a·dL/dz', x: 550, y: 140 },
    { id: 'sq', label: 'dL/da = (1 - z²)·dL/dz', x: 550, y: 230 },
  ],
  correctConnections: [
    ['add', 'pass'],
    ['mul', 'cross'],
    ['tanh', 'sq'],
  ],
};

const microgradExercise3: SequenceExercise = {
  id: 'micrograd-3',
  type: 'sequence',
  title: 'Construcción de un MLP desde primitivas',
  instructions: 'Ordena los pasos para construir un MLP (Multi-Layer Perceptron) en micrograd, desde lo más básico hasta la red completa.',
  conceptId: 'neural-network-fundamentals',
  steps: [
    { id: 's1', text: 'Definir la clase Value con operaciones (+, ×, tanh) y autograd' },
    { id: 's2', text: 'Crear una Neuron: producto punto (w·x) + sesgo, seguido de tanh' },
    { id: 's3', text: 'Agrupar neuronas en una Layer (misma entrada, múltiples salidas)' },
    { id: 's4', text: 'Apilar capas en un MLP (salida de una capa → entrada de la siguiente)' },
    { id: 's5', text: 'Definir la loss function y ejecutar el training loop' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const microgradExercises = [microgradExercise1, microgradExercise2, microgradExercise3];
