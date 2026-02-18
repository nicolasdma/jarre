import type { ConnectExercise, LabelExercise, SequenceExercise } from '@/types';

/**
 * Ch6: Partitioning — 3 exercises
 */

const ch6Exercise1: ConnectExercise = {
  id: 'ddia-6.1',
  type: 'connect',
  title: 'Flujo de request routing',
  instructions: 'Conecta los nodos para mostrar cómo una petición de lectura llega a la partición correcta.',
  conceptId: 'partitioning',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'client', label: 'Cliente', x: 80, y: 50 },
    { id: 'router', label: 'Routing tier', x: 300, y: 50 },
    { id: 'zk', label: 'ZooKeeper', x: 300, y: 200 },
    { id: 'p1', label: 'Partición 1', x: 100, y: 350 },
    { id: 'p2', label: 'Partición 2', x: 300, y: 350 },
    { id: 'p3', label: 'Partición 3', x: 500, y: 350 },
  ],
  correctConnections: [
    ['client', 'router'],
    ['router', 'zk'],
    ['router', 'p2'],
  ],
};

const ch6Exercise2: LabelExercise = {
  id: 'ddia-6.2',
  type: 'label',
  title: 'Consistent hashing ring',
  instructions: 'Etiqueta los elementos del anillo de consistent hashing.',
  conceptId: 'partitioning',
  svgViewBox: '0 0 400 400',
  svgElements: `
    <circle cx="200" cy="200" r="150" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <circle cx="200" cy="50" r="8" fill="var(--j-accent)"/>
    <circle cx="350" cy="200" r="8" fill="var(--j-accent)"/>
    <circle cx="200" cy="350" r="8" fill="var(--j-accent)"/>
    <circle cx="50" cy="200" r="8" fill="var(--j-accent)"/>
    <circle cx="305" cy="95" r="6" fill="var(--j-warm)"/>
    <circle cx="130" cy="320" r="6" fill="var(--j-warm)"/>
  `,
  zones: [
    { id: 'z1', x: 170, y: 10, width: 80, height: 28, correctLabel: 'Nodo A' },
    { id: 'z2', x: 355, y: 188, width: 80, height: 28, correctLabel: 'Nodo B' },
    { id: 'z3', x: 170, y: 358, width: 80, height: 28, correctLabel: 'Nodo C' },
    { id: 'z4', x: -30, y: 188, width: 80, height: 28, correctLabel: 'Nodo D' },
    { id: 'z5', x: 315, y: 70, width: 80, height: 28, correctLabel: 'Key k1' },
    { id: 'z6', x: 90, y: 330, width: 80, height: 28, correctLabel: 'Key k2' },
  ],
  labels: ['Nodo A', 'Nodo B', 'Nodo C', 'Nodo D', 'Key k1', 'Key k2'],
};

const ch6Exercise3: SequenceExercise = {
  id: 'ddia-6.3',
  type: 'sequence',
  title: 'Rebalanceo de particiones',
  instructions: 'Ordena los pasos del proceso de rebalanceo de particiones.',
  conceptId: 'partitioning',
  steps: [
    { id: 'r1', text: 'Se agrega un nuevo nodo al cluster' },
    { id: 'r2', text: 'El coordinador asigna particiones al nuevo nodo' },
    { id: 'r3', text: 'Se copian los datos de las particiones al nuevo nodo' },
    { id: 'r4', text: 'El routing se actualiza para apuntar al nuevo nodo' },
    { id: 'r5', text: 'Los datos antiguos se eliminan del nodo original' },
  ],
  correctOrder: ['r1', 'r2', 'r3', 'r4', 'r5'],
};

export const ch6Exercises = [ch6Exercise1, ch6Exercise2, ch6Exercise3];
