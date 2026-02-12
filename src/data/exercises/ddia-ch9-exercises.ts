import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * Ch9: Consistency & Consensus — 2 exercises
 */

export const ch9Exercise1: SequenceExercise = {
  id: 'ddia-9.1',
  type: 'sequence',
  title: 'Two-phase commit (2PC)',
  instructions: 'Ordena los pasos del protocolo two-phase commit.',
  conceptId: 'consensus',
  steps: [
    { id: 't1', text: 'El coordinador envía PREPARE a todos los participantes' },
    { id: 't2', text: 'Cada participante evalúa si puede commitear y responde YES/NO' },
    { id: 't3', text: 'El coordinador decide COMMIT (si todos YES) o ABORT' },
    { id: 't4', text: 'El coordinador escribe la decisión en su log (point of no return)' },
    { id: 't5', text: 'El coordinador envía la decisión a todos los participantes' },
  ],
  correctOrder: ['t1', 't2', 't3', 't4', 't5'],
};

export const ch9Exercise2: ConnectExercise = {
  id: 'ddia-9.2',
  type: 'connect',
  title: 'Flujo de elección Raft',
  instructions: 'Conecta los nodos para mostrar el flujo de una elección de líder en Raft.',
  conceptId: 'consensus',
  svgViewBox: '0 0 600 350',
  nodes: [
    { id: 'candidate', label: 'Candidato', x: 300, y: 50 },
    { id: 'f1', label: 'Follower 1', x: 100, y: 200 },
    { id: 'f2', label: 'Follower 2', x: 300, y: 200 },
    { id: 'f3', label: 'Follower 3', x: 500, y: 200 },
    { id: 'leader', label: 'Nuevo Líder', x: 300, y: 320 },
  ],
  correctConnections: [
    ['candidate', 'f1'],
    ['candidate', 'f2'],
    ['candidate', 'f3'],
    ['candidate', 'leader'],
  ],
};

export const ch9Exercises = [ch9Exercise1, ch9Exercise2];
