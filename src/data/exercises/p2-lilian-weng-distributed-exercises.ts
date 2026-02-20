import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * "How to Train Really Large Models on Many GPUs?" — 3 exercises
 */

const distributedExercise1: SequenceExercise = {
  id: 'p2-lilian-weng-distributed.1',
  type: 'sequence',
  title: 'Flujo de Data Parallelism con AllReduce',
  instructions:
    'Ordena los pasos del entrenamiento con Data Parallelism sincronico (BSP), desde la distribucion del batch hasta la actualizacion de pesos.',
  conceptId: 'data-parallelism',
  steps: [
    { id: 'dp1', text: 'El minibatch global se divide en fragmentos iguales, uno por GPU' },
    { id: 'dp2', text: 'Cada GPU ejecuta el forward pass con su fragmento de datos' },
    { id: 'dp3', text: 'Cada GPU ejecuta el backward pass y calcula gradientes locales' },
    { id: 'dp4', text: 'Se ejecuta AllReduce para promediar los gradientes entre todas las GPUs' },
    { id: 'dp5', text: 'Cada GPU actualiza sus pesos locales con el gradiente promediado' },
  ],
  correctOrder: ['dp1', 'dp2', 'dp3', 'dp4', 'dp5'],
};

const distributedExercise2: ConnectExercise = {
  id: 'p2-lilian-weng-distributed.2',
  type: 'connect',
  title: 'Tipo de paralelismo → Que se particiona',
  instructions:
    'Conecta cada tipo de paralelismo con lo que se divide entre GPUs.',
  conceptId: 'distributed-training',
  svgViewBox: '0 0 700 400',
  nodes: [
    // Left column: parallelism types
    { id: 'dp', label: 'Data Parallelism', x: 100, y: 60 },
    { id: 'pp', label: 'Pipeline Parallelism', x: 100, y: 160 },
    { id: 'tp', label: 'Tensor Parallelism', x: 100, y: 260 },
    { id: 'moe', label: 'Mixture-of-Experts', x: 100, y: 360 },
    // Right column: what is partitioned
    { id: 'data', label: 'Datos de entrenamiento', x: 600, y: 60 },
    { id: 'layers', label: 'Capas del modelo', x: 600, y: 160 },
    { id: 'matrices', label: 'Matrices dentro de una capa', x: 600, y: 260 },
    { id: 'tokens', label: 'Tokens entre experts', x: 600, y: 360 },
  ],
  correctConnections: [
    ['dp', 'data'],
    ['pp', 'layers'],
    ['tp', 'matrices'],
    ['moe', 'tokens'],
  ],
};

const distributedExercise3: SequenceExercise = {
  id: 'p2-lilian-weng-distributed.3',
  type: 'sequence',
  title: 'Flujo de Pipeline Parallelism (GPipe)',
  instructions:
    'Ordena los pasos del entrenamiento con Pipeline Parallelism estilo GPipe, desde la division del minibatch hasta la actualizacion de pesos.',
  conceptId: 'distributed-training',
  steps: [
    { id: 'pp1', text: 'El minibatch se divide en m microbatches' },
    { id: 'pp2', text: 'Cada microbatch fluye por las stages del pipeline (forward pass secuencial)' },
    { id: 'pp3', text: 'Se acumulan gradientes de todos los microbatches sin actualizar pesos' },
    { id: 'pp4', text: 'Se ejecuta el backward pass para todos los microbatches en orden inverso' },
    { id: 'pp5', text: 'Se sincronizan y aplican los gradientes acumulados a los pesos' },
  ],
  correctOrder: ['pp1', 'pp2', 'pp3', 'pp4', 'pp5'],
};

export const p2LilianWengDistributedExercises = [
  distributedExercise1,
  distributedExercise2,
  distributedExercise3,
];
