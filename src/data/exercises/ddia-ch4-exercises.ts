import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * Ch4: Encoding and Evolution — 3 exercises
 */

export const ch4Exercise1: SequenceExercise = {
  id: 'ddia-4.1',
  type: 'sequence',
  title: 'Evolución de schema en Protocol Buffers',
  instructions: 'Ordena los pasos para agregar un campo nuevo de forma compatible.',
  conceptId: 'schema-evolution',
  steps: [
    { id: 's1', text: 'Definir el campo nuevo con un tag number único no usado' },
    { id: 's2', text: 'Marcar el campo como optional (no required)' },
    { id: 's3', text: 'Desplegar el código nuevo que escribe el campo' },
    { id: 's4', text: 'Código viejo encuentra tag desconocido y lo ignora (forward compatibility)' },
    { id: 's5', text: 'Código nuevo lee datos viejos sin el campo y usa el valor por defecto (backward compatibility)' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const ch4Exercise2: ConnectExercise = {
  id: 'ddia-4.2',
  type: 'connect',
  title: 'Modos de dataflow',
  instructions: 'Conecta cada modo de flujo de datos con su característica principal.',
  conceptId: 'dataflow-modes',
  svgViewBox: '0 0 600 350',
  nodes: [
    { id: 'db', label: 'Via Base de Datos', x: 100, y: 50 },
    { id: 'rest', label: 'Via REST/RPC', x: 300, y: 50 },
    { id: 'msg', label: 'Via Message Broker', x: 500, y: 50 },
    { id: 'future', label: 'Mensaje a tu yo futuro', x: 100, y: 280 },
    { id: 'sync', label: 'Síncrono cliente-servidor', x: 300, y: 280 },
    { id: 'async', label: 'Asíncrono con buffer', x: 500, y: 280 },
  ],
  correctConnections: [
    ['db', 'future'],
    ['rest', 'sync'],
    ['msg', 'async'],
  ],
};

export const ch4Exercise3: SequenceExercise = {
  id: 'ddia-4.3',
  type: 'sequence',
  title: 'Decodificación con Avro',
  instructions: 'Ordena los pasos para decodificar un registro Avro cuando writer y reader tienen schemas diferentes.',
  conceptId: 'avro',
  steps: [
    { id: 'a1', text: 'El reader obtiene el writer\'s schema (del archivo, schema registry, o negociación)' },
    { id: 'a2', text: 'Avro compara writer\'s schema y reader\'s schema campo por campo' },
    { id: 'a3', text: 'Campos presentes en ambos se decodifican normalmente' },
    { id: 'a4', text: 'Campos del writer ausentes en el reader se ignoran' },
    { id: 'a5', text: 'Campos del reader ausentes en el writer se rellenan con el valor por defecto' },
  ],
  correctOrder: ['a1', 'a2', 'a3', 'a4', 'a5'],
};

export const ch4Exercises = [ch4Exercise1, ch4Exercise2, ch4Exercise3];
