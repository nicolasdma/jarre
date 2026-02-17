'use client';

import { useState } from 'react';

interface LessonGuideProps {
  onSetSurface: (surface: string) => void;
  onSetOptimizer: (optimizer: string) => void;
  onSetLearningRate: (lr: number) => void;
  onRunAll: () => void;
  onReset: () => void;
}

interface LessonStep {
  title: string;
  theory: string;
  action: string;
  observe: string;
}

const LESSONS: LessonStep[] = [
  {
    title: '1. El gradiente: la dirección de máximo ascenso',
    theory: `El gradiente de una funcion en un punto es un vector que apunta en la direccion donde la funcion crece mas rapido. Su magnitud indica que tan empinada es la pendiente.

Para minimizar (como en training de redes neuronales), vamos en la direccion OPUESTA al gradiente: θ = θ - α∇L(θ). Cada paso nos mueve un poco hacia abajo en la superficie de loss.

El contour plot muestra lineas de nivel: puntos con el mismo valor de loss. El gradiente siempre es perpendicular a estas lineas.`,
    action: 'Probar con bowl convexo',
    observe:
      'En la superficie convexa, el gradiente siempre apunta hacia el minimo global. Cada paso se acerca al centro. No hay minimos locales donde quedarse atrapado.',
  },
  {
    title: '2. Learning rate: muy grande diverge, muy pequeño no avanza',
    theory: `El learning rate α controla el tamano de cada paso. Es el hiperparametro mas importante en deep learning.

Si α es muy grande, los pasos "saltan" sobre el minimo y pueden divergir. Si α es muy pequeno, converge pero puede tardar miles de pasos. El valor optimo depende de la curvatura local del loss landscape.

En la practica, se usan schedulers que reducen α durante el entrenamiento: empezar agresivo para explorar, terminar fino para converger.`,
    action: 'Probar con Rosenbrock',
    observe:
      'Cambia el learning rate y observa: con valores altos el optimizador oscila salvajemente. Con valores muy bajos, apenas se mueve. El valley estrecho de Rosenbrock es un stress test clasico.',
  },
  {
    title: '3. Momentum: acumular velocidad para escapar valles',
    theory: `Momentum acumula un promedio exponencial de gradientes pasados: v = βv + ∇L, θ = θ - αv. Es como una bola rodando cuesta abajo que acumula inercia.

Ventajas: atraviesa valles estrechos mas rapido (el momentum en la direccion del valle se acumula, las oscilaciones perpendiculares se cancelan). Puede escapar minimos locales poco profundos.

El parametro β (tipicamente 0.9) controla cuanta "memoria" tiene. β=0 es SGD puro, β=0.99 tiene mucha inercia.`,
    action: 'Comparar optimizadores',
    observe:
      'Mira como Momentum "rueda" por el valle mientras SGD zigzaguea. En el saddle point, Momentum escapa mas rapido gracias a la velocidad acumulada.',
  },
  {
    title: '4. Adam: learning rates adaptativos por parámetro',
    theory: `Adam combina momentum con learning rates adaptativos. Mantiene dos estadisticas por parametro: el primer momento (media del gradiente) y el segundo momento (media del gradiente al cuadrado).

La actualizacion es: θ = θ - α * m / (√v + ε). Los parametros con gradientes grandes reciben updates mas pequenos. Los parametros con gradientes raros reciben updates mas grandes.

Adam funciona bien "out of the box" con α=0.001. Es el optimizador por defecto en la mayoria de frameworks de deep learning.`,
    action: 'Probar con saddle point',
    observe:
      'Adam adapta su learning rate por direccion. En el saddle point, acelera en la direccion de descenso y frena en la direccion plana. Compara la velocidad de escape vs SGD.',
  },
  {
    title: '5. Loss landscapes reales: por qué SGD funciona',
    theory: `Los loss landscapes de redes neuronales profundas tienen millones de dimensiones. Resulta que los minimos locales en alta dimension tienden a tener loss similar al global.

Los saddle points son el verdadero problema: puntos donde algunas direcciones bajan y otras suben. En alta dimension, son exponencialmente mas comunes que los minimos locales.

SGD con minibatches tiene ruido que actua como regularizador: el ruido del gradiente estocastico ayuda a escapar minimos locales agudos (que generalizan mal) y a encontrar minimos "planos" (que generalizan bien).`,
    action: 'Probar con Rastrigin',
    observe:
      'Rastrigin tiene muchos minimos locales. Observa como diferentes optimizadores se quedan atrapados en diferentes puntos. En redes reales, el ruido de SGD ayuda a escapar.',
  },
];

export function LessonGuide({ onSetSurface, onSetOptimizer, onSetLearningRate, onRunAll, onReset }: LessonGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleAction = () => {
    switch (currentStep) {
      case 0:
        onSetSurface('bowl');
        onSetOptimizer('sgd');
        onSetLearningRate(0.05);
        break;
      case 1:
        onSetSurface('rosenbrock');
        onSetOptimizer('sgd');
        onSetLearningRate(0.001);
        break;
      case 2:
        onSetSurface('rosenbrock');
        onRunAll();
        break;
      case 3:
        onSetSurface('saddle');
        onRunAll();
        break;
      case 4:
        onSetSurface('rastrigin');
        onRunAll();
        break;
    }
  };

  return (
    <div className="h-full flex flex-col px-5 py-4">
      {/* Step indicator */}
      <div className="flex gap-1 mb-4">
        {LESSONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-1 flex-1 transition-colors ${
              i === currentStep ? 'bg-[#b45309]' : i < currentStep ? 'bg-[#fbbf24]' : 'bg-j-border'
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

        <div className="border-l-2 border-[#b45309] pl-4 py-1">
          <p className="font-mono text-[10px] tracking-wider text-[#b45309] uppercase mb-1">Observa</p>
          <p className="text-xs text-j-text-secondary">{LESSONS[currentStep].observe}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleAction}
          className="w-full py-2 bg-[#b45309] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#92400e] transition-colors"
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
