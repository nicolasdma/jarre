'use client';

import { useState } from 'react';

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

interface LessonGuideProps {
  onChangeInput: (sentence: string) => void;
  onSelectHead: (head: number) => void;
  onToggleMultiHead: () => void;
  onTogglePositional: () => void;
  onAnimate: () => void;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Tokens y embeddings',
    theory: `Antes de que el transformer procese texto, cada palabra se convierte en un "token" y cada token se mapea a un vector de numeros (embedding). Estos vectores capturan el significado semantico: palabras similares tienen vectores cercanos. En "Attention Is All You Need", los embeddings tienen dimension 512. Aqui usamos dimensiones pequeñas para visualizar.

El embedding es la representacion numerica que la red puede manipular. Sin embeddings, el modelo no tendria forma de operar matematicamente sobre palabras.`,
    action: 'Escribe una oracion',
    observe:
      'Cada token de tu oracion aparece como una fila en la matriz de entrada. El color de cada celda representa el valor numerico del embedding.',
  },
  {
    title: '2. Query, Key, Value',
    theory: `El corazon de la atencion son tres matrices: Query (Q), Key (K), y Value (V). Cada token genera su propio Q, K y V multiplicando su embedding por matrices de pesos aprendidos (Wq, Wk, Wv).

Analogia: imagina una biblioteca. El Query es tu pregunta ("busco libros sobre X"), el Key es la etiqueta de cada libro, y el Value es el contenido del libro. Comparas tu Query contra todos los Keys para decidir que Values leer.

Formalmente: Q = X * Wq, K = X * Wk, V = X * Wv. Cada token "pregunta" (Q), "ofrece" (K), y "contiene" (V).`,
    action: 'Ver matrices Q, K, V',
    observe:
      'Observa como cada token tiene su propia fila en Q, K y V. Los valores son diferentes porque Wq, Wk, Wv son matrices distintas. Cada una extrae un "aspecto" diferente del embedding.',
  },
  {
    title: '3. Attention scores y softmax',
    theory: `Para calcular cuanta atencion un token presta a otro, multiplicamos Q por K transpuesta: score(i,j) = Q[i] dot K[j]. Esto produce una matriz de scores donde cada fila i dice "cuanto le importa al token i cada otro token j".

Luego dividimos por sqrt(dk) para estabilizar los gradientes (sin esto, los valores se vuelven muy grandes y el softmax satura). Finalmente, aplicamos softmax por fila para que los pesos sumen 1.

Attention(Q,K,V) = softmax(QK^T / sqrt(dk)) * V

El resultado es un promedio ponderado de los Values, donde los pesos dependen de la similitud entre Queries y Keys.`,
    action: 'Animar dot product',
    observe:
      'El heatmap muestra los attention weights. Colores mas intensos = mayor atencion. Observa que patrones emergen: los tokens tienden a atender a tokens relacionados semanticamente.',
  },
  {
    title: '4. Multi-head attention',
    theory: `Un solo mecanismo de atencion solo puede capturar UN tipo de relacion entre tokens. Multi-head attention resuelve esto ejecutando multiples "cabezas" de atencion en paralelo, cada una con sus propias matrices Wq, Wk, Wv.

En el paper original usan 8 cabezas con dk=64 (512/8). Cada cabeza aprende a atender a un aspecto diferente: una cabeza puede aprender relaciones sintacticas (sujeto-verbo), otra semanticas (pronombre-referente), otra posicionales (tokens cercanos).

Los outputs de todas las cabezas se concatenan y se multiplican por una matriz Wo para producir el output final.`,
    action: 'Activar multi-head',
    observe:
      'Cada cabeza tiene un patron de atencion diferente. Una puede enfocarse en tokens adyacentes, otra en tokens distantes. Los colores de cada cabeza son distintos para diferenciarlas.',
  },
  {
    title: '5. Positional encoding',
    theory: `La atencion es invariante al orden: "gato come raton" y "raton come gato" producirian los mismos attention weights sin contexto posicional. Para inyectar informacion de posicion, el paper suma un "positional encoding" al embedding de cada token.

Usan funciones sinusoidales: PE(pos,2i) = sin(pos/10000^(2i/dmodel)), PE(pos,2i+1) = cos(pos/10000^(2i/dmodel)). Diferentes frecuencias permiten que el modelo aprenda relaciones posicionales relativas.

Las posiciones cercanas tienen encodings similares, y las lejanas tienen encodings diferentes. Es como añadir un "numero de asiento" a cada token.`,
    action: 'Ver positional encoding',
    observe:
      'La visualizacion muestra las ondas sinusoidales para cada posicion. Observa como posiciones cercanas tienen patrones similares y posiciones lejanas divergen. Las dimensiones bajas oscilan rapido, las altas oscilan lento.',
  },
];

const ACCENT = '#6366f1';

const LESSON_ACTIONS: Record<
  number,
  (props: LessonGuideProps) => { label: string; handler: () => void }
> = {
  0: (p) => ({ label: 'Cambiar oracion', handler: () => p.onChangeInput('The cat sat on the mat') }),
  1: (p) => ({ label: 'Ver Q, K, V', handler: p.onAnimate }),
  2: (p) => ({ label: 'Animar dot product', handler: p.onAnimate }),
  3: (p) => ({ label: 'Activar multi-head', handler: p.onToggleMultiHead }),
  4: (p) => ({ label: 'Ver positional encoding', handler: p.onTogglePositional }),
};

export function LessonGuide(props: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = LESSONS[currentStep];
  const action = LESSON_ACTIONS[currentStep]?.(props);

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Guia
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {currentStep + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {/* Step title */}
        <h2 className="font-mono text-sm text-j-text font-medium mb-4">
          {step.title}
        </h2>

        {/* Theory */}
        <div className="mb-5">
          {step.theory.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-[13px] text-[#444] leading-relaxed mb-2 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Action button */}
        {action && (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Accion
            </p>
            <button
              onClick={action.handler}
              className="w-full text-left px-4 py-2.5 text-white font-mono text-[12px] tracking-wider transition-colors rounded"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
            >
              {action.label}
            </button>
          </div>
        )}

        {/* What to observe */}
        <div className="bg-[#eef2ff] px-4 py-3 border-l-2 border-[#6366f1] rounded-r">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
            Que observar
          </p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            {step.observe}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-j-border flex items-center justify-between shrink-0">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {LESSONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-[#6366f1]'
                  : i < currentStep
                    ? 'bg-[#c7d2fe]'
                    : 'bg-[#ddd]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentStep((s) => Math.min(LESSONS.length - 1, s + 1))
          }
          disabled={currentStep === LESSONS.length - 1}
          className="font-mono text-[11px] text-j-text-secondary hover:text-j-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
