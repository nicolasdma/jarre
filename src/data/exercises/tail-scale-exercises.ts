import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * The Tail at Scale (Dean & Barroso, 2013) — 3 exercises
 */

export const tailScaleExercise1: SequenceExercise = {
  id: 'tail-scale.1',
  type: 'sequence',
  title: 'Hedged requests con delay',
  instructions: 'Ordena los pasos de una hedged request con delay para mitigar tail latency.',
  conceptId: 'hedged-requests',
  steps: [
    { id: 'h1', text: 'Enviar request primario a la réplica elegida' },
    { id: 'h2', text: 'Esperar un umbral de tiempo T sin respuesta' },
    { id: 'h3', text: 'Enviar request de respaldo a una réplica diferente' },
    { id: 'h4', text: 'Llega la primera respuesta (de cualquier réplica)' },
    { id: 'h5', text: 'Cancelar el otro request pendiente' },
  ],
  correctOrder: ['h1', 'h2', 'h3', 'h4', 'h5'],
};

export const tailScaleExercise2: ConnectExercise = {
  id: 'tail-scale.2',
  type: 'connect',
  title: 'Fan-out y tail latency amplification',
  instructions: 'Conecta los nodos para mostrar cómo un solo servidor lento (GC pause) retrasa toda la respuesta en un fan-out.',
  conceptId: 'fan-out-latency',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'user', label: 'User Request', x: 300, y: 30 },
    { id: 'router', label: 'Router', x: 300, y: 120 },
    { id: 'srv1', label: 'Server 1 (2ms)', x: 100, y: 220 },
    { id: 'srv2', label: 'Server 2 (3ms)', x: 300, y: 220 },
    { id: 'srv3', label: 'Server 3 (GC: 800ms)', x: 500, y: 220 },
    { id: 'agg', label: 'Aggregator', x: 300, y: 310 },
    { id: 'resp', label: 'Response (800ms)', x: 300, y: 380 },
  ],
  correctConnections: [
    ['user', 'router'],
    ['router', 'srv1'],
    ['router', 'srv2'],
    ['router', 'srv3'],
    ['srv1', 'agg'],
    ['srv2', 'agg'],
    ['srv3', 'agg'],
    ['agg', 'resp'],
  ],
};

export const tailScaleExercise3: SequenceExercise = {
  id: 'tail-scale.3',
  type: 'sequence',
  title: 'Latency-induced probation',
  instructions: 'Ordena los pasos del mecanismo de probation inducido por latencia.',
  conceptId: 'tail-latency',
  steps: [
    { id: 'p1', text: 'Un servidor comienza a responder lentamente (spike de latencia)' },
    { id: 'p2', text: 'El sistema detecta el spike y marca al servidor' },
    { id: 'p3', text: 'El servidor es removido del pool activo (probation)' },
    { id: 'p4', text: 'Recibe tráfico reducido y su rendimiento se recupera' },
    { id: 'p5', text: 'El servidor es reintroducido gradualmente al pool activo' },
  ],
  correctOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
};

export const tailScaleExercises = [tailScaleExercise1, tailScaleExercise2, tailScaleExercise3];
