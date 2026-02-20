import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * "The Tail at Scale" paper — 3 exercises
 */

const tailScaleExercise1: SequenceExercise = {
  id: 'tail-scale-1',
  type: 'sequence',
  title: 'Flujo de hedged requests con delay',
  instructions:
    'Ordena los pasos del flujo de hedged requests con delay, desde que el cliente envía el request hasta que obtiene la respuesta.',
  conceptId: 'hedged-requests',
  steps: [
    { id: 'h1', text: 'El cliente envía el request al servidor S1' },
    { id: 'h2', text: 'El cliente inicia un timer calibrado al p95 de latencia' },
    { id: 'h3', text: 'Si el timer expira sin respuesta, envía el mismo request a S2' },
    { id: 'h4', text: 'El cliente usa la primera respuesta que llegue (de S1 o S2)' },
    { id: 'h5', text: 'Cancela el request pendiente en el servidor que no respondió primero' },
  ],
  correctOrder: ['h1', 'h2', 'h3', 'h4', 'h5'],
};

const tailScaleExercise2: ConnectExercise = {
  id: 'tail-scale-2',
  type: 'connect',
  title: 'Causas de variabilidad → Técnica de mitigación',
  instructions:
    'Conecta cada causa de variabilidad con la técnica más adecuada para mitigarla.',
  conceptId: 'tail-latency',
  svgViewBox: '0 0 700 400',
  nodes: [
    // Left column: causes
    { id: 'gc', label: 'GC pauses', x: 100, y: 60 },
    { id: 'hotspot', label: 'Hot data', x: 100, y: 160 },
    { id: 'slow-server', label: 'Servidor lento', x: 100, y: 260 },
    { id: 'bad-request', label: 'Request patológico', x: 100, y: 360 },
    // Right column: techniques
    { id: 'hedge', label: 'Hedged requests', x: 600, y: 60 },
    { id: 'selective-rep', label: 'Selective replication', x: 600, y: 160 },
    { id: 'probation', label: 'Probation', x: 600, y: 260 },
    { id: 'canary', label: 'Canary requests', x: 600, y: 360 },
  ],
  correctConnections: [
    ['gc', 'probation'],
    ['hotspot', 'selective-rep'],
    ['slow-server', 'hedge'],
    ['bad-request', 'canary'],
  ],
};

const tailScaleExercise3: SequenceExercise = {
  id: 'tail-scale-3',
  type: 'sequence',
  title: 'Flujo de canary requests',
  instructions:
    'Ordena los pasos del flujo de canary requests para proteger un sistema con alto fan-out.',
  conceptId: 'fan-out-latency',
  steps: [
    { id: 'c1', text: 'Recibir request R del usuario' },
    { id: 'c2', text: 'Seleccionar un servidor como canary y enviar R' },
    { id: 'c3', text: 'Verificar que el canary responda normalmente (latencia < threshold, sin error)' },
    { id: 'c4', text: 'Enviar R a los demás servidores en paralelo' },
    { id: 'c5', text: 'Agregar resultados y retornar respuesta al usuario' },
  ],
  correctOrder: ['c1', 'c2', 'c3', 'c4', 'c5'],
};

export const tailAtScaleExercises = [
  tailScaleExercise1,
  tailScaleExercise2,
  tailScaleExercise3,
];
