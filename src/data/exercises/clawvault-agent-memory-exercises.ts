import type { SequenceExercise, ConnectExercise, LabelExercise } from '@/types';

/**
 * ClawVault: Agent Memory (markdown-based) — 3 exercises
 *
 * Covers: budget-aware context injection, memory types,
 * vault architecture (folders, YAML frontmatter, wiki-links, index).
 */

export const clawvaultExercise1: SequenceExercise = {
  id: 'clawvault.1',
  type: 'sequence',
  title: 'Inyección de contexto budget-aware',
  instructions:
    'Ordena los pasos que sigue un agente al despertar para cargar memorias respetando el presupuesto de tokens.',
  conceptId: 'memory-management',
  steps: [
    { id: 's1', text: 'Escanear el vault index para descubrir memorias disponibles' },
    { id: 's2', text: 'Cargar todas las memorias marcadas como 🔴 (críticas)' },
    { id: 's3', text: 'Calcular tokens restantes del presupuesto' },
    { id: 's4', text: 'Llenar el espacio disponible con memorias 🟡 (importantes)' },
    { id: 's5', text: 'Si queda presupuesto, incluir memorias 🟢 (contextuales)' },
    { id: 's6', text: 'Inyectar el bloque de memorias resultante en el prompt del agente' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5', 's6'],
};

export const clawvaultExercise2: ConnectExercise = {
  id: 'clawvault.2',
  type: 'connect',
  title: 'Tipos de memoria y ejemplos concretos',
  instructions:
    'Conecta cada tipo de memoria de ClawVault con su ejemplo correspondiente.',
  conceptId: 'external-memory',
  svgViewBox: '0 0 600 420',
  nodes: [
    // Memory types (left column)
    { id: 'decisions', label: 'Decisions', x: 80, y: 50 },
    { id: 'preferences', label: 'Preferences', x: 80, y: 130 },
    { id: 'relationships', label: 'Relationships', x: 80, y: 210 },
    { id: 'commitments', label: 'Commitments', x: 80, y: 290 },
    { id: 'lessons', label: 'Lessons', x: 80, y: 370 },
    // Concrete examples (right column)
    { id: 'ex-dec', label: 'Migrar de REST a GraphQL', x: 480, y: 50 },
    { id: 'ex-pref', label: 'Usuario prefiere respuestas concisas', x: 480, y: 130 },
    { id: 'ex-rel', label: 'Proyecto X depende de API Y', x: 480, y: 210 },
    { id: 'ex-com', label: 'Entregar MVP antes del viernes', x: 480, y: 290 },
    { id: 'ex-les', label: 'Batch inserts evitan timeouts', x: 480, y: 370 },
  ],
  correctConnections: [
    ['decisions', 'ex-dec'],
    ['preferences', 'ex-pref'],
    ['relationships', 'ex-rel'],
    ['commitments', 'ex-com'],
    ['lessons', 'ex-les'],
  ],
};

export const clawvaultExercise3: LabelExercise = {
  id: 'clawvault.3',
  type: 'label',
  title: 'Arquitectura del ClawVault',
  instructions:
    'Arrastra las etiquetas a cada componente de la estructura del vault.',
  conceptId: 'memory-management',
  svgViewBox: '0 0 500 480',
  svgElements: `
    <rect x="40" y="20" width="420" height="440" rx="8" fill="none" stroke="var(--j-border)" stroke-width="2" stroke-dasharray="6 3"/>
    <text x="250" y="14" text-anchor="middle" font-size="11" fill="var(--j-border)">vault/</text>

    <rect x="70" y="50" width="360" height="50" rx="6" fill="none" stroke="var(--j-accent)" stroke-width="2"/>

    <rect x="70" y="130" width="360" height="70" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
    <line x1="70" y1="155" x2="430" y2="155" stroke="var(--j-warm)" stroke-width="1" stroke-dasharray="4 2"/>
    <text x="250" y="150" text-anchor="middle" font-size="10" fill="var(--j-warm)">---</text>

    <rect x="70" y="230" width="160" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>

    <rect x="270" y="230" width="160" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>

    <rect x="70" y="320" width="360" height="50" rx="6" fill="none" stroke="var(--j-accent)" stroke-width="2"/>
    <text x="250" y="350" text-anchor="middle" font-size="10" fill="var(--j-accent)">[[decision-graphql]] [[lesson-batch]]</text>

    <rect x="70" y="400" width="360" height="50" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
  `,
  zones: [
    { id: 'z1', x: 80, y: 58, width: 340, height: 34, correctLabel: 'Vault Index (_index.md)' },
    { id: 'z2', x: 80, y: 135, width: 340, height: 55, correctLabel: 'YAML Frontmatter (prioridad, tags)' },
    { id: 'z3', x: 80, y: 238, width: 140, height: 34, correctLabel: 'Carpeta decisions/' },
    { id: 'z4', x: 280, y: 238, width: 140, height: 34, correctLabel: 'Carpeta lessons/' },
    { id: 'z5', x: 80, y: 328, width: 340, height: 34, correctLabel: 'Wiki-links (grafo de conocimiento)' },
    { id: 'z6', x: 80, y: 408, width: 340, height: 34, correctLabel: 'Compresión con regex post-processing' },
  ],
  labels: [
    'Vault Index (_index.md)',
    'YAML Frontmatter (prioridad, tags)',
    'Carpeta decisions/',
    'Carpeta lessons/',
    'Wiki-links (grafo de conocimiento)',
    'Compresión con regex post-processing',
  ],
};

export const clawvaultExercises = [
  clawvaultExercise1,
  clawvaultExercise2,
  clawvaultExercise3,
];
