import type { SequenceExercise, ConnectExercise, LabelExercise } from '@/types';

/**
 * The Two Patterns by Which Agents Connect Sandboxes (Harrison Chase) — 3 exercises
 *
 * Pattern 1: Agent IN Sandbox — el agente vive dentro del contenedor
 * Pattern 2: Sandbox as Tool — el agente corre localmente, ejecuta codigo remotamente via API
 */

const sandboxExercise1: SequenceExercise = {
  id: 'agent-sandbox.1',
  type: 'sequence',
  title: 'Flujo de decisión: elegir entre Pattern 1 y Pattern 2',
  instructions:
    'Ordena los pasos del proceso de evaluación que un arquitecto sigue para decidir si colocar al agente dentro del sandbox (Pattern 1) o usar el sandbox como herramienta (Pattern 2).',
  conceptId: 'tool-use',
  steps: [
    {
      id: 's1',
      text: 'Identificar los requisitos de seguridad: ¿las API keys pueden vivir dentro del sandbox?',
    },
    {
      id: 's2',
      text: 'Evaluar la necesidad de iteración rápida: ¿se necesita actualizar la lógica del agente sin reconstruir contenedores?',
    },
    {
      id: 's3',
      text: 'Determinar si el agente necesita acceso directo al filesystem del entorno de ejecución',
    },
    {
      id: 's4',
      text: 'Analizar si se requiere paralelización: ¿el agente debe orquestar múltiples sandboxes simultáneamente?',
    },
    {
      id: 's5',
      text: 'Seleccionar el patrón: Pattern 1 si hay acoplamiento fuerte agente-entorno, Pattern 2 si se prioriza aislamiento y flexibilidad',
    },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

const sandboxExercise2: ConnectExercise = {
  id: 'agent-sandbox.2',
  type: 'connect',
  title: 'Características de cada patrón de sandbox',
  instructions:
    'Conecta cada característica o trade-off con el patrón de arquitectura al que corresponde.',
  conceptId: 'react-pattern',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'p1', label: 'Pattern 1: Agent IN Sandbox', x: 100, y: 80 },
    { id: 'p2', label: 'Pattern 2: Sandbox as Tool', x: 100, y: 320 },
    { id: 'c1', label: 'API keys dentro del contenedor', x: 460, y: 40 },
    { id: 'c2', label: 'Rebuild de imagen para actualizar agente', x: 460, y: 110 },
    { id: 'c3', label: 'Ejecución paralela en múltiples sandboxes', x: 460, y: 180 },
    { id: 'c4', label: 'Credenciales aisladas fuera del sandbox', x: 460, y: 250 },
    { id: 'c5', label: 'Acceso directo al filesystem', x: 460, y: 320 },
    { id: 'c6', label: 'Latencia de red por llamadas cross-boundary', x: 460, y: 360 },
  ],
  correctConnections: [
    ['p1', 'c1'],
    ['p1', 'c2'],
    ['p1', 'c5'],
    ['p2', 'c3'],
    ['p2', 'c4'],
    ['p2', 'c6'],
  ],
};

const sandboxExercise3: LabelExercise = {
  id: 'agent-sandbox.3',
  type: 'label',
  title: 'Arquitectura de Pattern 2: Sandbox as Tool',
  instructions:
    'Arrastra las etiquetas correctas a cada componente del diagrama de arquitectura donde el agente usa el sandbox como herramienta remota.',
  conceptId: 'plan-and-execute',
  svgViewBox: '0 0 600 400',
  svgElements: `
    <!-- Zona del servidor local -->
    <rect x="30" y="30" width="220" height="340" rx="10" fill="none" stroke="var(--j-accent)" stroke-width="2" stroke-dasharray="8 4"/>
    <!-- Agente -->
    <rect x="60" y="80" width="160" height="50" rx="6" fill="none" stroke="var(--j-accent)" stroke-width="2"/>
    <!-- Credenciales -->
    <rect x="60" y="170" width="160" height="50" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
    <!-- Flecha agente -> API boundary -->
    <line x1="220" y1="105" x2="310" y2="105" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowRight)"/>
    <!-- API boundary -->
    <line x1="310" y1="30" x2="310" y2="370" stroke="var(--j-border)" stroke-width="2" stroke-dasharray="6 3"/>
    <!-- Zona remota -->
    <rect x="350" y="30" width="220" height="340" rx="10" fill="none" stroke="var(--j-warm)" stroke-width="2" stroke-dasharray="8 4"/>
    <!-- Sandbox -->
    <rect x="380" y="80" width="160" height="50" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
    <!-- Resultado -->
    <rect x="380" y="170" width="160" height="50" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <!-- Flecha sandbox -> resultado -->
    <line x1="460" y1="130" x2="460" y2="170" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowDown)"/>
    <!-- Flecha resultado -> agente (retorno) -->
    <path d="M 380 195 L 310 195 L 310 120 L 220 120" fill="none" stroke="var(--j-border)" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrowLeft)"/>
    <!-- Markers -->
    <defs>
      <marker id="arrowRight" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-border)"/></marker>
      <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 5 10 L 10 0 z" fill="var(--j-border)"/></marker>
      <marker id="arrowLeft" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 10 0 L 0 5 L 10 10 z" fill="var(--j-border)"/></marker>
    </defs>
  `,
  zones: [
    { id: 'z1', x: 70, y: 88, width: 140, height: 34, correctLabel: 'Agente (local)' },
    { id: 'z2', x: 70, y: 178, width: 140, height: 34, correctLabel: 'API Keys / Credenciales' },
    { id: 'z3', x: 295, y: 185, width: 30, height: 30, correctLabel: 'API Boundary' },
    { id: 'z4', x: 390, y: 88, width: 140, height: 34, correctLabel: 'Sandbox remoto (E2B, Modal)' },
    { id: 'z5', x: 390, y: 178, width: 140, height: 34, correctLabel: 'Resultado de ejecución' },
  ],
  labels: [
    'Agente (local)',
    'API Keys / Credenciales',
    'API Boundary',
    'Sandbox remoto (E2B, Modal)',
    'Resultado de ejecución',
  ],
};

export const agentSandboxPatternsExercises = [
  sandboxExercise1,
  sandboxExercise2,
  sandboxExercise3,
];
