import type { SequenceExercise, LabelExercise } from '@/types';

/**
 * Ch5: Replication — 3 exercises
 */

export const ch5Exercise1: SequenceExercise = {
  id: 'ddia-5.1',
  type: 'sequence',
  title: 'Pasos de replicación líder-seguidor',
  instructions: 'Ordena los pasos del proceso de replicación líder-seguidor en el orden correcto.',
  conceptId: 'replication',
  steps: [
    { id: 's1', text: 'El cliente envía una escritura al nodo líder' },
    { id: 's2', text: 'El líder escribe los datos en su almacenamiento local' },
    { id: 's3', text: 'El líder envía los cambios al log de replicación' },
    { id: 's4', text: 'Los seguidores aplican los cambios en el mismo orden' },
    { id: 's5', text: 'El seguidor confirma que el cambio fue aplicado' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const ch5Exercise2: LabelExercise = {
  id: 'ddia-5.2',
  type: 'label',
  title: 'Topología multi-líder',
  instructions: 'Arrastra las etiquetas correctas a cada zona del diagrama de replicación multi-líder entre 3 datacenters.',
  conceptId: 'replication',
  svgViewBox: '0 0 600 400',
  svgElements: `
    <rect x="30" y="30" width="160" height="120" rx="8" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="220" y="30" width="160" height="120" rx="8" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="410" y="30" width="160" height="120" rx="8" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <line x1="190" y1="90" x2="220" y2="90" stroke="var(--j-accent)" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="380" y1="90" x2="410" y2="90" stroke="var(--j-accent)" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="300" y1="150" x2="110" y2="150" stroke="var(--j-warm)" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="490" y1="150" x2="300" y2="150" stroke="var(--j-warm)" stroke-width="2" stroke-dasharray="5,5"/>
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-accent)"/></marker></defs>
  `,
  zones: [
    { id: 'z1', x: 50, y: 170, width: 120, height: 32, correctLabel: 'Líder DC-1' },
    { id: 'z2', x: 240, y: 170, width: 120, height: 32, correctLabel: 'Líder DC-2' },
    { id: 'z3', x: 430, y: 170, width: 120, height: 32, correctLabel: 'Líder DC-3' },
    { id: 'z4', x: 50, y: 220, width: 120, height: 32, correctLabel: 'Replicación async' },
    { id: 'z5', x: 240, y: 220, width: 120, height: 32, correctLabel: 'Conflicto de escritura' },
    { id: 'z6', x: 430, y: 220, width: 120, height: 32, correctLabel: 'Resolución de conflictos' },
  ],
  labels: [
    'Líder DC-1', 'Líder DC-2', 'Líder DC-3',
    'Replicación async', 'Conflicto de escritura', 'Resolución de conflictos',
  ],
};

export const ch5Exercise3: SequenceExercise = {
  id: 'ddia-5.3',
  type: 'sequence',
  title: 'Pasos de failover automático',
  instructions: 'Ordena los pasos que ocurren durante un failover automático cuando el líder falla.',
  conceptId: 'replication',
  steps: [
    { id: 'f1', text: 'Los seguidores detectan que el líder no responde (timeout)' },
    { id: 'f2', text: 'Se ejecuta una elección para elegir un nuevo líder' },
    { id: 'f3', text: 'Los clientes son redirigidos al nuevo líder' },
    { id: 'f4', text: 'El antiguo líder se convierte en seguidor al reconectarse' },
  ],
  correctOrder: ['f1', 'f2', 'f3', 'f4'],
};

export const ch5Exercises = [ch5Exercise1, ch5Exercise2, ch5Exercise3];
