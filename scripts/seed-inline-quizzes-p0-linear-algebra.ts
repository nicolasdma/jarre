#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for p0-linear-algebra resource sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-p0-linear-algebra.ts
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
  // ── Section 0: Vectores, Espacios Vectoriales y Bases ─────────────────

  {
    sectionTitle: 'Vectores, Espacios Vectoriales y Bases',
    positionAfterHeading: 'Vectores, Espacios Vectoriales y Bases',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'El conjunto de todos los polinomios de grado menor o igual a 3 con coeficientes reales forma un espacio vectorial. ¿Cuál es la dimensión de este espacio y por qué?',
    options: [
      { label: 'A', text: '3, porque el grado máximo es 3' },
      { label: 'B', text: '4, porque una base es {1, x, x², x³} y estos 4 elementos son linealmente independientes y generan todo el espacio' },
      { label: 'C', text: 'Infinita, porque hay infinitos polinomios posibles' },
      { label: 'D', text: '2, porque solo necesitas el coeficiente líder y el término independiente' },
    ],
    correctAnswer: 'B',
    explanation:
      'La dimensión de un espacio vectorial es el número de elementos en cualquier base. Para polinomios de grado ≤ 3, la base canónica es {1, x, x², x³}: son 4 elementos linealmente independientes (ninguno puede expresarse como combinación lineal de los otros) y cualquier polinomio ax³ + bx² + cx + d es combinación lineal de ellos. La dimensión es 4, no 3. Este error es análogo a confundir el número de features con el índice máximo en ML.',
  },
  {
    sectionTitle: 'Vectores, Espacios Vectoriales y Bases',
    positionAfterHeading: 'Vectores, Espacios Vectoriales y Bases',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Si un conjunto de vectores {v₁, v₂, v₃} en R⁴ es linealmente independiente, entonces necesariamente forma una base de R⁴.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Una base requiere dos condiciones: independencia lineal Y que los vectores generen (span) todo el espacio. Tres vectores linealmente independientes en R⁴ generan un subespacio de dimensión 3, no todo R⁴ que tiene dimensión 4. Necesitarías exactamente 4 vectores linealmente independientes para formar una base de R⁴. En ML, esto es relevante porque si tus features viven en un subespacio de dimensión menor que la dimensión del embedding, hay redundancia que PCA puede eliminar.',
  },
  {
    sectionTitle: 'Vectores, Espacios Vectoriales y Bases',
    positionAfterHeading: 'Vectores, Espacios Vectoriales y Bases',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      'Un dataset tiene 500 muestras con 768 features cada una (embeddings de un transformer). Al analizar la matriz de datos X ∈ R^{500×768}, encuentras que el rango de X es 120. ¿Qué conclusiones son correctas?',
    options: [
      { label: 'A', text: 'Los 500 vectores de datos viven realmente en un subespacio de dimensión 120 dentro de R^768, indicando alta redundancia en las features' },
      { label: 'B', text: 'Puedes reducir la dimensionalidad a 120 sin perder NINGUNA información de los datos originales' },
      { label: 'C', text: 'Los 768 features son todos necesarios porque la dimensión del espacio ambiente es 768' },
      { label: 'D', text: 'Hay exactamente 648 direcciones en el espacio de features que no contienen variación en los datos' },
    ],
    correctAnswer: '[A,B,D]',
    explanation:
      'Rango 120 significa que los datos generan un subespacio de dimensión 120. (A) es correcto: solo 120 de las 768 dimensiones contienen información real. (B) es correcto: una base de ese subespacio de dim 120 captura toda la información sin pérdida. (C) es incorrecto: que el espacio ambiente sea R^768 no implica que los datos usen las 768 dimensiones. (D) es correcto: 768 - 120 = 648 direcciones ortogonales al subespacio de datos que no aportan variación. Esta situación es extremadamente común en embeddings de transformers, donde la dimensión intrínseca es mucho menor que la dimensión del modelo.',
    justificationHint:
      'Piensa en la relación entre rango, dimensión del column space, y dimensión del null space. Si el rango es 120 en un espacio de 768 dimensiones, ¿cuántas direcciones son "desperdicio"? ¿Qué herramienta usarías para encontrar las 120 direcciones importantes?',
  },

  // ── Section 1: Matrices y Transformaciones Lineales ───────────────────

  {
    sectionTitle: 'Matrices y Transformaciones Lineales',
    positionAfterHeading: 'Matrices y Transformaciones Lineales',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'En una red neuronal, si una capa tiene una matriz de pesos W ∈ R^{256×768} con rango 200, entonces el null space de W tiene dimensión 568, lo que significa que existen 568 direcciones independientes en el input que la capa ignora completamente.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Por el rank-nullity theorem: dim(null space) + rank = número de columnas. Si W ∈ R^{256×768} tiene rango 200, entonces dim(null space) = 768 - 200 = 568. Cualquier vector en el null space es mapeado a cero por W, es decir, esa información del input se pierde completamente. En una red neuronal, esto significa que 568 direcciones linealmente independientes del espacio de entrada son invisibles para esa capa. Las no-linealidades y las capas subsecuentes pueden compensar, pero a nivel de esa transformación lineal individual, esa información se destruye.',
  },
  {
    sectionTitle: 'Matrices y Transformaciones Lineales',
    positionAfterHeading: 'Matrices y Transformaciones Lineales',
    sortOrder: 1,
    format: 'mc',
    questionText:
      'Una capa de attention en un transformer computa Q = XW_Q, K = XW_K, V = XW_V donde X ∈ R^{n×d} y W_Q, W_K, W_V ∈ R^{d×d_k}. Desde la perspectiva de álgebra lineal, ¿qué está haciendo cada multiplicación XW?',
    options: [
      { label: 'A', text: 'Rotando los vectores de input sin cambiar su magnitud' },
      { label: 'B', text: 'Proyectando cada vector de input de R^d a un subespacio de R^{d_k}, donde d_k < d, extrayendo diferentes aspectos de la representación para queries, keys y values' },
      { label: 'C', text: 'Normalizando los vectores de input para que tengan norma unitaria' },
      { label: 'D', text: 'Permutando las coordenadas de los vectores de input' },
    ],
    correctAnswer: 'B',
    explanation:
      'Cada multiplicación XW es una transformación lineal que mapea vectores de R^d a R^{d_k}. Dado que típicamente d_k = d/h (donde h es el número de heads), esto es una proyección a un subespacio de menor dimensión. W_Q aprende a extraer la "pregunta" que cada token hace, W_K extrae la "identidad" contra la que se compara, y W_V extrae el "contenido" que se transmite. Son tres proyecciones diferentes del mismo input, cada una optimizada para un rol distinto en el mecanismo de attention. La composición de estas proyecciones con softmax(QK^T/√d_k)V es lo que permite al transformer atender selectivamente a partes relevantes del input.',
  },
  {
    sectionTitle: 'Matrices y Transformaciones Lineales',
    positionAfterHeading: 'Matrices y Transformaciones Lineales',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      'Consideras una red neuronal sin funciones de activación (sin no-linealidades): solo capas lineales y = W₃(W₂(W₁x)). ¿Qué afirmaciones son correctas sobre esta red?',
    options: [
      { label: 'A', text: 'La composición W₃W₂W₁ es equivalente a una única matriz W = W₃W₂W₁, por lo que múltiples capas lineales sin activación colapsan a una sola transformación lineal' },
      { label: 'B', text: 'Agregar más capas lineales (sin activación) aumenta la capacidad expresiva de la red porque cada capa puede aprender features diferentes' },
      { label: 'C', text: 'El rango de la composición W₃W₂W₁ está acotado por el mínimo de los rangos individuales: rank(W₃W₂W₁) ≤ min(rank(W₃), rank(W₂), rank(W₁))' },
      { label: 'D', text: 'Esta es precisamente la razón por la que las funciones de activación no lineales son necesarias: sin ellas, no importa cuántas capas agregues, la red solo puede representar transformaciones lineales' },
    ],
    correctAnswer: '[A,C,D]',
    explanation:
      '(A) Correcto: la multiplicación de matrices es asociativa, así que W₃(W₂(W₁x)) = (W₃W₂W₁)x, una única transformación lineal. (B) Incorrecto: precisamente porque colapsa a una sola matriz, no ganas expresividad. (C) Correcto: el rango no puede aumentar al componer transformaciones lineales; solo puede mantenerse o disminuir. Si W₂ tiene rango 10, la composición final tiene rango ≤ 10 sin importar W₁ y W₃. (D) Correcto: las no-linealidades rompen esta propiedad de colapso y permiten que la red aprenda funciones no lineales arbitrariamente complejas (Universal Approximation Theorem).',
    justificationHint:
      'Piensa en el bottleneck: si una capa intermedia tiene dimensión de salida 10, ¿cuánta información puede pasar a través de ella máximo? Compara con un autoencoder donde el bottleneck es intencional. ¿Qué rol juega la activación ReLU o GELU en romper esta limitación?',
  },

  // ── Section 2: Geometría Analítica: Normas, Productos Internos y Proyecciones ──

  {
    sectionTitle: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    positionAfterHeading: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'En un sistema RAG, usas cosine similarity para encontrar documentos relevantes dado un query. Un colega sugiere usar distancia euclidiana (L2) en su lugar. Si todos los embeddings ya están normalizados a norma unitaria, ¿qué sucede?',
    options: [
      { label: 'A', text: 'L2 y cosine similarity darán rankings completamente diferentes porque miden cosas distintas' },
      { label: 'B', text: 'L2 será más preciso porque captura información de magnitud que cosine similarity ignora' },
      { label: 'C', text: 'Ambas métricas producirán el mismo ranking de resultados, porque para vectores unitarios ||a - b||² = 2(1 - cos(a,b)), es decir, son transformaciones monótonas una de la otra' },
      { label: 'D', text: 'Cosine similarity fallará porque no está definida para vectores unitarios' },
    ],
    correctAnswer: 'C',
    explanation:
      'Para vectores unitarios (||a|| = ||b|| = 1): ||a - b||² = ||a||² - 2a·b + ||b||² = 2 - 2a·b = 2(1 - cos(a,b)). Minimizar L2 es equivalente a maximizar cosine similarity cuando los vectores están normalizados. Esta es la razón por la que muchos sistemas de vector search normalizan embeddings antes de indexar: permite usar inner product (más rápido computacionalmente) sabiendo que es equivalente a cosine similarity. FAISS, por ejemplo, tiene índices optimizados para inner product que asumen normalización previa.',
  },
  {
    sectionTitle: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    positionAfterHeading: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      'Estás entrenando un modelo y debes elegir entre L1 y L2 regularization para los pesos. ¿Cuáles de las siguientes afirmaciones explican correctamente la diferencia geométrica entre ambas?',
    options: [
      { label: 'A', text: 'La bola unitaria de L1 es un rombo (diamante) con vértices en los ejes, mientras que la de L2 es una esfera. Los vértices del rombo están en los ejes coordenados, lo que favorece soluciones sparse' },
      { label: 'B', text: 'L2 regularization produce pesos exactamente cero con mayor frecuencia que L1 porque la esfera es más "puntiaguda"' },
      { label: 'C', text: 'La intersección del constraint set de L1 con los contornos de la loss function tiende a ocurrir en los vértices del rombo (donde algunas coordenadas son exactamente cero), produciendo feature selection automática' },
      { label: 'D', text: 'L1 y L2 producen el mismo resultado si el learning rate es suficientemente pequeño' },
    ],
    correctAnswer: '[A,C]',
    explanation:
      '(A) Correcto: geométricamente, ||w||₁ ≤ c define un rombo/diamante cuyos vértices tocan los ejes. (B) Incorrecto: es al revés — L1 produce pesos exactamente cero, no L2. La esfera de L2 es suave, sin esquinas, así que la intersección con contornos de la loss raramente cae exactamente en un eje. (C) Correcto: la intuición geométrica clave. Los contornos elípticos de la loss function tienen alta probabilidad de tocar el rombo de L1 en un vértice (donde coordenadas son cero), pero baja probabilidad de tocar la esfera de L2 en un eje. (D) Incorrecto: las geometrías son fundamentalmente diferentes sin importar el learning rate.',
    justificationHint:
      'Dibuja mentalmente los contornos de una loss cuadrática (elipses) y superpón el rombo de L1 y el círculo de L2. ¿Dónde es más probable que una elipse sea tangente al rombo vs al círculo? ¿Qué implica eso para los valores de los pesos en el punto de tangencia?',
  },
  {
    sectionTitle: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    positionAfterHeading: 'Geometría Analítica: Normas, Productos Internos y Proyecciones',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'El proceso de Gram-Schmidt toma un conjunto de vectores linealmente independientes y produce un conjunto ortonormal que genera el mismo subespacio. Si se aplica a los vectores columna de una matriz A, el resultado es la factorización QR donde Q es ortogonal y R es triangular superior.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Gram-Schmidt es exactamente el algoritmo detrás de la factorización QR. Dado un conjunto de vectores linealmente independientes {a₁, ..., aₙ}: (1) ortogonaliza iterativamente restando las proyecciones sobre los vectores ya procesados, (2) normaliza cada vector resultante. Q contiene los vectores ortonormales como columnas, y R contiene los coeficientes de las proyecciones (triangular superior porque cada vector solo se proyecta sobre los anteriores). En la práctica, se usa modified Gram-Schmidt o Householder reflections por estabilidad numérica, pero el principio es el mismo. QR es fundamental en least squares y en el algoritmo QR para calcular eigenvalores.',
  },

  // ── Section 3: Descomposición de Matrices: Determinantes, Eigenvalores y SVD ──

  {
    sectionTitle: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    positionAfterHeading: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'La matriz de covarianza de un dataset tiene eigenvalores λ₁ = 50, λ₂ = 30, λ₃ = 15, λ₄ = 4, λ₅ = 1. Si aplicas PCA reteniendo componentes que expliquen al menos el 95% de la varianza total, ¿cuántos componentes retienes?',
    options: [
      { label: 'A', text: '2 componentes (80% de varianza)' },
      { label: 'B', text: '3 componentes (95% de varianza)' },
      { label: 'C', text: '4 componentes (99% de varianza)' },
      { label: 'D', text: '5 componentes (100% de varianza)' },
    ],
    correctAnswer: 'B',
    explanation:
      'La varianza total es 50 + 30 + 15 + 4 + 1 = 100. La varianza explicada acumulada es: 1 comp = 50/100 = 50%, 2 comp = 80/100 = 80%, 3 comp = 95/100 = 95%, 4 comp = 99%. Con 3 componentes alcanzas exactamente 95%. Los eigenvalores de la matriz de covarianza representan la varianza en cada dirección principal. En la práctica, este análisis es el "scree plot" o "explained variance ratio" que usas para decidir cuántas dimensiones retener. Reducir de 5 a 3 dimensiones elimina el 5% de varianza que corresponde a ruido o información irrelevante.',
  },
  {
    sectionTitle: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    positionAfterHeading: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'SVD existe para cualquier matriz real m×n, mientras que eigendecomposition solo existe para matrices cuadradas diagonalizables. Por eso SVD es más general y aplicable en ML donde las matrices de datos casi nunca son cuadradas.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'SVD (A = UΣV^T) está garantizada para TODA matriz real m×n — es un teorema fundamental del álgebra lineal. No requiere que la matriz sea cuadrada, simétrica ni diagonalizable. En contraste, eigendecomposition (A = PDP⁻¹) requiere que A sea cuadrada y diagonalizable (que tenga n eigenvectores linealmente independientes). En ML, la matriz de datos X típicamente es m×n (m muestras, n features) con m ≠ n, así que eigendecomposition no aplica directamente a X. Sin embargo, se puede aplicar eigendecomposition a X^TX (n×n, simétrica → siempre diagonalizable) que da los mismos singular values al cuadrado.',
  },
  {
    sectionTitle: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    positionAfterHeading: 'Descomposición de Matrices: Determinantes, Eigenvalores y SVD',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      'LoRA (Low-Rank Adaptation) para fine-tuning de LLMs descompone la actualización de pesos como ΔW = BA donde B ∈ R^{d×r} y A ∈ R^{r×d} con r << d. ¿Qué propiedades de álgebra lineal fundamentan esta técnica?',
    options: [
      { label: 'A', text: 'El rango de ΔW = BA es como máximo r, lo que significa que la adaptación se restringe a un subespacio de dimensión r del espacio original de dimensión d×d' },
      { label: 'B', text: 'El Eckart-Young theorem garantiza que la mejor aproximación de rango r de una matriz (en norma de Frobenius) se obtiene truncando su SVD a los r mayores singular values' },
      { label: 'C', text: 'LoRA funciona porque los cambios necesarios para fine-tuning tienen baja dimensionalidad intrínseca: la mayoría de la información ya está en los pesos pre-entrenados' },
      { label: 'D', text: 'LoRA requiere que la matriz de pesos original W sea de rango completo para funcionar correctamente' },
    ],
    correctAnswer: '[A,B,C]',
    explanation:
      '(A) Correcto: rank(BA) ≤ min(rank(B), rank(A)) ≤ r. En lugar de actualizar d² parámetros, solo actualizas 2dr parámetros. (B) Correcto: Eckart-Young justifica teóricamente que las aproximaciones de bajo rango son óptimas. Si ΔW tiene estructura de bajo rango, LoRA puede capturarla eficientemente. (C) Correcto: la hipótesis empírica detrás de LoRA es que el "delta" necesario para adaptar un modelo pre-entrenado vive en un subespacio de baja dimensión. (D) Incorrecto: LoRA no tiene requisitos sobre el rango de W original; funciona sumando ΔW a W sin importar las propiedades de W.',
    justificationHint:
      'Piensa en los números: para un modelo con d=4096, una actualización completa de W requiere 4096² ≈ 16M parámetros. Con LoRA de rango r=16, necesitas 2×4096×16 ≈ 131K parámetros. ¿Por qué es razonable asumir que el "delta" de fine-tuning tiene baja dimensionalidad intrínseca?',
  },

  // ── Section 4: Reducción de Dimensionalidad: PCA, t-SNE y UMAP ───────

  {
    sectionTitle: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    positionAfterHeading: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      'Visualizas embeddings de un LLM usando t-SNE y observas clusters bien separados. Un colega concluye que "los clusters están lejos en el espacio original de alta dimensión". ¿Qué problemas tiene esta interpretación?',
    options: [
      { label: 'A', text: 't-SNE preserva estructura local (vecindarios) pero puede distorsionar severamente distancias globales, así que la separación entre clusters en 2D no refleja distancias reales en alta dimensión' },
      { label: 'B', text: 'El tamaño relativo de los clusters en t-SNE no es informativo: t-SNE puede expandir clusters densos y comprimir clusters dispersos' },
      { label: 'C', text: 't-SNE es determinístico, así que los clusters siempre aparecerán en la misma posición relativa' },
      { label: 'D', text: 'El hiperparámetro perplexity afecta dramáticamente la apariencia de los clusters: con perplexity bajo puedes ver clusters artificiales que no existen, y con perplexity alto los clusters reales pueden fusionarse' },
    ],
    correctAnswer: '[A,B,D]',
    explanation:
      '(A) Correcto: t-SNE usa distribuciones t-Student en el espacio de baja dimensión para preservar vecindarios locales, pero las distancias entre clusters son arbitrarias. (B) Correcto: t-SNE optimiza KL divergence entre distribuciones de probabilidad condicionales, no distancias absolutas. El tamaño visual de los clusters es un artefacto. (C) Incorrecto: t-SNE usa inicialización aleatoria y puede producir layouts diferentes en cada ejecución. La posición absoluta y relativa de clusters varía entre runs. (D) Correcto: perplexity controla el balance entre estructura local y global. Es uno de los errores más comunes en la interpretación de visualizaciones t-SNE.',
    justificationHint:
      'Ejecuta mentalmente t-SNE dos veces con el mismo dataset pero diferente random seed. ¿Obtendrías la misma imagen? Ahora varía perplexity de 5 a 50 a 200. ¿Cómo cambiaría la visualización? ¿Qué conclusiones serían robustas a estos cambios y cuáles no?',
  },
  {
    sectionTitle: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    positionAfterHeading: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    sortOrder: 1,
    format: 'mc',
    questionText:
      'PCA encuentra las direcciones de máxima varianza en los datos. Matemáticamente, el primer componente principal es el eigenvector correspondiente al mayor eigenvalue de la matriz de covarianza. ¿Por qué maximizar varianza es equivalente a minimizar el error de reconstrucción?',
    options: [
      { label: 'A', text: 'Porque la varianza y el error de reconstrucción son la misma cantidad con diferente nombre' },
      { label: 'B', text: 'Porque la varianza total es fija: varianza proyectada + error de reconstrucción = varianza total. Maximizar la varianza capturada es algebraicamente equivalente a minimizar la varianza perdida (error de reconstrucción)' },
      { label: 'C', text: 'Porque PCA usa gradient descent que minimiza ambas cantidades simultáneamente' },
      { label: 'D', text: 'No son equivalentes; PCA solo maximiza varianza y no tiene relación con reconstrucción' },
    ],
    correctAnswer: 'B',
    explanation:
      'Por el teorema de Pitágoras en espacios con producto interno: si proyectas un vector x sobre un subespacio, ||x||² = ||proj(x)||² + ||x - proj(x)||². Sumando sobre todos los datos: varianza total = varianza capturada + error de reconstrucción. Como la varianza total es una constante del dataset, maximizar la varianza capturada (objetivo de PCA) es matemáticamente equivalente a minimizar el error de reconstrucción (MSE entre datos originales y su proyección). Esta dualidad es profunda: conecta PCA con autoencoders lineales, que minimizan error de reconstrucción y convergen a las mismas direcciones principales.',
  },
  {
    sectionTitle: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    positionAfterHeading: 'Reducción de Dimensionalidad: PCA, t-SNE y UMAP',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'La manifold hypothesis — que los datos de alta dimensión realmente viven en manifolds de baja dimensión — es la justificación teórica de por qué técnicas como UMAP y autoencoders pueden encontrar representaciones compactas útiles. Si los datos llenaran uniformemente todo R^768, ninguna técnica de reducción de dimensionalidad funcionaría.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'La manifold hypothesis es fundamental para todo deep learning y reducción de dimensionalidad. Si los datos de imágenes, texto o audio realmente ocuparan uniformemente R^768, cualquier reducción dimensional perdería información significativa. La razón por la que PCA, t-SNE, UMAP y autoencoders funcionan es que los datos naturales están concentrados cerca de manifolds (superficies curvas) de dimensión mucho menor que la dimensión ambiente. Una imagen 256×256 tiene 65,536 píxeles, pero el manifold de "imágenes naturales" tiene dimensión intrínseca mucho menor. UMAP explícitamente modela esta estructura topológica del manifold, mientras que PCA asume que el manifold es lineal (un subespacio).',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching p0-linear-algebra section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'p0-linear-algebra')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for p0-linear-algebra. Seed sections first.');
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

  console.log('\nCleared existing quizzes for p0-linear-algebra sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for p0-linear-algebra`);
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
