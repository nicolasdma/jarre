'use client';

import { useState } from 'react';

interface LessonGuideProps {
  onApplyPreset: (preset: string) => void;
  onReset: () => void;
}

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  preset: string;
  observe: string;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. Transformaciones 2D: qué hace cada tipo de matriz',
    theory: `Una matriz 2x2 define una transformacion lineal: toma cada punto del plano y lo mueve a una nueva posicion. Los vectores columna de la matriz te dicen donde terminan los vectores base (1,0) y (0,1).

Rotacion preserva distancias y angulos. Escala estira o comprime a lo largo de los ejes. Shear "inclina" el espacio en una direccion. Reflexion invierte una dimension.

Cada tipo de transformacion tiene una estructura de matriz especifica. Reconocer esa estructura es clave para entender que hace un layer de neural network.`,
    action: 'Aplicar rotación 45°',
    preset: 'rotation',
    observe:
      'El cuadrado rota pero mantiene su forma y area. Los eigenvectores no son reales para rotaciones puras — no hay direccion que se preserve.',
  },
  {
    title: '2. Eigenvalores: las direcciones que no cambian',
    theory: `Un eigenvector es una direccion que la transformacion solo escala (no rota). El eigenvalor es el factor de escala. Si Av = λv, entonces v es eigenvector con eigenvalor λ.

No toda matriz tiene eigenvectores reales. Las rotaciones puras no los tienen. Las matrices de escala tienen eigenvectores a lo largo de los ejes. Las matrices simetricas siempre tienen eigenvectores ortogonales.

En deep learning, los eigenvectores de la Hessiana te dicen las direcciones de maxima y minima curvatura del loss landscape.`,
    action: 'Aplicar escala (2x, 0.5y)',
    preset: 'scale',
    observe:
      'Las flechas de eigenvectores se alinean con los ejes. El eigenvalor 2 significa "estira al doble en esa direccion", 0.5 significa "comprime a la mitad".',
  },
  {
    title: '3. Determinante: cómo cambia el área',
    theory: `El determinante de una matriz 2x2 [a,b;c,d] es ad-bc. Geometricamente, es el factor por el que cambia el area de cualquier figura.

det > 0: la orientacion se preserva. det < 0: la orientacion se invierte (como un espejo). det = 0: la transformacion colapsa el espacio a una linea o punto (la matriz no es invertible).

En redes neuronales, si un layer tiene determinante cercano a 0, esta "aplastando" la informacion. Normalizing flows necesitan det != 0 para ser invertibles.`,
    action: 'Aplicar reflexión',
    preset: 'reflection',
    observe:
      'El determinante es -1: el area se preserva pero la orientacion se invierte. La forma queda "espejada" respecto al eje x.',
  },
  {
    title: '4. SVD: descomponer cualquier transformación en rotación-escala-rotación',
    theory: `SVD dice que TODA matriz se puede descomponer como A = UΣV^T. V^T rota el espacio, Σ escala los ejes, U rota de nuevo. Es la descomposicion mas fundamental del algebra lineal.

Los valores singulares (diagonal de Σ) son siempre >= 0 y te dicen cuanto estira la transformacion en cada direccion principal. Son diferentes a los eigenvalores (que pueden ser negativos o complejos).

En NLP, SVD sobre la matriz de co-ocurrencia fue uno de los primeros metodos de embeddings (LSA). PCA es un caso especial de SVD.`,
    action: 'Aplicar shear',
    preset: 'shear',
    observe:
      'El shear no tiene ejes de escala obvios, pero SVD los encuentra: U y V^T son las rotaciones y Σ muestra los factores de estiramiento reales.',
  },
  {
    title: '5. Aplicación: un layer de neural network ES una transformación lineal',
    theory: `Un layer lineal y = Wx + b es una transformacion afin. La parte Wx es exactamente una transformacion lineal como las que estamos visualizando, seguida de una traslacion b.

La activacion no-lineal (ReLU, sigmoid, etc.) es lo que hace que una red sea mas que una sola transformacion lineal. Sin activaciones, apilar layers seria equivalente a una sola matriz.

Entender las transformaciones lineales te da intuicion sobre: que pasa en cada layer, por que la inicializacion importa (eigenvalores cercanos a 1 = gradientes estables), y por que el rank de la matriz limita la expresividad.`,
    action: 'Aplicar proyección',
    preset: 'projection',
    observe:
      'La proyeccion colapsa una dimension (det = 0, un valor singular = 0). Esto es lo que pasa cuando un layer de red neuronal tiene menos neuronas que la dimension de entrada: pierde informacion irreversiblemente.',
  },
];

export function LessonGuide({ onApplyPreset, onReset }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    onApplyPreset(LESSONS[currentStep].preset);
  };

  return (
    <div className="h-full flex flex-col px-5 py-4">
      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {LESSONS.map((lesson, i) => (
          <button
            key={lesson.title}
            onClick={() => setCurrentStep(i)}
            className={`h-1 flex-1 transition-colors ${
              i === currentStep ? 'bg-[#1e40af]' : i < currentStep ? 'bg-[#93c5fd]' : 'bg-j-border'
            }`}
          />
        ))}
      </div>

      {/* Current lesson */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <h3 className="font-mono text-sm text-j-text font-medium">
          {LESSONS[currentStep].title}
        </h3>

        <p className="text-sm text-j-text-secondary leading-relaxed whitespace-pre-line">
          {LESSONS[currentStep].theory}
        </p>

        <div className="border-l-2 border-[#1e40af] pl-4 py-1">
          <p className="font-mono text-[10px] tracking-wider text-[#1e40af] uppercase mb-1">Observa</p>
          <p className="text-xs text-j-text-secondary">{LESSONS[currentStep].observe}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleAction}
          className="w-full py-2 bg-[#1e40af] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#1e3a8a] transition-colors"
        >
          {LESSONS[currentStep].action}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1 py-2 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={onReset}
            className="py-2 px-4 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(LESSONS.length - 1, currentStep + 1))}
            disabled={currentStep === LESSONS.length - 1}
            className="flex-1 py-2 border border-j-border font-mono text-[10px] tracking-wider text-j-text-tertiary hover:text-j-text disabled:opacity-30 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
