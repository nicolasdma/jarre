import type { SequenceExercise, ConnectExercise } from '@/types';

/**
 * P0: CS229 Probability Review — 3 exercises
 */

export const p0CS229ProbExercise1: SequenceExercise = {
  id: 'p0-cs229-prob.1',
  type: 'sequence',
  title: 'Pipeline de actualización Bayesiana para un parámetro',
  instructions:
    'Ordena los pasos del pipeline completo de actualización Bayesiana para estimar un parámetro.',
  conceptId: 'probability-statistics',
  steps: [
    { id: 's1', text: 'Elegir una distribución prior para el parámetro (ej: Beta(α, β) para una probabilidad)' },
    { id: 's2', text: 'Definir el modelo de likelihood: cómo se generan los datos dado el parámetro' },
    { id: 's3', text: 'Observar datos D del experimento o dataset' },
    { id: 's4', text: 'Calcular el posterior usando Bayes: P(θ|D) ∝ P(D|θ) · P(θ)' },
    { id: 's5', text: 'Usar el posterior como prior para la siguiente ronda de datos (online learning)' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0CS229ProbExercise2: ConnectExercise = {
  id: 'p0-cs229-prob.2',
  type: 'connect',
  title: 'Distribución asumida ↔ Loss function en ML',
  instructions:
    'Conecta cada distribución con la loss function que se deriva de su negative log-likelihood.',
  conceptId: 'probability-statistics',
  svgViewBox: '0 0 600 400',
  nodes: [
    { id: 'gaussiana', label: 'Gaussiana', x: 80, y: 50 },
    { id: 'bernoulli', label: 'Bernoulli', x: 80, y: 150 },
    { id: 'categorical', label: 'Categorical', x: 80, y: 250 },
    { id: 'poisson', label: 'Poisson', x: 80, y: 350 },
    { id: 'mse', label: 'MSE Loss', x: 480, y: 50 },
    { id: 'bce', label: 'Binary Cross-Entropy', x: 480, y: 150 },
    { id: 'cce', label: 'Categorical Cross-Entropy', x: 480, y: 250 },
    { id: 'poisson-dev', label: 'Poisson Deviance', x: 480, y: 350 },
  ],
  correctConnections: [
    ['gaussiana', 'mse'],
    ['bernoulli', 'bce'],
    ['categorical', 'cce'],
    ['poisson', 'poisson-dev'],
  ],
};

export const p0CS229ProbExercise3: SequenceExercise = {
  id: 'p0-cs229-prob.3',
  type: 'sequence',
  title: 'Pasos de derivación MLE para regresión lineal',
  instructions:
    'Ordena los pasos para derivar el estimador de máxima verosimilitud (MLE) de los pesos en regresión lineal.',
  conceptId: 'probability-statistics',
  steps: [
    { id: 's1', text: 'Asumir modelo: y = wᵀx + ε con ε ~ N(0, σ²)' },
    { id: 's2', text: 'Escribir la likelihood: P(D|w) = Π N(yᵢ; wᵀxᵢ, σ²)' },
    { id: 's3', text: 'Tomar log-likelihood: ℓ(w) = -n/2 log(2πσ²) - Σ(yᵢ - wᵀxᵢ)²/(2σ²)' },
    { id: 's4', text: 'Derivar respecto a w e igualar a cero: ∂ℓ/∂w = 0' },
    { id: 's5', text: 'Resolver: w_MLE = (XᵀX)⁻¹Xᵀy (ecuación normal)' },
  ],
  correctOrder: ['s1', 's2', 's3', 's4', 's5'],
};

export const p0CS229ProbabilityExercises = [
  p0CS229ProbExercise1,
  p0CS229ProbExercise2,
  p0CS229ProbExercise3,
];
