#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "p0-cs229-probability" resource sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-p0-cs229-probability.ts
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
  // ── Section 0: Variables Aleatorias y Distribuciones Básicas ─────────────

  {
    sectionTitle: 'Variables Aleatorias y Distribuciones Básicas',
    positionAfterHeading: 'Variables Aleatorias y Distribuciones Básicas',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la propiedad fundamental de la expectativa que la hace especialmente útil para el análisis de modelos de ML?',
    options: [
      { label: 'A', text: 'Es siempre positiva' },
      { label: 'B', text: 'Es lineal: E[aX + bY + c] = aE[X] + bE[Y] + c, válida incluso sin independencia' },
      { label: 'C', text: 'Solo aplica a distribuciones simétricas' },
      { label: 'D', text: 'Siempre es igual a la mediana' },
    ],
    correctAnswer: 'B',
    explanation:
      'La linealidad de la expectativa es quizás su propiedad más poderosa: E[aX + bY] = aE[X] + bE[Y] SIEMPRE, sin importar si X e Y son dependientes. Esto es fundamental en ML porque permite descomponer losses, analizar gradientes esperados, y calcular expectativas de funciones complejas. La mediana no coincide con la expectativa excepto en distribuciones simétricas.',
  },
  {
    sectionTitle: 'Variables Aleatorias y Distribuciones Básicas',
    positionAfterHeading: 'Variables Aleatorias y Distribuciones Básicas',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Si la covarianza entre dos variables aleatorias X e Y es cero, entonces X e Y son necesariamente independientes.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Cov[X,Y] = 0 significa que no hay relación LINEAL entre X e Y. Pero puede haber dependencia no lineal. Ejemplo clásico: si X ~ N(0,1) y Y = X², entonces Cov[X,Y] = E[X³] = 0 (por simetría de la Gaussiana), pero Y depende completamente de X. La covarianza solo captura dependencia lineal — la información mutua I(X;Y) captura TODA dependencia.',
  },
  {
    sectionTitle: 'Variables Aleatorias y Distribuciones Básicas',
    positionAfterHeading: 'Variables Aleatorias y Distribuciones Básicas',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Por qué la distinción entre PMF y PDF es importante en el contexto de modelos generativos?',
    options: [
      { label: 'A', text: 'No hay diferencia práctica, ambas se usan igual en ML' },
      { label: 'B', text: 'La PMF asigna probabilidades directamente (P(X=x)>0), mientras que la PDF es una densidad donde P(X=x)=0 para cualquier punto — esto afecta cómo se calculan los log-likelihoods y el ELBO en modelos como VAEs' },
      { label: 'C', text: 'La PMF solo sirve para clasificación y la PDF solo para regresión' },
      { label: 'D', text: 'La PDF siempre produce valores entre 0 y 1, igual que la PMF' },
    ],
    correctAnswer: 'B',
    explanation:
      'En VAEs, el log p(x|z) se calcula de forma diferente según si x es discreto (log de PMF) o continuo (log de PDF). Para datos continuos, la PDF puede ser mayor que 1, lo que hace que log-densidades sean positivas — algo imposible con log-probabilidades. Esto tiene implicaciones prácticas para el cálculo del ELBO y la comparación de modelos. La opción D es incorrecta: la PDF puede exceder 1.',
    justificationHint:
      'Piensa en una distribución Uniforme(0, 0.1). La PDF es f(x) = 10 para x ∈ [0, 0.1]. ¿Cuál es log f(0.05)?',
  },

  // ── Section 1: Distribuciones Clásicas y sus Propiedades ────────────────

  {
    sectionTitle: 'Distribuciones Clásicas y sus Propiedades',
    positionAfterHeading: 'Distribuciones Clásicas y sus Propiedades',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'La distribución de Poisson tiene la propiedad de que su media y su varianza son iguales a λ.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Para X ~ Poisson(λ), E[X] = Var[X] = λ. Esta propiedad se llama equidispersión y es una asunción fuerte: si los datos tienen varianza mucho mayor que la media (sobredispersión), Poisson no es adecuada y se usan alternativas como la distribución Negative Binomial. En NLP, las frecuencias de palabras son típicamente sobredispersas.',
  },
  {
    sectionTitle: 'Distribuciones Clásicas y sus Propiedades',
    positionAfterHeading: 'Distribuciones Clásicas y sus Propiedades',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es la relación directa entre la distribución Beta y la inferencia Bayesiana para un parámetro binomial?',
    options: [
      { label: 'A', text: 'La distribución Beta no tiene relación con la inferencia Bayesiana' },
      { label: 'B', text: 'Beta(α, β) es la prior conjugada de la Bernoulli/Binomial: si el prior es Beta(α, β) y observamos k éxitos en n ensayos, el posterior es Beta(α+k, β+n-k)' },
      { label: 'C', text: 'La Beta solo se usa como función de activación, no como distribución' },
      { label: 'D', text: 'La Beta es la posterior, nunca el prior' },
    ],
    correctAnswer: 'B',
    explanation:
      'La conjugación Beta-Bernoulli es el ejemplo más limpio de actualización Bayesiana. Los parámetros α y β se interpretan como pseudo-conteos: α-1 éxitos y β-1 fracasos "previos". Observar k éxitos en n ensayos simplemente suma conteos: posterior = Beta(α+k, β+n-k). Con suficientes datos (n grande), el posterior converge al mismo punto independientemente del prior.',
  },
  {
    sectionTitle: 'Distribuciones Clásicas y sus Propiedades',
    positionAfterHeading: 'Distribuciones Clásicas y sus Propiedades',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Por qué la tabla \'distribución → loss function\' (Gaussiana→MSE, Bernoulli→BCE, etc.) no es una colección de elecciones ad hoc sino una consecuencia directa del framework MLE?',
    options: [
      { label: 'A', text: 'Porque las loss functions se eligieron primero y luego se buscaron distribuciones que coincidieran' },
      { label: 'B', text: 'Porque cada loss function es exactamente el negative log-likelihood de la distribución correspondiente — minimizar MSE = MLE asumiendo ruido Gaussiano, minimizar BCE = MLE asumiendo respuestas Bernoulli' },
      { label: 'C', text: 'Porque solo existe una loss function posible para cada tipo de datos' },
      { label: 'D', text: 'Porque las distribuciones se ajustan automáticamente al tipo de loss' },
    ],
    correctAnswer: 'B',
    explanation:
      'MSE = -log N(y; ŷ, σ²) + const = (y-ŷ)²/(2σ²). BCE = -log Ber(y; p) = -[y log p + (1-y)log(1-p)]. En ambos casos, la loss es el NLL de la distribución. Esto significa que cuando eliges una loss function, implícitamente estás asumiendo una distribución sobre los datos. Si la suposición es incorrecta (ej: MSE para clasificación binaria), el modelo optimiza la cosa equivocada.',
    justificationHint:
      'Escribe el NLL de una Gaussiana con varianza σ² fija. ¿Qué términos dependen de los parámetros del modelo y cuáles son constantes?',
  },

  // ── Section 2: Inferencia: MLE, MAP y Bayes ────────────────────────────

  {
    sectionTitle: 'Inferencia: MLE, MAP y Bayes',
    positionAfterHeading: 'Inferencia: MLE, MAP y Bayes',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué interpretación tiene el parámetro de regularización λ en L2 regularization desde la perspectiva Bayesiana?',
    options: [
      { label: 'A', text: 'Es la tasa de aprendizaje del optimizador' },
      { label: 'B', text: 'Es inversamente proporcional a la varianza del prior Gaussiano: λ = 1/(2τ²), donde un prior más estrecho (τ² pequeño) implica mayor regularización' },
      { label: 'C', text: 'Es la entropía del posterior' },
      { label: 'D', text: 'Es el número de epochs necesarios para convergencia' },
    ],
    correctAnswer: 'B',
    explanation:
      'MAP con prior θ ~ N(0, τ²I) produce el objetivo: argmin[-log P(D|θ) + ||θ||²/(2τ²)]. Identificando λ = 1/(2τ²), vemos que weight decay con λ grande equivale a un prior Gaussiano estrecho: "creo firmemente que los parámetros deberían estar cerca de cero". λ pequeño = prior ancho = poca regularización. Esta correspondencia es exacta, no una analogía.',
  },
  {
    sectionTitle: 'Inferencia: MLE, MAP y Bayes',
    positionAfterHeading: 'Inferencia: MLE, MAP y Bayes',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'El estimador MLE de la varianza de una Gaussiana, σ²_MLE = (1/n)Σ(xᵢ - x̄)², es un estimador sesgado que subestima la varianza verdadera.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'σ²_MLE usa 1/n en el denominador, pero la varianza verdadera se estima sin sesgo con 1/(n-1) (corrección de Bessel). El sesgo es -σ²/n, que significa que MLE subestima la varianza por un factor (n-1)/n. Para n grande, la diferencia es despreciable, pero para muestras pequeñas puede ser significativo. Esto ilustra que MLE no siempre produce estimadores insesgados — la eficiencia asintótica de MLE no implica que sea perfecto en muestras finitas.',
  },
  {
    sectionTitle: 'Inferencia: MLE, MAP y Bayes',
    positionAfterHeading: 'Inferencia: MLE, MAP y Bayes',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Cuál es la diferencia fundamental entre MAP y Bayesian inference completa, y por qué la segunda rara vez se usa en deep learning?',
    options: [
      { label: 'A', text: 'No hay diferencia — MAP es la forma completa de Bayes' },
      { label: 'B', text: 'MAP retorna un solo punto θ* (el modo del posterior), mientras que Bayes completo retorna toda la distribución P(θ|D), lo que permite cuantificar incertidumbre pero requiere integrar sobre el espacio de parámetros — intratable para millones de parámetros' },
      { label: 'C', text: 'Bayes completo es más rápido que MAP porque evita la regularización' },
      { label: 'D', text: 'MAP requiere un prior pero Bayes completo no' },
    ],
    correctAnswer: 'B',
    explanation:
      'MAP produce θ_MAP = argmax P(θ|D) — un único valor. Bayesian inference computa toda P(θ|D), permitiendo: (1) intervalos de confianza sobre predicciones, (2) predictive distribution que marginaliza sobre θ, (3) model comparison via P(D). Pero P(θ|D) requiere calcular P(D) = ∫P(D|θ)P(θ)dθ, una integral de dimensionalidad igual al número de parámetros. Para una red con 100M parámetros, esto es intratable. Se usan aproximaciones: variational inference, MCMC, MC-Dropout.',
    justificationHint:
      'Si tienes un modelo con d parámetros, la integral para P(D) es de dimensión d. ¿Cuántos puntos necesitarías en una cuadratura numérica para cubrir un cubo d-dimensional con 10 puntos por dimensión?',
  },

  // ── Section 3: Entropía, KL Divergence y Cross-Entropy ─────────────────

  {
    sectionTitle: 'Entropía, KL Divergence y Cross-Entropy',
    positionAfterHeading: 'Entropía, KL Divergence y Cross-Entropy',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué minimizar cross-entropy H(p, q) respecto a q es equivalente a minimizar la divergencia KL D_KL(p || q)?',
    options: [
      { label: 'A', text: 'Porque cross-entropy y KL son la misma fórmula con diferente nombre' },
      { label: 'B', text: 'Porque H(p, q) = H(p) + D_KL(p || q), y H(p) es constante respecto a q (solo depende de los datos), así que minimizar H(p,q) = minimizar D_KL(p||q)' },
      { label: 'C', text: 'Porque ambas miden distancia euclidiana entre distribuciones' },
      { label: 'D', text: 'Solo es equivalente para distribuciones Gaussianas, no en general' },
    ],
    correctAnswer: 'B',
    explanation:
      'La descomposición H(p, q) = H(p) + D_KL(p||q) es fundamental. H(p) = -Σ p(x)log p(x) solo depende de la distribución real p (los datos), no de q (el modelo). Por tanto, ∂H(p,q)/∂q = ∂D_KL(p||q)/∂q. En la práctica, esto significa que el gradiente de cross-entropy loss es idéntico al gradiente de KL divergence, y ambos empujan al modelo q hacia la distribución real p.',
    justificationHint:
      'Escribe explícitamente H(p,q) - H(p) y simplifica. ¿Qué obtienes?',
  },
  {
    sectionTitle: 'Entropía, KL Divergence y Cross-Entropy',
    positionAfterHeading: 'Entropía, KL Divergence y Cross-Entropy',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La divergencia KL puede ser infinita: si p(x) > 0 pero q(x) = 0 para algún x, entonces D_KL(p||q) = ∞.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'D_KL(p||q) = Σ p(x) log(p(x)/q(x)). Si q(x) = 0 donde p(x) > 0, el término log(p(x)/0) → ∞ con peso positivo p(x). Esto tiene implicaciones prácticas: el modelo q debe asignar probabilidad no nula a todo evento posible según p. Es una razón fundamental para: (1) usar label smoothing en clasificación, (2) agregar suavizado de Laplace en modelos de n-gramas, (3) evitar softmax con logits extremos.',
  },
  {
    sectionTitle: 'Entropía, KL Divergence y Cross-Entropy',
    positionAfterHeading: 'Entropía, KL Divergence y Cross-Entropy',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué mide la perplexity de un language model y cómo se relaciona con la cross-entropy?',
    options: [
      { label: 'A', text: 'La perplexity mide la velocidad de generación de tokens por segundo' },
      { label: 'B', text: 'PPL = exp(H(p,q)) — es la exponencial de la cross-entropy y representa cuántas opciones "equiprobables" considera el modelo en promedio por token' },
      { label: 'C', text: 'La perplexity es el número de parámetros del modelo dividido por el tamaño del vocabulario' },
      { label: 'D', text: 'La perplexity solo aplica a modelos de traducción, no a language models generales' },
    ],
    correctAnswer: 'B',
    explanation:
      'Perplexity = exp(-(1/T)Σ log q(xₜ|x<t)) = exp(H(p,q)). Una PPL de 20 significa que el modelo está "tan confundido" como si eligiera uniformemente entre 20 tokens en cada paso. PPL más baja = mejor modelo. Para GPT-4: PPL ~10-15 en texto general. Un modelo que asigna probabilidad uniforme sobre un vocabulario de 50K tokens tendría PPL = 50,000. La cross-entropy en nats se convierte a PPL con exp(); en bits con 2^.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching p0-cs229-probability section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'p0-cs229-probability')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for p0-cs229-probability. Seed sections first.');
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

  console.log('\nCleared existing quizzes for p0-cs229-probability sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for p0-cs229-probability`);
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
