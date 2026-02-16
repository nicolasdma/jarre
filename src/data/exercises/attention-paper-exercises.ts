import type { SequenceExercise, LabelExercise, ConnectExercise } from '@/types';

/**
 * Attention Is All You Need (Vaswani et al., 2017) — 3 exercises
 */

export const attentionExercise1: SequenceExercise = {
  id: 'attention.1',
  type: 'sequence',
  title: 'Cálculo de Scaled Dot-Product Attention',
  instructions: 'Ordena los pasos del cálculo de Scaled Dot-Product Attention.',
  conceptId: 'attention-mechanism',
  steps: [
    { id: 'a1', text: 'Calcular el producto matricial QK^T' },
    { id: 'a2', text: 'Escalar por 1/\u221Ad_k para estabilizar gradientes' },
    { id: 'a3', text: 'Aplicar softmax para obtener pesos de atención' },
    { id: 'a4', text: 'Multiplicar los pesos por la matriz V' },
    { id: 'a5', text: 'Obtener la salida: vectores de contexto ponderados' },
  ],
  correctOrder: ['a1', 'a2', 'a3', 'a4', 'a5'],
};

export const attentionExercise2: LabelExercise = {
  id: 'attention.2',
  type: 'label',
  title: 'Arquitectura del Transformer (Encoder)',
  instructions: 'Arrastra las etiquetas correctas a cada capa del encoder del Transformer.',
  conceptId: 'transformer-architecture',
  svgViewBox: '0 0 400 500',
  svgElements: `
    <rect x="120" y="420" width="160" height="40" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="120" y="350" width="160" height="40" rx="6" fill="none" stroke="var(--j-accent)" stroke-width="2"/>
    <rect x="120" y="270" width="160" height="40" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
    <rect x="120" y="200" width="160" height="40" rx="6" fill="none" stroke="var(--j-border)" stroke-width="2"/>
    <rect x="120" y="130" width="160" height="40" rx="6" fill="none" stroke="var(--j-warm)" stroke-width="2"/>
    <rect x="120" y="60" width="160" height="40" rx="6" fill="none" stroke="var(--j-accent)" stroke-width="2"/>
    <line x1="200" y1="420" x2="200" y2="400" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowUp)"/>
    <line x1="200" y1="350" x2="200" y2="320" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowUp)"/>
    <line x1="200" y1="270" x2="200" y2="250" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowUp)"/>
    <line x1="200" y1="200" x2="200" y2="180" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowUp)"/>
    <line x1="200" y1="130" x2="200" y2="110" stroke="var(--j-border)" stroke-width="1.5" marker-end="url(#arrowUp)"/>
    <defs><marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 10 L 5 0 L 10 10 z" fill="var(--j-border)"/></marker></defs>
  `,
  zones: [
    { id: 'z1', x: 130, y: 428, width: 140, height: 28, correctLabel: 'Input Embedding' },
    { id: 'z2', x: 130, y: 358, width: 140, height: 28, correctLabel: 'Positional Encoding' },
    { id: 'z3', x: 130, y: 278, width: 140, height: 28, correctLabel: 'Multi-Head Attention' },
    { id: 'z4', x: 130, y: 208, width: 140, height: 28, correctLabel: 'Add & Norm' },
    { id: 'z5', x: 130, y: 138, width: 140, height: 28, correctLabel: 'Feed-Forward' },
    { id: 'z6', x: 130, y: 68, width: 140, height: 28, correctLabel: 'Output' },
  ],
  labels: [
    'Input Embedding', 'Positional Encoding', 'Multi-Head Attention',
    'Add & Norm', 'Feed-Forward', 'Output',
  ],
};

export const attentionExercise3: ConnectExercise = {
  id: 'attention.3',
  type: 'connect',
  title: 'Tres usos de la atención en el Transformer',
  instructions: 'Conecta cada tipo de atención con las fuentes correctas de Q, K y V.',
  conceptId: 'multi-head-attention',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'enc-self', label: 'Encoder Self-Attention', x: 100, y: 60 },
    { id: 'dec-masked', label: 'Decoder Masked Self-Attention', x: 300, y: 60 },
    { id: 'cross-att', label: 'Cross-Attention', x: 500, y: 60 },
    { id: 'q-enc', label: 'Q del encoder', x: 80, y: 220 },
    { id: 'kv-enc', label: 'K/V del encoder', x: 240, y: 220 },
    { id: 'q-dec', label: 'Q del decoder', x: 400, y: 220 },
    { id: 'kv-dec', label: 'K/V del decoder', x: 540, y: 220 },
  ],
  correctConnections: [
    ['enc-self', 'q-enc'],
    ['enc-self', 'kv-enc'],
    ['dec-masked', 'q-dec'],
    ['dec-masked', 'kv-dec'],
    ['cross-att', 'q-dec'],
    ['cross-att', 'kv-enc'],
  ],
};

export const attentionPaperExercises = [attentionExercise1, attentionExercise2, attentionExercise3];
