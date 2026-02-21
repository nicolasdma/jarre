/**
 * Seed inline quizzes for kz2h-micrograd (Karpathy: Micrograd — backprop from scratch).
 *
 * 35 quizzes across 5 sections (mc, tf, mc2 mix).
 * Includes 19 original quizzes + 16 converted from text exercises.
 * Each quiz uses positionAfterHeading matching a real **Bold Heading** in the markdown.
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-kz2h-micrograd.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'kz2h-micrograd';

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
  // Section 0: Qué es ML — La Fábrica que Aprende Sola
  // 5 bold headings: El cambio de paradigma, Los ingredientes del ML,
  //   La fábrica con perillas, Micrograd y la clase Value, De micrograd a PyTorch
  // ────────────────────────────────────────────────

  // --- Original quizzes (reasigned headings) ---
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'El cambio de paradigma',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En micrograd, ¿qué estructura de datos se usa para representar la expresión matemática completa?',
    options: [
      { label: 'A', text: 'Un array de valores numéricos' },
      { label: 'B', text: 'Un DAG (grafo acíclico dirigido) donde cada nodo es un objeto Value' },
      { label: 'C', text: 'Una matriz de pesos y sesgos' },
      { label: 'D', text: 'Una lista enlazada de operaciones' },
    ],
    correctAnswer: 'B',
    explanation: 'Micrograd construye un DAG (Directed Acyclic Graph) donde cada nodo es un objeto Value que almacena un dato escalar, su gradiente, y referencias a sus hijos (los valores que lo produjeron) junto con la operación utilizada.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Micrograd y la clase Value',
    sortOrder: 0,
    format: 'tf',
    questionText: 'La derivada de una función en un punto mide la pendiente de la función en ese punto, es decir, cuánto cambia la salida cuando perturbamos la entrada una cantidad infinitesimalmente pequeña.',
    options: null,
    correctAnswer: 'true',
    explanation: 'La derivada es exactamente eso: el límite de (f(x+h) - f(x))/h cuando h→0. En micrograd, Karpathy demuestra esto numéricamente usando un h muy pequeño (ej: 0.0001) para verificar los gradientes.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'De micrograd a PyTorch',
    sortOrder: 0,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes son propiedades de la clase Value en micrograd?',
    options: [
      { label: 'A', text: 'Almacena un dato escalar (.data) y su gradiente (.grad)' },
      { label: 'B', text: 'Mantiene referencias a sus hijos (_children) para construir el grafo' },
      { label: 'C', text: 'Opera sobre tensores multidimensionales como PyTorch' },
      { label: 'D', text: 'Registra la operación (_op) que creó el nodo para saber cómo retropropagar' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Micrograd es un autograd escalar. ¿Qué información necesita cada nodo para poder hacer backprop?',
    explanation: 'Value almacena .data (escalar), .grad, _children (nodos que lo produjeron), y _op (operación usada). NO opera con tensores — es un autograd escalar, esa es la simplificación pedagógica clave.',
  },

  // --- New quizzes from text exercises ---
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'El cambio de paradigma',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Cuál describe mejor el cambio de paradigma que representa Machine Learning?',
    options: [
      { label: 'A', text: 'En lugar de usar computadoras, usamos estadística para resolver problemas' },
      { label: 'B', text: 'En lugar de programar reglas, proporcionamos datos + respuestas y el sistema encuentra las reglas' },
      { label: 'C', text: 'En lugar de usar datos, programamos reglas más complejas para cubrir todos los casos' },
      { label: 'D', text: 'En lugar de escribir software, entrenamos hardware especializado' },
    ],
    correctAnswer: 'B',
    explanation: 'El paradigma de ML invierte la ecuación: en programación tradicional escribimos reglas → salida. En ML proporcionamos datos + respuestas esperadas → el sistema descubre las reglas (parámetros) automáticamente.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'La fábrica con perillas',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En la analogía de la fábrica, ¿qué representan las "perillas"?',
    options: [
      { label: 'A', text: 'Los datos de entrada que alimentan al modelo' },
      { label: 'B', text: 'Los parámetros/pesos del modelo que se ajustan durante el entrenamiento' },
      { label: 'C', text: 'Los hiperparámetros como learning rate y número de capas' },
      { label: 'D', text: 'Las funciones de activación que transforman los datos' },
    ],
    correctAnswer: 'B',
    explanation: 'Las perillas representan los parámetros (pesos y biases) del modelo. El entrenamiento consiste en ajustar estas perillas para que la salida de la fábrica se acerque al resultado deseado.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Los ingredientes del ML',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Dada la cadena a=3, b=a*2, c=b+5, d=c*4, ¿cuál es dd/da?',
    options: [
      { label: 'A', text: '4' },
      { label: 'B', text: '6' },
      { label: 'C', text: '8' },
      { label: 'D', text: '12' },
    ],
    correctAnswer: 'C',
    explanation: 'Por chain rule: dd/dc=4, dc/db=1, db/da=2. dd/da = dd/dc × dc/db × db/da = 4 × 1 × 2 = 8. Cada eslabón de la cadena multiplica su derivada local.',
  },
  {
    sectionTitle: 'Qué es ML — La Fábrica que Aprende Sola',
    positionAfterHeading: 'Micrograd y la clase Value',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Karpathy usa escalares en micrograd en lugar de tensores porque es más eficiente computacionalmente.',
    options: null,
    correctAnswer: 'false',
    explanation: 'Falso. Micrograd usa escalares por decisión pedagógica, no por eficiencia. Los tensores son mucho más eficientes (operaciones vectorizadas en GPU). Pero los escalares permiten visualizar cada nodo del grafo y entender backpropagation paso a paso.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Value — Un Número con Memoria
  // 4 bold headings: La derivada como pregunta, Construyendo Value,
  //   El DAG, El gradiente
  // ────────────────────────────────────────────────

  // --- Original quizzes (reasigned headings) ---
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'La derivada como pregunta',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si L = f(g(x)), ¿cómo se calcula dL/dx según la chain rule?',
    options: [
      { label: 'A', text: 'dL/dx = dL/dg + dg/dx' },
      { label: 'B', text: 'dL/dx = dL/dg × dg/dx' },
      { label: 'C', text: 'dL/dx = dg/dx / dL/dg' },
      { label: 'D', text: 'dL/dx = dL/dg - dg/dx' },
    ],
    correctAnswer: 'B',
    explanation: 'La chain rule dice que la derivada de una composición de funciones es el PRODUCTO de las derivadas en cada paso. dL/dx = dL/dg × dg/dx. Esta es la operación fundamental de backpropagation.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El DAG',
    sortOrder: 0,
    format: 'tf',
    questionText: 'En backpropagation, el gradiente del nodo de salida (loss) siempre se inicializa en 1.0 antes de comenzar a propagar hacia atrás.',
    options: null,
    correctAnswer: 'true',
    explanation: 'El gradiente de la salida respecto a sí misma es siempre 1 (dL/dL = 1). Este es el "seed" que inicia la cadena de retropropagación multiplicativa a través de todo el grafo.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El gradiente',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si un nodo z = x + y, y el gradiente de la salida respecto a z es dL/dz = 4.0, ¿cuáles son dL/dx y dL/dy?',
    options: [
      { label: 'A', text: 'dL/dx = 4.0, dL/dy = 4.0' },
      { label: 'B', text: 'dL/dx = 2.0, dL/dy = 2.0' },
      { label: 'C', text: 'dL/dx = 4.0, dL/dy = 0.0' },
      { label: 'D', text: 'Depende de los valores de x e y' },
    ],
    correctAnswer: 'A',
    explanation: 'Para la suma z = x + y: dz/dx = 1 y dz/dy = 1. Aplicando chain rule: dL/dx = dL/dz × dz/dx = 4.0 × 1 = 4.0, y lo mismo para y. La suma es un "distribuidor" de gradientes.',
  },

  // --- New quizzes from text exercises ---
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Construyendo Value',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Para q = x*y + z con x=3, y=-2, z=5: ¿cuántos objetos Value existen en total en el grafo?',
    options: [
      { label: 'A', text: '3 — solo x, y, z' },
      { label: 'B', text: '4 — x, y, z, q' },
      { label: 'C', text: '5 — x, y, z, w=x*y, q=w+z' },
      { label: 'D', text: '6 — x, y, z, x*y, +, q' },
    ],
    correctAnswer: 'C',
    explanation: 'Hay 5 objetos Value: los 3 inputs (x, y, z) y 2 nodos intermedios (w = x*y y q = w+z). Cada operación crea un nuevo Value que recuerda a sus hijos y la operación que lo creó.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El gradiente',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Para q = x*y + z, ¿cuál es ∂q/∂x?',
    options: [
      { label: 'A', text: 'x = 3.0' },
      { label: 'B', text: 'y = -2.0' },
      { label: 'C', text: 'z = 5.0' },
      { label: 'D', text: '1.0' },
    ],
    correctAnswer: 'B',
    explanation: 'q = x*y + z. La derivada parcial respecto a x: ∂q/∂x = y (porque la derivada de x*y respecto a x es y, y la derivada de z respecto a x es 0). Con y=-2, ∂q/∂x = -2.0.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'Construyendo Value',
    sortOrder: 1,
    format: 'mc',
    questionText: 'La clase Value actual puede construir el grafo. ¿Qué le falta para calcular gradientes automáticamente?',
    options: [
      { label: 'A', text: 'Necesita almacenar los valores numéricos de las entradas' },
      { label: 'B', text: 'Cada operación necesita registrar cómo propagar gradientes (función _backward)' },
      { label: 'C', text: 'Necesita una GPU para hacer los cálculos' },
      { label: 'D', text: 'Necesita que el usuario calcule las derivadas manualmente' },
    ],
    correctAnswer: 'B',
    explanation: 'La clase Value ya almacena datos y construye el grafo (hijos + operación). Lo que falta es que cada operación registre una función _backward que sepa cómo propagar el gradiente a sus hijos. Eso es exactamente lo que se implementa en las secciones siguientes.',
  },
  {
    sectionTitle: 'Value — Un Número con Memoria',
    positionAfterHeading: 'El DAG',
    sortOrder: 1,
    format: 'tf',
    questionText: 'self.grad se inicializa en 0.0 porque al principio no sabemos cuánto influye cada nodo en la salida.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Correcto. Un gradiente de 0 significa "asumimos que este nodo no influye en la salida hasta que se demuestre lo contrario". Durante backpropagation, los gradientes se acumulan (+=) a medida que se descubre la influencia real de cada nodo.',
  },

  // ────────────────────────────────────────────────
  // Section 2: La Derivada Parcial — El Momento Eureka
  // 4 bold headings: PARA. QUE. ES. ESTO., La multiplicación como amplificador,
  //   La retropropagación manual, Verificación de gradientes
  // ────────────────────────────────────────────────

  // --- Original quizzes (reasigned headings) ---
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La multiplicación como amplificador',
    sortOrder: 0,
    format: 'tf',
    questionText: 'Si x aparece en la expresión como x + x, el gradiente de x es 1.0.',
    options: null,
    correctAnswer: 'false',
    explanation: 'El gradiente es 2.0, no 1.0. Cuando x contribuye por dos caminos (x + x), los gradientes se acumulan (+=). Cada camino contribuye 1.0, y 1.0 + 1.0 = 2.0.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La retropropagación manual',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué algoritmo usa micrograd para determinar el orden correcto de retropropagación?',
    options: [
      { label: 'A', text: 'BFS (breadth-first search)' },
      { label: 'B', text: 'Ordenamiento topológico del grafo, recorrido en reversa' },
      { label: 'C', text: 'DFS (depth-first search) desde las hojas hacia la raíz' },
      { label: 'D', text: 'Recorrido aleatorio del grafo' },
    ],
    correctAnswer: 'B',
    explanation: 'Micrograd construye un ordenamiento topológico del DAG y lo recorre en reversa. Esto garantiza que cuando procesamos un nodo, ya hemos calculado el gradiente de todos los nodos que dependen de él.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'Verificación de gradientes',
    sortOrder: 0,
    format: 'tf',
    questionText: 'En micrograd, cada operación (+, ×, tanh, etc.) define su propia función _backward que sabe cómo propagar el gradiente a sus hijos.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Cada operación registra una función _backward como closure. Por ejemplo, la multiplicación z = a × b registra que dL/da = b × dL/dz y dL/db = a × dL/dz. El método backward() del nodo raíz las invoca en orden topológico inverso.',
  },
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'Verificación de gradientes',
    sortOrder: 1,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes afirmaciones sobre la acumulación de gradientes son correctas?',
    options: [
      { label: 'A', text: 'Si un nodo se usa dos veces en la expresión, sus gradientes deben sumarse (+=), no sobreescribirse (=)' },
      { label: 'B', text: 'Llamar zero_grad() es necesario antes de cada backward() para evitar acumulación no deseada' },
      { label: 'C', text: 'La acumulación de gradientes es un bug que Karpathy corrige eliminando nodos duplicados' },
      { label: 'D', text: 'Cada nodo puede contribuir gradiente a sus hijos desde múltiples caminos en el grafo' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Piensa en un nodo x que aparece en x + x. ¿Cuántos caminos conectan x con la salida?',
    explanation: 'Cuando un nodo contribuye a la salida por múltiples caminos, los gradientes de cada camino deben sumarse (regla de la suma multivariable). Por eso se usa += en _backward, y zero_grad() limpia los gradientes entre iteraciones.',
  },

  // --- New quiz from text exercise ---
  {
    sectionTitle: 'La Derivada Parcial — El Momento Eureka',
    positionAfterHeading: 'La retropropagación manual',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Para L=(a+b)*c con a=1, b=2, c=-3: ¿cuál es ∂L/∂a?',
    options: [
      { label: 'A', text: 'c = -3' },
      { label: 'B', text: 'a + b = 3' },
      { label: 'C', text: '1' },
      { label: 'D', text: '-6' },
    ],
    correctAnswer: 'A',
    explanation: 'Sea d = a+b = 3, L = d*c = -9. ∂L/∂d = c = -3, ∂d/∂a = 1. Por chain rule: ∂L/∂a = ∂L/∂d × ∂d/∂a = -3 × 1 = -3 = c. La derivada de la suma "pasa" el gradiente sin modificarlo.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Backpropagation y la Chain Rule
  // 8 bold headings: Forward y backward a mano, Gradientes de la suma...,
  //   Gradientes de la multiplicación..., El training step, Backprop con tanh,
  //   El patrón _backward, El método backward(), El bug del +=
  // ────────────────────────────────────────────────

  // --- Original quizzes (reasigned headings) ---
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backprop con tanh',
    sortOrder: 0,
    format: 'tf',
    questionText: 'Un MLP con dos capas ocultas pero sin funciones de activación puede aproximar cualquier función no-lineal.',
    options: null,
    correctAnswer: 'false',
    explanation: 'Sin no-linealidades, apilar capas lineales es equivalente a una sola transformación lineal (la composición de funciones lineales es lineal). Se necesitan funciones de activación (tanh, ReLU, etc.) para que la red pueda aproximar funciones no-lineales.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Backprop con tanh',
    sortOrder: 1,
    format: 'mc',
    questionText: 'El gradiente de un peso es exactamente 0 después del backward pass. ¿Cuál es la causa más probable?',
    options: [
      { label: 'A', text: 'El peso no influye en la loss (no está conectado al output)' },
      { label: 'B', text: 'El peso está en zona de saturación de tanh (gradiente local ≈ 0)' },
      { label: 'C', text: 'Se olvidó llamar backward()' },
      { label: 'D', text: 'Todas las anteriores son posibles' },
    ],
    correctAnswer: 'D',
    explanation: 'Un gradiente de 0 puede tener múltiples causas: el peso puede no estar conectado al output, puede estar en zona de saturación de tanh (donde la derivada ≈ 0), o simplemente no se llamó backward(). Diagnosticar requiere inspeccionar el grafo y los valores intermedios.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El training step',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué operación realiza una neurona individual en micrograd?',
    options: [
      { label: 'A', text: 'Solo una suma de las entradas' },
      { label: 'B', text: 'Producto punto de pesos × entradas, más un sesgo, seguido de una función de activación (tanh)' },
      { label: 'C', text: 'Una multiplicación de matrices' },
      { label: 'D', text: 'Un promedio ponderado sin función de activación' },
    ],
    correctAnswer: 'B',
    explanation: 'Una neurona calcula: activation = tanh(Σ(wi × xi) + b). Es el producto punto de pesos con entradas, más un sesgo, pasado por una no-linealidad (tanh). Toda esta operación se construye como un subgrafo en el DAG.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El patrón _backward',
    sortOrder: 0,
    format: 'tf',
    questionText: 'Un MLP (Multi-Layer Perceptron) es simplemente una secuencia de capas donde la salida de una capa se convierte en la entrada de la siguiente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Un MLP es una pila de capas fully-connected. En micrograd, MLP se define con las dimensiones [nin, nout1, nout2, ...] y cada capa contiene neuronas que procesan la salida de la capa anterior.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El bug del +=',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Por qué es importante que la función de activación (ej: tanh) sea no-lineal?',
    options: [
      { label: 'A', text: 'Porque reduce el número de parámetros del modelo' },
      { label: 'B', text: 'Porque sin ella, apilar capas sería equivalente a una sola transformación lineal' },
      { label: 'C', text: 'Porque hace que el entrenamiento sea más rápido' },
      { label: 'D', text: 'Porque normaliza los valores entre -1 y 1' },
    ],
    correctAnswer: 'B',
    explanation: 'Sin no-linealidades, la composición de transformaciones lineales es otra transformación lineal (f(g(x)) = Ax donde A es el producto de las matrices). La no-linealidad permite al MLP aproximar funciones arbitrariamente complejas.',
  },

  // --- New quizzes from text exercises ---
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'Forward y backward a mano',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Para d = a*b + a con a=3, b=-2: ¿cuál es a.grad?',
    options: [
      { label: 'A', text: '-2 (solo por el camino a*b)' },
      { label: 'B', text: '1 (solo por el camino +a)' },
      { label: 'C', text: '0 (los caminos se cancelan)' },
      { label: 'D', text: '-1 (contribuye por dos caminos: b=-2 por a*b, y +1 por +a, total -2+1=-1)' },
    ],
    correctAnswer: 'D',
    explanation: 'a contribuye a d por dos caminos: a*b (gradiente = b = -2) y +a (gradiente = 1). Los gradientes se acumulan: a.grad = -2 + 1 = -1. Este es exactamente el bug del += que Karpathy explica.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El patrón _backward',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Cuál es la derivada de ReLU(x) para x > 0?',
    options: [
      { label: 'A', text: '1 (gradiente pasa sin cambio)' },
      { label: 'B', text: 'x (el valor de la entrada)' },
      { label: 'C', text: '0 (ReLU siempre corta el gradiente)' },
      { label: 'D', text: '1/x (inverso de la entrada)' },
    ],
    correctAnswer: 'A',
    explanation: 'ReLU(x) = max(0, x). Para x > 0, ReLU(x) = x, cuya derivada es 1. Para x < 0, ReLU(x) = 0, cuya derivada es 0. Esto hace que _backward para ReLU sea: self.grad += (out.data > 0) * out.grad.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El bug del +=',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Este training loop tiene un bug: forward → backward → update. ¿Qué falta?',
    options: [
      { label: 'A', text: 'Falta calcular la loss entre forward y backward' },
      { label: 'B', text: 'Falta inicializar los pesos antes del loop' },
      { label: 'C', text: 'Falta zero_grad() — los gradientes se acumulan entre iteraciones' },
      { label: 'D', text: 'Falta un segundo forward pass para verificar' },
    ],
    correctAnswer: 'C',
    explanation: 'Sin zero_grad(), los gradientes de cada iteración se suman a los de iteraciones anteriores (porque _backward usa +=). Esto produce actualizaciones de pesos incorrectas y comportamiento impredecible.',
  },
  {
    sectionTitle: 'Backpropagation y la Chain Rule',
    positionAfterHeading: 'El método backward()',
    sortOrder: 0,
    format: 'mc2',
    questionText: 'Para f = (a+b)*(a-b) con a=3, b=2: ¿cuáles de las siguientes afirmaciones son correctas?',
    options: [
      { label: 'A', text: 'f = 5 (el resultado del forward pass)' },
      { label: 'B', text: '∂f/∂a = 2a = 6 (derivando a²-b²)' },
      { label: 'C', text: '∂f/∂b = -2b = -4 (derivando a²-b²)' },
      { label: 'D', text: 'a contribuye por dos caminos al resultado (a+b y a-b)' },
    ],
    correctAnswer: '[A,B,C,D]',
    justificationHint: 'f = (a+b)(a-b) = a²-b². Calcula f con a=3, b=2, luego las derivadas parciales.',
    explanation: 'f = (3+2)(3-2) = 5 ✓. f = a²-b², entonces ∂f/∂a = 2a = 6 ✓, ∂f/∂b = -2b = -4 ✓. a contribuye por dos caminos (a+b y a-b), y los gradientes se acumulan ✓. Todas son correctas.',
  },

  // ────────────────────────────────────────────────
  // Section 4: De una Neurona a un MLP
  // 5 bold headings: La clase Neuron, La clase MLP,
  //   El bucle de entrenamiento, Las capas ocultas, Micrograd vs PyTorch
  // ────────────────────────────────────────────────

  // --- Original quizzes (reasigned headings) ---
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'El bucle de entrenamiento',
    sortOrder: 0,
    format: 'mc',
    questionText: 'La loss dejó de bajar después de 50 iteraciones y se estabilizó en 0.5. ¿Qué NO es una causa probable?',
    options: [
      { label: 'A', text: 'Learning rate demasiado bajo' },
      { label: 'B', text: 'Modelo con capacidad insuficiente (pocas neuronas/capas)' },
      { label: 'C', text: 'El gradiente del nodo raíz se inicializó en 1.0' },
      { label: 'D', text: 'Datos mal etiquetados' },
    ],
    correctAnswer: 'C',
    explanation: 'Inicializar el gradiente del nodo raíz (loss) en 1.0 es CORRECTO y NECESARIO — es dL/dL = 1.0, el seed que inicia backpropagation. Las otras tres opciones (lr bajo, modelo insuficiente, datos incorrectos) sí pueden causar que la loss se estanque.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Las capas ocultas',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el orden correcto de operaciones en un paso de entrenamiento (training step)?',
    options: [
      { label: 'A', text: 'backward → forward → zero_grad → update' },
      { label: 'B', text: 'forward → loss → backward → update → zero_grad' },
      { label: 'C', text: 'forward → backward → loss → update' },
      { label: 'D', text: 'zero_grad → loss → forward → backward' },
    ],
    correctAnswer: 'B',
    explanation: 'El training loop es: 1) Forward pass (calcular predicciones), 2) Calcular la loss, 3) Backward pass (calcular gradientes), 4) Actualizar parámetros (w -= lr × grad), 5) Zero grad (limpiar gradientes para la siguiente iteración).',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Micrograd vs PyTorch',
    sortOrder: 0,
    format: 'tf',
    questionText: 'Un learning rate demasiado grande puede hacer que el modelo "sobrepase" el mínimo de la loss y diverga en lugar de converger.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Si el learning rate es muy grande, los pasos de actualización son demasiado amplios y el modelo oscila alrededor del mínimo o diverge. Karpathy lo demuestra en micrograd mostrando cómo la loss sube en lugar de bajar con un lr excesivo.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'Micrograd vs PyTorch',
    sortOrder: 1,
    format: 'mc2',
    questionText: '¿Cuáles son diferencias entre micrograd y PyTorch?',
    options: [
      { label: 'A', text: 'PyTorch opera sobre tensores n-dimensionales, micrograd sobre escalares individuales' },
      { label: 'B', text: 'PyTorch tiene las mismas operaciones fundamentales de autograd (forward + backward por operación)' },
      { label: 'C', text: 'PyTorch no usa la chain rule internamente porque tiene un mecanismo diferente' },
      { label: 'D', text: 'La API de PyTorch (.backward(), .grad, .zero_grad()) es esencialmente la misma que micrograd' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Piensa en qué hace micrograd exactamente igual que PyTorch y qué difiere en escala pero no en concepto.',
    explanation: 'PyTorch es micrograd a escala: misma idea de autograd (forward/backward por op), misma API (.backward(), .grad, .zero_grad()), pero opera sobre tensores en lugar de escalares. La chain rule es exactamente el mismo mecanismo en ambos.',
  },

  // --- New quizzes from text exercises ---
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase MLP',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuántos parámetros tiene un MLP con arquitectura 5→8→8→4→1?',
    options: [
      { label: 'A', text: '129 — solo pesos sin biases' },
      { label: 'B', text: '161 — (5×8+8)+(8×8+8)+(8×4+4)+(4×1+1)' },
      { label: 'C', text: '148 — (5×8)+(8×8)+(8×4)+(4×1) + 21 biases' },
      { label: 'D', text: '200 — estimación rápida' },
    ],
    correctAnswer: 'B',
    explanation: 'Capa por capa: 5→8 = 40 pesos + 8 biases = 48. 8→8 = 64 + 8 = 72. 8→4 = 32 + 4 = 36. 4→1 = 4 + 1 = 5. Total: 48+72+36+5 = 161. Cada neurona tiene n_inputs pesos + 1 bias.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'El bucle de entrenamiento',
    sortOrder: 1,
    format: 'mc',
    questionText: 'Si eliminamos zero_grad() del training loop, ¿qué pasa?',
    options: [
      { label: 'A', text: 'Nada — zero_grad() es opcional' },
      { label: 'B', text: 'El modelo entrena más lento pero converge igual' },
      { label: 'C', text: 'Los gradientes se acumulan de iteraciones anteriores → comportamiento impredecible' },
      { label: 'D', text: 'El backward pass falla con un error' },
    ],
    correctAnswer: 'C',
    explanation: 'Sin zero_grad(), cada backward() acumula gradientes sobre los de la iteración anterior (porque _backward usa +=). Los pesos se actualizan con gradientes incorrectos que crecen continuamente, produciendo un entrenamiento caótico.',
  },
  {
    sectionTitle: 'De una Neurona a un MLP',
    positionAfterHeading: 'La clase Neuron',
    sortOrder: 0,
    format: 'mc',
    questionText: 'MLP 2→3→1, todos los pesos=0.5, biases=0, entrada [1,-2]: ¿cuál es la salida de cada neurona oculta antes de tanh?',
    options: [
      { label: 'A', text: 'Todas dan -0.5 (0.5×1 + 0.5×(-2) + 0 = -0.5)' },
      { label: 'B', text: 'Todas dan 0.5 (0.5×1 + 0.5×2 = 1.5, promedio = 0.5)' },
      { label: 'C', text: 'Todas dan 1.0 (0.5 + 0.5 = 1.0)' },
      { label: 'D', text: 'Cada una da un valor diferente porque tienen pesos independientes' },
    ],
    correctAnswer: 'A',
    explanation: 'Cada neurona oculta calcula: 0.5×1 + 0.5×(-2) + 0 = 0.5 - 1.0 = -0.5. Como todos los pesos son iguales y las entradas son las mismas para cada neurona, todas producen el mismo resultado antes de tanh.',
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

  // 5. Summary by section
  const sectionCounts = new Map<string, number>();
  for (const q of QUIZZES) {
    sectionCounts.set(q.sectionTitle, (sectionCounts.get(q.sectionTitle) ?? 0) + 1);
  }
  for (const [title, count] of sectionCounts) {
    console.log(`  ${title}: ${count} quizzes`);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
