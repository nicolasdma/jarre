import type { SequenceExercise, ConnectExercise, LabelExercise } from '@/types';

/**
 * kz2h-micrograd — 5 exercises
 *
 * Exercise 1 (sequence): Training loop steps — backpropagation-training
 * Exercise 2 (connect): Operations → their backward rules — backpropagation-training
 * Exercise 3 (sequence): Building an MLP from primitives — neural-network-fundamentals
 * Exercise 4 (label): Anatomy of a neuron — neural-network-fundamentals
 * Exercise 5 (connect): Training problems → solutions — backpropagation-training
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

const microgradExercise4: LabelExercise = {
  id: 'micrograd-4',
  type: 'label',
  title: 'Anatomía de una neurona',
  instructions: 'Arrastra cada etiqueta a la zona correcta del diagrama de una neurona.',
  conceptId: 'neural-network-fundamentals',
  svgViewBox: '0 0 700 200',
  svgElements: `
    <line x1="30" y1="60" x2="160" y2="100" stroke="#ccc" stroke-width="1.5"/>
    <line x1="30" y1="100" x2="160" y2="100" stroke="#ccc" stroke-width="1.5"/>
    <line x1="30" y1="140" x2="160" y2="100" stroke="#ccc" stroke-width="1.5"/>
    <circle cx="30" cy="60" r="8" fill="#991b1b" opacity="0.2" stroke="#991b1b"/>
    <circle cx="30" cy="100" r="8" fill="#991b1b" opacity="0.2" stroke="#991b1b"/>
    <circle cx="30" cy="140" r="8" fill="#991b1b" opacity="0.2" stroke="#991b1b"/>
    <text x="120" y="80" font-size="10" fill="#888">w·x</text>
    <rect x="160" y="75" width="80" height="50" rx="4" fill="#f5f5f0" stroke="#ccc"/>
    <text x="185" y="105" font-size="11" fill="#555" text-anchor="middle">Σ + b</text>
    <line x1="240" y1="100" x2="350" y2="100" stroke="#ccc" stroke-width="1.5"/>
    <rect x="350" y="75" width="80" height="50" rx="4" fill="#991b1b" opacity="0.1" stroke="#991b1b"/>
    <text x="390" y="105" font-size="11" fill="#991b1b" text-anchor="middle">tanh</text>
    <line x1="430" y1="100" x2="530" y2="100" stroke="#ccc" stroke-width="1.5"/>
    <circle cx="560" cy="100" r="8" fill="#8b7355" opacity="0.2" stroke="#8b7355"/>
  `,
  zones: [
    { id: 'z1', x: 5, y: 40, width: 60, height: 120, correctLabel: 'Inputs (x)' },
    { id: 'z2', x: 90, y: 60, width: 70, height: 40, correctLabel: 'Pesos (w)' },
    { id: 'z3', x: 160, y: 70, width: 80, height: 60, correctLabel: 'Σ(w·x) + b' },
    { id: 'z4', x: 350, y: 70, width: 80, height: 60, correctLabel: 'Activación (tanh)' },
    { id: 'z5', x: 530, y: 80, width: 60, height: 40, correctLabel: 'Salida' },
  ],
  labels: ['Inputs (x)', 'Pesos (w)', 'Σ(w·x) + b', 'Activación (tanh)', 'Salida'],
};

const microgradExercise5: ConnectExercise = {
  id: 'micrograd-5',
  type: 'connect',
  title: 'Problemas del training → Soluciones',
  instructions: 'Conecta cada problema del entrenamiento con su solución correspondiente.',
  conceptId: 'backpropagation-training',
  svgViewBox: '0 0 700 280',
  nodes: [
    // Left column — problems
    { id: 'vanishing', label: 'Vanishing gradients', x: 100, y: 50 },
    { id: 'accumulation', label: 'Gradientes acumulados entre epochs', x: 100, y: 140 },
    { id: 'divergence', label: 'Loss diverge (oscila y sube)', x: 100, y: 230 },
    // Right column — solutions
    { id: 'relu', label: 'Usar ReLU en vez de sigmoid/tanh', x: 550, y: 50 },
    { id: 'zero_grad', label: 'Llamar zero_grad() antes de backward()', x: 550, y: 140 },
    { id: 'reduce_lr', label: 'Reducir el learning rate', x: 550, y: 230 },
  ],
  correctConnections: [
    ['vanishing', 'relu'],
    ['accumulation', 'zero_grad'],
    ['divergence', 'reduce_lr'],
  ],
};

export const microgradExercises = [microgradExercise1, microgradExercise2, microgradExercise3, microgradExercise4, microgradExercise5];
