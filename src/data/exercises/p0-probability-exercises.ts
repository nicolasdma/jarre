import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * P0: Probability & Information Theory — 3 exercises
 */

export const p0ProbExercise1: SequenceExercise = {
  id: 'p0-prob.1',
  type: 'sequence',
  title: 'Pasos del Bayesian updating',
  instructions:
    'Ordena los pasos para actualizar una creencia usando el teorema de Bayes.',
  conceptId: 'probability',
  steps: [
    { id: 's1', text: 'Definir la distribución prior p(θ) sobre los parámetros' },
    { id: 's2', text: 'Observar los datos D del experimento' },
    { id: 's3', text: 'Calcular la likelihood p(D|θ) de los datos dado cada valor de θ' },
    { id: 's4', text: 'Aplicar Bayes: p(θ|D) ∝ p(D|θ) · p(θ)' },
    { id: 's5', text: 'Obtener la distribución posterior p(θ|D) normalizada' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0ProbExercise2: ConnectExercise = {
  id: 'p0-prob.2',
  type: 'connect',
  title: 'Conceptos de teoría de la información y sus fórmulas',
  instructions:
    'Conecta cada concepto con su fórmula correspondiente.',
  conceptId: 'probability',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'entropy', label: 'Entropía', x: 80, y: 50 },
    { id: 'kl-div', label: 'KL Divergence', x: 80, y: 150 },
    { id: 'cross-entropy', label: 'Cross-Entropy', x: 80, y: 250 },
    { id: 'mutual-info', label: 'Información Mutua', x: 80, y: 350 },
    { id: 'f-entropy', label: '-Σ p log p', x: 480, y: 50 },
    { id: 'f-kl', label: 'Σ p log(p/q)', x: 480, y: 150 },
    { id: 'f-ce', label: '-Σ p log q', x: 480, y: 250 },
    { id: 'f-mi', label: 'H(X) - H(X|Y)', x: 480, y: 350 },
  ],
  correctConnections: [
    ['entropy', 'f-entropy'],
    ['kl-div', 'f-kl'],
    ['cross-entropy', 'f-ce'],
    ['mutual-info', 'f-mi'],
  ],
};

export const p0ProbExercise3: SequenceExercise = {
  id: 'p0-prob.3',
  type: 'sequence',
  title: 'Pasos de MLE para una distribución Gaussiana',
  instructions:
    'Ordena los pasos para derivar los estimadores de máxima verosimilitud de μ y σ² para una Gaussiana.',
  conceptId: 'probability',
  steps: [
    { id: 's1', text: 'Escribir la función de verosimilitud L(μ, σ²) = Π p(x_i | μ, σ²)' },
    { id: 's2', text: 'Tomar el logaritmo: log L = -n/2 log(2πσ²) - Σ(x_i - μ)² / (2σ²)' },
    { id: 's3', text: 'Derivar respecto a μ e igualar a cero: ∂ log L / ∂μ = 0' },
    { id: 's4', text: 'Derivar respecto a σ² e igualar a cero: ∂ log L / ∂σ² = 0' },
    { id: 's5', text: 'Resolver: μ̂ = Σx_i/n y σ̂² = Σ(x_i - μ̂)²/n' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0ProbabilityExercises = [
  p0ProbExercise1,
  p0ProbExercise2,
  p0ProbExercise3,
];
