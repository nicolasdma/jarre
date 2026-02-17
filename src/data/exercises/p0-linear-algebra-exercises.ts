import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * P0: Linear Algebra — 3 exercises
 */

export const p0LaExercise1: SequenceExercise = {
  id: 'p0-la.1',
  type: 'sequence',
  title: 'Pasos de PCA (Análisis de Componentes Principales)',
  instructions:
    'Ordena los pasos para realizar PCA sobre un dataset de n muestras en d dimensiones.',
  conceptId: 'linear-algebra',
  steps: [
    { id: 's1', text: 'Centrar los datos (restar la media de cada feature)' },
    { id: 's2', text: 'Calcular la matriz de covarianza (X^T X / n)' },
    { id: 's3', text: 'Eigendescomponer la matriz de covarianza' },
    { id: 's4', text: 'Seleccionar los k eigenvectores con mayores eigenvalues' },
    { id: 's5', text: 'Proyectar los datos al subespacio de k dimensiones' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0LaExercise2: ConnectExercise = {
  id: 'p0-la.2',
  type: 'connect',
  title: 'Tipos de matrices y sus propiedades',
  instructions:
    'Conecta cada tipo de matriz con su propiedad característica.',
  conceptId: 'linear-algebra',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'orthogonal', label: 'Ortogonal', x: 80, y: 50 },
    { id: 'symmetric', label: 'Simétrica', x: 80, y: 150 },
    { id: 'diagonal', label: 'Diagonal', x: 80, y: 250 },
    { id: 'singular', label: 'Singular', x: 80, y: 350 },
    { id: 'norms', label: 'Preserva normas', x: 480, y: 50 },
    { id: 'real-eig', label: 'Eigenvalues reales', x: 480, y: 150 },
    { id: 'scales', label: 'Escala los ejes', x: 480, y: 250 },
    { id: 'det-zero', label: 'Determinante = 0', x: 480, y: 350 },
  ],
  correctConnections: [
    ['orthogonal', 'norms'],
    ['symmetric', 'real-eig'],
    ['diagonal', 'scales'],
    ['singular', 'det-zero'],
  ],
};

export const p0LaExercise3: SequenceExercise = {
  id: 'p0-la.3',
  type: 'sequence',
  title: 'Pasos de la descomposición SVD',
  instructions:
    'Ordena los pasos para calcular la SVD (A = UΣV^T) de una matriz A.',
  conceptId: 'linear-algebra',
  steps: [
    { id: 's1', text: 'Calcular A^T A (matriz simétrica positiva semidefinida)' },
    { id: 's2', text: 'Eigendescomponer A^T A para obtener eigenvalues y eigenvectores' },
    { id: 's3', text: 'Construir V con los eigenvectores de A^T A (vectores singulares derechos)' },
    { id: 's4', text: 'Calcular los valores singulares σ_i = √λ_i' },
    { id: 's5', text: 'Calcular U: u_i = Av_i / σ_i (vectores singulares izquierdos)' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0LinearAlgebraExercises = [
  p0LaExercise1,
  p0LaExercise2,
  p0LaExercise3,
];
