#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "p0-probability" resource sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-p0-probability.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Quiz definitions — keyed by section_title (to resolve section_id at runtime)
// ============================================================================

interface QuizDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

const QUIZZES: QuizDef[] = [
  // ── Section 0: Espacios de Probabilidad y Variables Aleatorias ───────────

  {
    sectionTitle: 'Espacios de Probabilidad y Variables Aleatorias',
    positionAfterHeading: 'Espacios de Probabilidad y Variables Aleatorias',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál de los axiomas de Kolmogorov establece que la probabilidad de la unión de eventos mutuamente excluyentes es la suma de sus probabilidades individuales?',
    options: [
      { label: 'A', text: 'Axioma de no-negatividad: P(A) ≥ 0' },
      { label: 'B', text: 'Axioma de normalización: P(Ω) = 1' },
      { label: 'C', text: 'Axioma de aditividad contable (σ-aditividad)' },
      { label: 'D', text: 'Axioma de independencia condicional' },
    ],
    correctAnswer: 'C',
    explanation:
      'El tercer axioma de Kolmogorov (σ-aditividad) dice que para una secuencia de eventos mutuamente excluyentes A₁, A₂, ..., se cumple P(∪Aᵢ) = ΣP(Aᵢ). Este axioma es el que permite construir toda la teoría de la medida de probabilidad. No existe un "axioma de independencia condicional" — la independencia es una propiedad derivada, no un axioma.',
  },
  {
    sectionTitle: 'Espacios de Probabilidad y Variables Aleatorias',
    positionAfterHeading: 'Espacios de Probabilidad y Variables Aleatorias',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La función de densidad de probabilidad (PDF) de una variable continua puede tomar valores mayores que 1, siempre que la integral total sobre todo el dominio sea igual a 1.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'La PDF f(x) no representa una probabilidad directamente, sino una densidad. La restricción es que ∫f(x)dx = 1 y f(x) ≥ 0. Por ejemplo, una distribución Uniforme(0, 0.5) tiene f(x) = 2 para x ∈ [0, 0.5], que es mayor que 1. La CDF, en cambio, siempre está en [0, 1] porque F(x) = P(X ≤ x) sí es una probabilidad.',
  },
  {
    sectionTitle: 'Espacios de Probabilidad y Variables Aleatorias',
    positionAfterHeading: 'Espacios de Probabilidad y Variables Aleatorias',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Qué establece la Ley de los Grandes Números (LGN) y cuál es su relación con la convergencia?',
    options: [
      { label: 'A', text: 'Que la media muestral converge a la mediana poblacional cuando n → ∞' },
      { label: 'B', text: 'Que la media muestral converge (en probabilidad o casi seguramente) a la esperanza E[X] cuando n → ∞, siempre que E[X] exista' },
      { label: 'C', text: 'Que la distribución muestral se vuelve normal cuando n → ∞' },
      { label: 'D', text: 'Que la varianza muestral se reduce a cero cuando n → ∞' },
    ],
    correctAnswer: 'B',
    explanation:
      'La LGN establece que X̄ₙ = (1/n)ΣXᵢ → E[X] cuando n → ∞. La versión débil usa convergencia en probabilidad; la fuerte, convergencia casi segura (a.s.). La opción C describe el Teorema del Límite Central (CLT), que es un resultado diferente y más fuerte. La opción D es una consecuencia (Var(X̄ₙ) = σ²/n → 0) pero no el enunciado de la ley.',
    justificationHint:
      'Piensa en la diferencia entre la LGN y el CLT. La LGN dice HACIA DÓNDE converge la media muestral. El CLT dice CÓMO se distribuye la fluctuación alrededor de ese valor. ¿Cuál necesita la existencia de varianza finita y cuál no?',
  },

  // ── Section 1: Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet

  {
    sectionTitle: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    positionAfterHeading: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      'En una distribución Gaussiana N(μ, σ²), la regla empírica 68-95-99.7 establece que aproximadamente el 95% de los datos caen dentro de ±2σ de la media. ¿Por qué esta propiedad es crucial para la detección de anomalías?',
    options: [
      { label: 'A', text: 'Porque permite calcular la media exacta de cualquier dataset' },
      { label: 'B', text: 'Porque si un dato cae fuera de ±3σ, hay solo ~0.3% de probabilidad bajo la distribución, lo que lo marca como estadísticamente improbable bajo el modelo generador asumido' },
      { label: 'C', text: 'Porque la Gaussiana es la única distribución con esta propiedad simétrica' },
      { label: 'D', text: 'Porque garantiza que no existen outliers en datos Gaussianos' },
    ],
    correctAnswer: 'B',
    explanation:
      'La regla 68-95-99.7 cuantifica las probabilidades de desviación: P(|X-μ| > 3σ) ≈ 0.003. Esto da un umbral natural para anomalías: un dato a más de 3σ de la media tiene menos del 0.3% de probabilidad bajo el modelo. No es exclusiva de la Gaussiana (Chebyshev da cotas más generales pero más laxas), y los outliers pueden existir — simplemente son improbables bajo la distribución asumida.',
    justificationHint:
      'Considera la desigualdad de Chebyshev: P(|X-μ| ≥ kσ) ≤ 1/k². Para k=3 esto da ≤ 11.1%, mucho más laxo que el 0.3% de la Gaussiana. ¿Qué asumimos para obtener esa cota más ajustada?',
  },
  {
    sectionTitle: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    positionAfterHeading: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La distribución Dirichlet con parámetros de concentración α = (1, 1, ..., 1) es equivalente a una distribución uniforme sobre el simplex.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Cuando todos los αᵢ = 1, la distribución Dirichlet Dir(1, 1, ..., 1) se convierte en una distribución uniforme sobre el simplex de probabilidad. Con αᵢ < 1, la distribución se concentra en las esquinas del simplex (distribuciones "sparse"). Con αᵢ > 1, se concentra hacia el centro (distribuciones más uniformes). Esto la hace ideal como prior sobre distribuciones categóricas: α controla cuánta "certeza" a priori tenemos.',
  },
  {
    sectionTitle: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    positionAfterHeading: 'Distribuciones: Gaussiana, Bernoulli, Categorical y Dirichlet',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué propiedad comparten la Gaussiana, Bernoulli, Categorical y Poisson como miembros de la familia exponencial?',
    options: [
      { label: 'A', text: 'Todas tienen media y varianza iguales' },
      { label: 'B', text: 'Todas pueden escribirse en la forma p(x|η) = h(x)·exp(η·T(x) - A(η)), lo que permite derivar propiedades generales como estadísticos suficientes y conjugación' },
      { label: 'C', text: 'Todas son distribuciones continuas con soporte en los reales' },
      { label: 'D', text: 'Todas tienen entropía máxima sin restricciones' },
    ],
    correctAnswer: 'B',
    explanation:
      'La familia exponencial unifica distribuciones con la forma canónica p(x|η) = h(x)·exp(η^T·T(x) - A(η)), donde η son los parámetros naturales, T(x) los estadísticos suficientes y A(η) la función log-partición. Esto permite: (1) derivar E[T(x)] = ∇A(η), (2) encontrar priors conjugados automáticamente, (3) garantizar que MLE tiene solución única cuando el espacio es minimal. Es la base teórica de los GLMs.',
  },

  // ── Section 2: Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento ──────

  {
    sectionTitle: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    positionAfterHeading: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'En el teorema de Bayes P(θ|D) = P(D|θ)·P(θ) / P(D), ¿qué rol juega el denominador P(D) (la evidencia) en la inferencia?',
    options: [
      { label: 'A', text: 'Es el factor más importante que determina cuál hipótesis es más probable' },
      { label: 'B', text: 'Es una constante de normalización que no depende de θ, por lo que puede ignorarse cuando solo se quiere comparar hipótesis o encontrar el θ óptimo' },
      { label: 'C', text: 'Es la probabilidad de los datos observados dado el modelo correcto' },
      { label: 'D', text: 'Solo es relevante en el caso de priors no informativos' },
    ],
    correctAnswer: 'B',
    explanation:
      'P(D) = ∫P(D|θ)P(θ)dθ es la marginal likelihood (evidencia). Como no depende de θ, funciona como constante de normalización. Para MAP basta maximizar P(D|θ)·P(θ), ignorando P(D). Sin embargo, P(D) es crucial para model selection (comparar modelos diferentes) y para Bayesian inference completa donde se necesita la distribución posterior normalizada.',
  },
  {
    sectionTitle: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    positionAfterHeading: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Por qué maximizar el likelihood P(D|θ) es equivalente a minimizar la negative log-likelihood (NLL), y cuál es la conexión con cross-entropy en clasificación?',
    options: [
      { label: 'A', text: 'Porque el logaritmo invierte el signo de la probabilidad y la NLL mide la distancia euclídea al modelo verdadero' },
      { label: 'B', text: 'Porque log es monótonamente creciente (preserva el argmax), el negativo convierte maximización en minimización, y para datos i.i.d. la NLL promedio es exactamente la cross-entropy empírica H(p_data, p_model)' },
      { label: 'C', text: 'Porque la NLL es más estable numéricamente que el likelihood, pero no tiene relación teórica con cross-entropy' },
      { label: 'D', text: 'Porque el logaritmo permite descomponer la verosimilitud en una suma, pero la equivalencia con cross-entropy solo aplica para distribuciones Gaussianas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Como log es monótonamente creciente, argmax P(D|θ) = argmax log P(D|θ) = argmin -log P(D|θ). Para datos i.i.d., -log P(D|θ) = -Σlog p(xᵢ|θ). Dividiendo entre N, obtenemos -(1/N)Σlog p(xᵢ|θ), que es la aproximación empírica de E_{p_data}[-log p_model(x)] = H(p_data, p_model). Esto no es coincidencia: MLE minimiza la cross-entropy, que a su vez minimiza KL(p_data || p_model) + H(p_data).',
    justificationHint:
      'Descompón KL(p_data || p_model) = H(p_data, p_model) - H(p_data). Como H(p_data) es constante respecto a θ, minimizar cross-entropy y minimizar KL son equivalentes. ¿Qué implicaciones tiene esto para entender qué "busca" el entrenamiento?',
  },
  {
    sectionTitle: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    positionAfterHeading: 'Bayes, MLE y MAP: Fundamentos de Todo Entrenamiento',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'MAP con un prior Gaussiano N(0, σ²) sobre los pesos es matemáticamente equivalente a MLE con regularización L2 (weight decay).',
    options: null,
    correctAnswer: 'true',
    explanation:
      'MAP maximiza log P(D|θ) + log P(θ). Con prior P(θ) = N(0, σ²I), log P(θ) = -||θ||²/(2σ²) + const. Entonces MAP = argmin[-log P(D|θ) + λ||θ||²], que es exactamente MLE + L2 regularization con λ = 1/(2σ²). Un prior Gaussiano más concentrado (σ pequeño) equivale a mayor regularización (λ grande). Análogamente, un prior Laplaciano produce regularización L1.',
  },

  // ── Section 3: Entropía, Cross-Entropy y KL Divergence ──────────────────

  {
    sectionTitle: 'Entropía, Cross-Entropy y KL Divergence',
    positionAfterHeading: 'Entropía, Cross-Entropy y KL Divergence',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál distribución maximiza la entropía H(X) = -Σp(x)log p(x) dado que solo conocemos la media y la varianza de X?',
    options: [
      { label: 'A', text: 'La distribución uniforme, porque asigna probabilidad igual a todos los eventos' },
      { label: 'B', text: 'La distribución de Poisson, porque modela eventos raros con máxima incertidumbre' },
      { label: 'C', text: 'La distribución Gaussiana, porque es la distribución de máxima entropía entre todas las distribuciones con media y varianza fija' },
      { label: 'D', text: 'La distribución exponencial, porque maximiza la entropía sin restricciones' },
    ],
    correctAnswer: 'C',
    explanation:
      'El principio de máxima entropía de Jaynes establece que la distribución que asume menos información adicional es la de máxima entropía sujeta a las restricciones conocidas. Sin restricciones: uniforme. Con media fija y soporte [0, ∞): exponencial. Con media y varianza fija: Gaussiana. Esto justifica por qué la Gaussiana aparece como prior "por defecto" en tantos modelos: es la asunción de mínima información cuando solo conocemos los dos primeros momentos.',
    justificationHint:
      'Resuelve el problema de optimización con multiplicadores de Lagrange: maximiza -∫p(x)log p(x)dx sujeto a ∫p(x)dx = 1, ∫xp(x)dx = μ, ∫(x-μ)²p(x)dx = σ². ¿Qué forma tiene la solución?',
  },
  {
    sectionTitle: 'Entropía, Cross-Entropy y KL Divergence',
    positionAfterHeading: 'Entropía, Cross-Entropy y KL Divergence',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La divergencia KL es simétrica: KL(P || Q) = KL(Q || P) para cualquier par de distribuciones P y Q.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'La KL divergence es fundamentalmente asimétrica. KL(P || Q) = Σp(x)log(p(x)/q(x)) penaliza cuando Q asigna baja probabilidad donde P tiene alta probabilidad. KL(Q || P) penaliza lo opuesto. Forward KL (KL(P || Q)) produce aproximaciones "mode-covering" (Q intenta cubrir todo el soporte de P). Reverse KL (KL(Q || P)) produce aproximaciones "mode-seeking" (Q se concentra en un modo de P). Esta asimetría es crítica: los VAEs usan reverse KL, que tiende a subajustar la varianza.',
  },
  {
    sectionTitle: 'Entropía, Cross-Entropy y KL Divergence',
    positionAfterHeading: 'Entropía, Cross-Entropy y KL Divergence',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es la relación entre cross-entropy y KL divergence?',
    options: [
      { label: 'A', text: 'Son métricas idénticas que se pueden usar indistintamente' },
      { label: 'B', text: 'H(P, Q) = H(P) + KL(P || Q), donde H(P) es la entropía de P y KL(P || Q) es la divergencia de P respecto a Q' },
      { label: 'C', text: 'KL(P || Q) = H(P, Q) + H(Q), es decir, la KL es la suma de cross-entropy y entropía del modelo' },
      { label: 'D', text: 'No tienen relación matemática directa; se usan en contextos completamente diferentes' },
    ],
    correctAnswer: 'B',
    explanation:
      'La relación fundamental es H(P, Q) = H(P) + KL(P || Q). Como H(P) es constante respecto a Q (solo depende de la distribución verdadera), minimizar H(P, Q) respecto a Q es equivalente a minimizar KL(P || Q). Esto explica por qué la cross-entropy loss en clasificación realmente está minimizando la distancia KL entre la distribución empírica de los datos y la distribución del modelo.',
  },

  // ── Section 4: Información Mutua, ELBO y Conexiones con Deep Learning ───

  {
    sectionTitle: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    positionAfterHeading: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuándo es la información mutua I(X; Y) exactamente igual a cero?',
    options: [
      { label: 'A', text: 'Cuando X e Y tienen la misma distribución marginal' },
      { label: 'B', text: 'Cuando X e Y son estadísticamente independientes, es decir, P(X,Y) = P(X)P(Y)' },
      { label: 'C', text: 'Cuando la correlación lineal entre X e Y es cero' },
      { label: 'D', text: 'Cuando X e Y tienen varianza finita' },
    ],
    correctAnswer: 'B',
    explanation:
      'I(X; Y) = KL(P(X,Y) || P(X)P(Y)) = 0 si y solo si P(X,Y) = P(X)P(Y), es decir, independencia estadística. La opción C es incorrecta: correlación cero solo implica ausencia de relación LINEAL, pero puede haber dependencia no lineal (ejemplo: Y = X² con X simétrica tiene correlación 0 pero I(X; Y) > 0). La información mutua captura TODA dependencia, no solo la lineal.',
  },
  {
    sectionTitle: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    positionAfterHeading: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cuáles son los dos componentes del ELBO (Evidence Lower Bound) y qué optimiza cada uno en un VAE?',
    options: [
      { label: 'A', text: 'Reconstruction loss + clasificación supervisada; el primero reconstruye la entrada y el segundo clasifica las variables latentes' },
      { label: 'B', text: 'E_q[log p(x|z)] - KL(q(z|x) || p(z)); el primer término maximiza la reconstrucción y el segundo regulariza el espacio latente acercando q(z|x) al prior p(z)' },
      { label: 'C', text: 'Cross-entropy + L2 regularization; estándar en cualquier red neuronal' },
      { label: 'D', text: 'Log-likelihood exacta + un término de corrección de bias; el ELBO es una aproximación de primer orden' },
    ],
    correctAnswer: 'B',
    explanation:
      'ELBO = E_{q(z|x)}[log p(x|z)] - KL(q(z|x) || p(z)). El primer término es el expected reconstruction log-likelihood: qué tan bien el decoder p(x|z) reconstruye x a partir de z muestreado de q(z|x). El segundo término es la regularización KL: penaliza que la distribución aproximada q(z|x) se aleje del prior p(z) = N(0,I). Maximizar ELBO equivale a maximizar una cota inferior de log p(x), ya que log p(x) = ELBO + KL(q(z|x) || p(z|x)) ≥ ELBO.',
    justificationHint:
      'Deriva el ELBO partiendo de log p(x) = log ∫p(x,z)dz, introduciendo q(z|x) con la identidad log p(x) = E_q[log p(x,z)/q(z|x)] + KL(q||p(z|x)). Como KL ≥ 0, el primer término es una cota inferior. ¿Qué pasa cuando q(z|x) = p(z|x) exactamente?',
  },
  {
    sectionTitle: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    positionAfterHeading: 'Información Mutua, ELBO y Conexiones con Deep Learning',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'La perplexity de un modelo de lenguaje se calcula como 2^H(P,Q) donde H(P,Q) es la cross-entropy entre la distribución empírica P y el modelo Q, y representa el número promedio de tokens entre los que el modelo está "indeciso".',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Perplexity = 2^{H(P,Q)} (o e^{H(P,Q)} si usamos logaritmo natural). Intuitivamente, una perplexity de 100 significa que en promedio el modelo está tan "confundido" como si eligiera uniformemente entre 100 tokens en cada paso. Un modelo perfecto tendría perplexity 1 (certeza total). Para GPT-3, la perplexity en texto general es ~20-30, lo que indica que en promedio el modelo considera efectivamente ~20-30 opciones plausibles por token.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching p0-probability section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'p0-probability')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for p0-probability. Seed sections first.');
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections:`);
  const titleToId = new Map<string, string>();
  for (const s of sections) {
    console.log(`  ${s.section_title} → ${s.id}`);
    titleToId.set(s.section_title, s.id);
  }

  // Clear existing quizzes for these sections
  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error clearing existing quizzes:', deleteError);
    process.exit(1);
  }

  console.log('\nCleared existing quizzes for p0-probability sections.');

  // Resolve section IDs and insert quizzes
  const toInsert = [];
  let skipped = 0;

  for (const quiz of QUIZZES) {
    const sectionId = titleToId.get(quiz.sectionTitle);
    if (!sectionId) {
      console.warn(`  Warning: No section found for "${quiz.sectionTitle}", skipping.`);
      skipped++;
      continue;
    }

    toInsert.push({
      section_id: sectionId,
      position_after_heading: quiz.positionAfterHeading,
      sort_order: quiz.sortOrder,
      format: quiz.format,
      question_text: quiz.questionText,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      explanation: quiz.explanation,
      justification_hint: quiz.justificationHint ?? null,
      is_active: true,
    });
  }

  if (toInsert.length === 0) {
    console.error('No quizzes to insert. Check section title matching.');
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(toInsert);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError);
    process.exit(1);
  }

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for p0-probability`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

  // Summary by section
  const countBySection = new Map<string, number>();
  const formatCount = { mc: 0, tf: 0, mc2: 0 };
  for (const q of toInsert) {
    const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
    countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
    formatCount[q.format as keyof typeof formatCount]++;
  }
  console.log('\nPer-section breakdown:');
  for (const [title, count] of countBySection) {
    console.log(`  ${title}: ${count} quizzes`);
  }
  console.log(`\nBy format: MC=${formatCount.mc}, TF=${formatCount.tf}, MC2=${formatCount.mc2}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
