import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * Ch7: Transactions — 3 exercises
 */

export const ch7Exercise1: SequenceExercise = {
  id: 'ddia-7.1',
  type: 'sequence',
  title: 'Anomalía de write skew (doctores de guardia)',
  instructions: 'Ordena los pasos que llevan a la anomalía de write skew.',
  conceptId: 'write-skew',
  steps: [
    { id: 'w1', text: 'Alice y Bob están de guardia (2 doctores activos)' },
    { id: 'w2', text: 'Alice verifica: ¿hay ≥ 2 de guardia? Sí → puede retirarse' },
    { id: 'w3', text: 'Bob verifica: ¿hay ≥ 2 de guardia? Sí → puede retirarse' },
    { id: 'w4', text: 'Alice actualiza su registro: on_call = false' },
    { id: 'w5', text: 'Bob actualiza su registro: on_call = false' },
    { id: 'w6', text: 'Resultado: 0 doctores de guardia — invariante violado' },
  ],
  correctOrder: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'],
};

export const ch7Exercise2: ConnectExercise = {
  id: 'ddia-7.2',
  type: 'connect',
  title: 'Niveles de aislamiento y anomalías',
  instructions: 'Conecta cada nivel de aislamiento con la anomalía más severa que PERMITE.',
  conceptId: 'weak-isolation',
  svgViewBox: '0 0 600 350',
  nodes: [
    { id: 'rc', label: 'Read Committed', x: 100, y: 50 },
    { id: 'si', label: 'Snapshot Isolation', x: 300, y: 50 },
    { id: 'ser', label: 'Serializable', x: 500, y: 50 },
    { id: 'rs', label: 'Read skew', x: 100, y: 280 },
    { id: 'ws', label: 'Write skew', x: 300, y: 280 },
    { id: 'none', label: 'Ninguna anomalía', x: 500, y: 280 },
  ],
  correctConnections: [
    ['rc', 'rs'],
    ['si', 'ws'],
    ['ser', 'none'],
  ],
};

export const ch7Exercise3: SequenceExercise = {
  id: 'ddia-7.3',
  type: 'sequence',
  title: 'SSI: detección optimista de conflictos',
  instructions: 'Ordena los pasos del Serializable Snapshot Isolation (SSI).',
  conceptId: 'serializability',
  steps: [
    { id: 's1', text: 'La transacción comienza y lee de un snapshot MVCC (como snapshot isolation)' },
    { id: 's2', text: 'La transacción ejecuta lecturas y escrituras sin bloquear a nadie' },
    { id: 's3', text: 'La transacción intenta commitear' },
    { id: 's4', text: 'La DB verifica: ¿se leyeron datos que otra transacción ya modificó?' },
    { id: 's5', text: 'Si hay conflicto → ABORT y la aplicación reintenta' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const ch7Exercises = [ch7Exercise1, ch7Exercise2, ch7Exercise3];
