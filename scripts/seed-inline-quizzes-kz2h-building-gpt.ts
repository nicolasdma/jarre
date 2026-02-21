/**
 * Seed inline quizzes for kz2h-building-gpt (Karpathy: Building GPT from scratch).
 *
 * 27 quizzes across 9 sections (mc, tf, mc2 mix).
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-kz2h-building-gpt.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'kz2h-building-gpt';

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
  // ────────────────────────────────────────────────
  // Section 0: El Problema del Contexto
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'El Problema del Contexto',
    positionAfterHeading: 'El Problema del Contexto',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el problema fundamental de las RNNs que el mecanismo de atención resuelve?',
    options: [
      { label: 'A', text: 'Las RNNs usan demasiada memoria GPU' },
      { label: 'B', text: 'Las RNNs procesan secuencialmente, creando un cuello de botella donde la información lejana se degrada' },
      { label: 'C', text: 'Las RNNs no pueden procesar texto, solo números' },
      { label: 'D', text: 'Las RNNs requieren más parámetros que un Transformer' },
    ],
    correctAnswer: 'B',
    explanation: 'Las RNNs procesan token por token secuencialmente. La información del principio debe pasar por todos los pasos intermedios, degradándose. Atención permite que cualquier token "mire" directamente a cualquier otro, sin importar la distancia.',
  },
  {
    sectionTitle: 'El Problema del Contexto',
    positionAfterHeading: 'El Problema del Contexto',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Una ventaja clave del mecanismo de atención sobre las RNNs es que permite procesar todos los tokens en paralelo, en lugar de uno por uno.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Las RNNs son inherentemente secuenciales: el paso t depende del paso t-1. La atención calcula las relaciones entre todos los pares de tokens simultáneamente, permitiendo paralelización masiva en GPUs.',
  },
  {
    sectionTitle: 'El Problema del Contexto',
    positionAfterHeading: 'El Problema del Contexto',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de los siguientes son problemas reales del procesamiento secuencial en RNNs?',
    options: [
      { label: 'A', text: 'La información de tokens lejanos se diluye al pasar por muchos pasos (vanishing gradient)' },
      { label: 'B', text: 'No se puede paralelizar el entrenamiento porque cada paso depende del anterior' },
      { label: 'C', text: 'Las RNNs no pueden aprender relaciones entre palabras' },
      { label: 'D', text: 'El contexto debe comprimirse en un vector de tamaño fijo (bottleneck)' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Las RNNs sí aprenden relaciones, pero con limitaciones de distancia y paralelismo.',
    explanation: 'Las RNNs sufren de vanishing gradients (A), no se paralelizan (B), y comprimen todo el contexto en un hidden state de tamaño fijo (D). Sí pueden aprender relaciones entre palabras, pero con dificultad a larga distancia.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Q, K, V — Query, Key, Value
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Q, K, V — Query, Key, Value',
    positionAfterHeading: 'Q, K, V — Query, Key, Value',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En la analogía del diccionario, ¿qué rol cumple cada componente Q, K, V?',
    options: [
      { label: 'A', text: 'Q es la pregunta que haces, K es la etiqueta de cada entrada, V es el contenido de esa entrada' },
      { label: 'B', text: 'Q es el contenido, K es la pregunta, V es la etiqueta' },
      { label: 'C', text: 'Q, K y V son tres copias idénticas del mismo embedding' },
      { label: 'D', text: 'Q selecciona posiciones, K filtra por longitud, V contiene el texto original' },
    ],
    correctAnswer: 'A',
    explanation: 'Query = "¿qué busco?", Key = "¿qué ofrezco?", Value = "esto es lo que tengo". El dot product Q·K mide compatibilidad entre la pregunta y cada etiqueta, y luego se usa como peso para promediar los Values.',
  },
  {
    sectionTitle: 'Q, K, V — Query, Key, Value',
    positionAfterHeading: 'Q, K, V — Query, Key, Value',
    sortOrder: 1,
    format: 'tf',
    questionText: 'El producto punto (dot product) entre Q y K mide qué tan relevante es un token para otro: a mayor producto punto, mayor atención.',
    options: null,
    correctAnswer: 'true',
    explanation: 'El dot product Q·Kᵀ produce un score de compatibilidad. Vectores que apuntan en la misma dirección producen un score alto, indicando que ese Key es relevante para esa Query. Luego softmax convierte estos scores en pesos.',
  },
  {
    sectionTitle: 'Q, K, V — Query, Key, Value',
    positionAfterHeading: 'Q, K, V — Query, Key, Value',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Por qué Q, K y V se obtienen mediante matrices de proyección aprendidas (Wq, Wk, Wv) en vez de usar el embedding directamente?',
    options: [
      { label: 'A', text: 'Para reducir la dimensionalidad y ahorrar memoria' },
      { label: 'B', text: 'Porque las matrices de proyección permiten al modelo aprender QUÉ aspectos del embedding son relevantes para buscar, ofrecer y entregar' },
      { label: 'C', text: 'Es solo una convención, funcionaría igual sin las proyecciones' },
      { label: 'D', text: 'Para normalizar los valores entre -1 y 1' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin proyecciones, el modelo usaría la misma representación para preguntar y para responder. Las matrices Wq, Wk, Wv permiten transformar el embedding en tres "perspectivas" distintas optimizadas para cada rol.',
  },

  // ────────────────────────────────────────────────
  // Section 2: Softmax — Convertir Scores en Porcentajes
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Softmax — Convertir Scores en Porcentajes',
    positionAfterHeading: 'Softmax — Convertir Scores en Porcentajes',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué softmax usa e^x (exponencial) en vez de simplemente dividir cada score por la suma total?',
    options: [
      { label: 'A', text: 'Porque e^x es más rápido de calcular en GPUs' },
      { label: 'B', text: 'Porque e^x convierte valores negativos en positivos y amplifica las diferencias, haciendo que los scores altos dominen' },
      { label: 'C', text: 'Porque e^x normaliza los valores entre 0 y 1 automáticamente' },
      { label: 'D', text: 'No hay razón particular, cualquier función serviría' },
    ],
    correctAnswer: 'B',
    explanation: 'e^x siempre es positivo (resuelve valores negativos) y es creciente exponencialmente (amplifica diferencias). Un score de 5 vs 3 se convierte en 148.4 vs 20.1, permitiendo que el modelo "enfoque" su atención en los tokens más relevantes.',
  },
  {
    sectionTitle: 'Softmax — Convertir Scores en Porcentajes',
    positionAfterHeading: 'Softmax — Convertir Scores en Porcentajes',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Se divide por √d_k antes de softmax para evitar que los scores sean demasiado grandes, lo cual haría que softmax produzca distribuciones casi one-hot con gradientes cercanos a cero.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Sin escalar por √d_k, los productos punto crecen con la dimensionalidad. Scores muy grandes → softmax produce ~1 para el máximo y ~0 para el resto → gradientes casi nulos → el modelo no aprende. La división por √d_k mantiene la varianza controlada.',
  },
  {
    sectionTitle: 'Softmax — Convertir Scores en Porcentajes',
    positionAfterHeading: 'Softmax — Convertir Scores en Porcentajes',
    sortOrder: 2,
    format: 'mc',
    questionText: 'Si los scores de atención (antes de softmax) para un token son [2, 1, 0], ¿cuál es aproximadamente la distribución resultante?',
    options: [
      { label: 'A', text: '[0.33, 0.33, 0.33] — distribución uniforme' },
      { label: 'B', text: '[0.67, 0.24, 0.09] — el score más alto recibe más peso pero no todo' },
      { label: 'C', text: '[1.0, 0.0, 0.0] — toda la atención al score más alto' },
      { label: 'D', text: '[0.5, 0.3, 0.2] — proporcional a los scores originales' },
    ],
    correctAnswer: 'B',
    explanation: 'softmax([2,1,0]) = [e²/(e²+e¹+e⁰), e¹/..., e⁰/...] ≈ [7.39/10.10, 2.72/10.10, 1/10.10] ≈ [0.67, 0.24, 0.09]. Los scores se amplifican pero no se eliminan: mantiene una distribución suave.',
  },

  // ────────────────────────────────────────────────
  // Section 3: El Promedio Ponderado
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'El Promedio Ponderado',
    positionAfterHeading: 'El Promedio Ponderado',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué produce el promedio ponderado de los Values usando los pesos de atención?',
    options: [
      { label: 'A', text: 'Un nuevo embedding que es copia exacta del token con mayor atención' },
      { label: 'B', text: 'Un nuevo embedding que mezcla la información de todos los tokens, ponderada por su relevancia' },
      { label: 'C', text: 'Un escalar que indica la importancia del token actual' },
      { label: 'D', text: 'Una matriz de atención que se pasa a la siguiente capa' },
    ],
    correctAnswer: 'B',
    explanation: 'El resultado es una combinación lineal de todos los Values, donde los pesos vienen de softmax(QKᵀ/√d_k). Cada token obtiene un nuevo embedding "enriquecido" con contexto de los tokens relevantes.',
  },
  {
    sectionTitle: 'El Promedio Ponderado',
    positionAfterHeading: 'El Promedio Ponderado',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En self-attention, todos los tokens de la secuencia se procesan simultáneamente en una sola operación matricial, no uno por uno.',
    options: null,
    correctAnswer: 'true',
    explanation: 'La fórmula Attention(Q,K,V) = softmax(QKᵀ/√d_k)V es una multiplicación de matrices. Todos los tokens computan sus queries, keys y values en paralelo, y todas las interacciones se calculan de golpe.',
  },
  {
    sectionTitle: 'El Promedio Ponderado',
    positionAfterHeading: 'El Promedio Ponderado',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Qué significa "mezclar contexto" en el mecanismo de atención?',
    options: [
      { label: 'A', text: 'Concatenar los embeddings de todos los tokens en un solo vector largo' },
      { label: 'B', text: 'Reemplazar el embedding de cada token por el promedio simple de todos los embeddings' },
      { label: 'C', text: 'Que la representación de cada token incorpora información de otros tokens según su relevancia' },
      { label: 'D', text: 'Que todos los tokens terminan con la misma representación' },
    ],
    correctAnswer: 'C',
    explanation: 'Cada token obtiene una nueva representación que es una mezcla ponderada de los Values de todos los tokens. "El gato se sentó en la alfombra" — la representación de "sentó" incorpora información de "gato" (quién se sentó) y "alfombra" (dónde).',
  },

  // ────────────────────────────────────────────────
  // Section 4: Multi-Head Attention
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué usar múltiples cabezas de atención en vez de una sola grande?',
    options: [
      { label: 'A', text: 'Para usar menos memoria total' },
      { label: 'B', text: 'Porque cada cabeza puede aprender a atender a diferentes tipos de relaciones (sintáctica, semántica, posicional, etc.)' },
      { label: 'C', text: 'Porque una sola cabeza no puede calcular softmax correctamente' },
      { label: 'D', text: 'Para que el modelo sea más lento pero más preciso' },
    ],
    correctAnswer: 'B',
    explanation: 'Una cabeza podría enfocarse en relaciones sujeto-verbo, otra en adjetivo-sustantivo, otra en correferencias. Múltiples cabezas permiten al modelo capturar diferentes tipos de dependencias simultáneamente.',
  },
  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 1,
    format: 'tf',
    questionText: '8 cabezas de 64 dimensiones cada una usan la misma cantidad de parámetros que 1 cabeza de 512 dimensiones.',
    options: null,
    correctAnswer: 'true',
    explanation: '8 × 64 = 512. El costo computacional total es el mismo, pero las 8 cabezas pueden especializarse en diferentes patrones de atención. Es "dividir para conquistar" aplicado a la atención.',
  },
  {
    sectionTitle: 'Multi-Head Attention',
    positionAfterHeading: 'Multi-Head Attention',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Qué sucede con las salidas de las múltiples cabezas de atención?',
    options: [
      { label: 'A', text: 'Se promedian para obtener un solo vector' },
      { label: 'B', text: 'Se concatenan y luego se pasan por una proyección lineal (Wo) para volver a la dimensión original' },
      { label: 'C', text: 'Se suman elemento a elemento' },
      { label: 'D', text: 'Se selecciona la cabeza con mayor score y se descartan las demás' },
    ],
    correctAnswer: 'B',
    explanation: 'Las salidas de cada cabeza (cada una de dim d_k) se concatenan en un vector de dim d_model, y luego una matriz Wo proyecta este vector a la dimensión final. Esto permite combinar lo aprendido por cada cabeza.',
  },

  // ────────────────────────────────────────────────
  // Section 5: Positional Encoding — El Orden Importa
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Positional Encoding — El Orden Importa',
    positionAfterHeading: 'Positional Encoding — El Orden Importa',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué el Transformer necesita positional encoding si las RNNs no lo necesitan?',
    options: [
      { label: 'A', text: 'Porque el Transformer procesa todos los tokens simultáneamente y no tiene noción inherente de orden' },
      { label: 'B', text: 'Porque los embeddings del Transformer son más pequeños que los de RNNs' },
      { label: 'C', text: 'Las RNNs también necesitan positional encoding, pero se agrega internamente' },
      { label: 'D', text: 'Para que el modelo distinga entre mayúsculas y minúsculas' },
    ],
    correctAnswer: 'A',
    explanation: 'Las RNNs procesan secuencialmente, así que la posición está implícita en el orden de procesamiento. El Transformer ve todos los tokens de golpe — sin positional encoding, "gato come pez" y "pez come gato" serían idénticos.',
  },
  {
    sectionTitle: 'Positional Encoding — El Orden Importa',
    positionAfterHeading: 'Positional Encoding — El Orden Importa',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Sin positional encoding, el Transformer trataría "el gato come pez" y "pez come el gato" como oraciones con el mismo significado.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Self-attention es una operación sobre conjuntos (set operation), no sobre secuencias. Sin información posicional, el orden de los tokens no afecta el resultado. "gato come pez" y "pez come gato" producirían la misma salida.',
  },
  {
    sectionTitle: 'Positional Encoding — El Orden Importa',
    positionAfterHeading: 'Positional Encoding — El Orden Importa',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Cuál es la diferencia entre positional encoding sinusoidal (paper original) y learned (GPT)?',
    options: [
      { label: 'A', text: 'Sinusoidal usa funciones sin/cos fijas; learned usa embeddings entrenables. En la práctica, ambos funcionan similar' },
      { label: 'B', text: 'Sinusoidal es mejor para textos largos, learned es mejor para textos cortos' },
      { label: 'C', text: 'Learned requiere menos parámetros que sinusoidal' },
      { label: 'D', text: 'Sinusoidal solo funciona con inglés, learned es multilenguaje' },
    ],
    correctAnswer: 'A',
    explanation: 'El paper original ("Attention Is All You Need") usa funciones sin/cos con diferentes frecuencias. GPT usa embeddings de posición aprendidos durante el entrenamiento. Ambos consiguen resultados comparables en la práctica.',
  },

  // ────────────────────────────────────────────────
  // Section 6: Feed-Forward — Interpretar lo Recopilado
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Feed-Forward — Interpretar lo Recopilado',
    positionAfterHeading: 'Feed-Forward — Interpretar lo Recopilado',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el propósito de la red feed-forward después de la capa de atención?',
    options: [
      { label: 'A', text: 'Mezclar información entre tokens de la secuencia' },
      { label: 'B', text: 'Procesar y transformar la información que cada token recopiló de la atención, de forma independiente por posición' },
      { label: 'C', text: 'Reducir la dimensionalidad del modelo para ahorrar memoria' },
      { label: 'D', text: 'Calcular los pesos de atención para la siguiente capa' },
    ],
    correctAnswer: 'B',
    explanation: 'La atención "recopila" información de otros tokens. La feed-forward "digiere" esa información: la transforma de forma no-lineal, aplicada independientemente a cada posición. Es donde el modelo "piensa" sobre lo que recopiló.',
  },
  {
    sectionTitle: 'Feed-Forward — Interpretar lo Recopilado',
    positionAfterHeading: 'Feed-Forward — Interpretar lo Recopilado',
    sortOrder: 1,
    format: 'tf',
    questionText: 'La red feed-forward en el Transformer expande la dimensión interna (ej: de 512 a 2048) y luego la reduce de vuelta (2048 a 512), procesando cada posición de forma independiente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'FFN(x) = W₂ · ReLU(W₁ · x + b₁) + b₂. Primero expande (512→2048) para tener más espacio de representación, aplica no-linealidad, y luego comprime (2048→512). Cada token se procesa por separado.',
  },
  {
    sectionTitle: 'Feed-Forward — Interpretar lo Recopilado',
    positionAfterHeading: 'Feed-Forward — Interpretar lo Recopilado',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Por qué la feed-forward procesa cada posición de forma independiente, sin mezclar tokens?',
    options: [
      { label: 'A', text: 'Porque la mezcla de información entre tokens ya la hizo la capa de atención' },
      { label: 'B', text: 'Porque mezclar tokens en la feed-forward causaría overfitting' },
      { label: 'C', text: 'Por limitaciones de memoria GPU' },
      { label: 'D', text: 'Porque cada token necesita una red feed-forward diferente' },
    ],
    correctAnswer: 'A',
    explanation: 'El diseño del Transformer separa las responsabilidades: atención = comunicación entre tokens, feed-forward = procesamiento individual. Cada capa de atención ya enriqueció cada posición con contexto; la FF transforma esa información enriquecida.',
  },

  // ────────────────────────────────────────────────
  // Section 7: Residual Connections y LayerNorm
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Residual Connections y LayerNorm',
    positionAfterHeading: 'Residual Connections y LayerNorm',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es la idea fundamental de una residual connection (x + F(x))?',
    options: [
      { label: 'A', text: 'Duplicar la información para que el modelo tenga más datos' },
      { label: 'B', text: 'En el peor caso, la capa puede aprender F(x) = 0 y dejar pasar la entrada sin cambios (identidad)' },
      { label: 'C', text: 'Reducir el número de parámetros del modelo' },
      { label: 'D', text: 'Normalizar los valores para que estén entre 0 y 1' },
    ],
    correctAnswer: 'B',
    explanation: 'Con x + F(x), si F(x) aprende a ser 0, la salida es simplemente x. Esto facilita entrenar redes profundas: cada capa solo necesita aprender la "diferencia" (residual) respecto a su entrada, no la transformación completa.',
  },
  {
    sectionTitle: 'Residual Connections y LayerNorm',
    positionAfterHeading: 'Residual Connections y LayerNorm',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Sin residual connections, los gradientes se degradan al pasar por muchas capas (vanishing gradient), haciendo imposible entrenar Transformers profundos.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Las residual connections crean "autopistas" para el gradiente: en backpropagation, el gradiente puede fluir directamente a través de la conexión residual sin multiplicarse por pesos intermedios. Esto resuelve el vanishing gradient en redes profundas.',
  },
  {
    sectionTitle: 'Residual Connections y LayerNorm',
    positionAfterHeading: 'Residual Connections y LayerNorm',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Qué hace LayerNorm en el Transformer?',
    options: [
      { label: 'A', text: 'Elimina las activaciones negativas, similar a ReLU' },
      { label: 'B', text: 'Normaliza las activaciones de cada token a media 0 y varianza 1, estabilizando el entrenamiento' },
      { label: 'C', text: 'Reduce la dimensionalidad de los embeddings' },
      { label: 'D', text: 'Aplica dropout para regularización' },
    ],
    correctAnswer: 'B',
    explanation: 'LayerNorm normaliza las activaciones de cada token individualmente (a diferencia de BatchNorm que normaliza por batch). Esto estabiliza los valores que fluyen por la red, evitando que exploten o se desvanezcan entre capas.',
  },

  // ────────────────────────────────────────────────
  // Section 8: El Bloque Completo y la Predicción
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'El Bloque Completo y la Predicción',
    positionAfterHeading: 'El Bloque Completo y la Predicción',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el orden correcto de operaciones dentro de un bloque Transformer (con pre-norm)?',
    options: [
      { label: 'A', text: 'Attention → FFN → LayerNorm → Residual' },
      { label: 'B', text: 'LayerNorm → Attention → Residual → LayerNorm → FFN → Residual' },
      { label: 'C', text: 'Residual → Attention → LayerNorm → FFN' },
      { label: 'D', text: 'FFN → Attention → LayerNorm → Residual' },
    ],
    correctAnswer: 'B',
    explanation: 'En pre-norm (usado por GPT): primero LayerNorm, luego atención, luego suma residual. Después otra LayerNorm, FFN, y otra suma residual. La norma va ANTES de cada sub-capa, no después.',
  },
  {
    sectionTitle: 'El Bloque Completo y la Predicción',
    positionAfterHeading: 'El Bloque Completo y la Predicción',
    sortOrder: 1,
    format: 'tf',
    questionText: 'En GPT, se apilan 6 o más bloques Transformer idénticos en secuencia, donde la salida de un bloque es la entrada del siguiente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'GPT apila múltiples bloques idénticos (6 en el paper original, 96 en GPT-3). Cada bloque refina la representación: las primeras capas capturan patrones sintácticos simples, las últimas capturan semántica y relaciones complejas.',
  },
  {
    sectionTitle: 'El Bloque Completo y la Predicción',
    positionAfterHeading: 'El Bloque Completo y la Predicción',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de los siguientes pasos ocurren para generar la predicción final del siguiente token?',
    options: [
      { label: 'A', text: 'La salida del último bloque Transformer pasa por una capa lineal que proyecta al tamaño del vocabulario' },
      { label: 'B', text: 'Se aplica softmax sobre el vocabulario completo para obtener probabilidades por token' },
      { label: 'C', text: 'Se selecciona siempre el token con la mayor probabilidad (greedy decoding)' },
      { label: 'D', text: 'Se usa solo la representación de la última posición de la secuencia para predecir' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Piensa en las estrategias de sampling: ¿siempre se elige el más probable?',
    explanation: 'La salida del último bloque se proyecta al vocabulario (A), softmax da probabilidades (B), y solo la última posición predice (D). No siempre se elige el más probable — se puede usar temperature, top-k, o nucleus sampling para variedad.',
  },
];

async function main() {
  // 1. Fetch section IDs by title
  const { data: sections, error: fetchError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', RESOURCE_ID)
    .order('sort_order');

  if (fetchError || !sections) {
    console.error('Error fetching sections:', fetchError?.message);
    process.exit(1);
  }

  const titleToId = new Map(sections.map((s) => [s.section_title, s.id]));
  console.log(`Found ${sections.length} sections for ${RESOURCE_ID}`);

  // 2. Validate all section titles match
  for (const q of QUIZZES) {
    if (!titleToId.has(q.sectionTitle)) {
      console.error(`Section title not found: "${q.sectionTitle}"`);
      console.error('Available:', [...titleToId.keys()]);
      process.exit(1);
    }
  }

  // 3. Delete existing quizzes for these sections
  const sectionIds = [...titleToId.values()];
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error deleting existing quizzes:', deleteError.message);
    process.exit(1);
  }
  console.log('Cleared existing quizzes');

  // 4. Insert quizzes
  const rows = QUIZZES.map((q) => ({
    section_id: titleToId.get(q.sectionTitle),
    position_after_heading: q.positionAfterHeading,
    sort_order: q.sortOrder,
    format: q.format,
    question_text: q.questionText,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    justification_hint: q.justificationHint ?? null,
  }));

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} inline quizzes for ${RESOURCE_ID}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
