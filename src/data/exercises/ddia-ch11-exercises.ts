import type { SequenceExercise, LabelExercise, ConnectExercise } from '@/types';

/**
 * Ch11: Stream Processing — 3 exercises
 */

export const ch11Exercise1: SequenceExercise = {
  id: 'ddia-11.1',
  type: 'sequence',
  title: 'Flujo de Change Data Capture (CDC)',
  instructions: 'Ordena los pasos del flujo de Change Data Capture desde la escritura original hasta la actualización de la vista derivada.',
  conceptId: 'databases-streams',
  steps: [
    { id: 'c1', text: 'La aplicación escribe un registro en la base de datos primaria' },
    { id: 'c2', text: 'La base de datos persiste el cambio en el Write-Ahead Log (WAL)' },
    { id: 'c3', text: 'El conector CDC lee los cambios del WAL en orden' },
    { id: 'c4', text: 'El evento de cambio se publica como mensaje en un topic de Kafka' },
    { id: 'c5', text: 'El consumidor procesa el evento y actualiza la vista derivada' },
  ],
  correctOrder: ['c1', 'c2', 'c3', 'c4', 'c5'],
};

export const ch11Exercise2: LabelExercise = {
  id: 'ddia-11.2',
  type: 'label',
  title: 'Arquitectura de log-based message broker (Kafka)',
  instructions: 'Arrastra las etiquetas correctas a cada zona del diagrama de arquitectura de Kafka.',
  conceptId: 'stream-processing',
  svgViewBox: '0 0 600 400',
  svgElements: `
    <rect x="20" y="60" width="100" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="20" y="130" width="100" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="180" y="30" width="240" height="240" rx="8" fill="none" stroke="var(--j-accent)" stroke-width="2"/>
    <rect x="200" y="70" width="200" height="50" rx="4" fill="none" stroke="var(--j-border)" stroke-width="1.5"/>
    <rect x="200" y="130" width="200" height="50" rx="4" fill="none" stroke="var(--j-border)" stroke-width="1.5"/>
    <rect x="200" y="190" width="200" height="50" rx="4" fill="none" stroke="var(--j-border)" stroke-width="1.5"/>
    <rect x="470" y="60" width="110" height="50" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2" stroke-dasharray="5,5"/>
    <rect x="470" y="130" width="110" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="470" y="200" width="110" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <line x1="120" y1="85" x2="180" y2="85" stroke="var(--j-accent)" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="120" y1="155" x2="180" y2="155" stroke="var(--j-accent)" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="420" y1="95" x2="470" y2="85" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrow)"/>
    <line x1="420" y1="155" x2="470" y2="155" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrow)"/>
    <line x1="420" y1="215" x2="470" y2="225" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="525" y="330" text-anchor="middle" font-size="11" fill="var(--j-warm)">offset: 42</text>
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-accent)"/></marker></defs>
  `,
  zones: [
    { id: 'z1', x: 20, y: 20, width: 100, height: 28, correctLabel: 'Producers' },
    { id: 'z2', x: 240, y: 2, width: 120, height: 28, correctLabel: 'Topic' },
    { id: 'z3', x: 205, y: 75, width: 90, height: 28, correctLabel: 'Partición 0' },
    { id: 'z4', x: 205, y: 135, width: 90, height: 28, correctLabel: 'Partición 1' },
    { id: 'z5', x: 205, y: 195, width: 90, height: 28, correctLabel: 'Partición 2' },
    { id: 'z6', x: 470, y: 20, width: 110, height: 28, correctLabel: 'Consumer Group' },
    { id: 'z7', x: 475, y: 115, width: 100, height: 28, correctLabel: 'Consumer A' },
    { id: 'z8', x: 475, y: 185, width: 100, height: 28, correctLabel: 'Consumer B' },
    { id: 'z9', x: 475, y: 290, width: 100, height: 28, correctLabel: 'Offset' },
  ],
  labels: [
    'Producers', 'Topic', 'Partición 0', 'Partición 1', 'Partición 2',
    'Consumer Group', 'Consumer A', 'Consumer B', 'Offset',
  ],
};

export const ch11Exercise3: ConnectExercise = {
  id: 'ddia-11.3',
  type: 'connect',
  title: 'Tipos de stream joins',
  instructions: 'Conecta cada fuente de datos con el tipo de join correspondiente según la naturaleza de las entradas.',
  conceptId: 'processing-streams',
  svgViewBox: '0 0 600 350',
  nodes: [
    { id: 'streamA', label: 'Stream A (eventos)', x: 80, y: 50 },
    { id: 'streamB', label: 'Stream B (eventos)', x: 80, y: 175 },
    { id: 'tableC', label: 'Table C (estado)', x: 80, y: 300 },
    { id: 'ssJoin', label: 'Stream-Stream Join', x: 460, y: 50 },
    { id: 'stJoin', label: 'Stream-Table Join', x: 460, y: 175 },
    { id: 'ttJoin', label: 'Table-Table Join', x: 460, y: 300 },
  ],
  correctConnections: [
    ['streamA', 'ssJoin'],
    ['streamB', 'ssJoin'],
    ['streamA', 'stJoin'],
    ['tableC', 'stJoin'],
    ['tableC', 'ttJoin'],
  ],
};

export const ch11Exercises = [ch11Exercise1, ch11Exercise2, ch11Exercise3];
